import { Button } from "@/components/ui/button"
import { cn } from "@/lib/utils"
import { TabContent } from "@/types/tab"

interface TabBarProps {
  tabs: TabContent[]
  activeTab: TabContent
  onTabChange: (tab: TabContent) => void
  onNewTab: (tab: TabContent) => void
}

export function TabBar({ tabs, activeTab, onTabChange, onNewTab }: TabBarProps) {
  const handleTabClick = (tab: TabContent) => {
    onTabChange(tab)
  }

  return (
    <div className="flex flex-col gap-1 p-2 border-r h-full bg-background/50 backdrop-blur-sm">
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
            onClick={() => handleTabClick(tab)}
          >
            {tab.icon}
            <span className="text-xs">{tab.label}</span>
          </Button>
        ))}
      </div>
    </div>
  )
} 