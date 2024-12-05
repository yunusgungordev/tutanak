import React from "react"
import { useTabContext } from "@/contexts/tab-context"
import { CreateTabDialog } from "@/dashboard/components/create-tab-dialog"
import { Layout as LayoutIcon, Plus } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function DashboardLayout() {
  const { tabs, activeTab, setActiveTab } = useTabContext()
  const [isCreateDialogOpen, setIsCreateDialogOpen] = React.useState(false)
  const [contentSize, setContentSize] = React.useState({ width: 0, height: 0 })

  const handleContentSizeChange = (width: number, height: number) => {
    setContentSize({
      width: Math.max(width, window.innerWidth - 256),
      height: Math.max(height, window.innerHeight)
    })
  }

  return (
    <div className="flex h-screen">
      <div className="w-64 flex-shrink-0 border-r bg-background">
        <div className="sidebar">
          <div className="flex h-full flex-col">
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
      </div>

      <div className="relative flex-1">
        {activeTab && <activeTab.component label={activeTab.label} />}
      </div>

      <CreateTabDialog
        open={isCreateDialogOpen}
        onOpenChange={setIsCreateDialogOpen}
      />
    </div>
  )
}
