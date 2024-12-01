import { createContext, useContext, useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/tauri"
import { format, startOfDay } from "date-fns"
import { generateSimilarText, trainAIModel, analyzeContent } from "@/lib/ai-helper"
import { TimelineNote } from "@/types"

interface Note {
    id: string | null;
    title: string;
    content: string;
    priority: string;
    date: string;
    time: string;
    created_at: string;
    updated_at: string;
    status: string;
    due_date?: string;
    reminder: boolean;
    last_notified?: string;
    is_important: boolean;
    is_notified: boolean;
    category: string;
    tags: string;
}

interface SQLiteNote {
  id: number;
  title: string;
  content: string;
  priority: string;
  date: string;
  time: string;
  status: string;
  due_date: string | null;
  reminder: boolean;
  last_notified: string | null;
  is_important: boolean;
  is_notified: boolean;
  category: string;
  tags: string;
  created_at: string;
  updated_at: string;
}

interface NotesContextType {
  notes: TimelineNote[]
  searchResults: TimelineNote[]
  setSearchResults: React.Dispatch<React.SetStateAction<TimelineNote[]>>
  addNote: (note: Omit<TimelineNote, "id" | "status">) => void
  updateNoteStatus: (id: string, status: TimelineNote["status"]) => void
  deleteNote: (id: string) => void
  updateNoteLastNotified: (id: string) => void
  searchNotes: (query: string, dateFilteredNotes?: TimelineNote[]) => void
  getSuggestions: (text: string) => Promise<string>
  checkImportantContent: (content: string) => Promise<boolean>
}

const NotesContext = createContext<NotesContextType | undefined>(undefined)

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<TimelineNote[]>([])
  const [searchResults, setSearchResults] = useState<TimelineNote[]>([])
  const [categories, setCategories] = useState<string[]>([])
  const [tags, setTags] = useState<string[]>([])

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const result = await invoke<SQLiteNote[]>('get_all_notes');
        
        const timelineNotes = result.map(note => ({
          id: note.id.toString(),
          title: note.title,
          content: note.content,
          date: note.date,
          priority: note.priority as "low" | "medium" | "high",
          status: note.status as TimelineNote["status"],
          dueDate: note.due_date || undefined,
          reminder: note.reminder,
          lastNotified: note.last_notified || undefined,
          isImportant: note.is_important,
          isNotified: note.is_notified,
          category: note.category,
          tags: note.tags,
          created_at: note.created_at,
          updated_at: note.updated_at
        }));
        
        setNotes(timelineNotes);
      } catch (error) {
        console.error('Notlar yüklenirken hata:', error);
        setNotes([]);
      }
    }

    loadNotes()
  }, [])

  const addNote = async (note: Omit<TimelineNote, "id" | "status">) => {
    try {
      const isImportant = await checkImportantContent(note.content);
      
      const sqlNote: SQLiteNote = {
        id: 0,
        title: note.title,
        content: note.content,
        priority: note.priority,
        date: note.date,
        time: format(new Date(note.date), 'HH:mm'),
        created_at: note.created_at,
        updated_at: note.updated_at,
        status: "pending",
        due_date: note.dueDate || null,
        reminder: note.reminder || false,
        last_notified: note.lastNotified || null,
        is_important: isImportant,
        is_notified: false,
        category: note.category || "genel",
        tags: note.tags || "",
      };

      const savedNote = await invoke<Note>("save_note", { 
        note: sqlNote
      });
      
      const timelineNote: TimelineNote = {
        id: savedNote.id?.toString() || crypto.randomUUID(),
        title: savedNote.title,
        content: savedNote.content,
        priority: savedNote.priority as "low" | "medium" | "high",
        date: savedNote.date,
        status: "pending",
        dueDate: savedNote.due_date || undefined,
        reminder: Boolean(savedNote.reminder),
        lastNotified: savedNote.last_notified || undefined,
        isImportant: Boolean(savedNote.is_important),
        isNotified: Boolean(savedNote.is_notified),
        category: savedNote.category || "",
        tags: savedNote.tags || "",
        created_at: savedNote.created_at,
        updated_at: savedNote.updated_at
      };

      setNotes(prev => [timelineNote, ...prev].sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      ));

      return timelineNote;
    } catch (error) {
      console.error("Not ekleme hatası:", error);
      throw error;
    }
  };

  const updateNoteStatus = (id: string, status: TimelineNote["status"]) => {
    setNotes((prev) =>
      prev.map((note) => (note.id === id ? { ...note, status } : note))
    )
  }

  const deleteNote = (id: string) => {
    setNotes((prev) => prev.filter((note) => note.id !== id))
  }

  const updateNoteLastNotified = (id: string) => {
    setNotes((prev) =>
      prev.map((note) =>
        note.id === id ? { ...note, lastNotified: new Date().toISOString() } : note
      )
    )
  }

  const searchNotes = async (query: string, dateFilteredNotes?: TimelineNote[]) => {
    try {
      const analysis = await analyzeContent(query);
      const notesToSearch = dateFilteredNotes || notes;
      
      const results = notesToSearch.filter(note => {
        const contentMatch = note.content.toLowerCase().includes(query.toLowerCase());
        const titleMatch = note.title.toLowerCase().includes(query.toLowerCase());
        const categoryMatch = analysis.category.some(cat => 
          note.category?.toLowerCase() === cat.toLowerCase()
        );
        const tagMatch = analysis.suggestedTags.some(tag => 
          note.tags?.includes(tag)
        );
        
        return contentMatch || titleMatch || categoryMatch || tagMatch;
      });
      
      setSearchResults(results);
    } catch (error) {
      console.error("Arama hatası:", error);
      setSearchResults([]);
    }
  }

  useEffect(() => {
    const checkOverdueNotes = () => {
      const now = new Date()
      setNotes((prev) =>
        prev.map((note) => {
          if (note.dueDate && note.status === "pending") {
            if (startOfDay(new Date(note.dueDate)) < startOfDay(now)) {
              return { ...note, status: "overdue" }
            }
          }
          return note
        })
      )
    }

    checkOverdueNotes()
    const interval = setInterval(checkOverdueNotes, 1000 * 60 * 60) // Her saat kontrol et
    return () => clearInterval(interval)
  }, [])

  const getSuggestions = async (text: string) => {
    try {
      const suggestion = await generateSimilarText(text, 20)
      return suggestion
    } catch (error) {
      console.error("Öneri alma hatası:", error)
      return ""
    }
  }

  const checkImportantContent = async (content: string) => {
    try {
      // Önemli kelimeleri içeren bir metin oluştur
      const importantKeywords = [
        "önemli",
        "acil",
        "hatırlat",
        "unutma",
        "kritik",
        "kesinlikle",
        "ivedi",
        "hemen",
        "derhal"
      ]
      
      // Markov modelini kullanarak metni analiz et
      const lowercaseContent = content.toLowerCase()
      const hasImportantKeyword = importantKeywords.some(keyword => 
        lowercaseContent.includes(keyword)
      )
      
      if (hasImportantKeyword) {
        return true
      }
      
      // Markov modeli analizi
      const result = await invoke<number>("analyze_importance", { 
        text: content,
        keywords: importantKeywords 
      })
      
      return result > 0.5 // Önem skoru 0.5'ten büyükse önemli kabul et
    } catch (error) {
      console.error("İçerik analizi hatası:", error)
      return false
    }
  }

  return (
    <NotesContext.Provider
      value={{
        notes,
        searchResults,
        setSearchResults,
        addNote,
        updateNoteStatus,
        deleteNote,
        updateNoteLastNotified,
        searchNotes,
        getSuggestions,
        checkImportantContent,
      }}
    >
      {children}
    </NotesContext.Provider>
  )
}

export const useNotes = () => {
  const context = useContext(NotesContext)
  if (!context) throw new Error("useNotes must be used within NotesProvider")
  return context
}

