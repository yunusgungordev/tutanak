import { useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/tauri"
import { Card } from "@/components/ui/card"
import { FileText, Plus, Trash2 } from "lucide-react"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger, DialogDescription, DialogFooter } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Textarea } from "@/components/ui/textarea"

export interface Template {
  id?: number
  title: string
  description: string
  note?: string
  template_type: "tutanak" | "form"
  created_at?: string
  updated_at?: string
}

interface TemplatePanelProps {
  onTemplateClick: (template: Template) => void
  activeTemplateId?: string
}

export function TemplatePanel({ onTemplateClick, activeTemplateId }: TemplatePanelProps) {
  const [templates, setTemplates] = useState<Template[]>([])
  const [isAddDialogOpen, setIsAddDialogOpen] = useState(false)
  const [newTemplate, setNewTemplate] = useState<Partial<Template>>({
    title: "",
    description: "",
    note: "",
    template_type: "tutanak"
  })
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<number | undefined>()
  const [searchQuery, setSearchQuery] = useState("")
  const [filteredTemplates, setFilteredTemplates] = useState<Template[]>([])

  useEffect(() => {
    loadTemplates()
  }, [])

  useEffect(() => {
    const filtered = templates.filter(template => 
      template.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
      template.description.toLowerCase().includes(searchQuery.toLowerCase()) ||
      (template.note && template.note.toLowerCase().includes(searchQuery.toLowerCase()))
    )
    setFilteredTemplates(filtered)
  }, [searchQuery, templates])

  const loadTemplates = async () => {
    try {
      const dbTemplates = await invoke<Template[]>('get_templates')
      setTemplates(dbTemplates)
    } catch (error) {
      console.error('Template yükleme hatası:', error)
    }
  }

  const handleSaveTemplate = async () => {
    try {
      const templateData = {
        ...newTemplate,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      }

      await invoke('save_template', { template: templateData })
      setIsAddDialogOpen(false)
      setNewTemplate({
        title: "",
        description: "",
        note: "",
        template_type: "tutanak"
      })
      await loadTemplates()
    } catch (error) {
      console.error('Template kaydetme hatası:', error)
    }
  }

  const handleDeleteTemplate = async (id?: number) => {
    setTemplateToDelete(id)
    setDeleteConfirmOpen(true)
  }

  const confirmDelete = async () => {
    if (!templateToDelete) return;
    
    try {
      await invoke('delete_template', { id: templateToDelete });
      await loadTemplates();
      setDeleteConfirmOpen(false)
    } catch (error) {
      console.error('Template silme hatası:', error);
    }
  }

  const handleSearch = (value: string) => {
    setSearchQuery(value)
  }

  return (
    <div className="w-80 h-full flex flex-col">
      <div className="flex items-center p-2 gap-2">
        <Input
          type="search"
          placeholder="Cümle ara..."
          className="h-8 w-full text-sm"
          value={searchQuery}
          onChange={(e) => handleSearch(e.target.value)}
        />
        <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
          <DialogTrigger asChild>
            <Button variant="ghost" size="sm" className="h-8 w-8 p-0 shrink-0">
              <Plus className="h-4 w-4" />
            </Button>
          </DialogTrigger>
          <DialogContent className="bg-white">
            <DialogHeader>
              <DialogTitle className="text-gray-800">Yeni Cümle Ekle</DialogTitle>
            </DialogHeader>
            <div className="space-y-4 py-4">
              <Input
                placeholder="Başlık"
                value={newTemplate.title}
                onChange={e => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                className="bg-white border-gray-200 focus:border-gray-300 text-gray-800 placeholder:text-gray-400 focus:ring-1 focus:ring-gray-300"
              />
              <Textarea
                placeholder="Açıklama"
                value={newTemplate.description}
                onChange={e => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                className="bg-white border-gray-200 focus:border-gray-300 text-gray-800 placeholder:text-gray-400 focus:ring-1 focus:ring-gray-300"
              />
              <Textarea
                placeholder="Not (Opsiyonel)"
                value={newTemplate.note}
                onChange={e => setNewTemplate(prev => ({ ...prev, note: e.target.value }))}
                className="bg-white border-gray-200 focus:border-gray-300 text-gray-800 placeholder:text-gray-400"
              />
              <Button onClick={handleSaveTemplate} className="w-full">
                Ekle
              </Button>
            </div>
          </DialogContent>
        </Dialog>
      </div>
      
      <div className="flex-1 overflow-auto">
        <div className="space-y-2 overflow-y-auto max-h-[calc(100vh-450px)] p-2 
          [&::-webkit-scrollbar]:w-2 
          [&::-webkit-scrollbar-track]:bg-gray-100 
          [&::-webkit-scrollbar-track]:rounded-lg
          [&::-webkit-scrollbar-thumb]:bg-gray-300 
          [&::-webkit-scrollbar-thumb]:rounded-lg
          [&::-webkit-scrollbar-thumb:hover]:bg-gray-400
          scrollbar-thin 
          scrollbar-track-gray-100 
          scrollbar-thumb-gray-300
          hover:scrollbar-thumb-gray-400">
          {filteredTemplates.map(template => (
            <Card
              key={template.id}
              onClick={() => onTemplateClick(template)}
              className={cn(
                "p-2 transition-all cursor-pointer group bg-white hover:bg-gray-50 border border-gray-100",
                activeTemplateId === template.id && "bg-primary/5 border-primary/20"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div>
                  <h4 className="font-medium text-gray-800">{template.title}</h4>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {template.description}
                  </p>
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-6 w-6 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleDeleteTemplate(template.id)
                  }}
                >
                  <Trash2 className="h-4 w-4 text-red-500" />
                </Button>
              </div>
            </Card>
          ))}
        </div>
      </div>
      <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
        <DialogContent className="bg-white">
          <DialogHeader>
            <DialogTitle className="text-gray-800">Cümleyi Sil</DialogTitle>
            <DialogDescription className="text-gray-600">
              Bu cümleyi silmek istediğinizden emin misiniz?
            </DialogDescription>
          </DialogHeader>
          <div className="flex justify-end gap-2">
            <Button
              variant="outline"
              onClick={() => setDeleteConfirmOpen(false)}
              className="bg-white hover:bg-gray-50 text-gray-800"
            >
              İptal
            </Button>
            <Button
              variant="destructive"
              onClick={confirmDelete}
            >
              Sil
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  )
} 