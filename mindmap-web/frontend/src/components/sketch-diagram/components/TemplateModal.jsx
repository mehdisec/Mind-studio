import React from 'react';
import { X, LayoutTemplate, Check, Sparkles, ArrowRight, Undo2 } from 'lucide-react';
import { TEMPLATES } from '../templates/templateRegistry';

export default function TemplateModal({
  isOpen,
  onClose,
  activeTemplateId,
  onSelectTemplate,
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" style={{ zIndex: 99999 }}>
      <div
        className="modal-card animate-pop"
        style={{
          maxWidth: '680px',
          width: '92vw',
          maxHeight: '88vh',
          overflowY: 'auto',
        }}
      >
        {/* Header */}
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            borderBottom: '2.5px dashed #ccc',
            paddingBottom: '12px',
            marginBottom: '18px',
          }}
        >
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div
              style={{
                width: '38px',
                height: '38px',
                borderRadius: '10px',
                backgroundColor: '#557A46',
                color: '#fff',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                boxShadow: '2px 2px 0px rgba(0,0,0,0.8)',
              }}
            >
              <LayoutTemplate size={20} />
            </div>
            <div>
              <h2
                style={{
                  fontFamily: 'var(--font-heading)',
                  fontSize: '22px',
                  fontWeight: 700,
                  margin: 0,
                  color: '#1A1A1A',
                }}
              >
                انتخاب قالب نمودار (Templates)
              </h2>
              <p style={{ margin: '2px 0 0', fontSize: '13px', color: '#666' }}>
                می‌توانید بین انواع قالب‌های دست‌ساز (فلوچارت، مایند مپ و...) جابجا شوید یا رول‌بک کنید.
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="sketch-btn-icon"
            style={{ width: '34px', height: '34px' }}
          >
            <X size={18} />
          </button>
        </div>

        {/* Template Cards Grid */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {TEMPLATES.map((tpl) => {
            const isSelected = activeTemplateId === tpl.id;

            return (
              <div
                key={tpl.id}
                onClick={() => {
                  onSelectTemplate(tpl.id);
                  onClose();
                }}
                style={{
                  padding: '16px',
                  background: isSelected ? '#F4F7EE' : '#FFFFFF',
                  border: isSelected ? '3px solid #557A46' : '2.5px solid #1A1A1A',
                  borderRadius: '14px',
                  boxShadow: isSelected
                    ? '4px 4px 0px #557A46'
                    : '3px 3px 0px rgba(0,0,0,0.8)',
                  cursor: 'pointer',
                  transition: 'all 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  gap: '14px',
                  position: 'relative',
                }}
                className="template-card-hover"
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <div
                    style={{
                      fontSize: '36px',
                      width: '56px',
                      height: '56px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: isSelected ? '#E2EDD8' : '#F7F7F7',
                      border: '2px solid #1A1A1A',
                      borderRadius: '12px',
                    }}
                  >
                    {tpl.thumbnail}
                  </div>
                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <h3
                        style={{
                          margin: 0,
                          fontSize: '17px',
                          fontWeight: 800,
                          color: '#1A1A1A',
                          fontFamily: 'var(--font-heading)',
                        }}
                      >
                        {tpl.nameFa || tpl.name}
                      </h3>
                      <span
                        style={{
                          fontSize: '11px',
                          padding: '2px 8px',
                          borderRadius: '6px',
                          backgroundColor: '#1A1A1A',
                          color: '#fff',
                          fontWeight: 700,
                        }}
                      >
                        {tpl.category}
                      </span>
                      {isSelected && (
                        <span
                          style={{
                            fontSize: '11px',
                            padding: '2px 8px',
                            borderRadius: '6px',
                            backgroundColor: '#557A46',
                            color: '#fff',
                            fontWeight: 700,
                            display: 'flex',
                            alignItems: 'center',
                            gap: '4px',
                          }}
                        >
                          <Check size={12} /> در حال استفاده
                        </span>
                      )}
                    </div>
                    <p
                      style={{
                        margin: '6px 0 0',
                        fontSize: '13px',
                        color: '#555',
                        lineHeight: 1.5,
                      }}
                    >
                      {tpl.description}
                    </p>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <button
                    className={`sketch-btn ${
                      isSelected ? 'sketch-btn-primary' : 'sketch-btn-secondary'
                    }`}
                    style={{
                      padding: '8px 16px',
                      fontSize: '13px',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '6px',
                      whiteSpace: 'nowrap',
                    }}
                    onClick={(e) => {
                      e.stopPropagation();
                      onSelectTemplate(tpl.id);
                      onClose();
                    }}
                  >
                    {isSelected ? (
                      <>
                        <Check size={15} /> اعمال شده
                      </>
                    ) : (
                      <>
                        <ArrowRight size={15} /> انتخاب قالب
                      </>
                    )}
                  </button>
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer Info */}
        <div
          style={{
            marginTop: '20px',
            padding: '12px 16px',
            backgroundColor: '#FFF9E6',
            border: '2px solid #D97706',
            borderRadius: '10px',
            fontSize: '13px',
            color: '#92400E',
            display: 'flex',
            alignItems: 'center',
            gap: '10px',
          }}
        >
          <Undo2 size={18} />
          <div>
            <strong>امکان رول‌بک و افزودن آسان:</strong> هر زمان بخواهید می‌توانید بین فلوچارت و مایند مپ جابجا شوید یا قالب‌های جدید اضافه نمایید.
          </div>
        </div>
      </div>
    </div>
  );
}
