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
import { AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, ArrowLeftRight, ArrowUpDown } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { AlignStartHorizontal, AlignStartVertical, AlignEndHorizontal, AlignEndVertical } from "lucide-react"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"

// Sabit değerler tanımlayalım
const GRID_PADDING = 20
const GRID_WIDTH = 800
const GRID_HEIGHT = 600

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
      height: 40,
      x: 0,
      y: 0
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
      height: 100,
      x: 0,
      y: 0
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
      height: 200,
      x: 0,
      y: 0,
      headers: ["Başlık 1", "Başlık 2", "Başlık 3"]
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
      height: 40,
      x: 0,
      y: 0
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
      options: ["Seçenek 1", "Seçenek 2", "Seçenek 3"],
      x: 0,
      y: 0
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
      height: 40,
      x: 0,
      y: 0
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

// Hizalama türleri için enum
enum AlignmentType {
  LEFT = 'left',
  CENTER = 'center',
  RIGHT = 'right',
  TOP = 'top',
  MIDDLE = 'middle',
  BOTTOM = 'bottom',
  DISTRIBUTE_HORIZONTAL = 'distribute-h',
  DISTRIBUTE_VERTICAL = 'distribute-v'
}

// PropertiesPanel bileşeni
function PropertiesPanel({ 
  selectedComponent, 
  layout, 
  setLayout 
}: { 
  selectedComponent: string | null
  layout: LayoutConfig[]
  setLayout: (layout: LayoutConfig[]) => void 
}) {
  if (!selectedComponent) return null

  const component = layout.find(item => item.id === selectedComponent)
  if (!component) return null

  const updateProperty = (key: string, value: any) => {
    setLayout(layout.map(item => 
      item.id === selectedComponent 
        ? { 
            ...item, 
            properties: { 
              ...item.properties, 
              [key]: value 
            } 
          }
        : item
    ))
  }

  return (
    <div className="w-[250px] border-l p-4 space-y-4">
      <div className="font-medium">Özellikler</div>
      
      {/* Tüm bileşenler için ortak özellikler */}
      <div className="space-y-2">
        <Label>Etiket</Label>
        <Input
          value={component.properties.label || ''}
          onChange={e => updateProperty('label', e.target.value)}
          placeholder="Etiket giriniz"
        />
      </div>

      {/* Bileşen tipine özel özellikler */}
      {component.type === 'input' && (
        <div className="space-y-2">
          <Label>Placeholder</Label>
          <Input
            value={component.properties.placeholder || ''}
            onChange={e => updateProperty('placeholder', e.target.value)}
            placeholder="Placeholder metni giriniz"
          />
        </div>
      )}

      {component.type === 'textarea' && (
        <div className="space-y-2">
          <Label>Placeholder</Label>
          <Input
            value={component.properties.placeholder || ''}
            onChange={e => updateProperty('placeholder', e.target.value)}
            placeholder="Placeholder metni giriniz"
          />
        </div>
      )}

      {component.type === 'button' && (
        <div className="space-y-2">
          <Label>Buton Metni</Label>
          <Input
            value={component.properties.label || ''}
            onChange={e => updateProperty('label', e.target.value)}
            placeholder="Buton metni giriniz"
          />
        </div>
      )}

      {component.type === 'select' && (
        <div className="space-y-2">
          <Label>Seçenekler</Label>
          <div className="space-y-2">
            {(component.properties.options || []).map((option: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={option}
                  onChange={e => {
                    const newOptions = [...(component.properties.options || [])]
                    newOptions[index] = e.target.value
                    updateProperty('options', newOptions)
                  }}
                  placeholder={`Seçenek ${index + 1}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newOptions = [...(component.properties.options || [])]
                    newOptions.splice(index, 1)
                    updateProperty('options', newOptions)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newOptions = [...(component.properties.options || []), '']
                updateProperty('options', newOptions)
              }}
            >
              Seçenek Ekle
            </Button>
          </div>
        </div>
      )}

      {component.type === 'checkbox' && (
        <div className="space-y-2">
          <Label>Onay Kutusu Metni</Label>
          <Input
            value={component.properties.label || ''}
            onChange={e => updateProperty('label', e.target.value)}
            placeholder="Onay kutusu metni giriniz"
          />
        </div>
      )}

      {component.type === 'table' && (
        <div className="space-y-2">
          <Label>Tablo Başlıkları</Label>
          <div className="space-y-2">
            {(component.properties.headers || []).map((header: string, index: number) => (
              <div key={index} className="flex gap-2">
                <Input
                  value={header}
                  onChange={e => {
                    const newHeaders = [...(component.properties.headers || [])]
                    newHeaders[index] = e.target.value
                    updateProperty('headers', newHeaders)
                  }}
                  placeholder={`Başlık ${index + 1}`}
                />
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => {
                    const newHeaders = [...(component.properties.headers || [])]
                    newHeaders.splice(index, 1)
                    updateProperty('headers', newHeaders)
                  }}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
            ))}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newHeaders = [...(component.properties.headers || []), '']
                updateProperty('headers', newHeaders)
              }}
            >
              Başlık Ekle
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}

export function CreateTabDialog({ open, onOpenChange }: { open: boolean, onOpenChange: (open: boolean) => void }) {
  const [layout, setLayout] = useState<LayoutConfig[]>([])
  const [label, setLabel] = useState("")
  const [fields, setFields] = useState<Field[]>([])
  const [isModelOpen, setIsModelOpen] = useState(true)
  const [isComponentsOpen, setIsComponentsOpen] = useState(true)
  const gridRef = useRef<HTMLDivElement>(null)
  const { saveDynamicTab } = useTabContext()
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null)
  
  // Çakışma kontrolü
  const checkCollision = (newItem: any, existingItems: any[]) => {
    const buffer = 10 // Minimum boşluk
    return existingItems.some(item => {
      const overlap = !(
        newItem.properties.x + newItem.properties.width + buffer < item.properties.x ||
        newItem.properties.x > item.properties.x + item.properties.width + buffer ||
        newItem.properties.y + newItem.properties.height + buffer < item.properties.y ||
        newItem.properties.y > item.properties.y + item.properties.height + buffer
      )
      return overlap
    })
  }

  // Otomatik pozisyon bulma
  const findSafePosition = (newItem: any) => {
    let position = { x: 20, y: 20 }
    const gridSize = 20
    
    while (checkCollision({ ...newItem, properties: { ...newItem.properties, ...position } }, layout)) {
      position.x += gridSize
      if (position.x > 800) { // Canvas genişliği
        position.x = 20
        position.y += gridSize
      }
    }
    
    return position
  }

  // Canvas'a tıklandığında seçimi temizle
  const handleCanvasClick = (event: React.MouseEvent) => {
    if (event.target === gridRef.current) {
      setSelectedComponent(null)
    }
  }

  // Bileşen ekleme işlemi güncellenmesi
  const handleAddComponent = (component: DraggableComponentType) => {
    const newLayoutItem: LayoutConfig = {
      id: crypto.randomUUID(),
      type: component.type,
      properties: {
        ...component.defaultProps,
        ...findSafePosition(component)
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

  const handleComponentSelect = (id: string) => {
    setSelectedComponent(id)
  }

  const handleAlignComponent = (alignment: 'left' | 'center' | 'right' | 'top' | 'middle' | 'bottom') => {
    if (!selectedComponent) return
    
    const newLayout = [...layout]
    const itemIndex = newLayout.findIndex(item => item.id === selectedComponent)
    
    if (itemIndex === -1) return
    
    const item = newLayout[itemIndex]
    
    switch (alignment) {
      case 'left':
        item.properties.x = GRID_PADDING
        break
        
      case 'center':
        item.properties.x = (GRID_WIDTH - item.properties.width) / 2
        break
        
      case 'right':
        item.properties.x = GRID_WIDTH - item.properties.width - GRID_PADDING
        break
        
      case 'top':
        item.properties.y = GRID_PADDING
        break
        
      case 'middle':
        item.properties.y = (GRID_HEIGHT - item.properties.height) / 2
        break
        
      case 'bottom':
        item.properties.y = GRID_HEIGHT - item.properties.height - GRID_PADDING
        break
    }
    
    setLayout(newLayout)
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
          <div className="flex-1 overflow-auto p-6">
            {/* Sadece çalışan araç çubuğunu tutalım */}
            <div className="flex items-center gap-2 mb-4 p-2 bg-muted/30 rounded-md sticky top-0 z-10">
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAlignComponent('left')}
                  disabled={!selectedComponent}
                >
                  <AlignStartHorizontal className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAlignComponent('center')}
                  disabled={!selectedComponent}
                >
                  <AlignHorizontalJustifyCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAlignComponent('right')}
                  disabled={!selectedComponent}
                >
                  <AlignEndHorizontal className="h-4 w-4" />
                </Button>
              </div>
              
              <Separator orientation="vertical" className="h-6" />
              
              <div className="flex items-center gap-1">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAlignComponent('top')}
                  disabled={!selectedComponent}
                >
                  <AlignStartVertical className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAlignComponent('middle')}
                  disabled={!selectedComponent}
                >
                  <AlignVerticalJustifyCenter className="h-4 w-4" />
                </Button>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleAlignComponent('bottom')}
                  disabled={!selectedComponent}
                >
                  <AlignEndVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>

            {/* Sonsuz canvas alanı */}
            <div 
              className="relative w-[3000px] h-[3000px] bg-muted/5 rounded-lg"
              style={{
                backgroundImage: `
                  linear-gradient(to right, rgba(0,0,0,0.1) 1px, transparent 1px),
                  linear-gradient(to bottom, rgba(0,0,0,0.1) 1px, transparent 1px)
                `,
                backgroundSize: '20px 20px'
              }}
              ref={gridRef}
              onClick={handleCanvasClick}
            >
              {/* Görünür alan göstergesi */}
              <div className="absolute top-0 left-0 w-full h-full pointer-events-none">
                <div className="w-full h-full border border-dashed border-muted-foreground/20" />
              </div>

              {/* Bileşenler */}
              {layout.map((item) => (
                <Rnd
                  key={item.id}
                  bounds="parent"
                  position={{
                    x: item.properties.x,
                    y: item.properties.y
                  }}
                  size={{
                    width: item.properties.width,
                    height: item.properties.height
                  }}
                  onDragStop={(e, d) => {
                    const newLayout = [...layout]
                    const index = newLayout.findIndex(l => l.id === item.id)
                    if (index !== -1) {
                      newLayout[index] = {
                        ...newLayout[index],
                        properties: {
                          ...newLayout[index].properties,
                          x: d.x,
                          y: d.y
                        }
                      }
                    }
                    setLayout(newLayout)
                  }}
                  onResizeStop={(e, direction, ref, delta, position) => {
                    const newLayout = [...layout]
                    const index = newLayout.findIndex(l => l.id === item.id)
                    if (index !== -1) {
                      newLayout[index] = {
                        ...newLayout[index],
                        properties: {
                          ...newLayout[index].properties,
                          width: parseInt(ref.style.width),
                          height: parseInt(ref.style.height),
                          x: position.x,
                          y: position.y
                        }
                      }
                    }
                    setLayout(newLayout)
                  }}
                  onClick={(e: React.MouseEvent) => {
                    handleComponentSelect(item.id)
                  }}
                  className={cn(
                    "hover:ring-2 ring-primary/50 rounded-md transition-all duration-200 shadow-[0_2px_4px_rgba(0,0,0,0.1)] bg-background",
                    selectedComponent === item.id && "ring-2 ring-primary shadow-[0_4px_8px_rgba(0,0,0,0.15)]"
                  )}
                >
                  <div className="drag-handle w-full h-6 bg-muted/30 rounded-t-md cursor-move flex items-center justify-center">
                    <div className="w-8 h-1 bg-muted-foreground/30 rounded-full" />
                  </div>
                  {renderComponentPreview(item)}
                </Rnd>
              ))}
            </div>

            {/* Özellikler paneli */}
            <PropertiesPanel
              selectedComponent={selectedComponent}
              layout={layout}
              setLayout={setLayout}
            />
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
    case "table":
      return (
        <div className="w-full h-full bg-background p-2">
          <div className="flex gap-2">
            {item.properties.headers?.map((header, index) => (
              <div key={index} className="flex-1 font-medium text-sm truncate">
                {header}
              </div>
            ))}
          </div>
        </div>
      )
    default:
      return null
  }
}