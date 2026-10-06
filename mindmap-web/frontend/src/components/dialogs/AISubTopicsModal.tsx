import React, { useState, useEffect } from 'react';
import { MindNode, AIInsight } from '../../types';
import { aiService } from '../../services/aiService';
import { useGraphStore } from '../../stores/useGraphStore';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Sparkles,
  X,
  PlusCircle,
  Layers,
  Star,
  CheckCircle,
  AlertCircle,
  CheckSquare,
  Square,
  Lightbulb,
  RotateCcw,
} from 'lucide-react';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTranslation } from '../../utils/i18n';

interface AISubTopicsModalProps {
  node: MindNode | null;
  isOpen: boolean;
  onClose: () => void;
}

function cleanTopicTitle(rawTopic: string, parentTitle: string): string {
  let title = String(rawTopic || '').trim();
  const separators = [' - ', ' : ', ' — ', ' – ', ' | ', '-', ':', '—', '–', '|'];
  for (const sep of separators) {
    if (title.toLowerCase().startsWith((parentTitle + sep).toLowerCase())) {
      title = title.substring((parentTitle + sep).length).trim();
    }
  }
  title = title.replace(/^(?:[-–—•\*\s]+|\d+[\.\)]\s*)/, '').trim();
  return title || rawTopic;
}

