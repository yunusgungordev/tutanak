import { useNotes } from "@/contexts/notes-context"
import { addHours, isAfter, isBefore, addDays, startOfDay, format } from "date-fns"
import { tr } from "date-fns/locale"
import { Bell } from "lucide-react"

import { Button } from "@/components/ui/button"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { ScrollArea } from "@/components/ui/scroll-area"

export function NotificationBell() {
  const { notes, updateNoteLastNotified } = useNotes()

  const importantNotifications = notes.filter((note) => {
    if (!note.dueDate || note.status === "completed") {
      return false
    }

    const now = new Date()
    const dueDate = new Date(note.dueDate)
    
    const isSameDay = startOfDay(now).getTime() === startOfDay(dueDate).getTime()
    const isUpcoming = isBefore(now, dueDate)
    const isNotExpired = !isAfter(now, addDays(dueDate, 1))
    const canNotify = !note.lastNotified || isAfter(now, addHours(note.lastNotified, 1))

    const isAIImportant = note.isImportant
    const hasReminder = note.reminder

    return (
      (isAIImportant || hasReminder) &&
      (isUpcoming || isSameDay) &&
      canNotify &&
      !note.isNotified
    )
  })

  const notificationCount = importantNotifications.length

  const handleNotificationClick = (noteId: string) => {
    updateNoteLastNotified(noteId)
  }

  return (
    <Popover>
      <PopoverTrigger asChild>
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
      </PopoverTrigger>
      <PopoverContent className="w-80" align="end">
        <ScrollArea className="h-[300px]">
          <div className="space-y-2 p-2">
            <h4 className="mb-4 font-medium">Bildirimler</h4>
            {importantNotifications.length > 0 ? (
              importantNotifications.map((note) => (
                <div
                  key={note.id}
                  className="flex items-start justify-between rounded-lg border p-3 hover:bg-muted/50"
                >
                  <div className="space-y-1">
                    <p className="text-sm font-medium">{note.title}</p>
                    <p className="text-xs text-muted-foreground">
                      Son Tarih: {format(new Date(note.dueDate!), "dd MMMM yyyy HH:mm", { locale: tr })}
                    </p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleNotificationClick(note.id)}
                  >
                    Okundu
                  </Button>
                </div>
              ))
            ) : (
              <p className="text-center text-sm text-muted-foreground">
                Bildirim bulunmuyor
              </p>
            )}
          </div>
        </ScrollArea>
      </PopoverContent>
    </Popover>
  )
}
