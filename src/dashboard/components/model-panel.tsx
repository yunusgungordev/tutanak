import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2, GripVertical, ChevronDown, ChevronUp } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from "@/components/ui/collapsible"

interface FieldOptions {
  minLength?: number
  maxLength?: number
  min?: number
  max?: number
  pattern?: string
  defaultValue?: any
}

interface Field {
  name: string
  type: string
  required: boolean
  error?: string
  options?: FieldOptions
}

interface ModelPanelProps {
  onFieldsChange: (fields: Field[]) => void
}

export function ModelPanel({ onFieldsChange }: ModelPanelProps) {
  const [fields, setFields] = useState<Field[]>([])

  const addField = () => {
    const newField: Field = {
      name: "",
      type: "text",
      required: true
    }
    setFields([...fields, newField])
    onFieldsChange([...fields, newField])
  }

  const validateFieldName = (name: string): string | undefined => {
    if (!name) return "Alan adı zorunludur"
    if (name.length < 2) return "Alan adı en az 2 karakter olmalıdır"
    if (!/^[a-z][a-z0-9_]*$/.test(name)) return "Alan adı küçük harf ile başlamalı ve sadece harf, rakam ve alt çizgi içermelidir"
    if (fields.some((field, idx) => field.name === name)) return "Bu alan adı zaten kullanılıyor"
    return undefined
  }

  const updateField = (index: number, updates: Partial<Field>) => {
    const updatedFields = fields.map((field, i) => {
      if (i !== index) return field
      
      const updatedField = { ...field, ...updates }
      
      if (updates.name !== undefined) {
        updatedField.error = validateFieldName(updates.name)
      }
      
      return updatedField
    })
    setFields(updatedFields)
    onFieldsChange(updatedFields.filter(f => !f.error))
  }

  const removeField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index)
    setFields(updatedFields)
    onFieldsChange(updatedFields)
  }

  const reorderFields = (list: Field[], startIndex: number, endIndex: number) => {
    const result = Array.from(list)
    const [removed] = result.splice(startIndex, 1)
    result.splice(endIndex, 0, removed)
    return result
  }

  const TypeSettings = ({ field, index, onUpdate }: { 
    field: Field
    index: number
    onUpdate: (index: number, updates: Partial<Field>) => void 
  }) => {
    const [isOpen, setIsOpen] = useState(false)

    const renderAdvancedOptions = () => {
      switch (field.type) {
        case "text":
          return (
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Min Uzunluk</label>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={field.options?.minLength || ""}
                    onChange={(e) => onUpdate(index, { 
                      options: { 
                        ...field.options, 
                        minLength: parseInt(e.target.value) || undefined 
                      } 
                    })}
                    className="h-7"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Max Uzunluk</label>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={field.options?.maxLength || ""}
                    onChange={(e) => onUpdate(index, { 
                      options: { 
                        ...field.options, 
                        maxLength: parseInt(e.target.value) || undefined 
                      } 
                    })}
                    className="h-7"
                  />
                </div>
              </div>
              <div>
                <label className="text-xs text-muted-foreground">Regex Pattern</label>
                <Input
                  placeholder="örn: ^[0-9]+$"
                  value={field.options?.pattern || ""}
                  onChange={(e) => onUpdate(index, { 
                    options: { ...field.options, pattern: e.target.value } 
                  })}
                  className="h-7"
                />
              </div>
            </div>
          )
        case "number":
          return (
            <div className="space-y-2 pt-2">
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="text-xs text-muted-foreground">Min Değer</label>
                  <Input
                    type="number"
                    placeholder="Min"
                    value={field.options?.min || ""}
                    onChange={(e) => onUpdate(index, { 
                      options: { 
                        ...field.options, 
                        min: parseInt(e.target.value) || undefined 
                      } 
                    })}
                    className="h-7"
                  />
                </div>
                <div>
                  <label className="text-xs text-muted-foreground">Max Değer</label>
                  <Input
                    type="number"
                    placeholder="Max"
                    value={field.options?.max || ""}
                    onChange={(e) => onUpdate(index, { 
                      options: { 
                        ...field.options, 
                        max: parseInt(e.target.value) || undefined 
                      } 
                    })}
                    className="h-7"
                  />
                </div>
              </div>
            </div>
          )
        default:
          return null
      }
    }

    return (
      <div className="space-y-2">
        <div className="flex gap-2">
          <Select
            value={field.type}
            onValueChange={(value) => onUpdate(index, { type: value })}
          >
            <SelectTrigger className="h-8 flex-1">
              <SelectValue placeholder="Tip seçin" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="text">Metin</SelectItem>
              <SelectItem value="number">Sayı</SelectItem>
              <SelectItem value="date">Tarih</SelectItem>
              <SelectItem value="boolean">Evet/Hayır</SelectItem>
            </SelectContent>
          </Select>
          {(field.type === "text" || field.type === "number") && (
            <Button 
              variant="outline" 
              size="sm" 
              className="h-8 px-2"
              onClick={() => setIsOpen(!isOpen)}
            >
              {isOpen ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
          )}
        </div>
        {isOpen && (field.type === "text" || field.type === "number") && renderAdvancedOptions()}
      </div>
    )
  }

  const fieldTemplates = [
    {
      name: "ad_soyad",
      label: "Ad Soyad",
      type: "text",
      required: true,
      options: {
        minLength: 2,
        maxLength: 50
      }
    },
    {
      name: "email",
      label: "E-posta",
      type: "text",
      required: true,
      options: {
        pattern: "^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\\.[a-zA-Z]{2,}$"
      }
    },
    {
      name: "telefon",
      label: "Telefon",
      type: "text",
      required: true,
      options: {
        pattern: "^[0-9]{10}$"
      }
    }
  ]

  return (
    <div className="flex flex-col h-[500px]">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between">
          <Select
            onValueChange={(template) => {
              const selectedTemplate = fieldTemplates.find(t => t.name === template)
              if (selectedTemplate) {
                setFields([...fields, { ...selectedTemplate }])
              }
            }}
          >
            <SelectTrigger className="h-8">
              <SelectValue placeholder="Şablon seç" />
            </SelectTrigger>
            <SelectContent>
              {fieldTemplates.map(template => (
                <SelectItem key={template.name} value={template.name}>
                  {template.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
            <Button variant="ghost" size="sm" onClick={addField}>
              <Plus className="w-4 h-4" />
            </Button>
          </div>
        </div>
      </div>

      <ScrollArea className="flex-1">
        <div className="p-4">
          <DragDropContext
            onDragEnd={(result) => {
              if (!result.destination) return
              
              const items = reorderFields(
                fields,
                result.source.index,
                result.destination.index
              )
              setFields(items)
              onFieldsChange(items)
            }}
          >
            <Droppable droppableId="fields">
              {(provided) => (
                <div {...provided.droppableProps} ref={provided.innerRef}>
                  {fields.map((field, index) => (
                    <Draggable key={field.name || index} draggableId={field.name || `field-${index}`} index={index}>
                      {(provided) => (
                        <div
                          ref={provided.innerRef}
                          {...provided.draggableProps}
                          className="mb-2"
                        >
                          <div className="flex items-center gap-2 p-3 border rounded-md bg-card">
                            <div {...provided.dragHandleProps}>
                              <GripVertical className="w-4 h-4 text-muted-foreground" />
                            </div>
                            <div className="flex-1 space-y-2">
                              <Input
                                placeholder="Alan adı"
                                value={field.name}
                                onChange={(e) => updateField(index, { name: e.target.value })}
                                className="h-8"
                              />
                              <TypeSettings 
                                field={field} 
                                index={index} 
                                onUpdate={(index, updates) => updateField(index, updates)} 
                              />
                              <div className="flex items-center gap-2">
                                <input
                                  type="checkbox"
                                  checked={field.required}
                                  onChange={(e) => updateField(index, { required: e.target.checked })}
                                  className="rounded border-gray-300"
                                />
                                <span className="text-sm text-muted-foreground">Zorunlu alan</span>
                              </div>
                            </div>
                            <Button
                              variant="ghost"
                              size="sm"
                              onClick={() => removeField(index)}
                              className="h-8 w-8 p-0"
                            >
                              <Trash2 className="w-4 h-4 text-destructive" />
                            </Button>
                          </div>
                        </div>
                      )}
                    </Draggable>
                  ))}
                  {provided.placeholder}
                </div>
              )}
            </Droppable>
          </DragDropContext>
        </div>
      </ScrollArea>
    </div>
  )
} 