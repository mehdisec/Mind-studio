import React, { useRef } from 'react';
import { Handle, Position, NodeResizer } from '@xyflow/react';
import { Trash2, RotateCw } from 'lucide-react';
import { DOODLE_PRESETS } from '../../utils/sketchUtils';

const CARDINAL_HANDLES = [
  { id: 'top', position: Position.Top, style: { left: '50%', top: '-6px' }, title: 'اتصال بالا (Top)' },
  { id: 'right', position: Position.Right, style: { top: '50%', right: '-6px' }, title: 'اتصال راست (Right)' },
  { id: 'bottom', position: Position.Bottom, style: { left: '50%', bottom: '-6px' }, title: 'اتصال پایین (Bottom)' },
  { id: 'left', position: Position.Left, style: { top: '50%', left: '-6px' }, title: 'اتصال چپ (Left)' },
];

export default function DoodleNode({ id, data, selected, isConnectable = true }) {
  const doodleDef = DOODLE_PRESETS.find((d) => d.id === data.doodleId) || DOODLE_PRESETS[0];
  const imgUrl = data.imgUrl || doodleDef?.imgUrl;
  const nodeRef = useRef(null);

  const rotation = data.rotation || 0;

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

  return (
    <div
      ref={nodeRef}
      className={`relative group cursor-move select-none p-1 transition-all w-full h-full flex items-center justify-center ${
        selected ? 'bg-emerald-500/5' : ''
      }`}
      style={{
        width: '100%',
        height: '100%',
        minWidth: 36,
        minHeight: 36,
        transform: rotation ? `rotate(${rotation}deg)` : undefined,
        transformOrigin: 'center center',
      }}
    >
      {/* Resizer handles when selected */}
      <NodeResizer
        isVisible={selected}
        minWidth={36}
        minHeight={36}
        lineClassName="!border-emerald-500"
        handleClassName="!w-3 !h-3 !bg-white !border-2 !border-emerald-600 !rounded-full !shadow-md hover:!scale-125 !transition-transform"
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
          {/* Target Handle */}
          <Handle
            type="target"
            position={cfg.position}
            id={`target-${cfg.id}`}
            isConnectable={isConnectable}
            style={{
              ...cfg.style,
              width: '9px',
              height: '9px',
              minWidth: '9px',
              minHeight: '9px',
              backgroundColor: '#06B6D4',
              border: '2px solid #0F172A',
              boxShadow: '0 0 4px rgba(6, 182, 212, 0.6)',
              transform: 'none',
              zIndex: 25,
              cursor: 'crosshair',
            }}
            title={cfg.title}
          />
          {/* Source Handle */}
          <Handle
            type="source"
            position={cfg.position}
            id={`source-${cfg.id}`}
            isConnectable={isConnectable}
            style={{
              ...cfg.style,
              width: '9px',
              height: '9px',
              minWidth: '9px',
              minHeight: '9px',
              backgroundColor: '#06B6D4',
              border: '2px solid #0F172A',
              boxShadow: '0 0 4px rgba(6, 182, 212, 0.6)',
              transform: 'none',
              zIndex: 26,
              cursor: 'crosshair',
            }}
            title={cfg.title}
          />
        </React.Fragment>
      ))}

      {imgUrl ? (
        <img
          src={imgUrl}
          alt={doodleDef?.name || 'Network Sticker'}
          className="w-full h-full object-contain pointer-events-none select-none drop-shadow-sm"
          draggable={false}
        />
      ) : (
        <div
          className="w-full h-full flex items-center justify-center pointer-events-none"
          dangerouslySetInnerHTML={{ __html: doodleDef?.svg || '' }}
        />
      )}

      {/* Delete button on hover */}
      <div className="opacity-0 group-hover:opacity-100 transition-opacity absolute -top-3.5 -right-3.5 z-30">
        <button
          onClick={handleDelete}
          className="p-1 bg-rose-500 text-white rounded-full border border-white shadow-md hover:bg-rose-600 hover:scale-110 active:scale-95 transition-all cursor-pointer"
          title="حذف استیکر"
        >
          <Trash2 size={12} />
        </button>
      </div>
    </div>
  );
}
