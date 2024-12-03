import { LayoutConfig } from "./tab"

export type EventAction = "showMessage" | "navigateTab" | "openDialog" | "executeQuery" | "setValue" | "updateCanvas"

export interface ComponentProperties {
  label?: string;
  placeholder?: string;
  width: number;
  height: number;
  x: number;
  y: number;
  pageSize?: number;
  
  // Text bileşeni için eklenen özellikler
  content?: string;
  fontSize?: number;
  fontFamily?: string;
  fontWeight?: "normal" | "bold";
  color?: string;
  textAlign?: "left" | "center" | "right";
  
  // Diğer bileşenlere ait özellikler...
  options?: string[];
  headers?: string[];
  rows?: string[][];
  striped?: boolean;
  bordered?: boolean;
  hoverable?: boolean;
  sortable?: boolean;
  resizable?: boolean;
  showPagination?: boolean;
  isVisible?: boolean;
  tasks?: {
    id: string;
    text: string;
    completed: boolean;
    createdAt: string;
  }[];
  events?: {
    id: string;
    type: string;
    action: EventAction;
    targetComponent?: string;
    params?: Record<string, any>;
  }[];
  onEventTrigger?: (event: any, eventConfig: any) => void;
  value?: string;
}

export interface DraggableComponentType {
  id: string
  type: string
  label: string
  description?: string
  icon: React.ReactNode
  defaultProps: ComponentProperties
}

export interface DraggableComponentProps {
  item: LayoutConfig
  layout: LayoutConfig[]
  setLayout: (layout: LayoutConfig[]) => void
  selectedComponent: string | null
  onSelect: (id: string) => void
  renderComponentPreview: (item: LayoutConfig) => React.ReactNode
  gridWidth: number
  gridHeight: number
}

export type FontWeight = "normal" | "bold";
export type TextAlign = "left" | "center" | "right";
