import React, { useState, useMemo, useEffect, useRef } from 'react';
import { useGraphStore } from '../../stores/useGraphStore';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTranslation } from '../../utils/i18n';
import { MindNode } from '../../types';
import { Button } from '../common/Button';
import {
  exportMindmapToMarkdown,
  parseMarkdownToMindmap,
  downloadFile,
} from '../../utils/mindmapMarkdown';
import {
  Search,
  Star,
  Sparkles,
  FileEdit,
  Trash2,
  Activity,
  Layers,
  X,
  Tag as TagIcon,
  Eye,
  CheckCircle2,
  Filter,
  Save,
  Check,
  Loader2,
  HelpCircle,
  Download,
  Upload,
  FileText,
} from 'lucide-react';

interface SidebarProps {
  onEditNode: (node: MindNode) => void;
  onOpenSubTopics?: (node: MindNode) => void;
  onOpenSocratic?: (node: MindNode) => void;
  onDeepDiveNode?: (node: MindNode) => void;
}

export const Sidebar: React.FC<SidebarProps> = ({
  onEditNode,
  onOpenSubTopics,
  onOpenSocratic,
  onDeepDiveNode,
}) => {
  const {
    pages,
    activePageId,
    nodes,
    edges,
    selectedNodeId,
    setSelectedNodeId,
    searchQuery,
    setSearchQuery,
    activeTagFilter,
    setActiveTagFilter,
    deleteNode,
    updateNode,
    addNode,
    addEdge,
    fetchGraph,
  } = useGraphStore();

  const { language, themeMode } = useSettingsStore();
  const { t, isRtl } = useTranslation(language);
  const isLight = themeMode === 'light';

  // Active Tab: 'list' | 'tags' | 'inspector' | 'export'
  const [activeTab, setActiveTab] = useState<'list' | 'tags' | 'inspector' | 'export'>('list');

  // Inline Note Editor state in Inspector Tab
  const [inspectorNote, setInspectorNote] = useState('');
  const [isSavingNote, setIsSavingNote] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const selectedNode = useMemo(
    () => nodes.find((n) => n.id === selectedNodeId) || null,
    [nodes, selectedNodeId]
  );

  // Extract all unique tags and count of nodes per tag
  const { tagCounts, untaggedCount, allTags } = useMemo(() => {
    const counts: { [tag: string]: number } = {};
    let untagged = 0;
    const tagsSet = new Set<string>();

    nodes.forEach((node) => {
      const safeTags = Array.isArray(node.tags)
        ? node.tags
        : typeof node.tags === 'string'
        ? (node.tags as string).replace(/[\[\]"]/g, '').split(',').map((t) => t.trim()).filter(Boolean)
        : [];

      if (safeTags.length === 0) {
        untagged += 1;
      } else {
        safeTags.forEach((tag) => {
          tagsSet.add(tag);
          counts[tag] = (counts[tag] || 0) + 1;
        });
      }
    });

    return {
      tagCounts: counts,
      untaggedCount: untagged,
      allTags: Array.from(tagsSet).sort(),
    };
  }, [nodes]);

  // Filtered nodes based on search and active tag filter
  const filteredNodes = useMemo(() => {
    return nodes.filter((node) => {
      const q = searchQuery.toLowerCase().trim();
      const matchQuery =
        !q ||
        node.title.toLowerCase().includes(q) ||
        (node.note && node.note.toLowerCase().includes(q)) ||
        (Array.isArray(node.tags) && node.tags.some((t) => t.toLowerCase().includes(q)));

      const matchTag =
        !activeTagFilter ||
        (Array.isArray(node.tags) && node.tags.includes(activeTagFilter));

      return matchQuery && matchTag;
    });
  }, [nodes, searchQuery, activeTagFilter]);

  // Tags filtered by search query
  const filteredTags = useMemo(() => {
    if (!searchQuery.trim()) return allTags;
    const q = searchQuery.toLowerCase().trim();
    return allTags.filter((t) => t.toLowerCase().includes(q));
  }, [allTags, searchQuery]);

  // Connected count for selected node
  const connectedEdgesCount = useMemo(() => {
    if (!selectedNodeId) return 0;
    return edges.filter(
      (e) => e.sourceNodeId === selectedNodeId || e.targetNodeId === selectedNodeId
    ).length;
  }, [edges, selectedNodeId]);

  // Sync inspectorNote when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      setInspectorNote(selectedNode.note || '');
      setSaveSuccess(false);
    }
  }, [selectedNode?.id, selectedNode?.note]);

  const handleSaveInspectorNote = async () => {
    if (!selectedNode) return;
    setIsSavingNote(true);
    try {
      await updateNode(selectedNode.id, {
        note: inspectorNote,
      });
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 2500);
    } catch (err) {
      console.error('Failed to save note:', err);
    } finally {
      setIsSavingNote(false);
    }
  };

  // Node Single Click: Select node
  const handleNodeClick = (node: MindNode) => {
    setSelectedNodeId(node.id);
  };

  // Node Double Click: Open Note Editor Modal
  const handleNodeDoubleClick = (node: MindNode) => {
    setSelectedNodeId(node.id);
    onEditNode(node);
  };

  // Tag Click Handler: Toggle active tag filter
  const handleTagClick = (tag: string) => {
    if (activeTagFilter === tag) {
      setActiveTagFilter(null);
    } else {
      setActiveTagFilter(tag);
    }
  };

  const [isImporting, setIsImporting] = useState(false);
  const jsonFileInputRef = useRef<HTMLInputElement>(null);
  const mdFileInputRef = useRef<HTMLInputElement>(null);

  const activePage = useMemo(
    () => pages.find((p) => p.id === activePageId) || null,
    [pages, activePageId]
  );

  const handleExportMarkdown = () => {
    const pageTitle = activePage?.title || 'MindMap';
    const md = exportMindmapToMarkdown(pageTitle, nodes, edges);
    const filename = `${pageTitle.toLowerCase().replace(/\s+/g, '_')}.md`;
    downloadFile(md, filename);
  };

  const handleExportJSON = () => {
    const pageTitle = activePage?.title || 'MindMap';
    const data = {
      page: activePage,
      nodes,
      edges,
      version: '2.0',
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(data, null, 2);
    downloadFile(jsonStr, `${pageTitle.toLowerCase().replace(/\s+/g, '_')}.json`, 'application/json');
  };

  const handleMdFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsImporting(true);
        const mdText = event.target?.result as string;
        const { items } = parseMarkdownToMindmap(mdText);

        if (items.length === 0) {
          alert(isRtl ? 'هیچ مفهومی در فایل مارک‌داون یافت نشد.' : 'No concepts found in markdown file.');
          return;
        }

        const idMap = new Map<string, string>();
        const totalItems = items.length;

        for (let i = 0; i < totalItems; i++) {
          const item = items[i];
          const angle = (i / totalItems) * 2 * Math.PI;
          const radius = item.parentId ? 240 + (item.level || 1) * 120 : 0;
          const posX = Math.round(Math.cos(angle) * radius + (Math.random() - 0.5) * 40);
          const posY = Math.round(Math.sin(angle) * radius + (Math.random() - 0.5) * 40);

          const created = await addNode(
            item.title,
            item.importance || 5,
            item.note || '',
            posX,
            posY,
            item.tags || []
          );

          if (created) {
            idMap.set(item.id, created.id);
            if (item.parentId && idMap.has(item.parentId)) {
              const parentDbId = idMap.get(item.parentId)!;
              await addEdge(parentDbId, created.id);
            }
          }
        }

        if (activePageId) {
          await fetchGraph(activePageId);
        }
        alert(isRtl ? 'فایل مارک‌داون با موفقیت به نقشه ذهنی اضافه شد.' : 'Markdown imported successfully into graph.');
      } catch (err) {
        console.error('Failed to import markdown:', err);
        alert(isRtl ? 'خطا در بارگذاری فایل مارک‌داون.' : 'Error importing markdown.');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  const handleJsonFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async (event) => {
      try {
        setIsImporting(true);
        const json = JSON.parse(event.target?.result as string);
        const importedNodes = json.nodes || [];
        const importedEdges = json.edges || [];

        if (importedNodes.length === 0) {
          alert(isRtl ? 'فایل حاوی نود معتبر نمی‌باشد.' : 'No nodes found in JSON file.');
          return;
        }

        const idMap = new Map<string, string>();
        for (const n of importedNodes) {
          const created = await addNode(
            n.title || 'Concept',
            n.importance || 5,
            n.note || '',
            n.posX || 0,
            n.posY || 0,
            n.tags || [],
            n.nodeType || 'text',
            n.imageUrl || '',
            n.imageSize || 'small'
          );
          if (created) {
            idMap.set(n.id, created.id);
          }
        }

        for (const e of importedEdges) {
          const s = idMap.get(e.sourceNodeId);
          const t = idMap.get(e.targetNodeId);
          if (s && t) {
            await addEdge(s, t, e.label || undefined);
          }
        }

        if (activePageId) {
          await fetchGraph(activePageId);
        }
        alert(isRtl ? 'پروژه با موفقیت بارگذاری شد.' : 'Project JSON imported successfully.');
      } catch (err) {
        console.error('Failed to import JSON:', err);
        alert(isRtl ? 'خطا در بارگذاری فایل پروژه.' : 'Error importing JSON file.');
      } finally {
        setIsImporting(false);
      }
    };
    reader.readAsText(file);
    e.target.value = '';
  };

  return (
    <aside
      dir="rtl"
      className={`w-60 md:w-64 flex flex-col h-full shrink-0 z-20 select-none shadow-xl transition-all duration-300 border-l ${
        isLight
          ? 'bg-[#F8FAFD] border-[#CBD5E1] text-[#0B192C]'
          : 'bg-[#0c101d] border-slate-800/80 text-slate-100'
      }`}
    >
      {/* 1. Header & Search Bar */}
      <div
        className={`p-2.5 border-b backdrop-blur-md space-y-2 ${
          isLight ? 'bg-white/95 border-[#CBD5E1]' : 'bg-[#0f172a]/70 border-slate-800/90'
        }`}
      >
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-1.5 min-w-0">
            <div className="w-5 h-5 rounded-lg bg-sky-500/20 border border-sky-500/40 flex items-center justify-center text-sky-600 shrink-0">
              <Layers className="w-3 h-3" />
            </div>
            <h2 className={`text-xs font-extrabold truncate ${isLight ? 'text-[#0B192C]' : 'text-slate-100'}`}>
              {t.allConcepts}
            </h2>
          </div>
          <span
            className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
              isLight
                ? 'text-sky-900 bg-sky-100 border-sky-300 font-bold'
                : 'text-cyan-400 bg-cyan-950/80 border-cyan-800/80'
            }`}
          >
            {nodes.length} {t.nodesCountSuffix}
          </span>
        </div>

        {/* Search Input with quick clear */}
        <div className="relative">
          <Search
            className={`w-3.5 h-3.5 absolute top-1/2 -translate-y-1/2 right-3 ${isLight ? 'text-slate-400' : 'text-slate-500'}`}
          />
          <input
            type="text"
            dir="auto"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder={t.searchPlaceholder}
            className={`w-full rounded-xl py-1.5 text-xs transition-all focus:outline-none focus:ring-1 focus:ring-sky-500 pr-8 pl-8 ${
              isLight
                ? 'bg-white border border-[#CBD5E1] text-[#0F172A] placeholder-slate-400 focus:border-sky-600 shadow-sm'
                : 'bg-slate-900/90 border border-slate-700/80 text-slate-200 placeholder-slate-500 focus:border-cyan-500'
            }`}
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-200 p-0.5 left-2.5"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          )}
        </div>

        {/* Active Tag Filter Indicator */}
        {activeTagFilter && (
          <div
            className={`flex items-center justify-between rounded-lg px-2.5 py-1.5 text-xs shadow-sm animate-fadeIn border ${
              isLight
                ? 'bg-sky-100 border-sky-300 text-sky-900 font-medium'
                : 'bg-cyan-950/70 border-cyan-700/90 text-cyan-300'
            }`}
          >
            <span className="flex items-center gap-1.5">
              <Filter className="w-3 h-3 text-sky-600" />
              <span>
                {t.taggedConcepts}: <strong>#{activeTagFilter}</strong>
              </span>
            </span>
            <button
              onClick={() => setActiveTagFilter(null)}
              className="text-[11px] text-rose-500 hover:text-rose-600 flex items-center gap-0.5 underline font-medium"
            >
              {t.clearTagFilter}
            </button>
          </div>
        )}
      </div>

      {/* 2. Navigation Tabs */}
      <div
        className={`grid grid-cols-4 p-1 border-b gap-1 text-[10.5px] ${
          isLight ? 'bg-[#EEF4FB] border-[#CBD5E1]' : 'bg-[#090d16] border-slate-800/80'
        }`}
      >
        <button
          onClick={() => setActiveTab('list')}
          title={`${t.tabTopics} (${filteredNodes.length})`}
          className={`py-1 rounded-lg font-medium transition-all flex items-center justify-center gap-1 min-w-0 ${
            activeTab === 'list'
              ? 'bg-sky-600 text-white shadow-sm font-bold'
              : isLight
              ? 'text-[#475569] hover:text-[#0B192C] hover:bg-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Layers className="w-3 h-3 shrink-0" />
          <span className="truncate">{t.tabTopics}</span>
        </button>

        <button
          onClick={() => setActiveTab('tags')}
          title={`${t.tabTags} (${allTags.length})`}
          className={`py-1 rounded-lg font-medium transition-all flex items-center justify-center gap-1 min-w-0 ${
            activeTab === 'tags'
              ? 'bg-sky-600 text-white shadow-sm font-bold'
              : isLight
              ? 'text-[#475569] hover:text-[#0B192C] hover:bg-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <TagIcon className="w-3 h-3 shrink-0" />
          <span className="truncate">{t.tabTags}</span>
        </button>

        <button
          onClick={() => setActiveTab('inspector')}
          title={t.tabInspector}
          className={`py-1 rounded-lg font-medium transition-all flex items-center justify-center gap-1 min-w-0 relative ${
            activeTab === 'inspector'
              ? 'bg-sky-600 text-white shadow-sm font-bold'
              : isLight
              ? 'text-[#475569] hover:text-[#0B192C] hover:bg-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <Eye className="w-3 h-3 shrink-0" />
          <span className="truncate">{t.tabInspector}</span>
          {selectedNode && (
            <span
              className="w-1.5 h-1.5 rounded-full bg-cyan-400 absolute top-1 left-1.5"
            />
          )}
        </button>

        <button
          onClick={() => setActiveTab('export')}
          title={isRtl ? 'ذخیره و بارگذاری' : 'Export & Import'}
          className={`py-1 rounded-lg font-medium transition-all flex items-center justify-center gap-1 min-w-0 ${
            activeTab === 'export'
              ? 'bg-sky-600 text-white shadow-sm font-bold'
              : isLight
              ? 'text-[#475569] hover:text-[#0B192C] hover:bg-white'
              : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/50'
          }`}
        >
          <FileText className="w-3 h-3 shrink-0" />
          <span className="truncate">{isRtl ? 'فایل' : 'Files'}</span>
        </button>
      </div>

      {/* 3. Main Content View Area */}
      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {/* TAB 1: Flat Searchable List of All Nodes */}
        {activeTab === 'list' && (
          <div className="space-y-1.5">
            <div className={`flex items-center justify-between text-xs px-1 mb-1 font-semibold ${
              isLight ? 'text-slate-500' : 'text-slate-400'
            }`}>
              <span>
                {t.tabTopics} ({filteredNodes.length})
              </span>
            </div>

            {filteredNodes.length === 0 ? (
              <div className="text-center py-10 space-y-2 text-slate-500">
                <Search className="w-6 h-6 mx-auto text-slate-400" />
                <p className="text-xs">{t.emptySearch}</p>
              </div>
            ) : (
              filteredNodes.map((node) => {
                const isSelected = selectedNodeId === node.id;
                return (
                  <div
                    key={node.id}
                    onClick={() => handleNodeClick(node)}
                    onDoubleClick={() => handleNodeDoubleClick(node)}
                    className={`group p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between gap-2 ${
                      isSelected
                        ? isLight
                          ? 'bg-[#EBF5FF] border-sky-500 text-sky-950 font-bold shadow-sm'
                          : 'bg-cyan-950/50 border-cyan-600/90 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.15)]'
                        : isLight
                        ? 'bg-white border-[#D6E4F0] text-[#0F172A] hover:bg-[#F0F7FF] hover:border-sky-400 shadow-sm'
                        : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/60 hover:border-slate-700'
                    }`}
                  >
                    <div className="flex items-center gap-2.5 flex-1 min-w-0">
                      <span
                        className="w-2.5 h-2.5 rounded-full shrink-0 shadow-sm"
                        style={{
                          backgroundColor:
                            node.importance >= 8
                              ? '#f43f5e'
                              : node.importance >= 6
                              ? '#f59e0b'
                              : '#0284c7',
                        }}
                      />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h4 className="text-xs font-bold truncate">{node.title}</h4>
                          {node.nodeType === 'image' && (
                            <span className="text-[10px] bg-amber-500/20 border border-amber-600 text-amber-500 px-1 rounded">
                              Image
                            </span>
                          )}
                        </div>
                        {node.note ? (
                          <p className={`text-[11px] line-clamp-1 truncate font-light mt-0.5 ${
                            isLight ? 'text-slate-500' : 'text-slate-400'
                          }`}>
                            {node.note.replace(/[#*`_]/g, '')}
                          </p>
                        ) : null}
                      </div>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        )}

        {/* TAB 2: Clean Flat List of Tag Names */}
        {activeTab === 'tags' && (
          <div className="space-y-2">
            <div className={`flex items-center justify-between text-xs px-1 mb-1 font-semibold ${
              isLight ? 'text-[#475569]' : 'text-slate-400'
            }`}>
              <span>
                {t.tabTags} ({filteredTags.length})
              </span>
            </div>

            {filteredTags.length === 0 && untaggedCount === 0 ? (
              <div className="text-center py-10 space-y-2 text-slate-500">
                <TagIcon className="w-6 h-6 mx-auto text-slate-400" />
                <p className="text-xs">{t.noTagsYet}</p>
              </div>
            ) : (
              <div className="space-y-1.5">
                {filteredTags.map((tag) => {
                  const count = tagCounts[tag] || 0;
                  const isActive = activeTagFilter === tag;

                  return (
                    <div
                      key={tag}
                      onClick={() => handleTagClick(tag)}
                      className={`p-2.5 rounded-xl border transition-all cursor-pointer flex items-center justify-between ${
                        isActive
                          ? isLight
                            ? 'bg-[#EBF5FF] border-sky-500 text-sky-950 font-bold shadow-sm'
                            : 'bg-cyan-950/70 border-cyan-500 text-cyan-100 shadow-[0_0_15px_rgba(6,182,212,0.25)]'
                          : isLight
                          ? 'bg-white border-[#D6E4F0] text-[#0F172A] hover:bg-[#F0F7FF] hover:border-sky-400 shadow-sm'
                          : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/70 hover:border-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-2 flex-1 min-w-0">
                        <div
                          className={`w-6 h-6 rounded-lg flex items-center justify-center text-xs shrink-0 ${
                            isActive
                              ? 'bg-sky-600 text-white font-bold'
                              : isLight
                              ? 'bg-sky-50 text-sky-700 border border-sky-200'
                              : 'bg-slate-800 text-cyan-400 border border-slate-700'
                          }`}
                        >
                          #
                        </div>
                        <span className="text-xs font-bold truncate">{tag}</span>
                      </div>

                      <div className="flex items-center gap-2 shrink-0">
                        <span
                          className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                            isActive
                              ? isLight
                                ? 'bg-sky-100 border-sky-300 text-sky-900 font-bold'
                                : 'bg-cyan-900/90 border-cyan-400 text-cyan-200 font-bold'
                              : isLight
                              ? 'bg-slate-100 border-[#CBD5E1] text-[#475569]'
                              : 'bg-slate-950/80 border-slate-800 text-slate-400'
                          }`}
                        >
                          {count} {t.nodesCountSuffix}
                        </span>

                        {isActive && (
                          <CheckCircle2 className="w-4 h-4 text-cyan-500 shrink-0 animate-pulse" />
                        )}
                      </div>
                    </div>
                  );
                })}

                {/* Untagged item if any */}
                {untaggedCount > 0 && !searchQuery && (
                  <div
                    className={`p-2.5 rounded-xl border flex items-center justify-between text-xs mt-3 ${
                      isLight
                        ? 'border-slate-200 bg-slate-100/70 text-slate-600'
                        : 'border-slate-800/60 bg-slate-900/30 text-slate-400'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <span className="w-2 h-2 rounded-full bg-slate-400" />
                      <span>{t.untaggedNodes}</span>
                    </div>
                    <span
                      className={`text-[11px] font-mono px-2 py-0.5 rounded-full border ${
                        isLight
                          ? 'bg-white border-slate-200 text-slate-600'
                          : 'bg-slate-950 border-slate-800 text-slate-500'
                      }`}
                    >
                      {untaggedCount} {t.nodesCountSuffix}
                    </span>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* TAB 3: Selected Node Inspector */}
        {activeTab === 'inspector' && (
          <div>
            {selectedNode ? (
              <div
                className={`p-4 border rounded-2xl space-y-4 shadow-xl ${
                  isLight
                    ? 'border-sky-300 bg-white shadow-sky-100/50'
                    : 'border-cyan-700/60 bg-gradient-to-br from-slate-900/90 via-slate-900 to-cyan-950/30'
                }`}
              >
                <div
                  className={`flex items-center justify-between border-b pb-2.5 ${
                    isLight ? 'border-[#CBD5E1]' : 'border-slate-800'
                  }`}
                >
                  <span className="text-xs font-bold text-sky-600 flex items-center gap-1.5">
                    <Activity className="w-3.5 h-3.5" />
                    {t.tabInspector}
                  </span>
                  <span
                    className={`flex items-center gap-1 text-xs font-bold px-2 py-0.5 rounded-full border ${
                      isLight
                        ? 'text-amber-800 bg-amber-50 border-amber-300'
                        : 'text-amber-400 bg-amber-950/80 border-amber-700'
                    }`}
                  >
                    <Star className="w-3 h-3 fill-current" />
                    {selectedNode.importance}/10
                  </span>
                </div>

                <div className="space-y-1">
                  <h3
                    className={`text-sm font-extrabold leading-snug ${
                      isLight ? 'text-[#0B192C]' : 'text-slate-100'
                    }`}
                  >
                    {selectedNode.title}
                  </h3>
                  {selectedNode.tags && selectedNode.tags.length > 0 && (
                    <div className="flex flex-wrap gap-1 pt-1">
                      {selectedNode.tags.map((tag) => (
                        <span
                          key={tag}
                          className={`text-[10px] px-1.5 py-0.5 rounded border font-medium ${
                            isLight
                              ? 'bg-sky-50 text-sky-800 border-sky-200'
                              : 'bg-slate-800 text-cyan-300 border-slate-700'
                          }`}
                        >
                          #{tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Inline Editable Note */}
                <div className="space-y-2">
                  <div
                    className={`flex items-center justify-between text-[11px] font-semibold ${
                      isLight ? 'text-[#0F172A]' : 'text-slate-300'
                    }`}
                  >
                    <label className="flex items-center gap-1.5">
                      <FileEdit className="w-3.5 h-3.5 text-sky-600" />
                      {t.nodeNoteTitle}:
                    </label>
                    {saveSuccess && (
                      <span className="text-emerald-500 flex items-center gap-1 text-[10px] animate-fadeIn font-bold">
                        <Check className="w-3 h-3" />
                        {t.savedSuccessText}
                      </span>
                    )}
                  </div>

                  <textarea
                    value={inspectorNote}
                    onChange={(e) => {
                      setInspectorNote(e.target.value);
                      setSaveSuccess(false);
                    }}
                    placeholder={t.nodeNotePlaceholder}
                    rows={8}
                    className={`w-full rounded-xl p-3.5 text-xs transition-all font-normal leading-relaxed resize-y min-h-[180px] focus:outline-none focus:ring-1 focus:ring-sky-500 ${
                      isLight
                        ? 'bg-[#F8FAFD] border border-[#CBD5E1] text-[#0F172A] placeholder-slate-400 focus:border-sky-600'
                        : 'bg-slate-950/90 border border-slate-700/90 text-slate-100 placeholder-slate-500 focus:border-cyan-500'
                    }`}
                  />

                  {/* Save Note Button */}
                  <Button
                    variant="cyber"
                    size="sm"
                    onClick={handleSaveInspectorNote}
                    disabled={isSavingNote || inspectorNote === (selectedNode.note || '')}
                    className="w-full text-xs py-2 gap-2 shadow-glow-cyan/20"
                  >
                    {isSavingNote ? (
                      <>
                        <Loader2 className="w-3.5 h-3.5 animate-spin text-white" />
                        {t.savingNoteBtn}
                      </>
                    ) : saveSuccess ? (
                      <>
                        <Check className="w-3.5 h-3.5 text-emerald-300" />
                        {t.savedSuccessText}
                      </>
                    ) : (
                      <>
                        <Save className="w-3.5 h-3.5" />
                        {t.saveNoteBtn}
                      </>
                    )}
                  </Button>
                </div>

                <div
                  className={`text-xs flex items-center justify-between pt-1 border-t ${
                    isLight ? 'border-[#CBD5E1] text-[#475569]' : 'border-slate-800 text-slate-400'
                  }`}
                >
                  <span>{t.connectedEdgesTitle}:</span>
                  <strong className="text-sky-600 font-mono text-sm">{connectedEdgesCount}</strong>
                </div>

                {/* Additional Action Buttons */}
                <div className="space-y-2 pt-1">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => onEditNode(selectedNode)}
                    className={`w-full text-xs py-2 gap-2 ${
                      isLight
                        ? 'border-[#CBD5E1] hover:border-sky-500 text-[#0F172A] bg-white'
                        : 'border-slate-700 hover:border-cyan-500/50'
                    }`}
                  >
                    <FileEdit className="w-3.5 h-3.5 text-sky-600" />
                    <span>{t.openAdvancedEditor}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (onOpenSubTopics) onOpenSubTopics(selectedNode);
                      else onDeepDiveNode?.(selectedNode);
                    }}
                    className={`w-full text-xs py-2 gap-2 ${
                      isLight
                        ? 'text-sky-700 border-[#CBD5E1] hover:border-sky-400 bg-white'
                        : 'text-cyan-300 hover:text-cyan-200 border-slate-700 hover:border-cyan-500/50'
                    }`}
                  >
                    <Sparkles className="w-3.5 h-3.5 text-sky-500" />
                    <span>{t.ctxAiSubtopics}</span>
                  </Button>
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={() => {
                      if (onOpenSocratic) onOpenSocratic(selectedNode);
                      else onDeepDiveNode?.(selectedNode);
                    }}
                    className={`w-full text-xs py-2 gap-2 ${
                      isLight
                        ? 'text-amber-800 border-[#CBD5E1] hover:border-amber-400 bg-white'
                        : 'text-amber-300 hover:text-amber-200 border-slate-700 hover:border-amber-500/50'
                    }`}
                  >
                    <HelpCircle className="w-3.5 h-3.5 text-amber-500" />
                    <span>{t.ctxAiSocratic}</span>
                  </Button>
                </div>
              </div>
            ) : (
              <div
                className={`p-6 border rounded-2xl text-center py-12 space-y-3 ${
                  isLight
                    ? 'border-[#CBD5E1] bg-white text-[#475569]'
                    : 'border-slate-800/80 bg-slate-900/30'
                }`}
              >
                <Activity className="w-8 h-8 text-slate-400 mx-auto" />
                <div className="space-y-1">
                  <p className="text-xs text-slate-500">{t.selectNodeToInspect}</p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* TAB 4: Export & Import Files (Markdown & JSON) */}
        {activeTab === 'export' && (
          <div className="space-y-3">
            <div className="text-[11px] font-bold text-slate-500 dark:text-slate-400 leading-snug">
              {isRtl
                ? 'ذخیره و بازیابی مفاهیم نقشه ذهنی با فرمت‌های مارک‌داون (.md) و JSON:'
                : 'Save and restore MindMap concepts in Markdown (.md) and JSON formats:'}
            </div>

            <div className="space-y-2">
              {/* Markdown Section */}
              <div
                className={`p-2.5 rounded-xl border space-y-2 ${
                  isLight
                    ? 'bg-purple-50/50 border-purple-200 text-purple-950'
                    : 'bg-purple-950/20 border-purple-800/50 text-purple-200'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-purple-600 dark:text-purple-400">
                  <FileText className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'فرمت مارک‌داون (Markdown .md)' : 'Markdown Format (.md)'}</span>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    onClick={handleExportMarkdown}
                    className={`w-full p-2 rounded-lg border flex items-center justify-between text-xs font-bold transition-all ${
                      isLight
                        ? 'bg-white border-purple-200 hover:border-purple-400 text-purple-900 shadow-xs'
                        : 'bg-slate-900/80 border-slate-800 hover:border-purple-500 text-purple-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-purple-500" />
                      <span>{isRtl ? 'ذخیره فایل مارک‌داون (.md)' : 'Export Markdown (.md)'}</span>
                    </div>
                  </button>

                  <button
                    onClick={() => mdFileInputRef.current?.click()}
                    disabled={isImporting}
                    className={`w-full p-2 rounded-lg border flex items-center justify-between text-xs font-bold transition-all ${
                      isLight
                        ? 'bg-white border-purple-200 hover:border-purple-400 text-purple-900 shadow-xs'
                        : 'bg-slate-900/80 border-slate-800 hover:border-purple-500 text-purple-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isImporting ? (
                        <Loader2 className="w-3.5 h-3.5 text-purple-500 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-purple-500" />
                      )}
                      <span>
                        {isImporting
                          ? isRtl
                            ? 'در حال بارگذاری...'
                            : 'Importing...'
                          : isRtl
                          ? 'بارگذاری فایل مارک‌داون (.md)'
                          : 'Import Markdown (.md)'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* JSON Section */}
              <div
                className={`p-2.5 rounded-xl border space-y-2 ${
                  isLight
                    ? 'bg-blue-50/50 border-blue-200 text-blue-950'
                    : 'bg-blue-950/20 border-blue-800/50 text-blue-200'
                }`}
              >
                <div className="flex items-center gap-1.5 text-xs font-bold text-blue-600 dark:text-blue-400">
                  <Download className="w-3.5 h-3.5" />
                  <span>{isRtl ? 'فرمت پروژه کامل (JSON .json)' : 'Full Project Format (.json)'}</span>
                </div>

                <div className="grid grid-cols-1 gap-1.5">
                  <button
                    onClick={handleExportJSON}
                    className={`w-full p-2 rounded-lg border flex items-center justify-between text-xs font-bold transition-all ${
                      isLight
                        ? 'bg-white border-blue-200 hover:border-blue-400 text-blue-900 shadow-xs'
                        : 'bg-slate-900/80 border-slate-800 hover:border-blue-500 text-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <Download className="w-3.5 h-3.5 text-blue-500" />
                      <span>{isRtl ? 'ذخیره فایل پروژه (JSON)' : 'Export Project JSON'}</span>
                    </div>
                  </button>

                  <button
                    onClick={() => jsonFileInputRef.current?.click()}
                    disabled={isImporting}
                    className={`w-full p-2 rounded-lg border flex items-center justify-between text-xs font-bold transition-all ${
                      isLight
                        ? 'bg-white border-blue-200 hover:border-blue-400 text-blue-900 shadow-xs'
                        : 'bg-slate-900/80 border-slate-800 hover:border-blue-500 text-blue-200'
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      {isImporting ? (
                        <Loader2 className="w-3.5 h-3.5 text-blue-500 animate-spin" />
                      ) : (
                        <Upload className="w-3.5 h-3.5 text-amber-500" />
                      )}
                      <span>
                        {isImporting
                          ? isRtl
                            ? 'در حال بارگذاری...'
                            : 'Importing...'
                          : isRtl
                          ? 'بارگذاری فایل پروژه (JSON)'
                          : 'Import Project JSON'}
                      </span>
                    </div>
                  </button>
                </div>
              </div>

              {/* Hidden file inputs */}
              <input
                ref={mdFileInputRef}
                type="file"
                accept=".md,.markdown,.txt"
                onChange={handleMdFileChange}
                className="hidden"
              />

              <input
                ref={jsonFileInputRef}
                type="file"
                accept=".json"
                onChange={handleJsonFileChange}
                className="hidden"
              />
            </div>
          </div>
        )}
      </div>

      {/* 4. Bottom Graph Stats Footer */}
      <div
        className={`p-3 border-t flex items-center justify-between text-[11px] ${
          isLight
            ? 'bg-[#F1F6FB] border-[#CBD5E1] text-[#475569]'
            : 'bg-[#080C16] border-slate-800/90 text-slate-400'
        }`}
      >
        <div className="flex items-center gap-1.5">
          <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
          <span>
            {t.allConcepts}:{' '}
            <strong className={isLight ? 'text-[#0B192C]' : 'text-slate-200'}>
              {nodes.length}
            </strong>
          </span>
        </div>
        <span>
          {t.connectedEdgesTitle}:{' '}
          <strong className="text-sky-600 font-bold">{edges.length}</strong>
        </span>
      </div>
    </aside>
  );
};
