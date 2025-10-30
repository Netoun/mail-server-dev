use crate::mail_handler::MailinHandler;
use crate::models::StoredMail;
use mailin_embedded::Server;
use std::net::TcpListener;
use tokio::{sync::broadcast, task};

pub struct SmtpServer {
    db_path: String,
    sender: broadcast::Sender<StoredMail>,
}

impl SmtpServer {
    pub fn new(db_path: String, sender: broadcast::Sender<StoredMail>) -> Self {
        Self { db_path, sender }
    }

    pub async fn run(&self) {
        let db_path = self.db_path.clone();
        let sender = self.sender.clone();
        let smtp_port = std::env::var("SMTP_PORT").unwrap_or_else(|_| "1025".to_string());
        task::spawn_blocking(move || {
            let handler = MailinHandler::new(db_path, sender);
            let mut server = Server::new(handler);
            let bind_addr = format!("0.0.0.0:{}", smtp_port);
            let listener = TcpListener::bind(&bind_addr).unwrap();
            server.with_name("example.com").with_tcp_listener(listener);
            println!("SMTP server listening on {}", bind_addr);
            if let Err(e) = server.serve() {
                eprintln!("Error: {}", e);
            }
        })
        .await
        .unwrap();
    }
}

