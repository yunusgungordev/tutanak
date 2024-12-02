use std::collections::HashMap;
use rand::seq::SliceRandom;
use serde_json::{json, Value};
use crate::{DateRange, SemanticMatch, SuggestedFilters};

#[derive(Default)]
pub struct MarkovChain {
    chain: HashMap<Vec<String>, Vec<String>>,
    order: usize,
}

impl MarkovChain {
    pub fn new(order: usize) -> Self {
        MarkovChain {
            chain: HashMap::new(),
            order,
        }
    }

    pub fn train(&mut self, text: &str) {
        let words: Vec<String> = text.split_whitespace()
            .map(|s| s.to_string())
            .collect();

        if words.len() <= self.order {
            return;
        }

        for i in 0..=words.len() - (self.order + 1) {
            let state: Vec<String> = words[i..i + self.order]
                .to_vec();
            let next = words[i + self.order].clone();
            
            self.chain.entry(state)
                .or_insert_with(Vec::new)
                .push(next);
        }
    }

    pub fn generate(&self, start: &str, length: usize) -> String {
        let mut rng = rand::thread_rng();
        let mut result = vec![start.to_string()];
        
        for _ in 0..length {
            let state: Vec<String> = result.iter()
                .skip(result.len().saturating_sub(self.order))
                .cloned()
                .collect();
                
            if let Some(next_words) = self.chain.get(&state) {
                if let Some(next) = next_words.choose(&mut rng) {
                    result.push(next.clone());
                } else {
                    break;
                }
            } else {
                break;
            }
        }
        
        result.join(" ")
    }

    pub fn analyze_importance(&self, text: &str, keywords: &[String]) -> f64 {
        let words: Vec<String> = text.split_whitespace()
            .map(|s| s.to_lowercase())
            .collect();
            
        let mut importance_score = 0.0;
        let mut keyword_count = 0;
        
        // Anahtar kelimeleri say
        for word in &words {
            if keywords.contains(&word) {
                keyword_count += 1;
            }
        }
        
        // Markov zincirindeki geçiş olasılıklarını kontrol et
        for i in 0..words.len().saturating_sub(self.order) {
            let state: Vec<String> = words[i..i + self.order].to_vec();
            if let Some(next_words) = self.chain.get(&state) {
                for keyword in keywords {
                    if next_words.contains(keyword) {
                        importance_score += 1.0;
                    }
                }
            }
        }
        
        // Normalize et
        if keyword_count > 0 {
            importance_score = importance_score / (words.len() as f64)
        }
        
        importance_score
    }

    pub fn analyze_sentiment(&self, text: &str) -> String {
        // Basit duygu analizi
        let positive_words = ["iyi", "güzel", "harika", "muhteşem"];
        let negative_words = ["kötü", "berbat", "korkunç", "üzgün"];
        
        let words: Vec<&str> = text.split_whitespace().collect();
        let pos_count = words.iter().filter(|w| positive_words.contains(w)).count();
        let neg_count = words.iter().filter(|w| negative_words.contains(w)).count();
        
        match (pos_count, neg_count) {
            (p, n) if p > n => "positive",
            (p, n) if n > p => "negative",
            _ => "neutral",
        }.to_string()
    }

    pub fn analyze_categories(&self, text: &str) -> Vec<String> {
        // Basit kategori analizi
        let categories = vec!["iş", "kişisel", "alışveriş", "sağlık", "eğitim"];
        categories.into_iter()
            .filter(|&cat| text.to_lowercase().contains(&cat.to_lowercase()))
            .map(String::from)
            .collect()
    }

    pub fn extract_keywords(&self, text: &str) -> Vec<String> {
        text.split_whitespace()
            .filter(|&word| word.len() > 3)
            .take(5)
            .map(String::from)
            .collect()
    }

    pub fn suggest_tags(&self, text: &str) -> Vec<String> {
        let common_tags = ["acil", "önemli", "toplantı", "proje", "görev"];
        common_tags.iter()
            .filter(|&tag| text.to_lowercase().contains(&tag.to_lowercase()))
            .map(|&s| s.to_string())
            .collect()
    }

