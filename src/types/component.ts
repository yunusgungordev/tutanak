import { LayoutConfig } from "./tab"

export interface ComponentProperties {
  margins?: {
    top: number;
    right: number;
    bottom: number;
    left: number;
  };
  fontSize?: number;
  fontFamily?: string;
  lineHeight?: string | number;
  content?: string;
  label?: string
  placeholder?: string
  width: number
  height: number
  x: number
  y: number
  required?: boolean
  disabled?: boolean
  readOnly?: boolean
  hidden?: boolean
  defaultValue?: any
  headers?: string[]
  rows?: string[][]
  striped?: boolean
  bordered?: boolean
  hoverable?: boolean
  sortable?: boolean
  showPagination?: boolean
  pageSize?: number
  resizable?: boolean
  options?: string[]
  multiple?: boolean
  isVisible?: boolean
  validation?: {
    pattern?: string
    minLength?: number
    maxLength?: number
    min?: number
    max?: number
    customValidation?: (value: any) => boolean
  }
  style?: {
    backgroundColor?: string
    textColor?: string
    borderColor?: string
    borderWidth?: number
    borderRadius?: number
    fontSize?: number
    fontWeight?: string
  }
  events?: {
    id: string;
    type: 'click' | 'change' | 'submit';
    action: 'openDialog' | 'showMessage' | 'navigateTab' | 'executeQuery';
    target?: string;
    params?: Record<string, any>;
  }[];
  dependencies?: {
    field: string
    condition: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan'
    value: any
    action: 'show' | 'hide' | 'enable' | 'disable'
  }[]
  tasks?: {
    id: string;
    text: string;
    completed: boolean;
    createdAt: string;
  }[];
}

export interface DraggableComponentType {
  id: string
  type: string
  label: string
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