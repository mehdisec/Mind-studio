import React, { useState, useRef, useEffect } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { Trash2, RotateCw } from 'lucide-react';

const CARDINAL_HANDLES = [
  { id: 'top', position: Position.Top, style: { left: '50%', top: '-6px' }, title: 'Top' },
  { id: 'right', position: Position.Right, style: { top: '50%', right: '-6px' }, title: 'Right' },
  { id: 'bottom', position: Position.Bottom, style: { left: '50%', bottom: '-6px' }, title: 'Bottom' },
  { id: 'left', position: Position.Left, style: { top: '50%', left: '-6px' }, title: 'Left' },
];

export default function TextNode({ id, data, selected, isConnectable = true }) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(data.label || 'متن دلخواه...');
  const textareaRef = useRef(null);
  const nodeRef = useRef(null);

  const rotation = data.rotation || 0;

  useEffect(() => {
    setText(data.label || 'متن دلخواه...');
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

  const handleDelete = (e) => {
    e.stopPropagation();
    if (data.onDeleteNode) {
      data.onDeleteNode(id);
    }
  };

  const handleRotateStart = (e) => {
    e.stopPropagation();
    e.preventDefault();

    const nodeEl = nodeRef.current;
    if (!nodeEl) return;
    const rect = nodeEl.getBoundingClientRect();
    const centerX = rect.left + rect.width / 2;
    const centerY = rect.top + rect.height / 2;

    const handlePointerMove = (moveEvent) => {
      const dx = moveEvent.clientX - centerX;
      const dy = moveEvent.clientY - centerY;
      let deg = Math.atan2(dy, dx) * (180 / Math.PI) + 90;
      if (deg < 0) deg += 360;
      if (moveEvent.shiftKey) {
        deg = Math.round(deg / 15) * 15;
      } else {
        deg = Math.round(deg);
      }
      if (data.onDataChange) {
        data.onDataChange(id, { rotation: deg });
      }
    };

    const handlePointerUp = () => {
      window.removeEventListener('pointermove', handlePointerMove);
      window.removeEventListener('pointerup', handlePointerUp);
    };

    window.addEventListener('pointermove', handlePointerMove);
    window.addEventListener('pointerup', handlePointerUp);
  };

  const fontFamily = data.fontFamily || 'Vazirmatn, sans-serif';
  const fontSize = data.fontSize ? `${data.fontSize}px` : '20px';
  const fontWeight = data.fontWeight || (data.bold ? 800 : 600);
  const fontStyle = data.italic ? 'italic' : 'normal';
  const textAlign = data.textAlign || 'center';
  const textColor = data.textColor || data.color || '#1A1A1A';
  const bgColor = data.bgColor || 'transparent';

  return (
    <div
      ref={nodeRef}
      className={`relative group select-none p-2 transition-all flex items-center justify-center ${
        selected ? 'bg-emerald-500/5' : ''
      }`}
      style={{
        width: '100%',
        height: '100%',
        minWidth: 80,
        minHeight: 36,
        backgroundColor: bgColor,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: 'center center',
      }}
    >
      {/* Resizer */}
      <NodeResizer
        isVisible={selected}
        minWidth={60}
        minHeight={30}
        lineClassName="!border-emerald-500"
        handleClassName="!w-2.5 !h-2.5 !bg-white !border-2 !border-emerald-600 !rounded-full !shadow-md"
      />

      {/* Interactive 360 Degree Rotate Handle */}
      {selected && (
        <div
          className="absolute -top-7 left-1/2 -translate-x-1/2 flex flex-col items-center cursor-grab active:cursor-grabbing z-40 nodrag"
          onPointerDown={handleRotateStart}
          title="چرخش ۳۶۰ درجه (Drag to Rotate)"
        >
          <div className="w-5 h-5 bg-white text-emerald-600 rounded-full border-2 border-emerald-600 flex items-center justify-center shadow-md hover:scale-125 active:scale-95 transition-all">
            <RotateCw size={11} strokeWidth={2.5} />
          </div>
          <div className="w-[1.5px] h-2 bg-emerald-500"></div>
        </div>
      )}

      {/* 4 Cardinal Connection Handles */}
      {CARDINAL_HANDLES.map((cfg) => (
        <React.Fragment key={cfg.id}>
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
              backgroundColor: '#06B6D4',
              border: '1.5px solid #0F172A',
              boxShadow: '0 0 4px rgba(6, 182, 212, 0.6)',
              transform: 'none',
              zIndex: 25,
              cursor: 'crosshair',
            }}
            title={cfg.title}
          />
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
              backgroundColor: '#06B6D4',
              border: '1.5px solid #0F172A',
              boxShadow: '0 0 4px rgba(6, 182, 212, 0.6)',
              transform: 'none',
              zIndex: 26,
              cursor: 'crosshair',
            }}
            title={cfg.title}
          />
        </React.Fragment>
      ))}

      {/* Text Container */}
      {isEditing ? (
        <textarea
          ref={textareaRef}
          value={text}
          onChange={(e) => setText(e.target.value)}
          onBlur={handleBlur}
          onKeyDown={handleKeyDown}
          rows={text.includes('\n') ? 3 : 1}
          style={{
            width: '100%',
            height: '100%',
            textAlign,
            backgroundColor: 'transparent',
            border: 'none',
            outline: 'none',
            fontFamily,
            fontSize,
            fontWeight,
            fontStyle,
            color: textColor,
            resize: 'none',
            lineHeight: 1.3,
            padding: '2px 4px',
          }}
        />
      ) : (
        <div
          onDoubleClick={() => setIsEditing(true)}
          style={{
            width: '100%',
            textAlign,
            fontFamily,
            fontSize,
            fontWeight,
            fontStyle,
            color: textColor,
            lineHeight: 1.3,
            whiteSpace: 'pre-line',
            wordBreak: 'break-word',
            userSelect: 'none',
            cursor: 'text',
          }}
          title="دابل کلیک برای ویرایش متن"
        >
          {text}
        </div>
      )}

      {/* Delete button on hover */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3.5 -right-3.5 z-30">
        <button
          onClick={handleDelete}
          className="p-1 bg-rose-500 text-white rounded-full border border-white shadow-md hover:bg-rose-600 hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title="حذف متن"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
