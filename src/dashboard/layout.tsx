import React from 'react';
import { useTabContext } from "@/contexts/tab-context";
import { Button } from "@/components/ui/button";
import { Layout as LayoutIcon, Plus } from "lucide-react";
import { CreateTabDialog } from "@/dashboard/components/create-tab-dialog";
import { cn } from "@/lib/utils";

export function DashboardLayout() {
  const { tabs, activeTab, setActiveTab } = useTabContext();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false);

  return (
    <div className="dashboard-layout">
      <div className="sidebar">
        <div className="flex flex-col h-full">
          <div className="sidebar-header">
            <Button 
              variant="outline" 
              className="w-full justify-start gap-2"
              onClick={() => setIsCreateDialogOpen(true)}
            >
              <Plus className="h-4 w-4" />
              <span>Yeni Tab</span>
            </Button>
          </div>
          
          <div className="sidebar-content">
            {tabs.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab)}
                className={cn(
                  "sidebar-item",
                  activeTab?.id === tab.id && "sidebar-item-active"
                )}
              >
                {tab.icon}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="flex-1 relative overflow-hidden bg-background">
        <div className="absolute inset-0 overflow-auto">
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