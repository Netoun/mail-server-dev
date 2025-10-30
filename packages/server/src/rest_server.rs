use crate::models::{Attachment, StoredMail};
use axum::{
    extract::{Path, Request},
    response::{Html, IntoResponse},
    routing::{delete, get},
    Json, Router,
};
use axum::response::sse::{Event, KeepAlive, Sse};
use futures_util::stream::Stream;
use std::sync::Arc;
use std::{convert::Infallible, fs};
use tokio::sync::broadcast;
use tokio::net::TcpListener;
use tower::service_fn;
use tower_http::{
    cors::{Any, CorsLayer},
    services::ServeDir,
};
use async_stream::stream as async_stream;
use rusqlite::Connection;

pub struct RestServer {
    db_path: String,
    sender: broadcast::Sender<StoredMail>,
}

impl RestServer {
    pub fn new(db_path: String, sender: broadcast::Sender<StoredMail>) -> Self {
        Self { db_path, sender }
    }

    pub async fn run(self: Arc<Self>) {
        let cors = CorsLayer::new().allow_origin(Any);
        let api_port = std::env::var("API_PORT").unwrap_or_else(|_| "1080".to_string());
        let static_path =
            std::env::var("STATIC_DIR").unwrap_or_else(|_| "/app/public".to_string());
        println!("[Static] Serving static files from: {}", static_path);

        let static_files = ServeDir::new(&static_path).not_found_service(service_fn(
            |_req: Request| async { Ok::<_, Infallible>(spa_fallback().await.into_response()) },
        ));

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
            let mut stmt = conn
                .prepare(
                    "SELECT id, from_address, from_name, to_address, to_name, subject, html, text, date, is_read FROM mails ORDER BY date DESC",
                )
                .unwrap();
            let mails_iter = stmt.query_map([], |row| {
                let mail_id = row.get::<_, i64>(0)?;
                Ok((
                    mail_id,
                    StoredMail {
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
                    },
                ))
            }).unwrap();

            let mails: Vec<StoredMail> = mails_iter.map(|m| m.unwrap().1).collect();
            mails
        })
        .await
        .unwrap();

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
            let mut stmt = conn
                .prepare(
                    "SELECT id, mail_id, filename, content_type, content_disposition, size_bytes, file_url FROM attachments WHERE mail_id = ?",
                )
                .unwrap();
            let attachments_iter = stmt.query_map([mail_id], |row| {
                Ok(Attachment {
                    id: row.get(0)?,
                    mail_id: row.get(1)?,
                    filename: row.get(2)?,
                    content_type: row.get(3)?,
                    content_disposition: row.get(4)?,
                    size_bytes: row.get(5)?,
                    file_url: row.get(6)?,
                })
            }).unwrap();

            attachments_iter.map(|a| a.unwrap()).collect()
        })
        .await
        .unwrap()
    }

    async fn delete_mail(
        self: Arc<Self>,
        id: i64,
    ) -> Result<(), axum::http::StatusCode> {
        let db_path = self.db_path.clone();
        tokio::task::spawn_blocking(move || {
            let conn = Connection::open(&db_path)
                .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
            conn.execute("DELETE FROM mails WHERE id = ?", [id])
                .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
            Ok::<(), axum::http::StatusCode>(())
        })
        .await
        .unwrap()
    }

    async fn get_mail(
        self: Arc<Self>,
        id: i64,
    ) -> Result<Json<StoredMail>, axum::http::StatusCode> {
        let db_path = self.db_path.clone();
        let mail_result = tokio::task::spawn_blocking(move || {
            let conn = Connection::open(&db_path)
                .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
            let mut stmt = conn
                .prepare(
                    "SELECT id, from_address, from_name, to_address, to_name, subject, html, text, date, is_read FROM mails WHERE id = ?",
                )
                .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
            let mail = stmt
                .query_row([id], |row| {
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
                })
                .map_err(|_| axum::http::StatusCode::NOT_FOUND)?;

            // Mark as read
            conn.execute("UPDATE mails SET is_read = 1 WHERE id = ?", [id])
                .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;
            Ok::<StoredMail, axum::http::StatusCode>(mail)
        })
        .await
        .map_err(|_| axum::http::StatusCode::INTERNAL_SERVER_ERROR)?;

        let mut mail = mail_result?;

        // Load attachments for this mail
        mail.attachments = self.load_attachments_for_mail(id).await;

        Ok(Json(mail))
    }
}

async fn spa_fallback() -> Html<String> {
    let static_path =
        std::env::var("STATIC_DIR").unwrap_or_else(|_| "/app/public".to_string());
    let index_path = format!("{}/index.html", static_path);

    match fs::read_to_string(&index_path) {
        Ok(content) => Html(content),
        Err(_) => Html(
            "<!DOCTYPE html><html><head><title>404 - Not Found</title></head><body><h1>404 - Not Found</h1><p>The requested page could not be found.</p></body></html>"
                .to_string(),
        ),
    }
}

async fn sse_events(
    sender: broadcast::Sender<StoredMail>,
) -> Sse<impl Stream<Item = Result<Event, axum::Error>>> {
    let mut rx = sender.subscribe();
    let stream = async_stream! {
        while let Ok(mail) = rx.recv().await {
            let json = serde_json::to_string(&mail).unwrap();
            yield Ok(Event::default().data(json));
        }
    };
    Sse::new(stream).keep_alive(KeepAlive::default())
}

