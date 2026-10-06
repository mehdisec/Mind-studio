import { create } from 'zustand';
import { MindNode, MindEdge, MindPage } from '../types';
import { graphService } from '../services/graphService';
import { useSettingsStore } from './useSettingsStore';

interface GraphState {
  pages: MindPage[];
  activePageId: string | null;
  nodes: MindNode[];
  edges: MindEdge[];
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isLoading: boolean;
  isSaving: boolean;
  searchQuery: string;
  activeTagFilter: string | null;

  // Actions
  fetchPages: () => Promise<void>;
  setActivePageId: (pageId: string) => Promise<void>;
  addPage: (options?: { title?: string; theme?: string; pageMode?: 'mindmap' | 'diagram'; diagramType?: string; diagramData?: string } | string) => Promise<MindPage | null>;
  updatePageTitle: (pageId: string, title: string) => Promise<void>;
  updatePageTheme: (pageId: string, theme: string) => Promise<void>;
  updatePageDiagramData: (pageId: string, diagramData: string | object) => Promise<void>;
  deletePage: (pageId: string) => Promise<void>;

  fetchGraph: (pageId?: string) => Promise<void>;
  addNode: (
    titleOrData: string | Partial<MindNode>,
    importance?: number,
    note?: string,
    posX?: number,
    posY?: number,
    tags?: string[],
    nodeType?: 'text' | 'image',
    imageUrl?: string,
    imageSize?: 'small' | 'medium' | 'large'
  ) => Promise<MindNode | null>;
  updateNode: (id: string, data: Partial<MindNode>) => Promise<void>;
  deleteNode: (id: string) => Promise<void>;
  addEdge: (sourceNodeId: string, targetNodeId: string, label?: string) => Promise<void>;
  updateEdge: (id: string, data: Partial<MindEdge>) => Promise<void>;
  deleteEdge: (id: string) => Promise<void>;
  batchUpdatePositions: (positions: { id: string; posX: number; posY: number }[]) => Promise<void>;
  clearCurrentPageNodes: () => Promise<void>;

  setSelectedNodeId: (id: string | null) => void;
  setSelectedEdgeId: (id: string | null) => void;
  setSearchQuery: (query: string) => void;
  setActiveTagFilter: (tag: string | null) => void;
  resetGraph: () => void;
}

