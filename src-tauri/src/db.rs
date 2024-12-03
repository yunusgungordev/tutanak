use sqlx::{SqlitePool, Row};
use crate::{get_db_path, models::{Employee, Group, ShiftType}};
use rusqlite::Connection;

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

pub async fn save_group(pool: &SqlitePool, group: &Group) -> Result<(), String> {
    sqlx::query(
        "INSERT OR REPLACE INTO groups (id, name, current_shift) VALUES (?, ?, ?)"
    )
    .bind(&group.id)
    .bind(&group.name)
    .bind(group.current_shift.to_string())
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

pub async fn save_employee(pool: &SqlitePool, employee: &Employee) -> Result<(), String> {
    sqlx::query(
        "INSERT OR REPLACE INTO employees (id, name, group_id) VALUES (?, ?, ?)"
    )
    .bind(&employee.id)
    .bind(&employee.name)
    .bind(&employee.group_id)
    .execute(pool)
    .await
    .map_err(|e| e.to_string())?;

    Ok(())
}

pub async fn load_groups(pool: &SqlitePool) -> Result<Vec<Group>, String> {
    let rows = sqlx::query("SELECT * FROM groups")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(rows.iter().map(|row| Group {
        id: row.get("id"),
        name: row.get("name"),
        current_shift: ShiftType::from(row.get::<String, _>("current_shift")),
    }).collect())
}

pub async fn load_employees(pool: &SqlitePool) -> Result<Vec<Employee>, String> {
    let rows = sqlx::query("SELECT * FROM employees")
        .fetch_all(pool)
        .await
        .map_err(|e| e.to_string())?;

    Ok(rows.iter().map(|row| Employee {
        id: row.get("id"),
        name: row.get("name"),
        group_id: row.get("group_id")
    }).collect())
} 