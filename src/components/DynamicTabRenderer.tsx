import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTabContext } from "@/contexts/tab-context";
import { invoke } from "@tauri-apps/api/tauri";
import { TimelineProvider } from "@/contexts/timeline-context"

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
          <div className="w-full h-full">
            <label className="block text-sm font-medium mb-1">{item.properties.label}</label>
            <input
              type="text"
              placeholder={item.properties.placeholder}
              className="w-full h-[calc(100%-24px)] px-3 py-2 border rounded-md"
            />
          </div>
        );
      case 'button':
        return (
          <button className="w-full h-full px-4 py-2 bg-primary text-primary-foreground rounded-md">
            {item.properties.label}
          </button>
        );
      case 'textarea':
        return (
          <div className="w-full h-full">
            <label className="block text-sm font-medium mb-1">{item.properties.label}</label>
            <textarea
              placeholder={item.properties.placeholder}
              className="w-full h-[calc(100%-24px)] px-3 py-2 border rounded-md resize-none"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <TimelineProvider>
      <div className="relative w-full h-full p-4">
        <div className="grid gap-4" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
          {layout.map((item: any) => (
            <div
              key={item.id}
              className="relative"
              style={{
                width: item.properties.width,
                height: item.properties.height,
                transform: `translate(${item.properties.x}px, ${item.properties.y}px)`,
              }}
            >
              {renderComponent(item)}
            </div>
          ))}
        </div>
      </div>
    </TimelineProvider>
  );
}; 