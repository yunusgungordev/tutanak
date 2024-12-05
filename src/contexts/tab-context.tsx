import React, { createContext, useContext, useEffect, useState } from "react"
import { Overview } from "@/dashboard/components/overview"
import { invoke } from "@tauri-apps/api/tauri"
import { FileText, Layout } from "lucide-react"
import { nanoid } from "nanoid"
import { toast } from "react-hot-toast"

import { DynamicTabConfig, Field, LayoutConfig } from "@/types/tab"
import {
  DynamicTabProps,
  DynamicTabRenderer,
} from "@/components/DynamicTabRenderer"

interface TabUpdateConfig {
  label?: string
  layout?: LayoutConfig[]
  fields?: Field[]
}

export type TabContent = {
  id: string
  type: string
  component: React.ComponentType<any>
  icon: React.ReactNode
  label: string
  layout: LayoutConfig[]
  fields?: Field[]
  database?: {
    table_name: string
    fields: Field[]
  }
  created_at?: string
}

const defaultTabs: TabContent[] = [
  {
    id: "matbu-cumleler",
    type: "overview",
    component: Overview as unknown as React.ComponentType<DynamicTabProps>,
    icon: <FileText className="h-4 w-4" />,
    label: "Matbu Cümleler",
    layout: [],
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
  updateLayout: (tabId: string, newLayout: LayoutConfig[]) => void
}

const TabContext = createContext<TabContextType | undefined>(undefined)

export function useTabContext() {
  const context = useContext(TabContext)
  if (context === undefined) {
    throw new Error("useTabContext must be used within a TabProvider")
  }
  return context
}

export function TabProvider({ children }: { children: React.ReactNode }) {
  const [tabs, setTabs] = useState<TabContent[]>(defaultTabs)
  const [activeTab, setActiveTab] = useState<TabContent>(defaultTabs[0])

  useEffect(() => {
    const loadTabs = async () => {
      try {
        const savedTabs = (await invoke("get_tabs")) as any[]
        if (savedTabs.length > 0) {
          console.log("Yüklenen tablar:", savedTabs)
        }

        const dynamicTabs = savedTabs.map((tab) => {
          let layout: LayoutConfig[] = []
          let fields: Field[] = []
          let database = { table_name: "", fields: [] as Field[] }

          try {
            // Layout parse
            if (typeof tab.layout === "string") {
              layout = JSON.parse(tab.layout)
            } else if (Array.isArray(tab.layout)) {
              layout = tab.layout
            }

            // Database parse
            if (typeof tab.database === "string") {
              database = JSON.parse(tab.database)
            } else if (
              typeof tab.database === "object" &&
              tab.database !== null
            ) {
              database = tab.database
            }

            // Fields parse
            fields = database.fields || []
          } catch (e) {
            console.error("Veri parse hatası:", e)
          }

          const processedTab: TabContent = {
            id: tab.id,
            type: "dynamic",
            component: DynamicTabRenderer,
            icon: <Layout className="h-4 w-4" />,
            label: tab.label,
            layout,
            fields,
            database,
            created_at: tab.created_at,
          }

          return processedTab
        })

        setTabs([...defaultTabs, ...dynamicTabs])
      } catch (error) {
        console.error("Tablar yüklenirken hata oluştu:", error)
        toast.error("Tablar yüklenirken bir hata oluştu")
      }
    }

    loadTabs()
  }, [])

  const addDynamicTab = (config: DynamicTabConfig) => {
    const newTab: TabContent = {
      id: config.id,
      type: "dynamic",
      component: DynamicTabRenderer,
      icon: <Layout className="h-4 w-4" />,
      label: config.label,
      layout: config.layout,
      fields: config.fields,
      database: config.database,
    }
    setTabs((prev) => [...prev, newTab])
    setActiveTab(newTab)
  }

  const saveDynamicTab = async (config: DynamicTabConfig) => {
    try {
      const tabData = {
        id: nanoid(),
        label: config.label,
        type: "dynamic",
        layout: config.layout?.map((item) => ({
          ...item,
          properties: {
            ...item.properties,
            headers:
              item.type === "table" ? item.properties.headers || [] : undefined,
            rows:
              item.type === "table" ? item.properties.rows || [[]] : undefined,
            isVisible: true,
          },
        })),
        database: {
          table_name: config.database.table_name,
          fields: config.database.fields,
        },
        created_at: new Date().toISOString(),
      }

      const result = await invoke("create_dynamic_tab", { tabData })

      if (result) {
        const newTab = {
          ...tabData,
          component: DynamicTabRenderer,
          icon: <Layout className="h-4 w-4" />,
        }
        const typedNewTab = newTab as TabContent
        setTabs((prev) => [...prev, typedNewTab])
        setActiveTab(typedNewTab)
        return true
      }
      return false
    } catch (error) {
      console.error("Tab kaydetme hatası:", error)
      return false
    }
  }

  const updateDynamicTab = (id: string, config: Partial<DynamicTabConfig>) => {
    setTabs((prev) =>
      prev.map((tab) => (tab.id === id ? { ...tab, ...config } : tab))
    )
  }

  const removeTab = async (tabId: string) => {
    try {
      // Eğer dinamik bir tab ise veritabanından sil
      const tabToRemove = tabs.find((tab) => tab.id === tabId)
      if (tabToRemove?.type === "dynamic") {
        await invoke("delete_tab", { id: tabId })
      }

      // UI'dan tab'ı kaldır
      setTabs((prev) => prev.filter((tab) => tab.id !== tabId))

      // Eğer aktif tab siliniyorsa, varsayılan tab'a geç
      if (activeTab?.id === tabId) {
        setActiveTab(defaultTabs[0])
      }
    } catch (error) {
      console.error("Tab silme hatası:", error)
    }
  }

  const updateTab = async (tabId: string, config: TabUpdateConfig) => {
    try {
      const tabToUpdate = tabs.find((tab) => tab.id === tabId)

      if (tabToUpdate?.type === "dynamic") {
        const updatedLayout =
          config.layout?.map((item) => ({
            ...item,
            properties: {
              ...item.properties,
              content: item.properties.content,
            },
          })) || []

        const updateData = {
          id: tabId,
          label: config.label || tabToUpdate.label,
          type: "dynamic",
          layout: updatedLayout,
          database: tabToUpdate.database || { table_name: "", fields: [] },
          created_at: tabToUpdate.created_at || new Date().toISOString(),
        }

        const result = await invoke("update_tab", { tabData: updateData })

        if (result) {
          // State'i anında güncelle
          const updatedTabs = tabs.map((tab) =>
            tab.id === tabId
              ? {
                  ...tab,
                  ...updateData,
                  component: DynamicTabRenderer,
                  icon: <Layout className="h-4 w-4" />,
                  layout: updatedLayout,
                }
              : tab
          )
          
          setTabs(updatedTabs)
          
          // Aktif tab'ı da güncelle
          if (activeTab?.id === tabId) {
            setActiveTab({
              ...activeTab,
              ...updateData,
              component: DynamicTabRenderer,
              icon: <Layout className="h-4 w-4" />,
              layout: updatedLayout,
            })
          }

          return true
        }
      }
      return false
    } catch (error) {
      console.error("Tab güncelleme hatası:", error)
      toast.error("Tab güncellenirken bir hata oluştu")
      return false
    }
  }

  const updateLayout = (tabId: string, newLayout: LayoutConfig[]) => {
    setTabs((prev) =>
      prev.map((tab) =>
        tab.id === tabId
          ? {
              ...tab,
              layout: newLayout || [],
            }
          : tab
      )
    )
  }

  return (
    <TabContext.Provider
      value={{
        tabs,
        activeTab,
        addDynamicTab,
        saveDynamicTab,
        updateDynamicTab,
        setActiveTab,
        removeTab,
        updateTab,
        updateLayout,
      }}
    >
      {children}
    </TabContext.Provider>
  )
}
