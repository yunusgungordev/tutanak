use serde::{Deserialize, Serialize};

#[derive(Serialize, Deserialize)]
pub struct SQLiteNote {
    pub id: i64,
    pub title: String,
    pub content: String,
    pub priority: String,
    pub date: String,
    pub time: String,
    pub status: String,
    pub due_date: Option<String>,
    pub reminder: bool,
    pub last_notified: Option<String>,
    pub is_important: bool,
    pub is_notified: bool,
    pub category: String,
    pub tags: String,
    pub created_at: String,
    pub updated_at: String,
} 