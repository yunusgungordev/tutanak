import { useEffect, useRef, useState } from "react"
import { useTabContext } from "@/contexts/tab-context"
import {
  ChevronDown,
  ChevronRight,
  Database,
  FormInput as InputIcon,
  LayoutGrid,
  ListTodo,
  Plus,
  Square,
  Type,
  X,
  MessageSquare,
  ArrowRight,
  Maximize2,
  Edit,
  TextIcon,
  CheckSquare,
  ListFilter,
} from "lucide-react"
import { nanoid } from "nanoid"
import { toast } from "react-hot-toast"

import { ComponentProperties, DraggableComponentType } from "@/types/component"
import { LayoutConfig, TabContent, Field } from "@/types/tab"
import { Button } from "@/components/ui/button"
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/components/ui/collapsible"
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

import { DraggableComponent } from "./draggable-component"
import { ModelPanel } from "./model-panel"
import { CanvasKonva } from "./canvas-konva"

// Sabit değerler tanımlayalım
const GRID_PADDING = 20
const GRID_WIDTH = 800
const GRID_HEIGHT = 600
const GRID_SNAP = 10

// Bileşen hizalama yardımcısı
const getSnapPosition = (value: number): number => {
  return Math.round(value / GRID_SNAP) * GRID_SNAP
}

const COMPONENTS: DraggableComponentType[] = [
  {
    id: "input",
    type: "input",
    label: "Metin Kutusu",
    icon: <InputIcon className="h-4 w-4" />,
    defaultProps: {
      label: "Yeni Metin Kutusu",
      placeholder: "Metin giriniz",
      width: 200,
      height: 40,
      x: 0,
      y: 0,
      pageSize: 5,
    },
  },
  {
    id: "button",
    type: "button",
    label: "Buton",
    icon: <Square className="h-4 w-4" />,
    defaultProps: {
      label: "Yeni Buton",
      width: 120,
      height: 40,
      x: 0,
      y: 0,
    },
  },
  {
    id: "textarea",
    type: "textarea",
    label: "Metin Alanı",
    icon: <TextIcon className="h-4 w-4" />,
    defaultProps: {
      placeholder: "Çok satırlı metin giriniz",
      width: 200,
      height: 100,
      x: 0,
      y: 0,
      minWidth: 100,
      minHeight: 50,
      maxWidth: 800,
      maxHeight: 400,
      resize: 'both'
    },
  },
  {
    id: "select",
    type: "select",
    label: "Seçim Kutusu",
    icon: <ListTodo className="h-4 w-4" />,
    defaultProps: {
      label: "Yeni Seçim Kutusu",
      width: 200,
      height: 40,
      options: ["Seçenek 1", "Seçenek 2", "Seçenek 3"],
      x: 0,
      y: 0,
      pageSize: 5,
    },
  },
  {
    id: "checkbox",
    type: "checkbox",
    label: "Onay Kutusu",
    icon: <Square className="h-4 w-4" />,
    defaultProps: {
      label: "Yeni Onay Kutusu",
      width: 200,
      height: 40,
      x: 0,
      y: 0,
      pageSize: 5,
    },
  },
  {
    id: "text",
    type: "text",
    label: "Metin",
    description: "Özelleştirilebilir metin alanı",
    icon: <Type className="h-4 w-4" />,
    defaultProps: {
      content: "Yeni Metin",
      fontSize: 16,
      fontFamily: "Arial",
      fontWeight: "normal" as const,
      color: "#000000",
      textAlign: "left" as const,
      width: 200,
      height: 40,
      x: 0,
      y: 0,
    },
  },
  {
    id: "checkbox",
    type: "checkbox",
    label: "Onay Kutusu",
    icon: <CheckSquare className="h-4 w-4" />,
    defaultProps: {
      label: "Yeni Onay Kutusu",
      width: 150,
      height: 24,
      x: 0,
      y: 0,
      value: false
    },
  },
  {
    id: "select",
    type: "select",
    label: "Seçim Kutusu",
    icon: <ListFilter className="h-4 w-4" />,
    defaultProps: {
      placeholder: "Seçiniz",
      width: 200,
      height: 40,
      x: 0,
      y: 0,
      options: ["Seçenek 1", "Seçenek 2", "Seçenek 3"],
      value: ""
    },
  },
]

