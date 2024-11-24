import { ComponentType } from "react"

export type TabContent = {
  id: string
  type: string
  component: React.ComponentType<{ label: string }>
  icon: React.ReactNode
  label: string
} 