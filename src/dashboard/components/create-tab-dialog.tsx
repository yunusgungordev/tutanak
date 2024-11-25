import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useState, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DraggableComponentType } from "@/types/component"
import { LayoutConfig, Field } from "@/types/tab"
import { FormInput as InputIcon, Type, Table, ListTodo, Square } from "lucide-react"
import { useTabContext } from "@/contexts/tab-context"
import { toast } from "react-hot-toast"
import { Rnd } from "react-rnd"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ModelPanel } from "./model-panel"
import { Database, ChevronDown, ChevronRight, LayoutGrid } from "lucide-react"

const COMPONENTS: DraggableComponentType[] = [
  {
    id: "input",
    type: "input",
    label: "Metin Kutusu",
    icon: <InputIcon className="w-4 h-4" />,
    defaultProps: {
      label: "Yeni Metin Kutusu",
      placeholder: "Metin giriniz",
      width: 200,
      height: 40
    }
  },
  {
    id: "textarea",
    type: "textarea",
    label: "Çok Satırlı Metin",
    icon: <Type className="w-4 h-4" />,
    defaultProps: {
      label: "Yeni Çok Satırlı Metin",
      placeholder: "Metin giriniz",
      width: 300,
      height: 100
    }
  },
  {
    id: "table",
    type: "table",
    label: "Tablo",
    icon: <Table className="w-4 h-4" />,
    defaultProps: {
      label: "Yeni Tablo",
      width: 400,
      height: 200
    }
  },
  {
    id: "button",
    type: "button",
    label: "Düğme",
    icon: <Square className="w-4 h-4" />,
    defaultProps: {
      label: "Yeni Düğme",
      width: 120,
      height: 40
    }
  },
  {
    id: "select",
    type: "select",
    label: "Seçim Kutusu",
    icon: <ListTodo className="w-4 h-4" />,
    defaultProps: {
      label: "Yeni Seçim Kutusu",
      width: 200,
      height: 40,
      options: ["Seçenek 1", "Seçenek 2", "Seçenek 3"]
    }
  },
  {
    id: "checkbox",
    type: "checkbox",
    label: "Onay Kutusu",
    icon: <Square className="w-4 h-4" />,
    defaultProps: {
      label: "Yeni Onay Kutusu",
      width: 200,
      height: 40
    }
  }
]

// Component açıklamalarını getiren yardımcı fonksiyon
function getComponentDescription(type: string): string {
  switch (type) {
    case "input":
      return "Tek satırlık metin girişi"
    case "textarea":
      return "Çok satırlı metin girişi"
    case "select":
      return "Açılır liste seçimi"
    case "button":
      return "Tıklanabilir düğme"
    case "table":
      return "Veri tablosu"
    case "checkbox":
      return "Onay kutusu"
    default:
      return ""
  }
}

