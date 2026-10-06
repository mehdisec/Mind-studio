import React, { useState, useRef } from 'react';
import {
  useSettingsStore,
  DARK_BACKGROUND_IMAGES,
  LIGHT_BACKGROUND_IMAGES,
} from '../../stores/useSettingsStore';
import { useTranslation } from '../../utils/i18n';
import {
  Image as ImageIcon,
  Palette,
  Upload,
  Check,
  Grid,
  Sparkles,
  Link as LinkIcon,
  Sliders,
  X,
} from 'lucide-react';

interface BackgroundSelectorPopoverProps {
  isOpen: boolean;
  onClose: () => void;
  anchorClassName?: string;
}

const SOLID_PRESETS = [
  { label: 'خاکستری مدرن دیفالت (Modern Slate Gray)', labelEn: 'Modern Slate Gray (Default)', color: '#E2E8F0', border: '#94a3b8' },
  { label: 'خاکستری سرد (Cool Gray)', labelEn: 'Cool Gray', color: '#E5E7EB', border: '#9ca3af' },
  { label: 'خاکستری نقره‌ای (Silver Light)', labelEn: 'Silver Light', color: '#F1F5F9', border: '#cbd5e1' },
  { label: 'آبی ناوی (Navy Blue)', labelEn: 'Navy Blue', color: '#0B1E38', border: '#38bdf8' },
  { label: 'استودیو تاریک', labelEn: 'Studio Dark', color: '#0B0F19', border: '#1e293b' },
  { label: 'مشکی خالص', labelEn: 'Pure Black', color: '#000000', border: '#333333' },
  { label: 'سرمه‌ای عمیق', labelEn: 'Deep Slate Navy', color: '#0f172a', border: '#1e293b' },
  { label: 'آبی کبالت', labelEn: 'Cobalt Blue', color: '#172554', border: '#1d4ed8' },
  { label: 'سبز یشمی', labelEn: 'Emerald Forest', color: '#022c22', border: '#065f46' },
  { label: 'بنفش سلطنتی', labelEn: 'Royal Purple', color: '#2e1065', border: '#581c87' },
  { label: 'زغالی گرافیت', labelEn: 'Graphite Zinc', color: '#18181b', border: '#27272a' },
  { label: 'سفید صدفی', labelEn: 'Pearl White', color: '#f8fafc', border: '#e2e8f0' },
  { label: 'سفید خالص', labelEn: 'Pure White', color: '#ffffff', border: '#cbd5e1' },
];

