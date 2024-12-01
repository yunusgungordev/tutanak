import { createContext, useContext, useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/tauri"
import { format, startOfDay } from "date-fns"
import { generateSimilarText, trainAIModel } from "@/lib/ai-helper"

interface Note {
    id: string | null;
    title: string;
    content: string;
    created_at: string;
    updated_at: string;
    reminder?: boolean;
    status?: string;
    due_date?: string;
    last_notified?: string;
    is_notified?: boolean;
    is_important?: boolean;
}

interface TimelineNote {
  id: string
  title: string
  content: string
  date: Date
  priority: "low" | "medium" | "high"
  status: "pending" | "completed" | "overdue"
  dueDate?: Date
  reminder?: boolean
  lastNotified?: Date
  isImportant?: boolean
  isNotified?: boolean
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

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const result = await invoke<Note[]>('get_all_notes');
        const timelineNotes = result.map(note => ({
            id: note.id?.toString() || crypto.randomUUID(),
            title: note.title,
            content: note.content,
            date: new Date(note.created_at),
            priority: "medium" as const,
            status: (note.status as TimelineNote["status"]) || "pending",
            dueDate: note.due_date ? new Date(note.due_date) : undefined,
            reminder: note.reminder,
            lastNotified: note.last_notified ? new Date(note.last_notified) : undefined,
            isImportant: note.is_important,
            isNotified: note.is_notified
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
      if (!note.title?.trim() || !note.content?.trim()) {
        throw new Error("Başlık ve içerik alanları zorunludur")
      }

      const isImportant = await checkImportantContent(note.content)
      console.log("Not önemli mi:", isImportant)

      const noteData = {
        id: null,
        title: note.title.trim(),
        content: note.content.trim(),
        priority: note.priority,
        date: format(note.date, "yyyy-MM-dd"),
        time: note.dueDate ? format(note.dueDate, "HH:mm") : "00:00",
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "pending",
        due_date: note.dueDate?.toISOString() || null,
        reminder: note.reminder,
        last_notified: note.lastNotified?.toISOString() || null,
        is_important: isImportant,
        is_notified: false
      }

      const savedNote = await invoke<{
        id: number;
        title: string;
        content: string;
        priority: string;
        date: string;
        time: string;
        status: string;
        due_date: string | null;
        reminder: number;
        last_notified: string | null;
        is_important: number;
        is_notified: number;
      }>("save_note", { note: noteData })

      if (!savedNote?.id) {
        throw new Error("Not kaydedilirken beklenmeyen bir hata oluştu")
      }

      const timelineNote: TimelineNote = {
        id: savedNote.id.toString(),
        title: savedNote.title,
        content: savedNote.content,
        date: new Date(savedNote.date),
        priority: savedNote.priority as "low" | "medium" | "high",
        status: "pending",
        dueDate: savedNote.due_date ? new Date(savedNote.due_date) : undefined,
        reminder: Boolean(savedNote.reminder),
        lastNotified: savedNote.last_notified ? new Date(savedNote.last_notified) : undefined,
        isImportant: Boolean(savedNote.is_important),
        isNotified: Boolean(savedNote.is_notified)
      }

      setNotes((prev) =>
        [timelineNote, ...prev].sort(
          (a, b) => b.date.getTime() - a.date.getTime()
        )
      )

      await trainAIModel(note.content)
      return timelineNote

    } catch (error) {
      console.error("Not ekleme hatası:", error)
      throw error instanceof Error ? error : new Error("Bilinmeyen bir hata oluştu")
    }
  }

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
        note.id === id ? { ...note, lastNotified: new Date() } : note
      )
    )
  }

  const searchNotes = (query: string, dateFilteredNotes?: TimelineNote[]) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const notesToSearch = dateFilteredNotes || notes

    const results = notesToSearch.filter((note) => {
      const searchableContent = `${note.title} ${note.content}`.toLowerCase()
      return searchableContent.includes(query.toLowerCase())
    })

    setSearchResults(results)
  }

  useEffect(() => {
    const checkOverdueNotes = () => {
      const now = new Date()
      setNotes((prev) =>
        prev.map((note) => {
          if (note.dueDate && note.status === "pending") {
            if (startOfDay(note.dueDate) < startOfDay(now)) {
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

