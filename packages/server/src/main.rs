mod db;
mod mail_handler;
mod models;
mod rest_server;
mod smtp_server;

use db::init_db;
use rest_server::RestServer;
use smtp_server::SmtpServer;
use std::sync::Arc;
use tokio::sync::broadcast;

#[tokio::main]
async fn main() {
    // Init DB
    let db_path = "mails.db".to_string();
    init_db(&db_path).unwrap();

    // Create attachments storage directory
    std::fs::create_dir_all("./attachments").unwrap_or_default();

    let (sender, _) = broadcast::channel(100);
    let smtp_server = SmtpServer::new(db_path.clone(), sender.clone());
    let rest_server = Arc::new(RestServer::new(db_path.clone(), sender.clone()));
    let smtp_fut = smtp_server.run();
    let rest_fut = rest_server.run();
    let _ = tokio::join!(smtp_fut, rest_fut);
}

#[cfg(test)]
mod tests {
    use super::*;
    use rusqlite::Connection;
    use tempfile::TempDir;

    fn setup_test_db() -> (TempDir, String) {
        let temp_dir = TempDir::new().unwrap();
        let db_path = temp_dir.path().join("test_mails.db");
        let db_path_str = db_path.to_str().unwrap().to_string();

        init_db(&db_path_str).unwrap();

        (temp_dir, db_path_str)
    }

    #[test]
    fn test_database_creation() {
        let (_temp_dir, db_path) = setup_test_db();
        let conn = Connection::open(&db_path).unwrap();

        // Verify that tables exist
        let mut stmt = conn
            .prepare("SELECT name FROM sqlite_master WHERE type='table' AND name IN ('mails', 'attachments')")
            .unwrap();
        let tables: Vec<String> = stmt
            .query_map([], |row| Ok(row.get(0)?))
            .unwrap()
            .map(|r| r.unwrap())
            .collect();

        assert_eq!(tables.len(), 2);
        assert!(tables.contains(&"mails".to_string()));
        assert!(tables.contains(&"attachments".to_string()));
    }

    #[test]
    fn test_insert_and_retrieve_mail() {
        let (_temp_dir, db_path) = setup_test_db();
        let conn = Connection::open(&db_path).unwrap();

        conn.execute(
            "INSERT INTO mails (from_address, from_name, to_address, to_name, subject, html, text, date, is_read) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                "test@example.com",
                "Test User",
                "recipient@example.com",
                "Recipient",
                "Test Subject",
                "<html><body>Test HTML</body></html>",
                "Test text content",
                "2024-01-01T00:00:00Z",
                "0",
            ],
        )
        .unwrap();

        let mail_id = conn.last_insert_rowid();

        let mut stmt = conn
            .prepare("SELECT id, from_address, subject, is_read FROM mails WHERE id = ?")
            .unwrap();
        let (id, from_address, subject, is_read): (i64, String, String, i64) = stmt
            .query_row([mail_id], |row| {
                Ok((row.get(0)?, row.get(1)?, row.get(2)?, row.get(3)?))
            })
            .unwrap();

        assert_eq!(id, mail_id);
        assert_eq!(from_address, "test@example.com");
        assert_eq!(subject, "Test Subject");
        assert_eq!(is_read, 0);
    }

    #[test]
    fn test_delete_mail_cascade() {
        let (_temp_dir, db_path) = setup_test_db();
        let conn = Connection::open(&db_path).unwrap();

        conn.execute(
            "INSERT INTO mails (from_address, from_name, to_address, to_name, subject, html, text, date, is_read) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                "test@example.com",
                "Test",
                "recipient@example.com",
                "Recipient",
                "Subject",
                "<html>Test</html>",
                "Test",
                "2024-01-01T00:00:00Z",
                "0",
            ],
        )
        .unwrap();

        let mail_id = conn.last_insert_rowid();

        conn.execute(
            "INSERT INTO attachments (mail_id, filename, content_type, content_disposition, size_bytes, file_url) 
             VALUES (?, ?, ?, ?, ?, ?)",
            [
                mail_id.to_string(),
                "test.txt".to_string(),
                "text/plain".to_string(),
                "attachment".to_string(),
                "10".to_string(),
                "/attachments/test.txt".to_string(),
            ],
        )
        .unwrap();

        conn.execute("DELETE FROM mails WHERE id = ?", [mail_id])
            .unwrap();

        // Verify that the mail was deleted
        let count: i64 = conn
            .query_row("SELECT COUNT(*) FROM mails WHERE id = ?", [mail_id], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(count, 0);

        // Verify that the attachment was deleted in cascade
        let attachment_count: i64 = conn
            .query_row(
                "SELECT COUNT(*) FROM attachments WHERE mail_id = ?",
                [mail_id],
                |row| row.get(0),
            )
            .unwrap();
        assert_eq!(attachment_count, 0);
    }

    #[test]
    fn test_mark_mail_as_read() {
        let (_temp_dir, db_path) = setup_test_db();
        let conn = Connection::open(&db_path).unwrap();

        conn.execute(
            "INSERT INTO mails (from_address, from_name, to_address, to_name, subject, html, text, date, is_read) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                "test@example.com",
                "Test",
                "recipient@example.com",
                "Recipient",
                "Subject",
                "<html>Test</html>",
                "Test",
                "2024-01-01T00:00:00Z",
                "0",
            ],
        )
        .unwrap();

        let mail_id = conn.last_insert_rowid();

        let is_read: i64 = conn
            .query_row("SELECT is_read FROM mails WHERE id = ?", [mail_id], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(is_read, 0);

        conn.execute("UPDATE mails SET is_read = 1 WHERE id = ?", [mail_id])
            .unwrap();

        let is_read: i64 = conn
            .query_row("SELECT is_read FROM mails WHERE id = ?", [mail_id], |row| {
                row.get(0)
            })
            .unwrap();
        assert_eq!(is_read, 1);
    }

    #[test]
    fn test_list_mails_ordered_by_date() {
        let (_temp_dir, db_path) = setup_test_db();
        let conn = Connection::open(&db_path).unwrap();

        conn.execute(
            "INSERT INTO mails (from_address, from_name, to_address, to_name, subject, html, text, date, is_read) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                "test1@example.com",
                "Test 1",
                "recipient@example.com",
                "Recipient",
                "Subject 1",
                "<html>Test 1</html>",
                "Text 1",
                "2024-01-01T00:00:00Z",
                "0",
            ],
        )
        .unwrap();

        conn.execute(
            "INSERT INTO mails (from_address, from_name, to_address, to_name, subject, html, text, date, is_read) 
             VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)",
            [
                "test2@example.com",
                "Test 2",
                "recipient@example.com",
                "Recipient",
                "Subject 2",
                "<html>Test 2</html>",
                "Text 2",
                "2024-01-02T00:00:00Z",
                "0",
            ],
        )
        .unwrap();

        let mut stmt = conn
            .prepare("SELECT id, subject FROM mails ORDER BY date DESC")
            .unwrap();
        let mails: Vec<(i64, String)> = stmt
            .query_map([], |row| Ok((row.get(0)?, row.get(1)?)))
            .unwrap()
            .map(|r| r.unwrap())
            .collect();

        assert_eq!(mails.len(), 2);
        assert_eq!(mails[0].1, "Subject 2");
        assert_eq!(mails[1].1, "Subject 1");
    }
}
