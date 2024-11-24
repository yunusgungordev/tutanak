import { useState, useEffect, useRef } from "react"
import { Card } from "@/components/ui/card"
import { format, startOfYear, startOfMonth, startOfDay, subDays, addDays } from "date-fns"
import { tr } from "date-fns/locale"
import { motion, AnimatePresence } from "framer-motion"
import { useGesture } from "@use-gesture/react"
import { useNotes } from "@/contexts/notes-context"
import { Bell, CheckCircle, Clock, Minimize2, Maximize2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { AddNoteDialog } from "./add-note-dialog"
import { Button } from "@/components/ui/button"
import { NotificationBell } from "./notification-bell"
import { Input } from "@/components/ui/input"

const HOUR_WIDTH = 100
const MINUTE_MARK_HEIGHT = 10
const HOUR_MARK_HEIGHT = 20
const DAY_MARK_HEIGHT = 50
const MONTH_MARK_HEIGHT = 65
const YEAR_MARK_HEIGHT = 80

function isNewDay(current: Date, prev?: Date) {
  if (!prev) return true
  return startOfDay(current).getTime() !== startOfDay(prev).getTime()
}

function isNewMonth(current: Date, prev?: Date) {
  if (!prev) return true
  return startOfMonth(current).getTime() !== startOfMonth(prev).getTime()
}

function isNewYear(current: Date, prev?: Date) {
  if (!prev) return true
  return startOfYear(current).getTime() !== startOfYear(prev).getTime()
}

export function Timeline() {
  const { notes, searchResults, searchNotes } = useNotes()
  const [searchQuery, setSearchQuery] = useState("")
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dates, setDates] = useState<Date[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [cellWidth, setCellWidth] = useState(window.innerWidth * 0.7)
  const [isMinimized, setIsMinimized] = useState(false)

  useEffect(() => {
    const now = new Date()
    const datesArray = []
    const startDate = subDays(now, 15)
    
    for (let i = 0; i < 31; i++) {
      datesArray.push(addDays(startDate, i))
    }
    
    setDates(datesArray)
    
    // Bugünün konumuna git
    const todayIndex = datesArray.findIndex(
      date => startOfDay(date).getTime() === startOfDay(now).getTime()
    )
    setPosition({ x: -(todayIndex * cellWidth) + (window.innerWidth / 2) - (cellWidth / 2), y: 0 })
  }, [])

  const calculatePosition = (index: number) => {
    return -(index * cellWidth) + (window.innerWidth / 2) - (cellWidth / 2)
  }

  const getClampedPosition = (pos: number) => {
    const minPosition = -(dates.length * cellWidth) + window.innerWidth
    const maxPosition = 0
    return Math.min(Math.max(pos, minPosition), maxPosition)
  }

  useEffect(() => {
    if (searchResults.length > 0) {
      const firstResult = searchResults[0]
      const resultIndex = dates.findIndex(
        date => startOfDay(date).getTime() === startOfDay(firstResult.date).getTime()
      )
      
      if (resultIndex !== -1) {
        const newPosition = calculatePosition(resultIndex)
        
        // Pozisyonu güncelle ve sınırlar içinde tut
        setPosition({ 
          x: getClampedPosition(newPosition), 
          y: 0 
        })
      }
    }
  }, [searchResults, dates, cellWidth])

  useEffect(() => {
    const handleResize = () => {
      const newCellWidth = Math.min(window.innerWidth * 0.7, 600)
      setCellWidth(newCellWidth)
      
      // Eğer arama sonucu varsa, o pozisyona git
      if (searchResults.length > 0) {
        const resultIndex = dates.findIndex(
          date => startOfDay(date).getTime() === startOfDay(searchResults[0].date).getTime()
        )
        if (resultIndex !== -1) {
          const newPosition = calculatePosition(resultIndex)
          setPosition({ 
            x: getClampedPosition(newPosition), 
            y: 0 
          })
        }
      } else {
        // Yoksa bugünün pozisyonuna git
        const todayIndex = dates.findIndex(
          date => startOfDay(date).getTime() === startOfDay(new Date()).getTime()
        )
        if (todayIndex !== -1) {
          const newPosition = calculatePosition(todayIndex)
          setPosition({ 
            x: getClampedPosition(newPosition), 
            y: 0 
          })
        }
      }
    }

    handleResize()
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [dates, searchResults])

  const bind = useGesture({
    onDrag: ({ movement: [mx], first, memo }) => {
      if (first) return [position.x]
      const newPosition = getClampedPosition(mx + memo[0])
      setPosition({ x: newPosition, y: 0 })
      return memo
    },
    onWheel: ({ delta: [dx] }) => {
      const newPosition = getClampedPosition(position.x - dx)
      setPosition({ x: newPosition, y: 0 })
    }
  }, {
    drag: { axis: "x" },
    wheel: { axis: "x" }
  })

  const handleSearch = (value: string) => {
    setSearchQuery(value)
    searchNotes(value)
  }

  return (
    <AnimatePresence>
      {isMinimized ? (
        <motion.div
          initial={{ opacity: 0, scale: 0.8 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.8 }}
          className="fixed bottom-4 right-4 z-50"
        >
          <Button
            variant="outline"
            size="icon"
            className="h-10 w-10 rounded-full shadow-lg bg-background hover:bg-accent"
            onClick={() => setIsMinimized(false)}
          >
            <Maximize2 className="h-4 w-4" />
          </Button>
        </motion.div>
      ) : (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className={cn(
            "flex flex-col",
            isMinimized ? "h-0" : "h-full"
          )}
        >
          {!isMinimized && (
            <div className="flex items-center justify-between py-2 px-2 bg-background/50 backdrop-blur-sm border-b">
              <div className="flex items-center gap-2">
                <NotificationBell />
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8"
                  onClick={() => setIsMinimized(true)}
                >
                  <Minimize2 className="h-4 w-4" />
                </Button>
              </div>
              <div className="flex items-center gap-4">
                <Input
                  type="search"
                  placeholder="Tarih veya kelime ile ara..."
                  value={searchQuery}
                  onChange={(e) => handleSearch(e.target.value)}
                  className="w-[300px] h-9"
                />
                <AddNoteDialog />
              </div>
            </div>
          )}
          
          <div 
            ref={containerRef}
            className="flex-1 relative bg-white overflow-hidden"
            {...bind()}
          >
            <motion.div
              style={{ x: position.x }}
              className="absolute inset-0 flex"
            >
              {dates.map((date, index) => (
                <div 
                  key={index}
                  className={`relative flex-shrink-0 border-r h-full ${
                    startOfDay(date).getTime() === startOfDay(new Date()).getTime()
                      ? "bg-primary/5"
                      : ""
                  }`}
                  style={{ width: cellWidth }}
                >
                  <div className="p-4 h-[calc(100%-40px)] overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                    <div className="grid grid-cols-2 gap-2 auto-rows-[120px]">
                      {notes
                        .filter(note => startOfDay(new Date(note.date)).getTime() === startOfDay(date).getTime())
                        .map(note => (
                          <Card 
                            key={note.id} 
                            className={cn(
                              "hover:shadow-md transition-shadow h-full",
                              note.status === "overdue" && "border-red-500",
                              note.status === "completed" && "opacity-75",
                              searchResults.some(r => r.id === note.id) && "ring-2 ring-primary"
                            )}
                          >
                            <div className="p-2 h-full flex flex-col">
                              <div className="flex items-center justify-between mb-1">
                                <div className="flex items-center gap-1">
                                  <h4 className="font-medium text-sm truncate">{note.title}</h4>
                                  {note.reminder && (
                                    <Bell className="w-3 h-3 text-blue-500" />
                                  )}
                                </div>
                                <div className="flex items-center gap-1">
                                  <span className={cn(
                                    "text-xs px-1.5 py-0.5 rounded-full",
                                    note.priority === "high" ? "bg-red-100 text-red-800" :
                                    note.priority === "medium" ? "bg-yellow-100 text-yellow-800" :
                                    "bg-green-100 text-green-800"
                                  )}>
                                    {note.priority}
                                  </span>
                                  {note.status === "completed" && (
                                    <CheckCircle className="w-3 h-3 text-green-500" />
                                  )}
                                </div>
                              </div>
                              <p className="text-xs text-muted-foreground line-clamp-2 flex-1">{note.content}</p>
                              {note.dueDate && (
                                <div className="mt-1 text-xs text-muted-foreground flex items-center gap-1">
                                  <Clock className="w-3 h-3" />
                                  {format(
                                    note.dueDate, 
                                    note.dueDate.getHours() === 23 && note.dueDate.getMinutes() === 59 
                                      ? "d MMM" 
                                      : "d MMM HH:mm", 
                                    { locale: tr }
                                  )}
                                </div>
                              )}
                            </div>
                          </Card>
                        ))}
                    </div>
                  </div>

                  <div className="absolute bottom-0 left-0 w-full p-2 border-t bg-background/50 backdrop-blur-sm">
                    <div className="flex items-center justify-center gap-2">
                      <span className="text-sm font-medium">
                        {format(date, "d MMM", { locale: tr })}
                      </span>
                      <span className="text-sm text-muted-foreground">
                        {format(date, "EEEE", { locale: tr })}
                      </span>
                    </div>
                  </div>
                </div>
              ))}
            </motion.div>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  )
}