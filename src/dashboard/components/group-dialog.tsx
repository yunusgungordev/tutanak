import { Button } from "@/components/ui/button"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogFooter,
} from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Group } from "@/types/shift"
import { invoke } from "@tauri-apps/api/tauri"
import { useState } from "react"
import { toast } from "react-hot-toast"

export function AddGroupDialog({ onGroupAdded }: { onGroupAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!name.trim()) {
        toast.error("Grup adı gereklidir")
        return
      }

      const newGroup: Group = {
        id: crypto.randomUUID(),
        name: name.trim(),
        employees: [],
        current_shift: 'Rest'
      }

      console.log('Grup ekleniyor:', newGroup) // Debug için
      await invoke('add_group', { group: JSON.stringify(newGroup) })
      console.log('Grup eklendi') // Debug için
      
      toast.success("Grup başarıyla eklendi")
      setOpen(false)
      setName("")
      onGroupAdded()
    } catch (error) {
      console.error('Grup ekleme hatası:', error) // Debug için
      toast.error("Grup eklenirken hata oluştu")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Yeni Grup Ekle</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Yeni Grup Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Grup Adı</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Grup adını girin"
              />
            </div>
          </div>
          <DialogFooter>
            <Button type="submit">Kaydet</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  )
} 