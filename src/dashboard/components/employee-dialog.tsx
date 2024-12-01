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
import { Employee } from "@/types/shift"
import { invoke } from "@tauri-apps/api/tauri"
import { useState } from "react"
import { toast } from "react-hot-toast"

export function AddEmployeeDialog({ onEmployeeAdded }: { onEmployeeAdded: () => void }) {
  const [open, setOpen] = useState(false)
  const [name, setName] = useState("")

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    try {
      if (!name.trim()) {
        toast.error("Personel adı gereklidir")
        return
      }

      const newEmployee: Employee = {
        id: crypto.randomUUID(),
        name: name.trim(),
        group_id: ""
      }

      console.log('Personel ekleniyor:', newEmployee) // Debug için
      await invoke('add_employee', { employee: JSON.stringify(newEmployee) })
      console.log('Personel eklendi') // Debug için
      
      toast.success("Personel başarıyla eklendi")
      setOpen(false)
      setName("")
      onEmployeeAdded()
    } catch (error) {
      console.error('Personel ekleme hatası:', error) // Debug için
      toast.error("Personel eklenirken hata oluştu")
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Yeni Personel Ekle</Button>
      </DialogTrigger>
      <DialogContent>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle>Yeni Personel Ekle</DialogTitle>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="name">Personel Adı</Label>
              <Input
                id="name"
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Personel adını girin"
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