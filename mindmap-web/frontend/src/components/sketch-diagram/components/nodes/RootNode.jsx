import React, { useState, useRef, useEffect } from 'react';
import { Edit2 } from 'lucide-react';
import SketchHandles from './SketchHandles';

export default function RootNode({ id, data, isConnectable = true, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label || 'MIND MAP');
  const [isHovered, setIsHovered] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    setText(data.label || 'MIND MAP');
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
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleBlur();
    }
  };

  const borderColor = data.borderColor || data.color || '#1A1A1A';
  const bgColor = data.bgColor || '#FFFFFF';
  const textColor = data.textColor || data.color || '#557A46';

  return (
    <div
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      style={{
        position: 'relative',
        filter: 'drop-shadow(4px 4px 0px rgba(26,26,26,0.9))',
        transform: selected ? 'scale(1.02)' : 'none',
        transition: 'transform 0.15s ease',
      }}
    >
      {/* Hand-Drawn Main Bubble */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          minWidth: '260px',
          minHeight: '115px',
          padding: '16px 36px',
          backgroundColor: bgColor,
          border: `3.6px solid ${borderColor}`,
          borderRadius: '35px 25px 38px 22px / 24px 38px 20px 35px',
          transform: 'rotate(-0.5deg)',
          filter: 'url(#hand-drawn-filter)',
          outline: selected ? `3.5px solid ${borderColor}` : 'none',
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
              fontSize: '44px',
              fontWeight: 800,
              color: textColor,
              textTransform: 'uppercase',
              letterSpacing: '1.5px',
            }}
          />
        ) : (
          <div
            onDoubleClick={() => setIsEditing(true)}
            style={{
              cursor: 'pointer',
              fontFamily: 'var(--font-heading)',
              fontSize: '46px',
              fontWeight: 800,
              color: textColor,
              letterSpacing: '1.5px',
              lineHeight: 1.1,
              textTransform: 'uppercase',
              userSelect: 'none',
            }}
            title="Double click to edit topic"
          >
            {text}
          </div>
        )}

        {/* Quick Edit Icon */}
        {isHovered && (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              position: 'absolute',
              top: '-10px',
              right: '-10px',
              width: '26px',
              height: '26px',
              backgroundColor: '#FFFFFF',
              border: `2px solid ${borderColor}`,
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              cursor: 'pointer',
              boxShadow: '1.5px 1.5px 0px rgba(0,0,0,0.8)',
            }}
            title="Edit topic"
          >
            <Edit2 size={12} color="#1A1A1A" />
          </button>
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
