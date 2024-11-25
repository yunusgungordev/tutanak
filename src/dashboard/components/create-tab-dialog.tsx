import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DraggableComponentType } from "@/types/component"
import { LayoutConfig, DynamicTabConfig, Field } from "@/types/tab"
import { FormInput as InputIcon, Type, Table, ListTodo, Square, Trash2, GripVertical } from "lucide-react"
import { useTabContext } from "@/contexts/tab-context"
import { toast } from "react-hot-toast"
import { cn } from "@/lib/utils"
import { ModelPanel } from "./model-panel"
import { Collapsible, CollapsibleTrigger, CollapsibleContent } from "@/components/ui/collapsible"
import { ChevronDown } from "lucide-react"

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

export function CreateTabDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [layout, setLayout] = useState<LayoutConfig[]>([])
  const [label, setLabel] = useState("")
  const [selectedItem, setSelectedItem] = useState<string | null>(null)
  const { addDynamicTab, saveDynamicTab } = useTabContext()
  const [fields, setFields] = useState<Field[]>([])

  const handleAddComponent = (component: DraggableComponentType) => {
    const newLayoutItem: LayoutConfig = {
      id: crypto.randomUUID(),
      type: component.type,
      properties: {
        x: 20,
        y: layout.length * 60 + 20, // Her yeni bileşeni bir alt satıra ekle
        width: component.defaultProps.width || 200,
        height: component.defaultProps.height || 40,
        label: component.defaultProps.label,
        placeholder: component.defaultProps.placeholder,
        options: component.defaultProps.options
      }
    }
    setLayout(prev => [...prev, newLayoutItem])
    setSelectedItem(newLayoutItem.id)
  }

  const handleItemClick = (itemId: string) => {
    setSelectedItem(itemId)
  }

  const handleItemUpdate = (itemId: string, updates: Partial<LayoutConfig['properties']>) => {
    setLayout(prev => prev.map(item => 
      item.id === itemId 
        ? { ...item, properties: { ...item.properties, ...updates } }
        : item
    ))
  }

  const handleItemDelete = (itemId: string) => {
    setLayout(prev => prev.filter(item => item.id !== itemId))
    setSelectedItem(null)
  }

  const handleSave = async () => {
    if (!label) {
      toast.error("Lütfen bir tab başlığı girin")
      return
    }

    if (layout.length === 0) {
      toast.error("Lütfen en az bir bileşen ekleyin")
      return
    }

    try {
      // Layout verilerini normalize et
      const normalizedLayout = layout.map(item => ({
        ...item,
        properties: {
          ...item.properties,
          x: Math.round(item.properties.x),
          y: Math.round(item.properties.y),
          width: Math.round(item.properties.width),
          height: Math.round(item.properties.height)
        }
      }))

      const success = await saveDynamicTab({
        id: crypto.randomUUID(),
        label,
        type: 'dynamic',
        layout: normalizedLayout,
        database: {
          tableName: label.toLowerCase().replace(/\s+/g, "_"),
          fields: normalizedLayout.map(item => ({
            name: item.properties.label || "",
            type: item.type === "input" || item.type === "textarea" ? "text" : 
                  item.type === "checkbox" ? "boolean" : "text"
          }))
        }
      })

      if (success) {
        onOpenChange(false)
        toast.success("Tab başarıyla kaydedildi")
      } else {
        toast.error("Tab kaydedilirken bir hata oluştu")
      }
    } catch (error) {
      console.error('Tab kaydetme hatası:', error)
      toast.error("Tab kaydedilirken bir hata oluştu")
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
          {/* Sol Panel - Model ve Bileşenler */}
          <div className="w-[300px] border-r flex flex-col overflow-auto">
            <Collapsible defaultOpen={false}>
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 bg-muted/30 sticky top-0 z-10">
                <h3 className="font-medium">Model</h3>
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent className="max-h-[200px] overflow-auto">
                <div className="p-4">
                  <ModelPanel onFieldsChange={(fields) => setFields(fields)} />
                </div>
              </CollapsibleContent>
            </Collapsible>
            
            <Collapsible defaultOpen>
              <CollapsibleTrigger className="flex w-full items-center justify-between p-4 bg-muted/30 sticky top-0 z-10">
                <h3 className="font-medium">Bileşenler</h3>
                <ChevronDown className="h-4 w-4 transition-transform duration-200" />
              </CollapsibleTrigger>
              <CollapsibleContent>
                <div className="p-2 space-y-2">
                  {COMPONENTS.map((component) => (
                    <button
                      key={component.id}
                      onClick={() => handleAddComponent(component)}
                      className="w-full flex items-center gap-2 p-2 text-sm rounded-md hover:bg-accent hover:text-accent-foreground"
                    >
                      {component.icon}
                      <span>{component.label}</span>
                    </button>
                  ))}
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Orta Panel - Canvas */}
          <div className="flex-1 overflow-auto">
            <div className="min-w-[800px] max-w-full p-6">
              <div className="border-2 border-dashed rounded-lg bg-background/50 relative min-h-[800px]"
                style={{
                  backgroundSize: "20px 20px",
                  backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)"
                }}
              >
                {layout.map((item) => (
                  <div
                    key={item.id}
                    onClick={() => handleItemClick(item.id)}
                    style={{
                      position: "absolute",
                      left: item.properties.x,
                      top: item.properties.y,
                      width: item.properties.width,
                      height: item.properties.height,
                      cursor: "pointer",
                    }}
                    className={cn(
                      "border rounded-md bg-background p-2",
                      selectedItem === item.id && "ring-2 ring-primary"
                    )}
                  >
                    <div className="absolute -left-6 top-1/2 -translate-y-1/2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <GripVertical className="h-4 w-4 text-muted-foreground" />
                    </div>
                    <div className="p-2">
                      <div className="flex items-center justify-between mb-1">
                        <span className="text-sm font-medium">{item.properties.label}</span>
                        {selectedItem === item.id && (
                          <Button
                            variant="ghost"
                            size="sm"
                            className="h-6 w-6 p-0"
                            onClick={(e) => {
                              e.stopPropagation()
                              handleItemDelete(item.id)
                            }}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        )}
                      </div>
                      {/* Bileşen içeriği */}
                      {item.type === "input" && (
                        <input
                          type="text"
                          placeholder={item.properties.placeholder}
                          className="w-full px-2 py-1 border rounded bg-muted/50"
                          disabled
                        />
                      )}
                      {item.type === "textarea" && (
                        <textarea
                          placeholder={item.properties.placeholder}
                          className="w-full px-2 py-1 border rounded bg-muted/50"
                          disabled
                        />
                      )}
                      {item.type === "select" && (
                        <select className="w-full px-2 py-1 border rounded bg-muted/50" disabled>
                          {item.properties.options?.map((option, i) => (
                            <option key={i}>{option}</option>
                          ))}
                        </select>
                      )}
                      {item.type === "button" && (
                        <Button
                          variant="secondary"
                          className="w-full"
                          disabled
                        >
                          {item.properties.label}
                        </Button>
                      )}
                      {item.type === "checkbox" && (
                        <div className="flex items-center gap-2">
                          <input type="checkbox" disabled />
                          <span className="text-sm">{item.properties.label}</span>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Sağ Panel - Özellikler */}
          {selectedItem && (
            <div className="w-[250px] border-l bg-muted/10">
              <div className="p-4 border-b bg-muted/30">
                <h3 className="font-medium">Özellikler</h3>
              </div>
              <div className="p-4">
                <div className="space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Etiket</label>
                    <Input
                      value={layout.find(item => item.id === selectedItem)?.properties.label || ""}
                      onChange={(e) => handleItemUpdate(selectedItem, { label: e.target.value })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Genişlik</label>
                    <Input
                      type="number"
                      value={layout.find(item => item.id === selectedItem)?.properties.width || 200}
                      onChange={(e) => handleItemUpdate(selectedItem, { width: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Yükseklik</label>
                    <Input
                      type="number"
                      value={layout.find(item => item.id === selectedItem)?.properties.height || 40}
                      onChange={(e) => handleItemUpdate(selectedItem, { height: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">X Pozisyonu</label>
                    <Input
                      type="number"
                      value={layout.find(item => item.id === selectedItem)?.properties.x || 0}
                      onChange={(e) => handleItemUpdate(selectedItem, { x: Number(e.target.value) })}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">Y Pozisyonu</label>
                    <Input
                      type="number"
                      value={layout.find(item => item.id === selectedItem)?.properties.y || 0}
                      onChange={(e) => handleItemUpdate(selectedItem, { y: Number(e.target.value) })}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button
            variant="outline"
            onClick={() => onOpenChange(false)}
          >
            İptal
          </Button>
          <Button
            onClick={handleSave}
            disabled={!label || layout.length === 0}
          >
            Kaydet
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}