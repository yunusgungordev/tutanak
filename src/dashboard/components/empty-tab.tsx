import { useState } from "react"

import { Card } from "@/components/ui/card"

import { TemplatePanel } from "./template-panel"

interface EmptyTabProps {
  label: string
}

export function EmptyTab({ label }: EmptyTabProps) {
  return (
    <div className="flex h-full items-center justify-center">
      <div className="text-center">
        <h2 className="text-2xl font-bold text-muted-foreground">{label}</h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Bu alan düzenlenebilir
        </p>
      </div>
    </div>
  )
}
