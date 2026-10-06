import React, { useState, useRef, useEffect } from 'react';
import SketchHandles from '../SketchHandles';

export default function HeaderNode({ id, data, isConnectable = true, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label || 'Lorem ipsum\nDolor');
  const textareaRef = useRef(null);

  useEffect(() => {
    setText(data.label || 'Lorem ipsum\nDolor');
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

  const borderColor = data.borderColor || data.color || '#1A1A1A';
  const bgColor = data.bgColor || '#FFFFFF';
  const textColor = data.textColor || (data.color && data.color !== '#1A1A1A' ? data.color : '#1A1A1A');

  return (
    <div
      style={{
        position: 'relative',
        filter: 'drop-shadow(3px 3px 0px rgba(26,26,26,0.85))',
        transform: selected ? 'scale(1.02)' : 'none',
        transition: 'transform 0.15s ease',
      }}
    >
      {/* Hand-Drawn Wide Process Box for Flowchart Top/Header */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minWidth: data.width || '190px',
          minHeight: data.height || '75px',
          padding: '10px 24px',
          backgroundColor: bgColor,
          border: `3px solid ${borderColor}`,
          borderRadius: '4px 18px 6px 14px / 14px 4px 18px 6px',
          transform: 'rotate(-0.2deg)',
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
              fontSize: '20px',
              fontWeight: 700,
              color: textColor,
              resize: 'none',
              lineHeight: 1.25,
            }}
          />
        ) : (
          <div
            onDoubleClick={() => setIsEditing(true)}
            style={{
              cursor: 'pointer',
              fontFamily: 'var(--font-heading)',
              fontSize: '20px',
              fontWeight: 700,
              color: textColor,
              lineHeight: 1.25,
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
              userSelect: 'none',
            }}
            title="Double click to edit header"
          >
            {text}
          </div>
        )}
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
