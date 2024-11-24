import { Bell } from "lucide-react"
import { Button } from "@/components/ui/button"
import { useNotes } from "@/contexts/notes-context"
import { isAfter, isBefore, addHours } from "date-fns"

export function NotificationBell() {
  const { notes } = useNotes()
  
  const importantNotifications = notes.filter(note => {
    if (!note.dueDate || note.status === "completed") return false
    
    const now = new Date()
    const isUpcoming = isBefore(now, note.dueDate) && isAfter(now, addHours(note.dueDate, -24))
    
    const canNotify = !note.lastNotified || isAfter(now, addHours(note.lastNotified, 1))
    
    return (note.priority === "high" || note.reminder) && isUpcoming && canNotify
  })

  const notificationCount = importantNotifications.length

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative hover:bg-muted/50 transition-colors"
      title={`${notificationCount} adet bildirim`}
    >
      <Bell className="w-4 h-4" />
      {notificationCount > 0 && (
        <span className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full w-4 h-4 flex items-center justify-center">
          {notificationCount}
        </span>
      )}
    </Button>
  )
} 