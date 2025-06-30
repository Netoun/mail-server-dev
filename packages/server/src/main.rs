use std::{borrow::Cow, sync::Arc};
use mail_parser::{Message, MessageParser};
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
        println!("from_address: {}", from_address);
        println!("from_name: {}", from_name);
        println!("to_address: {}", to_address);
        println!("to_name: {}", to_name);

        let subject = message.subject().unwrap().to_string();
        let html = message.body_html(0).unwrap().to_string();
        let text = message.body_text(0).unwrap().to_string();
        let date = message.date().unwrap().to_rfc3339();

        let sse_mail = StoredMail {
            id: 0,
            from_address: from_address.clone(),
            from_name: from_name.to_string(),
            to_address: to_address.clone(),
            to_name: to_name.to_string(),
            subject: subject.clone(),
            html: html.clone(),
            text: text.clone(),
            date: date.clone(),
            is_read: false,
        };

        conn.execute(
            "INSERT INTO mails (from_address, from_name, to_address, to_name, subject, html, text, date, is_read) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 0)",
            [
                from_address,
                from_name.to_string(),
                to_address,
                to_name.to_string(),
                subject,
                html,
                text,
                date,
            ],
        ).unwrap();
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
            .nest_service("/", static_files)
            .layer(cors);
        let bind_addr = format!("0.0.0.0:{}", api_port);
        let listener = TcpListener::bind(&bind_addr).await.unwrap();
        println!("API REST listening on {}", listener.local_addr().unwrap());
        let _ = axum::serve(listener, app.into_make_service()).await;
    }

    async fn list_mails(self: Arc<Self>) -> impl IntoResponse {
        let conn = Connection::open(&self.db_path).unwrap();
        let mut stmt = conn.prepare("SELECT id, from_address, from_name, to_address, to_name, subject, html, text, date, is_read FROM mails ORDER BY date DESC").unwrap();
        let mails_iter = stmt
            .query_map([], |row| {
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
                })
            })
            .unwrap();

        let mails: Vec<StoredMail> = mails_iter.map(|m| m.unwrap()).collect();

        Json(mails)
    }

    async fn delete_mail(self: Arc<Self>, id: i64) -> Result<(), axum::http::StatusCode> {
        let conn = Connection::open(&self.db_path).map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
        conn.execute("DELETE FROM mails WHERE id = ?", [id]).map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
        Ok(())
    }

    async fn get_mail(self: Arc<Self>, id: i64) -> impl IntoResponse {
        let conn = Connection::open(&self.db_path).unwrap();
        let mut stmt = conn.prepare("SELECT id, from_address, from_name, to_address, to_name, subject, html, text, date, is_read FROM mails WHERE id = ?").unwrap();
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
            })
        }).unwrap();    
        conn.execute("UPDATE mails SET is_read = 1 WHERE id = ?", [id]).unwrap();
        Json(mail)
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

    let (sender, _) = broadcast::channel(100);
    let smtp_server = SmtpServer { db_path: db_path.clone(), sender: sender.clone() };
    let rest_server = Arc::new(RestServer { db_path: db_path.clone(), sender: sender.clone() });
    let smtp_fut = smtp_server.run();
    let rest_fut = rest_server.run();
    let _ = tokio::join!(smtp_fut, rest_fut);
}