    pub fn train_with_metadata(&mut self, text: &str, metadata: &Value) {
        self.train(text);
        
        // Kategori ve etiketlerden öğrenme
        if let Some(category) = metadata.get("category") {
            if let Some(categories) = category.as_array() {
                for cat in categories {
                    if let Some(cat_str) = cat.as_str() {
                        self.train(&format!("kategori: {}", cat_str));
                    }
                }
            }
        }
        
        if let Some(tags) = metadata.get("tags") {
            if let Some(tag_array) = tags.as_array() {
                for tag in tag_array {
                    if let Some(tag_str) = tag.as_str() {
                        self.train(&format!("etiket: {}", tag_str));
                    }
                }
            }
        }
    }

    pub fn _find_semantic_matches(&self, query: &str, notes: &[Value]) -> Vec<SemanticMatch> {
        let query_words: Vec<String> = query
            .split_whitespace()
            .map(|s| s.to_lowercase())
            .collect();
            
        let mut matches = Vec::new();
        
        for note in notes {
            let content = note["content"].as_str().unwrap_or("");
            let note_words: Vec<String> = content
                .split_whitespace()
                .map(|s| s.to_lowercase())
                .collect();
                
            let relevance = self.calculate_semantic_relevance(&query_words, &note_words);
            
            if relevance > 0.3 {
                matches.push(SemanticMatch {
                    note_id: note["id"].as_str().unwrap_or("").to_string(),
                    relevance,
                    matched_terms: self.find_matched_terms(&query_words, &note_words),
                });
            }
        }
        
        matches.sort_by(|a, b| b.relevance.partial_cmp(&a.relevance).unwrap());
        matches
    }
    
    pub fn calculate_semantic_relevance(&self, query_words: &[String], note_words: &[String]) -> f64 {
        let mut relevance = 0.0;
        
        for window in note_words.windows(self.order) {
            if let Some(next_words) = self.chain.get(window) {
                for query_word in query_words {
                    if next_words.contains(query_word) {
                        relevance += 1.0;
                    }
                }
            }
        }
        
        relevance / (note_words.len() as f64)
    }
    
    pub fn suggest_filters(&self, _query: &str, notes: &[Value]) -> SuggestedFilters {
        // Kategori analizi
        let categories: Vec<String> = notes
            .iter()
            .filter_map(|note| note["category"].as_str())
            .map(String::from)
            .collect();
            
        // Öncelik analizi
        let priorities: Vec<String> = notes
            .iter()
            .filter_map(|note| note["priority"].as_str())
            .map(String::from)
            .collect();
            
        // Tarih aralığı analizi
        let dates: Vec<String> = notes
            .iter()
            .filter_map(|note| note["date"].as_str())
            .map(String::from)
            .collect();
            
        SuggestedFilters {
            category: Some(categories),
            priority: Some(priorities),
            date_range: Some(DateRange {
                start: dates.first().cloned().unwrap_or_default(),
                end: dates.last().cloned().unwrap_or_default(),
            }),
        }
    }

    pub fn analyze_query(&self, query: &str) -> Value {
        let mut result = serde_json::Map::new();
        
        // Tarih formatını kontrol et
        if let Ok(date) = chrono::NaiveDate::parse_from_str(query, "%d/%m/%Y") {
            result.insert("type".to_string(), json!("date"));
            result.insert("value".to_string(), json!(date.to_string()));
        } else {
            result.insert("type".to_string(), json!("text"));
            result.insert("value".to_string(), json!(query));
        }
        
        Value::Object(result)
    }

    pub fn find_matched_terms(&self, query_words: &[String], note_words: &[String]) -> Vec<String> {
        let mut matched_terms = Vec::new();
        
        for query_word in query_words {
            if note_words.contains(query_word) {
                matched_terms.push(query_word.clone());
            }
        }
        
        matched_terms
    }
} 