export const BackgroundSelectorPopover: React.FC<BackgroundSelectorPopoverProps> = ({
  isOpen,
  onClose,
  anchorClassName = 'bottom-full mb-2',
}) => {
  const {
    canvasBackground,
    setCanvasBackground,
    customBackgroundImage,
    setCustomBackgroundImage,
    customBackgroundColor,
    setCustomBackgroundColor,
    backgroundOverlayOpacity,
    setBackgroundOverlayOpacity,
    showBackgroundGrid,
    setShowBackgroundGrid,
    language,
    themeMode,
  } = useSettingsStore();

  const { isRtl } = useTranslation(language);
  const isLight = themeMode === 'light';
  const isFa = language === 'fa';

  const [activeTab, setActiveTab] = useState<'image' | 'solid' | 'preset'>(() => {
    if (canvasBackground === 'solid') return 'solid';
    if (canvasBackground === 'image' || canvasBackground === 'nebula') return 'image';
    return 'preset';
  });

  const [urlInput, setUrlInput] = useState('');
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  if (!isOpen) return null;

  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      if (dataUrl) {
        setCustomBackgroundImage(dataUrl);
      }
    };
    reader.readAsDataURL(file);
  };

  const handleApplyUrl = (e: React.FormEvent) => {
    e.preventDefault();
    if (!urlInput.trim()) return;
    setCustomBackgroundImage(urlInput.trim());
    setUrlInput('');
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`absolute ${anchorClassName} left-0 w-80 sm:w-96 rounded-2xl border shadow-2xl p-3.5 z-50 animate-in fade-in zoom-in-95 duration-150 backdrop-blur-xl ${isLight
          ? 'bg-white/95 border-slate-300 text-slate-900 shadow-slate-400/40'
          : 'bg-[#0f172a]/95 border-slate-700 text-slate-100 shadow-black/90'
        }`}
      onClick={(e) => e.stopPropagation()}
    >
      {/* Header */}
      <div className={`flex items-center justify-between pb-2 border-b mb-3 ${isLight ? 'border-slate-200' : 'border-slate-700/50'
        }`}>
        <div className="flex items-center gap-2">
          <Palette className="w-4 h-4 text-cyan-500" />
          <span className="text-xs font-bold">{isFa ? 'تنظیم پس‌زمینه بوم گراف' : 'Canvas Background Settings'}</span>
        </div>
        <button
          onClick={onClose}
          className={`p-1 rounded-lg transition-colors ${isLight
              ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
        >
          <X className="w-3.5 h-3.5" />
        </button>
      </div>

      {/* Tabs */}
      <div className={`flex items-center gap-1 p-1 rounded-xl mb-3 border ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-slate-950/40 border-slate-800/60'
        }`}>
        <button
          type="button"
          onClick={() => {
            setActiveTab('image');
            if (canvasBackground !== 'image' && canvasBackground !== 'nebula') {
              setCanvasBackground('image');
            }
          }}
          className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === 'image'
              ? 'bg-cyan-600 text-white shadow-sm'
              : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <ImageIcon className="w-3.5 h-3.5" />
          <span>{isFa ? 'تصویر' : 'Image'}</span>
        </button>
        <button
          type="button"
          onClick={() => {
            setActiveTab('solid');
            if (canvasBackground !== 'solid') {
              setCanvasBackground('solid');
            }
          }}
          className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === 'solid'
              ? 'bg-cyan-600 text-white shadow-sm'
              : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <Palette className="w-3.5 h-3.5" />
          <span>{isFa ? 'رنگ ثابت' : 'Solid Color'}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('preset')}
          className={`flex-1 py-1.5 px-2 text-xs font-semibold rounded-lg flex items-center justify-center gap-1.5 transition-all ${activeTab === 'preset'
              ? 'bg-cyan-600 text-white shadow-sm'
              : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>{isFa ? 'طرح‌ها' : 'Patterns'}</span>
        </button>
      </div>

      {/* Tab 1: Image Mode */}
      {activeTab === 'image' && (
        <div className="space-y-3">
          {/* Header indicator for current mode images */}
          <div className="flex items-center justify-between text-[11px] font-semibold">
            <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>
              {isLight ? (isFa ? 'پس‌زمینه‌های حالت روشن (Light Mode):' : 'Light Mode Backgrounds:') : (isFa ? 'پس‌زمینه‌های حالت دارک (Dark Mode):' : 'Dark Mode Backgrounds:')}
            </span>
            <span className="text-[10px] text-cyan-500 font-mono">
              {isLight ? 'white_2, White_1, white_3' : 'Black_1, Black_2, Black_3'}
            </span>
          </div>

          {/* 3 Backgrounds filtered by active themeMode */}
          <div className="grid grid-cols-3 gap-2">
            {(isLight ? LIGHT_BACKGROUND_IMAGES : DARK_BACKGROUND_IMAGES).map((bgItem, idx) => {
              const isSelected =
                (canvasBackground === 'image' || canvasBackground === 'nebula') &&
                customBackgroundImage === bgItem.path;

              return (
                <button
                  key={bgItem.id}
                  type="button"
                  title={isFa ? bgItem.label : bgItem.labelEn}
                  onClick={() => {
                    setCustomBackgroundImage(bgItem.path);
                    setCanvasBackground('image');
                  }}
                  className={`relative rounded-xl p-1.5 border text-center transition-all flex flex-col items-center gap-1.5 cursor-pointer group ${
                    isSelected
                      ? isLight
                        ? 'border-sky-500 bg-sky-50 text-sky-950 shadow-md ring-2 ring-sky-400'
                        : 'border-cyan-500 bg-cyan-950/70 text-cyan-300 shadow-glow-cyan/20 ring-2 ring-cyan-500'
                      : isLight
                      ? 'border-slate-200 bg-white hover:border-sky-300 text-slate-700 hover:bg-slate-50'
                      : 'border-slate-800 bg-slate-900/60 hover:border-slate-700 text-slate-300 hover:bg-slate-800/80'
                  }`}
                >
                  <div
                    className="w-full h-16 rounded-lg bg-cover bg-center border border-slate-700/40 relative overflow-hidden shadow-inner group-hover:scale-[1.02] transition-transform"
                    style={{ backgroundImage: `url(${bgItem.path})` }}
                  >
                    {idx === 0 && (
                      <span className="absolute top-1 right-1 text-[9px] font-bold px-1.5 py-0.5 rounded-md bg-amber-500/90 text-white shadow-sm">
                        {isFa ? 'پیش‌فرض' : 'Default'}
                      </span>
                    )}
                    {isSelected && (
                      <div className="absolute inset-0 bg-cyan-500/20 backdrop-blur-[1px] flex items-center justify-center">
                        <div className="w-5 h-5 rounded-full bg-cyan-500 text-white flex items-center justify-center shadow-md">
                          <Check className="w-3.5 h-3.5" />
                        </div>
                      </div>
                    )}
                  </div>
                  <span className="text-[11px] font-semibold truncate w-full text-center">
                    {bgItem.filename}
                  </span>
                </button>
              );
            })}
          </div>

          {/* Upload Custom File from Computer */}
          <div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleFileUpload}
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="w-full py-2 px-3 border border-dashed border-cyan-500/60 hover:border-cyan-400 bg-cyan-950/20 hover:bg-cyan-900/30 rounded-xl text-xs font-medium text-cyan-300 flex items-center justify-center gap-2 transition-all cursor-pointer"
            >
              <Upload className="w-4 h-4" />
              <span>{isFa ? 'انتخاب تصویر از کامپیوتر...' : 'Choose image from device...'}</span>
            </button>
          </div>

          {/* Image URL Form */}
          <form onSubmit={handleApplyUrl} className="flex items-center gap-1.5">
            <div className="relative flex-1">
              <input
                type="url"
                value={urlInput}
                onChange={(e) => setUrlInput(e.target.value)}
                placeholder={isFa ? 'یا نشانی اینترنتی تصویر (URL)...' : 'Or image URL...'}
                className="w-full h-8 bg-slate-950/60 border border-slate-700 rounded-lg px-2.5 text-xs text-slate-200 placeholder-slate-500 focus:outline-none focus:border-cyan-500"
              />
            </div>
            <button
              type="submit"
              className="h-8 px-3 rounded-lg bg-cyan-600 hover:bg-cyan-500 text-white text-xs font-medium shrink-0 flex items-center gap-1 cursor-pointer"
            >
              <LinkIcon className="w-3 h-3" />
              <span>{isFa ? 'اعمال' : 'Apply'}</span>
            </button>
          </form>

          {/* Dimming Overlay Slider */}
          {!isLight ? (
            <div className="pt-2 border-t border-slate-800">
              <div className="flex items-center justify-between text-[11px] text-slate-400 mb-1">
                <span className="flex items-center gap-1">
                  <Sliders className="w-3 h-3 text-cyan-400" />
                  {isFa ? 'میزان تیرگی لایه روی تصویر' : 'Image Overlay Dimming'}
                </span>
                <span className="font-mono text-cyan-400">
                  {Math.round(backgroundOverlayOpacity * 100)}%
                </span>
              </div>
              <input
                type="range"
                min={0.05}
                max={0.9}
                step={0.05}
                value={backgroundOverlayOpacity}
                onChange={(e) => setBackgroundOverlayOpacity(parseFloat(e.target.value))}
                className="w-full h-1 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-cyan-500"
              />
            </div>
          ) : (
            <div className="pt-2 border-t border-slate-200 text-center">
              <span className="text-[11px] text-emerald-600 font-medium flex items-center justify-center gap-1">
                <Check className="w-3.5 h-3.5" />
                {isFa ? 'لایه اضافی روی تصویر کاملاً شفاف (Transparent) است' : 'Image overlay is completely transparent'}
              </span>
            </div>
          )}
        </div>
      )}

      {/* Tab 2: Solid Color Mode */}
      {activeTab === 'solid' && (
        <div className="space-y-3">
          {/* Swatches Grid */}
          <div className="grid grid-cols-5 gap-2">
            {SOLID_PRESETS.map((p) => {
              const isSelected =
                canvasBackground === 'solid' &&
                customBackgroundColor.toLowerCase() === p.color.toLowerCase();

              return (
                <button
                  key={p.color}
                  type="button"
                  title={isFa ? p.label : p.labelEn}
                  onClick={() => {
                    setCustomBackgroundColor(p.color);
                    setCanvasBackground('solid');
                  }}
                  className={`h-8 rounded-lg relative flex items-center justify-center transition-transform hover:scale-105 cursor-pointer ${isSelected ? 'ring-2 ring-cyan-400 ring-offset-2 ring-offset-slate-900' : ''
                    }`}
                  style={{
                    backgroundColor: p.color,
                    border: `1px solid ${p.border}`,
                  }}
                >
                  {isSelected && (
                    <Check
                      className={`w-3.5 h-3.5 ${p.color === '#ffffff' || p.color === '#f8fafc' || p.color === '#f1f5f9'
                          ? 'text-slate-900'
                          : 'text-cyan-400'
                        }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          {/* Custom Color Picker & Hex Input */}
          <div className="flex items-center gap-2 p-2 bg-slate-950/60 rounded-xl border border-slate-800">
            <input
              type="color"
              value={customBackgroundColor.startsWith('#') ? customBackgroundColor : '#0B0F19'}
              onChange={(e) => {
                setCustomBackgroundColor(e.target.value);
                setCanvasBackground('solid');
              }}
              className="w-7 h-7 rounded cursor-pointer border-0 bg-transparent p-0"
              title={isFa ? 'انتخابگر آزاد رنگ' : 'Color Picker'}
            />
            <div className="flex-1">
              <span className="text-[10px] text-slate-400 block">{isFa ? 'کد هگز رنگ ثابت:' : 'Solid color hex:'}</span>
              <input
                type="text"
                value={customBackgroundColor}
                onChange={(e) => {
                  setCustomBackgroundColor(e.target.value);
                  setCanvasBackground('solid');
                }}
                className="w-full bg-transparent text-xs font-mono text-cyan-300 focus:outline-none"
                placeholder="#0B0F19"
              />
            </div>
          </div>
        </div>
      )}

      {/* Tab 3: Preset Textures */}
      {activeTab === 'preset' && (
        <div className="grid grid-cols-2 gap-2">
          <button
            onClick={() => setCanvasBackground('grid')}
            className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-start gap-1 transition-all cursor-pointer ${canvasBackground === 'grid'
                ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
          >
            <span className="font-bold">{isFa ? 'شبکه شطرنجی (Grid)' : 'Grid'}</span>
            <span className="text-[10px] text-slate-400">{isFa ? 'گرید مهندسی خطی' : 'Linear engineering grid'}</span>
          </button>

          <button
            onClick={() => setCanvasBackground('dots')}
            className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-start gap-1 transition-all cursor-pointer ${canvasBackground === 'dots'
                ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
          >
            <span className="font-bold">{isFa ? 'ماتریس نقاط (Dots)' : 'Dot Matrix'}</span>
            <span className="text-[10px] text-slate-400">{isFa ? 'نقاط دیجیتال مدرن' : 'Modern digital dots'}</span>
          </button>

          <button
            onClick={() => setCanvasBackground('obsidian')}
            className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-start gap-1 transition-all cursor-pointer ${canvasBackground === 'obsidian'
                ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
          >
            <span className="font-bold">{isFa ? 'آبسیدین (Obsidian)' : 'Obsidian'}</span>
            <span className="text-[10px] text-slate-400">{isFa ? 'گرادیان رادیال تاریک' : 'Dark radial gradient'}</span>
          </button>

          <button
            onClick={() => setCanvasBackground('nebula')}
            className={`p-2.5 rounded-xl border text-xs font-medium flex flex-col items-start gap-1 transition-all cursor-pointer ${canvasBackground === 'nebula'
                ? 'border-cyan-500 bg-cyan-950/40 text-cyan-300'
                : 'border-slate-800 bg-slate-900/60 text-slate-300 hover:border-slate-700'
              }`}
          >
            <span className="font-bold">{isFa ? 'کیهانی نِبولا' : 'Cosmic Nebula'}</span>
            <span className="text-[10px] text-slate-400">{isFa ? 'ستارگان و ژرفای کهکشان' : 'Stars & deep galaxy'}</span>
          </button>
        </div>
      )}

      {/* Grid Overlay Toggle Footer */}
      <div className="pt-2.5 mt-2.5 border-t border-slate-800 flex items-center justify-between">
        <label className="flex items-center gap-2 cursor-pointer text-xs text-slate-300 select-none">
          <input
            type="checkbox"
            checked={showBackgroundGrid}
            onChange={(e) => setShowBackgroundGrid(e.target.checked)}
            className="rounded border-slate-700 bg-slate-900 text-cyan-500 focus:ring-0 cursor-pointer"
          />
          <span className="flex items-center gap-1.5">
            <Grid className="w-3.5 h-3.5 text-cyan-400" />
            {isFa ? 'نمایش شبکه نقاط روی بوم' : 'Show dot grid on canvas'}
          </span>
        </label>
        <span
          className="text-[10px] font-mono px-1.5 py-0.5 rounded bg-slate-800 text-slate-400 uppercase"
        >
          {canvasBackground}
        </span>
      </div>
    </div>
  );
};
