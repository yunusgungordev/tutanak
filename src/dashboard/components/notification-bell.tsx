import { useNotes } from "@/contexts/notes-context"
import { addHours, isAfter, isBefore, addDays, startOfDay } from "date-fns"
import { Bell } from "lucide-react"

import { Button } from "@/components/ui/button"

export function NotificationBell() {
  const { notes } = useNotes()

  const importantNotifications = notes.filter((note) => {
    if (!note.dueDate || note.status === "completed") {
      console.log("Not elendi - dueDate yok veya completed:", note)
      return false
    }

    const now = new Date()
    const dueDate = new Date(note.dueDate)
    
    const isSameDay = startOfDay(now).getTime() === startOfDay(dueDate).getTime()
    const isUpcoming = isBefore(now, dueDate)
    const isNotExpired = !isAfter(now, addDays(dueDate, 1))

    console.log("Not durumu:", {
      id: note.id,
      title: note.title,
      dueDate: note.dueDate,
      isSameDay,
      isUpcoming,
      isNotExpired,
      isNotified: note.isNotified,
      canNotify: !note.lastNotified || isAfter(now, addHours(note.lastNotified, 1)),
      hasImportantContent: note.isImportant
    })
    
    const canNotify = !note.lastNotified || isAfter(now, addHours(note.lastNotified, 1))

    return (
      (note.priority === "high" || note.reminder || note.isImportant) &&
      (isUpcoming || isSameDay) &&
      canNotify &&
      !note.isNotified
    )
  })

  const notificationCount = importantNotifications.length

  return (
    <Button
      variant="ghost"
      size="sm"
      className="relative transition-colors hover:bg-muted/50"
      title={`${notificationCount} adet bildirim`}
    >
      <Bell className="h-4 w-4" />
      {notificationCount > 0 && (
        <span className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-red-500 text-xs text-white">
          {notificationCount}
        </span>
      )}
    </Button>
  )
}
