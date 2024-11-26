import React from 'react';
import { LayoutConfig, Field } from '@/types/tab';

interface DynamicComponentProps {
  config: LayoutConfig;
  fields: Field[];
}

export function DynamicComponent({ config, fields }: DynamicComponentProps) {
  const style = {
    position: 'absolute' as const,
    left: `${config.properties.x}px`,
    top: `${config.properties.y}px`,
    width: `${config.properties.width}px`,
    height: `${config.properties.height}px`,
  };

  const renderContent = () => {
    switch (config.type) {
      case 'input':
        return (
          <div className="w-full h-full bg-background border rounded-md shadow-sm">
            <input
              type="text"
              placeholder={config.properties.placeholder}
              className="w-full h-full px-3 py-2 rounded-md focus:outline-none focus:ring-2 ring-primary"
            />
          </div>
        );
      case 'button':
        return (
          <button className="w-full h-full px-4 py-2 bg-primary text-primary-foreground rounded-md hover:bg-primary/90 transition-colors shadow-sm">
            {config.properties.label}
          </button>
        );
      case 'textarea':
        return (
          <div className="w-full h-full bg-background border rounded-md shadow-sm">
            <textarea
              placeholder={config.properties.placeholder}
              className="w-full h-full px-3 py-2 rounded-md resize-none focus:outline-none focus:ring-2 ring-primary"
            />
          </div>
        );
      default:
        return null;
    }
  };

  return (
    <div style={style} className="!absolute">
      {renderContent()}
    </div>
  );
} 