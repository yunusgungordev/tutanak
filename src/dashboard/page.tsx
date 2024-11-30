import React, { useState } from "react"
import { NotesProvider } from "@/contexts/notes-context"
import { TabProvider, useTabContext } from "@/contexts/tab-context"
import { useTimeline } from "@/contexts/timeline-context"
import { TabBar } from "@/dashboard/components/tab-bar"
import { Timeline } from "@/dashboard/components/timeline"
import { Pencil, Trash2 } from "lucide-react"

import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

interface Tab {
  id: string
  name: string
}

export default function DashboardPage() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingTabName, setEditingTabName] = useState("")
  const { isMinimized } = useTimeline()

  const handleEditTab = (tab: Tab) => {
    setEditingTabId(tab.id)
    setEditingTabName(tab.name)
  }

  const handleUpdateTab = () => {
    if (!editingTabName.trim()) return

    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === editingTabId ? { ...tab, name: editingTabName.trim() } : tab
      )
    )
    setEditingTabId(null)
    setEditingTabName("")
  }

  const handleDeleteTab = (tabId: string) => {
    setTabs((prevTabs) => prevTabs.filter((tab) => tab.id !== tabId))
  }

  return (
    <TabProvider>
      <NotesProvider>
        <div className="flex h-screen flex-col p-2">
          <div className="flex flex-1 flex-col bg-background">
            <div
              className={cn(
                "transition-all duration-300",
                isMinimized ? "h-[calc(100vh-74px)]" : "h-[calc(50vh)]"
              )}
            >
              <div className="h-full overflow-hidden">
                <div className="flex h-full">
                  <div className="w-48 shrink-0">
                    <TabBar />
                  </div>

                  <div className="flex-1 overflow-x-auto">
                    <div className="h-full min-w-[1000px]">
                      <TabContent />
                    </div>
                  </div>
                </div>
              </div>
            </div>

            <div
              className={cn(
                "overflow-hidden transition-all duration-300",
                isMinimized ? "h-12" : "h-[calc(50vh-20px)]"
              )}
            >
              <Timeline />
            </div>
          </div>
        </div>
      </NotesProvider>
    </TabProvider>
  )
}

function TabContent() {
  const { activeTab } = useTabContext()
  const props = {
    label: activeTab.label,
    layout: activeTab.layout,
    fields: activeTab.fields,
    database: activeTab.database,
    id: activeTab.id,
    type: activeTab.type,
  }
  return React.createElement(activeTab.component, props)
}
