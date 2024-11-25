import { useEffect, useState } from "react"
import { invoke } from "@tauri-apps/api/tauri"
import { Card } from "@/components/ui/card"
import { FileText, Plus, Trash2, Search } from "lucide-react"
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
    <div className="w-80 h-full flex flex-col border-r bg-card/50 backdrop-blur-sm">
      <div className="search-container">
        <div className="flex items-center gap-2">
          <div className="relative w-full">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              type="search"
              placeholder="Cümle ara..."
              className="h-9 text-sm bg-background/50 pl-9"
              value={searchQuery}
              onChange={(e) => handleSearch(e.target.value)}
            />
          </div>
          <Dialog open={isAddDialogOpen} onOpenChange={setIsAddDialogOpen}>
            <DialogTrigger asChild>
              <Button variant="outline" size="sm" className="h-9 w-9 p-0">
                <Plus className="h-4 w-4" />
              </Button>
            </DialogTrigger>
            <DialogContent className="sm:max-w-[425px]">
              <DialogHeader>
                <DialogTitle>Yeni Cümle Ekle</DialogTitle>
                <DialogDescription>
                  Yeni bir cümle şablonu oluşturun.
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4 py-4">
                <div className="space-y-2">
                  <label className="text-sm font-medium">Başlık</label>
                  <Input
                    placeholder="Başlık giriniz"
                    value={newTemplate.title}
                    onChange={e => setNewTemplate(prev => ({ ...prev, title: e.target.value }))}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Açıklama</label>
                  <Textarea
                    placeholder="Açıklama giriniz"
                    value={newTemplate.description}
                    onChange={e => setNewTemplate(prev => ({ ...prev, description: e.target.value }))}
                    rows={3}
                  />
                </div>
                <div className="space-y-2">
                  <label className="text-sm font-medium">Not (Opsiyonel)</label>
                  <Textarea
                    placeholder="Not ekleyin"
                    value={newTemplate.note}
                    onChange={e => setNewTemplate(prev => ({ ...prev, note: e.target.value }))}
                    rows={2}
                  />
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setIsAddDialogOpen(false)}>
                  İptal
                </Button>
                <Button onClick={handleSaveTemplate}>
                  Kaydet
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        </div>
      </div>
      
      <div className="flex-1 overflow-auto px-2">
        <div className="space-y-2 py-2">
          {filteredTemplates.map(template => (
            <div
              key={template.id}
              onClick={() => onTemplateClick(template)}
              className={cn(
                "group template-card",
                activeTemplateId === template.id && "template-card-active"
              )}
            >
              <div className="flex items-start justify-between gap-2">
                <div className="flex-1 min-w-0">
                  <h4 className="font-medium text-foreground truncate">
                    {template.title}
                  </h4>
                  <p className="text-sm text-muted-foreground line-clamp-2 mt-1">
                    {template.description}
                  </p>
                  {template.note && (
                    <div className="mt-2 text-xs text-muted-foreground/80 bg-muted/50 rounded p-1.5">
                      {template.note}
                    </div>
                  )}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  className="h-8 w-8 p-0 opacity-0 group-hover:opacity-100 transition-opacity"
                  onClick={(e) => {
                    e.stopPropagation();
                    handleDeleteTemplate(template.id);
                  }}
                >
                  <Trash2 className="h-4 w-4 text-destructive" />
                </Button>
              </div>
            </div>
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