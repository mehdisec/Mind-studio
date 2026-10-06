import React, { useState, useRef } from 'react';
import { Plus, Sparkles, SlidersHorizontal } from 'lucide-react';
import { useGraphStore } from '../../stores/useGraphStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTranslation } from '../../utils/i18n';

export const QuickAddNodeDock: React.FC = () => {
  const { addNode } = useGraphStore();
  const { language, themeMode } = useSettingsStore();
  const { t, isRtl } = useTranslation(language);
  const isLight = themeMode === 'light';

  const [thoughtText, setThoughtText] = useState('');
  const [importance, setImportance] = useState(7);
  const [showImportanceSlider, setShowImportanceSlider] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const handleAddThought = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!thoughtText.trim()) return;

    // Random initial offset around center of the canvas
    const posX = (Math.random() - 0.5) * 320;
    const posY = (Math.random() - 0.5) * 220;

    await addNode(thoughtText.trim(), importance, '', posX, posY);
    setThoughtText('');
    inputRef.current?.focus();
  };

  const getImportanceColor = (val: number) => {
    if (val >= 8) return 'text-rose-400 bg-rose-500/10 border-rose-500/30';
    if (val >= 5) return 'text-amber-400 bg-amber-500/10 border-amber-500/30';
    return 'text-emerald-400 bg-emerald-500/10 border-emerald-500/30';
  };

  return (
    <div
      dir={isRtl ? 'rtl' : 'ltr'}
      className="absolute bottom-5 left-0 right-0 mx-auto z-20 pointer-events-auto w-[94%] sm:w-[520px] max-w-xl"
    >
      <form
        onSubmit={handleAddThought}
        className={`flex items-center gap-2 p-1.5 sm:p-2 rounded-2xl border backdrop-blur-xl transition-all shadow-2xl ${
          isLight
            ? 'bg-white/92 border-slate-200/90 text-slate-900 shadow-[0_12px_36px_-6px_rgba(0,0,0,0.14)] focus-within:border-sky-400 focus-within:shadow-[0_14px_40px_-4px_rgba(14,165,233,0.18)]'
            : 'bg-[#0a0f1d]/90 border-slate-700/70 text-slate-100 shadow-[0_14px_40px_-6px_rgba(0,0,0,0.7)] focus-within:border-cyan-500/70 focus-within:shadow-[0_14px_40px_-4px_rgba(6,182,212,0.22)]'
        }`}
      >
        {/* Glow / Icon Accent */}
        <div
          className={`flex items-center justify-center w-8 h-8 rounded-xl shrink-0 transition-colors ${
            isLight
              ? 'bg-sky-50 text-sky-600 border border-sky-200/60'
              : 'bg-cyan-950/60 text-cyan-400 border border-cyan-800/40'
          }`}
        >
          <Sparkles className="w-4 h-4 animate-pulse" />
        </div>

        {/* Input Field */}
        <div className="relative flex-1 min-w-0">
          <input
            ref={inputRef}
            type="text"
            value={thoughtText}
            onChange={(e) => setThoughtText(e.target.value)}
            placeholder={t.quickInputPlaceholder}
            className={`w-full h-8 sm:h-9 bg-transparent px-1.5 sm:px-2 text-xs sm:text-sm font-medium focus:outline-none transition-colors ${
              isLight
                ? 'text-slate-800 placeholder-slate-400'
                : 'text-slate-100 placeholder-slate-500'
            }`}
          />
        </div>

        {/* Importance Control */}
        <div className="relative shrink-0 flex items-center">
          <button
            type="button"
            onClick={() => setShowImportanceSlider(!showImportanceSlider)}
            className={`flex items-center gap-1.5 h-8 px-2 sm:px-2.5 rounded-xl border text-[11px] font-semibold transition-all ${
              isLight
                ? 'bg-slate-50 hover:bg-slate-100 border-slate-200 text-slate-700'
                : 'bg-slate-900/90 hover:bg-slate-800 border-slate-700/80 text-slate-300'
            }`}
            title={t.importanceLabel}
          >
            <SlidersHorizontal className="w-3 h-3 text-slate-400" />
            <span className="hidden sm:inline text-[10px] text-slate-400">
              {t.importanceLabel}:
            </span>
            <span
              className={`px-1.5 py-0.5 rounded-md text-[10px] font-mono font-bold border ${getImportanceColor(
                importance
              )}`}
            >
              {importance}
            </span>
          </button>

          {/* Popover slider for fine tuning importance */}
          {showImportanceSlider && (
            <div
              className={`absolute bottom-full mb-2 ${
                isRtl ? 'left-0' : 'right-0'
              } p-3 rounded-xl border shadow-xl backdrop-blur-lg z-30 flex flex-col gap-2 min-w-[170px] ${
                isLight
                  ? 'bg-white/95 border-slate-200 text-slate-800'
                  : 'bg-slate-900/95 border-slate-700 text-slate-200'
              }`}
            >
              <div className="flex items-center justify-between text-[11px] font-semibold">
                <span className="text-slate-400">{t.importanceLabel}</span>
                <span className="font-bold text-sky-500 font-mono">{importance} / 10</span>
              </div>
              <input
                type="range"
                min={1}
                max={10}
                value={importance}
                onChange={(e) => setImportance(parseInt(e.target.value, 10))}
                className="w-full h-1.5 bg-slate-700 rounded-lg appearance-none cursor-pointer accent-sky-500"
              />
              <div className="flex justify-between text-[9px] text-slate-400">
                <span>1 ({language === 'fa' ? 'عادی' : 'Low'})</span>
                <span>10 ({language === 'fa' ? 'حیاتی' : 'Critical'})</span>
              </div>
            </div>
          )}
        </div>

        {/* Submit Add Button */}
        <button
          type="submit"
          disabled={!thoughtText.trim()}
          className={`h-8 sm:h-9 px-3 sm:px-3.5 rounded-xl font-semibold text-xs flex items-center gap-1.5 shadow-md transition-all shrink-0 ${
            thoughtText.trim()
              ? isLight
                ? 'bg-sky-600 hover:bg-sky-500 active:scale-95 text-white shadow-sky-600/25'
                : 'bg-cyan-600 hover:bg-cyan-500 active:scale-95 text-white shadow-cyan-600/30'
              : 'opacity-50 cursor-not-allowed bg-slate-400/20 text-slate-400'
          }`}
        >
          <Plus className="w-3.5 h-3.5 stroke-[2.5]" />
          <span className="hidden sm:inline">{t.addNodeBtn}</span>
        </button>
      </form>
    </div>
  );
};
