import React, { useState, useRef, useEffect } from 'react';
import SketchHandles from './SketchHandles';

export default function SubNode({ id, data, isConnectable = true, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label || 'Sub item');
  const inputRef = useRef(null);

  useEffect(() => {
    setText(data.label || 'Sub item');
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
      if (data.onAddSibling) {
        data.onAddSibling(id);
      }
    }
  };

  const borderColor = data.borderColor || data.color || '#1A1A1A';
  const bgColor = data.bgColor || '#FFFFFF';
  const textColor = data.textColor || (data.color && data.color !== '#1A1A1A' ? data.color : '#1A1A1A');

  return (
    <div
      style={{
        position: 'relative',
        filter: 'drop-shadow(2px 2px 0px rgba(26,26,26,0.8))',
      }}
    >
      {/* Hand-Drawn Capsule */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '130px',
          padding: '6px 18px',
          backgroundColor: bgColor,
          border: `2.5px solid ${borderColor}`,
          borderRadius: '22px 20px 24px 18px / 18px 24px 20px 22px',
          transform: 'rotate(-0.2deg)',
          filter: 'url(#hand-drawn-filter)',
          outline: selected ? `2.5px solid ${borderColor}` : 'none',
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
              fontFamily: 'var(--font-sketch)',
              fontSize: '15px',
              fontWeight: 700,
              color: textColor,
            }}
          />
        ) : (
          <div
            onDoubleClick={() => setIsEditing(true)}
            style={{
              cursor: 'pointer',
              fontFamily: 'var(--font-sketch)',
              fontSize: '15.5px',
              fontWeight: 700,
              color: textColor,
              whiteSpace: 'nowrap',
              userSelect: 'none',
            }}
            title="Double click to edit"
          >
            {text}
          </div>
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
