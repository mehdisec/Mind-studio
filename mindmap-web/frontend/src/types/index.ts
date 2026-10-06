export interface User {
  id: string;
  email: string;
  name?: string;
  avatarUrl?: string;
  createdAt?: string;
}

export type GraphThemeKey =
  | 'cyberpunk'
  | 'matrix'
  | 'cosmic'
  | 'solar'
  | 'emerald'
  | 'crimson'
  | 'quantum'
  | 'synthwave'
  | 'monochrome';

export type PageMode = 'mindmap' | 'diagram';

export interface MindPage {
  id: string;
  userId?: string;
  title: string;
  order?: number;
  theme?: GraphThemeKey | string;
  pageMode?: PageMode;
  diagramType?: string;
  diagramData?: string;
  _count?: {
    nodes?: number;
  };
  createdAt?: string;
  updatedAt?: string;
}

export interface MindNode {
  id: string;
  userId?: string;
  pageId?: string | null;
  title: string;
  importance: number; // 1 to 10
  note: string;
  posX: number;
  posY: number;
  tags: string[];
  nodeType?: 'text' | 'image';
  imageUrl?: string;
  imageSize?: 'small' | 'medium' | 'large';
  highlighted?: boolean;
  highlightColor?: string; // 'gold' | 'red' | 'green'
  createdAt?: string;
  updatedAt?: string;
}

export interface MindEdge {
  id: string;
  userId?: string;
  pageId?: string | null;
  sourceNodeId: string;
  targetNodeId: string;
  label?: string | null;
  weight?: number;
  createdAt?: string;
}

export interface AIInsight {
  topic: string;
  description: string;
  importance: number;
  relationType: string;
}

export interface AIDeepDiveResult {
  topic: string;
  insights: AIInsight[];
  socraticQuestions: string[];
}

export interface AIRoadmapItem {
  phase: string;
  title: string;
  brief: string;
  importance: number;
}

export interface AIRoadmapResult {
  topic: string;
  roadmap: AIRoadmapItem[];
}

export interface AuthResponse {
  user: User;
  token: string;
}

export interface UserStats {
  pagesCount: number;
  nodesCount: number;
  edgesCount: number;
}
