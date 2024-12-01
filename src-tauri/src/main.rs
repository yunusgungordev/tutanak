// Prevents additional console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

use rusqlite::{Connection, Result};
use serde::{Deserialize, Serialize};
use std::path::PathBuf;
use std::sync::Mutex;
use lazy_static::lazy_static;
mod markov;
use markov::MarkovChain;

lazy_static! {
    static ref MARKOV_CHAIN: Mutex<MarkovChain> = Mutex::new(MarkovChain::new(2));
}

fn get_db_path() -> PathBuf {
    let app_data = std::env::var("APPDATA")
        .expect("APPDATA environment variable not found");
    let db_dir = PathBuf::from(app_data).join("tutanak");
    
    // Dizin yoksa oluştur
    if !db_dir.exists() {
        std::fs::create_dir_all(&db_dir)
            .expect("Failed to create database directory");
    }
    
    db_dir.join("data.db")
}

fn migrate_database() -> Result<(), String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    
    // Eski tabloyu sil
    conn.execute("DROP TABLE IF EXISTS notes", [])
        .map_err(|e| e.to_string())?;
    
    // Yeni tabloyu oluştur
    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            priority TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            due_date TEXT,
            reminder INTEGER DEFAULT 0,
            last_notified TEXT,
            is_notified INTEGER DEFAULT 0,
            is_important INTEGER DEFAULT 0
        )",
        [],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn init_database() -> Result<(), String> {
    migrate_database()
}

fn initialize_database() -> std::result::Result<(), Box<dyn std::error::Error>> {
    let db_path = get_db_path();
    
    // Veritabanı bağlantısını oluştur
    let conn = Connection::open(&db_path)?;
    
    // Notes tablosunu oluştur
    conn.execute(
        "CREATE TABLE IF NOT EXISTS notes (
            id INTEGER PRIMARY KEY,
            title TEXT NOT NULL,
            content TEXT NOT NULL,
            priority TEXT NOT NULL,
            date TEXT NOT NULL,
            time TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            status TEXT NOT NULL DEFAULT 'pending',
            due_date TEXT,
            reminder INTEGER DEFAULT 0,
            last_notified TEXT,
            is_notified INTEGER DEFAULT 0,
            is_important INTEGER DEFAULT 0
        )",
        [],
    )?;
    
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
    )?;
    
    // Tabs tablosunu oluştur
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tabs (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            type TEXT NOT NULL,
            layout TEXT NOT NULL,
            database TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    )?;
    
    Ok(())
}

#[derive(Serialize, Deserialize)]
struct ExcelData {
    id: i32,
    sheet_name: String,
    content: String,
    created_at: String,
    updated_at: String
}

#[derive(Debug, Serialize, Deserialize, Clone)]
struct Note {
    id: Option<i64>,
    title: String,
    content: String,
    priority: String,
    date: String,
    time: String,
    created_at: String,
    updated_at: String,
    status: Option<String>,
    due_date: Option<String>,
    reminder: Option<bool>,
    last_notified: Option<String>,
    is_notified: Option<bool>,
    is_important: Option<bool>
}

#[derive(Debug, Serialize, Deserialize)]
struct Template {
    id: Option<i32>,
    title: String,
    description: String,
    note: Option<String>,
    template_type: String,
    created_at: String,
    updated_at: String
}

#[derive(Debug, Serialize, Deserialize)]
struct TabData {
    id: String,
    label: String,
    r#type: String,
    layout: Vec<LayoutConfig>,
    database: DatabaseConfig,
    created_at: String
}

#[derive(Debug, Serialize, Deserialize)]
struct LayoutConfig {
    id: String,
    r#type: String,
    properties: Properties
}

#[derive(Debug, Serialize, Deserialize)]
struct Properties {
    x: i32,
    y: i32,
    width: i32,
    height: i32,
    label: Option<String>,
    placeholder: Option<String>,
    options: Option<Vec<String>>,
    headers: Option<Vec<String>>,
    rows: Option<Vec<Vec<String>>>,
    is_visible: Option<bool>,
    content: Option<String>
}

#[derive(Debug, Serialize, Deserialize)]
struct DatabaseConfig {
    table_name: String,
    fields: Vec<Field>
}

#[derive(Debug, Serialize, Deserialize)]
struct Field {
    name: String,
    r#type: String
}

#[derive(Debug, Serialize, Deserialize)]
struct SavedTab {
    id: String,
    label: String,
    r#type: String,
    layout: String, // JSON string olarak
    database: String, // JSON string olarak
    created_at: String
}

