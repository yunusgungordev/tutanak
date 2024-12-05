import { useRef, useCallback } from "react"

import { LayoutConfig } from "@/types/tab"

import { DraggableComponent } from "./draggable-component"

interface CanvasProps {
  layout: LayoutConfig[]
  setLayout: (layout: LayoutConfig[]) => void
  selectedComponent: string | null
  onSelect: (id: string) => void
  renderComponentPreview: (item: LayoutConfig) => React.ReactNode
  isDialog?: boolean
  onContentUpdate?: (updatedConfig: LayoutConfig) => void
  onEventTrigger: (event: any, eventConfig: any) => void
  onSizeChange: (width: number, height: number) => void
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
  onSizeChange,
}: CanvasProps) {
  const gridRef = useRef<HTMLDivElement>(null)
  const visibleAreaRef = useRef<HTMLDivElement>(null)

  const handleCanvasClick = (event: React.MouseEvent) => {
    if (event.target === gridRef.current || event.target === visibleAreaRef.current) {
      onSelect("")
    }
  }

  const calculateCanvasSize = useCallback(() => {
    const maxX = Math.max(
      ...layout.map((item) => item.properties.x + item.properties.width),
      window.innerWidth
    )
    const maxY = Math.max(
      ...layout.map((item) => item.properties.y + item.properties.height),
      window.innerHeight
    )
    
    return { 
      width: maxX + window.innerWidth * 2,
      height: maxY + window.innerHeight * 2
    }
  }, [layout])

  const handleDeleteComponent = useCallback((id: string) => {
    setLayout(layout.filter(item => item.id !== id))
  }, [layout, setLayout])

  const handleContentUpdate = useCallback((updatedConfig: LayoutConfig) => {
    onContentUpdate?.(updatedConfig)
  }, [onContentUpdate])

  const { height: maxY } = calculateCanvasSize()

  return (
    <div
      className="infinite-canvas-container"
      ref={gridRef}
      onClick={handleCanvasClick}
    >
      <div
        ref={visibleAreaRef}
        className="infinite-canvas-content"
        style={{
          width: calculateCanvasSize().width,
          height: calculateCanvasSize().height,
          backgroundImage: `
            linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
            linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
          `,
          backgroundSize: `${GRID_SNAP}px ${GRID_SNAP}px`,
          backgroundPosition: '0 0',
          transform: 'translate(0, 0)',
        }}
      >
        {layout.map((item) => (
          <DraggableComponent
            key={item.id}
            item={item}
            component={{
              label: item.type,
              icon: "default-icon",
              defaultProps: item.properties,
              ...item
            }}
            onAddComponent={() => {}}
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
