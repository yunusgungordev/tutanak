import { Group, ShiftSchedule } from '@/types/shift';
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
    const queryPhrases = extractKeyPhrases(query);
    
    const matches = notes.map(note => {
      const titleSimilarity = calculateTextSimilarity(query, note.title) * 1.5;
      const contentSimilarity = calculateTextSimilarity(query, note.content);
      const phraseSimilarity = queryPhrases.reduce((acc, phrase) => {
        return acc + (note.content.toLowerCase().includes(phrase) ? 0.5 : 0);
      }, 0);
      
      const relevance = titleSimilarity + contentSimilarity + phraseSimilarity;
      
      return {
        noteId: note.id,
        relevance: relevance,
        matchedTerms: query.toLowerCase().split(/\s+/).filter(term => 
          note.title.toLowerCase().includes(term) || 
          note.content.toLowerCase().includes(term)
        )
      };
    }).filter(match => match.relevance > 0.2);

    matches.sort((a, b) => b.relevance - a.relevance);

    return {
      semanticMatches: matches,
      suggestedFilters: await generateSearchFilters(query, notes)
    };
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

const calculateTextSimilarity = (text1: string, text2: string): number => {
  const words1 = text1.toLowerCase().split(/\s+/);
  const words2 = text2.toLowerCase().split(/\s+/);
  
  const intersection = words1.filter(word => words2.includes(word));
  const union = [...new Set([...words1, ...words2])];
  
  return intersection.length / union.length;
}

const extractKeyPhrases = (text: string): string[] => {
  const words = text.toLowerCase().split(/\s+/);
  const phrases: string[] = [];
  
  for (let i = 0; i < words.length - 1; i++) {
    phrases.push(`${words[i]} ${words[i + 1]}`);
  }
  
  return phrases;
}

async function generateSearchFilters(query: string, notes: SearchableNote[]) {
  const queryTerms = query.toLowerCase().split(/\s+/);
  
  const categories = new Set<string>();
  const priorities = new Set<"low" | "medium" | "high">();
  let dateStart: Date | undefined;
  let dateEnd: Date | undefined;

  notes.forEach(note => {
    if (note.category) categories.add(note.category);
    if (note.priority) priorities.add(note.priority);
    const noteDate = new Date(note.date);
    
    if (!dateStart || noteDate < dateStart) dateStart = noteDate;
    if (!dateEnd || noteDate > dateEnd) dateEnd = noteDate;
  });

  return {
    category: Array.from(categories),
    priority: Array.from(priorities),
    dateRange: dateStart && dateEnd ? {
      start: dateStart.toISOString(),
      end: dateEnd.toISOString()
    } : undefined
  };
}

export async function generateShiftSchedule(
  groups: Group[],
  startDate: Date,
  days: number
): Promise<ShiftSchedule[]> {
  try {
    return await invoke('generate_shift_schedule', { 
      groups: JSON.stringify(groups),
      startDate: startDate.toISOString(),
      days 
    });
  } catch (error) {
    console.error('Vardiya planı oluşturma hatası:', error);
    return [];
  }
}

export async function validateGroupChange(
  employeeId: string,
  newGroupId: string
): Promise<{
  isValid: boolean;
  message: string;
}> {
  try {
    return await invoke('validate_group_change', { 
      employeeId,
      newGroupId 
    });
  } catch (error) {
    console.error('Grup değişikliği doğrulama hatası:', error);
    return {
      isValid: false,
      message: 'Doğrulama hatası oluştu'
    };
  }
} 