#[tauri::command]
async fn save_excel_data(data: String, sheet_name: String) -> Result<(), String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    
    conn.execute(
        "CREATE TABLE IF NOT EXISTS excel_data (
            id INTEGER PRIMARY KEY,
            sheet_name TEXT NOT NULL,
            content TEXT NOT NULL,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    let now = chrono::Local::now().to_string();
    
    conn.execute(
        "INSERT INTO excel_data (sheet_name, content, created_at, updated_at) VALUES (?1, ?2, ?3, ?4)",
        [&sheet_name, &data, &now, &now],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn save_note(note: Note) -> Result<Note, String> {
    let mut conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    let note_clone = note.clone();
    
    println!("Not kaydediliyor: {:?}", note_clone);
    
    let tx = conn.transaction().map_err(|e| {
        println!("Transaction başlatma hatası: {}", e);
        format!("Transaction başlatma hatası: {}", e)
    })?;

    let result = tx.execute(
        "INSERT INTO notes (
            title, content, priority, date, time, 
            created_at, updated_at, status, due_date, 
            reminder, last_notified, is_notified, is_important
        ) VALUES (?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13)",
        [
            &note_clone.title,
            &note_clone.content,
            &note_clone.priority,
            &note_clone.date,
            &note_clone.time,
            &note_clone.created_at,
            &note_clone.updated_at,
            &note_clone.status.as_ref().unwrap_or(&"pending".to_string()),
            &note_clone.due_date.unwrap_or_default(),
            &note_clone.reminder.unwrap_or(false).to_string(),
            &note_clone.last_notified.unwrap_or_default(),
            &(note_clone.is_notified.unwrap_or(false) as i32).to_string(),
            &(note_clone.is_important.unwrap_or(false) as i32).to_string()
        ],
    );

    match result {
        Ok(_) => {
            let id = tx.last_insert_rowid();
            tx.commit().map_err(|e| format!("Transaction commit hatası: {}", e))?;
            
            let mut saved_note = note;
            saved_note.id = Some(id);
            Ok(saved_note)
        },
        Err(e) => {
            tx.rollback().map_err(|re| format!("Transaction rollback hatası: {}", re))?;
            Err(format!("Not kaydetme hatası: {}", e))
        }
    }
}

#[tauri::command]
async fn get_notes() -> Result<Vec<Note>, String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare(
        "SELECT id, title, content, priority, date, time, created_at, updated_at, 
         status, due_date, reminder, last_notified, is_notified, is_important 
         FROM notes ORDER BY date DESC"
    ).map_err(|e| e.to_string())?;
    
    let notes = stmt.query_map([], |row| {
        Ok(Note {
            id: row.get(0)?,
            title: row.get(1)?,
            content: row.get(2)?,
            priority: row.get(3)?,
            date: row.get(4)?,
            time: row.get(5)?,
            created_at: row.get(6)?,
            updated_at: row.get(7)?,
            status: Some(row.get(8)?),
            due_date: row.get(9)?,
            reminder: Some(row.get::<_, i32>(10)? != 0),
            last_notified: row.get(11)?,
            is_notified: Some(row.get::<_, i32>(12)? != 0),
            is_important: Some(row.get::<_, i32>(13)? != 0)
        })
    }).map_err(|e| e.to_string())?;
    
    let notes: Result<Vec<Note>, _> = notes.collect();
    notes.map_err(|e| e.to_string())
}

