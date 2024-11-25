import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { Plus, Pencil, Trash2 } from "lucide-react"
import { useState } from "react"
import { CreateTabDialog } from "@/dashboard/components/create-tab-dialog"
import { DeleteTabDialog } from "@/dashboard/components/delete-tab-dialog"
import { useTabContext } from "@/contexts/tab-context"

export function TabBar() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const { tabs, activeTab, setActiveTab, removeTab, updateTab } = useTabContext()
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingTabName, setEditingTabName] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tabToDelete, setTabToDelete] = useState<{ id: string; label: string } | null>(null)

  const handleEditTab = (tab: { id: string; label: string }) => {
    setEditingTabId(tab.id)
    setEditingTabName(tab.label)
  }

  const handleUpdateTab = (tabId: string) => {
    if (!editingTabName.trim()) return
    updateTab(tabId, editingTabName.trim())
    setEditingTabId(null)
    setEditingTabName("")
  }

  const handleDeleteClick = (e: React.MouseEvent, tab: { id: string; label: string }) => {
    e.stopPropagation()
    setTabToDelete(tab)
    setDeleteDialogOpen(true)
  }

  const handleConfirmDelete = () => {
    if (tabToDelete) {
      removeTab(tabToDelete.id)
      setTabToDelete(null)
    }
    setDeleteDialogOpen(false)
  }

  const isDefaultTab = (tabType: string) => {
    return tabType === "overview" || tabType === "task-list"
  }

  return (
    <div className="flex flex-col gap-1 p-2 border-r h-full">
      <div className="space-y-1">
        {tabs.map((tab) => (
          <div
            key={tab.id}
            className="group relative"
          >
            <Button
              variant={activeTab.id === tab.id ? "default" : "ghost"}
              size="sm"
              className={cn(
                "w-full flex items-center gap-1 justify-start px-2 py-1",
                activeTab.id === tab.id && "bg-primary text-primary-foreground"
              )}
              onClick={() => setActiveTab(tab)}
            >
              {tab.icon}
              {editingTabId === tab.id ? (
                <input
                  type="text"
                  value={editingTabName}
                  onChange={(e) => setEditingTabName(e.target.value)}
                  onBlur={() => handleUpdateTab(tab.id)}
                  onKeyDown={(e) => e.key === "Enter" && handleUpdateTab(tab.id)}
                  className="w-full px-1 py-0.5 text-xs bg-background border rounded text-foreground"
                  autoFocus
                  onClick={(e) => e.stopPropagation()}
                />
              ) : (
                <span className="text-xs">{tab.label}</span>
              )}
            </Button>
            
            {!isDefaultTab(tab.type) && (
              <div className="hidden group-hover:flex absolute right-1 top-1/2 -translate-y-1/2 items-center gap-0.5 bg-background/80 rounded px-0.5">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5"
                  onClick={(e) => {
                    e.stopPropagation()
                    handleEditTab(tab)
                  }}
                >
                  <Pencil size={12} />
                </Button>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-5 w-5 text-destructive"
                  onClick={(e) => handleDeleteClick(e, tab)}
                >
                  <Trash2 size={12} />
                </Button>
              </div>
            )}
          </div>
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

      {tabToDelete && (
        <DeleteTabDialog
          open={deleteDialogOpen}
          onOpenChange={setDeleteDialogOpen}
          onConfirm={handleConfirmDelete}
          tabName={tabToDelete.label}
        />
      )}
    </div>
  )
} 