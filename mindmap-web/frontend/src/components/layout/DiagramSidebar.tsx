import React, { useRef } from 'react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTranslation } from '../../utils/i18n';
import {
  useDiagramStudioStore,
  DiagramSidebarTab,
} from '../../stores/useDiagramStudioStore';
import { TEMPLATES } from '../sketch-diagram/templates/templateRegistry';
import { DOODLE_PRESETS } from '../sketch-diagram/utils/sketchUtils';
import {
  LayoutTemplate,
  Square,
  Sparkles,
  Palette,
  Sliders,
  Check,
  Download,
  Upload,
  Image as ImageIcon,
  Wand2,
  Diamond,
  Circle,
  RectangleHorizontal,
  User,
  UserCheck,
  Target,
  Send,
  HelpCircle,
  Layers,
  ArrowRight,
  Server,
  Star,
  Radio,
  FileText,
} from 'lucide-react';

const THEMES = [
  { id: 'grid', name: 'Graph Paper Grid (Default)', nameFa: 'کاغذ شطرنجی مهندسی (پیش‌فرض)', icon: '📐', bg: '#FAF9F5' },
  { id: 'dark-studio', name: 'Studio Dark', nameFa: 'طرح دارک اصلی استودیو', icon: '🌌', bg: '#0B0F19' },
  { id: 'light-studio', name: 'Studio Light', nameFa: 'طرح روشن اصلی استودیو', icon: '☀️', bg: '#F8FAFD' },
  { id: 'parchment', name: 'Parchment Sketch', nameFa: 'پوست پوستی (طرح دست‌ساز)', icon: '📜', bg: '#FBFBF6' },
  { id: 'pastel-cream', name: 'Pastel Warm Cream', nameFa: 'کرم پاستلی ملایم', icon: '🌸', bg: '#FFFDF8' },
  { id: 'sunshine-yellow', name: 'Sunshine Yellow', nameFa: 'زرد آفتابی پرانرژی', icon: '☀️', bg: '#FDCA2F' },
  { id: 'clean', name: 'Clean Studio White', nameFa: 'سفید استودیو تمیز', icon: '🏢', bg: '#FFFFFF' },
  { id: 'dark-slate', name: 'Dark Slate Studio', nameFa: 'تاریک زغالی مدرن', icon: '🌑', bg: '#18181B' },
];

