import { api } from './api';
import { AIInsight, AIDeepDiveResult, AIRoadmapResult } from '../types';

export const aiService = {
  async getSubTopics(
    topic: string,
    contextNotes: string = '',
    importance: number = 5
  ): Promise<{ topic: string; insights: AIInsight[] }> {
    const res = await api.post<{ topic: string; insights: AIInsight[] }>('/ai/sub-topics', {
      topic,
      contextNotes,
      importance,
    });
    return res.data;
  },

  async getSocraticQuestions(
    topic: string,
    contextNotes: string = ''
  ): Promise<{ topic: string; socraticQuestions: string[] }> {
    const res = await api.post<{ topic: string; socraticQuestions: string[] }>('/ai/socratic-questions', {
      topic,
      contextNotes,
    });
    return res.data;
  },

  async getDeepDive(topic: string, contextNotes: string = '', importance: number = 5): Promise<AIDeepDiveResult> {
    const res = await api.post<AIDeepDiveResult>('/ai/deep-dive', {
      topic,
      contextNotes,
      importance,
    });
    return res.data;
  },

  async getLineageExpansion(
    topic: string,
    lineagePath: string[] = [],
    contextNotes: string = ''
  ): Promise<AIRoadmapResult> {
    const res = await api.post<AIRoadmapResult>('/ai/lineage-expansion', {
      topic,
      lineagePath,
      contextNotes,
    });
    return res.data;
  },

  async testConnection(
    apiKey?: string,
    model?: string
  ): Promise<{ success: boolean; message: string; model: string; latencyMs?: number }> {
    const res = await api.post<{ success: boolean; message: string; model: string; latencyMs?: number }>(
      '/ai/test-connection',
      { apiKey, model }
    );
    return res.data;
  },
};
