import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTabContext } from "@/contexts/tab-context";
import { invoke } from "@tauri-apps/api/tauri";

interface DynamicTabRendererProps {
  label: string;
}

export const DynamicTabRenderer: React.FC<DynamicTabRendererProps> = ({ label }) => {
  const { tabs } = useTabContext();
  const [layout, setLayout] = React.useState<any[]>([]);
  const [loading, setLoading] = React.useState(true);

  React.useEffect(() => {
    const loadTabData = async () => {
      try {
        const savedTabs = await invoke('get_tabs') as any[];
        const currentTab = savedTabs.find(tab => tab.label === label);
        
        if (currentTab) {
          console.log('Yüklenen tab verisi:', currentTab);
          const layoutData = JSON.parse(currentTab.layout);
          console.log('Parse edilen layout:', layoutData);
          setLayout(layoutData);
        }
        
        setLoading(false);
      } catch (error) {
        console.error('Tab verisi yüklenirken hata:', error);
        setLoading(false);
      }
    };

    loadTabData();
  }, [label]);

  if (loading) {
    return <div className="p-4">Yükleniyor...</div>;
  }

  const renderComponent = (item: any) => {
    switch (item.type) {
      case 'input':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">{item.properties.label}</label>
            <Input
              placeholder={item.properties.placeholder}
              style={{
                width: item.properties.width,
                height: item.properties.height
              }}
            />
          </div>
        );

      case 'textarea':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">{item.properties.label}</label>
            <Textarea
              placeholder={item.properties.placeholder}
              style={{
                width: item.properties.width,
                height: item.properties.height
              }}
            />
          </div>
        );

      case 'select':
        return (
          <div className="space-y-2">
            <label className="text-sm font-medium">{item.properties.label}</label>
            <Select>
              <SelectTrigger style={{ width: item.properties.width }}>
                <SelectValue placeholder="Seçiniz" />
              </SelectTrigger>
              <SelectContent>
                {item.properties.options?.map((option: string, index: number) => (
                  <SelectItem key={index} value={option}>
                    {option}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );

      case 'button':
        return (
          <Button
            style={{
              width: item.properties.width,
              height: item.properties.height
            }}
          >
            {item.properties.label}
          </Button>
        );

      case 'checkbox':
        return (
          <div className="flex items-center gap-2">
            <Checkbox id={item.id} />
            <label
              htmlFor={item.id}
              className="text-sm font-medium leading-none peer-disabled:cursor-not-allowed peer-disabled:opacity-70"
            >
              {item.properties.label}
            </label>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full">
      <div 
        className="relative w-full h-full p-6 overflow-auto"
        style={{
          backgroundSize: "20px 20px",
          backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)"
        }}
      >
        {layout.map((item) => (
          <div
            key={item.id}
            style={{
              position: 'absolute',
              left: item.properties.x,
              top: item.properties.y,
              zIndex: 10 // Üst katmanda görünmesi için
            }}
          >
            {renderComponent(item)}
          </div>
        ))}
      </div>
    </div>
  );
}; 