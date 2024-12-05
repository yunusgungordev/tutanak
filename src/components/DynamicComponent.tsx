import { Field, LayoutConfig, ComponentEvent } from "@/types/tab"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Checkbox } from "@/components/ui/checkbox"
import { Textarea } from "@/components/ui/textarea"

interface DynamicComponentProps {
  config: LayoutConfig
  fields: Field[]
  onEventTrigger: (event: unknown, eventConfig: ComponentEvent) => void
}

export const DynamicComponent: React.FC<DynamicComponentProps> = ({
  config
}) => {
  const renderComponent = () => {
    const commonProps = {
      style: {
        position: 'absolute' as const,
        left: `${config.properties.x}px`,
        top: `${config.properties.y}px`,
        width: `${config.properties.width}px`,
        height: `${config.properties.height}px`,
        transform: config.properties.rotation ? 
          `rotate(${config.properties.rotation}deg)` : undefined,
        transformOrigin: 'center center',
        fontSize: config.properties.fontSize ? `${config.properties.fontSize}px` : undefined,
        fontFamily: config.properties.fontFamily,
        fontWeight: config.properties.fontWeight,
        color: config.properties.color,
        textAlign: config.properties.textAlign as any,
      },
      className: "absolute",
    };

    switch (config.type) {
      case "input":
        return (
          <div {...commonProps}>
            <Input 
              className="w-full h-full"
              placeholder={config.properties.placeholder}
            />
          </div>
        );
      case "select":
        return (
          <div {...commonProps}>
            <Select>
              <SelectTrigger className="w-full h-full">
                <SelectValue placeholder={config.properties.placeholder} />
              </SelectTrigger>
              <SelectContent>
                {config.properties.options?.map((option, index) => (
                  <SelectItem key={index} value={option}>{option}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        );
      case "checkbox":
        return (
          <div {...commonProps} className="flex items-center gap-2">
            <Checkbox checked={config.properties.value as boolean} />
            <span>{config.properties.label}</span>
          </div>
        );
      case "textarea":
        return (
          <div {...commonProps}>
            <Textarea
              className="w-full h-full resize-none"
              placeholder={config.properties.placeholder}
              style={{
                minHeight: 'unset',
                maxHeight: 'unset'
              }}
            />
          </div>
        );
      case "button":
        return (
          <div {...commonProps}>
            <Button 
              className="w-full h-full"
              variant="outline"
            >
              {config.properties.label || "Buton"}
            </Button>
          </div>
        );
      case "text":
        return (
          <div {...commonProps}>
            <p className="w-full h-full flex items-center">
              {config.properties.content || "Yeni Metin"}
            </p>
          </div>
        );
      // Diğer bileşenler...
    }
  };

  return renderComponent();
}