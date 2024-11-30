import { X } from "lucide-react"

import { ComponentProperties } from "@/types/component"
import { LayoutConfig } from "@/types/tab"
import { cn } from "@/lib/utils"
import { useInteractable } from "@/hooks/use-interactable"

interface DraggableComponentProps {
  item: LayoutConfig
  layout: LayoutConfig[]
  setLayout: (layout: LayoutConfig[]) => void
  selectedComponent: string | null
  onSelect: (id: string) => void
  renderComponentPreview: (item: LayoutConfig) => React.ReactNode
  onDelete: (id: string) => void
  onContentUpdate?: (updatedConfig: LayoutConfig) => void
  gridBounds: {
    width: number
    height: number
    padding: number
  }
}

const GRID_SNAP = 10

// Bileşen hizalama yardımcısı
const getSnapPosition = (value: number): number => {
  return Math.round(value / GRID_SNAP) * GRID_SNAP
}

// Bileşen pozisyonlama ve boyutlandırma için yardımcı fonksiyonlar
const handleDragStop = (
  { x, y }: { x: number; y: number },
  item: LayoutConfig,
  layout: LayoutConfig[],
  setLayout: (layout: LayoutConfig[]) => void
) => {
  const newLayout = [...layout]
  const index = newLayout.findIndex((l) => l.id === item.id)
  if (index !== -1) {
    newLayout[index] = {
      ...newLayout[index],
      properties: {
        ...newLayout[index].properties,
        x: getSnapPosition(x),
        y: getSnapPosition(y),
      },
    }
  }
  setLayout(newLayout)
}

const handleResizeStop = (
  {
    width,
    height,
    x,
    y,
  }: { width: number; height: number; x: number; y: number },
  item: LayoutConfig,
  layout: LayoutConfig[],
  setLayout: (layout: LayoutConfig[]) => void
) => {
  const newLayout = [...layout]
  const index = newLayout.findIndex((l) => l.id === item.id)
  if (index !== -1) {
    newLayout[index] = {
      ...newLayout[index],
      properties: {
        ...newLayout[index].properties,
        width: getSnapPosition(width),
        height: getSnapPosition(height),
        x: getSnapPosition(x),
        y: getSnapPosition(y),
      },
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
  onDelete,
  onContentUpdate,
  gridBounds,
}: DraggableComponentProps) {
  const ref = useInteractable(
    item.id,
    (x: number, y: number) => handleDragStop({ x, y }, item, layout, setLayout),
    (width: number, height: number, x: number, y: number) =>
      handleResizeStop({ width, height, x, y }, item, layout, setLayout),
    item.properties.x,
    item.properties.y,
    gridBounds
  )

  const handleTaskUpdate = (tasks: ComponentProperties["tasks"]) => {
    const newLayout = [...layout]
    const index = newLayout.findIndex((l) => l.id === item.id)
    if (index !== -1) {
      newLayout[index] = {
        ...newLayout[index],
        properties: {
          ...newLayout[index].properties,
          tasks,
        },
      }
      setLayout(newLayout)
    }
  }

  const handleUpdate = (updatedConfig: LayoutConfig) => {
    if (onContentUpdate) {
      onContentUpdate(updatedConfig)
    }
  }

  return (
    <div
      ref={ref}
      style={{
        position: "absolute",
        width: item.properties.width,
        height: item.properties.height,
        transform: `translate(${item.properties.x}px, ${item.properties.y}px)`,
        touchAction: "none",
        cursor: "grab",
        userSelect: "none",
      }}
      onClick={(e) => {
        e.stopPropagation()
        onSelect(item.id)
      }}
      className={cn(
        "group relative rounded-md bg-background shadow-sm ring-primary/50 transition-all duration-200 hover:ring-2",
        selectedComponent === item.id && "ring-2 ring-primary"
      )}
    >
      <div
        className={cn(
          "absolute -right-2 -top-2 opacity-0 transition-opacity duration-200 group-hover:opacity-100",
          selectedComponent === item.id && "opacity-100"
        )}
      >
        <button
          onClick={(e) => {
            e.stopPropagation()
            onDelete(item.id)
          }}
          className="flex h-5 w-5 items-center justify-center rounded-full bg-destructive text-destructive-foreground shadow-sm hover:bg-destructive/90"
        >
          <X className="h-3 w-3" />
        </button>
      </div>
      {renderComponentPreview({
        ...item,
        onContentUpdate: handleUpdate,
      })}
    </div>
  )
}
