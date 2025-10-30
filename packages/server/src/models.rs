use serde::Serialize;

#[derive(Debug, Serialize, Clone)]
pub struct Attachment {
    pub id: i64,
    pub mail_id: i64,
    pub filename: String,
    pub content_type: String,
    pub content_disposition: Option<String>,
    pub size_bytes: i64,
    pub file_url: String, // Path to file on disk
}

#[derive(Debug, Serialize, Clone)]
pub struct StoredMail {
    pub id: i64,
    pub from_address: String,
    pub from_name: String,
    pub to_address: String,
    pub to_name: String,
    pub subject: String,
    pub html: String,
    pub text: String,
    pub date: String,
    pub is_read: bool,
    pub attachments: Vec<Attachment>,
}

