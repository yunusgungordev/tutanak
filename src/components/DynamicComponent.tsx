import React, { useState } from 'react';
import { LayoutConfig, Field } from '@/types/tab';
import { useTabContext } from "@/contexts/tab-context";
import { toast } from "react-hot-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"
import { Button } from "@/components/ui/button"
import { Pencil, Plus, X, Trash2 } from "lucide-react"
import { Input } from "@/components/ui/input"

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

  const handleHeaderChange = (index: number, value: string) => {
    const newHeaders = [...(config.properties.headers || [])];
    newHeaders[index] = value;
    updateTableProperty('headers', newHeaders);
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
          <div style={style} className="border rounded-md bg-card">
            <div className="p-2 border-b bg-muted/30">
              <span className="text-sm font-medium">{config.properties.label}</span>
            </div>
            <div className="p-2 overflow-auto">
              <table className="w-full">
                <thead>
                  <tr>
                    {config.properties.headers?.map((header, index) => (
                      <th key={index} className="p-2 text-sm font-medium text-left border-b">
                        {header}
                      </th>
                    ))}
                    <th className="w-16"></th>
                  </tr>
                </thead>
                <tbody>
                  {config.properties.rows?.map((row, rowIndex) => (
                    <tr key={rowIndex}>
                      {row.map((cell, cellIndex) => (
                        <td key={cellIndex} className="p-2 text-sm border-b">
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

                              const updatedLayout = activeTab?.layout?.map(item =>
                                item.id === config.id ? updatedConfig : item
                              );

                              if (activeTab) {
                                updateTab(activeTab.id, {
                                  ...activeTab,
                                  layout: updatedLayout
                                });
                              }
                            }}
                            className="w-full bg-transparent border-none focus:outline-none focus:ring-1 focus:ring-ring rounded px-1"
                          />
                        </td>
                      ))}
                      <td className="p-2 w-16">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDeleteRow(rowIndex)}
                          className="h-6 w-6 p-0"
                        >
                          <Trash2 className="w-4 h-4 text-destructive" />
                        </Button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
              <Button
                variant="outline"
                size="sm"
                onClick={handleAddRow}
                className="w-full mt-2"
              >
                <Plus className="w-4 h-4 mr-2" />
                Yeni Satır
              </Button>
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