import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { useState } from "react"
import { Plus } from "lucide-react"
import { CreateTabDialog } from "@/dashboard/components/create-tab-dialog"
import { useTabContext } from "@/contexts/tab-context"

export function TabBar() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const { tabs, activeTab, setActiveTab } = useTabContext()

  return (
    <div className="flex flex-col gap-1 p-2 border-r h-full">
      <div className="space-y-1">
        {tabs.map((tab) => (
          <Button
            key={tab.id}
            variant={activeTab.id === tab.id ? "default" : "ghost"}
            size="sm"
            className={cn(
              "w-full flex items-center gap-1 justify-start px-2 py-1",
              activeTab.id === tab.id && "bg-primary text-primary-foreground"
            )}
            onClick={() => setActiveTab(tab)}
          >
            {tab.icon}
            <span className="text-xs">{tab.label}</span>
          </Button>
        ))}
        
        <Button
          variant="ghost"
          size="sm"
          className="w-full"
          onClick={() => setCreateDialogOpen(true)}
        >
          <Plus className="w-4 h-4" />
        </Button>
      </div>

      <CreateTabDialog 
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />
    </div>
  )
} 