export const DiagramSidebar: React.FC = () => {
  const { language, themeMode } = useSettingsStore();
  const { t, isRtl } = useTranslation(language);
  const isLight = themeMode === 'light';

  const [stickerCategory, setStickerCategory] = React.useState<'Network' | 'General' | 'Doodles'>('Network');

  const {
    activeTemplateId,
    activeThemeId,
    activeTab,
    setActiveTab,
    triggerAction,
  } = useDiagramStudioStore();

  const fileInputRef = useRef<HTMLInputElement>(null);
  const mdFileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const json = JSON.parse(event.target?.result as string);
        triggerAction('importJSON', json);
      } catch (err) {
        console.error('Failed to parse diagram JSON:', err);
        alert(isRtl ? 'فایل انتخاب شده معتبر نمی‌باشد.' : 'Invalid diagram JSON file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleMdFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const content = event.target?.result as string;
        triggerAction('importMD', content);
      } catch (err) {
        console.error('Failed to read markdown file:', err);
        alert(isRtl ? 'خطا در خواندن فایل مارک‌داون.' : 'Error reading markdown file.');
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleSelectTemplate = (templateId: string) => {
    if (templateId === activeTemplateId) return;

    const confirmed = window.confirm(t.diagramConfirmTemplateChange);
    if (confirmed) {
      triggerAction('selectTemplate', templateId);
    }
  };

  return (
    <aside
      dir={isRtl ? 'rtl' : 'ltr'}
      className={`w-60 md:w-64 flex flex-col h-full shrink-0 z-20 select-none shadow-xl transition-all duration-300 border-l ${
        isLight
          ? 'bg-[#F8FAFD] border-[#CBD5E1] text-[#0B192C]'
          : 'bg-[#0c101d] border-slate-800/80 text-slate-100'
      }`}
    >
      {/* 1. Header & Title */}
      <div
        className={`p-2.5 border-b backdrop-blur-md space-y-2 ${
          isLight ? 'bg-white/95 border-[#CBD5E1]' : 'bg-[#0f172a]/70 border-slate-800/90'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-lg bg-emerald-500/20 border border-emerald-500/40 flex items-center justify-center text-emerald-600 dark:text-emerald-400 shrink-0">
              <LayoutTemplate className="w-3 h-3" />
            </div>
            <h2 className={`text-xs font-extrabold truncate ${isLight ? 'text-[#0B192C]' : 'text-slate-100'}`}>
              {t.diagramSidebarTitle}
            </h2>
          </div>
          <span
            className={`text-[10px] font-bold px-1.5 py-0.5 rounded-full ${
              isLight ? 'bg-emerald-100 text-emerald-800' : 'bg-emerald-950/60 text-emerald-300'
            }`}
          >
            Studio
          </span>
        </div>

        {/* 2. Navigation Tabs */}
        <div
          className={`grid grid-cols-5 p-0.5 rounded-lg text-[10px] font-bold ${
            isLight ? 'bg-slate-200/80' : 'bg-slate-900/80'
          }`}
        >
          <button
            onClick={() => setActiveTab('templates')}
            className={`py-1.5 rounded flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'templates'
                ? isLight
                  ? 'bg-white text-emerald-600 shadow-sm font-black'
                  : 'bg-emerald-600 text-white shadow-sm font-black'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={t.diagramTabTemplates}
          >
            <LayoutTemplate className="w-3.5 h-3.5" />
            <span className="scale-90">{t.diagramTabTemplates}</span>
          </button>

          <button
            onClick={() => setActiveTab('shapes')}
            className={`py-1.5 rounded flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'shapes'
                ? isLight
                  ? 'bg-white text-emerald-600 shadow-sm font-black'
                  : 'bg-emerald-600 text-white shadow-sm font-black'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={t.diagramTabShapes}
          >
            <Square className="w-3.5 h-3.5" />
            <span className="scale-90">{t.diagramTabShapes}</span>
          </button>

          <button
            onClick={() => setActiveTab('doodles')}
            className={`py-1.5 rounded flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'doodles'
                ? isLight
                  ? 'bg-white text-emerald-600 shadow-sm font-black'
                  : 'bg-emerald-600 text-white shadow-sm font-black'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={t.diagramTabDoodles}
          >
            <Sparkles className="w-3.5 h-3.5" />
            <span className="scale-90">{t.diagramTabDoodles}</span>
          </button>

          <button
            onClick={() => setActiveTab('themes')}
            className={`py-1.5 rounded flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'themes'
                ? isLight
                  ? 'bg-white text-emerald-600 shadow-sm font-black'
                  : 'bg-emerald-600 text-white shadow-sm font-black'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={t.diagramTabThemes}
          >
            <Palette className="w-3.5 h-3.5" />
            <span className="scale-90">{t.diagramTabThemes}</span>
          </button>

          <button
            onClick={() => setActiveTab('export')}
            className={`py-1.5 rounded flex flex-col items-center justify-center gap-0.5 transition-all ${
              activeTab === 'export'
                ? isLight
                  ? 'bg-white text-emerald-600 shadow-sm font-black'
                  : 'bg-emerald-600 text-white shadow-sm font-black'
                : isLight
                ? 'text-slate-600 hover:text-slate-900'
                : 'text-slate-400 hover:text-slate-200'
            }`}
            title={t.diagramTabExport}
          >
            <Sliders className="w-3.5 h-3.5" />
            <span className="scale-90">{t.diagramTabExport}</span>
          </button>
        </div>
      </div>

      {/* 3. Main Body Content (Dynamic per active Tab) */}
      <div className="flex-1 overflow-y-auto p-3 space-y-3 custom-scrollbar">
        {/* ================= TAB 1: TEMPLATES ================= */}
        {activeTab === 'templates' && (
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-snug">
              {t.diagramTemplatesDesc}
            </div>

            <div className="space-y-2">
              {TEMPLATES.map((tpl) => {
                const isSelected = activeTemplateId === tpl.id;
                const templateTitle = isRtl && tpl.nameFa ? tpl.nameFa : tpl.name;

                return (
                  <div
                    key={tpl.id}
                    onClick={() => handleSelectTemplate(tpl.id)}
                    className={`p-2.5 rounded-xl border transition-all cursor-pointer flex flex-col gap-1.5 ${
                      isSelected
                        ? isLight
                          ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                          : 'bg-emerald-950/40 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                        : isLight
                        ? 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-slate-50/80 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/60 hover:bg-slate-800/60'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xl shrink-0 leading-none">{tpl.thumbnail}</span>
                        <div className="min-w-0">
                          <h4
                            className={`text-xs font-bold truncate ${
                              isSelected
                                ? isLight
                                  ? 'text-emerald-900'
                                  : 'text-emerald-300'
                                : isLight
                                ? 'text-slate-800'
                                : 'text-slate-200'
                            }`}
                          >
                            {templateTitle}
                          </h4>
                          <span className="text-[10px] text-slate-400 block truncate">
                            {tpl.category}
                          </span>
                        </div>
                      </div>

                      {isSelected ? (
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                          <Check className="w-3 h-3 stroke-[3]" />
                        </div>
                      ) : (
                        <span className="text-[10px] font-semibold text-slate-400 bg-slate-100 dark:bg-slate-800 px-1.5 py-0.5 rounded">
                          {t.diagramApplyTemplate}
                        </span>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 2: SHAPES ================= */}
        {activeTab === 'shapes' && (
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-snug">
              {isRtl
                ? 'اشکال متناسب با قالب انتخابی (با کشیدن و رها کردن در صفحه قرار دهید):'
                : 'Shapes tailored for the active template (Drag & Drop onto the canvas):'}
            </div>

            {/* General Text Box Tool */}
            <div
              draggable
              onDragStart={(e) => {
                e.dataTransfer.setData('application/reactflow/type', 'text');
                e.dataTransfer.effectAllowed = 'copyMove';
              }}
              onClick={() => triggerAction('addShape', 'text')}
              className={`p-2 rounded-xl border flex items-center justify-between gap-2 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.02] hover:shadow-md ${
                isLight
                  ? 'bg-emerald-50/60 border-emerald-300 hover:border-emerald-500 text-emerald-900'
                  : 'bg-emerald-950/30 border-emerald-800 hover:border-emerald-500 text-emerald-200'
              }`}
              title={isRtl ? 'درج کادر متن آزاد (بکشید یا کلیک کنید)' : 'Insert Free Text Box (Drag or Click)'}
            >
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-emerald-500 text-white flex items-center justify-center font-black text-xs shadow-sm">
                  T
                </div>
                <div className="text-left rtl:text-right">
                  <div className="text-xs font-bold leading-none">{isRtl ? 'کادر متن آزاد (Text)' : 'Free Text Box'}</div>
                  <div className="text-[9px] opacity-70 mt-0.5">{isRtl ? 'تایپوگرافی و فونت‌های سفارشی' : 'Customizable Typography'}</div>
                </div>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-emerald-500/20 text-emerald-600 dark:text-emerald-400">
                {isRtl ? 'افزودن +' : '+ Add'}
              </span>
            </div>

            {/* Template-Specific Shapes */}
            <div className="space-y-2">
              {activeTemplateId === 'milestone-plane' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-amber-500 tracking-wider flex items-center gap-1">
                    <Target className="w-3 h-3" />
                    {isRtl ? 'اشکال نقشه راه و مایل‌استون' : 'Milestone & Journey Shapes'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Shape 1: Milestone Step */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow/type', 'milestoneNext');
                        e.dataTransfer.effectAllowed = 'copyMove';
                      }}
                      onClick={() => triggerAction('addShape', 'milestoneNext')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.03] hover:shadow-md ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/40'
                          : 'bg-slate-900/70 border-slate-800 hover:border-amber-500 hover:bg-slate-800/80'
                      }`}
                      title={isRtl ? 'گام مایل‌استون (بکشید و رها کنید)' : 'Milestone Step (Drag & drop)'}
                    >
                      <svg viewBox="0 0 120 70" className="w-full h-12">
                        <rect x="5" y="5" width="110" height="60" rx="10" fill={isLight ? '#FFFFFF' : '#1E293B'} stroke={isLight ? '#1E293B' : '#38BDF8'} strokeWidth="2.5" strokeDasharray="3 1.5" />
                        <circle cx="28" cy="35" r="16" fill={isLight ? '#FEF08A' : '#F59E0B'} stroke={isLight ? '#1E293B' : '#FFFFFF'} strokeWidth="2" />
                        <text x="28" y="40" textAnchor="middle" fontSize="12" fontWeight="bold" fill="#000">01</text>
                        <line x1="52" y1="26" x2="100" y2="26" stroke={isLight ? '#1E293B' : '#F1F5F9'} strokeWidth="3" strokeLinecap="round" />
                        <line x1="52" y1="36" x2="92" y2="36" stroke={isLight ? '#94A3B8' : '#64748B'} strokeWidth="2" strokeLinecap="round" />
                        <line x1="52" y1="44" x2="82" y2="44" stroke={isLight ? '#94A3B8' : '#64748B'} strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>

                    {/* Shape 2: Paper Airplane Goal */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow/type', 'paperPlaneNode');
                        e.dataTransfer.effectAllowed = 'copyMove';
                      }}
                      onClick={() => triggerAction('addShape', 'paperPlaneNode')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.03] hover:shadow-md ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/40'
                          : 'bg-slate-900/70 border-slate-800 hover:border-amber-500 hover:bg-slate-800/80'
                      }`}
                      title={isRtl ? 'موشک کاغذی هدف' : 'Paper Plane Goal'}
                    >
                      <svg viewBox="0 0 120 70" className="w-full h-12">
                        <path d="M 20 45 Q 45 55, 70 35 T 100 20" fill="none" stroke={isLight ? '#94A3B8' : '#64748B'} strokeWidth="2" strokeDasharray="3 3" />
                        <path d="M 60 48 L 105 18 L 85 58 L 74 46 L 60 48 Z" fill={isLight ? '#1E293B' : '#38BDF8'} stroke={isLight ? '#0F172A' : '#F8FAFC'} strokeWidth="2" />
                        <path d="M 105 18 L 74 46" fill="none" stroke="#FFFFFF" strokeWidth="1.5" />
                      </svg>
                    </div>

                    {/* Shape 3: Waypoint Dot */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow/type', 'waypointNode');
                        e.dataTransfer.effectAllowed = 'copyMove';
                      }}
                      onClick={() => triggerAction('addShape', 'waypointNode')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.03] hover:shadow-md ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/40'
                          : 'bg-slate-900/70 border-slate-800 hover:border-amber-500 hover:bg-slate-800/80'
                      }`}
                      title={isRtl ? 'نقطه اتصال مسیر' : 'Trajectory Waypoint'}
                    >
                      <svg viewBox="0 0 120 70" className="w-full h-12">
                        <circle cx="60" cy="35" r="18" fill="none" stroke={isLight ? '#CBD5E1' : '#334155'} strokeWidth="2" strokeDasharray="2 2" />
                        <circle cx="60" cy="35" r="10" fill={isLight ? '#1E293B' : '#38BDF8'} />
                        <circle cx="60" cy="35" r="4" fill="#FFFFFF" />
                      </svg>
                    </div>

                    {/* Shape 4: General Card */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow/type', 'process');
                        e.dataTransfer.effectAllowed = 'copyMove';
                      }}
                      onClick={() => triggerAction('addShape', 'process')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.03] hover:shadow-md ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-amber-400 hover:bg-amber-50/40'
                          : 'bg-slate-900/70 border-slate-800 hover:border-amber-500 hover:bg-slate-800/80'
                      }`}
                      title={isRtl ? 'کارت توضیحات' : 'Note Box'}
                    >
                      <svg viewBox="0 0 120 70" className="w-full h-12">
                        <rect x="15" y="10" width="90" height="50" rx="8" fill={isLight ? '#FEF08A' : '#1E293B'} stroke={isLight ? '#CA8A04' : '#F59E0B'} strokeWidth="2" />
                        <line x1="30" y1="25" x2="90" y2="25" stroke={isLight ? '#713F12' : '#F8FAFC'} strokeWidth="2" strokeLinecap="round" />
                        <line x1="30" y1="37" x2="75" y2="37" stroke={isLight ? '#713F12' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {activeTemplateId === 'flowchart-sketch' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-500 tracking-wider flex items-center gap-1">
                    <Square className="w-3 h-3" />
                    {isRtl ? 'اشکال استاندارد فلوچارت' : 'Flowchart Elements'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Process Box */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow/type', 'process');
                        e.dataTransfer.effectAllowed = 'copyMove';
                      }}
                      onClick={() => triggerAction('addShape', 'process')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.03] hover:shadow-md ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40'
                          : 'bg-slate-900/70 border-slate-800 hover:border-emerald-500 hover:bg-slate-800/80'
                      }`}
                      title={isRtl ? 'فرآیند (مستطیل)' : 'Process (Rectangle)'}
                    >
                      <svg viewBox="0 0 120 70" className="w-full h-12">
                        <rect x="12" y="12" width="96" height="46" rx="4" fill={isLight ? '#DCFCE7' : '#0F172A'} stroke={isLight ? '#15803D' : '#38BDF8'} strokeWidth="2.5" />
                        <line x1="28" y1="30" x2="92" y2="30" stroke={isLight ? '#166534' : '#F8FAFC'} strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="38" y1="40" x2="82" y2="40" stroke={isLight ? '#166534' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>

                    {/* Decision Diamond */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow/type', 'decision');
                        e.dataTransfer.effectAllowed = 'copyMove';
                      }}
                      onClick={() => triggerAction('addShape', 'decision')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.03] hover:shadow-md ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40'
                          : 'bg-slate-900/70 border-slate-800 hover:border-emerald-500 hover:bg-slate-800/80'
                      }`}
                      title={isRtl ? 'شرط / تصمیم (لوزی)' : 'Decision (Diamond)'}
                    >
                      <svg viewBox="0 0 120 70" className="w-full h-12">
                        <polygon points="60,8 110,35 60,62 10,35" fill={isLight ? '#FEF3C7' : '#0F172A'} stroke={isLight ? '#D97706' : '#F59E0B'} strokeWidth="2.5" />
                        <text x="60" y="39" textAnchor="middle" fontSize="12" fontWeight="bold" fill={isLight ? '#B45309' : '#F8FAFC'}>?</text>
                      </svg>
                    </div>

                    {/* Terminal Oval */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow/type', 'terminal');
                        e.dataTransfer.effectAllowed = 'copyMove';
                      }}
                      onClick={() => triggerAction('addShape', 'terminal')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.03] hover:shadow-md ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40'
                          : 'bg-slate-900/70 border-slate-800 hover:border-emerald-500 hover:bg-slate-800/80'
                      }`}
                      title={isRtl ? 'شروع / پایان (بیضی)' : 'Terminal / Start / End'}
                    >
                      <svg viewBox="0 0 120 70" className="w-full h-12">
                        <rect x="15" y="14" width="90" height="42" rx="21" fill={isLight ? '#FFE4E6' : '#0F172A'} stroke={isLight ? '#E11D48' : '#FB7185'} strokeWidth="2.5" />
                        <line x1="38" y1="35" x2="82" y2="35" stroke={isLight ? '#9F1239' : '#F8FAFC'} strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>

                    {/* Header Box */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow/type', 'headerProcess');
                        e.dataTransfer.effectAllowed = 'copyMove';
                      }}
                      onClick={() => triggerAction('addShape', 'headerProcess')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.03] hover:shadow-md ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/40'
                          : 'bg-slate-900/70 border-slate-800 hover:border-emerald-500 hover:bg-slate-800/80'
                      }`}
                      title={isRtl ? 'عنوان مرحله (کادر اصلی)' : 'Header Box'}
                    >
                      <svg viewBox="0 0 120 70" className="w-full h-12">
                        <rect x="8" y="10" width="104" height="50" rx="6" fill={isLight ? '#EEF2FF' : '#0F172A'} stroke={isLight ? '#4F46E5' : '#818CF8'} strokeWidth="2.5" />
                        <line x1="22" y1="28" x2="98" y2="28" stroke={isLight ? '#3730A3' : '#F8FAFC'} strokeWidth="3" strokeLinecap="round" />
                        <line x1="35" y1="42" x2="85" y2="42" stroke={isLight ? '#6366F1' : '#94A3B8'} strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {activeTemplateId === 'corporate-org' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-sky-500 tracking-wider flex items-center gap-1">
                    <User className="w-3 h-3" />
                    {isRtl ? 'اشکال چارت سازمانی' : 'Org Chart Elements'}
                  </span>
                  <div className="grid grid-cols-2 gap-2">
                    {/* Member Card */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow/type', 'corpNode');
                        e.dataTransfer.effectAllowed = 'copyMove';
                      }}
                      onClick={() => triggerAction('addShape', 'corpNode')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.03] hover:shadow-md ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-sky-500 hover:bg-sky-50/40'
                          : 'bg-slate-900/70 border-slate-800 hover:border-sky-500 hover:bg-slate-800/80'
                      }`}
                      title={isRtl ? 'کارت عضو تیم' : 'Member Card'}
                    >
                      <svg viewBox="0 0 120 70" className="w-full h-12">
                        <rect x="10" y="8" width="100" height="54" rx="8" fill={isLight ? '#FFFFFF' : '#0F172A'} stroke={isLight ? '#CBD5E1' : '#334155'} strokeWidth="2" />
                        <rect x="10" y="8" width="10" height="54" rx="2" fill="#3B82F6" />
                        <circle cx="36" cy="35" r="10" fill={isLight ? '#E2E8F0' : '#1E293B'} />
                        <line x1="54" y1="28" x2="98" y2="28" stroke={isLight ? '#1E293B' : '#F8FAFC'} strokeWidth="2.5" strokeLinecap="round" />
                        <line x1="54" y1="42" x2="88" y2="42" stroke="#94A3B8" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>

                    {/* Executive Card */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow/type', 'corpCeo');
                        e.dataTransfer.effectAllowed = 'copyMove';
                      }}
                      onClick={() => triggerAction('addShape', 'corpCeo')}
                      className={`p-2.5 rounded-xl border flex flex-col items-center justify-center gap-2 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.03] hover:shadow-md ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-rose-500 hover:bg-rose-50/40'
                          : 'bg-slate-900/70 border-slate-800 hover:border-rose-500 hover:bg-slate-800/80'
                      }`}
                      title={isRtl ? 'کارت مدیر ارشد' : 'Executive Leader Card'}
                    >
                      <svg viewBox="0 0 120 70" className="w-full h-12">
                        <rect x="10" y="8" width="100" height="54" rx="8" fill={isLight ? '#FFF1F2' : '#0F172A'} stroke="#EF4444" strokeWidth="2.5" />
                        <circle cx="35" cy="35" r="12" fill="#EF4444" />
                        <text x="35" y="40" textAnchor="middle" fontSize="11" fill="#FFFFFF" fontWeight="bold">👑</text>
                        <line x1="55" y1="28" x2="98" y2="28" stroke={isLight ? '#881337' : '#F8FAFC'} strokeWidth="3" strokeLinecap="round" />
                        <line x1="55" y1="42" x2="90" y2="42" stroke={isLight ? '#F43F5E' : '#FDA4AF'} strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {activeTemplateId === 'pastel-mindmap' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-pink-500 tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {isRtl ? 'اشکال نرم و پاستلی' : 'Pastel Shapes'}
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Pastel Squircle */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow/type', 'pastelSquircle');
                        e.dataTransfer.effectAllowed = 'copyMove';
                      }}
                      onClick={() => triggerAction('addShape', 'pastelSquircle')}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.05] hover:shadow-md ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-pink-400'
                          : 'bg-slate-900/70 border-slate-800 hover:border-pink-500'
                      }`}
                      title={isRtl ? 'اسکویرکل پاستلی' : 'Pastel Squircle'}
                    >
                      <svg viewBox="0 0 60 60" className="w-full h-10">
                        <rect x="6" y="6" width="48" height="48" rx="16" fill="#FFAE9C" stroke="#283A2E" strokeWidth="2.5" />
                        <line x1="16" y1="30" x2="44" y2="30" stroke="#283A2E" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>

                    {/* Pastel Oval */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow/type', 'pastelOval');
                        e.dataTransfer.effectAllowed = 'copyMove';
                      }}
                      onClick={() => triggerAction('addShape', 'pastelOval')}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.05] hover:shadow-md ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-purple-400'
                          : 'bg-slate-900/70 border-slate-800 hover:border-purple-500'
                      }`}
                      title={isRtl ? 'بیضی پاستلی' : 'Pastel Oval'}
                    >
                      <svg viewBox="0 0 60 60" className="w-full h-10">
                        <ellipse cx="30" cy="30" rx="26" ry="18" fill="#DEC8F9" stroke="#283A2E" strokeWidth="2.5" />
                        <line x1="16" y1="30" x2="44" y2="30" stroke="#283A2E" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>

                    {/* Pastel Rect */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow/type', 'pastelRect');
                        e.dataTransfer.effectAllowed = 'copyMove';
                      }}
                      onClick={() => triggerAction('addShape', 'pastelRect')}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.05] hover:shadow-md ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-emerald-400'
                          : 'bg-slate-900/70 border-slate-800 hover:border-emerald-500'
                      }`}
                      title={isRtl ? 'مستطیل پاستلی' : 'Pastel Rect'}
                    >
                      <svg viewBox="0 0 60 60" className="w-full h-10">
                        <rect x="5" y="12" width="50" height="36" rx="8" fill="#C6E9DE" stroke="#283A2E" strokeWidth="2.5" />
                        <line x1="15" y1="30" x2="45" y2="30" stroke="#283A2E" strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}

              {activeTemplateId === 'mindmap-sketch' && (
                <div className="space-y-2">
                  <span className="text-[10px] font-extrabold uppercase text-emerald-500 tracking-wider flex items-center gap-1">
                    <Sparkles className="w-3 h-3" />
                    {isRtl ? 'اشکال نقشه ذهنی' : 'Mind Map Elements'}
                  </span>
                  <div className="grid grid-cols-3 gap-1.5">
                    {/* Root Node */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow/type', 'root');
                        e.dataTransfer.effectAllowed = 'copyMove';
                      }}
                      onClick={() => triggerAction('addShape', 'root')}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.05] hover:shadow-md ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-emerald-500'
                          : 'bg-slate-900/70 border-slate-800 hover:border-emerald-500'
                      }`}
                      title={isRtl ? 'گره ریشه (مرکزی)' : 'Central Root'}
                    >
                      <svg viewBox="0 0 60 60" className="w-full h-10">
                        <rect x="5" y="10" width="50" height="40" rx="12" fill={isLight ? '#DCFCE7' : '#064E3B'} stroke="#10B981" strokeWidth="2.5" />
                        <circle cx="30" cy="30" r="6" fill="#10B981" />
                      </svg>
                    </div>

                    {/* Branch Node */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow/type', 'branch');
                        e.dataTransfer.effectAllowed = 'copyMove';
                      }}
                      onClick={() => triggerAction('addShape', 'branch')}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.05] hover:shadow-md ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-emerald-500'
                          : 'bg-slate-900/70 border-slate-800 hover:border-emerald-500'
                      }`}
                      title={isRtl ? 'شاخه اصلی' : 'Branch Node'}
                    >
                      <svg viewBox="0 0 60 60" className="w-full h-10">
                        <rect x="6" y="14" width="48" height="32" rx="6" fill={isLight ? '#FEF3C7' : '#78350F'} stroke="#F59E0B" strokeWidth="2.5" />
                        <line x1="16" y1="30" x2="44" y2="30" stroke={isLight ? '#B45309' : '#FCD34D'} strokeWidth="2.5" strokeLinecap="round" />
                      </svg>
                    </div>

                    {/* Subnode */}
                    <div
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('application/reactflow/type', 'subnode');
                        e.dataTransfer.effectAllowed = 'copyMove';
                      }}
                      onClick={() => triggerAction('addShape', 'subnode')}
                      className={`p-2 rounded-xl border flex flex-col items-center justify-center gap-1 cursor-grab active:cursor-grabbing transition-all hover:scale-[1.05] hover:shadow-md ${
                        isLight
                          ? 'bg-white border-slate-200 hover:border-sky-500'
                          : 'bg-slate-900/70 border-slate-800 hover:border-sky-500'
                      }`}
                      title={isRtl ? 'زیرشاخه' : 'Sub-item Node'}
                    >
                      <svg viewBox="0 0 60 60" className="w-full h-10">
                        <rect x="6" y="16" width="48" height="28" rx="14" fill={isLight ? '#F1F5F9' : '#1E293B'} stroke="#3B82F6" strokeWidth="2" strokeDasharray="3 2" />
                        <line x1="16" y1="30" x2="44" y2="30" stroke="#3B82F6" strokeWidth="2" strokeLinecap="round" />
                      </svg>
                    </div>
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* ================= TAB 3: DOODLES & STICKERS ================= */}
        {activeTab === 'doodles' && (
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-snug">
              {isRtl
                ? 'استیکر مورد نظر را به درون صفحه بکشید یا برای درج مستقیم کلیک کنید:'
                : 'Drag & drop stickers directly onto the canvas or click to add:'}
            </div>

            {/* 3-Way Category Pill Switcher */}
            <div
              className={`grid grid-cols-3 p-1 rounded-xl text-[10px] font-extrabold gap-1 ${
                isLight ? 'bg-slate-200/80' : 'bg-slate-900/90'
              }`}
            >
              <button
                onClick={() => setStickerCategory('Network')}
                className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  stickerCategory === 'Network'
                    ? isLight
                      ? 'bg-white text-emerald-600 shadow-sm font-black'
                      : 'bg-emerald-600 text-white shadow-sm font-black'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={isRtl ? 'شبکه و فناوری ابری' : 'Network & Cloud'}
              >
                <Server className="w-3 h-3 shrink-0" />
                <span className="truncate">{isRtl ? 'شبکه' : 'Network'}</span>
              </button>

              <button
                onClick={() => setStickerCategory('General')}
                className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  stickerCategory === 'General'
                    ? isLight
                      ? 'bg-white text-emerald-600 shadow-sm font-black'
                      : 'bg-emerald-600 text-white shadow-sm font-black'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={isRtl ? 'استیکرهای عمومی' : 'General Icons'}
              >
                <Star className="w-3 h-3 shrink-0" />
                <span className="truncate">{isRtl ? 'عمومی' : 'General'}</span>
              </button>

              <button
                onClick={() => setStickerCategory('Doodles')}
                className={`py-1.5 px-1 rounded-lg flex items-center justify-center gap-1 transition-all ${
                  stickerCategory === 'Doodles'
                    ? isLight
                      ? 'bg-white text-emerald-600 shadow-sm font-black'
                      : 'bg-emerald-600 text-white shadow-sm font-black'
                    : isLight
                    ? 'text-slate-600 hover:text-slate-900'
                    : 'text-slate-400 hover:text-slate-200'
                }`}
                title={isRtl ? 'طرح‌های دستی و تزئینی' : 'Hand-Drawn Doodles'}
              >
                <Sparkles className="w-3 h-3 shrink-0" />
                <span className="truncate">{isRtl ? 'طرح دستی' : 'Doodles'}</span>
              </button>
            </div>

            {/* Categorized Sticker Grid */}
            <div className="grid grid-cols-3 gap-2 pt-0.5">
              {DOODLE_PRESETS.filter((d) => d.category === stickerCategory).map((doodle) => {
                const label = isRtl && doodle.nameFa ? doodle.nameFa : doodle.name;

                return (
                  <div
                    key={doodle.id}
                    draggable
                    onDragStart={(e) => {
                      e.dataTransfer.setData('application/reactflow/type', 'doodle');
                      e.dataTransfer.setData('application/reactflow/doodleId', doodle.id);
                      e.dataTransfer.effectAllowed = 'copyMove';
                    }}
                    onClick={() => triggerAction('addDoodle', doodle.id)}
                    className="p-2 rounded-xl border border-slate-200 dark:border-slate-700 bg-white shadow-xs flex flex-col items-center justify-center gap-1.5 cursor-grab active:cursor-grabbing transition-all hover:scale-105 active:scale-95 hover:border-emerald-500 hover:shadow-md group"
                    title={label}
                  >
                    <div className="w-12 h-12 rounded-lg bg-white flex items-center justify-center p-1 overflow-hidden">
                      {doodle.imgUrl ? (
                        <img
                          src={doodle.imgUrl}
                          alt={label}
                          className="w-full h-full object-contain pointer-events-none select-none drop-shadow-xs"
                          draggable={false}
                        />
                      ) : (
                        <div
                          className="w-full h-full flex items-center justify-center pointer-events-none"
                          dangerouslySetInnerHTML={{ __html: doodle.svg || '' }}
                        />
                      )}
                    </div>
                    <span className="text-[9.5px] font-bold text-slate-800 truncate w-full text-center leading-tight">
                      {label}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 4: THEMES ================= */}
        {activeTab === 'themes' && (
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-snug">
              {t.diagramThemesDesc}
            </div>

            <div className="space-y-2">
              {THEMES.map((th) => {
                const isSelected = activeThemeId === th.id;
                const themeTitle = isRtl ? th.nameFa : th.name;

                return (
                  <button
                    key={th.id}
                    onClick={() => triggerAction('changeTheme', th.id)}
                    className={`w-full p-2.5 rounded-xl border transition-all flex items-center justify-between ${
                      isSelected
                        ? isLight
                          ? 'bg-emerald-50/90 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                          : 'bg-emerald-950/40 border-emerald-500 shadow-sm ring-1 ring-emerald-500'
                        : isLight
                        ? 'bg-white border-slate-200 hover:border-emerald-400 hover:bg-slate-50 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500/60 hover:bg-slate-800'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="text-lg">{th.icon}</span>
                      <div className="text-right">
                        <span className="text-xs font-bold block text-slate-800 dark:text-slate-200">
                          {themeTitle}
                        </span>
                      </div>
                    </div>

                    {isSelected && (
                      <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center text-white shrink-0 shadow-sm">
                        <Check className="w-3 h-3 stroke-[3]" />
                      </div>
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        )}

        {/* ================= TAB 5: EXPORT & ACTIONS ================= */}
        {activeTab === 'export' && (
          <div className="space-y-2.5">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-snug">
              {t.diagramExportHeader}
            </div>

            <div className="space-y-2">
              <button
                onClick={() => triggerAction('autoLayout')}
                className={`w-full p-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 text-slate-800 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500 text-slate-200'
                }`}
              >
                <Wand2 className="w-4 h-4 text-emerald-500 shrink-0" />
                <span>{t.diagramAutoLayoutBtn}</span>
              </button>

              <button
                onClick={() => triggerAction('exportPNG')}
                className={`w-full p-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 text-slate-800 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500 text-slate-200'
                }`}
              >
                <ImageIcon className="w-4 h-4 text-emerald-600 shrink-0" />
                <span>{t.diagramExportPngBtn}</span>
              </button>

              <button
                onClick={() => triggerAction('exportJSON')}
                className={`w-full p-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 text-slate-800 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500 text-slate-200'
                }`}
              >
                <Download className="w-4 h-4 text-blue-500 shrink-0" />
                <span>{t.diagramExportJsonBtn}</span>
              </button>

              <button
                onClick={() => fileInputRef.current?.click()}
                className={`w-full p-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 text-slate-800 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500 text-slate-200'
                }`}
              >
                <Upload className="w-4 h-4 text-amber-500 shrink-0" />
                <span>{t.diagramImportJsonBtn}</span>
              </button>

              <button
                onClick={() => triggerAction('exportMD')}
                className={`w-full p-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 text-slate-800 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500 text-slate-200'
                }`}
              >
                <FileText className="w-4 h-4 text-purple-500 shrink-0" />
                <span>{isRtl ? 'ذخیره فایل مارک‌داون (.md)' : 'Export Markdown (.md)'}</span>
              </button>

              <button
                onClick={() => mdFileInputRef.current?.click()}
                className={`w-full p-2.5 rounded-xl border flex items-center gap-2.5 text-xs font-bold transition-all ${
                  isLight
                    ? 'bg-white border-slate-200 hover:border-emerald-500 hover:bg-emerald-50/60 text-slate-800 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800 hover:border-emerald-500 text-slate-200'
                }`}
              >
                <Upload className="w-4 h-4 text-purple-400 shrink-0" />
                <span>{isRtl ? 'بارگذاری فایل مارک‌داون (.md)' : 'Import Markdown (.md)'}</span>
              </button>

              <input
                ref={fileInputRef}
                type="file"
                accept=".json"
                onChange={handleFileChange}
                className="hidden"
              />

              <input
                ref={mdFileInputRef}
                type="file"
                accept=".md,.markdown,.txt"
                onChange={handleMdFileChange}
                className="hidden"
              />
            </div>
          </div>
        )}
      </div>
    </aside>
  );
};
