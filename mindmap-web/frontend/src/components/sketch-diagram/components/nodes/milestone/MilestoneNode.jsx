import React, { useState, useRef, useEffect } from 'react';
import SketchHandles from '../SketchHandles';

export default function MilestoneNode({ id, data, isConnectable = true, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [stepNumber, setStepNumber] = useState(data.stepNumber || '01');
  const [title, setTitle] = useState(data.title || 'TITLE OF STEP');
  const [desc, setDesc] = useState(
    data.desc ||
      'LOREM IPSUM DOLOR SIT AMET, CONSECTETUER ADIPISCING ELIT, SED DIAM NONUMMY NIBH EUISMOD TINCIDUNT UT LAOREET DOLORE MAGNA ALIQUAM ERAT VOLUTPAT.'
  );
  const inputRef = useRef(null);

  useEffect(() => {
    setStepNumber(data.stepNumber || '01');
    setTitle(data.title || 'TITLE OF STEP');
    setDesc(data.desc || '');
  }, [data.stepNumber, data.title, data.desc]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (data.onDataChange) {
      data.onDataChange(id, { ...data, stepNumber, title, desc });
    }
  };

  const iconType = data.iconType || 'lightbulb'; // 'lightbulb' | 'rocket' | 'gears' | 'target' | 'trophy' | 'flag' | 'star'
  const isIconOnLeft = data.iconPosition !== 'right';

  const strokeColor = data.borderColor || data.color || '#1A1A1A';
  const textColor = data.textColor || strokeColor;

  const renderDoodleIcon = () => {
    switch (iconType) {
      case 'lightbulb':
        return (
          <svg viewBox="0 0 70 85" style={{ width: '60px', height: '75px', filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.85))' }}>
            <path
              d="M35,6 C22,6 12,16 12,29 C12,38 18,44 21,50 C23,54 23,58 23,61 L47,61 C47,58 47,54 49,50 C52,44 58,38 58,29 C58,16 48,6 35,6 Z"
              fill="#FFFFFF"
              stroke={strokeColor}
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            {/* Filament */}
            <path d="M28,34 L32,22 L38,22 L42,34" fill="none" stroke={strokeColor} strokeWidth="2.4" strokeLinecap="round" />
            {/* Base Threads */}
            <path d="M23,67 L47,67 M26,73 L44,73 M30,79 L40,79" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
          </svg>
        );
      case 'rocket':
        return (
          <svg viewBox="0 0 70 85" style={{ width: '60px', height: '75px', filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.85))' }}>
            {/* Rocket Body */}
            <path
              d="M35,6 C24,20 20,44 20,62 L50,62 C50,44 46,20 35,6 Z"
              fill="#FFFFFF"
              stroke={strokeColor}
              strokeWidth="3.2"
              strokeLinejoin="round"
            />
            {/* Left Fin */}
            <path d="M20,48 L8,64 C14,65 19,63 20,62 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="3" strokeLinejoin="round" />
            {/* Right Fin */}
            <path d="M50,48 L62,64 C56,65 51,63 50,62 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="3" strokeLinejoin="round" />
            {/* Porthole */}
            <circle cx="35" cy="34" r="7" fill="#FFFFFF" stroke={strokeColor} strokeWidth="3" />
            {/* Flames */}
            <path d="M26,67 C28,78 35,83 35,83 C35,83 42,78 44,67" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2.8" />
          </svg>
        );
      case 'gears':
        return (
          <svg viewBox="0 0 85 85" style={{ width: '70px', height: '70px', filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.85))' }}>
            {/* Big Gear */}
            <g transform="translate(10, 22)">
              <circle cx="24" cy="24" r="18" fill="#FFFFFF" stroke={strokeColor} strokeWidth="3.2" />
              <circle cx="24" cy="24" r="6" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2.8" />
              {/* Teeth */}
              <path d="M21,3 L27,3 M21,45 L27,45 M3,21 L3,27 M45,21 L45,27 M9,9 L14,14 M34,34 L39,39 M9,39 L14,34 M34,14 L39,9" stroke={strokeColor} strokeWidth="4" strokeLinecap="round" />
            </g>
            {/* Small Gear */}
            <g transform="translate(42, 2)">
              <circle cx="16" cy="16" r="12" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2.8" />
              <circle cx="16" cy="16" r="4" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2.4" />
              <path d="M14,2 L18,2 M14,30 L18,30 M2,14 L2,18 M30,14 L30,18" stroke={strokeColor} strokeWidth="3.2" strokeLinecap="round" />
            </g>
          </svg>
        );
      case 'target':
        return (
          <svg viewBox="0 0 80 85" style={{ width: '68px', height: '72px', filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.85))' }}>
            {/* Tripod Legs */}
            <path d="M24,56 L15,80 M56,56 L65,80 M24,66 L20,74 M56,66 L60,74" stroke={strokeColor} strokeWidth="3.2" strokeLinecap="round" />
            {/* Target Outer Circle */}
            <circle cx="40" cy="36" r="26" fill="#FFFFFF" stroke={strokeColor} strokeWidth="3.2" />
            <circle cx="40" cy="36" r="17" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2.8" />
            <circle cx="40" cy="36" r="8" fill="#FFFFFF" stroke={strokeColor} strokeWidth="2.8" />
            {/* Arrow Hit */}
            <line x1="40" y1="36" x2="68" y2="10" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" />
            <path d="M60,10 L70,8 L68,18" fill={strokeColor} stroke={strokeColor} strokeWidth="2" strokeLinejoin="round" />
          </svg>
        );
      default:
        return (
          <svg viewBox="0 0 70 85" style={{ width: '55px', height: '70px', filter: 'drop-shadow(2px 2px 0px rgba(0,0,0,0.85))' }}>
            {/* Trophy Icon */}
            <path d="M18,12 L52,12 L46,42 C46,48 40,54 35,54 C30,54 24,48 24,42 Z" fill="#FFFFFF" stroke={strokeColor} strokeWidth="3.2" strokeLinejoin="round" />
            <path d="M18,18 C10,18 10,32 18,34 M52,18 C60,18 60,32 52,34" fill="none" stroke={strokeColor} strokeWidth="3" strokeLinecap="round" />
            <path d="M35,54 L35,68 M22,68 L48,68" stroke={strokeColor} strokeWidth="3.5" strokeLinecap="round" />
          </svg>
        );
    }
  };

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        flexDirection: isIconOnLeft ? 'row' : 'row-reverse',
        alignItems: 'center',
        gap: '14px',
        minWidth: '280px',
        maxWidth: '340px',
        transform: selected ? 'scale(1.03)' : 'none',
        transition: 'transform 0.15s ease',
      }}
    >
      {/* Hand-Drawn Doodle Icon */}
      <div style={{ flexShrink: 0, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        {renderDoodleIcon()}
      </div>

      {/* Info & Text Block */}
      <div style={{ flex: 1, textAlign: 'left' }}>
        {isEditing ? (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
            <div style={{ display: 'flex', gap: '6px' }}>
              <input
                type="text"
                value={stepNumber}
                onChange={(e) => setStepNumber(e.target.value)}
                onBlur={handleBlur}
                placeholder="01"
                style={{
                  width: '40px',
                  textAlign: 'center',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '13px',
                  fontWeight: 800,
                  border: `2px solid ${strokeColor}`,
                  borderRadius: '50px',
                  background: '#fff',
                  color: textColor,
                  padding: '2px',
                }}
              />
              <input
                ref={inputRef}
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                onBlur={handleBlur}
                placeholder="STEP TITLE"
                style={{
                  flex: 1,
                  fontFamily: 'var(--font-heading)',
                  fontSize: '14px',
                  fontWeight: 900,
                  border: `2px solid ${strokeColor}`,
                  borderRadius: '6px',
                  background: '#fff',
                  color: textColor,
                  padding: '2px 6px',
                  textTransform: 'uppercase',
                }}
              />
            </div>
            <textarea
              value={desc}
              onChange={(e) => setDesc(e.target.value)}
              onBlur={handleBlur}
              rows={3}
              placeholder="Step description..."
              style={{
                fontFamily: 'var(--font-sketch)',
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#1A1A1A',
                border: `1.5px solid ${strokeColor}`,
                borderRadius: '6px',
                background: '#fff',
                padding: '3px 6px',
                resize: 'none',
                lineHeight: 1.25,
              }}
            />
          </div>
        ) : (
          <div
            onDoubleClick={() => setIsEditing(true)}
            style={{ cursor: 'pointer' }}
            title="Double click to edit milestone"
          >
            {/* Header: Badge + Title */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
              <div
                style={{
                  width: '26px',
                  height: '26px',
                  borderRadius: '50%',
                  border: `2.2px solid ${strokeColor}`,
                  backgroundColor: '#FFFFFF',
                  color: strokeColor,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontFamily: 'var(--font-heading)',
                  fontSize: '12px',
                  fontWeight: 900,
                  boxShadow: '1.5px 1.5px 0px rgba(0,0,0,0.85)',
                  flexShrink: 0,
                }}
              >
                {stepNumber}
              </div>
              <h3
                style={{
                  margin: 0,
                  fontFamily: 'var(--font-heading)',
                  fontSize: '14px',
                  fontWeight: 900,
                  color: textColor,
                  letterSpacing: '0.6px',
                  textTransform: 'uppercase',
                  lineHeight: 1.1,
                }}
              >
                {title}
              </h3>
            </div>

            {/* Description Paragraph with Hand-Drawn border */}
            <p
              style={{
                margin: 0,
                fontFamily: 'var(--font-sketch)',
                fontSize: '10.5px',
                fontWeight: 700,
                color: '#1A1A1A',
                lineHeight: 1.25,
                textTransform: 'uppercase',
                borderLeft: `2.5px solid ${strokeColor}`,
                paddingLeft: '6px',
                maxWidth: '220px',
              }}
            >
              {desc}
            </p>
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
