import React, { useState, useRef, useEffect } from 'react';
import SketchHandles from './SketchHandles';

export default function BranchNode({ id, data, isConnectable = true, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label || 'MAIN TOPIC');
  const textareaRef = useRef(null);

  useEffect(() => {
    setText(data.label || 'MAIN TOPIC');
  }, [data.label]);

  useEffect(() => {
    if (isEditing && textareaRef.current) {
      textareaRef.current.focus();
      textareaRef.current.select();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (data.onLabelChange) {
      data.onLabelChange(id, text);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  const handleToggleCollapse = (e) => {
    e.stopPropagation();
    if (data.onToggleCollapse) {
      data.onToggleCollapse(id);
    }
  };

  const isCollapsed = data.collapsed || false;
  const childCount = data.childCount || 0;

  const borderColor = data.borderColor || data.color || '#1A1A1A';
  const bgColor = data.bgColor || '#FFFFFF';
  const textColor = data.textColor || data.color || '#557A46';

  return (
    <div
      style={{
        position: 'relative',
        filter: 'drop-shadow(3px 3px 0px rgba(26,26,26,0.85))',
      }}
    >
      {/* Hand-Drawn Pebble */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minWidth: '150px',
          minHeight: '80px',
          maxWidth: '280px',
          padding: '12px 22px',
          backgroundColor: bgColor,
          border: `3.2px solid ${borderColor}`,
          borderRadius: '30px 18px 32px 16px / 18px 30px 16px 32px',
          transform: 'rotate(0.3deg)',
          filter: 'url(#hand-drawn-filter)',
          outline: selected ? `3px solid ${borderColor}` : 'none',
        }}
      >
        {isEditing ? (
          <textarea
            ref={textareaRef}
            value={text}
            onChange={(e) => setText(e.target.value)}
            onBlur={handleBlur}
            onKeyDown={handleKeyDown}
            rows={text.includes('\n') ? 2 : 1}
            style={{
              width: '100%',
              textAlign: 'center',
              backgroundColor: 'transparent',
              border: 'none',
              outline: 'none',
              fontFamily: 'var(--font-heading)',
              fontSize: '22px',
              fontWeight: 800,
              color: textColor,
              textTransform: 'uppercase',
              resize: 'none',
              lineHeight: 1.15,
            }}
          />
        ) : (
          <div
            onDoubleClick={() => setIsEditing(true)}
            style={{
              cursor: 'pointer',
              fontFamily: 'var(--font-heading)',
              fontSize: '22px',
              fontWeight: 800,
              color: textColor,
              textTransform: 'uppercase',
              lineHeight: 1.15,
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
            }}
            title="Double click to edit text"
          >
            {text}
          </div>
        )}

        {/* Collapsed Count Badge */}
        {isCollapsed && childCount > 0 && (
          <span
            onClick={handleToggleCollapse}
            style={{
              position: 'absolute',
              top: '-12px',
              left: '50%',
              transform: 'translateX(-50%)',
              padding: '2px 8px',
              backgroundColor: '#D9822B',
              color: '#FFFFFF',
              fontWeight: 700,
              fontSize: '11px',
              borderRadius: '12px',
              border: '1.5px solid #1A1A1A',
              cursor: 'pointer',
            }}
            title={`${childCount} hidden items - Click to expand`}
          >
            +{childCount}
          </span>
        )}
      </div>

      {/* 8 Connection Handles with Double-Click Node Creation */}
      <SketchHandles
        nodeId={id}
        isConnectable={isConnectable}
        onHandleDoubleClick={data.onHandleDoubleClick}
      />
    </div>
  );
}