export const AISubTopicsModal: React.FC<AISubTopicsModalProps> = ({
  node,
  isOpen,
  onClose,
}) => {
  const { language, themeMode } = useSettingsStore();
  const { isRtl } = useTranslation(language);
  const isLight = themeMode === 'light';
  const isFa = language === 'fa';
  const { addNode, addEdge } = useGraphStore();

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [merged, setMerged] = useState(false);
  const [insights, setInsights] = useState<AIInsight[]>([]);
  const [selectedIndices, setSelectedIndices] = useState<Set<number>>(new Set());

  const isIdea = node ? /ایده|idea/i.test(node.title) : false;

  useEffect(() => {
    if (isOpen && node) {
      fetchSubTopics();
    } else {
      setInsights([]);
      setSelectedIndices(new Set());
      setMerged(false);
      setError(null);
    }
  }, [isOpen, node?.id]);

  const fetchSubTopics = async () => {
    if (!node) return;
    setIsLoading(true);
    setError(null);
    setMerged(false);
    try {
      const data = await aiService.getSubTopics(node.title, node.note, node.importance);
      const list = data?.insights || [];
      setInsights(list);
      setSelectedIndices(new Set(list.map((_, i) => i)));
    } catch (err: any) {
      setError(err.response?.data?.error || (isFa ? 'خطا در برقراری ارتباط با سرویس هوش مصنوعی' : 'Failed to connect to AI service'));
    } finally {
      setIsLoading(false);
    }
  };

  const toggleIndex = (index: number) => {
    setSelectedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  const toggleSelectAll = () => {
    if (selectedIndices.size === insights.length) {
      setSelectedIndices(new Set());
    } else {
      setSelectedIndices(new Set(insights.map((_, i) => i)));
    }
  };

  const handleMerge = async () => {
    if (!node || insights.length === 0) return;
    const chosen = insights
      .map((item, idx) => ({ ...item, originalIndex: idx }))
      .filter((item) => selectedIndices.has(item.originalIndex));

    if (chosen.length === 0) {
      alert(isFa ? 'لطفاً حداقل یک مورد را برای اضافه شدن به گراف انتخاب کنید.' : 'Please select at least one item to add to the graph.');
      return;
    }

    setIsLoading(true);
    const parentX = node.posX || 0;
    const parentY = node.posY || 0;
    const activePage = useGraphStore.getState().pages.find((p) => p.id === useGraphStore.getState().activePageId);
    const isTreeOrFlowchart = activePage?.theme === 'matrix';
    const radius = Math.round(154 * (isTreeOrFlowchart ? 1.35 : 1.0));
    const count = chosen.length;

    for (let i = 0; i < count; i++) {
      const item = chosen[i];
      const angle = (2 * Math.PI * i) / count;
      const childX = Math.round(parentX + radius * Math.cos(angle));
      const childY = Math.round(parentY + radius * Math.sin(angle));
      const cleanTitle = cleanTopicTitle(item.topic, node.title);

      const newNode = await addNode(
        cleanTitle,
        item.importance || 7,
        item.description || '',
        childX,
        childY,
        isIdea ? (isFa ? ['مرحله-ایده', item.relationType] : ['Idea-Step', item.relationType]) : ['AI-Branch', item.relationType]
      );

      if (newNode) {
        await addEdge(node.id, newNode.id, item.relationType || (isIdea ? (isFa ? 'گام اجرایی' : 'Action Step') : (isFa ? 'زیرشاخه' : 'Subtopic')));
      }
    }

    setIsLoading(false);
    setMerged(true);
    setTimeout(() => onClose(), 1100);
  };

  if (!isOpen || !node) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className={`border rounded-2xl w-full max-w-2xl max-h-[88vh] flex flex-col overflow-hidden ${
        isLight
          ? 'bg-white border-sky-400 text-[#0F172A] shadow-2xl shadow-sky-950/20'
          : 'bg-[#111827] border-cyan-700/60 shadow-glow-cyan/20 text-slate-100'
      }`}>
        {/* Header */}
        <div className={`p-4 border-b flex items-center justify-between ${
          isLight
            ? 'border-[#CBD5E1] bg-gradient-to-r from-sky-50 via-white to-white'
            : 'border-slate-800 bg-gradient-to-r from-cyan-950/80 via-slate-900 to-slate-900'
        }`}>
          <div className="flex items-center gap-3">
            <div className={`p-2.5 rounded-xl border ${
              isLight
                ? 'bg-sky-50 text-sky-600 border-sky-200'
                : 'bg-cyan-950 text-cyan-400 border-cyan-800 shadow-glow-cyan/40'
            }`}>
              {isIdea ? <Lightbulb className="w-5 h-5 text-amber-500" /> : <Sparkles className="w-5 h-5" />}
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-sm font-extrabold ${isLight ? 'text-[#0B192C]' : 'text-slate-100'}`}>
                  {isIdea ? (isFa ? 'مراحل اجرایی و توسعه ایده' : 'Idea Development Steps') : (isFa ? 'گسترش شاخه‌ها و زیرمفاهیم' : 'Branch & Subtopic Expansion')}
                </h2>
                <Badge variant={isIdea ? 'amber' : 'cyan'}>
                  {isIdea ? (isFa ? 'مسیر ایده' : 'Idea Path') : (isFa ? 'شاخه‌بندی هوشمند' : 'Smart Branching')}
                </Badge>
              </div>
              <p className={`text-xs ${isLight ? 'text-[#475569]' : 'text-slate-400'}`}>
                {isFa ? 'مفهوم مبدا:' : 'Source Concept:'} <strong className={isLight ? 'text-sky-700 font-bold' : 'text-cyan-300'}>«{node.title}»</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${
              isLight
                ? 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
                : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'
            }`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-5 overflow-y-auto space-y-4 flex-1">
          {isLoading && insights.length === 0 ? (
            <div className="py-14 text-center space-y-4">
              <div className="w-10 h-10 border-3 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className={`text-sm font-semibold ${isLight ? 'text-[#0B192C]' : 'text-slate-200'}`}>
                  {isIdea ? (isFa ? 'در حال تدوین مراحل رسیدن به این ایده...' : 'Formulating steps to achieve this idea...') : (isFa ? 'در حال استخراج شاخه‌ها و مفاهیم تکمیلی...' : 'Extracting subtopics and concepts...')}
                </h4>
                <div className="flex items-center justify-center gap-2 text-xs text-sky-600 font-medium pt-1">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-sky-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-sky-500"></span>
                  </span>
                  <span className="animate-pulse">{isFa ? 'در حال بارگذاری...' : 'Loading...'}</span>
                </div>
              </div>
            </div>
          ) : error ? (
            <div className="p-4 bg-rose-950/40 border border-rose-800/80 rounded-2xl flex flex-col gap-3 text-rose-200 animate-fade-in shadow-lg">
              <div className="flex items-start gap-3">
                <div className="p-2 rounded-xl bg-rose-900/60 text-rose-400 border border-rose-800 shrink-0">
                  <AlertCircle className="w-5 h-5" />
                </div>
                <div className="flex-1 space-y-1">
                  <h4 className="font-bold text-sm text-rose-100">{isFa ? 'پیام هوش مصنوعی / خطا در ارتباط' : 'AI Message / Connection Error'}</h4>
                  <p className="text-xs text-rose-300 leading-relaxed">{error}</p>
                </div>
              </div>
              <div className="flex items-center justify-end gap-2 pt-2 border-t border-rose-900/50">
                <button
                  onClick={fetchSubTopics}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-100 border border-rose-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  {isFa ? 'تلاش مجدد' : 'Retry'}
                </button>
              </div>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <h3 className={`text-xs font-bold flex items-center gap-2 ${
                  isLight ? 'text-[#0B192C]' : 'text-slate-200'
                }`}>
                  <Layers className="w-4 h-4 text-sky-600" />
                  {isIdea ? (isFa ? 'گام‌ها و مراحل پیشنهادی' : 'Suggested Steps') : (isFa ? 'شاخه‌ها و عناوین پیشنهادی' : 'Suggested Subtopics')} ({selectedIndices.size} {isFa ? 'از' : 'of'} {insights.length} {isFa ? 'انتخاب شده' : 'selected'})
                </h3>
                <button
                  onClick={toggleSelectAll}
                  className="text-xs text-sky-600 hover:text-sky-700 font-bold underline"
                >
                  {selectedIndices.size === insights.length ? (isFa ? 'لغو انتخاب همه' : 'Deselect All') : (isFa ? 'انتخاب همه' : 'Select All')}
                </button>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
                {insights.map((item, idx) => {
                  const isChecked = selectedIndices.has(idx);
                  const cleanTitle = cleanTopicTitle(item.topic, node.title);

                  return (
                    <div
                      key={idx}
                      onClick={() => toggleIndex(idx)}
                      className={`rounded-xl p-3 space-y-1.5 border transition-all cursor-pointer select-none ${
                        isChecked
                          ? isLight
                            ? 'bg-[#EBF5FF] border-sky-400 shadow-sm'
                            : 'bg-cyan-950/35 border-cyan-500/70 shadow-[0_0_10px_rgba(6,182,212,0.12)]'
                          : isLight
                          ? 'bg-slate-50 border-[#CBD5E1] text-slate-400 opacity-70 hover:opacity-100'
                          : 'bg-slate-900/50 border-slate-800/80 text-slate-400 opacity-60 hover:opacity-90'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <div className="flex items-center gap-2 min-w-0">
                          <div className="text-sky-600 shrink-0">
                            {isChecked ? (
                              <CheckSquare className="w-4 h-4 text-sky-600" />
                            ) : (
                              <Square className="w-4 h-4 text-slate-400" />
                            )}
                          </div>
                          <span
                            className={`text-xs font-bold truncate ${
                              isChecked
                                ? isLight ? 'text-[#0B192C]' : 'text-slate-100'
                                : 'text-slate-400 line-through decoration-slate-400'
                            }`}
                          >
                            {cleanTitle}
                          </span>
                        </div>

                        <div className="flex items-center gap-1 shrink-0">
                          <span className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                            isLight
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : 'bg-slate-800 text-cyan-300 border-slate-700'
                          }`}>
                            {item.relationType}
                          </span>
                          <span className={`flex items-center text-[10px] font-bold px-1.5 py-0.5 rounded border ${
                            isLight
                              ? 'text-amber-800 bg-amber-50 border-amber-300'
                              : 'text-amber-400 bg-amber-950/60 border-amber-900'
                          }`}>
                            <Star className="w-2.5 h-2.5 fill-current mr-0.5" />
                            {item.importance}
                          </span>
                        </div>
                      </div>

                      {item.description && (
                        <p className={`text-xs leading-relaxed font-normal pr-6 ${
                          isLight ? 'text-[#475569]' : 'text-slate-400'
                        }`}>
                          {item.description}
                        </p>
                      )}
                    </div>
                  );
                })}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className={`p-4 border-t flex items-center justify-between gap-2 ${
          isLight ? 'border-[#CBD5E1] bg-[#F8FAFD]' : 'border-slate-800 bg-slate-900/60'
        }`}>
          <Button variant="ghost" size="sm" onClick={onClose}>
            {isFa ? 'انصراف' : 'Cancel'}
          </Button>

          {insights.length > 0 && (
            <Button
              variant="cyber"
              size="md"
              disabled={isLoading || merged || selectedIndices.size === 0}
              onClick={handleMerge}
              className="gap-2"
            >
              {merged ? (
                <>
                  <CheckCircle className="w-4 h-4 text-emerald-400" />
                  {isFa ? 'ادغام با موفقیت انجام شد!' : 'Merged successfully!'}
                </>
              ) : (
                <>
                  <PlusCircle className="w-4 h-4" />
                  {isFa ? `افزودن ${selectedIndices.size} مورد انتخاب‌شده به گراف` : `Add ${selectedIndices.size} selected items to graph`}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