export const useGraphStore = create<GraphState>((set, get) => ({
  pages: [],
  activePageId: null,
  nodes: [],
  edges: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  isLoading: false,
  isSaving: false,
  searchQuery: '',
  activeTagFilter: null,

  resetGraph: () => {
    set({
      pages: [],
      activePageId: null,
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      isLoading: false,
      isSaving: false,
      searchQuery: '',
      activeTagFilter: null,
    });
  },

  fetchPages: async () => {
    try {
      const pages = await graphService.getPages();
      const currentActive = get().activePageId;
      const targetActiveId =
        pages.find((p) => p.id === currentActive)?.id || (pages.length > 0 ? pages[0].id : null);

      set({
        pages,
        activePageId: targetActiveId,
      });

      if (targetActiveId) {
        await get().fetchGraph(targetActiveId);
      }
    } catch (err) {
      console.error('Fetch pages error:', err);
    }
  },

  setActivePageId: async (pageId: string) => {
    if (get().activePageId === pageId) return;

    set({
      activePageId: pageId,
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      activeTagFilter: null,
      searchQuery: '',
    });

    await get().fetchGraph(pageId);
  },

  addPage: async (
    options?:
      | {
          title?: string;
          theme?: string;
          pageMode?: 'mindmap' | 'diagram';
          diagramType?: string;
          diagramData?: string;
        }
      | string
  ) => {
    const pages = get().pages;
    const isFa = useSettingsStore.getState().language === 'fa';
    const opts = typeof options === 'string' ? { title: options } : options || {};
    const defaultTitle =
      opts.title?.trim() ||
      (opts.pageMode === 'diagram'
        ? isFa
          ? `دیاگرام ${pages.length + 1}`
          : `Diagram ${pages.length + 1}`
        : isFa
        ? `صفحه ${pages.length + 1}`
        : `Page ${pages.length + 1}`);

    set({ isLoading: true });
    try {
      const newPage = await graphService.createPage({
        ...opts,
        title: defaultTitle,
      });

      set((state) => ({
        pages: [...state.pages, newPage],
        activePageId: newPage.id,
        nodes: [],
        edges: [],
        selectedNodeId: null,
        selectedEdgeId: null,
        activeTagFilter: null,
        searchQuery: '',
      }));

      // Immediately fetch graph nodes and edges for the new page!
      await get().fetchGraph(newPage.id);

      return newPage;
    } catch (err) {
      console.error('Create page error:', err);
      set({ isLoading: false });
      return null;
    }
  },

  updatePageTitle: async (pageId: string, title: string) => {
    const isFa = useSettingsStore.getState().language === 'fa';
    const cleanTitle = title.trim() || (isFa ? 'صفحه بدون عنوان' : 'Untitled Page');

    set((state) => ({
      pages: state.pages.map((p) => (p.id === pageId ? { ...p, title: cleanTitle } : p)),
    }));

    try {
      const updated = await graphService.updatePage(pageId, { title: cleanTitle });
      set((state) => ({
        pages: state.pages.map((p) => (p.id === pageId ? updated : p)),
      }));
    } catch (err) {
      console.error('Update page title error:', err);
    }
  },

  updatePageTheme: async (pageId: string, theme: string) => {
    // 1. Optimistic update
    set((state) => ({
      pages: state.pages.map((p) => (p.id === pageId ? { ...p, theme } : p)),
    }));

    // 2. Persist to API
    try {
      const updated = await graphService.updatePage(pageId, { theme });
      set((state) => ({
        pages: state.pages.map((p) => (p.id === pageId ? updated : p)),
      }));
    } catch (err) {
      console.error('Update page theme error:', err);
    }
  },

  updatePageDiagramData: async (pageId: string, diagramData: string | object) => {
    const strData = typeof diagramData === 'string' ? diagramData : JSON.stringify(diagramData);

    // 1. Optimistic update
    set((state) => ({
      pages: state.pages.map((p) => (p.id === pageId ? { ...p, diagramData: strData } : p)),
    }));

    // 2. Persist to API
    try {
      const updated = await graphService.updatePage(pageId, { diagramData: strData });
      set((state) => ({
        pages: state.pages.map((p) => (p.id === pageId ? updated : p)),
      }));
    } catch (err) {
      console.error('Update page diagramData error:', err);
    }
  },

  deletePage: async (pageId: string) => {
    const currentPages = get().pages;
    const remainingPages = currentPages.filter((p) => p.id !== pageId);

    const nextActiveId =
      get().activePageId === pageId
        ? remainingPages.length > 0
          ? remainingPages[0].id
          : null
        : get().activePageId;

    set({
      pages: remainingPages,
      activePageId: nextActiveId,
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
      activeTagFilter: null,
    });

    if (nextActiveId) {
      await get().fetchGraph(nextActiveId);
    }

    try {
      await graphService.deletePage(pageId);
    } catch (err) {
      console.error('Delete page error:', err);
    }
  },

  fetchGraph: async (pageId?: string) => {
    const targetPageId = pageId || get().activePageId;
    if (!targetPageId) return;

    set({ isLoading: true });
    try {
      const [nodes, edges] = await Promise.all([
        graphService.getNodes(targetPageId),
        graphService.getEdges(targetPageId),
      ]);
      // Filter strictly to targetPageId to guarantee complete page isolation
      const pageNodes = nodes.filter((n) => !n.pageId || n.pageId === targetPageId);
      const pageEdges = edges.filter((e) => !e.pageId || e.pageId === targetPageId);
      set({ nodes: pageNodes, edges: pageEdges, isLoading: false });
    } catch (err) {
      console.error('Fetch graph error:', err);
      set({ isLoading: false });
    }
  },

  addNode: async (
    titleOrData: string | Partial<MindNode>,
    importance = 5,
    note = '',
    posX = 0,
    posY = 0,
    tags = [],
    nodeType: 'text' | 'image' = 'text',
    imageUrl = '',
    imageSize: 'small' | 'medium' | 'large' = 'small'
  ) => {
    set({ isSaving: true });
    const activePageId = get().activePageId;

    // Prepare payload ensuring pageId is always assigned to current active page
    const payload: Partial<MindNode> =
      typeof titleOrData === 'object'
        ? { ...titleOrData, pageId: titleOrData.pageId || activePageId || undefined }
        : {
          pageId: activePageId || undefined,
          title: titleOrData,
          importance,
          note,
          posX,
          posY,
          tags,
          nodeType,
          imageUrl,
          imageSize,
        };

    const tempId = 'temp_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const isFa = useSettingsStore.getState().language === 'fa';
    const optimisticNode: MindNode = {
      id: payload.id || tempId,
      pageId: payload.pageId || activePageId || null,
      title: payload.title || (isFa ? 'مفهوم جدید' : 'New Concept'),
      importance: payload.importance || 5,
      note: payload.note || '',
      posX: typeof payload.posX === 'number' ? payload.posX : 0,
      posY: typeof payload.posY === 'number' ? payload.posY : 0,
      tags: payload.tags || [],
      nodeType: payload.nodeType || 'text',
      imageUrl: payload.imageUrl || '',
      imageSize: payload.imageSize || 'small',
      highlighted: Boolean(payload.highlighted),
      highlightColor: payload.highlightColor || 'gold',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    // 1. Optimistic Update (Immediate instant rendering on canvas)
    set((state) => ({
      nodes: [...state.nodes, optimisticNode],
      selectedNodeId: optimisticNode.id,
      isSaving: false,
    }));

    // 2. Persist to Backend API
    try {
      const savedNode = await graphService.createNode(payload);
      set((state) => ({
        nodes: state.nodes.map((n) => (n.id === optimisticNode.id ? savedNode : n)),
        selectedNodeId:
          state.selectedNodeId === optimisticNode.id ? savedNode.id : state.selectedNodeId,
      }));
      return savedNode;
    } catch (err) {
      console.error('Add node API error (kept optimistically):', err);
      return optimisticNode;
    }
  },

  updateNode: async (id, data) => {
    // Optimistic update
    set((state) => ({
      nodes: state.nodes.map((n) => (n.id === id ? { ...n, ...data } : n)),
    }));

    try {
      const updated = await graphService.updateNode(id, data);
      set((state) => ({
        nodes: state.nodes.map((n) => (n.id === id ? updated : n)),
      }));
    } catch (err) {
      console.error('Update node error:', err);
    }
  },

  deleteNode: async (id) => {
    // Optimistic delete
    set((state) => ({
      nodes: state.nodes.filter((n) => n.id !== id),
      edges: state.edges.filter((e) => e.sourceNodeId !== id && e.targetNodeId !== id),
      selectedNodeId: state.selectedNodeId === id ? null : state.selectedNodeId,
    }));

    try {
      await graphService.deleteNode(id);
    } catch (err) {
      console.error('Delete node error:', err);
    }
  },

  addEdge: async (sourceNodeId, targetNodeId, label = '') => {
    if (!sourceNodeId || !targetNodeId || sourceNodeId === targetNodeId) return;
    const activePageId = get().activePageId;

    // Check if edge already exists
    const exists = get().edges.some(
      (e) =>
        (e.sourceNodeId === sourceNodeId && e.targetNodeId === targetNodeId) ||
        (e.sourceNodeId === targetNodeId && e.targetNodeId === sourceNodeId)
    );
    if (exists) return;

    const tempEdgeId = 'temp_edge_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);
    const optimisticEdge: MindEdge = {
      id: tempEdgeId,
      pageId: activePageId || null,
      sourceNodeId,
      targetNodeId,
      label: label || '',
      weight: 1.0,
      createdAt: new Date().toISOString(),
    };

    // 1. Optimistic update (Immediate visual connection)
    set((state) => ({
      edges: [...state.edges, optimisticEdge],
    }));

    // 2. Persist to Backend API
    try {
      const newEdge = await graphService.createEdge({
        pageId: activePageId || undefined,
        sourceNodeId,
        targetNodeId,
        label,
      });
      set((state) => ({
        edges: state.edges.map((e) => (e.id === tempEdgeId ? newEdge : e)),
      }));
    } catch (err) {
      console.error('Add edge error (kept optimistically):', err);
    }
  },

  updateEdge: async (id, data) => {
    // Optimistic update
    set((state) => ({
      edges: state.edges.map((e) => (e.id === id ? { ...e, ...data } : e)),
    }));

    try {
      const updated = await graphService.updateEdge(id, data);
      set((state) => ({
        edges: state.edges.map((e) => (e.id === id ? updated : e)),
      }));
    } catch (err) {
      console.error('Update edge error:', err);
    }
  },

  deleteEdge: async (id) => {
    set((state) => ({
      edges: state.edges.filter((e) => e.id !== id),
      selectedEdgeId: state.selectedEdgeId === id ? null : state.selectedEdgeId,
    }));

    try {
      await graphService.deleteEdge(id);
    } catch (err) {
      console.error('Delete edge error:', err);
    }
  },

  batchUpdatePositions: async (positions) => {
    // Optimistic update
    set((state) => ({
      nodes: state.nodes.map((n) => {
        const found = positions.find((p) => p.id === n.id);
        return found ? { ...n, posX: found.posX, posY: found.posY } : n;
      }),
    }));

    try {
      await graphService.batchUpdatePositions(positions);
    } catch (err) {
      console.error('Batch update positions error:', err);
    }
  },

  clearCurrentPageNodes: async () => {
    const activePageId = get().activePageId;
    if (!activePageId) return;

    // Optimistically clear nodes and edges in the store
    set({
      nodes: [],
      edges: [],
      selectedNodeId: null,
      selectedEdgeId: null,
    });

    try {
      await graphService.clearPageNodes(activePageId);
      set((state) => ({
        pages: state.pages.map((p) =>
          p.id === activePageId ? { ...p, _count: { nodes: 0 } } : p
        ),
      }));
    } catch (err) {
      console.error('Clear page nodes error:', err);
      // Re-fetch to restore if failed
      await get().fetchGraph(activePageId);
    }
  },

  setSelectedNodeId: (id) => set({ selectedNodeId: id }),
  setSelectedEdgeId: (id) => set({ selectedEdgeId: id }),
  setSearchQuery: (searchQuery) => set({ searchQuery }),
  setActiveTagFilter: (activeTagFilter) => set({ activeTagFilter }),
}));
