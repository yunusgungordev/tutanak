// Prevents additional console window on Windows in release
#![cfg_attr(
    all(not(debug_assertions), target_os = "windows"),
    windows_subsystem = "windows"
)]

mod models;
mod db;
use rusqlite::{Connection, Result, params};
use serde::{Deserialize, Serialize};
use serde_json::Value;
use std::path::PathBuf;
use lazy_static::lazy_static;
mod markov;
use markov::MarkovChain;
use sqlx::sqlite::SqlitePool;
use tokio::sync::Mutex;
use crate::db::initialize_database;
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

#[derive(Serialize, Deserialize)]
struct ExcelData {
    id: i32,
    sheet_name: String,
    content: String,
    created_at: String,
    updated_at: String
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Note {
    pub id: Option<i64>,
    pub title: String,
    pub content: String,
    pub priority: Option<String>,
    pub date: String,
    pub time: String,
    pub created_at: String,
    pub updated_at: String,
    pub reminder: bool,
    pub status: String,
    pub due_date: Option<String>,
    pub last_notified: Option<String>,
    pub is_notified: bool,
    pub is_important: bool,
    pub category: String,
    pub tags: String,
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
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    let note_clone = note.clone();
    
    conn.execute(
        "INSERT INTO notes (
            title, content, priority, date, time, created_at, updated_at, 
            status, due_date, reminder, last_notified, 
            is_notified, is_important
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
        params![
            &note_clone.title,
            &note_clone.content,
            &note_clone.priority,
            &note_clone.date,
            &note_clone.time,
            &note_clone.created_at,
            &note_clone.updated_at,
            &note_clone.status,
            &note_clone.due_date,
            &note_clone.reminder,
            &note_clone.last_notified,
            &note_clone.is_notified,
            &note_clone.is_important
        ],
    ).map_err(|e| e.to_string())?;

    let id = conn.last_insert_rowid();
    let mut saved_note = note;
    saved_note.id = Some(id);
    Ok(saved_note)
}

pub struct AppState {
    pub pool: SqlitePool,
}

#[tauri::command]
async fn get_all_notes() -> Result<Vec<Note>, String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    
    let mut stmt = conn.prepare(
        "SELECT id, title, content, priority, date, time, status, 
         due_date, reminder, last_notified, is_notified, is_important,
         COALESCE(category, '') as category, 
         COALESCE(tags, '') as tags, 
         created_at, updated_at 
         FROM notes ORDER BY created_at DESC"
    ).map_err(|e| e.to_string())?;
    
