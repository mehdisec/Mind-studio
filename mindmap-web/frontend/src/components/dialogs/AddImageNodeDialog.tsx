import React, { useState } from 'react';
import { Button } from '../common/Button';
import { Image, X, Upload, Link, Star } from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTranslation } from '../../utils/i18n';

interface AddImageNodeDialogProps {
  isOpen: boolean;
  onClose: () => void;
  onAdd: (title: string, imageUrl: string, imageSize: 'small' | 'medium' | 'large', importance: number) => Promise<void> | void;
  initialPos?: { x: number; y: number };
}

export const AddImageNodeDialog: React.FC<AddImageNodeDialogProps> = ({
  isOpen,
  onClose,
  onAdd,
}) => {
  const { language, themeMode } = useSettingsStore();
  const isLight = themeMode === 'light';
  const { t, isRtl } = useTranslation(language);
  const isFa = language === 'fa';

  const [title, setTitle] = useState('');
  const [imageUrl, setImageUrl] = useState('');
  const [imageSize, setImageSize] = useState<'small' | 'medium' | 'large'>('small');
  const [importance, setImportance] = useState(6);
  const [tab, setTab] = useState<'upload' | 'url'>('upload');

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (!title) {
        setTitle(file.name.replace(/\.[^/.]+$/, ''));
      }
      const reader = new FileReader();
      reader.onload = () => {
        setImageUrl(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) {
      alert(isFa ? 'لطفاً یک تصویر انتخاب کنید یا آدرس آن را وارد کنید.' : 'Please select an image or provide a valid URL.');
      return;
    }
    await onAdd(title.trim() || (isFa ? 'نود تصویری' : 'Image Node'), imageUrl, imageSize, importance);
    setTitle('');
    setImageUrl('');
    onClose();
  };

  return (
    <div
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in"
    >
      <div dir={isRtl ? 'rtl' : 'ltr'} className={`${isLight ? 'bg-[#F8FAFD] border-slate-200 text-slate-800 shadow-xl' : 'bg-[#0f172a] border-slate-700 text-slate-100 shadow-2xl'} border rounded-2xl w-full max-w-md overflow-hidden`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isLight ? 'bg-white border-slate-200' : 'bg-slate-900/60 border-slate-800'}`}>
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-cyan-600 flex items-center justify-center text-white shadow-glow-cyan/40">
              <Image className="w-4 h-4" />
            </div>
            <div>
              <h2 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{isFa ? 'افزودن نود تصویری جدید' : 'Add New Image Node'}</h2>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>{isFa ? 'نمایش تصویر با کادر و حاشیه دایره‌ای' : 'Display image with circular frame and border'}</p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form Body */}
        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div className="space-y-1">
            <label className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{isFa ? 'عنوان مفهوم تصویری' : 'Image Concept Title'}</label>
            <input
              type="text"
              required
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={isFa ? 'عنوان نود تصویری...' : 'Image node title...'}
              className={`w-full rounded-xl px-3 py-2 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 ${isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-100'}`}
            />
          </div>

          {/* Tab Selector: File Upload vs URL */}
          <div className={`grid grid-cols-2 gap-1 p-1 rounded-xl border text-xs font-medium ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-900 border-slate-800'}`}>
            <button
              type="button"
              onClick={() => setTab('upload')}
              className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                tab === 'upload' ? 'bg-cyan-600 text-white font-semibold' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Upload className="w-3.5 h-3.5" />
              {isFa ? 'آپلود فایل' : 'Upload File'}
            </button>
            <button
              type="button"
              onClick={() => setTab('url')}
              className={`py-1.5 rounded-lg transition-colors flex items-center justify-center gap-1.5 ${
                tab === 'url' ? 'bg-cyan-600 text-white font-semibold' : isLight ? 'text-slate-600 hover:text-slate-900' : 'text-slate-400 hover:text-slate-200'
              }`}
            >
              <Link className="w-3.5 h-3.5" />
              {isFa ? 'لینک اینترنتی' : 'Image URL'}
            </button>
          </div>

          {tab === 'upload' ? (
            <div className={`border-2 border-dashed rounded-xl p-4 text-center cursor-pointer transition-colors relative ${isLight ? 'border-slate-300 hover:border-cyan-500 bg-white' : 'border-slate-700 hover:border-cyan-500 bg-slate-900/50'}`}>
              <input
                type="file"
                accept="image/*"
                onChange={handleFileUpload}
                className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
              />
              {imageUrl ? (
                <div className="flex flex-col items-center gap-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-400 shadow-md">
                    <img src={imageUrl} alt={isFa ? 'پیش‌نمایش' : 'Preview'} className="w-full h-full object-cover" />
                  </div>
                  <span className="text-[11px] text-cyan-500 font-medium">{isFa ? 'تصویر بارگذاری شد (برای تغییر کلیک کنید)' : 'Image loaded (click to change)'}</span>
                </div>
              ) : (
                <div className="flex flex-col items-center gap-1.5 py-2">
                  <Upload className="w-6 h-6 text-slate-400" />
                  <span className={`text-xs font-medium ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{isFa ? 'انتخاب تصویر از دستگاه' : 'Choose image from device'}</span>
                  <span className={`text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-500'}`}>{isFa ? 'PNG, JPG, WEBP یا GIF' : 'PNG, JPG, WEBP, or GIF'}</span>
                </div>
              )}
            </div>
          ) : (
            <div className="space-y-1">
              <input
                type="url"
                value={imageUrl}
                onChange={(e) => setImageUrl(e.target.value)}
                placeholder="https://example.com/image.png"
                className={`w-full rounded-xl px-3 py-2 text-xs font-mono focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 ${isLight ? 'bg-white border-slate-300 text-slate-800' : 'bg-slate-900 border-slate-700 text-slate-100'}`}
              />
              {imageUrl && (
                <div className="flex justify-center pt-2">
                  <div className="w-16 h-16 rounded-full overflow-hidden border-2 border-cyan-400 shadow-md">
                    <img src={imageUrl} alt="پیش‌نمایش" className="w-full h-full object-cover" />
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Size Selector */}
          <div className="space-y-1">
            <label className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{isFa ? 'اندازه دایره تصویر' : 'Image Circle Size'}</label>
            <div className="grid grid-cols-3 gap-2">
              {(['small', 'medium', 'large'] as const).map((s) => (
                <button
                  key={s}
                  type="button"
                  onClick={() => setImageSize(s)}
                  className={`py-1.5 text-xs rounded-xl border transition-all ${
                    imageSize === s
                      ? isLight ? 'bg-cyan-100 border-cyan-500 text-cyan-800 font-bold shadow-sm' : 'bg-cyan-950/80 border-cyan-500 text-cyan-300 font-bold shadow-sm'
                      : isLight ? 'bg-white border-slate-200 text-slate-600 hover:border-slate-300' : 'bg-slate-900 border-slate-800 text-slate-400 hover:border-slate-700'
                  }`}
                >
                  {s === 'small' ? (isFa ? 'کوچک (1x)' : 'Small (1x)') : s === 'medium' ? (isFa ? 'متوسط (2x)' : 'Medium (2x)') : (isFa ? 'بزرگ (3x)' : 'Large (3x)')}
                </button>
              ))}
            </div>
          </div>

          {/* Importance */}
          <div className="space-y-1">
            <div className={`flex items-center justify-between text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              <span>{isFa ? 'اهمیت نود:' : 'Node Importance:'}</span>
              <span className="text-amber-500 font-bold">{importance}/10</span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={importance}
              onChange={(e) => setImportance(parseInt(e.target.value, 10))}
              className={`w-full h-2 rounded-lg appearance-none cursor-pointer accent-cyan-500 ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}
            />
          </div>

          {/* Submit */}
          <div className="flex items-center justify-end gap-2 pt-2">
            <Button variant="ghost" size="sm" onClick={onClose} type="button">
              {isFa ? 'انصراف' : 'Cancel'}
            </Button>
            <Button variant="cyber" size="sm" type="submit">
              {isFa ? 'افزودن نود تصویری' : 'Add Image Node'}
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
