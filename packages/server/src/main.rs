use std::{borrow::Cow, sync::Arc};
use mail_parser::{Message, MessageParser, MimeHeaders};
use rusqlite::Connection;
use tokio::{io, net::TcpListener, task};
use axum::{response::IntoResponse, routing::{get, delete}, Json, Router, extract::Path};
use serde::Serialize;
use mailin_embedded::{response::OK, Handler, Response, Server};
use tower_http::cors::{CorsLayer, Any};
use axum::response::sse::{Sse, Event, KeepAlive};
use tokio::sync::broadcast;
use futures_util::stream::Stream;
use tower_http::services::ServeDir;

#[derive(Debug, Serialize, Clone)]
struct Attachment {
    id: i64,
    mail_id: i64,
    filename: String,
    content_type: String,
    content_disposition: Option<String>,
    size_bytes: i64,
    file_url: String, // Path to file on disk
}

#[derive(Debug, Serialize, Clone)]
struct StoredMail {
    id: i64,
    from_address: String,
    from_name: String,
    to_address: String,
    to_name: String,
    subject: String,
    html: String,
    text: String,
    date: String,
    is_read: bool,
    attachments: Vec<Attachment>,
}

#[derive(Clone)]
struct MailinHandler {
    buffer: Vec<u8>,
    db_path: String,
    sender: broadcast::Sender<StoredMail>,
}

impl Handler for MailinHandler {
    
    fn data_start(  &mut self,
        _domain: &str,
        _from: &str,
        _is8bit: bool,
        _to: &[String]) -> Response {
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
        let html = message.body_html(0).unwrap().to_string();
        let text = message.body_text(0).unwrap().to_string();
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
        ).unwrap();

        let mail_id = conn.last_insert_rowid();

        // Process attachments using correct mail_parser API
        let mut stored_attachments = Vec::new();
        println!("Processing {} attachments", message.attachment_count());
        
