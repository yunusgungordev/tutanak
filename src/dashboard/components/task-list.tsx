import { useRef, useState } from "react"
import { Button } from "@/components/ui/button"
import { FileDown, Plus, Upload, Trash2, ArrowRight } from "lucide-react"
import * as XLSX from 'xlsx'
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area"
import { invoke } from '@tauri-apps/api/tauri';

export function TaskList() {
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [workbook, setWorkbook] = useState<XLSX.WorkBook | null>(null)
  const [activeSheet, setActiveSheet] = useState<XLSX.WorkSheet | null>(null)
  const [excelData, setExcelData] = useState<any[][]>([])
  const [editingCell, setEditingCell] = useState<{row: number, col: number} | null>(null)
  const [editingHeader, setEditingHeader] = useState<number | null>(null)

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = (event) => {
      const data = event.target?.result
      const wb = XLSX.read(data, { type: 'binary' })
      setWorkbook(wb)
      
      const firstSheet = wb.Sheets[wb.SheetNames[0]]
      setActiveSheet(firstSheet)
      
      const jsonData = XLSX.utils.sheet_to_json(firstSheet, { header: 1 }) as any[][]
      setExcelData(jsonData)
    }
    reader.readAsBinaryString(file)
  }

  const handleExportExcel = () => {
    if (!workbook || !activeSheet) return
    XLSX.writeFile(workbook, "gorev-listesi.xlsx")
  }

  const handleCellEdit = (value: string, rowIndex: number, colIndex: number) => {
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
    const newData = excelData.map(row => [...row, ""])
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
        const jsonData = JSON.stringify(excelData);
        await invoke('save_excel_data', { 
          data: jsonData,
          sheet_name: workbook.SheetNames[0] 
        });
      } catch (error) {
        console.error('Veritabanı kayıt hatası:', error);
      }
    }
  };

  return (
    <div className="container mx-auto p-4">
      <div className="flex justify-between items-center mb-4">
        <h2 className="text-2xl font-bold">Görev Listesi</h2>
        <div className="flex gap-2">
          <input
            type="file"
            ref={fileInputRef}
            onChange={handleFileUpload}
            accept=".xlsx,.xls"
            className="hidden"
          />
          <Button 
            variant="outline" 
            size="sm"
            onClick={() => fileInputRef.current?.click()}
          >
            <Upload className="w-4 h-4 mr-2" />
            Excel Yükle
          </Button>
          <Button 
            variant="outline" 
            size="sm"
            onClick={handleExportExcel}
            disabled={!workbook}
          >
            <FileDown className="w-4 h-4 mr-2" />
            Excel'e Aktar
          </Button>
          <Button 
            variant="default" 
            size="sm"
            onClick={() => {
              const wb = XLSX.utils.book_new()
              const ws = XLSX.utils.aoa_to_sheet([[]])
              XLSX.utils.book_append_sheet(wb, ws, "Görev Listesi")
              setWorkbook(wb)
              setActiveSheet(ws)
              setExcelData([[]])
            }}
          >
            <Plus className="w-4 h-4 mr-2" />
            Yeni Liste
          </Button>
        </div>
      </div>
      
      <ScrollArea className="border rounded-lg">
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
                          className={`p-2 border-r min-w-[150px] ${rowIndex === 0 ? 'font-bold bg-muted/50' : ''}`}
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
                              onChange={(e) => handleHeaderEdit(e.target.value, colIndex)}
                              onBlur={() => setEditingHeader(null)}
                              autoFocus
                              className="w-full p-1 border rounded font-bold"
                            />
                          ) : editingCell?.row === rowIndex && editingCell?.col === colIndex ? (
                            <input
                              type="text"
                              value={cell || ""}
                              onChange={(e) => handleCellEdit(e.target.value, rowIndex, colIndex)}
                              onBlur={() => setEditingCell(null)}
                              autoFocus
                              className="w-full p-1 border rounded"
                            />
                          ) : (
                            cell
                          )}
                        </td>
                      ))}
                      {rowIndex === 0 && (
                        <td className="p-2 w-16 bg-muted/50">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={addNewColumn}
                            className="h-6 w-6 p-0"
                          >
                            <ArrowRight className="w-4 h-4" />
                          </Button>
                        </td>
                      )}
                      {rowIndex !== 0 && (
                        <td className="p-2 w-16">
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => deleteRow(rowIndex)}
                            className="h-6 w-6 p-0"
                          >
                            <Trash2 className="w-4 h-4 text-red-500" />
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
                  <Plus className="w-4 h-4 mr-2" />
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