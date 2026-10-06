import { api } from './api';
import { MindNode, MindEdge, MindPage } from '../types';

export const graphService = {
  // Pages
  async getPages(): Promise<MindPage[]> {
    const res = await api.get<{ pages: MindPage[] }>('/pages');
    return res.data.pages;
  },

  async createPage(data?: {
    title?: string;
    theme?: string;
    pageMode?: string;
    diagramType?: string;
    diagramData?: string;
  } | string): Promise<MindPage> {
    const payload = typeof data === 'string' ? { title: data } : data || {};
    const res = await api.post<{ page: MindPage }>('/pages', payload);
    return res.data.page;
  },

  async updatePage(
    id: string,
    data: {
      title?: string;
      order?: number;
      theme?: string;
      pageMode?: string;
      diagramType?: string;
      diagramData?: string;
    }
  ): Promise<MindPage> {
    const res = await api.put<{ page: MindPage }>(`/pages/${id}`, data);
    return res.data.page;
  },

  async deletePage(id: string): Promise<void> {
    await api.delete(`/pages/${id}`);
  },

  // Nodes
  async getNodes(pageId?: string): Promise<MindNode[]> {
    const res = await api.get<{ nodes: MindNode[] }>('/nodes', {
      params: pageId ? { pageId } : undefined,
    });
    return res.data.nodes;
  },

  async createNode(data: Partial<MindNode>): Promise<MindNode> {
    const res = await api.post<{ node: MindNode }>('/nodes', data);
    return res.data.node;
  },

  async updateNode(id: string, data: Partial<MindNode>): Promise<MindNode> {
    const res = await api.put<{ node: MindNode }>(`/nodes/${id}`, data);
    return res.data.node;
  },

  async deleteNode(id: string): Promise<void> {
    await api.delete(`/nodes/${id}`);
  },

  async batchUpdatePositions(positions: { id: string; posX: number; posY: number }[]): Promise<void> {
    await api.post('/nodes/batch-positions', { positions });
  },

  async clearPageNodes(pageId: string): Promise<void> {
    await api.post('/nodes/clear-page', { pageId });
  },

  // Edges
  async getEdges(pageId?: string): Promise<MindEdge[]> {
    const res = await api.get<{ edges: MindEdge[] }>('/edges', {
      params: pageId ? { pageId } : undefined,
    });
    return res.data.edges;
  },

  async createEdge(data: { sourceNodeId: string; targetNodeId: string; label?: string; weight?: number; pageId?: string }): Promise<MindEdge> {
    const res = await api.post<{ edge: MindEdge }>('/edges', data);
    return res.data.edge;
  },

  async updateEdge(id: string, data: Partial<MindEdge>): Promise<MindEdge> {
    const res = await api.put<{ edge: MindEdge }>(`/edges/${id}`, data);
    return res.data.edge;
  },

  async deleteEdge(id: string): Promise<void> {
    await api.delete(`/edges/${id}`);
  },
};
