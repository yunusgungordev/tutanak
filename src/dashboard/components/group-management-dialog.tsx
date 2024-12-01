import { DialogHeader, DialogFooter } from "@/components/ui/dialog"
import { validateGroupChange } from "@/lib/ai-helper"
import { Group, Employee } from "@/types/shift"
import { Dialog, DialogTrigger, DialogContent, DialogTitle } from "@radix-ui/react-dialog"
import { SelectTrigger, SelectValue, SelectContent, SelectItem } from "@radix-ui/react-select"
import { invoke } from "@tauri-apps/api/tauri"
import { Select } from "@/components/ui/select"
import { Users } from "lucide-react"
import { useState } from "react"
import { Button } from "@/components/ui/button"
import toast from "react-hot-toast"
import { Label } from "recharts"

// Bileşenin prop tiplerini tanımlayın
interface GroupManagementDialogProps {
  onGroupChanged: () => Promise<void>;
}

export function GroupManagementDialog({ onGroupChanged }: GroupManagementDialogProps) {
  const [open, setOpen] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [selectedEmployee, setSelectedEmployee] = useState<string | null>(null)
  const [targetGroup, setTargetGroup] = useState<string | null>(null)

  const handleEmployeeTransfer = async () => {
    if (!selectedEmployee || !targetGroup) return

    try {
      const validation = await validateGroupChange(selectedEmployee, targetGroup)
      
      if (!validation.isValid) {
        toast.error(validation.message)
        return
      }

      await invoke('update_employee_group', { 
        employeeId: selectedEmployee, 
        groupId: targetGroup 
      })

      toast.success('Personel transferi başarıyla gerçekleşti')
      setOpen(false)
    } catch (error) {
      toast.error('Transfer işlemi başarısız oldu')
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">
          <Users className="mr-2 h-4 w-4" />
          Grup Yönetimi
        </Button>
      </DialogTrigger>
      
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Grup ve Personel Yönetimi</DialogTitle>
        </DialogHeader>

        <div className="grid gap-4">
          <div className="grid gap-2">
            <Label>Personel Seçimi</Label>
            <Select
              value={selectedEmployee || ""}
              onValueChange={setSelectedEmployee}
            >
              <SelectTrigger>
                <SelectValue placeholder="Personel seçin" />
              </SelectTrigger>
              <SelectContent>
                {employees.map((emp) => (
                  <SelectItem key={emp.id} value={emp.id}>
                    {emp.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div className="grid gap-2">
            <Label>Hedef Grup</Label>
            <Select
              value={targetGroup || ""}
              onValueChange={setTargetGroup}
            >
              <SelectTrigger>
                <SelectValue placeholder="Grup seçin" />
              </SelectTrigger>
              <SelectContent>
                {groups.map((group) => (
                  <SelectItem key={group.id} value={group.id}>
                    {group.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            İptal
          </Button>
          <Button onClick={handleEmployeeTransfer}>
            Transfer Et
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
} 