    let notes = stmt.query_map([], |row| {
        Ok(Note {
            id: Some(row.get(0)?),
            title: row.get(1)?,
            content: row.get(2)?,
            priority: Some(row.get(3)?),
            date: row.get(4)?,
            time: row.get(5)?,
            status: row.get(6)?,
            due_date: row.get(7)?,
            reminder: row.get::<_, i32>(8)? != 0,
            last_notified: row.get(9)?,
            is_notified: row.get::<_, i32>(10)? != 0,
            is_important: row.get::<_, i32>(11)? != 0,
            category: row.get(12)?,
            tags: row.get(13)?,
            created_at: row.get(14)?,
            updated_at: row.get(15)?
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

#[derive(Serialize, Deserialize)]
struct ContentAnalysis {
    sentiment: String,
    category: Vec<String>,
    keywords: Vec<String>,
    importance: f64,
    suggested_tags: Vec<String>
}

#[tauri::command]
async fn analyze_content(text: String) -> Result<ContentAnalysis, String> {
    let chain = MARKOV_CHAIN.lock().await;
    
    let sentiment = chain.analyze_sentiment(&text);
    let category = chain.analyze_categories(&text);
    let keywords = chain.extract_keywords(&text);
    let importance = chain.analyze_importance(&text, &keywords);
    let tags = chain.suggest_tags(&text);
    
    Ok(ContentAnalysis {
        sentiment,
        category,
        keywords,
        importance,
        suggested_tags: tags
    })
}

#[tauri::command]
async fn train_model(text: String, metadata: Option<String>) -> Result<(), String> {
    let mut chain = MARKOV_CHAIN.lock().await;
    
    if let Some(meta) = metadata {
        let meta_data: Value = serde_json::from_str(&meta)
            .map_err(|e| e.to_string())?;
        chain.train_with_metadata(&text, &meta_data);
    } else {
        chain.train(&text);
    }
    
    Ok(())
}

#[tauri::command]
async fn generate_text(start: String, length: usize) -> Result<String, String> {
    let chain = MARKOV_CHAIN.lock().await;
    Ok(chain.generate(&start, length))
}

#[tauri::command]
async fn analyze_importance(text: String, keywords: Vec<String>) -> Result<f64, String> {
    let chain = MARKOV_CHAIN.lock().await;
    Ok(chain.analyze_importance(&text, &keywords))
}

#[derive(Serialize)]
struct SearchAnalysis {
    semantic_matches: Vec<SemanticMatch>,
    suggested_filters: SuggestedFilters,
}

#[derive(Serialize)]
struct SemanticMatch {
    note_id: String,
    relevance: f64,
    matched_terms: Vec<String>,
}

#[derive(Serialize)]
struct SuggestedFilters {
    category: Option<Vec<String>>,
    priority: Option<Vec<String>>,
    date_range: Option<DateRange>,
}

#[derive(Serialize)]
struct DateRange {
    start: String,
    end: String,
}

#[tauri::command]
async fn semantic_search(query: String, notes: String) -> Result<SearchAnalysis, String> {
    let chain = MARKOV_CHAIN.lock().await;
    let notes: Vec<Value> = serde_json::from_str(&notes).map_err(|e| e.to_string())?;
    
    let query_words: Vec<String> = query
        .split_whitespace()
        .map(|s| s.to_lowercase())
        .collect();
        
    let mut matches = Vec::new();
    
    for note in notes.iter() {
        let content = note["content"].as_str().unwrap_or("");
        let note_words: Vec<String> = content
            .split_whitespace()
            .map(|s| s.to_lowercase())
            .collect();
            
        let relevance = chain.calculate_semantic_relevance(&query_words, &note_words);
        
        if relevance > 0.3 {
            matches.push(SemanticMatch {
                note_id: note["id"].as_str().unwrap_or("").to_string(),
                relevance,
                matched_terms: chain.find_matched_terms(&query_words, &note_words),
            });
        }
    }
    
    matches.sort_by(|a, b| b.relevance.partial_cmp(&a.relevance).unwrap());
    
    let filters = chain.suggest_filters(&query, &notes);
    
    Ok(SearchAnalysis {
        semantic_matches: matches,
        suggested_filters: filters,
    })
}

#[tauri::command]
async fn analyze_search_query(query: String) -> Result<Value, String> {
    let chain = MARKOV_CHAIN.lock().await;
    Ok(chain.analyze_query(&query))
}

#[tauri::command]
async fn add_note(note: SQLiteNote) -> Result<i64, String> {
    let conn = Connection::open(get_db_path()).map_err(|e| e.to_string())?;
    
    conn.execute(
        "INSERT INTO notes (
            title, content, priority, date, time, status,
            due_date, reminder, last_notified, is_important,
            is_notified, category, tags, created_at, updated_at
        ) VALUES (
            ?1, ?2, ?3, ?4, ?5, ?6, ?7, ?8, ?9, ?10, ?11, ?12, ?13, ?14, ?15
        )",
        params![
            note.title, note.content, note.priority, note.date, note.time,
            note.status, note.due_date, note.reminder, note.last_notified,
            note.is_important, note.is_notified, note.category, note.tags,
            note.created_at, note.updated_at
        ],
    ).map_err(|e| e.to_string())?;
    
    Ok(conn.last_insert_rowid())
}

#[derive(Debug, Serialize, Deserialize)]
struct SQLiteNote {
    title: String,
    content: String,
    priority: String,
    date: String,
    time: String,
    status: String,
    due_date: Option<String>,
    reminder: bool,
    last_notified: Option<String>,
    is_important: bool,
    is_notified: bool,
    category: String,
    tags: String,
    created_at: String,
    updated_at: String
}

#[tauri::command]
async fn update_note_status(id: i64, status: String) -> Result<(), String> {
    let conn = Connection::open(get_db_path())
        .map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE notes SET status = ? WHERE id = ?",
        params![status, id],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
async fn delete_note(id: i64) -> Result<(), String> {
    let conn = Connection::open(get_db_path())
        .map_err(|e| e.to_string())?;
    
    conn.execute(
        "DELETE FROM notes WHERE id = ?",
        params![id],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tauri::command]
async fn update_note_notification(
    id: i64, 
    last_notified: String,
    is_notified: bool
) -> Result<(), String> {
    let conn = Connection::open(get_db_path())
        .map_err(|e| e.to_string())?;
    
    conn.execute(
        "UPDATE notes SET last_notified = ?, is_notified = ? WHERE id = ?",
        params![last_notified, is_notified, id],
    ).map_err(|e| e.to_string())?;
    
    Ok(())
}

#[tokio::main]
async fn main() {
    let db_path = get_db_path();
    
    // Önce veritabanını başlat
    if let Err(e) = initialize_database() {
        eprintln!("Veritabanı başlatma hatası: {}", e);
        return;
    }
    
    // Sonra bağlantıyı oluştur
    let pool = match SqlitePool::connect(db_path.to_str().unwrap()).await {
        Ok(pool) => pool,
        Err(e) => {
            eprintln!("Veritabanı bağlantı hatası: {}", e);
            return;
        }
    };
    
    tauri::Builder::default()
        .manage(AppState {
            pool,
        })
        .invoke_handler(tauri::generate_handler![
            save_excel_data, 
            save_note, 
            get_all_notes, 
            save_template, 
            get_templates,
            delete_template,
            create_dynamic_tab,
            get_tabs,
            delete_tab,
            update_tab,
            train_model,
            generate_text,
            analyze_importance,
            update_note_notification,
            analyze_content,
            semantic_search,
            analyze_search_query,
            add_note,
            update_note_status,
            delete_note,
            update_note_notification
        ])
        .run(tauri::generate_context!())
        .expect("error while running tauri application");
}

