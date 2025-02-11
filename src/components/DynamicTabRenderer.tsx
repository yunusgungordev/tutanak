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

  const renderComponent = (item: any) => {
    const style = {
      position: 'absolute' as const,
      left: `${item.properties.x}px`,
      top: `${item.properties.y}px`,
      width: `${item.properties.width}px`,
      height: `${item.properties.height}px`,
    };

    return (
      <div key={item.id} style={style} className="border rounded-md bg-background p-2">
        <div className="flex items-center justify-between mb-1">
          <span className="text-sm font-medium">{item.properties.label}</span>
        </div>
        {renderComponentContent(item)}
      </div>
    );
  };

  const renderComponentContent = (item: any) => {
    switch (item.type) {
      case 'input':
        return (
          <input
            type="text"
            placeholder={item.properties.placeholder}
            className="w-full px-2 py-1 border rounded"
          />
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

  if (loading) {
    return <div className="p-4">Yükleniyor...</div>;
  }

  return (
    <div className="relative w-full h-full overflow-auto">
      <div className="min-h-[200px] bg-muted/10 rounded-lg p-4">
        {layout.map(item => renderComponent(item))}
      </div>
    </div>
  );
}; 