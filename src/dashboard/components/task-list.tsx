import { useRef, useState, useEffect } from "react"
import { invoke } from "@tauri-apps/api/tauri"
import { ArrowRight, FileDown, Plus, Trash2, Upload, Clock, Users, UserPlus, X } from "lucide-react"
import * as XLSX from "xlsx"
import { toast } from "react-hot-toast"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { Group, Employee, ShiftSchedule, ShiftType } from "@/types/shift"
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { cn } from "@/lib/utils"
import { AddEmployeeDialog } from "./employee-dialog"
import { AddGroupDialog } from "./group-dialog"
import { GroupManagementDialog } from "./group-management-dialog"
import { ShiftManagementDialog } from "./shift-management"
import { validateGroupChange } from "@/lib/ai-helper"

export function TaskList() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [excelData, setExcelData] = useState<any[][]>([])
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null)
  const [activeSheet, setActiveSheet] = useState<XLSX.WorkSheet | null>(null)
  const [selectedGroup, setSelectedGroup] = useState<string | null>(null)
  const [showShiftInfo, setShowShiftInfo] = useState(false)
  const [groups, setGroups] = useState<Group[]>([])
  const [employees, setEmployees] = useState<Employee[]>([])
  const [currentShifts, setCurrentShifts] = useState<{[key: string]: ShiftType}>({})
  const [editingCell, setEditingCell] = useState<{row: number; col: number} | null>(null)
  const [editingHeader, setEditingHeader] = useState<number | null>(null)
  const [shiftSchedule, setShiftSchedule] = useState<ShiftSchedule[]>([])

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const data = event.target?.result
      const wb = XLSX.read(data, { type: "binary" })
      setWorkbook(wb)

      const firstSheet = wb.Sheets[wb.SheetNames[0]]
      setActiveSheet(firstSheet)

      const jsonData = XLSX.utils.sheet_to_json(firstSheet, {
        header: 1,
      }) as any[][]
      setExcelData(jsonData)
    }
    reader.readAsBinaryString(file)
  }

  const handleExportExcel = () => {
    if (!workbook || !activeSheet) return
    XLSX.writeFile(workbook, "gorev-listesi.xlsx")
  }

  const handleCellEdit = (
    value: string,
    rowIndex: number,
    colIndex: number
  ) => {
    const newData = [...excelData]
    newData[rowIndex][colIndex] = value
    setExcelData(newData)

    // Excel workbook'u güncelle
    if (workbook && activeSheet) {
      const ws = XLSX.utils.aoa_to_sheet(newData)
      workbook.Sheets[workbook.SheetNames[0]] = ws
      setActiveSheet(ws)
    }
  }

  const handleHeaderEdit = (value: string, colIndex: number) => {
    const newData = [...excelData]
    newData[0][colIndex] = value
    setExcelData(newData)

    // Excel workbook'u güncelle
    if (workbook && activeSheet) {
      const ws = XLSX.utils.aoa_to_sheet(newData)
      workbook.Sheets[workbook.SheetNames[0]] = ws
      setActiveSheet(ws)
    }
  }

  const addNewRow = () => {
    const newRow = Array(excelData[0]?.length || 1).fill("")
    const newData = [...excelData, newRow]
    setExcelData(newData)

    // Excel workbook'u güncelle
    if (workbook && activeSheet) {
      const ws = XLSX.utils.aoa_to_sheet(newData)
      workbook.Sheets[workbook.SheetNames[0]] = ws
      setActiveSheet(ws)
    }
  }

  const deleteRow = (rowIndex: number) => {
    if (rowIndex === 0) return // Başlık satırını silmeyi engelle
    const newData = excelData.filter((_, index) => index !== rowIndex)
    setExcelData(newData)

    // Excel workbook'u güncelle
    if (workbook && activeSheet) {
      const ws = XLSX.utils.aoa_to_sheet(newData)
      workbook.Sheets[workbook.SheetNames[0]] = ws
      setActiveSheet(ws)
    }
  }

  const addNewColumn = () => {
    const newData = excelData.map((row) => [...row, ""])
    if (newData.length === 0) {
      newData.push([""])
    }
    setExcelData(newData)

    // Excel workbook'u güncelle
    if (workbook && activeSheet) {
      const ws = XLSX.utils.aoa_to_sheet(newData)
      workbook.Sheets[workbook.SheetNames[0]] = ws
      setActiveSheet(ws)
    }
  }

  const saveToDatabase = async () => {
    if (workbook && activeSheet) {
      try {
        const jsonData = JSON.stringify(excelData)
        await invoke("save_excel_data", {
          data: jsonData,
          sheet_name: workbook.SheetNames[0],
        })
      } catch (error) {
        console.error("Veritabanı kayıt hatası:", error)
      }
    }
  }

  const GroupSelector = () => (
    <div className="mb-4 flex items-center gap-4">
      <Select
        value={selectedGroup || ""}
        onValueChange={(value) => setSelectedGroup(value)}
      >
        <SelectTrigger className="w-[200px]">
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
      
      <Button
        variant="outline"
        size="sm"
        onClick={() => setShowShiftInfo(!showShiftInfo)}
      >
        <Clock className="mr-2 h-4 w-4" />
        Vardiya Bilgisi
      </Button>
    </div>
  )

  const ShiftInfoPanel = () => (
    <div className="mb-4 rounded-lg border bg-card p-4">
      <h3 className="mb-2 font-semibold">Güncel Vardiya Durumu</h3>
      <div className="grid grid-cols-4 gap-4">
        {groups.map((group) => (
          <div 
            key={group.id}
            className={cn(
              "rounded-md border p-3",
              currentShifts[group.id] === 'Morning' && "bg-blue-50",
              currentShifts[group.id] === 'Night' && "bg-purple-50",
              currentShifts[group.id] === 'Rest' && "bg-gray-50"
            )}
          >
            <div className="font-medium">{group.name}</div>
            <div className="text-sm text-muted-foreground">
              {currentShifts[group.id] === 'Morning' && "08:00 - 20:00"}
              {currentShifts[group.id] === 'Night' && "20:00 - 08:00"}
              {currentShifts[group.id] === 'Rest' && "İstirahat"}
            </div>
          </div>
        ))}
      </div>
    </div>
  )

  const ManagementPanel = () => {
    const [activeGroup, setActiveGroup] = useState<string>(groups[0]?.id || "")

    return (
      <div className="mb-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Vardiya Yönetimi</h3>
          <div className="flex gap-2">
            <AddEmployeeDialog onEmployeeAdded={loadData} />
            <AddGroupDialog onGroupAdded={loadData} />
            <ShiftManagementDialog />
          </div>
        </div>

        <div className="grid grid-cols-[300px_1fr] gap-4">
          <div className="rounded-lg border bg-card">
            <div className="p-3 border-b bg-muted">
              <h4 className="font-medium">Gruplar</h4>
            </div>
            <Tabs value={activeGroup} onValueChange={setActiveGroup}>
              <TabsList className="flex flex-col w-full h-auto">
                {groups.map((group) => (
                  <TabsTrigger
                    key={group.id}
                    value={group.id}
                    className="justify-between w-full p-3 rounded-none border-b last:border-b-0 data-[state=active]:bg-accent"
                  >
                    <div className="flex items-center gap-2">
                      <Users className="h-4 w-4" />
                      <span>{group.name}</span>
                    </div>
                    <Badge variant={
                      group.current_shift === 'Morning' ? 'default' :
                      group.current_shift === 'Night' ? 'secondary' : 'outline'
                    }>
                      {group.current_shift === 'Morning' && "Gündüz"}
                      {group.current_shift === 'Night' && "Gece"}
                      {group.current_shift === 'Rest' && "İstirahat"}
                    </Badge>
                  </TabsTrigger>
                ))}
              </TabsList>
            </Tabs>
          </div>

          <Tabs value={activeGroup} onValueChange={setActiveGroup}>
            {groups.map((group) => (
              <TabsContent key={group.id} value={group.id}>
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <Users className="h-5 w-5" />
                        <span>{group.name} Grubu</span>
                      </div>
                      <Badge variant="outline">
                        {employees.filter(emp => emp.group_id === group.id).length} Personel
                      </Badge>
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      <div>
                        <h4 className="mb-2 font-medium">Grupsuz Personeller</h4>
                        <div className="space-y-2">
                          {employees
                            .filter(emp => !emp.group_id || emp.group_id === "")
                            .map(emp => (
                              <div
                                key={emp.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card"
                              >
                                <span>{emp.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEmployeeGroupChange(emp.id, group.id)}
                                >
                                  <Plus className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                        </div>
                      </div>
                      
                      <div>
                        <h4 className="mb-2 font-medium">Grup Personelleri</h4>
                        <div className="space-y-2">
                          {employees
                            .filter(emp => emp.group_id === group.id)
                            .map(emp => (
                              <div
                                key={emp.id}
                                className="flex items-center justify-between p-3 rounded-lg border bg-card"
                              >
                                <span>{emp.name}</span>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleEmployeeGroupChange(emp.id, "")}
                                >
                                  <X className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              </TabsContent>
            ))}
          </Tabs>
        </div>
      </div>
    )
  }

  const loadData = async () => {
    try {
      const [employeesData, groupsData, shiftsData] = await Promise.all([
        invoke<string>('get_all_employees'),
        invoke<string>('get_all_groups'),
        invoke<string>('get_current_shifts')
      ]);

      setEmployees(JSON.parse(employeesData));
      setGroups(JSON.parse(groupsData));
      setCurrentShifts(JSON.parse(shiftsData));
    } catch (error) {
      toast.error('Veri yüklenirken hata oluştu');
      console.error('Veri yükleme hatası:', error);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleEmployeeGroupChange = async (employeeId: string, newGroupId: string) => {
    try {
      // Önce API çağrısını yap
      await invoke('update_employee_group', { 
        employeeId: employeeId, 
        groupId: newGroupId 
      });

      // Yerel state'i güncelle
      setEmployees(prevEmployees => 
        prevEmployees.map(emp => 
          emp.id === employeeId 
            ? { ...emp, group_id: newGroupId }  // group_id olarak güncelle
            : emp
        )
      );

      toast.success('Personel gruba eklendi');
      
      // Tüm verileri yeniden yükle
      await loadData();
    } catch (error) {
      console.error('Grup değişikliği hatası:', error);
      toast.error('Grup değişikliği yapılırken hata oluştu');
    }
  };

  const handleAddEmployee = async (employee: Employee) => {
    try {
        await invoke('add_employee', { employee: JSON.stringify(employee) });
        loadData();
    } catch (error) {
        toast.error('Personel eklenirken hata oluştu');
    }
  };

  return (
    <div className="container mx-auto p-4">
      <ManagementPanel />
      <div className="mb-4 flex items-center justify-between">
        <h2 className="text-2xl font-bold">Görev Listesi</h2>
        <GroupSelector />
      </div>

      {showShiftInfo && <ShiftInfoPanel />}

      <ScrollArea className="rounded-lg border">
        <div className="min-w-max">
          {excelData.length > 0 ? (
            <div>
              <table className="w-full">
                <tbody>
                  {excelData.map((row, rowIndex) => (
                    <tr key={rowIndex} className="border-b">
                      {row.map((cell: any, colIndex: number) => (
                        <td
                          key={colIndex}
                          className={`min-w-[150px] border-r p-2 ${rowIndex === 0 ? "bg-muted/50 font-bold" : ""}`}
                          onClick={() => {
                            if (rowIndex === 0) {
                              setEditingHeader(colIndex)
                            } else {
                              setEditingCell({ row: rowIndex, col: colIndex })
                            }
                          }}
                        >
                          {editingHeader === colIndex && rowIndex === 0 ? (
                            <input
                              type="text"
                              value={cell || ""}
                              onChange={(e) =>
                                handleHeaderEdit(e.target.value, colIndex)
                              }
                              onBlur={() => setEditingHeader(null)}
                              autoFocus
                              className="w-full rounded border p-1 font-bold"
                            />
                          ) : editingCell?.row === rowIndex &&
                            editingCell?.col === colIndex ? (
                            <input
                              type="text"
                              value={cell || ""}
                              onChange={(e) =>
                                handleCellEdit(
                                  e.target.value,
                                  rowIndex,
                                  colIndex
                                )
                              }
                              onBlur={() => setEditingCell(null)}
                              autoFocus
                              className="w-full rounded border p-1"
                            />
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                      {rowIndex === 0 && (
                        <td className="w-16 bg-muted/50 p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={addNewColumn}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowRight className="h-4 w-4" />
                          </Button>
                        </td>
                      )}
                      {rowIndex !== 0 && (
                        <td className="w-16 p-2">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRow(rowIndex)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="h-4 w-4 text-red-500" />
                          </Button>
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
              <div className="p-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={addNewRow}
                  className="w-full"
                >
                  <Plus className="mr-2 h-4 w-4" />
                  Yeni Satır Ekle
                </Button>
              </div>
            </div>
          ) : (
            <div className="p-8 text-center text-muted-foreground">
              Excel dosyası yükleyin veya yeni liste oluşturun
            </div>
          )}
        </div>
        <ScrollBar orientation="horizontal" />
      </ScrollArea>
    </div>
  )
}
