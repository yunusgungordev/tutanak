import { useInteractable } from "@/hooks/use-interactable"
import { cn } from "@/lib/utils"
import { LayoutConfig } from "@/types/tab"
import { TaskMenu } from "@/dashboard/components/task-menu"
import { ComponentProperties } from "@/types/component"

interface DraggableComponentProps {
  item: LayoutConfig
  layout: LayoutConfig[]
  setLayout: (layout: LayoutConfig[]) => void
  selectedComponent: string | null
  onSelect: (id: string) => void
  renderComponentPreview: (item: LayoutConfig) => React.ReactNode
  gridWidth: number
  gridHeight: number
}

const GRID_SNAP = 10

// Bileşen hizalama yardımcısı
const getSnapPosition = (value: number): number => {
    return Math.round(value / GRID_SNAP) * GRID_SNAP
  }

// Bileşen pozisyonlama ve boyutlandırma için yardımcı fonksiyonlar
const handleDragStop = ({ x, y }: { x: number, y: number }, item: LayoutConfig, layout: LayoutConfig[], setLayout: (layout: LayoutConfig[]) => void) => {
    const newLayout = [...layout]
    const index = newLayout.findIndex(l => l.id === item.id)
    if (index !== -1) {
      newLayout[index] = {
        ...newLayout[index],
        properties: {
          ...newLayout[index].properties,
          x: getSnapPosition(x),
          y: getSnapPosition(y)
        }
      }
    }
    setLayout(newLayout)
  }
  
  const handleResizeStop = ({ width, height, x, y }: { width: number, height: number, x: number, y: number }, item: LayoutConfig, layout: LayoutConfig[], setLayout: (layout: LayoutConfig[]) => void) => {
    const newLayout = [...layout]
    const index = newLayout.findIndex(l => l.id === item.id)
    if (index !== -1) {
      newLayout[index] = {
        ...newLayout[index],
        properties: {
          ...newLayout[index].properties,
          width: getSnapPosition(width),
          height: getSnapPosition(height),
          x: getSnapPosition(x),
          y: getSnapPosition(y)
        }
      }
    }
    setLayout(newLayout)
  }

export function DraggableComponent({
  item,
  layout,
  setLayout,
  selectedComponent,
  onSelect,
  renderComponentPreview,
  gridWidth,
  gridHeight
}: DraggableComponentProps) {
  const ref = useInteractable(
    item.id,
    (x: number, y: number) => handleDragStop({ x, y }, item, layout, setLayout),
    (width: number, height: number, x: number, y: number) => 
      handleResizeStop({ width, height, x, y }, item, layout, setLayout),
    item.properties.x,
    item.properties.y
  )

  const handleTaskUpdate = (tasks: ComponentProperties['tasks']) => {
    const newLayout = [...layout]
    const index = newLayout.findIndex(l => l.id === item.id)
    if (index !== -1) {
      newLayout[index] = {
        ...newLayout[index],
        properties: {
          ...newLayout[index].properties,
          tasks
        }
      }
      setLayout(newLayout)
    }
  }

  return (
    <div
      ref={ref}
      style={{
        position: 'absolute',
        width: item.properties.width,
        height: item.properties.height,
        transform: `translate(${item.properties.x}px, ${item.properties.y}px)`,
        touchAction: 'none',
        cursor: 'grab',
        userSelect: 'none'
      }}
      onClick={() => onSelect(item.id)}
      className={cn(
        "hover:ring-2 ring-primary/50 rounded-md transition-all duration-200 shadow-[0_4px_12px_rgba(0,0,0,0.15)] bg-background relative",
        selectedComponent === item.id && "ring-2 ring-primary shadow-[0_8px_16px_rgba(0,0,0,0.2)]"
      )}
    >
      <TaskMenu item={item} onUpdate={handleTaskUpdate} />
      {renderComponentPreview(item)}
    </div>
  )
}
