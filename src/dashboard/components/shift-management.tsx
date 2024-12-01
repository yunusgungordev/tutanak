import { Button } from "@/components/ui/button"
import { Calendar } from "@/components/ui/calendar"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog"
import { generateShiftSchedule } from "@/lib/ai-helper"
import { Group, ShiftSchedule } from "@/types/shift"
import { useState } from "react"
import toast from "react-hot-toast"

export function ShiftManagementDialog() {
  const [open, setOpen] = useState(false)
  const [startDate, setStartDate] = useState<Date>(new Date())
  const [schedules, setSchedules] = useState<ShiftSchedule[]>([])
  const [groups, setGroups] = useState<Group[]>([])
  const [loading, setLoading] = useState(false)

  const generateSchedule = async () => {
    try {
      setLoading(true)
      const newSchedules = await generateShiftSchedule(groups, startDate, 30) // 30 günlük plan
      setSchedules(newSchedules)
      toast.success("Vardiya planı oluşturuldu")
    } catch (error) {
      toast.error("Vardiya planı oluşturulurken hata oluştu")
    } finally {
      setLoading(false)
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline">Vardiya Planı Oluştur</Button>
      </DialogTrigger>
      
      <DialogContent className="max-w-3xl">
        <DialogHeader>
          <DialogTitle>Vardiya Planı Yönetimi</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-2 gap-4">
          <div>
            <h4 className="mb-2 font-medium">Başlangıç Tarihi</h4>
            <Calendar
              mode="single"
              selected={startDate}
              onSelect={(date) => date && setStartDate(date)}
              className="rounded-md border"
            />
          </div>

          <div>
            <h4 className="mb-2 font-medium">Vardiya Planı</h4>
            <div className="h-[300px] overflow-y-auto rounded-md border p-4">
              {schedules.map((schedule, index) => {
                const group = groups.find(g => g.id === schedule.groupId)
                return (
                  <div key={index} className="mb-2 rounded-md border p-2">
                    <div className="font-medium">{group?.name}</div>
                    <div className="text-sm text-muted-foreground">
                      {new Date(schedule.date).toLocaleDateString('tr-TR')} - 
                      {schedule.shiftType === 'Morning' && "08:00 - 20:00"}
                      {schedule.shiftType === 'Night' && "20:00 - 08:00"}
                      {schedule.shiftType === 'Rest' && "İstirahat"}
                    </div>
                  </div>
                )
              })}
            </div>
          </div>
        </div>

        <div className="mt-4 flex justify-end gap-2">
          <Button variant="outline" onClick={() => setOpen(false)}>
            Kapat
          </Button>
          <Button onClick={generateSchedule} disabled={loading}>
            {loading ? "Oluşturuluyor..." : "Plan Oluştur"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  )
} 