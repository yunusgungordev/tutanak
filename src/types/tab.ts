import { ComponentType } from "react"
import { ComponentProperties } from "./component"

export type TabContent = {
  id: string
  type: string
  component: React.ComponentType<{ label: string }>
  icon: React.ReactNode
  label: string
} 

export interface DynamicTabConfig {
  id: string;
  label: string;
  type: string;
  layout: LayoutConfig[];
  database: {
    tableName: string;
    fields: Field[];
  };
  created_at?: string;
}

export interface LayoutConfig {
  id: string;
  type: string;
  properties: ComponentProperties;
}

export interface Field {
  name: string;
  type: string;
}