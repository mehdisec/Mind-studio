import React, { useState, useEffect, useMemo } from 'react';
import {
  MindNode,
  AIInsight,
  AIDeepDiveResult,
  AIRoadmapItem,
  AIRoadmapResult,
} from '../../types';
import { aiService } from '../../services/aiService';
import { useGraphStore } from '../../stores/useGraphStore';
import { Button } from '../common/Button';
import { Badge } from '../common/Badge';
import {
  Sparkles,
  X,
  PlusCircle,
  HelpCircle,
  Layers,
  Star,
  CheckCircle,
  AlertCircle,
  CheckSquare,
  Square,
  GitBranch,
  ArrowRight,
  Compass,
  Milestone,
  Check,
  RotateCcw,
} from 'lucide-react';

import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTranslation } from '../../utils/i18n';

interface AIDeepDiveModalProps {
  node: MindNode | null;
  isOpen: boolean;
  onClose: () => void;
}

// Client-side helper to ensure clean standalone titles without parent prefix
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

export const AIDeepDiveModal: React.FC<AIDeepDiveModalProps> = ({
  node,
  isOpen,
  onClose,
}) => {
  const { language, themeMode } = useSettingsStore();
  const isLight = themeMode === 'light';
  const { t, isRtl } = useTranslation(language);
  const isFa = language === 'fa';

  const { addNode, addEdge, nodes: allNodes, edges: allEdges } = useGraphStore();

  // Active AI Tab: 'foundational' (Foundational Analysis) | 'roadmap' (Roadmap & Execution Phases)
  const [activeTab, setActiveTab] = useState<'foundational' | 'roadmap'>('foundational');

  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [merged, setMerged] = useState(false);

  // Tab 1: Foundational Analysis State
  const [foundationalResult, setFoundationalResult] = useState<AIDeepDiveResult | null>(null);
  const [selectedFoundationalIndices, setSelectedFoundationalIndices] = useState<Set<number>>(new Set());

  // Tab 2: Roadmap & Execution Milestones State
  const [roadmapResult, setRoadmapResult] = useState<AIRoadmapResult | null>(null);
  const [selectedRoadmapIndices, setSelectedRoadmapIndices] = useState<Set<number>>(new Set());

  // Compute Lineage Path (ancestor chain) of the target node
  const lineagePath = useMemo(() => {
    if (!node) return [];
    const path: string[] = [node.title];
    const visited = new Set<string>([node.id]);

    let currentId = node.id;
    for (let depth = 0; depth < 3; depth++) {
      const incoming = allEdges.find((e) => e.targetNodeId === currentId && !visited.has(e.sourceNodeId));
      if (!incoming) break;
      const parentNode = allNodes.find((n) => n.id === incoming.sourceNodeId);
      if (parentNode) {
        path.unshift(parentNode.title);
        visited.add(parentNode.id);
        currentId = parentNode.id;
      } else {
        break;
      }
    }
    return path;
  }, [node, allNodes, allEdges]);

  // Fetch or re-fetch on open or tab change
  useEffect(() => {
    if (isOpen && node) {
      setError(null);
      setMerged(false);

      if (activeTab === 'foundational') {
        if (!foundationalResult) {
          fetchFoundational();
        }
      } else {
        if (!roadmapResult) {
          fetchRoadmap();
        }
      }
    }
  }, [isOpen, node, activeTab]);

  // Reset when a different node is opened
  useEffect(() => {
    if (node) {
      setFoundationalResult(null);
      setRoadmapResult(null);
      setSelectedFoundationalIndices(new Set());
      setSelectedRoadmapIndices(new Set());
      setMerged(false);
    }
  }, [node?.id]);

  const fetchFoundational = async () => {
    if (!node) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await aiService.getDeepDive(node.title, node.note, node.importance);
      setFoundationalResult(data);
      if (data?.insights && data.insights.length > 0) {
        setSelectedFoundationalIndices(new Set(data.insights.map((_, i) => i)));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || (isFa ? 'خطا در برقراری ارتباط با سرور هوش مصنوعی' : 'Failed to connect to AI server'));
    } finally {
      setIsLoading(false);
    }
  };

  const fetchRoadmap = async () => {
    if (!node) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await aiService.getLineageExpansion(node.title, lineagePath, node.note);
      setRoadmapResult(data);
      if (data?.roadmap && data.roadmap.length > 0) {
        setSelectedRoadmapIndices(new Set(data.roadmap.map((_, i) => i)));
      }
    } catch (err: any) {
      setError(err.response?.data?.error || (isFa ? 'خطا در برقراری ارتباط با سرور هوش مصنوعی' : 'Failed to connect to AI server'));
    } finally {
      setIsLoading(false);
    }
  };

  if (!isOpen || !node) return null;

  // Toggle Checkboxes for Tab 1
  const toggleFoundationalIndex = (index: number) => {
    setSelectedFoundationalIndices((prev) => {
      const updated = new Set(prev);
      if (updated.has(index)) updated.delete(index);
      else updated.add(index);
      return updated;
    });
  };

  const toggleSelectAllFoundational = () => {
    if (!foundationalResult?.insights) return;
    if (selectedFoundationalIndices.size === foundationalResult.insights.length) {
      setSelectedFoundationalIndices(new Set());
    } else {
      setSelectedFoundationalIndices(new Set(foundationalResult.insights.map((_, i) => i)));
    }
  };

  // Toggle Checkboxes for Tab 2 (Roadmap)
  const toggleRoadmapIndex = (index: number) => {
    setSelectedRoadmapIndices((prev) => {
      const updated = new Set(prev);
      if (updated.has(index)) updated.delete(index);
      else updated.add(index);
      return updated;
    });
  };

  const toggleSelectAllRoadmap = () => {
    if (!roadmapResult?.roadmap) return;
    if (selectedRoadmapIndices.size === roadmapResult.roadmap.length) {
      setSelectedRoadmapIndices(new Set());
    } else {
      setSelectedRoadmapIndices(new Set(roadmapResult.roadmap.map((_, i) => i)));
    }
  };

  // Merge Action: Foundational
  const handleMergeFoundational = async () => {
    if (!foundationalResult?.insights) return;
    const chosen = foundationalResult.insights
      .map((item, idx) => ({ ...item, originalIndex: idx }))
      .filter((item) => selectedFoundationalIndices.has(item.originalIndex));

    if (chosen.length === 0) {
      alert(isFa ? 'لطفاً حداقل یک مفهوم را برای اضافه شدن به گراف انتخاب کنید.' : 'Please select at least one concept to add to the graph.');
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
      const insight = chosen[i];
      const angle = (2 * Math.PI * i) / count;
      const childX = Math.round(parentX + radius * Math.cos(angle));
      const childY = Math.round(parentY + radius * Math.sin(angle));

      const cleanTitle = cleanTopicTitle(insight.topic, node.title);

      const newNode = await addNode(
        cleanTitle,
        insight.importance,
        insight.description,
        childX,
        childY,
        ['AI-Insight', insight.relationType]
      );

      if (newNode) {
        await addEdge(node.id, newNode.id, insight.relationType);
      }
    }

    setIsLoading(false);
    setMerged(true);
    setTimeout(() => onClose(), 1200);
  };

  // Merge Action: Roadmap Milestones
  const handleMergeRoadmap = async () => {
    if (!roadmapResult?.roadmap) return;
    const chosen = roadmapResult.roadmap
      .map((item, idx) => ({ ...item, originalIndex: idx }))
      .filter((item) => selectedRoadmapIndices.has(item.originalIndex));

    if (chosen.length === 0) {
      alert(isFa ? 'لطفاً حداقل یک گام یا مایل‌استون را برای اضافه شدن به گراف انتخاب کنید.' : 'Please select at least one milestone to add to the graph.');
      return;
    }

    setIsLoading(true);
    const parentX = node.posX || 0;
    const parentY = node.posY || 0;
    const activePage = useGraphStore.getState().pages.find((p) => p.id === useGraphStore.getState().activePageId);
    const isTreeOrFlowchart = activePage?.theme === 'matrix';
    const radius = Math.round(161 * (isTreeOrFlowchart ? 1.35 : 1.0));
    const count = chosen.length;

    for (let i = 0; i < count; i++) {
      const item = chosen[i];
      const angle = (2 * Math.PI * i) / count;
      const childX = Math.round(parentX + radius * Math.cos(angle));
      const childY = Math.round(parentY + radius * Math.sin(angle));

      const cleanTitle = cleanTopicTitle(item.title, node.title);

      const newNode = await addNode(
        cleanTitle,
        item.importance || 8,
        `**${item.phase}**\n\n${item.brief}`,
        childX,
        childY,
        isFa ? ['نقشه-راه', item.phase.split(':')[0] || 'فاز اجرایی'] : ['Roadmap', item.phase.split(':')[0] || 'Execution Phase']
      );

      if (newNode) {
        await addEdge(node.id, newNode.id, item.phase.split(':')[0] || (isFa ? 'گام اجرایی' : 'Milestone'));
      }
    }

    setIsLoading(false);
    setMerged(true);
    setTimeout(() => onClose(), 1200);
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-fade-in select-none"
      dir={isRtl ? 'rtl' : 'ltr'}
    >
      <div className={`${isLight ? 'bg-[#F8FAFD] border-cyan-300 text-slate-800 shadow-xl' : 'bg-[#111827] border-cyan-700/60 text-slate-100 shadow-glow-cyan/20'} border rounded-2xl w-full max-w-3xl max-h-[90vh] flex flex-col overflow-hidden`}>
        {/* 1. Modal Header */}
        <div className={`p-4 border-b flex items-center justify-between ${isLight ? 'bg-cyan-50/70 border-slate-200' : 'border-slate-800 bg-gradient-to-r from-cyan-950/70 via-slate-900 to-indigo-950/70'}`}>
          <div className="flex items-center gap-2.5">
            <div className={`p-2.5 rounded-xl border ${isLight ? 'bg-cyan-100 text-cyan-700 border-cyan-300' : 'bg-cyan-950 text-cyan-400 border-cyan-800 shadow-glow-cyan/40'}`}>
              <Sparkles className="w-5 h-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h2 className={`text-base font-bold ${isLight ? 'text-slate-900' : 'text-slate-100'}`}>{isFa ? 'استودیوی تحلیل و گسترش هوش مصنوعی' : 'AI Deep-Dive & Expansion Studio'}</h2>
                <Badge variant="cyan">Gemini 2.5 Flash</Badge>
              </div>
              <p className={`text-xs ${isLight ? 'text-slate-500' : 'text-slate-400'}`}>
                {isFa ? 'مفهوم هدف:' : 'Target Concept:'} <strong className={isLight ? 'text-cyan-800' : 'text-cyan-300'}>«{node.title}»</strong>
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className={`p-1.5 rounded-lg transition-colors ${isLight ? 'text-slate-500 hover:text-slate-800 hover:bg-slate-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800'}`}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* 2. Dual Modes Tab Navigation */}
        <div className={`grid grid-cols-2 p-1.5 border-b text-xs gap-1.5 ${isLight ? 'bg-slate-100 border-slate-200' : 'bg-[#090d16] border-slate-800'}`}>
          <button
            onClick={() => setActiveTab('foundational')}
            className={`py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'foundational'
                ? 'bg-cyan-600 text-white shadow-sm'
                : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Layers className="w-4 h-4" />
            <span>{isFa ? '۱. تحلیل بنیادی و پرسش‌های سقراطی' : '1. Foundational Analysis & Socratic Inquiries'}</span>
          </button>

          <button
            onClick={() => setActiveTab('roadmap')}
            className={`py-2 rounded-xl font-bold transition-all flex items-center justify-center gap-2 ${
              activeTab === 'roadmap'
                ? 'bg-cyan-600 text-white shadow-sm'
                : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-200' : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
            }`}
          >
            <Compass className="w-4 h-4" />
            <span>{isFa ? '۲. نقشه راه و فازهای اجرایی رسیدن به ایده' : '2. Roadmap & Execution Phases'}</span>
          </button>
        </div>

        {/* 3. Modal Body Content */}
        <div className="p-5 overflow-y-auto space-y-5 flex-1">
          {isLoading && !foundationalResult && !roadmapResult ? (
            <div className="py-16 text-center space-y-4">
              <div className="w-12 h-12 border-4 border-cyan-500 border-t-transparent rounded-full animate-spin mx-auto" />
              <div className="space-y-1">
                <h4 className="text-sm font-semibold text-slate-200">
                  {isFa ? 'در حال استنتاج هوشمند نقشه راه با مدل Gemini...' : 'Synthesizing intelligent roadmap with Gemini model...'}
                </h4>
                <p className="text-xs text-slate-400">
                  {activeTab === 'foundational'
                    ? (isFa ? 'تدوین ۱۰ عنوان اصلی مستقل و ۵ پرسش سقراطی' : 'Drafting 10 foundational topics and 5 Socratic questions')
                    : (isFa ? 'تدوین مایل‌استون‌ها، فازهای گام‌به‌گام و اقدامات اجرایی لازم' : 'Formulating milestones, step-by-step phases, and actionable tasks')}
                </p>
                <div className="flex items-center justify-center gap-2 text-xs text-cyan-400/90 font-medium pt-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-cyan-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-cyan-500"></span>
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
                  onClick={activeTab === 'foundational' ? fetchFoundational : fetchRoadmap}
                  disabled={isLoading}
                  className="px-3 py-1.5 rounded-xl bg-rose-900/60 hover:bg-rose-800 text-rose-100 border border-rose-700/80 text-xs font-semibold flex items-center gap-1.5 transition-all shadow-sm"
                >
                  <RotateCcw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
                  {isFa ? 'تلاش مجدد' : 'Retry'}
                </button>
              </div>
            </div>
          ) : (
            <>
              {/* TAB 1: FOUNDATIONAL ANALYSIS */}
              {activeTab === 'foundational' && foundationalResult && (
                <div className="space-y-5 animate-fade-in">
                  {/* Sub-Concepts Grid */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <Layers className="w-4 h-4 text-cyan-400" />
                        {isFa ? 'عناوین اصلی پیشنهادی' : 'Suggested Core Topics'} ({selectedFoundationalIndices.size} {isFa ? 'از' : 'of'}{' '}
                        {foundationalResult.insights?.length || 0} {isFa ? 'انتخاب شده' : 'selected'})
                      </h3>
                      <button
                        onClick={toggleSelectAllFoundational}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline"
                      >
                        {selectedFoundationalIndices.size === (foundationalResult.insights?.length || 0)
                          ? (isFa ? 'لغو انتخاب همه' : 'Deselect All')
                          : (isFa ? 'انتخاب همه' : 'Select All')}
                      </button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                      {foundationalResult.insights?.map((item, idx) => {
                        const isChecked = selectedFoundationalIndices.has(idx);
                        const cleanTitle = cleanTopicTitle(item.topic, node.title);

                        return (
                          <div
                            key={idx}
                            onClick={() => toggleFoundationalIndex(idx)}
                            className={`rounded-xl p-3 space-y-1.5 border transition-all cursor-pointer select-none ${
                              isChecked
                                ? 'bg-cyan-950/40 border-cyan-500/80 shadow-[0_0_12px_rgba(6,182,212,0.15)]'
                                : 'bg-slate-900/50 border-slate-800/80 text-slate-400 opacity-60 hover:opacity-90'
                            }`}
                          >
                            <div className="flex items-center justify-between gap-2">
                              <div className="flex items-center gap-2 min-w-0">
                                <div className="text-cyan-400 shrink-0">
                                  {isChecked ? (
                                    <CheckSquare className="w-4 h-4 text-cyan-400" />
                                  ) : (
                                    <Square className="w-4 h-4 text-slate-500" />
                                  )}
                                </div>
                                <span
                                  className={`text-xs font-bold truncate ${
                                    isChecked ? 'text-slate-100' : 'text-slate-400 line-through decoration-slate-600'
                                  }`}
                                >
                                  {cleanTitle}
                                </span>
                              </div>

                              <div className="flex items-center gap-1 shrink-0">
                                <span className="text-[10px] bg-slate-800 text-cyan-300 border border-slate-700 px-1.5 py-0.5 rounded">
                                  {item.relationType}
                                </span>
                                <span className="flex items-center text-[10px] font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-900">
                                  <Star className="w-2.5 h-2.5 fill-current mr-0.5" />
                                  {item.importance}
                                </span>
                              </div>
                            </div>

                            <p className="text-xs text-slate-400 leading-relaxed font-light pr-6">
                              {item.description}
                            </p>
                          </div>
                        );
                      })}
                    </div>
                  </div>

                  {/* Socratic Questions */}
                  {foundationalResult.socraticQuestions && foundationalResult.socraticQuestions.length > 0 && (
                    <div className="space-y-3 pt-2">
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <HelpCircle className="w-4 h-4 text-amber-400" />
                        {isFa ? '۵ پرسش بنیادین سقراطی (Socratic Reflection)' : '5 Socratic Core Questions (Socratic Reflection)'}
                      </h3>

                      <div className="space-y-2 bg-slate-950/70 border border-slate-800 rounded-xl p-3.5">
                        {foundationalResult.socraticQuestions.map((q, idx) => (
                          <div
                            key={idx}
                            className="flex items-start gap-2.5 text-xs text-slate-300 leading-relaxed"
                          >
                            <span className="w-5 h-5 rounded-full bg-amber-950/80 text-amber-400 border border-amber-800/80 flex items-center justify-center shrink-0 font-bold text-[10px]">
                              {idx + 1}
                            </span>
                            <p className="flex-1 pt-0.5">{q}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* TAB 2: ROADMAP & EXECUTION MILESTONES */}
              {activeTab === 'roadmap' && roadmapResult && (
                <div className="space-y-5 animate-fade-in">
                  {/* Lineage Path Breadcrumb */}
                  <div className="p-3 bg-slate-900/90 border border-slate-700/80 rounded-xl space-y-1.5">
                    <div className="flex items-center justify-between text-xs font-semibold text-slate-300">
                      <span className="flex items-center gap-1.5 text-cyan-400">
                        <GitBranch className="w-3.5 h-3.5" />
                        {isFa ? 'مسیر تکاملی مفهوم در گراف:' : 'Evolutionary Concept Path in Graph:'}
                      </span>
                      <span className="text-[11px] text-slate-400 font-normal">
                        {isFa ? 'زنجیره مفاهیم بالادستی' : 'Upstream Concept Lineage'}
                      </span>
                    </div>

                    <div className="flex flex-wrap items-center gap-1.5 pt-1">
                      {lineagePath.map((item, idx) => (
                        <React.Fragment key={idx}>
                          <span
                            className={`text-xs px-2.5 py-1 rounded-lg border font-medium ${
                              idx === lineagePath.length - 1
                                ? 'bg-cyan-950 border-cyan-500 text-cyan-200 font-bold shadow-sm'
                                : 'bg-slate-800/80 border-slate-700 text-slate-300'
                            }`}
                          >
                            {item}
                          </span>
                          {idx < lineagePath.length - 1 && (
                            <ArrowRight className="w-3 h-3 text-slate-500 rotate-180" />
                          )}
                        </React.Fragment>
                      ))}
                    </div>
                  </div>

                  {/* Flexible Milestones List */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="text-sm font-bold text-slate-100 flex items-center gap-2">
                        <Milestone className="w-4 h-4 text-emerald-400" />
                        {isFa ? 'فازها و مایل‌استون‌های اجرایی' : 'Execution Phases & Milestones'} ({selectedRoadmapIndices.size} {isFa ? 'از' : 'of'}{' '}
                        {roadmapResult.roadmap?.length || 0} {isFa ? 'انتخاب شده' : 'selected'})
                      </h3>
                      <button
                        onClick={toggleSelectAllRoadmap}
                        className="text-xs text-cyan-400 hover:text-cyan-300 font-medium underline"
                      >
                        {selectedRoadmapIndices.size === (roadmapResult.roadmap?.length || 0)
                          ? (isFa ? 'لغو انتخاب همه' : 'Deselect All')
                          : (isFa ? 'انتخاب همه' : 'Select All')}
                      </button>
                    </div>

                    <div className="space-y-2.5">
                      {roadmapResult.roadmap?.map((item, idx) => {
                        const isChecked = selectedRoadmapIndices.has(idx);
                        const cleanTitle = cleanTopicTitle(item.title, node.title);

                        return (
                          <div
                            key={idx}
                            onClick={() => toggleRoadmapIndex(idx)}
                            className={`rounded-xl p-3.5 border transition-all cursor-pointer select-none flex items-start gap-3 ${
                              isChecked
                                ? 'bg-gradient-to-r from-cyan-950/40 via-slate-900 to-slate-900 border-cyan-500/80 shadow-[0_0_14px_rgba(6,182,212,0.18)]'
                                : 'bg-slate-900/50 border-slate-800/80 text-slate-400 opacity-60 hover:opacity-90'
                            }`}
                          >
                            {/* Checkbox */}
                            <div className="text-cyan-400 shrink-0 pt-0.5">
                              {isChecked ? (
                                <CheckSquare className="w-4.5 h-4.5 text-cyan-400" />
                              ) : (
                                <Square className="w-4.5 h-4.5 text-slate-500" />
                              )}
                            </div>

                            {/* Content */}
                            <div className="flex-1 min-w-0 space-y-1">
                              <div className="flex items-center justify-between gap-2 flex-wrap">
                                <div className="flex items-center gap-2">
                                  <span className="text-[11px] font-bold px-2 py-0.5 rounded-md bg-cyan-950 text-cyan-300 border border-cyan-800 shrink-0">
                                    {item.phase}
                                  </span>
                                  <h4
                                    className={`text-xs font-bold ${
                                      isChecked
                                        ? 'text-slate-100'
                                        : 'text-slate-400 line-through decoration-slate-600'
                                    }`}
                                  >
                                    {cleanTitle}
                                  </h4>
                                </div>

                                <span className="flex items-center text-[10px] font-bold text-amber-400 bg-amber-950/60 px-2 py-0.5 rounded border border-amber-900 shrink-0">
                                  <Star className="w-2.5 h-2.5 fill-current mr-0.5" />
                                  {isFa ? 'اهمیت:' : 'Importance:'} {item.importance}/10
                                </span>
                              </div>

                              <p className="text-xs text-slate-300 leading-relaxed font-light pt-0.5">
                                {item.brief}
                              </p>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        {/* 4. Modal Footer with Merge Action */}
        <div className="p-4 border-t border-slate-800 bg-slate-900/60 flex items-center justify-between gap-2">
          <Button variant="ghost" size="sm" onClick={onClose}>
            {isFa ? 'بستن' : 'Close'}
          </Button>

          {activeTab === 'foundational' && foundationalResult && (
            <Button
              variant="cyber"
              size="md"
              disabled={isLoading || merged || selectedFoundationalIndices.size === 0}
              onClick={handleMergeFoundational}
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
                  {isFa ? `ادغام ${selectedFoundationalIndices.size} مفهوم انتخاب‌شده در بوم گراف` : `Merge ${selectedFoundationalIndices.size} selected concepts into canvas`}
                </>
              )}
            </Button>
          )}

          {activeTab === 'roadmap' && roadmapResult && (
            <Button
              variant="cyber"
              size="md"
              disabled={isLoading || merged || selectedRoadmapIndices.size === 0}
              onClick={handleMergeRoadmap}
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
                  {isFa ? `ادغام ${selectedRoadmapIndices.size} فاز اجرایی انتخاب‌شده در بوم گراف` : `Merge ${selectedRoadmapIndices.size} selected phases into canvas`}
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </div>
  );
};
