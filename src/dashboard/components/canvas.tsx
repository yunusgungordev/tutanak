import { useRef } from "react"
import { LayoutConfig } from "@/types/tab"
import { DraggableComponent } from "./draggable-component"
import { cn } from "@/lib/utils"

interface CanvasProps {
  layout: LayoutConfig[]
  setLayout: (layout: LayoutConfig[]) => void
  selectedComponent: string | null
  onSelect: (id: string) => void
  renderComponentPreview: (item: LayoutConfig) => React.ReactNode
  isDialog?: boolean
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
  backgroundSize: `${GRID_SNAP}px ${GRID_SNAP}px`
}

export function Canvas({ 
  layout, 
  setLayout, 
  selectedComponent, 
  onSelect, 
  renderComponentPreview,
  isDialog = false 
}: CanvasProps) {
  const gridRef = useRef<HTMLDivElement>(null)

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (event.target === gridRef.current) {
      onSelect("")
    }
  }

  return (
    <div 
      className={cn(
        "relative bg-muted/5 rounded-lg",
        isDialog ? "w-[3000px] h-[3000px]" : "w-full h-full min-h-[600px]"
      )}
      style={gridStyle}
      ref={gridRef}
      onClick={handleCanvasClick}
    >
      <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
        <div className="w-full h-full border border-dashed border-muted-foreground/20" />
      </div>

      {layout.map((item) => (
        <DraggableComponent
          key={item.id}
          item={item}
          layout={layout}
          setLayout={setLayout}
          selectedComponent={selectedComponent}
          onSelect={onSelect}
          renderComponentPreview={renderComponentPreview}
          gridWidth={GRID_WIDTH}
          gridHeight={GRID_HEIGHT}
        />
      ))}
    </div>
  )
} 