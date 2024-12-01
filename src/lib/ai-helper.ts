import { invoke } from '@tauri-apps/api/tauri';

interface ContentAnalysis {
  sentiment: 'positive' | 'negative' | 'neutral';
  category: string[];
  keywords: string[];
  importance: number;
  suggestedTags: string[];
}

interface SearchAnalysis {
  semanticMatches: {
    noteId: string;
    relevance: number;
    matchedTerms: string[];
  }[];
  suggestedFilters: {
    category?: string[];
    priority?: ("low" | "medium" | "high")[];
    dateRange?: { start: string; end: string };
  };
}

export interface SearchableNote {
  id: string;
  title: string;
  content: string;
  date: string;
  dueDate?: string;
  priority?: 'low' | 'medium' | 'high';
  status?: 'pending' | 'completed' | 'overdue';
  reminder?: boolean;
  lastNotified?: string;
  isNotified: boolean;
  isImportant: boolean;
  category?: string;
  tags?: string[];
}

export async function analyzeContent(text: string): Promise<ContentAnalysis> {
  try {
    return await invoke('analyze_content', { text });
  } catch (error) {
    console.error('İçerik analizi hatası:', error);
    return {
      sentiment: 'neutral',
      category: [],
      keywords: [],
      importance: 0.5,
      suggestedTags: []
    };
  }
}

export async function trainAIModel(text: string, metadata?: {
  category?: string[];
  tags?: string[];
}) {
  try {
    await invoke('train_model', { 
      text,
      metadata: JSON.stringify(metadata)
    });
  } catch (error) {
    console.error('Model eğitimi hatası:', error);
  }
}

export async function generateSimilarText(start: string, length: number = 20): Promise<string> {
    try {
        return await invoke('generate_text', { 
            start, 
            length 
        });
    } catch (error) {
        console.error('Metin üretme hatası:', error);
        return '';
    }
}

export async function semanticSearch(
  query: string,
  notes: SearchableNote[]
): Promise<SearchAnalysis> {
  try {
    return await invoke('semantic_search', { query, notes });
  } catch (error) {
    console.error('Semantik arama hatası:', error);
    return { semanticMatches: [], suggestedFilters: {} };
  }
}

export async function analyzeSearchQuery(query: string): Promise<{
  type: 'date' | 'text' | 'category' | 'priority';
  value: any;
}> {
  try {
    return await invoke('analyze_search_query', { query });
  } catch (error) {
    console.error('Sorgu analizi hatası:', error);
    return { type: 'text', value: query };
  }
} 