        for i in 0..message.attachment_count() {
            if let Some(attachment) = message.attachment(i as u32) {
                // Extract filename from attachment body (this worked before)
                let filename = match &attachment.body {
                    mail_parser::PartType::Html(name) | 
                    mail_parser::PartType::Text(name) => name.to_string(),
                    _ => {
                        attachment.attachment_name()
                            .unwrap_or("unnamed_attachment")
                            .to_string()
                    }
                };
                
                
                let data = attachment.contents().to_vec();
                
                let headers = attachment.headers();
                
                // Extract content type from headers
                let content_type = headers.iter()
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
                let file_path=format!("./attachments/{}", unique_filename); 
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
                ).unwrap();

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

struct SmtpServer {
    db_path: String,
    sender: broadcast::Sender<StoredMail>,
}

impl SmtpServer {
    async fn run(&self) {
        let db_path = self.db_path.clone();
        let sender = self.sender.clone();
        let smtp_port = std::env::var("SMTP_PORT").unwrap_or_else(|_| "1025".to_string());
        task::spawn_blocking(move || {
            let handler = MailinHandler { buffer: Vec::new(), db_path, sender };
            let mut server = Server::new(handler);
            let bind_addr = format!("0.0.0.0:{}", smtp_port);
            let listener = std::net::TcpListener::bind(&bind_addr).unwrap();
            server.with_name("example.com").with_tcp_listener(listener);
            println!("SMTP server listening on {}", bind_addr);
            if let Err(e) = server.serve() {
                eprintln!("Error: {}", e);
            }
        }).await.unwrap();
    }
}

struct RestServer {
    db_path: String,
    sender: broadcast::Sender<StoredMail>,
}

impl RestServer {
    async fn run(self: Arc<Self>) {
        let cors = CorsLayer::new().allow_origin(Any);
        let api_port = std::env::var("API_PORT").unwrap_or_else(|_| "1080".to_string());
        let static_path = std::env::var("STATIC_DIR").unwrap_or_else(|_| "../web/public".to_string());
        println!("[Static] Serving static files from: {}", static_path);
        let static_files = ServeDir::new(&static_path).not_found_service(ServeDir::new(format!("{}/index.html", static_path)));
        let app = Router::new()
            .route("/api/mails", get({
                let this = Arc::clone(&self);
                move || {
                    let this = Arc::clone(&this);
                    async move { this.list_mails().await }
                }
            }))
            .route("/api/mails/:id", get({
                let this = Arc::clone(&self);
                move |Path(id): Path<i64>| {
                    let this = Arc::clone(&this);
                    async move { this.get_mail(id).await }
                }
            }))
            .route("/api/mails/:id", delete({
                let this = Arc::clone(&self);
                move |Path(id): Path<i64>| {
                    let this = Arc::clone(&this);
                    async move { this.delete_mail(id).await }
                }
            }))
            .route("/api/events", get({
                let sender = self.sender.clone();
                move || sse_events(sender.clone())
            }))
            .nest_service("/api/attachments", ServeDir::new("./attachments"))
            .nest_service("/", static_files)
            .layer(cors);
        let bind_addr = format!("0.0.0.0:{}", api_port);
        let listener = TcpListener::bind(&bind_addr).await.unwrap();
        println!("API REST listening on {}", listener.local_addr().unwrap());
        let _ = axum::serve(listener, app.into_make_service()).await;
    }

    async fn list_mails(self: Arc<Self>) -> impl IntoResponse {
        let db_path = self.db_path.clone();
        let mails = tokio::task::spawn_blocking(move || {
            let conn = Connection::open(&db_path).unwrap();
            let mut stmt = conn.prepare("SELECT id, from_address, from_name, to_address, to_name, subject, html, text, date, is_read FROM mails ORDER BY date DESC").unwrap();
            let mails_iter = stmt
                .query_map([], |row| {
                    let mail_id = row.get::<_, i64>(0)?;
                    Ok((mail_id, StoredMail {
                        id: mail_id,
                        from_address: row.get(1)?,
                        from_name: row.get(2)?,
                        to_address: row.get(3)?,
                        to_name: row.get(4)?,
                        subject: row.get(5)?,
                        html: row.get(6)?,
                        text: row.get(7)?,
                        date: row.get(8)?,
                        is_read: row.get::<_, i64>(9)? != 0,
                        attachments: Vec::new(), // Will be loaded below
                    }))
                })
                .unwrap();

            let mails: Vec<StoredMail> = mails_iter.map(|m| m.unwrap().1).collect();
            mails
        }).await.unwrap();

        // Load attachments for each mail
        let mut mails_with_attachments = Vec::new();
        for mut mail in mails {
            mail.attachments = self.load_attachments_for_mail(mail.id).await;
            mails_with_attachments.push(mail);
        }

        Json(mails_with_attachments)
    }

    async fn load_attachments_for_mail(&self, mail_id: i64) -> Vec<Attachment> {
        let db_path = self.db_path.clone();
        tokio::task::spawn_blocking(move || {
            let conn = Connection::open(&db_path).unwrap();
            let mut stmt = conn.prepare("SELECT id, mail_id, filename, content_type, content_disposition, size_bytes, file_url FROM attachments WHERE mail_id = ?").unwrap();
            let attachments_iter = stmt
                .query_map([mail_id], |row| {
                    Ok(Attachment {
                        id: row.get(0)?,
                        mail_id: row.get(1)?,
                        filename: row.get(2)?,
                        content_type: row.get(3)?,
                        content_disposition: row.get(4)?,
                        size_bytes: row.get(5)?,
                        file_url: row.get(6)?,
                    })
                })
                .unwrap();

            attachments_iter.map(|a| a.unwrap()).collect()
        }).await.unwrap()
    }

    async fn delete_mail(self: Arc<Self>, id: i64) -> Result<(), axum::http::StatusCode> {
        let db_path = self.db_path.clone();
        tokio::task::spawn_blocking(move || {
            let conn = Connection::open(&db_path).map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
            conn.execute("DELETE FROM mails WHERE id = ?", [id]).map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
            Ok::<(), axum::http::StatusCode>(())
        }).await.unwrap()
    }

    async fn get_mail(self: Arc<Self>, id: i64) -> Result<Json<StoredMail>, axum::http::StatusCode> {
        let db_path = self.db_path.clone();
        let mail_result = tokio::task::spawn_blocking(move || {
            let conn = Connection::open(&db_path).map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
            let mut stmt = conn.prepare("SELECT id, from_address, from_name, to_address, to_name, subject, html, text, date, is_read FROM mails WHERE id = ?").map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
            let mail = stmt.query_row([id], |row| {
                Ok(StoredMail {
                    id: row.get(0)?,
                    from_address: row.get(1)?,
                    from_name: row.get(2)?,
                    to_address: row.get(3)?,
                    to_name: row.get(4)?,
                    subject: row.get(5)?,
                    html: row.get(6)?,
                    text: row.get(7)?,
                    date: row.get(8)?,
                    is_read: row.get::<_, i64>(9)? != 0,
                    attachments: Vec::new(), // Will be loaded below
                })
            }).map_err(|_| axum::http::StatusCode::NOT_FOUND)?;
            
            // Mark as read
            conn.execute("UPDATE mails SET is_read = 1 WHERE id = ?", [id]).map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
            Ok::<StoredMail, axum::http::StatusCode>(mail)
        }).await.map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
        
        let mut mail = mail_result?;
        
        // Load attachments for this mail
        mail.attachments = self.load_attachments_for_mail(id).await;
        
        Ok(Json(mail))
    }


}

async fn sse_events(sender: broadcast::Sender<StoredMail>) -> Sse<impl Stream<Item = Result<Event, axum::Error>>> {
    let mut rx = sender.subscribe();
    let stream = async_stream::stream! {
        while let Ok(mail) = rx.recv().await {
            let json = serde_json::to_string(&mail).unwrap();
            yield Ok(Event::default().data(json));
        }
    };
    Sse::new(stream).keep_alive(KeepAlive::default())
}

#[tokio::main]
async fn main() {
    // Init DB
    let db_path = "mails.db".to_string();
    let conn = Connection::open(&db_path).unwrap();
    conn.execute(
        "CREATE TABLE IF NOT EXISTS mails (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            from_address TEXT,
            from_name TEXT,
            to_address TEXT,
            to_name TEXT,
            subject TEXT,
            html TEXT,
            text TEXT,
            date TEXT,
            is_read INTEGER DEFAULT 0
        )",
        [],
    ).unwrap();

    // Create attachments table
    conn.execute(
        "CREATE TABLE IF NOT EXISTS attachments (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            mail_id INTEGER NOT NULL,
            filename TEXT NOT NULL,
            content_type TEXT NOT NULL,
            content_disposition TEXT,
            size_bytes INTEGER NOT NULL,
            file_url TEXT NOT NULL,
            FOREIGN KEY(mail_id) REFERENCES mails(id) ON DELETE CASCADE
        )",
        [],
    ).unwrap();

    // Create attachments storage directory
    std::fs::create_dir_all("./attachments").unwrap_or_default();

    let (sender, _) = broadcast::channel(100);
    let smtp_server = SmtpServer { db_path: db_path.clone(), sender: sender.clone() };
    let rest_server = Arc::new(RestServer { db_path: db_path.clone(), sender: sender.clone() });
    let smtp_fut = smtp_server.run();
    let rest_fut = rest_server.run();
    let _ = tokio::join!(smtp_fut, rest_fut);
}