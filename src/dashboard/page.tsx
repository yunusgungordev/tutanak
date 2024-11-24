import { Button } from "@/components/ui/button"
import { Timeline } from "@/dashboard/components/timeline"
import { NotesProvider } from "@/contexts/notes-context"
import { TabBar } from "@/dashboard/components/tab-bar"
import { useState } from "react"
import { TabProvider, useTabContext } from "@/contexts/tab-context"
import React from "react"
import { Pencil, Trash2 } from 'lucide-react'

interface Tab {
  id: string
  name: string
}

export default function DashboardPage() {
  const [tabs, setTabs] = useState<Tab[]>([])
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingTabName, setEditingTabName] = useState('')

  const handleEditTab = (tab: Tab) => {
    setEditingTabId(tab.id)
    setEditingTabName(tab.name)
  }

  const handleUpdateTab = () => {
    if (!editingTabName.trim()) return

    setTabs(prevTabs =>
      prevTabs.map(tab =>
        tab.id === editingTabId
          ? { ...tab, name: editingTabName.trim() }
          : tab
      )
    )
    setEditingTabId(null)
    setEditingTabName('')
  }

  const handleDeleteTab = (tabId: string) => {
    setTabs(prevTabs => prevTabs.filter(tab => tab.id !== tabId))
  }

  return (
    <TabProvider>
      <NotesProvider>
        <div className="flex flex-col h-full p-2">
          <div className="flex-1 flex flex-col bg-background">
            <div className="h-[50vh]">
              <div className="h-full">
                <div className="flex h-full">
                  <div className="w-48 shrink-0">
                    <TabBar />
                  </div>

                  <div className="flex-1 overflow-auto">
                    <TabContent />
                  </div>
                </div>
              </div>
            </div>

            <div className="h-[50vh]">
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
  return React.createElement(activeTab.component, {
    label: activeTab.label
  })
}
