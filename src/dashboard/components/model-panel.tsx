import { useState } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { ScrollArea } from "@/components/ui/scroll-area"

interface Field {
  name: string
  type: string
  required: boolean
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

  const updateField = (index: number, updates: Partial<Field>) => {
    const updatedFields = fields.map((field, i) => 
      i === index ? { ...field, ...updates } : field
    )
    setFields(updatedFields)
    onFieldsChange(updatedFields)
  }

  const removeField = (index: number) => {
    const updatedFields = fields.filter((_, i) => i !== index)
    setFields(updatedFields)
    onFieldsChange(updatedFields)
  }

  return (
    <div className="flex flex-col h-full">
      <div className="p-4 border-b bg-muted/30">
        <div className="flex items-center justify-between">
          <h3 className="font-medium">Veritabanı Modeli</h3>
          <Button variant="ghost" size="sm" onClick={addField}>
            <Plus className="w-4 h-4 mr-2" />
            Alan Ekle
          </Button>
        </div>
      </div>

      <ScrollArea className="flex-1 p-4">
        <div className="space-y-4">
          {fields.map((field, index) => (
            <div key={index} className="flex items-start gap-2 p-3 border rounded-md bg-card">
              <div className="flex-1 space-y-2">
                <Input
                  placeholder="Alan adı"
                  value={field.name}
                  onChange={(e) => updateField(index, { name: e.target.value })}
                  className="h-8"
                />
                <Select
                  value={field.type}
                  onValueChange={(value) => updateField(index, { type: value })}
                >
                  <SelectTrigger className="h-8">
                    <SelectValue placeholder="Tip seçin" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="text">Metin</SelectItem>
                    <SelectItem value="number">Sayı</SelectItem>
                    <SelectItem value="date">Tarih</SelectItem>
                    <SelectItem value="boolean">Evet/Hayır</SelectItem>
                  </SelectContent>
                </Select>
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
          ))}
        </div>
      </ScrollArea>
    </div>
  )
} 