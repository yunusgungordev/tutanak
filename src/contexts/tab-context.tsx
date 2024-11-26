import React, { createContext, useContext, useState, useEffect } from "react"
import { DynamicTabConfig, LayoutConfig, Field } from "@/types/tab"
import { Layout, FileText, ListTodo } from "lucide-react"
import { invoke } from "@tauri-apps/api/tauri"
import { Overview } from "@/dashboard/components/overview"
import { TaskList } from "@/dashboard/components/task-list"
import { nanoid } from 'nanoid';
import { DynamicTabRenderer } from "@/components/DynamicTabRenderer";
import { toast } from 'react-hot-toast';
import { DynamicTabProps } from "@/components/DynamicTabRenderer";

interface TabUpdateConfig {
  label?: string;
  layout?: LayoutConfig[];
  fields?: Field[];
}

type ComponentProps = {
  label: string;
  id: string;
  type: string;
  layout?: LayoutConfig[];
  fields?: Field[];
  database?: {
    table_name: string;
    fields: Field[];
  };
}

export type TabContent = {
  id: string;
  type: string;
  component: React.ComponentType<any>;
  icon: React.ReactNode;
  label: string;
  layout?: LayoutConfig[];
  fields?: Field[];
  database?: {
    table_name: string;
    fields: Field[];
  };
  created_at?: string;
}

const defaultTabs: TabContent[] = [
  {
    id: "matbu-cumleler",
    type: "overview",
    component: Overview as unknown as React.ComponentType<DynamicTabProps>,
    icon: <FileText className="w-4 h-4" />,
    label: "Matbu Cümleler"
  },
  {
    id: "gorev-listesi",
    type: "task-list",
    component: TaskList as unknown as React.ComponentType<DynamicTabProps>,
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
  updateTab: (tabId: string, config: TabUpdateConfig) => void
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
        console.log('Loaded tabs from DB:', savedTabs);

        const dynamicTabs = savedTabs.map(tab => {
          let layout: LayoutConfig[] = [];
          let fields: Field[] = [];
          let database = { table_name: '', fields: [] as Field[] };

          try {
            // Layout parse
            if (typeof tab.layout === 'string') {
              layout = JSON.parse(tab.layout);
            } else if (Array.isArray(tab.layout)) {
              layout = tab.layout;
            }

            // Database parse
            if (typeof tab.database === 'string') {
              database = JSON.parse(tab.database);
            } else if (typeof tab.database === 'object' && tab.database !== null) {
              database = tab.database;
            }

            // Fields parse
            fields = database.fields || [];
          } catch (e) {
            console.error('Veri parse hatası:', e);
          }

          const processedTab: TabContent = {
            id: tab.id,
            type: "dynamic",
            component: DynamicTabRenderer,
            icon: <Layout className="w-4 h-4" />,
            label: tab.label,
            layout,
            fields,
            database,
            created_at: tab.created_at
          };

          return processedTab;
        });

        setTabs([...defaultTabs, ...dynamicTabs]);
      } catch (error) {
        console.error('Tablar yüklenirken hata oluştu:', error);
        toast.error("Tablar yüklenirken bir hata oluştu");
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
          table_name: config.database.table_name,
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

  const updateTab = async (tabId: string, config: TabUpdateConfig) => {
    try {
      const tabToUpdate = tabs.find(tab => tab.id === tabId);
      
      if (tabToUpdate?.type === "dynamic") {
        // UI'da tab'ı güncelle
        const updatedTabs = tabs.map((tab) =>
          tab.id === tabId 
            ? { 
                ...tab,
                label: config.label || tab.label,
                layout: config.layout || tab.layout || [],
                fields: config.fields || tab.fields || [],
                database: {
                  table_name: (config.label || tab.label)?.toLowerCase().replace(/\s+/g, '_'),
                  fields: config.fields || tab.fields || []
                }
              } 
            : tab
        );

        // Veritabanı güncellemesi için veriyi hazırla
        const updateData = {
          id: tabId,
          label: config.label || tabToUpdate.label,
          type: "dynamic",
          layout: config.layout || tabToUpdate.layout || [],
          database: {
            table_name: (config.label || tabToUpdate.label)?.toLowerCase().replace(/\s+/g, '_'),
            fields: config.fields || tabToUpdate.fields || []
          },
          created_at: tabToUpdate.created_at || new Date().toISOString()
        };

        console.log('Gönderilen güncelleme verisi:', updateData);

        // Veritabanını güncelle
        const result = await invoke('update_tab', { tabData: updateData });
        
        if (result) {
          // State'i güncelle
          setTabs(updatedTabs);
          
          // Eğer aktif tab güncellendiyse, aktif tab'ı da güncelle
          if (activeTab?.id === tabId) {
            const updatedTab = updatedTabs.find(tab => tab.id === tabId);
            if (updatedTab) {
              setActiveTab(updatedTab);
            }
          }

          toast.success("Tab başarıyla güncellendi");
          return true;
        }
        return false;
      }
    } catch (error) {
      console.error('Tab güncelleme hatası:', error);
      toast.error("Tab güncellenirken bir hata oluştu");
      return false;
    }
  };

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