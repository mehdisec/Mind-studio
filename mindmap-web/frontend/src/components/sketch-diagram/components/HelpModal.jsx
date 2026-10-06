import React from 'react';
import { X, Keyboard, MousePointer, Move, Download } from 'lucide-react';

export default function HelpModal({ isOpen, onClose }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay">
      <div className="modal-card animate-pop">
        {/* Header */}
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '2px dashed #ccc', paddingBottom: '10px', marginBottom: '16px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span style={{ fontSize: '24px' }}>🎨</span>
            <h2 style={{ fontFamily: 'var(--font-heading)', fontSize: '22px', fontWeight: 700, margin: 0 }}>
              راهنمای استفاده و میانبرهای کیبورد
            </h2>
          </div>
          <button
            onClick={onClose}
            className="sketch-btn-icon"
            style={{ width: '32px', height: '32px' }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Content */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', fontSize: '14px', color: '#222' }}>
          <div style={{ padding: '10px 14px', background: '#ffffff', border: '2px solid #1A1A1A', borderRadius: '12px', boxShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
            <h3 style={{ fontWeight: 800, color: '#4A6B3A', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
              <Keyboard size={16} /> کپی و پیست و کلید Tab (میانبرهای کیبورد)
            </h3>
            <ul style={{ paddingRight: '18px', margin: 0, lineHeight: 1.7 }}>
              <li><strong>کلید Ctrl+C و Ctrl+V:</strong> کپی کردن نودهای انتخاب‌شده و پیست سریع آن‌ها در تمام قالب‌ها و چارت‌ها.</li>
              <li><strong>کلید Tab روی نود انتخابی:</strong> ایجاد و اتصال فوری نود بعدی متناسب با قالب فعال.</li>
              <li><strong>کلید Enter روی زیرشاخه:</strong> ایجاد فوری ساب‌نود مجاور بعدی.</li>
              <li><strong>کلید Delete یا Backspace:</strong> حذف نود یا خط اتصال انتخاب‌شده.</li>
            </ul>
          </div>

          <div style={{ padding: '10px 14px', background: '#ffffff', border: '2px solid #1A1A1A', borderRadius: '12px', boxShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
            <h3 style={{ fontWeight: 800, color: '#4A6B3A', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
              <MousePointer size={15} /> ۸ نقطه اتصال هوشمند (8 Connection Points)
            </h3>
            <ul style={{ paddingRight: '18px', margin: 0, lineHeight: 1.6 }}>
              <li><strong>دابل کلیک روی هر یک از ۸ نقطه:</strong> ایجاد نود جدید در همان جهت و رسم یال متصل به آن نقطه.</li>
              <li><strong>درگ موس بین دو نقطه:</strong> اتصال آزاد و دلخواه هر دو نقطه روی هر دو نود.</li>
              <li><strong>دکمه (X) قرمز روی یال:</strong> هاور روی خط یال و کلیک برای حذف آن (یا زدن کلید Delete).</li>
            </ul>
          </div>

          <div style={{ padding: '10px 14px', background: '#ffffff', border: '2px solid #1A1A1A', borderRadius: '12px', boxShadow: '2px 2px 0px rgba(0,0,0,0.8)' }}>
            <h3 style={{ fontWeight: 800, color: '#4A6B3A', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px', fontSize: '15px' }}>
              <Download size={15} /> خروجی و ذخیره‌سازی
            </h3>
            <ul style={{ paddingRight: '18px', margin: 0, lineHeight: 1.6 }}>
              <li><strong>Export PNG:</strong> دریافت تصویر باکیفیت دست‌کشیده.</li>
              <li><strong>Save / Load:</strong> ذخیره نقشه در فایل JSON و بارگذاری مجدد.</li>
            </ul>
          </div>
        </div>

        {/* Footer */}
        <div style={{ marginTop: '16px', display: 'flex', justifyContent: 'flex-end' }}>
          <button
            onClick={onClose}
            className="sketch-btn sketch-btn-primary"
            style={{ padding: '6px 20px' }}
          >
            متوجه شدم
          </button>
        </div>
      </div>
    </div>
  );
}
