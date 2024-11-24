import { ComponentType } from "react"

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
  properties: {
    x: number;
    y: number;
    width: number;
    height: number;
    label?: string;
    placeholder?: string;
    options?: string[];
  };
}

export interface Field {
  name: string;
  type: string;
}