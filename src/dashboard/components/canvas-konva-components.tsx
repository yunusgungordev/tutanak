import { Rect, Text, Group, Circle, Line } from 'react-konva';
import { LayoutConfig } from '@/types/tab';

interface KonvaComponentProps {
  item: LayoutConfig;
  isSelected: boolean;
  onSelect: () => void;
}

export const KonvaInput = ({ item, isSelected }: KonvaComponentProps) => {
  return (
    <Group>
      <Rect
        width={item.properties.width}
        height={item.properties.height}
        fill="#ffffff"
        stroke={isSelected ? "#2563eb" : "#e2e8f0"}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={4}
      />
      <Text
        text={item.properties.placeholder || "Metin giriniz"}
        fill="#94a3b8"
        fontSize={14}
        padding={8}
      />
    </Group>
  );
};

export const KonvaButton = ({ item, isSelected }: KonvaComponentProps) => {
  return (
    <Group>
      <Rect
        width={item.properties.width}
        height={item.properties.height}
        fill="#f1f5f9"
        stroke={isSelected ? "#2563eb" : "#e2e8f0"}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={4}
      />
      <Text
        text={item.properties.label || "Buton"}
        fill="#1e293b"
        fontSize={14}
        width={item.properties.width}
        height={item.properties.height}
        align="center"
        verticalAlign="middle"
      />
    </Group>
  );
};

export const KonvaText = ({ item, isSelected }: KonvaComponentProps) => {
  return (
    <Group>
      <Rect
        width={item.properties.width || 200}
        height={item.properties.height || 40}
        fill="#ffffff"
        stroke={isSelected ? "#2563eb" : "#e2e8f0"}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={4}
      />
      <Text
        text={item.properties.content || "Yeni Metin"}
        width={item.properties.width || 200}
        height={item.properties.height || 40}
        fontSize={item.properties.fontSize || 16}
        fontFamily={item.properties.fontFamily || "Arial"}
        fontStyle={item.properties.fontWeight || "normal"}
        fill={item.properties.color || "#000000"}
        align={item.properties.textAlign || "left"}
        verticalAlign="middle"
        padding={8}
      />
    </Group>
  );
};

export const KonvaTextarea = ({ item, isSelected }: KonvaComponentProps) => {
  return (
    <Group>
      <Rect
        width={item.properties.width || 200}
        height={item.properties.height || 100}
        fill="#ffffff"
        stroke={isSelected ? "#2563eb" : "#e2e8f0"}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={4}
      />
      <Text
        text={item.properties.placeholder || "Metin giriniz"}
        fill="#94a3b8"
        fontSize={14}
        padding={8}
        width={item.properties.width - 16 || 184}
        height={item.properties.height - 16 || 84}
        wrap="word"
      />
    </Group>
  );
};

export const KonvaCheckbox = ({ item, isSelected }: KonvaComponentProps) => {
  return (
    <Group>
      <Rect
        width={20}
        height={20}
        fill="#ffffff"
        stroke={isSelected ? "#2563eb" : "#e2e8f0"}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={4}
      />
      {item.properties.value && (
        <Text
          text="✓"
          fontSize={14}
          fill="#1e293b"
          width={20}
          height={20}
          align="center"
          verticalAlign="middle"
        />
      )}
      <Text
        text={item.properties.label || "Onay Kutusu"}
        fill="#1e293b"
        fontSize={14}
        x={30}
        y={2}
      />
    </Group>
  );
};

export const KonvaSelect = ({ item, isSelected }: KonvaComponentProps) => {
  return (
    <Group>
      <Rect
        width={item.properties.width || 200}
        height={item.properties.height || 40}
        fill="#ffffff"
        stroke={isSelected ? "#2563eb" : "#e2e8f0"}
        strokeWidth={isSelected ? 2 : 1}
        cornerRadius={4}
      />
      <Text
        text={item.properties.placeholder || "Seçiniz"}
        fill="#94a3b8"
        fontSize={14}
        padding={8}
        width={item.properties.width - 30 || 170}
        height={item.properties.height || 40}
        verticalAlign="middle"
      />
      {/* Dropdown oku */}
      <Text
        text="▼"
        fontSize={12}
        fill="#64748b"
        x={item.properties.width - 25 || 175}
        y={item.properties.height / 2 - 6 || 14}
      />
    </Group>
  );
}; 