// PropertiesPanel bileşeni
function PropertiesPanel({
  selectedComponent,
  layout,
  setLayout,
}: {
  selectedComponent: string | null
  layout: LayoutConfig[]
  setLayout: (layout: LayoutConfig[]) => void
}) {
  if (!selectedComponent) return null

  const component = layout.find((item) => item.id === selectedComponent)
  if (!component) return null

  const updateProperty = <K extends keyof ComponentProperties>(
    key: K,
    value: ComponentProperties[K]
  ) => {
    const newLayout = [...layout];
    const index = newLayout.findIndex((l) => l.id === selectedComponent);
    if (index !== -1) {
      newLayout[index] = {
        ...newLayout[index],
        properties: {
          ...newLayout[index].properties,
          [key]: value,
        },
      };
      setLayout(newLayout);
    }
  };

  const addEvent = (
    event: NonNullable<ComponentProperties["events"]>[number]
  ) => {
    const newLayout = [...layout]
    const index = newLayout.findIndex((l) => l.id === selectedComponent)

    if (index !== -1) {
      newLayout[index] = {
        ...newLayout[index],
        properties: {
          ...newLayout[index].properties,
          events: [
            ...(newLayout[index].properties.events || []),
            { ...event, params: event.params || {} },
          ],
        },
      }
      setLayout(newLayout)
    }
  }

  const updateEvent = (
    eventId: string,
    updates: Partial<NonNullable<ComponentProperties["events"]>[number]>
  ) => {
    setLayout(
      layout.map((item) =>
        item.id === selectedComponent
          ? {
              ...item,
              properties: {
                ...item.properties,
                events: item.properties.events?.map((event) =>
                  event.id === eventId ? { ...event, ...updates } : event
                ),
              },
            }
          : item
      )
    )
  }

  return (
    <div className="space-y-4 overflow-y-auto p-4">
      <div className="font-medium">Özellikler</div>

      {/* Tm bileşenler için ortak özellikler */}
      <div className="space-y-2">
        <Label>Etiket</Label>
        <Input
          value={component.properties.label || ""}
          onChange={(e) => updateProperty("label", e.target.value)}
          placeholder="Etiket giriniz"
        />
      </div>

      {/* Bileşen tipine özel özellikler */}
      {component.type === "input" && (
        <div className="space-y-2">
          <Label>Placeholder</Label>
          <Input
            value={component.properties.placeholder || ""}
            onChange={(e) => updateProperty("placeholder", e.target.value)}
            placeholder="Placeholder metni giriniz"
          />
        </div>
      )}

      {component.type === "textarea" && (
        <div className="space-y-2">
          <Label>Placeholder</Label>
          <Input
            value={component.properties.placeholder || ""}
            onChange={(e) => updateProperty("placeholder", e.target.value)}
            placeholder="Placeholder metni giriniz"
          />
        </div>
      )}

      {component.type === "button" && (
        <div className="space-y-2">
          <Label>Buton Metni</Label>
          <Input
            value={component.properties.label || ""}
            onChange={(e) => updateProperty("label", e.target.value)}
            placeholder="Buton metni giriniz"
          />
        </div>
      )}

      {component.type === "select" && (
        <div className="space-y-2">
          <Label>Seçenekler</Label>
          <div className="space-y-2">
            {(component.properties.options || []).map(
              (option: string, index: number) => (
                <div key={index} className="flex gap-2">
                  <Input
                    value={option}
                    onChange={(e) => {
                      const newOptions = [
                        ...(component.properties.options || []),
                      ]
                      newOptions[index] = e.target.value
                      updateProperty("options", newOptions)
                    }}
                    placeholder={`Seçenek ${index + 1}`}
                  />
                  <Button
                    variant="ghost"
                    size="icon"
                    onClick={() => {
                      const newOptions = [
                        ...(component.properties.options || []),
                      ]
                      newOptions.splice(index, 1)
                      updateProperty("options", newOptions)
                    }}
                  >
                    <X className="h-4 w-4" />
                  </Button>
                </div>
              )
            )}
            <Button
              variant="outline"
              size="sm"
              onClick={() => {
                const newOptions = [...(component.properties.options || []), ""]
                updateProperty("options", newOptions)
              }}
            >
              Seçenek Ekle
            </Button>
          </div>
        </div>
      )}

      {component.type === "checkbox" && (
        <div className="space-y-2">
          <Label>Onay Kutusu Metni</Label>
          <Input
            value={component.properties.label || ""}
            onChange={(e) => updateProperty("label", e.target.value)}
            placeholder="Onay kutusu metni giriniz"
          />
        </div>
      )}

      {component.type === "a4" && (
        <div className="space-y-2">
          <Label>İçerik</Label>
          <Textarea
            value={component.properties.content || ""}
            onChange={(e) => updateProperty("content", e.target.value)}
            placeholder="İçerik giriniz"
            className="min-h-[200px]"
          />
        </div>
      )}

      {component.type === "text" && (
        <div className="space-y-4">
          <div className="space-y-2">
            <Label className="text-xs">Metin İçeriği</Label>
            <Textarea
              value={component.properties.content || ""}
              onChange={(e) => {
                const newLayout = [...layout];
                const index = newLayout.findIndex((l) => l.id === component.id);
                if (index !== -1) {
                  newLayout[index].properties.content = e.target.value;
                  setLayout(newLayout);
                }
              }}
              className="min-h-[100px]"
            />
          </div>
          
          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-xs">Yazı Boyutu</Label>
              <Input
                type="number"
                value={component.properties.fontSize || 16}
                onChange={(e) => {
                  const newLayout = [...layout];
                  const index = newLayout.findIndex((l) => l.id === component.id);
                  if (index !== -1) {
                    newLayout[index].properties.fontSize = parseInt(e.target.value);
                    setLayout(newLayout);
                  }
                }}
                min={8}
                max={72}
              />
            </div>
            
            <div className="space-y-2">
              <Label className="text-xs">Yazı Rengi</Label>
              <Input
                type="color"
                value={component.properties.color || "#000000"}
                onChange={(e) => {
                  const newLayout = [...layout];
                  const index = newLayout.findIndex((l) => l.id === component.id);
                  if (index !== -1) {
                    newLayout[index].properties.color = e.target.value;
                    setLayout(newLayout);
                  }
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-2 gap-2">
            <div className="space-y-2">
              <Label className="text-xs">Yazı Tipi</Label>
              <Select
                value={component.properties.fontFamily || "Arial"}
                onValueChange={(value) => {
                  const newLayout = [...layout];
                  const index = newLayout.findIndex((l) => l.id === component.id);
                  if (index !== -1) {
                    newLayout[index].properties.fontFamily = value;
                    setLayout(newLayout);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="Arial">Arial</SelectItem>
                  <SelectItem value="Times New Roman">Times New Roman</SelectItem>
                  <SelectItem value="Courier New">Courier New</SelectItem>
                  <SelectItem value="Georgia">Georgia</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-xs">Yazı Kalınlığı</Label>
              <Select
                value={component.properties.fontWeight || "normal"}
                onValueChange={(value: "normal" | "bold") => {
                  const newLayout = [...layout];
                  const index = newLayout.findIndex((l) => l.id === component.id);
                  if (index !== -1) {
                    newLayout[index].properties.fontWeight = value;
                    setLayout(newLayout);
                  }
                }}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="normal">Normal</SelectItem>
                  <SelectItem value="bold">Kalın</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </div>
        </div>
      )}

      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <Label>Olaylar</Label>
          <Button
            variant="outline"
            size="sm"
            onClick={() => {
              addEvent({
                id: nanoid(),
                type: "click",
                action: "showMessage",
                params: { message: "Yeni mesaj" },
              })
            }}
            className="h-7 px-2"
          >
            <Plus className="mr-1 h-3 w-3" />
            Olay Ekle
          </Button>
        </div>

        <div className="space-y-3">
          {component?.properties.events?.map((event) => (
            <EventPanel
              key={event.id}
              event={event}
              onUpdate={(updates) => updateEvent(event.id, updates)}
              onDelete={() => {
                const newEvents = component.properties.events?.filter((e) => e.id !== event.id)
                updateProperty("events", newEvents)
              }}
              availableComponents={layout.filter((item) => item.id !== selectedComponent)}
            />
          ))}
        </div>
      </div>
    </div>
  )
}

type EventAction = "showMessage" | "navigateTab" | "openDialog" | "executeQuery" | "setValue"

const COMPONENT_CATEGORIES = [
  {
    title: "Temel Bileşenler",
    components: [
      {
        id: "text",
        type: "text",
        label: "Metin",
        description: "Özelleştirilebilir metin alanı",
        icon: <Type className="h-4 w-4" />,
        defaultProps: COMPONENTS.find(c => c.id === "text")!.defaultProps,
        properties: COMPONENTS.find(c => c.id === "text")!.defaultProps
      },
      {
        id: "input",
        type: "input",
        label: "Metin Kutusu",
        description: "Tek satırlık metin girişi",
        icon: <InputIcon className="h-4 w-4" />,
        defaultProps: COMPONENTS.find(c => c.id === "input")!.defaultProps,
        properties: COMPONENTS.find(c => c.id === "input")!.defaultProps
      },
      {
        id: "textarea",
        type: "textarea",
        label: "Çok Satırlı Metin",
        description: "Çok satırlı metin girişi",
        icon: <Type className="h-4 w-4" />,
        defaultProps: COMPONENTS.find(c => c.id === "textarea")!.defaultProps,
        properties: COMPONENTS.find(c => c.id === "textarea")!.defaultProps
      },
    ]
  },
  {
    title: "Form Bileşenleri",
    components: [
      {
        id: "select",
        type: "select",
        label: "Seçim Kutusu",
        description: "Açılır liste seçimi",
        icon: <ListTodo className="h-4 w-4" />,
        defaultProps: COMPONENTS.find(c => c.id === "select")!.defaultProps,
        properties: COMPONENTS.find(c => c.id === "select")!.defaultProps
      },
      {
        id: "checkbox",
        type: "checkbox",
        label: "Onay Kutusu",
        description: "Onay kutusu",
        icon: <Square className="h-4 w-4" />,
        defaultProps: COMPONENTS.find(c => c.id === "checkbox")!.defaultProps,
        properties: COMPONENTS.find(c => c.id === "checkbox")!.defaultProps
      },
      {
        id: "button",
        type: "button",
        label: "Buton",
        description: "Tıklanabilir düğme",
        icon: <Square className="h-4 w-4" />,
        defaultProps: COMPONENTS.find(c => c.id === "button")!.defaultProps,
        properties: COMPONENTS.find(c => c.id === "button")!.defaultProps
      },
    ]
  }
]

export function CreateTabDialog({
  open,
  onOpenChange,
  editMode = false,
  tabToEdit = null,
}: {
  open: boolean
  onOpenChange: (open: boolean) => void
  editMode?: boolean
  tabToEdit?: TabContent | null
}) {
  const [layout, setLayout] = useState<LayoutConfig[]>([])
  const [label, setLabel] = useState("")
  const [fields, setFields] = useState<Field[]>([])
  const [isModelOpen, setIsModelOpen] = useState(true)
  const [isComponentsOpen, setIsComponentsOpen] = useState(true)
  const gridRef = useRef<HTMLDivElement>(null)
  const { saveDynamicTab, updateTab, tabs } = useTabContext()
  const [selectedComponent, setSelectedComponent] = useState<string | null>(
    null
  )
  const [activePanel, setActivePanel] = useState<"model" | "components" | null>(
    "components"
  )

  // Düzenleme modu için mevcut verileri yükle
  useEffect(() => {
    if (editMode && tabToEdit && tabToEdit.type === "dynamic") {
      setLabel(tabToEdit.label)
      // @ts-ignore
      setLayout(Array.isArray(tabToEdit.layout) ? tabToEdit.layout : [])
      // @ts-ignore
      setFields(Array.isArray(tabToEdit.fields) ? tabToEdit.fields : [])
    }
  }, [editMode, tabToEdit, open, tabToEdit?.layout])

  // Çakışma kontrolü
  const checkCollision = (newItem: any, existingItems: any[]) => {
    const buffer = 10 // Minimum boşluk
    return existingItems.some((item) => {
      const overlap = !(
        newItem.properties.x + newItem.properties.width + buffer <
          item.properties.x ||
        newItem.properties.x >
          item.properties.x + item.properties.width + buffer ||
        newItem.properties.y + newItem.properties.height + buffer <
          item.properties.y ||
        newItem.properties.y >
          item.properties.y + item.properties.height + buffer
      )
      return overlap
    })
  }

  // Bileşen ekleme işlemi güncellenmesi
  const handleAddComponent = (component: DraggableComponentType) => {
    const newLayoutItem: LayoutConfig = {
      id: crypto.randomUUID(),
      type: component.type,
      properties: {
        ...component.defaultProps,
        x: 20,
        y: 20,
      },
    }
    setLayout((prev) => [...prev, newLayoutItem])
  }

  const handleSave = async () => {
    try {
      if (!label.trim()) {
        toast.error("Tab başlığı gereklidir")
        return
      }

      const tabData = {
        id: crypto.randomUUID(),
        label,
        type: "dynamic" as const,
        layout,
        fields,
        database: {
          table_name: label.toLowerCase().replace(/\s+/g, "_"),
          fields: fields,
        },
      }

      if (editMode && tabToEdit) {
        await updateTab(tabToEdit.id, tabData)
        toast.success("Tab güncellendi")
      } else {
        await saveDynamicTab(tabData)
        toast.success("Tab oluşturuldu")
      }

      onOpenChange(false)
    } catch (error) {
      const errorMessage = editMode
        ? "Tab güncellenirken bir hata oluştu"
        : "Tab oluşturulurken bir hata oluştu"
      toast.error(errorMessage)
    }
  }

  const handleComponentSelect = (id: string | null) => {
    setSelectedComponent(id)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="flex h-[800px] max-h-[90vh] max-w-[90vw] flex-col overflow-hidden">
        <DialogHeader className="border-b px-6 py-4">
          <DialogTitle>
            {editMode ? "Tab Düzenle" : "Yeni Tab Oluştur"}
          </DialogTitle>
          <div className="mt-4 space-y-2">
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

        <div className="flex min-h-0 flex-1">
          {/* Sol Panel */}
          <div className="flex h-full w-[250px] flex-col border-r">
            {/* Model Bölümü */}
            <Collapsible
              open={activePanel === "model"}
              onOpenChange={() =>
                setActivePanel(activePanel === "model" ? null : "model")
              }
              className="min-h-0"
            >
              <CollapsibleTrigger asChild>
                <div className="sticky top-0 z-10 flex w-full cursor-pointer items-center justify-between border-b bg-muted/30 p-4">
                  <div className="flex items-center gap-2">
                    <Database className="h-4 w-4" />
                    <span className="font-medium">Model</span>
                  </div>
                  <div className="h-6 w-6 p-0">
                    {activePanel === "model" ? (
                      <ChevronDown className="h-4 w-4" />
                    ) : (
                      <ChevronRight className="h-4 w-4" />
                    )}
                  </div>
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent max-h-[200px] overflow-y-auto">
                <div className="p-4">
                  <ModelPanel onFieldsChange={setFields} />
                </div>
              </CollapsibleContent>
            </Collapsible>

            {/* Bileşenler Bölümü */}
            <Collapsible
              open={activePanel === "components"}
              onOpenChange={() =>
                setActivePanel(
                  activePanel === "components" ? null : "components"
                )
              }
              className="flex min-h-0 flex-1 flex-col"
            >
              <CollapsibleTrigger className="sticky top-0 z-10 flex w-full items-center justify-between border-b bg-muted/30 p-4">
                <div className="flex items-center gap-2">
                  <LayoutGrid className="h-4 w-4" />
                  <span className="font-medium">Bileşenler</span>
                </div>
                <div className="h-6 w-6 p-0">
                  {activePanel === "components" ? (
                    <ChevronDown className="h-4 w-4" />
                  ) : (
                    <ChevronRight className="h-4 w-4" />
                  )}
                </div>
              </CollapsibleTrigger>
              <CollapsibleContent className="min-h-0 flex-1 overflow-hidden">
                <div className="scrollbar-thin scrollbar-thumb-muted-foreground/20 scrollbar-track-transparent h-full overflow-y-auto">
                  <div className="space-y-4 p-4">
                    {COMPONENT_CATEGORIES.map((category) => (
                      <div key={category.title} className="space-y-2">
                        <h3 className="text-sm font-medium text-muted-foreground">
                          {category.title}
                        </h3>
                        <div className="grid grid-cols-1 gap-2">
                          {category.components.map((component) => (
                            <DraggableComponent
                              key={component.id}
                              component={component}
                              onAddComponent={handleAddComponent}
                            />
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
            <div className="mb-4 rounded-lg bg-muted/30 p-4">
              <h3 className="mb-2 text-sm font-medium">İpuçları</h3>
              <ul className="space-y-1 text-sm text-muted-foreground">
                <li>• Bileşenleri sürükleyerek yerleştirebilirsiniz</li>
                <li>• Izgara çizgilerine otomatik yapışır</li>
                <li>• Bileşenleri seçerek özelliklerini düzenleyebilirsiniz</li>
              </ul>
            </div>
            <CanvasKonva
              layout={layout}
              setLayout={setLayout}
              selectedComponent={selectedComponent}
              onSelect={handleComponentSelect}
              renderComponentPreview={(item) => renderComponentPreview(item, layout, setLayout)}
              isDialog={true}
              onEventTrigger={(event, config) => {
                // Olay işleyici mantığı
              }}
            />
          </div>

          {/* Sağ Panel - Özellikler */}
          {selectedComponent && (
            <div className="flex h-full w-[200px] flex-col border-l">
              <PropertiesPanel
                selectedComponent={selectedComponent}
                layout={layout}
                setLayout={setLayout}
              />
            </div>
          )}
        </div>

        <DialogFooter className="border-t px-6 py-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            İptal
          </Button>
          <Button onClick={handleSave}>
            {editMode ? "Güncelle" : "Oluştur"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}

function renderComponentPreview(
  item: LayoutConfig,
  layout: LayoutConfig[],
  setLayout: (layout: LayoutConfig[]) => void
) {
  const handleEvent = (event: any, eventType: "click" | "change") => {
    const events = item.properties.events?.filter(e => e.type === eventType);
    events?.forEach(event => {
      item.properties.onEventTrigger?.(event, event);
    });
  };

  switch (item.type) {
    case "input":
      return (
        <input
          type="text"
          className="w-full rounded border bg-muted/50 px-2 py-1"
          placeholder={item.properties.placeholder || "Metin giriniz"}
          onChange={(e) => handleEvent(e, "change")}
        />
      )
    case "textarea":
      return (
        <textarea
          className="w-full rounded border bg-muted/50 px-2 py-1"
          placeholder={item.properties.placeholder || "Metin giriniz"}
          onChange={(e) => handleEvent(e, "change")}
        />
      )
    case "select":
      return (
        <select
          className="w-full rounded border bg-muted/50 px-2 py-1"
          onChange={(e) => handleEvent(e, "change")}
        >
          {item.properties.options?.map((option, index) => (
            <option key={index}>{option}</option>
          ))}
        </select>
      )
    case "button":
      return (
        <Button 
          variant="secondary" 
          className="w-full"
          onClick={(e) => handleEvent(e, "click")}
        >
          {item.properties.label || "Buton"}
        </Button>
      )
    case "checkbox":
      return (
        <div className="flex items-center gap-2">
          <input 
            type="checkbox" 
            onChange={(e) => handleEvent(e, "change")}
          />
          <span className="text-sm">
            {item.properties.label || "Onay Kutusu"}
          </span>
        </div>
      )
    case "text":
      return (
        <div
          style={{
            fontSize: `${item.properties.fontSize || 16}px`,
            fontFamily: item.properties.fontFamily || "Arial",
            fontWeight: item.properties.fontWeight || "normal",
            color: item.properties.color || "#000000",
            textAlign: item.properties.textAlign || "left",
            width: "100%",
            height: "100%",
            padding: "8px",
            overflow: "auto"
          }}
          className="rounded-md border bg-background"
        >
          {item.properties.content || ""}
        </div>
      )
    default:
      return null
  }
}

type EventType = "click" | "submit" | "change";

const EventPanel = ({
  event,
  onUpdate,
  onDelete,
  availableComponents,
}: {
  event: NonNullable<ComponentProperties["events"]>[number]
  onUpdate: (updates: Partial<NonNullable<ComponentProperties["events"]>[number]>) => void
  onDelete: () => void
  availableComponents: LayoutConfig[]
}) => {
  return (
    <div className="space-y-3 rounded-lg border p-3">
      <div className="flex items-center justify-between">
        <h4 className="text-sm font-medium">Olay Ayarları</h4>
        <Button variant="ghost" size="icon" onClick={onDelete}>
          <X className="h-4 w-4" />
        </Button>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Tetikleyici</Label>
        <Select 
          value={event.type as EventType} 
          onValueChange={(value: EventType) => onUpdate({ type: value })}
        >
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="click">Tıklama</SelectItem>
            <SelectItem value="change">Değişim</SelectItem>
            <SelectItem value="submit">Gönder</SelectItem>
          </SelectContent>
        </Select>
      </div>

      <div className="space-y-2">
        <Label className="text-xs">Eylem</Label>
        <Select value={event.action} onValueChange={(value) => onUpdate({ action: value as EventAction })}>
          <SelectTrigger className="h-8">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="showMessage">
              <div className="flex items-center gap-2">
                <MessageSquare className="h-4 w-4" />
                <span>Mesaj Göster</span>
              </div>
            </SelectItem>
            <SelectItem value="navigateTab">
              <div className="flex items-center gap-2">
                <ArrowRight className="h-4 w-4" />
                <span>Tab'a Git</span>
              </div>
            </SelectItem>
            <SelectItem value="openDialog">
              <div className="flex items-center gap-2">
                <Maximize2 className="h-4 w-4" />
                <span>Dialog Aç</span>
              </div>
            </SelectItem>
            <SelectItem value="setValue">
              <div className="flex items-center gap-2">
                <Edit className="h-4 w-4" />
                <span>Değer Ata</span>
              </div>
            </SelectItem>
          </SelectContent>
        </Select>
      </div>

      {event.action === "showMessage" && (
        <div className="space-y-2">
          <Label className="text-xs">Mesaj</Label>
          <Input
            value={event.params?.message || ""}
            onChange={(e) => onUpdate({ params: { message: e.target.value } })}
            placeholder="Gösterilecek mesaj"
            className="h-8"
          />
        </div>
      )}

      {event.action === "setValue" && (
        <div className="space-y-2">
          <Label className="text-xs">Hedef Bileşen</Label>
          <Select
            value={event.targetComponent}
            onValueChange={(value) => onUpdate({ targetComponent: value })}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Bileşen seçin" />
            </SelectTrigger>
            <SelectContent>
              {availableComponents.map((comp) => (
                <SelectItem key={comp.id} value={comp.id}>
                  <div className="flex items-center gap-2">
                    <span>{comp.type}</span>
                    <span className="text-xs text-muted-foreground">({comp.id})</span>
                  </div>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Label className="text-xs">Atanacak Değer</Label>
          <Input
            value={event.params?.value || ""}
            onChange={(e) => onUpdate({ params: { value: e.target.value } })}
            placeholder="Değer"
            className="h-8"
          />
        </div>
      )}
    </div>
  )
}
