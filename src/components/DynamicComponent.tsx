import React, { useEffect, useState, useRef } from "react"
import { useTabContext } from "@/contexts/tab-context"
import { Pencil, Plus, Trash2, X, GripVertical, Upload, Download, Printer } from "lucide-react"
import { toast } from "react-hot-toast"
import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd"
import { Resizable } from "re-resizable"
import { saveAs } from 'file-saver'
import * as XLSX from 'xlsx'
import { useReactToPrint } from 'react-to-print'

import { Field, LayoutConfig, ComponentEvent } from "@/types/tab"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"

interface DynamicComponentProps {
  config: LayoutConfig
  fields: Field[]
  onEventTrigger: (event: unknown, eventConfig: ComponentEvent) => void
}

// Yeni tablo bileşeni için tip tanımlamaları
interface TableColumn {
  id: string
  header: string
  width?: number
}

interface TableRow {
  id: string
  cells: string[]
}

// Sürükle-bırak için yardımcı fonksiyonlar
const reorderArray = <T,>(list: T[], startIndex: number, endIndex: number): T[] => {
  const result = Array.from(list)
  const [removed] = result.splice(startIndex, 1)
  result.splice(endIndex, 0, removed)
  return result
}

// Excel işlemleri için yardımcı fonksiyonlar
const exportToExcel = (headers: string[], rows: string[][], fileName: string) => {
  const worksheet = XLSX.utils.aoa_to_sheet([headers, ...rows])
  const workbook = XLSX.utils.book_new()
  XLSX.utils.book_append_sheet(workbook, worksheet, 'Sayfa1')
  const excelBuffer = XLSX.write(workbook, { bookType: 'xlsx', type: 'array' })
  const data = new Blob([excelBuffer], { type: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet' })
  saveAs(data, `${fileName}.xlsx`)
}

const importFromExcel = (file: File): Promise<{headers: string[], rows: string[][]}> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      try {
        const data = new Uint8Array(e.target?.result as ArrayBuffer)
        const workbook = XLSX.read(data, { type: 'array' })
        const worksheet = workbook.Sheets[workbook.SheetNames[0]]
        const jsonData = XLSX.utils.sheet_to_json(worksheet, { header: 1 })
        
        const headers = jsonData[0] as string[]
        const rows = jsonData.slice(1) as string[][]
        
        resolve({ headers, rows })
      } catch (error) {
        reject(error)
      }
    }
    reader.readAsArrayBuffer(file)
  })
}

