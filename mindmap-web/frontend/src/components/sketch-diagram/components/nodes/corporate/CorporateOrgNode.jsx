import React, { useState, useRef, useEffect } from 'react';
import { User } from 'lucide-react';
import SketchHandles from '../SketchHandles';

export default function CorporateOrgNode({ id, data, isConnectable = true, selected }) {
  const [isEditing, setIsEditing] = useState(false);
  const [name, setName] = useState(data.name || 'Full Name');
  const [role, setRole] = useState(data.role || 'Job Title');
  const inputRef = useRef(null);

  useEffect(() => {
    setName(data.name || 'Full Name');
    setRole(data.role || 'Job Title');
  }, [data.name, data.role]);

  useEffect(() => {
    if (isEditing && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isEditing]);

  const handleBlur = () => {
    setIsEditing(false);
    if (data.onDataChange) {
      data.onDataChange(id, { ...data, name, role });
    }
  };

  const accentColor = data.accentColor || data.borderColor || data.color || '#3B82F6';
  const borderColor = data.borderColor || (selected ? accentColor : 'rgba(0,0,0,0.12)');
  const bgColor = data.bgColor || '#FFFFFF';
  const isCeo = data.isCeo || false;

  return (
    <div
      style={{
        position: 'relative',
        display: 'flex',
        alignItems: 'center',
        backgroundColor: bgColor,
        borderRadius: '8px',
        padding: '12px 18px 12px 0',
        minWidth: data.width || (isCeo ? '230px' : '205px'),
        boxShadow: selected
          ? `0 0 0 2.5px ${accentColor}, 0 10px 25px rgba(0,0,0,0.12)`
          : '0 6px 18px rgba(0, 0, 0, 0.07)',
        border: `2px solid ${borderColor}`,
        transform: selected ? 'scale(1.02)' : 'none',
        transition: 'transform 0.15s ease, box-shadow 0.15s ease',
      }}
    >
      {/* Left Accent Bar */}
      <div
        style={{
          width: '6px',
          height: '100%',
          backgroundColor: accentColor,
          borderRadius: '8px 0 0 8px',
          position: 'absolute',
          left: 0,
          top: 0,
          bottom: 0,
        }}
      />

      {/* Content Container */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: '12px',
          paddingLeft: '18px',
          width: '100%',
        }}
      >
        {/* CEO Avatar Badge */}
        {isCeo && (
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '50%',
              backgroundColor: '#FEF2F2',
              border: `1.5px solid ${accentColor}`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: accentColor,
              flexShrink: 0,
            }}
          >
            <User size={18} />
          </div>
        )}

        {/* Text Details */}
        <div style={{ flex: 1, textAlign: 'left' }}>
          {isEditing ? (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '3px' }}>
              <input
                ref={inputRef}
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                onBlur={handleBlur}
                placeholder="Full Name"
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '14px',
                  fontWeight: 700,
                  color: '#111827',
                  border: `1px solid ${accentColor}`,
                  borderRadius: '4px',
                  padding: '2px 6px',
                  outline: 'none',
                  width: '100%',
                }}
              />
              <input
                type="text"
                value={role}
                onChange={(e) => setRole(e.target.value)}
                onBlur={handleBlur}
                placeholder="Job Title"
                style={{
                  fontFamily: 'sans-serif',
                  fontSize: '11px',
                  color: '#4B5563',
                  border: '1px solid #E5E7EB',
                  borderRadius: '4px',
                  padding: '2px 6px',
                  outline: 'none',
                  width: '100%',
                }}
              />
            </div>
          ) : (
            <div
              onDoubleClick={() => setIsEditing(true)}
              style={{ cursor: 'pointer' }}
              title="Double click to edit employee info"
            >
              <div
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: isCeo ? '15px' : '14px',
                  fontWeight: 700,
                  color: '#111827',
                  lineHeight: 1.25,
                }}
              >
                {name}
              </div>
              <div
                style={{
                  fontFamily: 'sans-serif',
                  fontSize: '11.5px',
                  fontWeight: 500,
                  color: '#6B7280',
                  marginTop: '2px',
                  lineHeight: 1.2,
                }}
              >
                {role}
              </div>
            </div>
          )}
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
