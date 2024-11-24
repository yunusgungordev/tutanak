import { createContext, useContext, useState, useEffect } from "react"
import { startOfDay } from "date-fns"
import { invoke } from "@tauri-apps/api/tauri"
import { format } from "date-fns"

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
}

interface NotesContextType {
  notes: TimelineNote[]
  addNote: (note: Omit<TimelineNote, "id" | "status">) => void
  updateNoteStatus: (id: string, status: TimelineNote["status"]) => void
  deleteNote: (id: string) => void
  updateNoteLastNotified: (id: string) => void
  searchNotes: (query: string) => void
  searchResults: TimelineNote[]
}

const NotesContext = createContext<NotesContextType | undefined>(undefined)

export function NotesProvider({ children }: { children: React.ReactNode }) {
  const [notes, setNotes] = useState<TimelineNote[]>([])
  const [searchResults, setSearchResults] = useState<TimelineNote[]>([])

  useEffect(() => {
    const loadNotes = async () => {
      try {
        const dbNotes = await invoke<TimelineNote[]>('get_notes')
        const timelineNotes: TimelineNote[] = dbNotes.map(note => {
          const [year, month, day] = note.date.toString().split('-').map(Number);
          const localDate = new Date(year, month - 1, day);
          
          return {
            id: note.id?.toString() || crypto.randomUUID(),
            title: note.title,
            content: note.content,
            date: localDate,
            priority: note.priority as "low" | "medium" | "high",
            status: "pending",
            dueDate: note.dueDate ? new Date(note.dueDate) : undefined,
            reminder: note.reminder,
            lastNotified: note.lastNotified ? new Date(note.lastNotified) : undefined
          }
        })
        setNotes(timelineNotes)
      } catch (error) {
        console.error('Notlar yüklenirken hata:', error)
      }
    }

    loadNotes()
  }, [])

  const addNote = async (note: Omit<TimelineNote, "id" | "status">) => {
    try {
      const noteData = {
        id: null,
        title: note.title,
        content: note.content,
        priority: note.priority,
        date: note.date.toISOString(),
        time: note.dueDate ? format(note.dueDate, 'HH:mm') : '00:00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "pending",
        due_date: note.dueDate?.toISOString(),
        reminder: note.reminder,
        last_notified: note.lastNotified?.toISOString()
      };

      await invoke('save_note', { note: noteData });
      
      // Notları yeniden yükle
      const dbNotes = await invoke<TimelineNote[]>('get_notes');
      const timelineNotes: TimelineNote[] = dbNotes.map(note => ({
        id: note.id?.toString() || crypto.randomUUID(),
        title: note.title,
        content: note.content,
        date: new Date(note.date),
        priority: note.priority as "low" | "medium" | "high",
        status: "pending",
        dueDate: note.dueDate ? new Date(note.dueDate) : undefined,
        reminder: note.reminder,
        lastNotified: note.lastNotified ? new Date(note.lastNotified) : undefined
      }));
      
      setNotes(timelineNotes);
    } catch (error) {
      console.error('Not eklenirken hata:', error);
      throw error;
    }
  };

  const updateNoteStatus = (id: string, status: TimelineNote["status"]) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, status } : note
    ))
  }

  const deleteNote = (id: string) => {
    setNotes(prev => prev.filter(note => note.id !== id))
  }

  const updateNoteLastNotified = (id: string) => {
    setNotes(prev => prev.map(note => 
      note.id === id ? { ...note, lastNotified: new Date() } : note
    ))
  }

  const searchNotes = (query: string) => {
    if (!query.trim()) {
      setSearchResults([])
      return
    }

    const results = notes.filter(note => {
      const searchDate = new Date(query)
      const isValidDate = !isNaN(searchDate.getTime())

      if (isValidDate) {
        return startOfDay(note.date).getTime() === startOfDay(searchDate).getTime()
      }

      return (
        note.title.toLowerCase().includes(query.toLowerCase()) ||
        note.content.toLowerCase().includes(query.toLowerCase())
      )
    })

    setSearchResults(results)
  }

  useEffect(() => {
    const checkOverdueNotes = () => {
      const now = new Date()
      setNotes(prev => prev.map(note => {
        if (note.dueDate && note.status === "pending") {
          if (startOfDay(note.dueDate) < startOfDay(now)) {
            return { ...note, status: "overdue" }
          }
        }
        return note
      }))
    }

    checkOverdueNotes()
    const interval = setInterval(checkOverdueNotes, 1000 * 60 * 60) // Her saat kontrol et
    return () => clearInterval(interval)
  }, [])

  return (
    <NotesContext.Provider value={{ 
      notes, 
      addNote, 
      updateNoteStatus, 
      deleteNote, 
      updateNoteLastNotified,
      searchNotes,
      searchResults 
    }}>
      {children}
    </NotesContext.Provider>
  )
}

export const useNotes = () => {
  const context = useContext(NotesContext)
  if (!context) throw new Error("useNotes must be used within NotesProvider")
  return context
} 