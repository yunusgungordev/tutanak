import React, { createContext, useContext, useState } from "react"

type TimelineContextType = {
  isMinimized: boolean
  setIsMinimized: (value: boolean) => void
}

const TimelineContext = createContext<TimelineContextType | undefined>(undefined)

export function TimelineProvider({ children }: { children: React.ReactNode }) {
  const [isMinimized, setIsMinimized] = useState(false)

  return (
    <TimelineContext.Provider value={{ isMinimized, setIsMinimized }}>
      {children}
    </TimelineContext.Provider>
  )
}

export function useTimeline() {
  const context = useContext(TimelineContext)
  if (!context) {
    throw new Error("useTimeline must be used within a TimelineProvider")
  }
  return context
} 