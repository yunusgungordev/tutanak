import React from 'react';
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { useTabContext } from "@/contexts/tab-context";
import { invoke } from "@tauri-apps/api/tauri";
import { TimelineProvider } from "@/contexts/timeline-context";
import { LayoutConfig, Field } from '@/types/tab';
import { DynamicComponent } from './DynamicComponent';

export interface DynamicTabProps {
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

export const DynamicTabRenderer: React.FC<DynamicTabProps> = (props) => {
  const layout = Array.isArray(props.layout) ? props.layout : [];
  const fields = Array.isArray(props.fields) ? props.fields : [];
  
  return (
    <div className="relative w-full h-full p-4">
      {layout.map((item) => (
        <DynamicComponent
          key={item.id}
          config={item}
          fields={fields}
        />
      ))}
    </div>
  );
} 