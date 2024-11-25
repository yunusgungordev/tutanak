export interface ComponentProperties {
  label?: string
  placeholder?: string
  width: number
  height: number
  x: number
  y: number
  options?: string[]
  headers?: string[]
  rows?: string[][]
  striped?: boolean
  bordered?: boolean
  hoverable?: boolean
  sortable?: boolean
  showPagination?: boolean
  pageSize?: number
  resizable?: boolean
}

export interface DraggableComponentType {
  id: string
  type: string
  label: string
  icon: React.ReactNode
  defaultProps: ComponentProperties
} 