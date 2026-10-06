import React, { useState, useRef, useEffect } from 'react';
import SketchHandles from '../SketchHandles';

export default function PastelNode({ id, data, isConnectable = true, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label || 'Node');
  const textareaRef = useRef(null);

  useEffect(() => {
    setText(data.label || 'Node');
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

  // Pastel styling configuration
  const shape = data.shape || 'squircle'; // 'squircle' | 'oval' | 'rect' | 'root'
  const bgColor = data.bgColor || data.color || '#FFAE9C';
  const borderColor = data.borderColor || (shape === 'root' ? '#2D4233' : 'transparent');
  const textColor = data.textColor || '#2D3748';
  const fontSize = data.fontSize || (shape === 'root' ? '24px' : '17px');

  let borderRadius = '20px';
  let padding = '12px 20px';
  let minWidth = data.width || '105px';
  let minHeight = data.height || '65px';

  if (shape === 'root') {
    borderRadius = '28px';
    padding = '18px 28px';
    minWidth = '160px';
    minHeight = '90px';
  } else if (shape === 'oval') {
    borderRadius = '50px';
    padding = '10px 24px';
    minWidth = data.width || '120px';
    minHeight = data.height || '55px';
  } else if (shape === 'rect') {
    borderRadius = '14px';
    padding = '10px 20px';
    minWidth = data.width || '110px';
    minHeight = data.height || '55px';
  }

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        textAlign: 'center',
        backgroundColor: bgColor,
        color: textColor,
        borderRadius,
        border: borderColor !== 'transparent' ? `3px solid ${borderColor}` : (selected ? '3px solid #2D4233' : '2px solid transparent'),
        minWidth,
        minHeight,
        padding,
        boxShadow: selected
          ? '0 0 0 3px #2D4233, 0 8px 16px rgba(45,66,51,0.15)'
          : '0 4px 12px rgba(0,0,0,0.06)',
        transform: selected ? 'scale(1.03)' : 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
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
            fontSize,
            fontWeight: 800,
            color: textColor,
            resize: 'none',
            lineHeight: 1.2,
          }}
        />
      ) : (
        <div
          onDoubleClick={() => setIsEditing(true)}
          style={{
            cursor: 'pointer',
            fontFamily: 'var(--font-heading)',
            fontSize,
            fontWeight: 800,
            color: textColor,
            lineHeight: 1.2,
            whiteSpace: 'pre-line',
            wordBreak: 'break-word',
            userSelect: 'none',
            letterSpacing: '0.4px',
          }}
          title="Double click to edit"
        >
          {text}
        </div>
      )}

      {/* 8 Connection Handles */}
      <SketchHandles
        nodeId={id}
        isConnectable={isConnectable}
        onHandleDoubleClick={data.onHandleDoubleClick}
      />
    </div>
  );
}
