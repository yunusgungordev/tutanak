use std::collections::HashMap;
use rand::seq::SliceRandom;

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
} 