import { ComponentProperties } from "@/types/component"
import { LayoutConfig } from "@/types/tab";

interface DraggableComponentType {
  id: string;
  type: string;
  label: string;
  icon: React.ReactNode;
  properties: ComponentProperties;
  defaultProps: ComponentProperties;
  description?: string;
}

interface DraggableComponentProps {
  component: DraggableComponentType;
  onAddComponent: (component: DraggableComponentType) => void;
  item: LayoutConfig
  layout: LayoutConfig[]
  setLayout: (layout: LayoutConfig[]) => void
  selectedComponent: string | null
  onSelect: (id: string) => void
  renderComponentPreview: (item: LayoutConfig) => React.ReactNode
  onDelete: (componentId: string) => void
  onContentUpdate: (updatedConfig: LayoutConfig) => void
  onEventTrigger: (event: any, eventConfig: any) => void
  gridBounds: {
    width: number
    height: number
    padding: number
  }
}

export function DraggableComponent({
  component,
  onAddComponent,
}: DraggableComponentProps) {
  return (
    <button
      onClick={() => onAddComponent(component)}
      className="flex items-center gap-2 rounded-md p-2 text-sm hover:bg-muted"
    >
      {component.icon}
      <span>{component.label}</span>
    </button>
  )
}
