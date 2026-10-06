import React from 'react';
import { Handle, Position } from '@xyflow/react';

const HANDLE_CONFIGS = [
  // 4 Cardinal Centers (positioned just outside the border)
  { id: 'top', position: Position.Top, style: { left: '50%', top: '-8px' }, title: 'Top (Double-click to create node)' },
  { id: 'right', position: Position.Right, style: { top: '50%', right: '-8px' }, title: 'Right (Double-click to create node)' },
  { id: 'bottom', position: Position.Bottom, style: { left: '50%', bottom: '-8px' }, title: 'Bottom (Double-click to create node)' },
  { id: 'left', position: Position.Left, style: { top: '50%', left: '-8px' }, title: 'Left (Double-click to create node)' },

  // 4 Corners (positioned just outside the corners)
  { id: 'top-right', position: Position.Top, style: { left: '92%', top: '-7px' }, title: 'Top-Right Corner (Double-click to create node)' },
  { id: 'bottom-right', position: Position.Bottom, style: { left: '92%', bottom: '-7px' }, title: 'Bottom-Right Corner (Double-click to create node)' },
  { id: 'bottom-left', position: Position.Bottom, style: { left: '8%', bottom: '-7px' }, title: 'Bottom-Left Corner (Double-click to create node)' },
  { id: 'top-left', position: Position.Top, style: { left: '8%', top: '-7px' }, title: 'Top-Left Corner (Double-click to create node)' },
];

export default function SketchHandles({ nodeId, isConnectable = true, onHandleDoubleClick }) {
  const handleDoubleClick = (e, direction) => {
    e.stopPropagation();
    e.preventDefault();
    if (onHandleDoubleClick) {
      onHandleDoubleClick(nodeId, direction);
    }
  };

  return (
    <>
      {HANDLE_CONFIGS.map((cfg) => (
        <React.Fragment key={cfg.id}>
          {/* Target Handle */}
          <Handle
            type="target"
            position={cfg.position}
            id={`target-${cfg.id}`}
            isConnectable={isConnectable}
            style={{
              ...cfg.style,
              width: '8px',
              height: '8px',
              minWidth: '8px',
              minHeight: '8px',
              backgroundColor: '#9CA3AF',
              border: '1.5px solid #2B2B2B',
              boxShadow: 'none',
              transform: 'none',
              zIndex: 25,
              cursor: 'crosshair',
            }}
            title={cfg.title}
            onDoubleClick={(e) => handleDoubleClick(e, cfg.id)}
          />

          {/* Source Handle overlaid */}
          <Handle
            type="source"
            position={cfg.position}
            id={`source-${cfg.id}`}
            isConnectable={isConnectable}
            style={{
              ...cfg.style,
              width: '8px',
              height: '8px',
              minWidth: '8px',
              minHeight: '8px',
              backgroundColor: '#9CA3AF',
              border: '1.5px solid #2B2B2B',
              boxShadow: 'none',
              transform: 'none',
              zIndex: 26,
              cursor: 'crosshair',
            }}
            title={cfg.title}
            onDoubleClick={(e) => handleDoubleClick(e, cfg.id)}
          />
        </React.Fragment>
      ))}
    </>
  );
}
