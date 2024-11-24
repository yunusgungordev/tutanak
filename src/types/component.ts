export type DraggableComponentType = {
  id: string
  type: "input" | "select" | "textarea" | "table" | "button" | "checkbox"
  label: string
  icon: React.ReactNode
  defaultProps: {
    label?: string
    placeholder?: string
    width?: number
    height?: number
    options?: string[]
  }
} 