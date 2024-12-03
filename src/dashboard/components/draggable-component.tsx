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
  onEventTrigger: (event: any, eventConfig: any) => void
  gridBounds: {
    width: number | string
    height: number | string
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
  onEventTrigger,
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
    const newLayout = layout.map((l) => (l.id === updatedConfig.id ? updatedConfig : l));
    setLayout(newLayout);
    if (onContentUpdate) {
      onContentUpdate(updatedConfig);
    }
  };

  const handleComponentClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    onSelect(item.id);

    const clickEvents = item.properties.events?.filter(
      event => event.type === "click"
    );

    if (clickEvents && clickEvents.length > 0) {
      clickEvents.forEach(event => {
        if (typeof onEventTrigger === 'function') {
          onEventTrigger(e, {
            ...event,
            componentId: item.id
          });
        }
      });
    }
  };

  const handleComponentChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    // Değişim olaylarını işle
    const changeEvents = item.properties.events?.filter(
      (event) => event.type === "change"
    )
    changeEvents?.forEach((event) => {
      onEventTrigger(e, event)
    })
  }

  const updateProperty = <K extends keyof ComponentProperties>(
    key: K,
    value: ComponentProperties[K]
  ) => {
    const newLayout = [...layout];
    const index = newLayout.findIndex((l) => l.id === item.id);
    if (index !== -1) {
      newLayout[index] = {
        ...newLayout[index],
        properties: {
          ...newLayout[index].properties,
          [key]: value,
        },
      };
      setLayout(newLayout);
      if (onContentUpdate) {
        onContentUpdate(newLayout[index]);
      }
    }
  };

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
      onClick={handleComponentClick}
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
        properties: {
          ...item.properties,
          events: item.properties.events,
          onEventTrigger: onEventTrigger
        }
      })}
    </div>
  )
}
