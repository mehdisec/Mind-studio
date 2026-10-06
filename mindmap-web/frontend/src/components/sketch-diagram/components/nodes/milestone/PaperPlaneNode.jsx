import React from 'react';
import { Plus } from 'lucide-react';
import SketchHandles from '../SketchHandles';

export default function PaperPlaneNode({ id, data, isConnectable = true, selected }) {
  const handleClick = (e) => {
    e.stopPropagation();
    if (data.onAddMilestone) {
      data.onAddMilestone();
    }
  };

  return (
    <div
      onClick={handleClick}
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        cursor: 'pointer',
        transform: selected ? 'scale(1.08)' : 'scale(1)',
        transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
      }}
      className="paper-plane-hover"
      title="Click on Paper Plane to add next milestone step!"
    >
      {/* Hand-Drawn Paper Airplane SVG */}
      <div style={{ position: 'relative', width: '130px', height: '110px' }}>
        {/* Glow / Flight aura */}
        <div
          style={{
            position: 'absolute',
            inset: '-10px',
            borderRadius: '50%',
            backgroundColor: 'rgba(255, 255, 255, 0.25)',
            filter: 'blur(10px)',
            pointerEvents: 'none',
          }}
        />

        {/* Paper Plane Silhouette & Creases */}
        <svg
          viewBox="0 0 140 120"
          style={{
            width: '100%',
            height: '100%',
            overflow: 'visible',
            filter: 'drop-shadow(3.5px 3.5px 0px rgba(26,26,26,0.9))',
          }}
        >
          {/* Main Top Wing */}
          <polygon
            points="128,12 12,68 84,76"
            fill="#FFFFFF"
            stroke="#1A1A1A"
            strokeWidth="3.4"
            strokeLinejoin="round"
          />
          {/* Bottom Underbody Fold */}
          <polygon
            points="128,12 84,76 74,106"
            fill="#F2F2EC"
            stroke="#1A1A1A"
            strokeWidth="3.2"
            strokeLinejoin="round"
          />
          {/* Inner Wing Fold */}
          <polygon
            points="128,12 84,76 104,74"
            fill="#FFFFFF"
            stroke="#1A1A1A"
            strokeWidth="2.8"
            strokeLinejoin="round"
          />
          {/* Flight Wind Streaks */}
          <path
            d="M-15,45 C15,35 60,30 110,8"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="2.2"
            strokeDasharray="4 6"
          />
          <path
            d="M-25,75 C5,65 50,55 95,28"
            fill="none"
            stroke="#1A1A1A"
            strokeWidth="2.2"
            strokeDasharray="4 6"
          />
        </svg>

        {/* Interactive Add Milestone Badge */}
        <div
          style={{
            position: 'absolute',
            bottom: '-12px',
            right: '-10px',
            backgroundColor: '#1A1A1A',
            color: '#FFFFFF',
            border: '2px solid #FFFFFF',
            borderRadius: '20px',
            padding: '3px 10px',
            fontSize: '11px',
            fontWeight: 800,
            fontFamily: 'var(--font-heading)',
            display: 'flex',
            alignItems: 'center',
            gap: '4px',
            boxShadow: '2px 2px 0px rgba(0,0,0,0.8)',
            pointerEvents: 'auto',
          }}
        >
          <Plus size={12} /> Add Step
        </div>
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
