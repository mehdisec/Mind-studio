import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position } from '@xyflow/react';

export default function DecisionNode({ id, data, isConnectable = true, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label || 'Lorem');
  const inputRef = useRef(null);

  useEffect(() => {
    setText(data.label || 'Lorem');
  }, [data.label]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (data.onLabelChange) {
      data.onLabelChange(id, text);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter') {
      e.preventDefault();
      handleBlur();
    }
  };

  const handleDoubleClickHandle = (e, direction) => {
    e.stopPropagation();
    e.preventDefault();
    if (data.onHandleDoubleClick) {
      data.onHandleDoubleClick(id, direction);
    }
  };

  const borderColor = data.borderColor || data.color || '#1A1A1A';
  const bgColor = data.bgColor || '#FFFFFF';
  const textColor = data.textColor || (data.color && data.color !== '#1A1A1A' ? data.color : '#1A1A1A');

  return (
    <div
      style={{
        position: 'relative',
        width: '120px',
        height: '80px',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        filter: 'drop-shadow(2.5px 2.5px 0px rgba(26,26,26,0.85))',
        transform: selected ? 'scale(1.02)' : 'none',
        transition: 'transform 0.15s ease',
      }}
    >
      {/* SVG Hand-Drawn Diamond */}
      <svg
        viewBox="0 0 120 80"
        style={{
          position: 'absolute',
          inset: 0,
          width: '100%',
          height: '100%',
          overflow: 'visible',
          filter: 'url(#hand-drawn-filter)',
        }}
      >
        <polygon
          points="60,4 116,40 60,76 4,40"
          fill={bgColor}
          stroke={borderColor}
          strokeWidth={selected ? '3.8' : '2.8'}
          strokeLinejoin="round"
        />
      </svg>

      {/* Center Text / Input */}
      <div
        style={{
          position: 'relative',
          zIndex: 10,
          textAlign: 'center',
          width: '80px',
        }}
      >
        {isEditing ? (
          <input
            ref={inputRef}
            type="text"
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            style={{
              width: '100%',
              textAlign: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-heading)',
              fontSize: '16px',
              fontWeight: 700,
              color: textColor,
            }}
          />
        ) : (
          <div
            onDoubleClick={() => setIsEditing(true)}
            style={{
              cursor: 'pointer',
              fontFamily: 'var(--font-heading)',
              fontSize: '16px',
              fontWeight: 700,
              color: textColor,
              userSelect: 'none',
            }}
            title="Double click to edit decision"
          >
            {text}
          </div>
        )}
      </div>

      {/* 8 Connection Handles around the Diamond */}
      {/* Top Point */}
      <Handle
        type="target"
        position={Position.Top}
        id="target-top"
        isConnectable={isConnectable}
        style={{ top: '-4px', left: '50%', zIndex: 25 }}
        onDoubleClick={(e) => handleDoubleClickHandle(e, 'top')}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="source-top"
        isConnectable={isConnectable}
        style={{ top: '-4px', left: '50%', zIndex: 26 }}
        onDoubleClick={(e) => handleDoubleClickHandle(e, 'top')}
      />

      {/* Right Point */}
      <Handle
        type="target"
        position={Position.Right}
        id="target-right"
        isConnectable={isConnectable}
        style={{ right: '-4px', top: '50%', zIndex: 25 }}
        onDoubleClick={(e) => handleDoubleClickHandle(e, 'right')}
      />
      <Handle
        type="source"
        position={Position.Right}
        id="source-right"
        isConnectable={isConnectable}
        style={{ right: '-4px', top: '50%', zIndex: 26 }}
        onDoubleClick={(e) => handleDoubleClickHandle(e, 'right')}
      />

      {/* Bottom Point */}
      <Handle
        type="target"
        position={Position.Bottom}
        id="target-bottom"
        isConnectable={isConnectable}
        style={{ bottom: '-4px', left: '50%', zIndex: 25 }}
        onDoubleClick={(e) => handleDoubleClickHandle(e, 'bottom')}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom"
        isConnectable={isConnectable}
        style={{ bottom: '-4px', left: '50%', zIndex: 26 }}
        onDoubleClick={(e) => handleDoubleClickHandle(e, 'bottom')}
      />

      {/* Left Point */}
      <Handle
        type="target"
        position={Position.Left}
        id="target-left"
        isConnectable={isConnectable}
        style={{ left: '-4px', top: '50%', zIndex: 25 }}
        onDoubleClick={(e) => handleDoubleClickHandle(e, 'left')}
      />
      <Handle
        type="source"
        position={Position.Left}
        id="source-left"
        isConnectable={isConnectable}
        style={{ left: '-4px', top: '50%', zIndex: 26 }}
        onDoubleClick={(e) => handleDoubleClickHandle(e, 'left')}
      />

      {/* 4 Corner/Diagonal Handles */}
      <Handle
        type="source"
        position={Position.Top}
        id="source-top-right"
        isConnectable={isConnectable}
        style={{ top: '16%', left: '80%', zIndex: 26 }}
        onDoubleClick={(e) => handleDoubleClickHandle(e, 'top-right')}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom-right"
        isConnectable={isConnectable}
        style={{ bottom: '16%', left: '80%', zIndex: 26 }}
        onDoubleClick={(e) => handleDoubleClickHandle(e, 'bottom-right')}
      />
      <Handle
        type="source"
        position={Position.Bottom}
        id="source-bottom-left"
        isConnectable={isConnectable}
        style={{ bottom: '16%', left: '20%', zIndex: 26 }}
        onDoubleClick={(e) => handleDoubleClickHandle(e, 'bottom-left')}
      />
      <Handle
        type="source"
        position={Position.Top}
        id="source-top-left"
        isConnectable={isConnectable}
        style={{ top: '16%', left: '20%', zIndex: 26 }}
        onDoubleClick={(e) => handleDoubleClickHandle(e, 'top-left')}
      />
    </div>
  );
}
