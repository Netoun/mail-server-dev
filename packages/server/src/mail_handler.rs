use crate::models::{Attachment, StoredMail};
use std::borrow::Cow;
use tokio::{io, sync::broadcast};
use mail_parser::{Message, MessageParser, MimeHeaders};
use mailin_embedded::{Handler, Response, response::OK};
use rusqlite::Connection;

#[derive(Clone)]
pub struct MailinHandler {
    buffer: Vec<u8>,
    db_path: String,
    sender: broadcast::Sender<StoredMail>,
}

impl MailinHandler {
    pub fn new(db_path: String, sender: broadcast::Sender<StoredMail>) -> Self {
        Self {
            buffer: Vec::new(),
            db_path,
            sender,
        }
    }
}

impl Handler for MailinHandler {
    fn data_start(
        &mut self,
        _domain: &str,
        _from: &str,
        _is8bit: bool,
        _to: &[String],
    ) -> Response {
        self.buffer.clear();
        OK
    }

    fn data(&mut self, buf: &[u8]) -> io::Result<()> {
        self.buffer.extend_from_slice(buf);
        Ok(())
    }

    fn data_end(&mut self) -> Response {
        let full_message: String = String::from_utf8_lossy(&self.buffer).to_string();
        let message: Message = MessageParser::default().parse(&full_message).unwrap();
        let conn = Connection::open(&self.db_path).unwrap();

        let from = message.from().unwrap().first().unwrap();
        let to = message.to().unwrap().first().unwrap();

        let from_address = from.address.as_ref().unwrap().to_string();
        let from_name = from.name.as_ref().unwrap_or(&Cow::Borrowed(""));
        let to_address = to.address.as_ref().unwrap().to_string();
        let to_name = to.name.as_ref().unwrap_or(&Cow::Borrowed(""));

        let subject = message.subject().unwrap().to_string();
        let html = message
            .body_html(0)
            .map(|s| s.to_string())
            .unwrap_or_else(|| String::new());
        let text = message
            .body_text(0)
            .map(|s| s.to_string())
            .unwrap_or_else(|| String::new());
        let date = message.date().unwrap().to_rfc3339();

        // Insert mail record first to get the ID
        conn.execute(
            "INSERT INTO mails (from_address, from_name, to_address, to_name, subject, html, text, date, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)",
            [
                from_address.clone(),
                from_name.to_string(),
                to_address.clone(),
                to_name.to_string(),
                subject.clone(),
                html.clone(),
                text.clone(),
                date.clone(),
            ],
        )
        .unwrap();

        let mail_id = conn.last_insert_rowid();

        // Process attachments using correct mail_parser API
        let mut stored_attachments = Vec::new();
        println!("Processing {} attachments", message.attachment_count());

        for i in 0..message.attachment_count() {
            if let Some(attachment) = message.attachment(i as u32) {
                // Extract filename from attachment body
                let filename = match &attachment.body {
                    mail_parser::PartType::Html(name) | mail_parser::PartType::Text(name) => {
                        name.to_string()
                    }
                    _ => attachment
                        .attachment_name()
                        .unwrap_or("unnamed_attachment")
                        .to_string(),
                };

                let data = attachment.contents().to_vec();
                let headers = attachment.headers();

                // Extract content type from headers
                let content_type = headers
                    .iter()
                    .find_map(|header| {
                        if let mail_parser::HeaderName::ContentType = header.name {
                            if let mail_parser::HeaderValue::ContentType(ct) = &header.value {
                                if let Some(subtype) = &ct.c_subtype {
                                    return Some(format!("{}/{}", ct.c_type, subtype));
                                } else {
                                    return Some(ct.c_type.to_string());
                                }
                            }
                        }
                        None
                    })
                    .unwrap_or_else(|| "application/octet-stream".to_string());
                let content_disposition = Some("attachment".to_string());
                let size_bytes = data.len() as i64;

                // Save file to disk with unique name
                let unique_filename = format!("{}_{}", mail_id, filename);
                let file_url = format!("/attachments/{}", unique_filename);
                let file_path = format!("./attachments/{}", unique_filename);
                std::fs::write(&file_path, &data).unwrap();

                conn.execute(
                    "INSERT INTO attachments (mail_id, filename, content_type, content_disposition, size_bytes, file_url) VALUES (?, ?, ?, ?, ?, ?)",
                    rusqlite::params![
                        mail_id,
                        filename.clone(),
                        content_type.clone(),
                        content_disposition.clone(),
                        size_bytes,
                        file_url.clone()
                    ],
                )
                .unwrap();

                let attachment_id = conn.last_insert_rowid();
                stored_attachments.push(Attachment {
                    id: attachment_id,
                    mail_id,
                    filename,
                    content_type,
                    content_disposition,
                    size_bytes,
                    file_url,
                });
            }
        }

        let sse_mail = StoredMail {
            id: mail_id,
            from_address: from_address.clone(),
            from_name: from_name.to_string(),
            to_address: to_address.clone(),
            to_name: to_name.to_string(),
            subject: subject.clone(),
            html: html.clone(),
            text: text.clone(),
            date: date.clone(),
            is_read: false,
            attachments: stored_attachments,
        };
        // Notify via SSE
        let _ = self.sender.send(sse_mail);
        OK
    }
}

