import { validateGroupChange } from "@/lib/ai-helper"
import { Group, Employee } from "@/types/shift"
import { invoke } from "@tauri-apps/api/tauri"
import { useState } from "react"
import toast from "react-hot-toast"

export function GroupManagement() {
  const [groups, setGroups] = useState<Group[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  
  const handleAddGroup = async (name: string) => {
    const newGroup: Group = {
      id: crypto.randomUUID(),
      name,
      employees: [],
      current_shift: 'Rest'
    }
    
    try {
      await invoke('add_group', { group: JSON.stringify(newGroup) })
      setGroups([...groups, newGroup])
    } catch (error) {
      toast.error('Grup eklenirken hata oluştu')
    }
  }
  
  const handleEmployeeGroupChange = async (employeeId: string, newGroupId: string) => {
    const validation = await validateGroupChange(employeeId, newGroupId)
    
    if (!validation.isValid) {
      toast.error(validation.message)
      return
    }
    
    try {
      await invoke('update_employee_group', { employeeId, groupId: newGroupId })
      setEmployees(employees.map(emp => 
        emp.id === employeeId ? { ...emp, groupId: newGroupId } : emp
      ))
    } catch (error) {
      toast.error('Grup değişikliği yapılırken hata oluştu')
    }
  }
  
  return (
    <div className="space-y-4">
      {/* Grup ve çalışan yönetimi arayüzü */}
    </div>
  )
} 