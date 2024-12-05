import { Stage, Layer, Rect, Text, Group, Transformer, Circle } from 'react-konva';
import { useEffect, useRef, useState } from 'react';
import { LayoutConfig } from '@/types/tab';
import { KonvaInput, KonvaButton, KonvaText, KonvaTextarea, KonvaCheckbox, KonvaSelect } from './canvas-konva-components';
import { KonvaEventObject } from 'konva/lib/Node';

interface CanvasProps {
  layout: LayoutConfig[];
  setLayout: (layout: LayoutConfig[]) => void;
  selectedComponent: string | null;
  onSelect: (id: string | null) => void;
  isDialog?: boolean;
  onEventTrigger?: (event: string) => void;
}

const gridProps = {
  stroke: 'rgba(0,0,0,0.05)',
  strokeWidth: 1,
  dash: [5, 5],
};

export const CanvasKonva = ({
  layout,
  setLayout,
  selectedComponent,
  onSelect,
  isDialog,
  onEventTrigger,
}: CanvasProps) => {
  const stageRef = useRef<any>(null);
  const transformerRef = useRef<any>(null);
  const [stageSize, setStageSize] = useState({ width: 800, height: 600 });
  const [isDragging, setIsDragging] = useState(false);
  const [scale, setScale] = useState(1);
  const [position, setPosition] = useState({ x: 0, y: 0 });

  // Zoom işlemleri
  const handleWheel = (e: KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault();
    const scaleBy = 1.1;
    const oldScale = scale;
    const pointer = stageRef.current.getPointerPosition();
    const mousePointTo = {
      x: (pointer.x - position.x) / oldScale,
      y: (pointer.y - position.y) / oldScale,
    };
    
    const newScale = e.evt.deltaY < 0 ? oldScale * scaleBy : oldScale / scaleBy;
    
    setScale(newScale);
    setPosition({
      x: pointer.x - mousePointTo.x * newScale,
      y: pointer.y - mousePointTo.y * newScale,
    });
  };

  // Bileşen render fonksiyonu
  const renderKonvaComponent = (item: LayoutConfig) => {
    const isSelected = selectedComponent === item.id;
    const props = {
      item,
      isSelected,
      onSelect: () => onSelect(item.id),
    };

    switch (item.type) {
      case "input":
        return <KonvaInput {...props} />;
      case "button":
        return <KonvaButton {...props} />;
      case "text":
        return <KonvaText {...props} />;
      case "textarea":
        return <KonvaTextarea {...props} />;
      case "checkbox":
        return <KonvaCheckbox {...props} />;
      case "select":
        return <KonvaSelect {...props} />;
      default:
        return null;
    }
  };

  const handleDragEnd = (e: any, item: LayoutConfig) => {
    const pos = e.target.position();
    const newLayout = layout.map((l) =>
      l.id === item.id
        ? {
            ...l,
            properties: {
              ...l.properties,
              x: Math.round(pos.x / 10) * 10,
              y: Math.round(pos.y / 10) * 10,
            },
          }
        : l
    );
    setLayout(newLayout);
    setIsDragging(false);
  };

  const handleDragMove = (e: any, item: LayoutConfig) => {
    const stage = e.target.getStage();
    const layer = e.target.getLayer();
    const pos = e.target.position();

    // Grid sınırları
    const minX = 0;
    const minY = 0;
    const maxX = stageSize.width - item.properties.width;
    const maxY = stageSize.height - item.properties.height;

    // Pozisyonu sınırlar içinde tut
    const newX = Math.max(minX, Math.min(maxX, pos.x));
    const newY = Math.max(minY, Math.min(maxY, pos.y));

    // Pozisyonu güncelle
    e.target.position({
      x: Math.round(newX / 10) * 10,
      y: Math.round(newY / 10) * 10
    });

    // Layout'u geçici olarak güncelle (silme butonu için)
    const updatedLayout = layout.map((l) =>
      l.id === item.id
        ? {
            ...l,
            properties: {
              ...l.properties,
              x: Math.round(newX / 10) * 10,
              y: Math.round(newY / 10) * 10,
            },
          }
        : l
    );
    setLayout(updatedLayout);
  };

  useEffect(() => {
    if (selectedComponent && transformerRef.current) {
      const node = stageRef.current?.findOne(`#${selectedComponent}`);
      if (node) {
        transformerRef.current.nodes([node]);
        transformerRef.current.getLayer().batchDraw();
      }
    } else if (transformerRef.current) {
      transformerRef.current.nodes([]);
      transformerRef.current.getLayer().batchDraw();
    }
  }, [selectedComponent]);

  const handleTransformEnd = (e: any) => {
    const node = e.target;
    const scaleX = node.scaleX();
    const scaleY = node.scaleY();
    const rotation = node.rotation();

    // Ölçeği sıfırla ve boyutları güncelle
    node.scaleX(1);
    node.scaleY(1);

    const newWidth = Math.round((node.width() * scaleX) / 10) * 10;
    const newHeight = Math.round((node.height() * scaleY) / 10) * 10;
    const newX = Math.round(node.x() / 10) * 10;
    const newY = Math.round(node.y() / 10) * 10;
    const newRotation = Math.round(rotation / 15) * 15; // 15 derecelik artışlarla döndürme

    // Layout'u güncelle
    const itemId = node.id();
    const newLayout = layout.map((l) =>
      l.id === itemId
        ? {
            ...l,
            properties: {
              ...l.properties,
              width: newWidth,
              height: newHeight,
              x: newX,
              y: newY,
              rotation: newRotation,
            },
          }
        : l
    );
    setLayout(newLayout);
  };

  const handleDelete = (e: KeyboardEvent) => {
    if (e.key === 'Delete' && selectedComponent) {
      setLayout(layout.filter(item => item.id !== selectedComponent));
      onSelect(null);
    }
  };

  useEffect(() => {
    window.addEventListener('keydown', handleDelete);
    return () => window.removeEventListener('keydown', handleDelete);
  }, [selectedComponent, layout]);

  // Silme butonu için render fonksiyonu
  const renderDeleteButton = () => {
    if (!selectedComponent) return null;

    const selectedItem = layout.find(item => item.id === selectedComponent);
    if (!selectedItem) return null;

    return (
      <Group
        x={selectedItem.properties.x + selectedItem.properties.width + 10}
        y={selectedItem.properties.y - 20}
        listening={true}
      >
        <Circle
          radius={8}
          fill="red"
          onClick={() => {
            setLayout(layout.filter(item => item.id !== selectedComponent));
            onSelect(null);
          }}
        />
        <Text
          text="×"
          fill="white"
          fontSize={12}
          x={-4}
          y={-6}
          onClick={() => {
            setLayout(layout.filter(item => item.id !== selectedComponent));
            onSelect(null);
          }}
        />
      </Group>
    );
  };

  const handleStageClick = (e: KonvaEventObject<MouseEvent>) => {
    // Eğer tıklanan şey Stage'in kendisiyse (boş alan)
    if (e.target === e.target.getStage()) {
      onSelect(null);
    }
  };

  return (
    <Stage
      ref={stageRef}
      width={stageSize.width}
      height={stageSize.height}
      onWheel={handleWheel}
      scaleX={scale}
      scaleY={scale}
      x={position.x}
      y={position.y}
      draggable
      onDragStart={() => setIsDragging(true)}
      onDragEnd={() => setIsDragging(false)}
      onClick={handleStageClick}
    >
      <Layer>
        {/* Izgara çizgileri */}
        {Array.from({ length: stageSize.width / 10 }).map((_, i) => (
          <Rect
            key={`v-${i}`}
            x={i * 10}
            y={0}
            width={0}
            height={stageSize.height}
            {...gridProps}
          />
        ))}
        {Array.from({ length: stageSize.height / 10 }).map((_, i) => (
          <Rect
            key={`h-${i}`}
            x={0}
            y={i * 10}
            width={stageSize.width}
            height={0}
            {...gridProps}
          />
        ))}

        {/* Bileşenler */}
        {layout.map((item) => (
          <Group
            key={item.id}
            id={item.id}
            x={item.properties.x}
            y={item.properties.y}
            width={item.properties.width}
            height={item.properties.height}
            rotation={item.properties.rotation || 0}
            draggable
            onDragMove={(e) => handleDragMove(e, item)}
            onDragEnd={(e) => handleDragEnd(e, item)}
            onClick={() => onSelect(item.id)}
            onTransformEnd={handleTransformEnd}
          >
            {renderKonvaComponent(item)}
          </Group>
        ))}

        {/* Transformer */}
        <Transformer
          ref={transformerRef}
          boundBoxFunc={(oldBox, newBox) => {
            // Minimum boyut kontrolü
            const minWidth = 50;
            const minHeight = 30;
            if (newBox.width < minWidth) newBox.width = minWidth;
            if (newBox.height < minHeight) newBox.height = minHeight;

            // Grid hizalama
            newBox.x = Math.round(newBox.x / 10) * 10;
            newBox.y = Math.round(newBox.y / 10) * 10;
            newBox.width = Math.round(newBox.width / 10) * 10;
            newBox.height = Math.round(newBox.height / 10) * 10;

            // Canvas sınırları kontrolü
            if (newBox.x < 0) newBox.x = 0;
            if (newBox.y < 0) newBox.y = 0;
            if (newBox.x + newBox.width > stageSize.width) {
              newBox.width = stageSize.width - newBox.x;
            }
            if (newBox.y + newBox.height > stageSize.height) {
              newBox.height = stageSize.height - newBox.y;
            }

            return newBox;
          }}
          rotateEnabled={true}
          rotationSnaps={[0, 15, 30, 45, 60, 75, 90, 105, 120, 135, 150, 165, 180]}
          enabledAnchors={['top-left', 'top-right', 'bottom-left', 'bottom-right']}
        />

        {/* Silme butonu en üstte render edilsin */}
        {renderDeleteButton()}
      </Layer>
    </Stage>
  );
}; 