export interface ComponentProperties {
  label?: string
  placeholder?: string
  width: number
  height: number
  x: number
  y: number
  options?: string[]
  headers?: string[]
}

export interface DraggableComponentType {
  id: string
  type: string
  label: string
  icon: React.ReactNode
  defaultProps: ComponentProperties
} 