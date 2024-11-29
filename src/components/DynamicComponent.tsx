import React from 'react';
import { LayoutConfig, Field } from '@/types/tab';
import { useTabContext } from "@/contexts/tab-context";
import { toast } from "react-hot-toast";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select"

interface DynamicComponentProps {
  config: LayoutConfig;
  fields: Field[];
}

export function DynamicComponent({ config, fields }: DynamicComponentProps) {
  const { setActiveTab, tabs } = useTabContext();

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
      default:
        return null;
    }
  };

  return (
    <div style={style} className="!absolute">
      {renderContent()}
    </div>
  );
} 