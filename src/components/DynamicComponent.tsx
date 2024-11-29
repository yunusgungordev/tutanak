import React, { useState } from 'react';
import { LayoutConfig, Field } from '@/types/tab';
import { useTabContext } from "@/contexts/tab-context";
import { toast } from "react-hot-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Pencil, Plus, X, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"
import { cn } from "@/lib/utils"

interface DynamicComponentProps {
  config: LayoutConfig;
  fields: Field[];
}

export function DynamicComponent({ config, fields }: DynamicComponentProps) {
  const { setActiveTab, tabs, updateTab, activeTab } = useTabContext();
  const [isEditing, setIsEditing] = useState(false);

  const style = {
    position: 'absolute' as const,
    left: `${config.properties.x}px`,
    top: `${config.properties.y}px`,
    width: `${config.properties.width}px`,
    height: `${config.properties.height}px`,
  };

  const handleEvent = (event: React.SyntheticEvent, eventType: string) => {
    const events = config.properties.events || [];
    const matchingEvents = events.filter(e => e.type === eventType);

    matchingEvents.forEach(evt => {
      switch (evt.action) {
        case 'openDialog':
          // Dialog açma işlemi
          break;
        
        case 'showMessage':
          toast(evt.params?.message || 'Mesaj');
          break;
        
        case 'navigateTab':
          const targetTab = tabs.find(tab => tab.id === evt.target);
          if (targetTab) {
            setActiveTab(targetTab);
          }
          break;
        
        case 'executeQuery':
          // Sorgu çalıştırma işlemi
          break;
      }
    });
  };

  const handleHeaderChange = async (index: number, value: string) => {
    if (config.type === "table" && activeTab) {
      try {
        const updatedHeaders = [...(config.properties.headers || [])];
        updatedHeaders[index] = value;

        const updatedConfig = {
          ...config,
          properties: {
            ...config.properties,
            headers: updatedHeaders
          }
        };

        const updatedLayout = activeTab.layout?.map(item =>
          item.id === config.id ? updatedConfig : item
        );

        await updateTab(activeTab.id, {
          ...activeTab,
          layout: updatedLayout
        });

        toast.success("Başlık güncellendi");
      } catch (error) {
        toast.error("Başlık güncellenirken bir hata oluştu");
      }
    }
  };

  const handleCellChange = (rowIndex: number, cellIndex: number, value: string) => {
    const newRows = [...(config.properties.rows || [[]])];
    newRows[rowIndex][cellIndex] = value;
    updateTableProperty('rows', newRows);
  };

  const addColumn = () => {
    const newHeaders = [...(config.properties.headers || []), `Başlık ${(config.properties.headers?.length || 0) + 1}`];
    const newRows = (config.properties.rows || [[]]).map(row => [...row, '']);
    updateTableProperty('headers', newHeaders);
    updateTableProperty('rows', newRows);
  };

  const addRow = () => {
    const newRows = [...(config.properties.rows || [[]]), new Array(config.properties.headers?.length || 0).fill('')];
    updateTableProperty('rows', newRows);
  };

  const removeRow = (rowIndex: number) => {
    const newRows = (config.properties.rows || [[]]).filter((_, index) => index !== rowIndex);
    updateTableProperty('rows', newRows);
  };

  const updateTableProperty = (key: string, value: any) => {
    const updatedConfig = {
      ...config,
      properties: {
        ...config.properties,
        [key]: value
      }
    };
    // Tab context'teki updateTab fonksiyonunu çağır
  };

  const saveChanges = () => {
    setIsEditing(false);
    updateTab(config.id, {
      layout: [config]
    });
  };

  const handleAddRow = async () => {
    if (config.type === "table" && activeTab) {
      try {
        const newRow = Array(config.properties.headers?.length || 0).fill("");
        const updatedConfig = {
          ...config,
          properties: {
            ...config.properties,
            rows: [...(config.properties.rows || []), newRow]
          }
        };

        // Layout içindeki ilgili tabloyu güncelle
        const updatedLayout = activeTab.layout?.map(item =>
          item.id === config.id ? updatedConfig : item
        );

        // Tab'ı güncelle
        await updateTab(activeTab.id, {
          ...activeTab,
          layout: updatedLayout
        });

        toast.success("Yeni satır eklendi");
      } catch (error) {
        toast.error("Satır eklenirken bir hata oluştu");
      }
    }
  };

  const handleDeleteRow = async (rowIndex: number) => {
    if (config.type === "table" && activeTab) {
      try {
        const updatedRows = [...(config.properties.rows || [])];
        updatedRows.splice(rowIndex, 1);

        const updatedConfig = {
          ...config,
          properties: {
            ...config.properties,
            rows: updatedRows
          }
        };

        const updatedLayout = activeTab.layout?.map(item =>
          item.id === config.id ? updatedConfig : item
        );

        await updateTab(activeTab.id, {
          ...activeTab,
          layout: updatedLayout
        });

        toast.success("Satır silindi");
      } catch (error) {
        toast.error("Satır silinirken bir hata oluştu");
      }
    }
  };

  // Tablo için stil tanımlamaları
  const tableStyles = {
    table: "min-w-full border-collapse bg-white",
    thead: "bg-gray-100",
    th: "px-4 py-2 text-left text-sm font-semibold text-gray-600 border-b border-gray-200",
    tr: "hover:bg-gray-50 transition-colors",
    td: "px-4 py-2 text-sm text-gray-700 border-b border-gray-200",
    input: "w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-ring rounded px-1",
    rowNumber: "w-10 px-4 py-2 text-sm text-gray-500 border-b border-gray-200 bg-gray-50 text-center font-mono"
  };

  const renderContent = () => {
    switch (config.type) {
      case 'input':
        return (
          <div className="w-full h-full bg-background border rounded-md shadow-sm">
            <input
              type="text"
              placeholder={config.properties.placeholder}
              className="w-full h-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 ring-primary"
              onChange={(e) => handleEvent(e, 'change')}
            />
          </div>
        );
      case 'button':
        return (
          <button 
            className="w-full h-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90"
            onClick={(e) => handleEvent(e, 'click')}
          >
            {config.properties.label}
          </button>
        );
      case 'textarea':
        return (
          <div className="w-full h-full bg-background border rounded-md shadow-sm">
            <textarea
              placeholder={config.properties.placeholder}
              className="w-full h-full px-3 py-2 rounded-md resize-none focus:outline-none focus:ring-2 ring-primary"
            />
          </div>
        );
      case 'select':
        return (
          <div className="w-full h-full bg-background border rounded-md shadow-sm">
            <Select onValueChange={(value) => handleEvent({ target: { value } } as any, 'change')}>
              <SelectTrigger className="w-full h-full">
                <SelectValue placeholder={config.properties.placeholder || "Seçiniz"} />
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
        );
      case "table":
        return (
          <div className="border rounded-md bg-card shadow-sm">
            <div className="p-3 border-b bg-muted/30 flex justify-between items-center">
              <span className="text-sm font-medium">{config.properties.label}</span>
              <div className="flex items-center gap-2">
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={handleAddRow}
                  className="h-7"
                >
                  <Plus className="w-4 h-4 mr-1" />
                  Yeni Satır
                </Button>
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className={tableStyles.table}>
                <thead className={tableStyles.thead}>
                  <tr>
                    <th className={tableStyles.rowNumber}>#</th>
                    {config.properties.headers?.map((header, index) => (
                      <th key={index} className={tableStyles.th}>
                        <input
                          type="text"
                          value={header}
                          onChange={(e) => handleHeaderChange(index, e.target.value)}
                          className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-ring rounded px-1 font-semibold"
                        />
                      </th>
                    ))}
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {config.properties.rows?.map((row, rowIndex) => (
                    <tr key={rowIndex} className={tableStyles.tr}>
                      <td className={tableStyles.rowNumber}>{rowIndex + 1}</td>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className={tableStyles.td}>
                          <input
                            type="text"
                            value={cell}
                            onChange={(e) => {
                              const updatedRows = [...(config.properties.rows || [])];
                              updatedRows[rowIndex][cellIndex] = e.target.value;
                              
                              const updatedConfig = {
                                ...config,
                                properties: {
                                  ...config.properties,
                                  rows: updatedRows
                                }
                              };

                              if (activeTab) {
                                const updatedLayout = activeTab.layout?.map(item =>
                                  item.id === config.id ? updatedConfig : item
                                );

                                updateTab(activeTab.id, {
                                  ...activeTab,
                                  layout: updatedLayout
                                });
                              }
                            }}
                            className={tableStyles.input}
                          />
                        </td>
                      ))}
                      <td className={cn(tableStyles.td, "text-center")}>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRow(rowIndex)}
                          className="h-6 w-6 p-0 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={style} className="absolute">
      {renderContent()}
    </div>
  );
} 