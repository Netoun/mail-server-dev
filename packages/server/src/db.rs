use rusqlite::Connection;

/// Initialise la base de données avec les tables nécessaires
pub fn init_db(db_path: &str) -> Result<Connection, rusqlite::Error> {
    let conn = Connection::open(db_path)?;

    // Create mails table
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
    )?;

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
    )?;

    Ok(conn)
}

