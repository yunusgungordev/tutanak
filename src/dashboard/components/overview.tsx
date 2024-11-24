"use client"

import { useState, useEffect } from "react"
import { Card } from "@/components/ui/card"
import { TemplatePanel, Template } from "./template-panel"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Plus } from "lucide-react"

export function Overview() {
  const [selectedTemplate, setSelectedTemplate] = useState<Template | null>(null)
  const [templates, setTemplates] = useState<Template[]>([])
  const [isEditing, setIsEditing] = useState(false)
  const [editedTitle, setEditedTitle] = useState("")
  const [editedDescription, setEditedDescription] = useState("")
  const [editedNote, setEditedNote] = useState("")

  const addTemplate = (template: Template) => {
    if (selectedTemplate?.id === template.id) {
      setSelectedTemplate(null)
    } else {
      setSelectedTemplate({ ...template, id: crypto.randomUUID() as unknown as number })
      setEditedTitle(template.title)
      setEditedDescription(template.description)
      setEditedNote(template.note || "")
    }
  }

  const handleEdit = () => {
    setIsEditing(true)
  }

  const handleSave = () => {
    if (selectedTemplate) {
      setSelectedTemplate({
        ...selectedTemplate,
        title: editedTitle,
        description: editedDescription,
        note: editedNote
      })
      setIsEditing(false)
    }
  }

  const handleCopy = (text: string) => {
    navigator.clipboard.writeText(text)
  }

  const handleAddTemplate = () => {
    setSelectedTemplate({ 
      id: crypto.randomUUID() as unknown as number,
      title: "",
      description: "",
      note: "",
      template_type: "tutanak"
    })
    setIsEditing(true)
  }

  return (
    <div className="flex h-full">
      <div className="shrink-0 p-2">
        <TemplatePanel 
          onTemplateClick={addTemplate}
          activeTemplateId={selectedTemplate?.id?.toString()}
        />
      </div>
      
      <div className="flex-1">
        <div className="h-full border-2 rounded-lg bg-muted/50 p-4">
          {!selectedTemplate ? (
            <div className="h-full flex flex-col items-center justify-center gap-4">
              <p className="text-lg text-muted-foreground">Sol panelden cümle seçin</p>
            </div>
          ) : (
            <div className="h-full flex flex-col justify-between">
              <div className="space-y-8">
                {isEditing ? (
                  <div className="space-y-4">
                    <input
                      type="text"
                      value={editedTitle}
                      onChange={(e) => setEditedTitle(e.target.value)}
                      className="w-full p-2 border rounded-md text-lg font-medium"
                      placeholder="Başlık"
                    />
                    <textarea
                      value={editedDescription}
                      onChange={(e) => setEditedDescription(e.target.value)}
                      className="w-full p-2 border rounded-md min-h-[100px] text-muted-foreground"
                      placeholder="İçerik"
                    />
                    <textarea
                      value={editedNote}
                      onChange={(e) => setEditedNote(e.target.value)}
                      className="w-full p-2 border rounded-md min-h-[80px] text-muted-foreground"
                      placeholder="Not"
                    />
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="outline" 
                        size="sm"
                        onClick={() => setIsEditing(false)}
                      >
                        İptal
                      </Button>
                      <Button 
                        variant="default" 
                        size="sm"
                        onClick={handleSave}
                      >
                        Kaydet
                      </Button>
                    </div>
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="flex flex-col gap-4">
                      <div className="flex items-start justify-between">
                        <h3 className="text-2xl font-medium">{selectedTemplate.title}</h3>
                        <div className="flex gap-2">
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={() => handleCopy(selectedTemplate.description)}
                          >
                            İçeriği Kopyala
                          </Button>
                          <Button 
                            variant="outline" 
                            size="sm"
                            onClick={handleEdit}
                          >
                            Düzenle
                          </Button>
                        </div>
                      </div>
                      <p className="text-muted-foreground text-lg">{selectedTemplate.description}</p>
                    </div>
                  </div>
                )}
              </div>
              {!isEditing && selectedTemplate.note && (
                <div className="mt-auto pt-4">
                  <div className="p-3 bg-muted rounded-md">
                    <h4 className="text-sm font-medium mb-1">Not:</h4>
                    <p className="text-sm text-muted-foreground">{selectedTemplate.note}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
