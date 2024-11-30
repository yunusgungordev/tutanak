import React from "react"
import { useTabContext } from "@/contexts/tab-context"
import { TimelineProvider } from "@/contexts/timeline-context"
import { invoke } from "@tauri-apps/api/tauri"

import { Field, LayoutConfig } from "@/types/tab"
import { Button } from "@/components/ui/button"
import { Checkbox } from "@/components/ui/checkbox"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Textarea } from "@/components/ui/textarea"

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
  const layout = Array.isArray(props.layout) ? props.layout : []
  const fields = Array.isArray(props.fields) ? props.fields : []

  return (
    <div className="relative h-full w-full p-4">
      {layout.map((item) => (
        <DynamicComponent key={item.id} config={item} fields={fields} />
      ))}
    </div>
  )
}
