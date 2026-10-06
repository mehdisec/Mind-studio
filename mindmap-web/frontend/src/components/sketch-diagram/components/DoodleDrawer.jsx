import React, { useState } from 'react';
import { X, Sparkles, LayoutGrid, List } from 'lucide-react';
import { DOODLE_PRESETS } from '../utils/sketchUtils';

export default function DoodleDrawer({ isOpen, onClose, onSelectDoodle }) {
  if (!isOpen) return null;

  const [activeCategory, setActiveCategory] = useState('All');
  const [viewMode, setViewMode] = useState('grid'); // 'grid' | 'table'

  const categories = ['All', 'Accents', 'Arrows', 'Shapes', 'Icons', 'Frames'];

  const filteredDoodles = activeCategory === 'All'
    ? DOODLE_PRESETS
    : DOODLE_PRESETS.filter(d => d.category === activeCategory);

  return (
    <div
      className="doodles-drawer-card animate-pop"
      style={{
        position: 'absolute',
        top: '28px',
        right: '54px',
        zIndex: 99999,
        pointerEvents: 'auto',
        width: '320px',
        maxHeight: '75vh',
        padding: '12px',
        gap: '8px',
        backgroundColor: '#FFFFFF',
        borderRadius: '16px',
        border: '2.5px solid #1A1A1A',
        boxShadow: '4px 4px 0px rgba(26,26,26,0.9)',
        display: 'flex',
        flexDirection: 'column',
      }}
    >
      {/* Compact Header */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          borderBottom: '1.5px dashed #ccc',
          paddingBottom: '6px',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <Sparkles color="#4A6B3A" size={16} />
          <h3
            style={{
              fontFamily: 'var(--font-heading)',
              fontWeight: 700,
              fontSize: '15px',
              margin: 0,
              color: '#1A1A1A',
            }}
          >
            استیکرها (Doodles)
          </h3>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
          {/* Toggle View Mode */}
          <button
            onClick={() => setViewMode(viewMode === 'grid' ? 'table' : 'grid')}
            className="sketch-btn-icon"
            style={{ width: '24px', height: '24px', padding: '2px' }}
            title={viewMode === 'grid' ? 'نمای جدولی' : 'نمای کارت'}
          >
            {viewMode === 'grid' ? <List size={13} /> : <LayoutGrid size={13} />}
          </button>

          <button
            onClick={onClose}
            className="sketch-btn-icon"
            style={{ width: '24px', height: '24px', padding: '2px' }}
            title="بستن"
          >
            <X size={13} />
          </button>
        </div>
      </div>

      {/* Category Filter Pills */}
      <div
        style={{
          display: 'flex',
          gap: '4px',
          overflowX: 'auto',
          paddingBottom: '2px',
        }}
      >
        {categories.map((cat) => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            style={{
              padding: '2px 8px',
              fontSize: '11px',
              fontWeight: 700,
              borderRadius: '12px',
              border: '1.5px solid #1A1A1A',
              backgroundColor: activeCategory === cat ? '#4A6B3A' : '#ffffff',
              color: activeCategory === cat ? '#ffffff' : '#1A1A1A',
              cursor: 'pointer',
              whiteSpace: 'nowrap',
              outline: 'none',
              transition: 'all 0.15s ease',
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Content: Grid or Table View */}
      {viewMode === 'grid' ? (
        /* Compact 3-Column Uniform Grid */
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(3, 1fr)',
            gap: '8px',
            overflowY: 'auto',
            maxHeight: '340px',
            padding: '2px',
          }}
        >
          {filteredDoodles.map((doodle) => {
            const globalNumber = DOODLE_PRESETS.findIndex((d) => d.id === doodle.id) + 1;

            return (
              <div
                key={doodle.id}
                onClick={() => onSelectDoodle(doodle.id)}
                style={{
                  position: 'relative',
                  display: 'flex',
                  flexDirection: 'column',
                  alignItems: 'center',
                  justifyContent: 'center',
                  height: '82px',
                  padding: '4px',
                  borderRadius: '10px',
                  border: '1.5px solid #e2e8f0',
                  backgroundColor: '#FFFFFF',
                  cursor: 'pointer',
                  boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
                  transition: 'border-color 0.15s, background-color 0.15s, transform 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#10B981';
                  e.currentTarget.style.backgroundColor = '#F0FDF4';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e2e8f0';
                  e.currentTarget.style.backgroundColor = '#FFFFFF';
                }}
                title={`#${globalNumber}: ${doodle.name}`}
              >
                {/* Number Badge */}
                <div
                  style={{
                    position: 'absolute',
                    top: '3px',
                    left: '3px',
                    backgroundColor: '#4A6B3A',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '1px 5px',
                    borderRadius: '6px',
                    lineHeight: '13px',
                  }}
                >
                  #{globalNumber}
                </div>

                {/* Visual Thumbnail */}
                {doodle.imgUrl ? (
                  <img
                    src={doodle.imgUrl}
                    alt={doodle.name}
                    style={{
                      width: '40px',
                      height: '36px',
                      objectFit: 'contain',
                      marginTop: '6px',
                      pointerEvents: 'none',
                      userSelect: 'none',
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '42px',
                      height: '36px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      marginTop: '8px',
                      pointerEvents: 'none',
                    }}
                    dangerouslySetInnerHTML={{ __html: doodle.svg || '' }}
                  />
                )}

                {/* Label */}
                <span
                  style={{
                    fontSize: '10px',
                    fontWeight: 700,
                    color: '#333333',
                    marginTop: '2px',
                    textAlign: 'center',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    whiteSpace: 'nowrap',
                    width: '100%',
                    padding: '0 2px',
                  }}
                >
                  {doodle.name}
                </span>
              </div>
            );
          })}
        </div>
      ) : (
        /* Structured Table / List View */
        <div
          style={{
            display: 'flex',
            flexDirection: 'column',
            gap: '4px',
            overflowY: 'auto',
            maxHeight: '340px',
            padding: '2px',
          }}
        >
          {filteredDoodles.map((doodle) => {
            const globalNumber = DOODLE_PRESETS.findIndex((d) => d.id === doodle.id) + 1;

            return (
              <div
                key={doodle.id}
                onClick={() => onSelectDoodle(doodle.id)}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  padding: '4px 8px',
                  borderRadius: '8px',
                  border: '1px solid #e5e7eb',
                  backgroundColor: '#FAFAF7',
                  cursor: 'pointer',
                  transition: 'background-color 0.15s, border-color 0.15s',
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.borderColor = '#4A6B3A';
                  e.currentTarget.style.backgroundColor = '#EDF3E8';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.borderColor = '#e5e7eb';
                  e.currentTarget.style.backgroundColor = '#FAFAF7';
                }}
              >
                {/* Number Badge */}
                <span
                  style={{
                    backgroundColor: '#4A6B3A',
                    color: '#FFFFFF',
                    fontSize: '10px',
                    fontWeight: 800,
                    padding: '2px 6px',
                    borderRadius: '6px',
                    minWidth: '24px',
                    textAlign: 'center',
                  }}
                >
                  #{globalNumber}
                </span>

                {/* Icon Thumbnail */}
                {doodle.imgUrl ? (
                  <img
                    src={doodle.imgUrl}
                    alt={doodle.name}
                    style={{
                      width: '32px',
                      height: '28px',
                      objectFit: 'contain',
                      pointerEvents: 'none',
                      userSelect: 'none',
                      flexShrink: 0,
                    }}
                  />
                ) : (
                  <div
                    style={{
                      width: '32px',
                      height: '24px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      pointerEvents: 'none',
                      flexShrink: 0,
                    }}
                    dangerouslySetInnerHTML={{ __html: doodle.svg || '' }}
                  />
                )}

                {/* Name and Category */}
                <div style={{ display: 'flex', flexDirection: 'column', overflow: 'hidden', flexGrow: 1 }}>
                  <span
                    style={{
                      fontSize: '11px',
                      fontWeight: 700,
                      color: '#1A1A1A',
                      whiteSpace: 'nowrap',
                      overflow: 'hidden',
                      textOverflow: 'ellipsis',
                    }}
                  >
                    {doodle.name}
                  </span>
                  <span style={{ fontSize: '9px', color: '#666' }}>{doodle.category}</span>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* Footer Info */}
      <div
        style={{
          fontSize: '10.5px',
          color: '#555',
          textAlign: 'center',
          borderTop: '1px solid #eee',
          paddingTop: '6px',
        }}
      >
        📌 شماره استیکرهای مورد نظرتان را جهت حذف یا نگه‌داری اعلام کنید.
      </div>
    </div>
  );
}
