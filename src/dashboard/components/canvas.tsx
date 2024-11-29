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

const VISIBLE_GRID = {
  width: 800,
  height: 600,
  padding: 20
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
  const visibleAreaRef = useRef<HTMLDivElement>(null)

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (event.target === gridRef.current) {
      onSelect("")
    }
  }

  const handleTableRender = (item: LayoutConfig) => {
    if (item.type === "table") {
      return (
        <div 
          className="absolute"
          style={{
            width: item.properties.width,
            height: item.properties.height,
            left: item.properties.x,
            top: item.properties.y,
          }}
        >
          {renderComponentPreview(item)}
        </div>
      );
    }
    return null;
  };

  return (
    <div 
      className={cn(
        "relative bg-muted/5 rounded-lg overflow-auto",
        isDialog ? "w-[1000px] h-[700px]" : "w-full h-full min-h-[600px]"
      )}
      ref={gridRef}
      onClick={handleCanvasClick}
    >
      <div
        ref={visibleAreaRef}
        className="absolute bg-background/50"
        style={{
          width: VISIBLE_GRID.width,
          height: VISIBLE_GRID.height,
          left: VISIBLE_GRID.padding,
          top: VISIBLE_GRID.padding,
          backgroundImage: gridStyle.backgroundImage,
          backgroundSize: gridStyle.backgroundSize
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
            gridBounds={{
              width: VISIBLE_GRID.width,
              height: VISIBLE_GRID.height,
              padding: VISIBLE_GRID.padding
            }}
          />
        ))}
      </div>
    </div>
  )
} 