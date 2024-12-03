use rusqlite::Connection;

use crate::get_db_path;

pub fn initialize_database() -> Result<(), String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;

    // Notes tablosunu oluştur
    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            priority TEXT NOT NULL DEFAULT 'medium',
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            due_date TEXT,
            reminder BOOLEAN DEFAULT FALSE,
            last_notified TEXT,
            is_notified BOOLEAN DEFAULT FALSE,
            is_important BOOLEAN DEFAULT FALSE,
            category TEXT,
            tags TEXT
        )",
        [],
    ).map_err(|e| e.to_string())?;

    // Templates tablosunu oluştur
    conn.execute(
        "CREATE TABLE IF NOT EXISTS templates (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            description TEXT NOT NULL,
            note TEXT,
            template_type TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    Ok(())
}