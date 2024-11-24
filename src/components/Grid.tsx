import React, { useState, useRef } from 'react';
import { ResizableBox } from 'react-resizable';
import Draggable from 'react-draggable';
import 'react-resizable/css/styles.css';
import '../styles/Grid.css';

interface GridProps {
  components: any[];
  updateComponentProperties: (id: string, properties: any) => void;
}

export const Grid: React.FC<GridProps> = ({ components, updateComponentProperties }) => {
  const gridRef = useRef<HTMLDivElement>(null);

  const onResizeStop = (
    componentId: string,
    e: React.SyntheticEvent,
    direction: string,
    ref: HTMLElement,
    delta: { width: number; height: number }
  ) => {
    const newWidth = ref.style.width;
    const newHeight = ref.style.height;
    
    updateComponentProperties(componentId, {
      width: parseInt(newWidth),
      height: parseInt(newHeight)
    });
  };

  const onDragStop = (componentId: string, e: any, data: any) => {
    const gridRect = gridRef.current?.getBoundingClientRect();
    if (gridRect) {
      const scrollLeft = gridRef.current?.scrollLeft || 0;
      const scrollTop = gridRef.current?.scrollTop || 0;
      
      const x = data.x + scrollLeft;
      const y = data.y + scrollTop;

      updateComponentProperties(componentId, { x, y });
    }
  };

  return (
    <div className="grid-container" ref={gridRef}>
      <div className="grid-content">
        {components.map((component) => {
          const width = component.properties?.width || 200;
          const height = component.properties?.height || 100;
          const x = component.properties?.x || 0;
          const y = component.properties?.y || 0;

          return (
            <Draggable
              key={component.id}
              defaultPosition={{ x, y }}
              onStop={(e, data) => onDragStop(component.id, e, data)}
              bounds="parent"
            >
              <div className="draggable-wrapper">
                <ResizableBox
                  width={width}
                  height={height}
                  onResizeStop={(e, data) => onResizeStop(
                    component.id,
                    e,
                    data.handle,
                    data.node,
                    { width: data.size.width, height: data.size.height }
                  )}
                  minConstraints={[50, 50]}
                  maxConstraints={[1000, 1000]}
                  resizeHandles={['se', 'sw', 'ne', 'nw']}
                >
                  <div className="component-container">
                    {component.content}
                  </div>
                </ResizableBox>
              </div>
            </Draggable>
          );
        })}
      </div>
    </div>
  );
}; 