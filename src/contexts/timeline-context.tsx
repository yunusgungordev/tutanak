import React, { createContext, useContext, useState } from "react"

type TimelineContextType = {
  isMinimized: boolean
  setIsMinimized: (value: boolean) => void
}

const TimelineContext = createContext<TimelineContextType | undefined>(
  undefined
)

export function TimelineProvider({ children }: { children: React.ReactNode }) {
  const [isMinimized, setIsMinimized] = useState(() => {
    try {
      const savedState = localStorage.getItem("timelineMinimized")
      return savedState === "true"
    } catch {
      return false
    }
  })

  const handleSetIsMinimized = (value: boolean) => {
    try {
      setIsMinimized(value)
      localStorage.setItem("timelineMinimized", value.toString())
    } catch (error) {
      console.error("Timeline durumu kaydedilemedi:", error)
    }
  }

  return (
    <TimelineContext.Provider
      value={{
        isMinimized,
        setIsMinimized: handleSetIsMinimized,
      }}
    >
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
