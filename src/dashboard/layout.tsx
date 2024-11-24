import React from 'react';
import { useTabContext } from "@/contexts/tab-context";
import { Button } from "@/components/ui/button";
import { Layout as LayoutIcon, Plus } from "lucide-react";
import { CreateTabDialog } from "@/dashboard/components/create-tab-dialog";

export function DashboardLayout() {
  const { tabs, activeTab, setActiveTab } = useTabContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  return (
    <div className="flex h-full">
      {/* Sol taraftaki tab listesi */}
      <div className="w-60 border-r bg-background">
        <div className="flex flex-col h-full">
          <div className="p-4 border-b">
            <Button 
              variant="outline" 
              className="w-full justify-start"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="mr-2 h-4 w-4" />
              Yeni Tab
            </Button>
          </div>
          
          <div className="flex-1 overflow-auto py-2">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab)}
                className={`w-full flex items-center gap-2 px-4 py-2 text-sm hover:bg-accent hover:text-accent-foreground ${
                  activeTab?.id === tab.id ? 'bg-accent text-accent-foreground' : ''
                }`}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Sağ taraftaki içerik alanı */}
      <div className="flex-1 relative overflow-hidden">
        {/* Aktif tab içeriği */}
        <div className="absolute inset-0">
          {activeTab && <activeTab.component label={activeTab.label} />}
        </div>
      </div>

      <CreateTabDialog 
        open={isCreateDialogOpen} 
        onOpenChange={setIsCreateDialogOpen} 
      />
    </div>
  );
} 