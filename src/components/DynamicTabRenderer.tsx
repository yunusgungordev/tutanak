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
          const layoutData = JSON.parse(currentTab.layout);
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
          <div className="w-full">
            <label className="block text-sm font-medium mb-1">{item.properties.label}</label>
            <input
              type="text"
              placeholder={item.properties.placeholder}
              className="w-full px-3 py-2 border rounded-md"
            />
          </div>
        );
      case 'button':
        return (
          <button className="px-4 py-2 bg-primary text-primary-foreground rounded-md">
            {item.properties.label}
          </button>
        );
      // Diğer bileşen tipleri...
      default:
        return null;
    }
  };

  return (
    <div className="h-full w-full overflow-x-auto bg-background">
      <div className="min-w-[1000px] p-6">
        <div 
          className="relative min-h-[800px] border rounded-lg"
          style={{
            backgroundSize: "20px 20px",
            backgroundImage: "linear-gradient(to right, rgba(0,0,0,0.05) 1px, transparent 1px), linear-gradient(to bottom, rgba(0,0,0,0.05) 1px, transparent 1px)"
          }}
        >
          {layout.map((item) => (
            <div
              key={item.id}
              className="absolute bg-background border rounded-md shadow-sm p-4"
              style={{
                left: `${item.properties.x}px`,
                top: `${item.properties.y}px`,
                width: `${item.properties.width}px`,
                minHeight: `${item.properties.height}px`,
              }}
            >
              {renderComponent(item)}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}; 