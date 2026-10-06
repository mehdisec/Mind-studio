import React, { useState } from 'react';
import { useGraphStore } from '../../stores/useGraphStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTranslation } from '../../utils/i18n';
import { Button } from '../common/Button';
import { Plus, X, Brain, Tag } from 'lucide-react';

interface QuickCaptureModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const QuickCaptureModal: React.FC<QuickCaptureModalProps> = ({
  isOpen,
  onClose,
}) => {
  const { addNode, pages, activePageId, setActivePageId } = useGraphStore();
  const { language, themeMode } = useSettingsStore();
  const { t, isRtl } = useTranslation(language);
  const isLight = themeMode === 'light';
  const isFa = language === 'fa';

  const [thoughtText, setThoughtText] = useState('');
  const [importance, setImportance] = useState(7);
  const [tagInput, setTagInput] = useState('');
  const [targetPageId, setTargetPageId] = useState(activePageId || '');

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thoughtText.trim()) return;

    if (targetPageId && targetPageId !== activePageId) {
      await setActivePageId(targetPageId);
    }

    const tags = tagInput
      .split(',')
      .map((t) => t.trim().replace(/^#/, ''))
      .filter(Boolean);

    // Random initial offset around center
    const posX = (Math.random() - 0.5) * 300;
    const posY = (Math.random() - 0.5) * 200;

    await addNode(thoughtText.trim(), importance, '', posX, posY, tags.length > 0 ? tags : undefined);
    setThoughtText('');
    setTagInput('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fadeIn">
      <div
        dir={isRtl ? 'rtl' : 'ltr'}
        className={`w-full max-w-lg rounded-2xl border shadow-2xl p-5 space-y-4 ${
          isLight
            ? 'bg-white border-slate-300 text-slate-900'
            : 'bg-[#0F172A] border-slate-700/90 text-slate-100'
        }`}
      >
        {/* Header */}
        <div className={`flex items-center justify-between pb-3 border-b ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`w-8 h-8 rounded-xl flex items-center justify-center ${isLight ? 'bg-cyan-100 text-cyan-700 border border-cyan-200' : 'bg-cyan-600/20 border border-cyan-500/40 text-cyan-400'}`}>
              <Brain className="w-4 h-4" />
            </div>
            <div>
              <h3 className={`text-sm font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{t.quickCaptureBtn}</h3>
              <p className={`text-[11px] ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isFa ? 'ثبت آنی گزاره یا ایده ذهنی بر روی بوم گراف' : 'Instantly capture thoughts & concepts on canvas'}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-100' : 'text-slate-400 hover:text-white hover:bg-slate-800'}`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="space-y-1.5">
            <label className={`text-xs font-semibold ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
              {isFa ? 'متن ایده یا گزاره مفهومی:' : 'Thought text or concept statement:'}
            </label>
            <textarea
              autoFocus
              rows={3}
              value={thoughtText}
              onChange={(e) => setThoughtText(e.target.value)}
              placeholder={t.quickInputPlaceholder}
              className={`w-full rounded-xl p-3 text-xs focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500 resize-none ${isLight ? 'bg-slate-50 border border-slate-300 text-slate-800 placeholder-slate-400' : 'bg-slate-950 border border-slate-700 text-slate-100 placeholder-slate-500'}`}
            />
          </div>

          {/* Importance Slider */}
          <div className="space-y-1.5">
            <div className="flex items-center justify-between text-xs">
              <span className={isLight ? 'text-slate-700' : 'text-slate-300'}>{t.importanceLabel}</span>
              <span className={`font-mono font-bold px-2 py-0.5 rounded border ${isLight ? 'text-amber-800 bg-amber-100 border-amber-300' : 'text-amber-400 bg-amber-500/10 border-amber-500/20'}`}>
                ★ {importance} / 10
              </span>
            </div>
            <input
              type="range"
              min={1}
              max={10}
              value={importance}
              onChange={(e) => setImportance(parseInt(e.target.value, 10))}
              className={`w-full h-1.5 rounded-lg appearance-none cursor-pointer accent-cyan-500 ${isLight ? 'bg-slate-200' : 'bg-slate-700'}`}
            />
          </div>

          <div className="grid grid-cols-2 gap-3">
            {/* Target Page */}
            <div className="space-y-1">
              <label className={`text-xs ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>{isFa ? 'صفحه مقصد:' : 'Destination page:'}</label>
              <select
                value={targetPageId}
                onChange={(e) => setTargetPageId(e.target.value)}
                className={`w-full h-9 rounded-xl px-2.5 text-xs focus:outline-none focus:border-cyan-500 ${isLight ? 'bg-white border border-slate-300 text-slate-800' : 'bg-slate-950 border border-slate-700 text-slate-200'}`}
              >
                {pages.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.title}
                  </option>
                ))}
              </select>
            </div>

            {/* Tags */}
            <div className="space-y-1">
              <label className={`text-xs flex items-center gap-1 ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                <Tag className="w-3 h-3 text-cyan-500" />
                <span>{isFa ? 'برچسب‌ها (با کاما):' : 'Tags (comma separated):'}</span>
              </label>
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                placeholder={isFa ? 'مثال: ایده, هوش, هدف' : 'e.g. idea, ai, goal'}
                className={`w-full h-9 rounded-xl px-3 text-xs focus:outline-none focus:border-cyan-500 ${isLight ? 'bg-white border border-slate-300 text-slate-800' : 'bg-slate-950 border border-slate-700 text-slate-200'}`}
              />
            </div>
          </div>

          {/* Action Buttons */}
          <div className={`flex items-center justify-end gap-2 pt-2 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
            <button
              type="button"
              onClick={onClose}
              className={`px-4 py-2 text-xs rounded-xl transition-colors ${isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
            >
              {t.cancelBtn}
            </button>
            <Button
              type="submit"
              variant="cyber"
              size="sm"
              disabled={!thoughtText.trim()}
              className="gap-2 shadow-glow-cyan/20 px-5"
            >
              <Plus className="w-4 h-4" />
              <span>{t.addNodeBtn}</span>
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
};
