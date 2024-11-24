import { Button } from "@/components/ui/button"
import { Timeline } from "@/dashboard/components/timeline"
import { NotesProvider } from "@/contexts/notes-context"
import { TabBar } from "@/dashboard/components/tab-bar"
import { Overview } from "@/dashboard/components/overview"
import { useState } from "react"
import { TabContent } from "@/types/tab"
import { FileText, ListTodo } from "lucide-react"
import { TaskList } from "./components/task-list"
import React from "react"

type ComponentProps = {
  label: string;
}

const defaultTabs: TabContent[] = [
  {
    id: "matbu-cumleler",
    type: "overview",
    component: Overview as React.ComponentType<ComponentProps>,
    icon: <FileText className="w-4 h-4" />,
    label: "Matbu Cümleler"
  },
  {
    id: "gorev-listesi",
    type: "task-list",
    component: TaskList as React.ComponentType<ComponentProps>,
    icon: <ListTodo className="w-4 h-4" />,
    label: "Görev Listesi"
  }
]

export default function DashboardPage() {
  const [tabs, setTabs] = useState<TabContent[]>(defaultTabs)
  const [activeTab, setActiveTab] = useState<TabContent>(defaultTabs[0])
  
  const handleTabChange = (tab: TabContent) => {
    setActiveTab(tab)
  }

  const handleNewTab = (newTab: TabContent) => {
    setTabs(prev => [...prev, newTab])
    setActiveTab(newTab)
  }

  return (
    <NotesProvider>
      <div className="flex flex-col h-full p-2 ">
        <div className="flex-1 flex flex-col bg-background">
          <div className="flex-1">
            <div className="mx-auto h-full">
              <div className="flex h-full">
                <div className="w-48 shrink-0">
                  <TabBar 
                    tabs={tabs}
                    activeTab={activeTab}
                    onTabChange={handleTabChange}
                    onNewTab={handleNewTab}
                  />
                </div>

                <div className="flex-1 overflow-auto">
                  {React.createElement(activeTab.component, {
                    label: activeTab.label
                  })}
                </div>
              </div>
            </div>
          </div>

          <div className="h-[350px]">
            <Timeline />
          </div>
        </div>
      </div>
    </NotesProvider>
  )
}
