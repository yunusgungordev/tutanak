import React, { createContext, useContext, useState, useEffect } from "react"
import { TabContent, DynamicTabConfig } from "@/types/tab"
import { Layout, FileText, ListTodo } from "lucide-react"
import { invoke } from "@tauri-apps/api/tauri"
import { Overview } from "@/dashboard/components/overview"
import { TaskList } from "@/dashboard/components/task-list"
import { nanoid } from 'nanoid';
import { DynamicTabRenderer } from "@/components/DynamicTabRenderer";

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

interface TabContextType {
  tabs: TabContent[]
  activeTab: TabContent
  addDynamicTab: (config: DynamicTabConfig) => void
  saveDynamicTab: (config: DynamicTabConfig) => Promise<boolean>
  updateDynamicTab: (id: string, config: Partial<DynamicTabConfig>) => void
  setActiveTab: (tab: TabContent) => void
  removeTab: (tabId: string) => void
  updateTab: (tabId: string, newLabel: string) => void
}

const TabContext = createContext<TabContextType | undefined>(undefined)

export function useTabContext() {
  const context = useContext(TabContext)
  if (context === undefined) {
    throw new Error('useTabContext must be used within a TabProvider')
  }
  return context
}

export function TabProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = useState<TabContent[]>(defaultTabs)
  const [activeTab, setActiveTab] = useState<TabContent>(defaultTabs[0])

  useEffect(() => {
    const loadTabs = async () => {
      try {
        const savedTabs = await invoke('get_tabs') as any[];
        
        const dynamicTabs = savedTabs.map(tab => ({
          id: tab.id,
          type: "dynamic",
          component: DynamicTabRenderer,
          icon: <Layout className="w-4 h-4" />,
          label: tab.label
        }));

        setTabs([...defaultTabs, ...dynamicTabs]);
      } catch (error) {
        console.error('Tablar yüklenirken hata oluştu:', error);
      }
    };

    loadTabs();
  }, []);

  const addDynamicTab = (config: DynamicTabConfig) => {
    const newTab: TabContent = {
      id: config.id,
      type: "dynamic",
      component: DynamicTabRenderer,
      icon: <Layout className="w-4 h-4" />,
      label: config.label
    }
    setTabs(prev => [...prev, newTab])
    setActiveTab(newTab)
  }

  const saveDynamicTab = async (config: DynamicTabConfig) => {
    try {
      const tabData = {
        id: nanoid(),
        label: config.label,
        type: config.type,
        layout: config.layout,
        database: {
          table_name: config.database.tableName,
          fields: config.database.fields
        },
        created_at: new Date().toISOString()
      };

      const result = await invoke('create_dynamic_tab', { tabData }) as boolean;
      
      if (result) {
        addDynamicTab({
          ...config,
          id: tabData.id
        });
        return true;
      }
      return false;
    } catch (error) {
      console.error('Tab kaydetme hatası:', error);
      return false;
    }
  }

  const updateDynamicTab = (id: string, config: Partial<DynamicTabConfig>) => {
    setTabs(prev => prev.map(tab => 
      tab.id === id ? { ...tab, ...config } : tab
    ))
  }

  const removeTab = async (tabId: string) => {
    try {
      // Eğer dinamik bir tab ise veritabanından sil
      const tabToRemove = tabs.find(tab => tab.id === tabId);
      if (tabToRemove?.type === "dynamic") {
        await invoke('delete_tab', { id: tabId });
      }
      
      // UI'dan tab'ı kaldır
      setTabs(prev => prev.filter(tab => tab.id !== tabId));
      
      // Eğer aktif tab siliniyorsa, varsayılan tab'a geç
      if (activeTab?.id === tabId) {
        setActiveTab(defaultTabs[0]);
      }
    } catch (error) {
      console.error('Tab silme hatası:', error);
    }
  };

  const updateTab = (tabId: string, newLabel: string) => {
    setTabs((prevTabs) =>
      prevTabs.map((tab) =>
        tab.id === tabId ? { ...tab, label: newLabel } : tab
      )
    )
  }

  return (
    <TabContext.Provider value={{ 
      tabs, 
      activeTab,
      addDynamicTab, 
      saveDynamicTab, 
      updateDynamicTab,
      setActiveTab,
      removeTab,
      updateTab
    }}>
      {children}
    </TabContext.Provider>
  )
} 