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
  searchResults: TimelineNote[]
  setSearchResults: React.Dispatch<React.SetStateAction<TimelineNote[]>>
  addNote: (note: Omit<TimelineNote, "id" | "status">) => void
  updateNoteStatus: (id: string, status: TimelineNote["status"]) => void
  deleteNote: (id: string) => void
  updateNoteLastNotified: (id: string) => void
  searchNotes: (query: string, dateFilteredNotes?: TimelineNote[]) => void
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
      // Veri doğrulama
      if (!note.title?.trim() || !note.content?.trim()) {
        throw new Error("Başlık ve içerik alanları zorunludur");
      }

      const noteData = {
        id: null,
        title: note.title.trim(),
        content: note.content.trim(),
        priority: note.priority,
        date: format(note.date, 'yyyy-MM-dd'),
        time: note.dueDate ? format(note.dueDate, 'HH:mm') : '00:00',
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
        status: "pending",
        due_date: note.dueDate?.toISOString(),
        reminder: note.reminder ?? false,
        last_notified: note.lastNotified?.toISOString()
      };

      const savedNote = await invoke<any>('save_note', { note: noteData })
        .catch(error => {
          console.error('Not kaydetme hatası:', error);
          throw new Error('Not kaydedilirken bir hata oluştu. Lütfen tekrar deneyin.');
        });

      if (!savedNote || !savedNote.id) {
        throw new Error('Not kaydedilirken beklenmeyen bir hata oluştu');
      }

      const timelineNote: TimelineNote = {
        id: savedNote.id.toString(),
        title: savedNote.title,
        content: savedNote.content,
        date: new Date(savedNote.date),
        priority: savedNote.priority as "low" | "medium" | "high",
        status: "pending",
        dueDate: savedNote.due_date ? new Date(savedNote.due_date) : undefined,
        reminder: savedNote.reminder,
        lastNotified: savedNote.last_notified ? new Date(savedNote.last_notified) : undefined
      };

      setNotes(prev => [timelineNote, ...prev].sort((a, b) => b.date.getTime() - a.date.getTime()));
      
      return timelineNote;
    } catch (error) {
      console.error('Not ekleme hatası:', error);
      throw error instanceof Error ? error : new Error('Bilinmeyen bir hata oluştu');
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

  const searchNotes = (query: string, dateFilteredNotes?: TimelineNote[]) => {
    if (!query.trim()) {
      setSearchResults([]);
      return;
    }

    const notesToSearch = dateFilteredNotes || notes;
    
    const results = notesToSearch.filter(note => {
      const searchableContent = `${note.title} ${note.content}`.toLowerCase();
      return searchableContent.includes(query.toLowerCase());
    });

    setSearchResults(results);
  };

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
      searchResults,
      setSearchResults,
      addNote, 
      updateNoteStatus, 
      deleteNote,
      updateNoteLastNotified,
      searchNotes
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