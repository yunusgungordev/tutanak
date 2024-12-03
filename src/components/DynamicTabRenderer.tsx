import React from "react"
import { useTabContext } from "@/contexts/tab-context"
import { toast } from "@/components/ui/use-toast"
import { Field, LayoutConfig } from "@/types/tab"
import { DynamicComponent } from "./DynamicComponent"

export interface DynamicTabProps {
  label: string
  id: string
  type: string
  layout?: LayoutConfig[]
  fields?: Field[]
  database?: {
    table_name: string
    fields: Field[]
  }
}

export const DynamicTabRenderer: React.FC<DynamicTabProps> = (props) => {
  const { setActiveTab, tabs, updateTab } = useTabContext()
  const layout = Array.isArray(props.layout) ? props.layout : []
  const fields = Array.isArray(props.fields) ? props.fields : []

  const handleEventTrigger = (event: any, eventConfig: any) => {
    console.log("Event triggered:", eventConfig)
    if (!eventConfig || !eventConfig.action) return

    switch (eventConfig.action) {
      case "setValue":
        const targetComponent = layout.find(
          (item) => item.id === eventConfig.targetComponent
        )
        if (targetComponent) {
          const updatedLayout = layout.map((item) =>
            item.id === eventConfig.targetComponent
              ? {
                  ...item,
                  properties: {
                    ...item.properties,
                    value: eventConfig.params?.value || "",
                  },
                }
              : item
          )
          updateTab(props.id, {
            ...props,
            layout: updatedLayout,
          })
        }
        break
      case "showMessage":
        toast({
          title: "Bilgi",
          description: eventConfig.params?.message || "Mesaj",
        })
        break
      case "navigateTab":
        const targetTab = tabs.find(tab => tab.id === eventConfig.params?.tabId)
        if (targetTab) {
          setActiveTab(targetTab)
        }
        break
      case "openDialog":
        // Dialog işlemleri
        break
      case "executeQuery":
        // Sorgu işlemleri
        break
      default:
        console.warn("Bilinmeyen olay türü:", eventConfig.action)
    }
  }

  return (
    <div className="relative h-full w-full p-4">
      {layout.map((item) => (
        <DynamicComponent 
          key={item.id} 
          config={item} 
          fields={fields}
          onEventTrigger={handleEventTrigger}
        />
      ))}
    </div>
  )
}
