import { useRef } from "react"

import { LayoutConfig } from "@/types/tab"
import { cn } from "@/lib/utils"

import { DraggableComponent } from "./draggable-component"
import { toast } from "react-hot-toast"
import { useTabContext } from "@/contexts/tab-context"

interface CanvasProps {
  layout: LayoutConfig[]
  setLayout: (layout: LayoutConfig[]) => void
  selectedComponent: string | null
  onSelect: (id: string) => void
  renderComponentPreview: (item: LayoutConfig) => React.ReactNode
  isDialog?: boolean
  onContentUpdate?: (updatedConfig: LayoutConfig) => void
  onEventTrigger: (event: any, eventConfig: any) => void
}

const GRID_PADDING = 20
const GRID_WIDTH = 800
const GRID_HEIGHT = 600
const GRID_SNAP = 10

const gridStyle = {
  backgroundImage: `
    linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
  `,
  backgroundSize: `${GRID_SNAP}px ${GRID_SNAP}px`,
}

const VISIBLE_GRID = {
  width: 800,
  height: 600,
  padding: 20,
}

export function Canvas({
  layout,
  setLayout,
  selectedComponent,
  onSelect,
  renderComponentPreview,
  isDialog = false,
  onContentUpdate,
  onEventTrigger,
}: CanvasProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const visibleAreaRef = useRef<HTMLDivElement>(null)

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (event.target === gridRef.current) {
      onSelect("")
    }
  }

  const maxY = Math.max(
    ...layout.map((item) => item.properties.y + item.properties.height),
    600
  )

  const handleDeleteComponent = (componentId: string) => {
    setLayout(layout.filter((item) => item.id !== componentId))
    onSelect("") // Seçimi temizle
  }

  const handleContentUpdate = (updatedConfig: LayoutConfig) => {
    const newLayout = layout.map((item) =>
      item.id === updatedConfig.id ? updatedConfig : item
    )
    setLayout(newLayout)
    if (onContentUpdate) {
      onContentUpdate(updatedConfig)
    }
  }

  return (
    <div
      className={cn(
        "relative overflow-auto rounded-lg bg-muted/5",
        isDialog ? "h-[700px] w-[1000px]" : "h-full min-h-[600px] w-full"
      )}
      ref={gridRef}
      onClick={handleCanvasClick}
    >
      <div
        ref={visibleAreaRef}
        className="absolute bg-background/50"
        style={{
          width: "100%",
          minWidth: VISIBLE_GRID.width + VISIBLE_GRID.padding * 2,
          height: maxY + VISIBLE_GRID.padding * 2,
          left: 0,
          top: 0,
          backgroundImage: gridStyle.backgroundImage,
          backgroundSize: gridStyle.backgroundSize,
        }}
      >
        {layout.map((item) => (
          <DraggableComponent
            key={item.id}
            item={item}
            layout={layout}
            setLayout={setLayout}
            selectedComponent={selectedComponent}
            onSelect={onSelect}
            renderComponentPreview={renderComponentPreview}
            onDelete={handleDeleteComponent}
            onContentUpdate={handleContentUpdate}
            onEventTrigger={onEventTrigger}
            gridBounds={{
              width: VISIBLE_GRID.width,
              height: maxY,
              padding: VISIBLE_GRID.padding,
            }}
          />
        ))}
      </div>
    </div>
  )
}
