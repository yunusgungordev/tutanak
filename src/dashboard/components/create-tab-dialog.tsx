import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { useState, useRef, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { DraggableComponentType } from "@/types/component"
import { LayoutConfig, Field, TabContent } from "@/types/tab"
import { FormInput as InputIcon, Type, Table, ListTodo, Square, Plus } from "lucide-react"
import { useTabContext } from "@/contexts/tab-context"
import { toast } from "react-hot-toast"
import { Rnd } from "react-rnd"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"
import { ModelPanel } from "./model-panel"
import { Database, ChevronDown, ChevronRight, ChevronLeft, LayoutGrid } from "lucide-react"
import { AlignHorizontalJustifyStart, AlignHorizontalJustifyCenter, AlignHorizontalJustifyEnd, AlignVerticalJustifyStart, AlignVerticalJustifyCenter, AlignVerticalJustifyEnd, ArrowLeftRight, ArrowUpDown } from "lucide-react"
import { Separator } from "@/components/ui/separator"
import { cn } from "@/lib/utils"
import { AlignStartHorizontal, AlignStartVertical, AlignEndHorizontal, AlignEndVertical } from "lucide-react"
import { Label } from "@/components/ui/label"
import { X } from "lucide-react"
import { Checkbox } from "@/components/ui/checkbox"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import interact from 'interactjs'
import { useInteractable } from "@/hooks/use-interactable"
import { DraggableComponent } from "./draggable-component"
import { ComponentProperties } from "@/types/component"
import { nanoid } from "nanoid"
import { Canvas } from "./canvas"

// Sabit değerler tanımlayalım
const GRID_PADDING = 20
const GRID_WIDTH = 800
const GRID_HEIGHT = 600
const GRID_SNAP = 10

// Izgara yardımcı çizgileri için stil
const gridStyle = {
  backgroundImage: `
    linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px),
    linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)
  `,
  backgroundSize: `${GRID_SNAP}px ${GRID_SNAP}px`
}

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
      y: 0,
      pageSize: 5
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
      y: 0,
      pageSize: 5
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
      headers: ["Başlık 1", "Başlık 2", "Başlık 3"],
      rows: [["", "", ""], ["", "", ""]],
      striped: true,
      bordered: true,
      hoverable: true,
      sortable: false,
      resizable: true,
      pageSize: 5,
      showPagination: false,
      isVisible: true
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
      y: 0,
      pageSize: 5
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
      y: 0,
      pageSize: 5
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
      y: 0,
      pageSize: 5
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

  const addEvent = (event: NonNullable<ComponentProperties['events']>[number]) => {
    const newLayout = [...layout];
    const index = newLayout.findIndex(l => l.id === selectedComponent);
    
    if (index !== -1) {
      newLayout[index] = {
        ...newLayout[index],
        properties: {
          ...newLayout[index].properties,
          events: [...(newLayout[index].properties.events || []), event]
        }
      };
      setLayout(newLayout);
    }
  };

  const updateEvent = (eventId: string, updates: Partial<NonNullable<ComponentProperties['events']>[number]>) => {
    setLayout(layout.map(item => 
      item.id === selectedComponent 
        ? {
            ...item,
            properties: {
              ...item.properties,
              events: item.properties.events?.map(event =>
                event.id === eventId ? { ...event, ...updates } : event
              )
            }
          }
        : item
    ))
  }

  return (
    <div className="p-4 space-y-4 overflow-y-auto">
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
        <div className="space-y-4">
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

          <div className="space-y-2">
            <Label>Tablo Özellikleri</Label>
            <div className="grid grid-cols-2 gap-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={component.properties.striped}
                  onCheckedChange={(checked) => updateProperty('striped', checked)}
                />
                <span className="text-sm">Zebra Desenli</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={component.properties.bordered}
                  onCheckedChange={(checked) => updateProperty('bordered', checked)}
                />
                <span className="text-sm">Kenarlıklar</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={component.properties.hoverable}
                  onCheckedChange={(checked) => updateProperty('hoverable', checked)}
                />
                <span className="text-sm">Hover Efekti</span>
              </div>
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={component.properties.sortable}
                  onCheckedChange={(checked) => updateProperty('sortable', checked)}
                />
                <span className="text-sm">Sıralanabilir</span>
              </div>
            </div>
          </div>

          <div className="space-y-2">
            <Label>Sayfalama</Label>
            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Checkbox
                  checked={component.properties.showPagination}
                  onCheckedChange={(checked) => updateProperty('showPagination', checked)}
                />
                <span className="text-sm">Sayfalama Göster</span>
              </div>
              {component.properties.showPagination && (
                <div className="flex items-center gap-2">
                  <Label className="text-sm">Sayfa Başına Satır:</Label>
                  <Select
                    value={(component.properties.pageSize || 5).toString()}
                    onValueChange={(value) => updateProperty('pageSize', parseInt(value))}
                  >
                    <SelectTrigger className="w-20">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {[5, 10, 15, 20].map((size) => (
                        <SelectItem key={size} value={size.toString()}>
                          {size}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      <div className="space-y-2">
        <Label>Olaylar</Label>
        <Button 
          variant="outline" 
          size="sm" 
          onClick={() => {
            addEvent({
              id: nanoid(),
              type: 'click',
              action: 'showMessage',
              params: { message: 'Yeni mesaj' }
            });
          }}
        >
          Olay Ekle
        </Button>
        
        {component?.properties.events?.map((event) => (
          <div key={event.id} className="flex items-center gap-2 p-2 border rounded-md">
            <Select
              value={event.type}
              onValueChange={(value: "click" | "change" | "submit") => updateEvent(event.id, { type: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="click">Tıklama</SelectItem>
                <SelectItem value="change">Değişim</SelectItem>
                <SelectItem value="submit">Gönder</SelectItem>
              </SelectContent>
            </Select>
            
            <Select
              value={event.action}
              onValueChange={(value: EventAction) => updateEvent(event.id, { action: value })}
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="showMessage">Mesaj Göster</SelectItem>
                <SelectItem value="navigateTab">Tab'a Git</SelectItem>
                <SelectItem value="openDialog">Dialog Aç</SelectItem>
                <SelectItem value="executeQuery">Sorgu Çalıştır</SelectItem>
              </SelectContent>
            </Select>
          </div>
        ))}
      </div>
    </div>
  )
}

type EventAction = 'showMessage' | 'navigateTab' | 'openDialog' | 'executeQuery';

const COMPONENT_CATEGORIES = [
  {
    title: "Temel Bileşenler",
    components: [
      {
        id: "input",
        type: "input",
        label: "Metin Kutusu",
        description: "Tek satırlık metin girişi için",
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
        description: "Uzun metinler için",
        icon: <Type className="w-4 h-4" />,
        defaultProps: {
          label: "Yeni Çok Satırlı Metin",
          placeholder: "Metin giriniz",
          width: 300,
          height: 100,
          x: 0,
          y: 0
        }
      }
    ]
  },
  {
    title: "Veri Bileşenleri",
    components: [
      {
        id: "table",
        type: "table",
        label: "Tablo",
        description: "Verileri düzenli göstermek için",
        icon: <Table className="w-4 h-4" />,
        defaultProps: {
          label: "Yeni Tablo",
          width: 400,
          height: 200,
          x: 0,
          y: 0,
          headers: ["Başlık 1", "Başlık 2", "Başlık 3"],
          rows: [["", "", ""], ["", "", ""]]
        }
      }
    ]
  }
];

export function CreateTabDialog({ 
  open, 
  onOpenChange,
  editMode = false,
  tabToEdit = null
}: { 
  open: boolean, 
  onOpenChange: (open: boolean) => void,
  editMode?: boolean,
  tabToEdit?: TabContent | null
}) {
  const [layout, setLayout] = useState<LayoutConfig[]>([]);
  const [label, setLabel] = useState("");
  const [fields, setFields] = useState<Field[]>([]);
  const [isModelOpen, setIsModelOpen] = useState(true);
  const [isComponentsOpen, setIsComponentsOpen] = useState(true);
  const gridRef = useRef<HTMLDivElement>(null);
  const { saveDynamicTab, updateTab, tabs } = useTabContext();
  const [selectedComponent, setSelectedComponent] = useState<string | null>(null);
  const [activePanel, setActivePanel] = useState<'model' | 'components' | null>('components');
  
  // Düzenleme modu için mevcut verileri yükle
  useEffect(() => {
    if (editMode && tabToEdit && tabToEdit.type === "dynamic") {
      setLabel(tabToEdit.label);
      // @ts-ignore
      setLayout(Array.isArray(tabToEdit.layout) ? tabToEdit.layout : []);
      // @ts-ignore
      setFields(Array.isArray(tabToEdit.fields) ? tabToEdit.fields : []);
    }
  }, [editMode, tabToEdit, open, tabToEdit?.layout]);

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
    try {
      if (!label.trim()) {
        toast.error("Tab başlığı gereklidir");
        return;
      }

      const tabData = {
        id: crypto.randomUUID(),
        label,
        type: "dynamic" as const,
        layout,
        fields,
        database: {
          table_name: label.toLowerCase().replace(/\s+/g, '_'),
          fields: fields
        }
      };

      if (editMode && tabToEdit) {
        await updateTab(tabToEdit.id, tabData);
        toast.success("Tab güncellendi");
      } else {
        await saveDynamicTab(tabData);
        toast.success("Tab oluşturuldu");
      }

      onOpenChange(false);
    } catch (error) {
      const errorMessage = editMode ? "Tab güncellenirken bir hata oluştu" : "Tab oluşturulurken bir hata oluştu";
      toast.error(errorMessage);
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

  const handleUpdateLayout = (newLayout: LayoutConfig[]) => {
    setLayout(newLayout);
    if (selectedComponent && tabToEdit) {
      updateTab(tabToEdit.id, { layout: newLayout });
    }
  }

  const handleUpdateFields = (newFields: Field[]) => {
    setFields(newFields);
    if (selectedComponent && tabToEdit) {
      updateTab(tabToEdit.id, { fields: newFields });
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-[90vw] max-h-[90vh] h-[800px] flex flex-col overflow-hidden">
        <DialogHeader className="px-6 py-4 border-b">
          <DialogTitle>{editMode ? "Tab Düzenle" : "Yeni Tab Oluştur"}</DialogTitle>
          <div className="space-y-2 mt-4">
            <Label htmlFor="tabTitle">Tab Başlığı</Label>
            <Input
              id="tabTitle"
              placeholder="Örn: Müşteri Bilgileri"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />
            <p className="text-sm text-muted-foreground">
              Bu başlık tab menüsünde görünecektir
            </p>
          </div>
        </DialogHeader>

        <div className="flex-1 min-h-0 flex">
          {/* Sol Panel */}
          <div className="w-[250px] border-r flex flex-col h-full">
            {/* Model Bölümü */}
            <Collapsible 
              open={activePanel === 'model'} 
              onOpenChange={() => setActivePanel(activePanel === 'model' ? null : 'model')} 
              className="min-h-0"
            >
              <CollapsibleTrigger asChild>
                <div className="flex items-center justify-between w-full p-4 border-b bg-muted/30 sticky top-0 z-10 cursor-pointer">
                  <div className="flex items-center gap-2">
                    <Database className="w-4 h-4" />
                    <span className="font-medium">Model</span>
                  </div>
                  <div className="h-6 w-6 p-0">
                    {activePanel === 'model' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="overflow-y-auto max-h-[200px] scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                <div className="p-4">
                  <ModelPanel onFieldsChange={setFields} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Bileşenler Bölümü */}
            <Collapsible 
              open={activePanel === 'components'} 
              onOpenChange={() => setActivePanel(activePanel === 'components' ? null : 'components')} 
              className="min-h-0 flex-1 flex flex-col"
            >
              <CollapsibleTrigger className="flex items-center justify-between w-full p-4 border-b bg-muted/30 sticky top-0 z-10">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="w-4 h-4" />
                  <span className="font-medium">Bileşenler</span>
                </div>
                <div className="h-6 w-6 p-0">
                  {activePanel === 'components' ? <ChevronDown className="h-4 w-4" /> : <ChevronRight className="h-4 w-4" />}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="flex-1 min-h-0 overflow-hidden">
                <div className="h-full overflow-y-auto scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent">
                  <div className="p-4 space-y-4">
                    {COMPONENT_CATEGORIES.map((category) => (
                      <div key={category.title} className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">{category.title}</h3>
                        <div className="grid grid-cols-1 gap-2">
                          {category.components.map((component) => (
                            <div
                              key={component.id}
                              onClick={() => handleAddComponent(component)}
                              className="group relative flex items-center gap-2 p-3 rounded-lg border border-border/50 hover:border-primary/50 hover:bg-accent transition-colors cursor-pointer"
                            >
                              <div className="w-10 h-10 flex items-center justify-center rounded-md bg-muted">
                                {component.icon}
                              </div>
                              <div className="flex-1">
                                <div className="font-medium">{component.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {component.description}
                                </div>
                              </div>
                              <div className="opacity-0 group-hover:opacity-100 transition-opacity">
                                <Plus className="w-4 h-4" />
                              </div>
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </CollapsibleContent>
            </Collapsible>
          </div>

          {/* Orta Panel - Canvas */}
          <div className="flex-1 overflow-auto p-6">
            <div className="bg-muted/30 rounded-lg p-4 mb-4">
              <h3 className="text-sm font-medium mb-2">İpuçları</h3>
              <ul className="text-sm text-muted-foreground space-y-1">
                <li>• Bileşenleri sürükleyerek yerleştirebilirsiniz</li>
                <li>• Izgara çizgilerine otomatik yapışır</li>
                <li>• Bileşenleri seçerek özelliklerini düzenleyebilirsiniz</li>
              </ul>
            </div>
            <Canvas
              layout={layout}
              setLayout={setLayout}
              selectedComponent={selectedComponent}
              onSelect={handleComponentSelect}
              renderComponentPreview={renderComponentPreview}
              isDialog={true}
            />
          </div>

          {/* Sağ Panel - Özellikler */}
          {selectedComponent && (
            <div className="w-[200px] border-l flex flex-col h-full">
              <PropertiesPanel
                selectedComponent={selectedComponent}
                layout={layout}
                setLayout={setLayout}
              />
            </div>
          )}
        </div>

        <DialogFooter className="px-6 py-4 border-t">
          <Button variant="outline" onClick={() => onOpenChange(false)}>İptal</Button>
          <Button onClick={handleSave}>
            {editMode ? "Güncelle" : "Oluştur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function renderComponentPreview(item: LayoutConfig) {
  switch (item.type) {
    case "input":
      return (
        <input 
          type="text" 
          className="w-full px-2 py-1 border rounded bg-muted/50" 
          placeholder={item.properties.placeholder || "Metin giriniz"}
          disabled 
        />
      )
    case "textarea":
      return (
        <textarea 
          className="w-full px-2 py-1 border rounded bg-muted/50" 
          placeholder={item.properties.placeholder || "Metin giriniz"}
          disabled 
        />
      )
    case "select":
      return (
        <select className="w-full px-2 py-1 border rounded bg-muted/50" disabled>
          {item.properties.options?.map((option, index) => (
            <option key={index}>{option}</option>
          ))}
        </select>
      )
    case "button":
      return (
        <Button variant="secondary" className="w-full" disabled>
          {item.properties.label || "Buton"}
        </Button>
      )
    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <input type="checkbox" disabled />
          <span className="text-sm">{item.properties.label || "Onay Kutusu"}</span>
        </div>
      )
    case "table":
      return (
        <div className="w-full h-full border rounded-md bg-muted/50 overflow-hidden">
          <div className="p-2 border-b bg-muted/30">
            <span className="text-sm font-medium">{item.properties.label || "Tablo"}</span>
          </div>
          <div className="p-2">
            <table className="w-full">
              <thead>
                <tr>
                  {(item.properties.headers || []).map((header: string, index: number) => (
                    <th key={index} className="p-1 text-sm font-medium text-left border-b">
                      {header}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {(item.properties.rows || [[]]).map((row: string[], rowIndex: number) => (
                  <tr key={rowIndex}>
                    {row.map((cell: string, cellIndex: number) => (
                      <td key={cellIndex} className="p-1 text-sm border-b">
                        {cell || ""}
                      </td>
                    ))}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )
    default:
      return null
  }
}
