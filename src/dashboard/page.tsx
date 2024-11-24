import { Button } from "@/components/ui/button"
import { Timeline } from "@/dashboard/components/timeline"
import { NotesProvider } from "@/contexts/notes-context"
import { TabBar } from "@/dashboard/components/tab-bar"
import { useState } from "react"
import { TabProvider, useTabContext } from "@/contexts/tab-context"
import React from "react"

export default function DashboardPage() {
  return (
    <TabProvider>
      <NotesProvider>
        <div className="flex flex-col h-full p-2">
          <div className="flex-1 flex flex-col bg-background">
            <div className="flex-1">
              <div className="mx-auto h-full">
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

            <div className="h-[350px]">
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