export function CreateTabDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [layout, setLayout] = useState<LayoutConfig[]>([])
  const [label, setLabel] = useState("")
  const [fields, setFields] = useState<Field[]>([])
  const [isModelOpen, setIsModelOpen] = useState(true)
  const [isComponentsOpen, setIsComponentsOpen] = useState(true)
  const gridRef = useRef<HTMLDivElement>(null)
  const { saveDynamicTab } = useTabContext()

  const handleAddComponent = (component: DraggableComponentType) => {
    const gridRect = gridRef.current?.getBoundingClientRect()
    if (!gridRect) return

    const newLayoutItem: LayoutConfig = {
      id: crypto.randomUUID(),
      type: component.type,
      properties: {
        x: 20,
        y: 20,
        width: component.defaultProps.width || 200,
        height: component.defaultProps.height || 40,
        label: component.defaultProps.label,
        placeholder: component.defaultProps.placeholder
      }
    }
    setLayout(prev => [...prev, newLayoutItem])
  }

  const handleSave = async () => {
    if (!label) {
      toast.error("Tab başlığı gereklidir")
      return
    }

    if (layout.length === 0) {
      toast.error("En az bir bileşen eklemelisiniz")
      return
    }

    try {
      await saveDynamicTab({
        id: crypto.randomUUID(),
        label,
        type: "dynamic",
        layout,
        database: {
          tableName: label.toLowerCase().replace(/\s+/g, '_'),
          fields
        }
      })
      
      onOpenChange(false)
      toast.success("Tab başarıyla oluşturuldu")
    } catch (error) {
      toast.error("Tab oluşturulurken bir hata oluştu")
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] h-[800px] flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>Yeni Tab Oluştur</DialogTitle>
          <Input
            placeholder="Tab Başlığı"
            value={label}
            onChange={(e) => setLabel(e.target.value)}
            className="mt-4"
          />
        </DialogHeader>

        <div className="flex-1 min-h-0 flex">
          {/* Sol Panel */}
          <div className="w-[250px] border-r flex flex-col h-full">
            {/* Model Bölümü */}
            <Collapsible open={isModelOpen} onOpenChange={setIsModelOpen} className="min-h-0">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 border-b bg-muted/30 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <Database className="w-4 h-4" />
                  <span className="font-medium">Model</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {isModelOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-y-auto max-h-[300px] scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                <div className="p-4">
                  <ModelPanel onFieldsChange={setFields} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Bileşenler Bölümü */}
            <Collapsible open={isComponentsOpen} onOpenChange={setIsComponentsOpen} className="min-h-0 flex-1 flex flex-col">
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 border-b bg-muted/30 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="font-medium">Bileşenler</span>
                </div>
                <Button variant="ghost" size="sm" className="h-6 w-6 p-0">
                  {isComponentsOpen ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </Button>
              </CollapsibleTrigger>
              <CollapsibleContent className="flex-1 min-h-0 overflow-hidden">
                <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                  <div className="p-4 space-y-2">
                    <div className="grid grid-cols-1 gap-2">
                      {COMPONENTS.map((component) => (
                        <button
                          key={component.id}
                          onClick={() => handleAddComponent(component)}
                          className="flex items-center gap-2 p-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground transition-colors"
                        >
                          <div className="w-8 h-8 flex items-center justify-center rounded-md bg-muted">
                            {component.icon}
                          </div>
                          <div className="flex-1 text-left">
                            <div className="font-medium">{component.label}</div>
                            <div className="text-xs text-muted-foreground">
                              {getComponentDescription(component.type)}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Grid Alanı */}
          <div className="flex-1 overflow-auto p-6" ref={gridRef}>
            <div className="relative min-h-[800px] bg-muted/10 rounded-lg">
              {layout.map((item) => (
                <Rnd
                  key={item.id}
                  default={{
                    x: item.properties.x,
                    y: item.properties.y,
                    width: item.properties.width,
                    height: item.properties.height
                  }}
                  minWidth={100}
                  minHeight={30}
                  bounds="parent"
                  onDragStop={(e, d) => {
                    setLayout(prev => prev.map(layoutItem => 
                      layoutItem.id === item.id 
                        ? { ...layoutItem, properties: { ...layoutItem.properties, x: d.x, y: d.y } }
                        : layoutItem
                    ))
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    setLayout(prev => prev.map(layoutItem => 
                      layoutItem.id === item.id 
                        ? { 
                            ...layoutItem, 
                            properties: { 
                              ...layoutItem.properties, 
                              width: ref.offsetWidth,
                              height: ref.offsetHeight,
                              x: position.x,
                              y: position.y
                            } 
                          }
                        : layoutItem
                    ))
                  }}
                  className="bg-background border rounded-md shadow-sm"
                >
                  <div className="p-2">
                    {renderComponentPreview(item)}
                  </div>
                </Rnd>
              ))}
            </div>
          </div>
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
          <Button onClick={handleSave} disabled={!label || layout.length === 0}>Kaydet</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function renderComponentPreview(item: LayoutConfig) {
  switch (item.type) {
    case "input":
      return <input type="text" className="w-full px-2 py-1 border rounded bg-muted/50" disabled />
    case "textarea":
      return <textarea className="w-full px-2 py-1 border rounded bg-muted/50" disabled />
    case "select":
      return (
        <select className="w-full px-2 py-1 border rounded bg-muted/50" disabled>
          {item.properties.options?.map((option, i) => (
            <option key={i}>{option}</option>
          ))}
        </select>
      )
    case "button":
      return <Button variant="secondary" className="w-full" disabled>{item.properties.label}</Button>
    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <input type="checkbox" disabled />
          <span className="text-sm">{item.properties.label}</span>
        </div>
      )
    default:
      return null
  }
}