import React, { useState, useRef, useEffect } from 'react';
import { useGraphStore } from '../../stores/useGraphStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTranslation } from '../../utils/i18n';
import { MindPage, GraphThemeKey } from '../../types';
import { GRAPH_THEMES, getGraphTheme } from '../../utils/graphThemes';
import {
  Plus,
  Layers,
  Check,
  X,
  Palette,
  ChevronDown,
  Image as ImageIcon,
  Brain,
  PencilRuler,
} from 'lucide-react';
import { BackgroundSelectorPopover } from './BackgroundSelectorPopover';
import { CreatePageModal } from '../dialogs/CreatePageModal';

export const PageTabsBar: React.FC = () => {
  const {
    pages,
    activePageId,
    setActivePageId,
    addPage,
    updatePageTitle,
    updatePageTheme,
    deletePage,
  } = useGraphStore();

  const { language, themeMode, canvasBackground, customBackgroundColor } = useSettingsStore();
  const { t, isRtl } = useTranslation(language);
  const isLight = themeMode === 'light';
  const isFa = language === 'fa';

  const [editingPageId, setEditingPageId] = useState<string | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [isThemeMenuOpen, setIsThemeMenuOpen] = useState(false);
  const [isBgMenuOpen, setIsBgMenuOpen] = useState(false);
  const themeMenuRef = useRef<HTMLDivElement | null>(null);
  const bgMenuRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLInputElement | null>(null);

  const activePage = pages.find((p) => p.id === activePageId);
  const activeTheme = getGraphTheme(activePage?.theme);

  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (bgMenuRef.current && !bgMenuRef.current.contains(e.target as Node)) {
        setIsBgMenuOpen(false);
      }
    };
    if (isBgMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isBgMenuOpen]);

  useEffect(() => {
    if (editingPageId && inputRef.current) {
      inputRef.current.focus();
      inputRef.current.select();
    }
  }, [editingPageId]);

  // Close theme dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (themeMenuRef.current && !themeMenuRef.current.contains(e.target as Node)) {
        setIsThemeMenuOpen(false);
      }
    };
    if (isThemeMenuOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isThemeMenuOpen]);

  const handleStartRename = (page: MindPage, e?: React.MouseEvent) => {
    e?.stopPropagation();
    setEditingPageId(page.id);
    setEditTitle(page.title);
  };

  const handleSaveRename = (pageId: string) => {
    if (editingPageId === pageId) {
      const trimmed = editTitle.trim();
      if (trimmed) {
        updatePageTitle(pageId, trimmed);
      }
      setEditingPageId(null);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent, pageId: string) => {
    if (e.key === 'Enter') {
      handleSaveRename(pageId);
    } else if (e.key === 'Escape') {
      setEditingPageId(null);
    }
  };

  const handleDeletePage = (page: MindPage, e: React.MouseEvent) => {
    e.stopPropagation();
    if (pages.length <= 1) {
      alert(t.minPagesAlert);
      return;
    }
    const msg = t.deletePagePrompt.replace('{title}', page.title);
    if (confirm(msg)) {
      deletePage(page.id);
    }
  };

  const handleCreateNewPage = async () => {
    await addPage();
  };

  const handleSelectTheme = (themeKey: GraphThemeKey) => {
    if (activePageId) {
      updatePageTheme(activePageId, themeKey);
    }
    setIsThemeMenuOpen(false);
  };

  return (
    <div
      dir="rtl"
      className={`h-[52px] border-t px-2.5 sm:px-3 flex items-center justify-between gap-2.5 select-none z-30 shrink-0 relative transition-colors w-full max-w-full ${isLight ? 'bg-[#F8FAFD] border-[#CBD5E1] text-[#0B192C] shadow-sm' : 'bg-[#0a0e19]/95 border-slate-800/90'
        }`}
    >
      {/* Scrollable Tabs List - Expanded to full available space */}
      <div className="flex-1 flex items-center gap-1.5 overflow-x-auto no-scrollbar py-1 min-w-0">
        {pages.map((page) => {
          const isActive = page.id === activePageId;
          const isEditing = editingPageId === page.id;
          const pageTheme = getGraphTheme(page.theme, isLight);

          return (
            <div
              key={page.id}
              onClick={() => !isEditing && setActivePageId(page.id)}
              onDoubleClick={(e) => handleStartRename(page, e)}
              className={`group relative flex items-center gap-2 h-10 px-3 rounded-xl border text-xs font-medium transition-all cursor-pointer shrink-0 ${isActive
                  ? isLight
                    ? 'bg-sky-600 text-white font-bold border-sky-600 shadow-sm'
                    : `${pageTheme.badgeBg} ${pageTheme.badgeBorder} ${pageTheme.badgeText} shadow-sm font-bold`
                  : isLight
                    ? 'bg-white border-[#CBD5E1] text-[#0F172A] hover:text-sky-700 hover:bg-sky-50 shadow-sm'
                    : 'bg-slate-900/60 border-slate-800/70 text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 hover:border-slate-700'
                }`}
              title={isActive ? t.renamePageTooltip : page.title}
            >
              {/* Theme Color Pip - Illuminated & glowing when active, muted grey/off when inactive */}
              <div
                className={`w-2.5 h-2.5 rounded-full shrink-0 transition-all ${
                  isActive
                    ? 'shadow-sm'
                    : isLight
                      ? 'bg-slate-300 border border-slate-400/40 group-hover:bg-slate-400'
                      : 'bg-slate-700/80 border border-slate-600/50 group-hover:bg-slate-600'
                }`}
                style={
                  isActive
                    ? {
                        background: pageTheme.previewGradient,
                        boxShadow: `0 0 8px ${pageTheme.previewColor}`,
                      }
                    : undefined
                }
              />

              {/* Mode Icon: Brain for Mind Map, PencilRuler for Diagram */}
              {page.pageMode === 'diagram' ? (
                <div
                  className={`flex items-center justify-center shrink-0 ${
                    isActive
                      ? isLight
                        ? 'text-amber-200'
                        : 'text-amber-300'
                      : isLight
                      ? 'text-amber-600/80'
                      : 'text-amber-400/70'
                  }`}
                  title={isFa ? 'صفحه دیاگرام دستی' : 'Manual Diagram'}
                >
                  <PencilRuler className="w-3.5 h-3.5" />
                </div>
              ) : (
                <div
                  className={`flex items-center justify-center shrink-0 ${
                    isActive
                      ? isLight
                        ? 'text-sky-200'
                        : 'text-cyan-300'
                      : isLight
                      ? 'text-sky-600/80'
                      : 'text-cyan-400/70'
                  }`}
                  title={isFa ? 'صفحه نقشه ذهنی' : 'Mind Map'}
                >
                  <Brain className="w-3.5 h-3.5" />
                </div>
              )}

              {/* Title Display or Inline Edit Input */}
              {isEditing ? (
                <div className="flex items-center gap-1">
                  <input
                    ref={inputRef}
                    type="text"
                    value={editTitle}
                    onChange={(e) => setEditTitle(e.target.value)}
                    onKeyDown={(e) => handleKeyDown(e, page.id)}
                    onBlur={() => handleSaveRename(page.id)}
                    className="bg-slate-950 border border-cyan-500 rounded px-1.5 py-0.5 text-xs text-white focus:outline-none w-24"
                  />
                  <button
                    onClick={() => handleSaveRename(page.id)}
                    className="text-emerald-400 hover:text-emerald-300 p-0.5"
                  >
                    <Check className="w-3 h-3" />
                  </button>
                </div>
              ) : (
                <span className="whitespace-nowrap font-medium text-xs max-w-[220px] truncate leading-none">{page.title}</span>
              )}

              {/* Delete Button: always visible for easy one-click page deletion */}
              {!isEditing && pages.length > 1 && (
                <button
                  type="button"
                  onClick={(e) => handleDeletePage(page, e)}
                  className={`p-1 rounded-md transition-colors shrink-0 -me-1 ${
                    isActive
                      ? isLight
                        ? 'text-white/80 hover:text-white hover:bg-white/20'
                        : 'text-slate-300 hover:text-rose-300 hover:bg-rose-500/25'
                      : isLight
                        ? 'text-slate-400 hover:text-rose-600 hover:bg-rose-50'
                        : 'text-slate-500 hover:text-rose-400 hover:bg-slate-800'
                  }`}
                  title={language === 'fa' ? 'حذف صفحه' : 'Delete page'}
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              )}
            </div>
          );
        })}

        {/* Add New Page "+" Button */}
        <button
          onClick={() => setIsCreateModalOpen(true)}
          className={`flex items-center gap-1.5 h-10 px-3.5 rounded-xl border border-dashed text-xs font-semibold transition-all shrink-0 shadow-sm ${isLight
              ? 'border-sky-400 bg-sky-50 text-sky-700 hover:bg-sky-100'
              : 'border-cyan-700/60 bg-cyan-950/20 text-cyan-400 hover:bg-cyan-900/40 hover:border-cyan-500'
            }`}
          title={t.newPage}
        >
          <Plus className="w-3.5 h-3.5" />
          <span>{t.newPage}</span>
        </button>
      </div>

      {/* Right/Left Controls: Theme Selector Popover + Stats */}
      <div className="flex items-center gap-2 shrink-0">
        {/* Background Selector Button on Main Page */}
        <div className="relative" ref={bgMenuRef}>
          <button
            onClick={() => {
              setIsBgMenuOpen(!isBgMenuOpen);
              setIsThemeMenuOpen(false);
            }}
            title={isFa ? 'تغییر تصویر یا رنگ پس‌زمینه' : 'Change canvas background or color'}
            className={`flex items-center gap-1.5 h-10 px-3 rounded-xl border text-xs font-medium transition-all shadow-sm ${isBgMenuOpen
                ? isLight
                  ? 'bg-sky-50 border-sky-400 text-sky-900 font-bold'
                  : 'bg-cyan-950/70 border-cyan-500/80 text-cyan-300'
                : isLight
                  ? 'bg-white border-[#CBD5E1] text-[#0F172A] hover:bg-sky-50 hover:text-sky-700'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700 hover:text-white'
              }`}
          >
            {canvasBackground === 'solid' ? (
              <div
                className="w-3.5 h-3.5 rounded-full border border-slate-400 shadow-sm shrink-0"
                style={{ backgroundColor: customBackgroundColor || (isLight ? '#E2E8F0' : '#0B0F19') }}
              />
            ) : (
              <ImageIcon className="w-3.5 h-3.5 text-sky-500 shrink-0" />
            )}
            <span className="hidden sm:inline">{isFa ? 'پس‌زمینه' : 'Background'}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isBgMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          <BackgroundSelectorPopover
            isOpen={isBgMenuOpen}
            onClose={() => setIsBgMenuOpen(false)}
            anchorClassName="bottom-full mb-1.5"
          />
        </div>

        {/* Theme Picker Dropdown */}
        <div className="relative" ref={themeMenuRef}>
          <button
            onClick={() => setIsThemeMenuOpen(!isThemeMenuOpen)}
            className={`flex items-center gap-1.5 h-10 px-3 rounded-xl border text-xs font-medium transition-all shadow-sm ${isThemeMenuOpen
                ? `${activeTheme.badgeBg} ${activeTheme.badgeBorder} ${activeTheme.badgeText}`
                : isLight
                  ? 'bg-white border-[#CBD5E1] text-[#0F172A] hover:bg-sky-50'
                  : 'bg-slate-900/80 border-slate-800 text-slate-300 hover:bg-slate-800 hover:border-slate-700 hover:text-white'
              }`}
          >
            <div
              className="w-2.5 h-2.5 rounded-full"
              style={{
                background: activeTheme.previewGradient,
                boxShadow: `0 0 6px ${activeTheme.previewColor}`,
              }}
            />
            <span className="hidden md:inline font-semibold">
              {language === 'en' ? activeTheme.nameEn : activeTheme.name}
            </span>
            <span className="md:hidden">{t.stylePicker}</span>
            <ChevronDown className={`w-3 h-3 transition-transform ${isThemeMenuOpen ? 'rotate-180' : ''}`} />
          </button>

          {/* Theme Dropdown Popover (Opens Upward!) */}
          {isThemeMenuOpen && (
            <div
              className={`absolute bottom-full mb-1.5 w-72 sm:w-80 min-w-[280px] border rounded-xl shadow-2xl p-2 z-50 animate-in fade-in zoom-in-95 duration-150 left-0 ${isLight
                  ? 'bg-white border-[#CBD5E1] text-[#0B192C] shadow-slate-400/40'
                  : 'bg-[#0f172a] border-slate-700 text-slate-100 shadow-black/90'
                }`}
            >
              <div
                className={`flex items-center justify-between px-2 py-1.5 border-b mb-1.5 ${isLight ? 'border-slate-200' : 'border-slate-800'
                  }`}
              >
                <span className="text-xs font-bold flex items-center gap-1.5">
                  <Palette className="w-3.5 h-3.5 text-sky-500" />
                  {t.stylePicker} «{activePage?.title}»
                </span>
              </div>

              <div className="space-y-1 max-h-[380px] overflow-y-auto pr-1">
                {(Object.keys(GRAPH_THEMES) as GraphThemeKey[]).map((themeKey) => {
                  const theme = getGraphTheme(themeKey, isLight);
                  const isSelected = activeTheme.id === themeKey;

                  return (
                    <button
                      key={theme.id}
                      onClick={() => handleSelectTheme(themeKey)}
                      className={`w-full flex items-center justify-between p-2 rounded-lg transition-all group ${isRtl ? 'text-right' : 'text-left'
                        } ${isSelected
                          ? `${theme.badgeBg} ${theme.badgeBorder} border`
                          : isLight
                            ? 'hover:bg-sky-50 border border-transparent text-[#0F172A]'
                            : 'hover:bg-slate-800/80 border border-transparent'
                        }`}
                    >
                      <div className="flex items-center gap-2.5">
                        <div
                          className="w-4 h-4 rounded-full shrink-0 transition-transform group-hover:scale-110"
                          style={{
                            background: theme.previewGradient,
                            boxShadow: `0 0 8px ${theme.previewColor}`,
                          }}
                        />
                        <div>
                          <div
                            className={`text-xs font-semibold ${isSelected
                                ? theme.badgeText
                                : isLight
                                  ? 'text-slate-800 group-hover:text-cyan-700'
                                  : 'text-slate-200 group-hover:text-white'
                              }`}
                          >
                            {language === 'en' ? theme.nameEn : theme.name}
                          </div>
                          <div className={`text-[10px] leading-tight ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                            {language === 'en' ? theme.descriptionEn : theme.description}
                          </div>
                        </div>
                      </div>

                      {isSelected && (
                        <Check className="w-4 h-4 text-emerald-400 shrink-0" />
                      )}
                    </button>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Pages Count Stats */}
        <div className={`hidden lg:flex items-center gap-1.5 text-[11px] font-mono px-1 shrink-0 ${isLight ? 'text-slate-500' : 'text-slate-500'
          }`}>
          <Layers className="w-3.5 h-3.5 text-slate-400" />
          <span>
            {pages.length} {t.activePagesCount}
          </span>
        </div>
      </div>

      {/* Create New Page Modal (Mind Map vs Manual Diagram) */}
      <CreatePageModal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        onCreate={async (title, mode, diagramType) => {
          await addPage({
            title,
            pageMode: mode,
            diagramType,
          });
        }}
        currentPageCount={pages.length}
      />
    </div>
  );
};
