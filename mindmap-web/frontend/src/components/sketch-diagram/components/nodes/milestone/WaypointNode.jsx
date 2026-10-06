import React from 'react';
import SketchHandles from '../SketchHandles';

export default function WaypointNode({ id, data, isConnectable = true, selected }) {
  const borderColor = data.borderColor || data.color || '#1A1A1A';

  return (
    <div
      style={{
        position: 'relative',
        width: '24px',
        height: '24px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        transform: selected ? 'scale(1.2)' : 'none',
        transition: 'transform 0.15s ease',
      }}
    >
      {/* Outer Ring & Inner Dot */}
      <div
        style={{
          width: '20px',
          height: '20px',
          borderRadius: '50%',
          backgroundColor: '#FFFFFF',
          border: `2.8px solid ${borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '1.5px 1.5px 0px rgba(0,0,0,0.85)',
        }}
      >
        <div
          style={{
            width: '6px',
            height: '6px',
            borderRadius: '50%',
            backgroundColor: borderColor,
          }}
        />
      </div>

      {/* 8 Connection Handles */}
      <SketchHandles
        nodeId={id}
        isConnectable={isConnectable}
        onHandleDoubleClick={data.onHandleDoubleClick}
      />
    </div>
  );
}
