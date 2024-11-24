import React from 'react';
import { Menu } from 'antd';
import type { MenuProps } from 'antd';

interface ComponentContextMenuProps {
  position: { x: number; y: number };
  onPropertyChange: (key: string, value: any) => void;
  componentProperties: any;
  onClose: () => void;
}

const ComponentContextMenu: React.FC<ComponentContextMenuProps> = ({
  position,
  onPropertyChange,
  componentProperties,
  onClose,
}) => {
  const menuStyle = {
    position: 'fixed' as const,
    top: position.y,
    left: position.x,
    boxShadow: '0 2px 8px rgba(0,0,0,0.15)',
    backgroundColor: 'white',
    padding: '8px',
    borderRadius: '4px',
  };

  const handlePropertyChange = (property: string, value: any) => {
    onPropertyChange(property, value);
  };

  return (
    <div style={menuStyle} onClick={(e) => e.stopPropagation()}>
      <Menu mode="vertical">
        {/* Boyut ayarları */}
        <Menu.SubMenu key="size" title="Boyut">
          <Menu.Item key="width">
            <input
              type="number"
              value={componentProperties.width || 100}
              onChange={(e) => handlePropertyChange('width', e.target.value)}
              placeholder="Genişlik"
            />
          </Menu.Item>
          <Menu.Item key="height">
            <input
              type="number"
              value={componentProperties.height || 100}
              onChange={(e) => handlePropertyChange('height', e.target.value)}
              placeholder="Yükseklik"
            />
          </Menu.Item>
        </Menu.SubMenu>
        
        {/* Diğer özellikler buraya eklenebilir */}
      </Menu>
    </div>
  );
};

export default ComponentContextMenu; 