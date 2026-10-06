import React, { useState } from 'react';
import { PageMode } from '../../types';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTranslation } from '../../utils/i18n';
import {
  Brain,
  PencilRuler,
  Plus,
  X,
  Sparkles,
  Layers,
  ArrowRight,
  GitFork,
  CheckCircle2,
} from 'lucide-react';

interface CreatePageModalProps {
  isOpen: boolean;
  onClose: () => void;
  onCreate: (title: string, mode: PageMode, diagramType?: string) => Promise<void>;
  currentPageCount: number;
}

export const CreatePageModal: React.FC<CreatePageModalProps> = ({
  isOpen,
  onClose,
  onCreate,
  currentPageCount,
}) => {
  const { language, themeMode } = useSettingsStore();
  const { isRtl } = useTranslation(language);
  const isLight = themeMode === 'light';
  const isFa = language === 'fa';

  const [selectedMode, setSelectedMode] = useState<PageMode>('mindmap');
  const [title, setTitle] = useState('');
  const [selectedDiagramTemplate, setSelectedDiagramTemplate] = useState<string>('pastel-mindmap');
  const [isSubmitting, setIsSubmitting] = useState(false);

  if (!isOpen) return null;

  const defaultTitle =
    selectedMode === 'diagram'
      ? isFa
        ? `دیاگرام ${currentPageCount + 1}`
        : `Diagram ${currentPageCount + 1}`
      : isFa
      ? `نقشه ذهنی ${currentPageCount + 1}`
      : `Mind Map ${currentPageCount + 1}`;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    try {
      const finalTitle = title.trim() || defaultTitle;
      await onCreate(finalTitle, selectedMode, selectedDiagramTemplate);
      onClose();
    } catch (err) {
      console.error('Create page error:', err);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-md animate-in fade-in duration-200"
      dir={isRtl ? 'rtl' : 'ltr'}
      onClick={onClose}
    >
      <div
        className={`w-full max-w-xl rounded-3xl border shadow-2xl p-5 sm:p-6 space-y-5 transition-all ${
          isLight
            ? 'bg-white border-slate-200 text-slate-900 shadow-[0_20px_60px_rgba(0,0,0,0.15)]'
            : 'bg-[#0f172a] border-slate-700 text-slate-100 shadow-[0_20px_60px_rgba(0,0,0,0.8)]'
        }`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-slate-200 dark:border-slate-800">
          <div className="flex items-center gap-2.5">
            <div className="w-9 h-9 rounded-2xl bg-sky-500/15 border border-sky-500/30 flex items-center justify-center text-sky-500 shadow-sm">
              <Plus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base font-bold">
                {isFa ? 'ایجاد صفحه جدید' : 'Create New Page'}
              </h2>
              <p className="text-xs text-slate-400">
                {isFa
                  ? 'ماهیت و نوع صفحه خود را انتخاب نمایید (پس از ایجاد غیرقابل تغییر است)'
                  : 'Choose the type of page (permanent once created)'}
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-200 rounded-xl hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Mode Selection Cards */}
          <div className="space-y-2">
            <label className="text-xs font-semibold text-slate-400">
              {isFa ? 'انتخاب ماهیت صفحه:' : 'Select Page Type:'}
            </label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {/* Option 1: Mind Map */}
              <div
                onClick={() => setSelectedMode('mindmap')}
                className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                  selectedMode === 'mindmap'
                    ? isLight
                      ? 'border-sky-500 bg-sky-50/70 shadow-md ring-1 ring-sky-500'
                      : 'border-cyan-500 bg-cyan-950/30 shadow-lg ring-1 ring-cyan-500'
                    : isLight
                    ? 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-sky-500 to-indigo-600 text-white flex items-center justify-center shadow-md">
                    <Brain className="w-5 h-5" />
                  </div>
                  {selectedMode === 'mindmap' && (
                    <CheckCircle2 className="w-5 h-5 text-sky-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    {isFa ? 'نقشه ذهنی (Mind Map)' : 'Mind Map'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {isFa
                      ? 'گراف فیزیکی گرانش صفر تعاملی با تحلیل هوش مصنوعی، سوالات سقراطی و رودمپ اجرایی.'
                      : 'Zero-gravity interactive physics graph with Gemini AI deep-dive & roadmaps.'}
                  </p>
                </div>
              </div>

              {/* Option 2: Manual Diagram */}
              <div
                onClick={() => setSelectedMode('diagram')}
                className={`relative p-3.5 rounded-2xl border-2 cursor-pointer transition-all flex flex-col justify-between gap-3 ${
                  selectedMode === 'diagram'
                    ? isLight
                      ? 'border-amber-500 bg-amber-50/70 shadow-md ring-1 ring-amber-500'
                      : 'border-amber-500 bg-amber-950/30 shadow-lg ring-1 ring-amber-500'
                    : isLight
                    ? 'border-slate-200 bg-slate-50/60 hover:border-slate-300'
                    : 'border-slate-800 bg-slate-900/60 hover:border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between">
                  <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-amber-500 to-orange-600 text-white flex items-center justify-center shadow-md">
                    <PencilRuler className="w-5 h-5" />
                  </div>
                  {selectedMode === 'diagram' && (
                    <CheckCircle2 className="w-5 h-5 text-amber-500" />
                  )}
                </div>
                <div>
                  <h3 className="text-sm font-bold flex items-center gap-1.5">
                    {isFa ? 'رسم دیاگرام منوال (Diagram)' : 'Manual Diagram'}
                  </h3>
                  <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                    {isFa
                      ? 'بوم طراحی دستی دست‌ساز با تمپلیت‌های مایل‌استون، فلوچارت، چارت سازمانی و نقشه پاستلی.'
                      : 'Hand-drawn sketch canvas with milestone journey, org chart, flowcharts & pastel maps.'}
                  </p>
                </div>
              </div>
            </div>
          </div>

          {/* Diagram Template Selector (if diagram mode is selected) */}
          {selectedMode === 'diagram' && (
            <div className="space-y-1.5 animate-in fade-in duration-150">
              <label className="text-xs font-semibold text-slate-400">
                {isFa ? 'قالب اولیه دیاگرام:' : 'Initial Diagram Template:'}
              </label>
              <select
                value={selectedDiagramTemplate}
                onChange={(e) => setSelectedDiagramTemplate(e.target.value)}
                className={`w-full h-10 px-3 rounded-xl border text-xs font-medium focus:outline-none transition-colors ${
                  isLight
                    ? 'bg-slate-50 border-slate-300 text-slate-800 focus:border-amber-500'
                    : 'bg-slate-900 border-slate-700 text-slate-200 focus:border-amber-500'
                }`}
              >
                <option value="pastel-mindmap">
                  🎨 {isFa ? 'مایند مپ ارگانیک و پاستلی دست‌ساز (Pastel Organic Mind Map)' : 'Pastel Organic Mind Map'}
                </option>
                <option value="milestone-plane">
                  ✈️ {isFa ? 'مسیر مایل‌استون موشک کاغذی (Milestone Plane Journey)' : 'Milestone Plane Journey'}
                </option>
                <option value="corporate-org">
                  🏢 {isFa ? 'نمودار سازمانی و ساختار شرکت (Corporate Org Chart)' : 'Corporate Org Chart'}
                </option>
                <option value="flowchart-sketch">
                  📐 {isFa ? 'فلوچارت فرآیند و تصمیم‌گیری (Flowchart Sketch)' : 'Flowchart Sketch'}
                </option>
                <option value="mindmap-sketch">
                  🧠 {isFa ? 'مایند مپ کلاسیک دست‌کشیده (Classic Mindmap Sketch)' : 'Classic Mindmap Sketch'}
                </option>
              </select>
            </div>
          )}

          {/* Title Input */}
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-slate-400">
              {isFa ? 'عنوان صفحه:' : 'Page Title:'}
            </label>
            <input
              type="text"
              autoFocus
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder={defaultTitle}
              className={`w-full h-10 px-3.5 rounded-xl border text-xs font-medium focus:outline-none transition-all ${
                isLight
                  ? 'bg-slate-50 border-slate-300 text-slate-900 focus:border-sky-500 focus:bg-white'
                  : 'bg-slate-900 border-slate-700 text-slate-100 focus:border-cyan-500 focus:bg-slate-950'
              }`}
            />
          </div>

          {/* Footer Actions */}
          <div className="flex items-center justify-end gap-2.5 pt-3 border-t border-slate-200 dark:border-slate-800">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-xs font-semibold rounded-xl text-slate-400 hover:text-slate-200 hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
            >
              {isFa ? 'انصراف' : 'Cancel'}
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className={`px-5 py-2 text-xs font-bold rounded-xl text-white shadow-md flex items-center gap-1.5 transition-all ${
                selectedMode === 'diagram'
                  ? 'bg-amber-600 hover:bg-amber-500 shadow-amber-600/25'
                  : 'bg-sky-600 hover:bg-sky-500 shadow-sky-600/25'
              }`}
            >
              <Plus className="w-4 h-4 stroke-[2.5]" />
              <span>{isFa ? 'ایجاد صفحه' : 'Create Page'}</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
