import { ComponentType } from "react"
import { ComponentProperties as BaseComponentProperties } from "@/types/component"
import { EventAction } from './component'

export type TabContent = {
  id: string
  type: string
  component: React.ComponentType<{ label: string }>
  icon: React.ReactNode
  label: string
  layout?: LayoutConfig[]
  fields?: Field[]
  database?: {
    table_name: string
    fields: Field[]
  }
}

export interface DynamicTabConfig {
  id: string
  label: string
  type: string
  layout: LayoutConfig[]
  fields: Field[]
  database: {
    table_name: string
    fields: Field[]
  }
  created_at?: string
}

export interface LayoutConfig {
  id: string
  type: string
  properties: ComponentProperties
  onContentUpdate?: (updatedConfig: LayoutConfig) => void
}

export interface Field {
  name: string
  type: string
}

export type ComponentEvent = {
  id: string
  type: string
  action: EventAction
  targetComponent?: string
  params?: Record<string, any>
}

interface ComponentProperties extends BaseComponentProperties {
  events?: ComponentEvent[];
}
