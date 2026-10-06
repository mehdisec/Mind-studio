import React, { useState, useRef, useEffect } from 'react';
import SketchHandles from '../SketchHandles';

export default function TerminalNode({ id, data, isConnectable = true, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label || 'Lorem\nipsum');
  const textareaRef = useRef(null);

  useEffect(() => {
    setText(data.label || 'Lorem\nipsum');
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
        filter: 'drop-shadow(2.5px 2.5px 0px rgba(26,26,26,0.85))',
        transform: selected ? 'scale(1.02)' : 'none',
        transition: 'transform 0.15s ease',
      }}
    >
      {/* Hand-Drawn Oval / Ellipse */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          minWidth: data.width || '115px',
          minHeight: data.height || '65px',
          padding: '10px 20px',
          backgroundColor: bgColor,
          border: `2.8px solid ${borderColor}`,
          borderRadius: '50px 45px 52px 48px / 32px 35px 30px 33px',
          transform: 'rotate(-0.3deg)',
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
              fontSize: '17px',
              fontWeight: 700,
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
              fontSize: '17px',
              fontWeight: 700,
              color: textColor,
              lineHeight: 1.2,
              whiteSpace: 'pre-line',
              wordBreak: 'break-word',
              userSelect: 'none',
            }}
            title="Double click to edit terminal node"
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
