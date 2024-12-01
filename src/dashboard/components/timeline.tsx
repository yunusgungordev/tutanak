import { useEffect, useRef, useState } from "react"
import { useNotes } from "@/contexts/notes-context"
import { useTimeline } from "@/contexts/timeline-context"
import { useGesture } from "@use-gesture/react"
import {
  addDays,
  format,
  startOfDay,
  startOfMonth,
  startOfYear,
  subDays,
} from "date-fns"
import { tr } from "date-fns/locale"
import { AnimatePresence, motion } from "framer-motion"
import { Bell, CheckCircle, Clock, Maximize2, Minimize2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Card } from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import { Badge } from "@/components/ui/badge"

import { AddNoteDialog } from "./add-note-dialog"
import { NotificationBell } from "./notification-bell"
import { analyzeSearchQuery, semanticSearch } from "@/lib/ai-helper"
import { TimelineNote } from "@/types"
import { SearchableNote } from "@/lib/ai-helper"

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
  const { notes, searchResults, setSearchResults, searchNotes } = useNotes()
  const { isMinimized, setIsMinimized } = useTimeline()
  const [searchQuery, setSearchQuery] = useState("")
  const [position, setPosition] = useState({ x: 0, y: 0 })
  const [dates, setDates] = useState<Date[]>([])
  const containerRef = useRef<HTMLDivElement>(null)
  const [cellWidth, setCellWidth] = useState(window.innerWidth * 0.7)
  const [activeFilters, setActiveFilters] = useState<{
    categories: string[];
    priorities: ("low" | "medium" | "high")[];
    dateRange: { start: Date | null; end: Date | null };
  }>({
    categories: [],
    priorities: [],
    dateRange: { start: null, end: null }
  });

  useEffect(() => {
    const now = new Date()
    const datesArray = []
    const startDate = subDays(now, 180)

    for (let i = 0; i < 365; i++) {
      datesArray.push(addDays(startDate, i))
    }

    setDates(datesArray)

    // Bugünün konumuna git
    const todayIndex = datesArray.findIndex(
      (date) => startOfDay(date).getTime() === startOfDay(now).getTime()
    )
    setPosition({
      x: -(todayIndex * cellWidth) + window.innerWidth / 2 - cellWidth / 2,
      y: 0,
    })
  }, [])

  const calculatePosition = (index: number) => {
    return -(index * cellWidth) + window.innerWidth / 2 - cellWidth / 2
  }

  const getClampedPosition = (pos: number) => {
    const minPosition = -(dates.length * cellWidth) + window.innerWidth
    const maxPosition = 0
    return Math.min(Math.max(pos, minPosition), maxPosition)
  }

  useEffect(() => {
    if (searchResults.length > 0) {
      const resultIndex = dates.findIndex(
        (date) =>
          startOfDay(date).getTime() === 
          startOfDay(new Date(searchResults[0].date)).getTime()
      )

      if (resultIndex !== -1) {
        const newPosition = calculatePosition(resultIndex)

        // Pozisyonu güncelle ve sınırlar içinde tut
        setPosition({
          x: getClampedPosition(newPosition),
          y: 0,
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
          (date) =>
            startOfDay(date).getTime() ===
            startOfDay(new Date(searchResults[0].date)).getTime()
        )
        if (resultIndex !== -1) {
          const newPosition = calculatePosition(resultIndex)
          setPosition({
            x: getClampedPosition(newPosition),
            y: 0,
          })
        }
      } else {
        // Yoksa bugünün pozisyonuna git
        const todayIndex = dates.findIndex(
          (date) =>
            startOfDay(date).getTime() === startOfDay(new Date()).getTime()
        )
        if (todayIndex !== -1) {
          const newPosition = calculatePosition(todayIndex)
          setPosition({
            x: getClampedPosition(newPosition),
            y: 0,
          })
        }
      }
    }

    handleResize()
    window.addEventListener("resize", handleResize)
    return () => window.removeEventListener("resize", handleResize)
  }, [dates, searchResults])

  const bind = useGesture(
    {
      onDrag: ({ movement: [mx], first, memo }) => {
        if (first) return [position.x]
        const newPosition = getClampedPosition(mx + memo[0])
        setPosition({ x: newPosition, y: 0 })
        return memo
      },
      onWheel: ({ delta: [dx] }) => {
        const newPosition = getClampedPosition(position.x - dx)
        setPosition({ x: newPosition, y: 0 })
      },
    },
    {
      drag: { axis: "x" },
      wheel: { axis: "x" },
    }
  )

  const handleSearch = async (value: string) => {
    setSearchQuery(value);
    
    if (!value.trim()) {
      setSearchResults([]);
      setActiveFilters({
        categories: [],
        priorities: [],
        dateRange: { start: null, end: null }
      });
      return;
    }

    try {
      const queryAnalysis = await analyzeSearchQuery(value);
      
      if (queryAnalysis.type === 'date') {
        handleDateSearch(new Date(queryAnalysis.value));
      } else {
        const notesForSearch = notes.map(note => ({
          ...note,
          isNotified: note.isNotified ?? false,
          isImportant: note.isImportant ?? false,
          date: note.date,
          dueDate: note.dueDate,
          lastNotified: note.lastNotified
        })) as SearchableNote[];

        const searchAnalysis = await semanticSearch(value, notesForSearch);
        
        if (searchAnalysis?.semanticMatches?.length > 0) {
          const matchedNotes = filterNotes(
            notes.filter(note => 
              searchAnalysis.semanticMatches.some(match => 
                match.noteId === note.id && match.relevance > 0.3
              )
            )
          ).sort((a, b) => {
            const aMatch = searchAnalysis.semanticMatches.find(m => m.noteId === a.id);
            const bMatch = searchAnalysis.semanticMatches.find(m => m.noteId === b.id);
            return (bMatch?.relevance || 0) - (aMatch?.relevance || 0);
          });

          setSearchResults(matchedNotes);
          
          if (searchAnalysis.suggestedFilters) {
            setActiveFilters({
              categories: searchAnalysis.suggestedFilters.category || [],
              priorities: searchAnalysis.suggestedFilters.priority || [],
              dateRange: {
                start: searchAnalysis.suggestedFilters.dateRange?.start ? 
                  new Date(searchAnalysis.suggestedFilters.dateRange.start) : null,
                end: searchAnalysis.suggestedFilters.dateRange?.end ? 
                  new Date(searchAnalysis.suggestedFilters.dateRange.end) : null
              }
            });
          }
        } else {
          setSearchResults([]);
        }
      }
    } catch (error) {
      console.error('Arama hatası:', error);
      setSearchResults([]);
    }
  };

  const handleDateSearch = (date: Date) => {
    const matchingNotes = notes.filter(note => 
      startOfDay(new Date(note.date)).getTime() === startOfDay(date).getTime()
    );
    setSearchResults(matchingNotes);
  };

  // Filtreleme fonksiyonu
  const filterNotes = (notesToFilter: TimelineNote[]) => {
    return notesToFilter.filter(note => {
      const categoryMatch = activeFilters.categories.length === 0 || 
        (note.category && activeFilters.categories.includes(note.category));
        
      const priorityMatch = activeFilters.priorities.length === 0 || 
        (note.priority && activeFilters.priorities.includes(note.priority));
        
      const dateMatch = !activeFilters.dateRange.start || !activeFilters.dateRange.end || 
        (new Date(note.date) >= activeFilters.dateRange.start && 
         new Date(note.date) <= activeFilters.dateRange.end);
         
      return categoryMatch && priorityMatch && dateMatch;
    });
  };

  return (
    <div className="flex h-full flex-col">
      <div className="flex items-center justify-between border-b bg-background/50 px-2 py-2 backdrop-blur-sm">
        <div className="flex items-center gap-2">
          <Input
            type="search"
            placeholder="Ara..."
            value={searchQuery}
            onChange={(e) => handleSearch(e.target.value)}
            className="h-9 w-[300px]"
          />
          {activeFilters.categories.length > 0 || 
           activeFilters.priorities.length > 0 || 
           activeFilters.dateRange.start || 
           activeFilters.dateRange.end ? (
            <Button
              variant="ghost"
              size="sm"
              onClick={() => {
                setActiveFilters({
                  categories: [],
                  priorities: [],
                  dateRange: { start: null, end: null }
                });
                handleSearch(searchQuery);
              }}
            >
              Filtreleri Temizle
            </Button>
          ) : null}
        </div>
        
        <div className="flex items-center gap-2">
          <AddNoteDialog />
          <Button
            variant="outline"
            size="icon"
            className="h-9 w-9"
            onClick={() => setIsMinimized(!isMinimized)}
          >
            {isMinimized ? (
              <Maximize2 className="h-4 w-4" />
            ) : (
              <Minimize2 className="h-4 w-4" />
            )}
          </Button>
          <NotificationBell />
        </div>
      </div>
      
      {(activeFilters.categories.length > 0 || 
        activeFilters.priorities.length > 0 || 
        activeFilters.dateRange.start || 
        activeFilters.dateRange.end) && (
        <div className="flex flex-wrap gap-2 p-2 border-b">
          {activeFilters.categories.map(category => (
            <Badge 
              key={category}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => {
                setActiveFilters(prev => ({
                  ...prev,
                  categories: prev.categories.filter(c => c !== category)
                }));
                handleSearch(searchQuery);
              }}
            >
              {category} ×
            </Badge>
          ))}
          
          {activeFilters.priorities.map(priority => (
            <Badge 
              key={priority}
              variant="secondary"
              className="cursor-pointer"
              onClick={() => {
                setActiveFilters(prev => ({
                  ...prev,
                  priorities: prev.priorities.filter(p => p !== priority)
                }));
                handleSearch(searchQuery);
              }}
            >
              {priority === 'high' ? 'Yüksek' : 
               priority === 'medium' ? 'Orta' : 'Düşük'} ×
            </Badge>
          ))}
          
          {(activeFilters.dateRange.start || activeFilters.dateRange.end) && (
            <Badge 
              variant="secondary"
              className="cursor-pointer"
              onClick={() => {
                setActiveFilters(prev => ({
                  ...prev,
                  dateRange: { start: null, end: null }
                }));
                handleSearch(searchQuery);
              }}
            >
              {format(activeFilters.dateRange.start || new Date(), 'dd/MM/yyyy')} - 
              {format(activeFilters.dateRange.end || new Date(), 'dd/MM/yyyy')} ×
            </Badge>
          )}
        </div>
      )}

      <div
        ref={containerRef}
        className="relative flex-1 overflow-hidden bg-white"
        style={{ touchAction: 'none' }}
        {...bind()}
      >
        <motion.div
          style={{ x: position.x }}
          className="absolute inset-0 flex"
        >
          {dates.map((date, index) => (
            <div
              key={index}
              className={`relative h-full flex-shrink-0 border-r ${
                startOfDay(date).getTime() ===
                startOfDay(new Date()).getTime()
                  ? "bg-primary/5"
                  : ""
              }`}
              style={{ width: cellWidth }}
            >
              <div className="scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent h-[calc(100%-40px)] overflow-y-auto p-4">
                <div className="grid auto-rows-[120px] grid-cols-2 gap-2">
                  {notes
                    .filter(
                      (note) =>
                        startOfDay(new Date(note.date)).getTime() === startOfDay(date).getTime()
                    )
                    .map((note) => (
                      <Card
                        key={note.id}
                        className={cn(
                          "h-full transition-shadow hover:shadow-md",
                          note.status === "overdue" && "border-red-500",
                          note.status === "completed" && "opacity-75",
                          searchResults.some((r) => r.id === note.id) &&
                            "ring-2 ring-primary"
                        )}
                      >
                        <div className="flex h-full flex-col p-2">
                          <div className="mb-1 flex items-center justify-between">
                            <div className="flex items-center gap-1">
                              <h4 className="truncate text-sm font-medium">
                                {note.title}
                              </h4>
                              {note.reminder && (
                                <Bell className="h-3 w-3 text-blue-500" />
                              )}
                            </div>
                            <div className="flex items-center gap-1">
                              <span
                                className={cn(
                                  "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2",
                                  note.priority === "high"
                                    ? "bg-red-100 text-red-800"
                                    : note.priority === "medium"
                                      ? "bg-yellow-100 text-yellow-800"
                                      : "bg-green-100 text-green-800"
                                )}
                              >
                                {note.priority === "high"
                                  ? "Yüksek"
                                  : note.priority === "medium"
                                    ? "Orta"
                                    : "Düşük"}
                              </span>
                              {note.status === "completed" && (
                                <CheckCircle className="h-3 w-3 text-green-500" />
                              )}
                            </div>
                          </div>
                          <p className="line-clamp-2 flex-1 text-xs text-muted-foreground">
                            {note.content}
                          </p>
                          {note.dueDate && (
                            <div className="mt-1 flex items-center gap-1 text-xs text-muted-foreground">
                              <Clock className="h-3 w-3" />
                              {format(
                                new Date(note.dueDate),
                                new Date(note.dueDate).getHours() === 23 &&
                                  new Date(note.dueDate).getMinutes() === 59
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

              <div className="absolute bottom-0 left-0 w-full border-t bg-background/50 p-2 backdrop-blur-sm">
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

      {isMinimized && (
        <Button
          variant="outline"
          size="icon"
          className="fixed bottom-4 right-4 h-10 w-10 rounded-full shadow-lg hover:bg-accent"
          onClick={() => setIsMinimized(false)}
        >
          <Maximize2 className="h-4 w-4" />
        </Button>
      )}
    </div>
  )
}
