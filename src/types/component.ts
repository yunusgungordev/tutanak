export interface ComponentProperties {
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
    onChange?: (value: any) => void
    onFocus?: () => void
    onBlur?: () => void
    onClick?: () => void
  }
  dependencies?: {
    field: string
    condition: 'equals' | 'notEquals' | 'contains' | 'greaterThan' | 'lessThan'
    value: any
    action: 'show' | 'hide' | 'enable' | 'disable'
  }[]
}

export interface DraggableComponentType {
  id: string
  type: string
  label: string
  icon: React.ReactNode
  defaultProps: ComponentProperties
} 