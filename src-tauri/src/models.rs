use serde::{Deserialize, Serialize};
use chrono::{DateTime, Utc};

#[derive(Debug, Serialize, Deserialize, Clone, PartialEq)]
pub enum ShiftType {
    Morning,
    Night,
    Rest,
}

impl std::fmt::Display for ShiftType {
    fn fmt(&self, f: &mut std::fmt::Formatter) -> std::fmt::Result {
        match self {
            ShiftType::Morning => write!(f, "Morning"),
            ShiftType::Night => write!(f, "Night"),
            ShiftType::Rest => write!(f, "Rest"),
        }
    }
}

impl From<String> for ShiftType {
    fn from(s: String) -> Self {
        match s.as_str() {
            "Morning" => ShiftType::Morning,
            "Night" => ShiftType::Night,
            _ => ShiftType::Rest,
        }
    }
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Employee {
    pub id: String,
    pub name: String,
    pub group_id: Option<String>,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct Group {
    pub id: String,
    pub name: String,
    pub current_shift: ShiftType,
}

#[derive(Debug, Serialize, Deserialize, Clone)]
pub struct ShiftSchedule {
    pub id: String,
    pub date: DateTime<Utc>,
    pub group_id: String,
    pub shift_type: ShiftType,
}

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