export const DynamicComponent: React.FC<DynamicComponentProps> = ({
  config,
  fields,
  onEventTrigger
}) => {
  const { setActiveTab, tabs, updateTab, activeTab } = useTabContext()
  const [isEditing, setIsEditing] = useState(false)
  const [columns, setColumns] = useState<TableColumn[]>([])
  const [rows, setRows] = useState<TableRow[]>([])
  const tableRef = useRef<HTMLDivElement>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const style = {
    position: "absolute" as const,
    left: `${config.properties.x}px`,
    top: `${config.properties.y}px`,
    width: `${config.properties.width}px`,
    height: `${config.properties.height}px`,
  }

  const handleEvent = (event: React.SyntheticEvent, eventType: ComponentEvent['type']) => {
    console.log('Event Type:', eventType)
    console.log('Config Events:', config.properties.events)
    
    if (!config.properties.events) return
    
    const matchingEvents = config.properties.events.filter(e => {
      console.log('Comparing:', e.type, eventType)
      return e.type === eventType
    })
    
    console.log('Matching Events:', matchingEvents)
    
    matchingEvents.forEach(evt => {
      console.log('Event to Trigger:', {
        id: evt.id,
        action: evt.action,
        params: evt.params,
        type: eventType
      })
      
      if (evt.action && typeof onEventTrigger === 'function') {
        onEventTrigger(event, {
          id: evt.id,
          action: evt.action,
          params: evt.params || {},
          type: eventType
        })
      }
    })
  }

  const handleHeaderChange = async (index: number, value: string) => {
    if (config.type === "table" && activeTab?.layout) {
      try {
        const updatedHeaders = [...(config.properties.headers || [])]
        updatedHeaders[index] = value
        
        const updatedConfig = {
          ...config,
          properties: {
            ...config.properties,
            headers: updatedHeaders,
          },
        }

        // Tablo başlıklarını güncelle
        setColumns(prevColumns => 
          prevColumns.map((col, i) => 
            i === index ? { ...col, header: value } : col
          )
        )

        // Tab context'i üzerinden güncelleme yap
        if (activeTab) {
          await updateTab(activeTab.id, {
            ...activeTab,
            layout: activeTab.layout?.map(item =>
              item.id === config.id ? updatedConfig : item
            ),
          })
        }

      } catch (error) {
        console.error("Başlık güncelleme hatası:", error)
        toast.error("Başlık güncellenirken bir hata oluştu")
      }
    }
  }

  const addColumn = () => {
    const newHeaders = [
      ...(config.properties.headers || []),
      `Başlık ${(config.properties.headers?.length || 0) + 1}`,
    ]
    const newRows = (config.properties.rows || [[]]).map((row) => [...row, ""])
    updateTableProperty("headers", newHeaders)
    updateTableProperty("rows", newRows)
  }

  const addRow = () => {
    const newRows = [
      ...(config.properties.rows || [[]]),
      new Array(config.properties.headers?.length || 0).fill(""),
    ]
    updateTableProperty("rows", newRows)
  }

  const removeRow = (rowIndex: number) => {
    const newRows = (config.properties.rows || [[]]).filter(
      (_, index) => index !== rowIndex
    )
    updateTableProperty("rows", newRows)
  }

  const updateTableProperty = async (key: string, value: any) => {
    if (!activeTab) return

    const updatedConfig = {
      ...config,
      properties: {
        ...config.properties,
        [key]: value,
      },
    }

    try {
      const updatedLayout =
        activeTab.layout?.map((item) =>
          item.id === config.id ? updatedConfig : item
        ) || []

      await updateTab(activeTab.id, {
        ...activeTab,
        layout: updatedLayout,
      })

      toast.success("İçerik güncellendi")
    } catch (error) {
      console.error("İçerik güncelleme hatası:", error)
      toast.error("İçerik güncellenirken bir hata oluştu")
    }
  }

  const saveChanges = () => {
    setIsEditing(false)
    updateTab(config.id, {
      layout: [config],
    })
  }

  const handleAddRow = async () => {
    if (config.type === "table" && activeTab) {
      try {
        const newRow = new Array(config.properties.headers?.length || 0).fill("")
        const updatedConfig = {
          ...config,
          properties: {
            ...config.properties,
            rows: [...(config.properties.rows || []), newRow],
          },
        }

        const updatedLayout = activeTab.layout?.map(item =>
          item.id === config.id ? updatedConfig : item
        )

        await updateTab(activeTab.id, {
          ...activeTab,
          layout: updatedLayout,
        })

        // State güncellemesi tamamlandıktan sonra odaklanma
        requestAnimationFrame(() => {
          const inputs = document.querySelectorAll(`[data-row="${config.properties.rows!.length}"][data-cell="0"]`)
          if (inputs[0] instanceof HTMLInputElement) {
            inputs[0].focus()
          }
        })
      } catch (error) {
        toast.error("Satır eklenirken bir hata oluştu")
      }
    }
  }

  const handleDeleteRow = async (rowIndex: number) => {
    if (config.type === "table" && activeTab) {
      try {
        const updatedRows = [...(config.properties.rows || [])]
        updatedRows.splice(rowIndex, 1)

        const updatedConfig = {
          ...config,
          properties: {
            ...config.properties,
            rows: updatedRows,
          },
        }

        const updatedLayout = activeTab.layout?.map((item) =>
          item.id === config.id ? updatedConfig : item
        )

        await updateTab(activeTab.id, {
          ...activeTab,
          layout: updatedLayout,
        })

        toast.success("Satır silindi")
      } catch (error) {
        toast.error("Satır silinirken bir hata oluştu")
      }
    }
  }

  const handleKeyDown = (
    event: React.KeyboardEvent<HTMLInputElement>,
    rowIndex: number,
    cellIndex: number
  ) => {
    if (event.key === "Tab" && !event.shiftKey) {
      const isLastCell = cellIndex === config.properties.headers!.length - 1
      const isLastRow = rowIndex === config.properties.rows!.length - 1

      if (isLastCell && isLastRow) {
        event.preventDefault()
        handleAddRow()
        // Yeni satırın ilk hücresine odaklanmak için setTimeout kullanıyoruz
        setTimeout(() => {
          const table = tableRef.current?.querySelector('table')
          const lastRow = table?.querySelector('tr:last-child')
          const firstInput = lastRow?.querySelector('input') as HTMLInputElement
          if (firstInput) {
            firstInput.focus()
          }
        }, 100)
      }
    }
  }

  const handleDeleteColumn = async (columnIndex: number) => {
    if (config.type === "table" && activeTab) {
      try {
        const updatedHeaders = [...(config.properties.headers || [])];
        updatedHeaders.splice(columnIndex, 1);
        
        const updatedRows = (config.properties.rows || []).map(row => {
          const newRow = [...row];
          newRow.splice(columnIndex, 1);
          return newRow;
        });

        const updatedConfig = {
          ...config,
          properties: {
            ...config.properties,
            headers: updatedHeaders,
            rows: updatedRows,
          },
        };

        const updatedLayout = activeTab.layout?.map((item) =>
          item.id === config.id ? updatedConfig : item
        );

        await updateTab(activeTab.id, {
          ...activeTab,
          layout: updatedLayout,
        });

        toast.success("Sütun silindi");
      } catch (error) {
        toast.error("Sütun silinirken bir hata oluştu");
      }
    }
  };

  // Tablo için stil tanımlamaları
  const tableStyles = {
    table: "min-w-full border-collapse bg-white table-fixed relative rounded-none border border-border",
    wrapper: "overflow-x-auto max-h-[500px] relative border border-border rounded-md",
    innerWrapper: "min-w-full inline-block align-middle",
    thead: "bg-[#F8F9FA] sticky top-0 z-10",
    th: "px-4 py-3 text-left text-sm font-semibold text-gray-700 border border-border min-w-[200px] group bg-[#F8F9FA]",
    tr: "border border-border transition-colors hover:bg-[#F8F9FA]",
    td: "p-0 align-middle border border-border [&:has([role=checkbox])]:pr-0 min-h-[32px]",
    input: "w-full h-[32px] border-none rounded-none focus:ring-0 focus:bg-[#EDF3FF] bg-transparent px-2 text-sm outline-none selection:bg-[#EDF3FF]",
    rowNumber: "w-12 px-4 py-2.5 text-sm text-gray-500 border-b border-border/50 bg-muted/30 text-center font-mono sticky left-0 z-20",
    actionColumn: "w-16 px-2 py-2.5 text-center border-b border-border/50 sticky right-0 bg-white shadow-[-4px_0_8px_-2px_rgba(0,0,0,0.1)] z-20",
    deleteButton: "mx-auto flex h-7 w-7 items-center justify-center p-0 hover:bg-destructive/10 hover:text-destructive rounded-md transition-colors",
    container: "relative bg-white rounded-md overflow-hidden",
    resizeHandle: "absolute right-0 top-0 bottom-0 w-1 cursor-ew-resize hover:bg-primary/50 transition-colors",
    headerActions: "flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity absolute right-2 top-1/2 -translate-y-1/2",
    toolbar: "flex items-center justify-between border-b bg-muted/30 px-4 py-2.5 sticky top-0 z-30",
    toolbarButton: "h-8 gap-1.5 text-xs font-medium hover:bg-muted/50 transition-colors",
    dragHandle: "cursor-move opacity-0 group-hover:opacity-100 transition-opacity text-gray-400 hover:text-gray-600",
    tableContainer: "flex items-start gap-2",
    mainTable: "flex-grow overflow-x-auto shadow-sm",
    actionHeader: "px-2 py-3 text-sm font-semibold text-gray-500 border-b border-border bg-muted/50 h-[42px] flex items-center justify-center",
    actionCell: "px-2 py-2.5 border-b border-border/50 flex items-center justify-center",
    activeCell: "outline outline-2 outline-primary/50 outline-offset-[-2px] rounded-none bg-[#EDF3FF]",
  }

  const renderContent = () => {
    switch (config.type) {
      case "input":
        return (
          <div className="h-full w-full rounded-md border bg-background shadow-sm">
            <input
              type="text"
              value={config.properties.value || ""}
              placeholder={config.properties.placeholder}
              className="h-full w-full rounded-md px-3 py-2 ring-primary focus:outline-none focus:ring-2"
              onChange={(e) => handleEvent(e, "change")}
            />
          </div>
        )
      case "button":
        return (
          <button
            className="h-full w-full rounded-md bg-primary px-4 py-2 text-primary-foreground hover:bg-primary/90"
            onClick={(e) => handleEvent(e, "click")}
          >
            {config.properties.label}
          </button>
        )
      case "textarea":
        return (
          <div className="h-full w-full rounded-md border bg-background shadow-sm">
            <textarea
              placeholder={config.properties.placeholder}
              className="h-full w-full resize-none rounded-md px-3 py-2 ring-primary focus:outline-none focus:ring-2"
            />
          </div>
        )
      case "select":
        return (
          <div className="h-full w-full rounded-md border bg-background shadow-sm">
            <Select
              onValueChange={(value) =>
                handleEvent({ target: { value } } as any, "change")
              }
            >
              <SelectTrigger className="h-full w-full">
                <SelectValue
                  placeholder={config.properties.placeholder || "Seçiniz"}
                />
              </SelectTrigger>
              <SelectContent>
                {config.properties.options?.map((option, index) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      case "table":
        return renderTable()
      case "text":
        return (
          <div
            style={{
              fontSize: `${config.properties.fontSize || 16}px`,
              fontFamily: config.properties.fontFamily || "Arial",
              fontWeight: config.properties.fontWeight || "normal",
              color: config.properties.color || "#000000",
              textAlign: (config.properties.textAlign || "left") as "left" | "center" | "right",
              width: "100%",
              height: "100%",
              padding: "8px",
              overflow: "auto"
            }}
            className="bg-background"
          >
            {config.properties.content || ""}
          </div>
        );
      default:
        return null
    }
  }

  const renderTable = () => {
    const [rows, setRows] = useState<TableRow[]>(
      config.properties.rows?.map((row, index) => ({
        id: `row-${index}`,
        cells: row,
      })) || []
    )

    const handleCellChange = (rowIndex: number, cellIndex: number, value: string) => {
      const updatedRows = rows.map((row: TableRow, rIndex: number) => {
        if (rIndex === rowIndex) {
          const newCells = [...row.cells]
          newCells[cellIndex] = value
          return { ...row, cells: newCells }
        }
        return row
      })
      
      setRows(updatedRows)
      
      if (activeTab) {
        const updatedConfig = {
          ...config,
          properties: {
            ...config.properties,
            rows: updatedRows.map((row: TableRow) => row.cells),
          },
        }

        updateTab(activeTab.id, {
          ...activeTab,
          layout: activeTab.layout?.map(item =>
            item.id === config.id ? updatedConfig : item
          ),
        })
      }
    }

    const handleDragEnd = (result: any) => {
      if (!result.destination) return

      const { source, destination, type } = result

      if (type === "column") {
        const newColumns = reorderArray(columns, source.index, destination.index)
        setColumns(newColumns)
        
        // Satırları da güncelle
        const newRows = rows.map(row => ({
          ...row,
          cells: reorderArray(row.cells, source.index, destination.index)
        }))
        setRows(newRows)
        
        // Canvas ve anasayfa senkronizasyonu için
        updateCanvasAndTable({
          ...config,
          properties: {
            ...config.properties,
            headers: newColumns.map(col => col.header),
            rows: newRows.map(row => row.cells)
          }
        })
      }
    }

    const handleAddRow = () => {
      const newRow = Array(columns.length).fill("")
      const newRows = [...rows, {
        id: `row-${rows.length}`,
        cells: newRow
      }]
      setRows(newRows)
      
      // Veritabanını güncelle
      if (activeTab) {
        const updatedConfig = {
          ...config,
          properties: {
            ...config.properties,
            rows: newRows.map(row => row.cells),
          },
        }

        updateTab(activeTab.id, {
          ...activeTab,
          layout: activeTab.layout?.map(item =>
            item.id === config.id ? updatedConfig : item
          ),
        })
      }
    }

    const handleAddColumn = () => {
      // Yeni sütun ekle
      const newColumn = {
        id: `col-${columns.length}`,
        header: `Başlık ${columns.length + 1}`,
      }
      const newColumns = [...columns, newColumn]
      setColumns(newColumns)

      // Mevcut satırlara boş hücre ekle
      const newRows = rows.map(row => ({
        ...row,
        cells: [...row.cells, ""]
      }))
      setRows(newRows)

      // Veritabanını güncelle
      if (activeTab) {
        const updatedConfig = {
          ...config,
          properties: {
            ...config.properties,
            headers: newColumns.map(col => col.header),
            rows: newRows.map(row => row.cells),
          },
        }

        updateTab(activeTab.id, {
          ...activeTab,
          layout: activeTab.layout?.map(item =>
            item.id === config.id ? updatedConfig : item
          ),
        })
      }
    }

    const handleDeleteRow = (rowIndex: number) => {
      const newRows = rows.filter((_, index) => index !== rowIndex)
      setRows(newRows)
      
      // Veritabanını güncelle
      if (activeTab) {
        const updatedConfig = {
          ...config,
          properties: {
            ...config.properties,
            rows: newRows.map(row => row.cells),
          },
        }

        updateTab(activeTab.id, {
          ...activeTab,
          layout: activeTab.layout?.map(item =>
            item.id === config.id ? updatedConfig : item
          ),
        })
      }
    }

    const handleDeleteColumn = (columnIndex: number) => {
      const newColumns = columns.filter((_, index) => index !== columnIndex)
      setColumns(newColumns)
      
      const newRows = rows.map(row => ({
        ...row,
        cells: row.cells.filter((_, index) => index !== columnIndex)
      }))
      setRows(newRows)
      
      // Canvas ve anasayfa senkronizasyonu için
      updateCanvasAndTable({
        ...config,
        properties: {
          ...config.properties,
          headers: newColumns.map(col => col.header),
          rows: newRows.map(row => row.cells)
        }
      })
    }

    const [tableWidth, setTableWidth] = useState(config.properties.width || 800)

    const handleResizeStop = (e: any, direction: any, ref: any, d: any) => {
      const newWidth = tableWidth + d.width
      setTableWidth(newWidth)
      
      // Veritabanını güncelle
      if (activeTab) {
        const updatedConfig = {
          ...config,
          properties: {
            ...config.properties,
            width: newWidth,
          },
        }

        updateTab(activeTab.id, {
          ...activeTab,
          layout: activeTab.layout?.map(item =>
            item.id === config.id ? updatedConfig : item
          ),
        })
      }
    }

    const renderTableHeader = (column: TableColumn, index: number) => {
      const [isEditing, setIsEditing] = useState(false)
      const [editValue, setEditValue] = useState(column.header)
      const inputRef = useRef<HTMLInputElement>(null)

      useEffect(() => {
        if (isEditing && inputRef.current) {
          inputRef.current.focus()
        }
      }, [isEditing])

      const handleEdit = () => {
        setIsEditing(true)
        setEditValue(column.header)
      }

      const handleSave = async () => {
        await handleHeaderChange(index, editValue)
        setIsEditing(false)
      }

      return (
        <>
          {isEditing ? (
            <input
              ref={inputRef}
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              onBlur={handleSave}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleSave()
                if (e.key === 'Escape') setIsEditing(false)
              }}
              className={tableStyles.input}
              autoFocus
            />
          ) : (
            <span className="cursor-pointer py-1" onClick={handleEdit}>
              {column.header}
            </span>
          )}
          <div className={tableStyles.headerActions}>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => handleDeleteColumn(index)}
              className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
            >
              <X className="h-4 w-4" />
            </Button>
          </div>
        </>
      )
    }

    useEffect(() => {
      // Canvas'tan gelen değişiklikleri izle
      if (config.properties.headers && config.properties.rows) {
        setColumns(
          config.properties.headers.map((header, index) => ({
            id: `col-${index}`,
            header,
          }))
        )
        setRows(
          config.properties.rows.map((row, index) => ({
            id: `row-${index}`,
            cells: row,
          }))
        )
      }
    }, [config.properties.headers, config.properties.rows])

    // Anasayfadan canvas'a değişiklikleri yansıt
    const updateCanvasAndTable = async (updatedConfig: any) => {
      if (activeTab && onEventTrigger) {
        onEventTrigger({} as React.SyntheticEvent, {
          id: config.id,
          type: "tableUpdate",
          action: "updateCanvas" as const,
          params: {
            componentId: config.id,
            properties: updatedConfig.properties
          }
        })
      }
    }

    const renderTableRow = (row: TableRow, rowIndex: number) => {
      return (
        <tr key={row.id} className={tableStyles.tr}>
          <td className={cn(tableStyles.td, "w-12 text-center text-sm text-muted-foreground")}>
            {rowIndex + 1}
          </td>
          {row.cells.map((cell, cellIndex) => (
            <td key={`${row.id}-${cellIndex}`} className={tableStyles.td}>
              <div className="flex items-center">
                <Input
                  value={cell}
                  onChange={(e) => handleCellChange(rowIndex, cellIndex, e.target.value)}
                  onKeyDown={(e) => handleKeyDown(e, rowIndex, cellIndex)}
                  onFocus={(e) => e.target.parentElement?.parentElement?.classList.add(tableStyles.activeCell)}
                  onBlur={(e) => e.target.parentElement?.parentElement?.classList.remove(tableStyles.activeCell)}
                  data-row={rowIndex}
                  data-cell={cellIndex}
                  className={tableStyles.input}
                />
                {cellIndex === row.cells.length - 1 && (
                  <button
                    onClick={() => handleDeleteRow(rowIndex)}
                    className="flex h-8 w-8 items-center justify-center hover:bg-muted/50"
                  >
                    <Trash2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                )}
              </div>
            </td>
          ))}
        </tr>
      )
    }

    const handleExportExcel = () => {
      if (config.properties.headers && config.properties.rows) {
        exportToExcel(
          config.properties.headers,
          config.properties.rows,
          config.properties.label || 'tablo'
        )
      }
    }

    const handleImportExcel = async (e: React.ChangeEvent<HTMLInputElement>) => {
      const file = e.target.files?.[0]
      if (!file || !activeTab) return

      try {
        const { headers, rows } = await importFromExcel(file)
        const updatedConfig = {
          ...config,
          properties: {
            ...config.properties,
            headers,
            rows,
          },
        }

        await updateTab(activeTab.id, {
          ...activeTab,
          layout: activeTab.layout?.map(item =>
            item.id === config.id ? updatedConfig : item
          ),
        })

        toast.success('Excel içe aktarıldı')
      } catch (error) {
        toast.error('Excel içe aktarılırken bir hata oluştu')
      }
    }

    const handlePrint = useReactToPrint({
      content: () => tableRef.current,
      documentTitle: config.properties.label || 'tablo',
      onBeforeGetContent: () => {
        if (!tableRef.current) {
          toast.error("Yazdırılacak içerik bulunamadı")
          return Promise.reject()
        }
        return Promise.resolve()
      },
      pageStyle: `
        @media print {
          body { margin: 0; padding: 15mm; }
          table { border-collapse: collapse; width: 100%; }
          th, td { border: 1px solid #ddd; padding: 8px; }
          th { background-color: #f5f5f5; }
        }
      `
    })

    return (
      <div ref={tableRef} className={tableStyles.container}>
        <Resizable
          size={{ width: tableWidth, height: "auto" }}
          onResizeStop={handleResizeStop}
          enable={{ right: true }}
          minWidth={400}
          maxWidth={1200}
          className={tableStyles.container}
        >
          <div className={tableStyles.toolbar}>
            <span className="text-sm font-medium text-gray-700">
              {config.properties.label}
            </span>
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm" onClick={handleAddRow} className={tableStyles.toolbarButton}>
                <Plus className="h-4 w-4" />
                Yeni Satır
              </Button>
              <Button variant="ghost" size="sm" onClick={handleAddColumn} className={tableStyles.toolbarButton}>
                <Plus className="h-4 w-4" />
                Yeni Sütun
              </Button>
              <input
                type="file"
                accept=".xlsx,.xls"
                onChange={handleImportExcel}
                className="hidden"
                ref={fileInputRef}
              />
              <Button variant="ghost" size="sm" onClick={() => fileInputRef.current?.click()} className={tableStyles.toolbarButton}>
                <Upload className="h-4 w-4" />
                Excel İçe Aktar
              </Button>
              <Button variant="ghost" size="sm" onClick={handleExportExcel} className={tableStyles.toolbarButton}>
                <Download className="h-4 w-4" />
                Excel Dışa Aktar
              </Button>
              <Button variant="ghost" size="sm" onClick={handlePrint} className={tableStyles.toolbarButton}>
                <Printer className="h-4 w-4" />
                Yazdır
              </Button>
            </div>
          </div>
          <div className={tableStyles.tableContainer}>
            <DragDropContext onDragEnd={handleDragEnd}>
              <div className={tableStyles.mainTable}>
                <table className={tableStyles.table}>
                  <Droppable droppableId="columns" direction="horizontal" type="column">
                    {(provided) => (
                      <thead 
                        className={tableStyles.thead} 
                        ref={provided.innerRef} 
                        {...provided.droppableProps}
                      >
                        <tr>
                          <th className={tableStyles.rowNumber}>#</th>
                          {columns.map((column, index) => (
                            <Draggable key={column.id} draggableId={column.id} index={index}>
                              {(dragProvided) => (
                                <th
                                  ref={dragProvided.innerRef}
                                  {...dragProvided.draggableProps}
                                  className={tableStyles.th}
                                >
                                  <div className="relative flex items-center">
                                    <div {...dragProvided.dragHandleProps}>
                                      <GripVertical className={tableStyles.dragHandle} />
                                    </div>
                                    {renderTableHeader(column, index)}
                                  </div>
                                </th>
                              )}
                            </Draggable>
                          ))}
                          {provided.placeholder}
                        </tr>
                      </thead>
                    )}
                  </Droppable>

                  <Droppable droppableId="rows" type="row">
                    {(provided) => (
                      <tbody ref={provided.innerRef} {...provided.droppableProps}>
                        {rows.map((row, rowIndex) => renderTableRow(row, rowIndex))}
                        {provided.placeholder}
                      </tbody>
                    )}
                  </Droppable>
                </table>
              </div>
            </DragDropContext>
          </div>
        </Resizable>
      </div>
    )
  }

  return (
    <div style={style} className="absolute">
      {renderContent()}
    </div>
  )
}
