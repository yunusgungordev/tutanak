import { ComponentType } from "react"
import { ComponentProperties as BaseComponentProperties } from "@/types/component"

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

interface EventConfig {
  type: string;
  action: string;
  params?: Record<string, any>;
  componentId?: string;
}

export type EventAction = "showMessage" | "navigateTab" | "openDialog" | "executeQuery" | "setValue"

export interface ComponentEvent {
  id: string
  type: "click" | "change" | "submit"
  action: EventAction
  targetComponent?: string
  params?: {
    message?: string
    tabId?: string
    dialogId?: string
    query?: string
    value?: string
  }
}

interface ComponentProperties extends BaseComponentProperties {
  events?: ComponentEvent[];
}