#[tauri::command]
async fn save_template(template: Template) -> Result<(), String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    
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

    conn.execute(
        "INSERT INTO templates (title, description, note, template_type, created_at, updated_at) 
         VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        [
            &template.title,
            &template.description,
            &template.note.unwrap_or_default(),
            &template.template_type,
            &template.created_at,
            &template.updated_at
        ],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn get_templates() -> Result<Vec<Template>, String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare(
        "SELECT id, title, description, note, template_type, created_at, updated_at FROM templates"
    ).map_err(|e| e.to_string())?;
    
    let templates = stmt.query_map([], |row| {
        Ok(Template {
            id: Some(row.get(0)?),
            title: row.get(1)?,
            description: row.get(2)?,
            note: row.get(3)?,
            template_type: row.get(4)?,
            created_at: row.get(5)?,
            updated_at: row.get(6)?
        })
    }).map_err(|e| e.to_string())?;
    
    let templates: Result<Vec<Template>, _> = templates.collect();
    templates.map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_template(id: i32) -> Result<(), String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    
    conn.execute(
        "DELETE FROM templates WHERE id = ?1",
        [id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn create_dynamic_tab(tab_data: TabData) -> Result<bool, String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    
    // Debug için
    println!("Gelen layout verisi: {:?}", tab_data.layout);
    
    // Tabs tablosunu oluştur
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tabs (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            type TEXT NOT NULL,
            layout TEXT NOT NULL,
            database TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;
    
    let layout_json = serde_json::to_string(&tab_data.layout)
        .map_err(|e| format!("Layout JSON dönüşüm hatası: {}", e))?;
    
    // Debug için
    println!("JSON'a dönüştürülen layout: {}", layout_json);

    conn.execute(
        "INSERT INTO tabs (id, label, type, layout, database, created_at) VALUES (?1, ?2, ?3, ?4, ?5, ?6)",
        (
            &tab_data.id,
            &tab_data.label,
            &tab_data.r#type,
            &layout_json,
            &serde_json::to_string(&tab_data.database).unwrap(),
            &tab_data.created_at
        ),
    ).map_err(|e| e.to_string())?;

    Ok(true)
}

#[tauri::command]
async fn get_tabs() -> Result<Vec<SavedTab>, String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    
    // Tabs tablosunu oluştur (eğer yoksa)
    conn.execute(
        "CREATE TABLE IF NOT EXISTS tabs (
            id TEXT PRIMARY KEY,
            label TEXT NOT NULL,
            type TEXT NOT NULL,
            layout TEXT NOT NULL,
            database TEXT NOT NULL,
            created_at TEXT NOT NULL
        )",
        [],
    ).map_err(|e| e.to_string())?;

    let mut stmt = conn.prepare(
        "SELECT id, label, type, layout, database, created_at FROM tabs"
    ).map_err(|e| e.to_string())?;
    
    let tabs = stmt.query_map([], |row| {
        Ok(SavedTab {
            id: row.get(0)?,
            label: row.get(1)?,
            r#type: row.get(2)?,
            layout: row.get(3)?,
            database: row.get(4)?,
            created_at: row.get(5)?
        })
    }).map_err(|e| e.to_string())?;
    
    let tabs: Result<Vec<SavedTab>, _> = tabs.collect();
    tabs.map_err(|e| e.to_string())
}

#[tauri::command]
async fn delete_tab(id: String) -> Result<(), String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    
    conn.execute(
        "DELETE FROM tabs WHERE id = ?1",
        [id],
    ).map_err(|e| e.to_string())?;

    Ok(())
}

#[tauri::command]
async fn update_tab(tab_data: TabData) -> Result<bool, String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    
    // Layout ve database verilerini JSON'a dönüştür
    let layout_json = serde_json::to_string(&tab_data.layout)
        .map_err(|e| format!("Layout JSON dönüşüm hatası: {}", e))?;
    
    let database_json = serde_json::to_string(&tab_data.database)
        .map_err(|e| format!("Database JSON dönüşüm hatası: {}", e))?;
    
    // Tab'ı güncelle
    conn.execute(
        "UPDATE tabs SET label = ?1, layout = ?2, database = ?3 WHERE id = ?4",
        (
            &tab_data.label,
            &layout_json,
            &database_json,
            &tab_data.id,
        ),
    ).map_err(|e| e.to_string())?;

    Ok(true)
}

#[tauri::command]
async fn train_model(text: String) -> Result<(), String> {
    let mut chain = MARKOV_CHAIN.lock().map_err(|e| e.to_string())?;
    chain.train(&text);
    Ok(())
}

#[tauri::command]
async fn generate_text(start: String, length: usize) -> Result<String, String> {
    let chain = MARKOV_CHAIN.lock().map_err(|e| e.to_string())?;
    Ok(chain.generate(&start, length))
}

#[tauri::command]
async fn analyze_importance(text: String, keywords: Vec<String>) -> Result<f64, String> {
    let chain = MARKOV_CHAIN.lock().map_err(|e| e.to_string())?;
    Ok(chain.analyze_importance(&text, &keywords))
}

#[tauri::command]
async fn update_note_notification(id: i32, is_notified: bool) -> Result<(), String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE notes SET is_notified = ?1 WHERE id = ?2",
        [is_notified as i32, id],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

fn main() {
    // Veritabanını başlat
    if let Err(e) = initialize_database() {
        eprintln!("Veritabanı başlatma hatası: {}", e);
    }
    tauri::Builder::default()
        .invoke_handler(tauri::generate_handler![
            save_excel_data, 
            save_note, 
            get_notes, 
            save_template, 
            get_templates,
            delete_template,
            create_dynamic_tab,
            get_tabs,
            delete_tab,
            update_tab,
            init_database,
            train_model,
            generate_text,
            analyze_importance,
            update_note_notification
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}
