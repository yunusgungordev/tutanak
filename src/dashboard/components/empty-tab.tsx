import { TemplatePanel } from "./template-panel"
import { useState } from "react"
import { Card } from "@/components/ui/card"

interface EmptyTabProps {
  label: string
}

export function EmptyTab({ label }: EmptyTabProps) {
  return (
    <div className="flex items-center justify-center h-full">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-muted-foreground">{label}</h2>
        <p className="text-sm text-muted-foreground mt-2">Bu alan düzenlenebilir</p>
      </div>
    </div>
  )
} 