import { useState } from "react"
import { useTabContext } from "@/contexts/tab-context"
import { CreateTabDialog } from "@/dashboard/components/create-tab-dialog"
import { DeleteTabDialog } from "@/dashboard/components/delete-tab-dialog"
import { Pencil, Plus, Trash2 } from "lucide-react"
import { toast } from "react-hot-toast"

import { TabContent } from "@/types/tab"
import { cn } from "@/lib/utils"
import { Button } from "@/components/ui/button"

export function TabBar() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false)
  const { tabs, activeTab, setActiveTab, removeTab, updateTab } =
    useTabContext()
  const [editingTabId, setEditingTabId] = useState<string | null>(null)
  const [editingTabName, setEditingTabName] = useState("")
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [tabToDelete, setTabToDelete] = useState<{
    id: string
    label: string
  } | null>(null)
  const [editDialogOpen, setEditDialogOpen] = useState(false)
  const [tabToEdit, setTabToEdit] = useState<TabContent | null>(null)

  const handleEditTab = (tab: TabContent) => {
    setTabToEdit(tab)
    setEditDialogOpen(true)
  }

  const handleDeleteClick = (
    e: React.MouseEvent,
    tab: { id: string; label: string }
  ) => {
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
    <div className="flex h-full flex-col gap-1 border-r p-2">
      <div className="space-y-1">
        {tabs.map((tab) => (
          <div key={tab.id} className="group relative">
            <Button
              variant={activeTab.id === tab.id ? "default" : "ghost"}
              size="sm"
              className={cn(
                "flex w-full items-center justify-start gap-1 px-2 py-1",
                activeTab.id === tab.id && "bg-primary text-primary-foreground"
              )}
              onClick={() => setActiveTab(tab)}
            >
              {tab.icon}
              <span className="text-xs">{tab.label}</span>
            </Button>

            {!isDefaultTab(tab.type) && (
              <div className="absolute right-1 top-1/2 hidden -translate-y-1/2 items-center gap-0.5 rounded bg-background/80 px-0.5 group-hover:flex">
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
          <Plus className="h-4 w-4" />
        </Button>
      </div>

      <CreateTabDialog
        open={createDialogOpen}
        onOpenChange={setCreateDialogOpen}
      />

      {tabToEdit && (
        <CreateTabDialog
          open={editDialogOpen}
          onOpenChange={setEditDialogOpen}
          editMode={true}
          tabToEdit={tabToEdit}
        />
      )}

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
