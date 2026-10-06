import React, { useRef, useEffect, useState, useCallback } from 'react';
import { useGraphStore } from '../../stores/useGraphStore';
import { MindNode, MindEdge } from '../../types';
import {
  Sparkles,
  FileText,
  Trash2,
  Plus,
  Image as ImageIcon,
  RotateCcw,
  ZoomIn,
  ZoomOut,
  Highlighter,
  Check,
  Eye,
  X,
  HelpCircle,
} from 'lucide-react';
import { AddImageNodeDialog } from '../dialogs/AddImageNodeDialog';
import { useSettingsStore } from '../../stores/useSettingsStore';
import { useTranslation } from '../../utils/i18n';
import {
  getGraphTheme,
  GraphThemeDefinition,
  NodeShapeType,
  ConnectionStyleType,
} from '../../utils/graphThemes';

interface PhysicsGraphCanvasProps {
  onEditNode: (node: MindNode) => void;
  onOpenSubTopics?: (node: MindNode) => void;
  onOpenSocratic?: (node: MindNode) => void;
  onDeepDiveNode?: (node: MindNode) => void;
}

// Helper: Calculate node dimensions based on shape and zoom
const getNodeDimensions = (
  node: { title: string; importance: number; radius: number; nodeType: 'text' | 'image'; imageSize?: string; tags?: string[]; note?: string },
  shape: NodeShapeType,
  zoom: number
) => {
  const isImage = node.nodeType === 'image';
  if (isImage) {
    const size = node.imageSize || 'small';
    const rad = (size === 'large' ? 32 : size === 'medium' ? 24 : 18) * zoom;
    return { width: rad * 2, height: rad * 2, radius: rad, isImage: true };
  }

  // Rounded Box (Tree & Flowchart Card) - spacious, clean, contains tag/note preview
  if (shape === 'rounded-box') {
    const titleLen = (node.title || '').length;
    const nodeTags = Array.isArray(node.tags)
      ? node.tags
      : typeof node.tags === 'string'
        ? (node.tags as string).replace(/[\[\]"]/g, '').split(',').map((t) => t.trim()).filter(Boolean)
        : [];
    const hasImage = Boolean((node as any).imageUrl);
    const hasSubtitle = nodeTags.length > 0 || Boolean(node.note) || hasImage;

    const baseW = Math.max(110, Math.min(230, titleLen * 9.2 + (hasImage ? 50 : 42)));
    const baseH = hasSubtitle ? 50 : 36;
    const zoomScale = Math.min(1.2, Math.max(0.75, zoom));
    const w = baseW * zoomScale;
    const h = baseH * zoomScale;
    return { width: w, height: h, radius: 8 * zoomScale, isImage: false };
  }

  if (shape === 'capsule') {
    const titleLen = (node.title || '').length;
    const w = Math.max(36, (titleLen * 7.2 + 20) * 0.7) * Math.min(1.25, Math.max(0.75, zoom));
    const h = 22 * 0.7 * Math.min(1.25, Math.max(0.75, zoom));
    return { width: w, height: h, radius: h / 2, isImage: false };
  }

  if (shape === 'hexagon') {
    const rad = (8.0 + (node.importance / 10) * 4.0) * 0.7 * zoom;
    return { width: rad * 2, height: rad * 2, radius: rad, isImage: false };
  }

  // Default circle (30% smaller)
  const rad = (5.5 + (node.importance / 10) * 3.5) * 0.7 * zoom;
  return { width: rad * 2, height: rad * 2, radius: rad, isImage: false };
};

// Helper: Draw geometric shape path on canvas
const drawShapePath = (
  ctx: CanvasRenderingContext2D,
  px: number,
  py: number,
  shape: NodeShapeType,
  dim: { width: number; height: number; radius: number; isImage: boolean }
) => {
  ctx.beginPath();
  if (dim.isImage || shape === 'circle') {
    ctx.arc(px, py, dim.radius, 0, Math.PI * 2);
  } else if (shape === 'rounded-box') {
    const x0 = px - dim.width / 2;
    const y0 = py - dim.height / 2;
    const r = Math.min(7, dim.radius || 6);
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x0, y0, dim.width, dim.height, r);
    } else {
      ctx.rect(x0, y0, dim.width, dim.height);
    }
  } else if (shape === 'capsule') {
    const x0 = px - dim.width / 2;
    const y0 = py - dim.height / 2;
    const r = dim.height / 2;
    if (typeof ctx.roundRect === 'function') {
      ctx.roundRect(x0, y0, dim.width, dim.height, r);
    } else {
      ctx.rect(x0, y0, dim.width, dim.height);
    }
  } else if (shape === 'hexagon') {
    const r = dim.radius;
    for (let i = 0; i < 6; i++) {
      const angle = (Math.PI / 3) * i - Math.PI / 6;
      const hx = px + r * Math.cos(angle);
      const hy = py + r * Math.sin(angle);
      if (i === 0) ctx.moveTo(hx, hy);
      else ctx.lineTo(hx, hy);
    }
    ctx.closePath();
  }
};

// Helper: Draw connection line path based on style
const drawConnectionPath = (
  ctx: CanvasRenderingContext2D,
  p1: { x: number; y: number },
  p2: { x: number; y: number },
  style: ConnectionStyleType
) => {
  ctx.beginPath();
  if (style === 'orthogonal') {
    // 90-degree Step Tree Flow
    const midX = (p1.x + p2.x) / 2;
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(midX, p1.y);
    ctx.lineTo(midX, p2.y);
    ctx.lineTo(p2.x, p2.y);
  } else if (style === 'curved') {
    // Smooth Organic Bezier Branch
    const dx = p2.x - p1.x;
    const cp1x = p1.x + dx * 0.55;
    const cp1y = p1.y;
    const cp2x = p1.x + dx * 0.45;
    const cp2y = p2.y;
    ctx.moveTo(p1.x, p1.y);
    ctx.bezierCurveTo(cp1x, cp1y, cp2x, cp2y, p2.x, p2.y);
  } else if (style === 'circuit') {
    // 45-degree chamfered circuit line
    const dx = p2.x - p1.x;
    const dy = p2.y - p1.y;
    const midX = (p1.x + p2.x) / 2;
    const chamfer = Math.min(Math.abs(dx) * 0.25, Math.abs(dy) * 0.5, 16);
    const signX = dx >= 0 ? 1 : -1;
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(midX - chamfer * signX, p1.y);
    ctx.lineTo(midX + chamfer * signX, p2.y);
    ctx.lineTo(p2.x, p2.y);
  } else {
    // Straight line
    ctx.moveTo(p1.x, p1.y);
    ctx.lineTo(p2.x, p2.y);
  }
};

// Helper: Calculate intermediate point on a bezier curve at progress t (0 <= t <= 1)
const getCurvedPoint = (p1: { x: number; y: number }, p2: { x: number; y: number }, t: number) => {
  const dx = p2.x - p1.x;
  const cp1x = p1.x + dx * 0.55;
  const cp1y = p1.y;
  const cp2x = p1.x + dx * 0.45;
  const cp2y = p2.y;
  const u = 1 - t;
  const tt = t * t;
  const uu = u * u;
  const uuu = uu * u;
  const ttt = tt * t;

  return {
    x: uuu * p1.x + 3 * uu * t * cp1x + 3 * u * tt * cp2x + ttt * p2.x,
    y: uuu * p1.y + 3 * uu * t * cp1y + 3 * u * tt * cp2y + ttt * p2.y,
  };
};

// Helper: Draw dedicated high-contrast Image Badge Icon on canvas for nodes containing an image
const drawNodeImageBadge = (
  ctx: CanvasRenderingContext2D,
  cx: number,
  cy: number,
  size: number,
  isLight: boolean,
  isHovered: boolean
) => {
  ctx.save();
  const rad = size / 2;

  // 1. Badge Outer Circle Background with Shadow & Glow
  ctx.beginPath();
  ctx.arc(cx, cy, rad, 0, Math.PI * 2);
  ctx.fillStyle = isLight ? '#ffffff' : '#0a192f';
  ctx.shadowColor = isLight ? 'rgba(2, 132, 199, 0.4)' : 'rgba(6, 182, 212, 0.6)';
  ctx.shadowBlur = isHovered ? 8 : 4;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = 1;
  ctx.fill();

  // 2. High-contrast Badge Ring
  ctx.lineWidth = isHovered ? 1.6 : 1.2;
  ctx.strokeStyle = isLight ? '#0284c7' : '#22d3ee';
  ctx.stroke();

  // 3. Crisp Vector Camera/Photo Icon inside
  const s = size * 0.58;
  const half = s / 2;
  const x = cx - half;
  const y = cy - half;

  ctx.shadowBlur = 0; // reset shadow for sharp icon strokes
  ctx.strokeStyle = isLight ? '#0284c7' : '#22d3ee';
  ctx.fillStyle = isLight ? '#0284c7' : '#22d3ee';
  ctx.lineWidth = Math.max(1.0, s * 0.13);
  ctx.lineCap = 'round';
  ctx.lineJoin = 'round';

  // Frame (rounded rectangle)
  ctx.beginPath();
  if (typeof ctx.roundRect === 'function') {
    ctx.roundRect(x, y, s, s * 0.82, s * 0.16);
  } else {
    ctx.rect(x, y, s, s * 0.82);
  }
  ctx.stroke();

  // Sun dot
  ctx.beginPath();
  ctx.arc(x + s * 0.3, y + s * 0.28, s * 0.1, 0, Math.PI * 2);
  ctx.fill();

  // Mountain ridges
  ctx.beginPath();
  ctx.moveTo(x + s * 0.16, y + s * 0.68);
  ctx.lineTo(x + s * 0.44, y + s * 0.42);
  ctx.lineTo(x + s * 0.6, y + s * 0.55);
  ctx.lineTo(x + s * 0.84, y + s * 0.68);
  ctx.stroke();

  ctx.restore();
};

// Helper: Shape-aware adaptive hit testing for nodes
const hitTestSimNode = (
  node: SimNode,
  worldPos: { x: number; y: number },
  shape: NodeShapeType,
  zoom: number,
  extraPadding = 0
): boolean => {
  if (node.nodeType === 'image') {
    const dist = Math.hypot(node.x - worldPos.x, node.y - worldPos.y);
    return dist <= Math.max(node.radius + 8 + extraPadding, (20 + extraPadding) / zoom);
  }

  if (shape === 'rounded-box') {
    const titleLen = (node.title || '').length;
    const nodeTags = Array.isArray(node.tags)
      ? node.tags
      : typeof node.tags === 'string'
        ? (node.tags as string).replace(/[\[\]"]/g, '').split(',').map((t) => t.trim()).filter(Boolean)
        : [];
    const hasSubtitle = nodeTags.length > 0 || Boolean(node.note);

    const baseW = Math.max(105, Math.min(220, titleLen * 9.2 + 42));
    const baseH = hasSubtitle ? 50 : 36;
    const halfW = Math.max(baseW / 2 + 5 + extraPadding, (24 + extraPadding) / zoom);
    const halfH = Math.max(baseH / 2 + 5 + extraPadding, (18 + extraPadding) / zoom);
    return Math.abs(worldPos.x - node.x) <= halfW && Math.abs(worldPos.y - node.y) <= halfH;
  }

  if (shape === 'capsule') {
    const titleLen = (node.title || '').length;
    const w = Math.max(36, (titleLen * 7.2 + 20) * 0.7);
    const h = 22 * 0.7;
    const halfW = Math.max(w / 2 + 4 + extraPadding, (14 + extraPadding) / zoom);
    const halfH = Math.max(h / 2 + 4 + extraPadding, (12 + extraPadding) / zoom);
    return Math.abs(worldPos.x - node.x) <= halfW && Math.abs(worldPos.y - node.y) <= halfH;
  }

  const rad = (shape === 'hexagon' ? (8.0 + (node.importance / 10) * 4.0) : (5.5 + (node.importance / 10) * 3.5)) * 0.7;
  const hitRadius = Math.max(rad + 6 + extraPadding, (16 + extraPadding) / zoom);
  const dist = Math.hypot(node.x - worldPos.x, node.y - worldPos.y);
  return dist <= hitRadius;
};

interface SimNode {
  id: string;
  title: string;
  importance: number;
  note: string;
  tags: string[];
  nodeType: 'text' | 'image';
  imageUrl: string;
  imageSize: 'small' | 'medium' | 'large';
  highlighted: boolean;
  highlightColor: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  fx: number;
  fy: number;
  radius: number;
  fixed: boolean;
  phase: number;
  imageElement?: HTMLImageElement | null;
  original: MindNode;
}

export const PhysicsGraphCanvas: React.FC<PhysicsGraphCanvasProps> = ({
  onEditNode,
  onOpenSubTopics,
  onOpenSocratic,
  onDeepDiveNode,
}) => {
  const canvasRef = useRef<HTMLCanvasElement | null>(null);

  const {
    pages,
    activePageId,
    nodes: storeNodes,
    edges: storeEdges,
    selectedNodeId,
    setSelectedNodeId,
    addEdge,
    updateEdge,
    deleteNode,
    deleteEdge,
    batchUpdatePositions,
    updateNode,
    searchQuery,
    activeTagFilter,
    addNode,
    clearCurrentPageNodes,
    isLoading,
  } = useGraphStore();

  const {
    language,
    themeMode,
    canvasBackground,
    customBackgroundImage,
    customBackgroundColor,
    backgroundOverlayOpacity,
    showBackgroundGrid,
    showEdgeLabels,
  } = useSettingsStore();
  const { t, isRtl } = useTranslation(language);
  const isLight = themeMode === 'light';

  const activePage = pages.find((p) => p.id === activePageId);
  const currentTheme = getGraphTheme(activePage?.theme, isLight);

  // Clear Graph Confirmation Modal State
  const [isClearConfirmOpen, setIsClearConfirmOpen] = useState(false);

  // Camera Pan & Zoom Transform
  const [camera, setCamera] = useState({ x: 0, y: 0, zoom: 1 });
  const cameraRef = useRef(camera);
  cameraRef.current = camera;

  // Hovered and drag states
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Context Menu State (Node, Edge or Empty Canvas)
  const [contextMenu, setContextMenu] = useState<{
    x: number;
    y: number;
    worldX: number;
    worldY: number;
    node?: MindNode;
    edge?: MindEdge;
    isEmptyCanvas?: boolean;
  } | null>(null);

  // Image Node Dialog state
  const [isAddImageOpen, setIsAddImageOpen] = useState(false);
  const [addImagePos, setAddImagePos] = useState<{ x: number; y: number }>({ x: 0, y: 0 });
  const [addImageParentId, setAddImageParentId] = useState<string | null>(null);
  const addImageParentIdRef = useRef<string | null>(null);

  // Set of edge IDs whose labels should be displayed on the canvas (per-edge visibility)
  const [visibleEdgeLabelIds, setVisibleEdgeLabelIds] = useState<Set<string>>(() => {
    try {
      const saved = localStorage.getItem('mindmap_visible_edge_labels');
      if (saved) return new Set(JSON.parse(saved));
    } catch (e) { }
    return new Set();
  });

  // Direct Edge Edit Dialog state (Triggered on Double Click or Context Menu)
  const [editingEdgeDialog, setEditingEdgeDialog] = useState<{
    edge: MindEdge;
    screenX: number;
    screenY: number;
    label: string;
    sourceTitle: string;
    targetTitle: string;
  } | null>(null);

  // Physics simulation data ref
  const simNodesRef = useRef<Map<string, SimNode>>(new Map());
  const imageCacheRef = useRef<Map<string, HTMLImageElement>>(new Map());
  const draggingNodeIdRef = useRef<string | null>(null);
  const isPanningRef = useRef(false);
  const panStartRef = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Shift + Drag Link creation state
  const linkingSourceIdRef = useRef<string | null>(null);
  const linkTargetIdRef = useRef<string | null>(null);
  const currentMouseWorldPos = useRef<{ x: number; y: number }>({ x: 0, y: 0 });

  // Animation time
  const animTimeRef = useRef(0);
  const isPhysicsRunningRef = useRef(true);
  const bgImageRef = useRef<HTMLImageElement | null>(null);

  useEffect(() => {
    const defaultImg = isLight ? '/Backgrounds/white_2.png' : '/Backgrounds/Black_1.jpg';
    const targetSrc = customBackgroundImage && customBackgroundImage !== '/Background.jpg' ? customBackgroundImage : defaultImg;
    const img = new Image();
    img.src = targetSrc;
    img.onload = () => {
      bgImageRef.current = img;
    };
  }, [canvasBackground, customBackgroundImage, isLight]);

  // Clear physics simulation nodes cache when switching active page
  useEffect(() => {
    simNodesRef.current.clear();
  }, [activePageId]);

  // Helper: Get node radius & styling based on theme
  const getNodeStyle = (node: Partial<MindNode>, theme: GraphThemeDefinition = currentTheme) => {
    const isImage = node.nodeType === 'image';
    let radius = 6.5; // Compact minimal dot matching desktop

    if (isImage) {
      const size = node.imageSize || 'small';
      radius = size === 'large' ? 32 : size === 'medium' ? 24 : 18;
    } else {
      const imp = node.importance || 5;
      radius = (5.5 + (imp / 10) * 3.5) * 0.7; // 30% smaller (compact & minimal)
    }

    const fillColor = theme.node.baseFill;
    const borderColor = theme.node.baseBorder;
    const glowColor = theme.halos.hoverInner;

    return { radius, fillColor, borderColor, glowColor };
  };

  // Helper: Preload and cache images
  const getImageElement = (url: string): HTMLImageElement | null => {
    if (!url) return null;
    if (imageCacheRef.current.has(url)) {
      return imageCacheRef.current.get(url)!;
    }
    const img = new Image();
    img.src = url;
    imageCacheRef.current.set(url, img);
    return img;
  };

  // Synchronize store nodes with physics simulation nodes
  useEffect(() => {
    const map = simNodesRef.current;
    const activeIds = new Set<string>();

    storeNodes.forEach((node, index) => {
      activeIds.add(node.id);
      const style = getNodeStyle(node);
      const imgElem = node.imageUrl ? getImageElement(node.imageUrl) : null;

      if (!map.has(node.id)) {
        // If position exists use it, otherwise disperse around center
        const posX = typeof node.posX === 'number' && !isNaN(node.posX) ? node.posX : (Math.random() - 0.5) * 150;
        const posY = typeof node.posY === 'number' && !isNaN(node.posY) ? node.posY : (Math.random() - 0.5) * 150;

        map.set(node.id, {
          id: node.id,
          title: node.title,
          importance: node.importance || 5,
          note: node.note || '',
          tags: node.tags || [],
          nodeType: node.nodeType || 'text',
          imageUrl: node.imageUrl || '',
          imageSize: node.imageSize || 'small',
          highlighted: Boolean(node.highlighted),
          highlightColor: node.highlightColor || 'gold',
          x: posX,
          y: posY,
          vx: 0,
          vy: 0,
          fx: 0,
          fy: 0,
          radius: style.radius,
          fixed: false,
          phase: Math.random() * Math.PI * 2,
          imageElement: imgElem,
          original: node,
        });
      } else {
        // Update existing node data
        const item = map.get(node.id)!;
        item.title = node.title;
        item.importance = node.importance || 5;
        item.note = node.note || '';
        item.tags = node.tags || [];
        item.nodeType = node.nodeType || 'text';
        item.imageUrl = node.imageUrl || '';
        item.imageSize = node.imageSize || 'small';
        item.highlighted = Boolean(node.highlighted);
        item.highlightColor = node.highlightColor || 'gold';
        item.radius = style.radius;
        item.imageElement = imgElem;
        item.original = node;
      }
    });

    // Remove deleted nodes
    for (const id of Array.from(map.keys())) {
      if (!activeIds.has(id)) {
        map.delete(id);
      }
    }
  }, [storeNodes]);

  // Center camera on initial load
  useEffect(() => {
    if (canvasRef.current) {
      const rect = canvasRef.current.getBoundingClientRect();
      setCamera({
        x: rect.width / 2,
        y: rect.height / 2,
        zoom: 1,
      });
    }
  }, []);

  // Auto fit-view when active page changes and nodes exist
  const lastFittedPageIdRef = useRef<string | null>(null);
  useEffect(() => {
    if (activePageId && storeNodes.length > 0 && lastFittedPageIdRef.current !== activePageId) {
      lastFittedPageIdRef.current = activePageId;
      const timer = setTimeout(() => {
        handleFitView();
      }, 200);
      return () => clearTimeout(timer);
    }
  }, [activePageId, storeNodes.length]);

  // Keyboard shortcut: Delete / Backspace to delete selected node
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      const activeEl = document.activeElement as HTMLElement | null;
      if (
        activeEl &&
        (activeEl.tagName === 'INPUT' ||
          activeEl.tagName === 'TEXTAREA' ||
          activeEl.isContentEditable)
      ) {
        return;
      }

      if (e.key === 'Delete' || e.key === 'Backspace') {
        if (selectedNodeId) {
          e.preventDefault();
          const target = storeNodes.find((n) => n.id === selectedNodeId);
          const name = target?.title || (language === 'fa' ? 'این نود' : 'this node');
          if (confirm(language === 'fa' ? `آیا از حذف نود «${name}» اطمینان دارید؟` : `Are you sure you want to delete node "${name}"?`)) {
            deleteNode(selectedNodeId);
            setSelectedNodeId(null);
          }
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [selectedNodeId, storeNodes, deleteNode, setSelectedNodeId]);

  // Screen to World coordinates
  const screenToWorld = useCallback((screenX: number, screenY: number) => {
    const cam = cameraRef.current;
    return {
      x: (screenX - cam.x) / cam.zoom,
      y: (screenY - cam.y) / cam.zoom,
    };
  }, []);

  // World to Screen coordinates
  const worldToScreen = useCallback((worldX: number, worldY: number) => {
    const cam = cameraRef.current;
    return {
      x: worldX * cam.zoom + cam.x,
      y: worldY * cam.zoom + cam.y,
    };
  }, []);

  // Main 60 FPS Physics Simulation and Rendering Engine
  useEffect(() => {
    let animationFrameId: number;

    const render = () => {
      if (typeof document !== 'undefined' && document.hidden) {
        animationFrameId = requestAnimationFrame(render);
        return;
      }
      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      const dpr = window.devicePixelRatio || 1;
      const width = canvas.clientWidth;
      const height = canvas.clientHeight;

      if (canvas.width !== width * dpr || canvas.height !== height * dpr) {
        canvas.width = width * dpr;
        canvas.height = height * dpr;
      }

      ctx.save();
      ctx.scale(dpr, dpr);
      ctx.clearRect(0, 0, width, height);

      const simNodes = Array.from(simNodesRef.current.values());
      const nCount = simNodes.length;

      const isTreeOrFlowchart =
        currentTheme.id === 'matrix' ||
        currentTheme.nodeShape === 'rounded-box' ||
        currentTheme.connectionStyle === 'curved';
      const edgeSpacingMult = isTreeOrFlowchart ? 1.35 : 1.0;

      const dt = 0.036;
      const lRest = 84.0 * edgeSpacingMult; // 35% increased spacing for Tree & Flowchart (113.4px vs 84px)
      const repulsionRadius = 168.0 * edgeSpacingMult; // 35% increased repulsion radius for Tree & Flowchart (226.8px vs 168px)
      const damping = 0.86;
      const maxVel = 42.0;

      animTimeRef.current += dt;

      // ----------------------------------------------------
      // 1. Physics Step (Zero-G Drift + Coulomb Repulsion + Springs)
      // ----------------------------------------------------
      if (isPhysicsRunningRef.current && nCount > 0) {
        // Reset forces
        for (const node of simNodes) {
          node.fx = 0;
          node.fy = 0;

          // Subtle zero-G celestial floating waves
          if (!node.fixed && node.id !== draggingNodeIdRef.current) {
            const driftSpeed = 0.75;
            const driftAmp = 1.0;
            node.fx += Math.sin(animTimeRef.current * driftSpeed + node.phase) * driftAmp;
            node.fy += Math.cos(animTimeRef.current * (driftSpeed * 0.75) + node.phase) * (driftAmp * 0.8);
          }
        }

        // Smooth Anti-Gravity Coulomb Repulsion between all node pairs
        for (let i = 0; i < nCount; i++) {
          const n1 = simNodes[i];
          for (let j = i + 1; j < nCount; j++) {
            const n2 = simNodes[j];
            const dx = n2.x - n1.x;
            const dy = n2.y - n1.y;
            const dist = Math.hypot(dx, dy) + 0.001;

            if (dist < repulsionRadius) {
              const ratio = 1.0 - dist / repulsionRadius;
              const repForce = ratio * ratio * 800.0;
              const fxRep = (dx / dist) * repForce;
              const fyRep = (dy / dist) * repForce;

              n1.fx -= fxRep;
              n1.fy -= fyRep;
              n2.fx += fxRep;
              n2.fy += fyRep;
            }
          }
        }

        // Hooke's Elastic Spring Tension on Connected Edges
        for (const edge of storeEdges) {
          const n1 = simNodesRef.current.get(edge.sourceNodeId);
          const n2 = simNodesRef.current.get(edge.targetNodeId);
          if (!n1 || !n2) continue;

          const dx = n2.x - n1.x;
          const dy = n2.y - n1.y;
          const dist = Math.hypot(dx, dy) + 0.001;

          const displacement = dist - lRest;
          const springForce = displacement * 3.6 * (edge.weight || 1.0);
          const fx = (dx / dist) * springForce;
          const fy = (dy / dist) * springForce;

          n1.fx += fx;
          n1.fy += fy;
          n2.fx -= fx;
          n2.fy -= fy;
        }

        // Center gravity pulling isolated nodes gently towards world origin
        for (const node of simNodes) {
          if (node.id === draggingNodeIdRef.current) continue;
          node.fx -= node.x * 0.006;
          node.fy -= node.y * 0.006;

          // Integrate acceleration and velocity with damping
          node.vx = (node.vx + node.fx * dt) * damping;
          node.vy = (node.vy + node.fy * dt) * damping;

          // Clamp velocity
          const v = Math.hypot(node.vx, node.vy);
          if (v > maxVel) {
            node.vx = (node.vx / v) * maxVel;
            node.vy = (node.vy / v) * maxVel;
          }

          if (!node.fixed) {
            node.x += node.vx * dt;
            node.y += node.vy * dt;
          }
        }
      }

      // ----------------------------------------------------
      // 2. Rendering Background Image & Grid
      // ----------------------------------------------------
      const cam = cameraRef.current;
      const GRAY_LIGHT_BG = '#E2E8F0';

      if (canvasBackground === 'nebula' || canvasBackground === 'image') {
        if (bgImageRef.current && bgImageRef.current.complete) {
          ctx.save();
          const img = bgImageRef.current;
          const scale = Math.max(width / img.width, height / img.height);
          const w = img.width * scale;
          const h = img.height * scale;
          const x = (width - w) / 2;
          const y = (height - h) / 2;
          ctx.drawImage(img, x, y, w, h);

          // Extra overlay on top of background image (completely transparent in light mode)
          if (!isLight) {
            const overlayAlpha = typeof backgroundOverlayOpacity === 'number' ? backgroundOverlayOpacity : 0.35;
            ctx.fillStyle = `rgba(8, 12, 20, ${overlayAlpha})`;
            ctx.fillRect(0, 0, width, height);
          }
          ctx.restore();
        } else {
          ctx.save();
          ctx.fillStyle = isLight ? GRAY_LIGHT_BG : '#0B0F19';
          ctx.fillRect(0, 0, width, height);
          ctx.restore();
        }
      } else if (canvasBackground === 'solid') {
        ctx.save();
        ctx.fillStyle = customBackgroundColor || (isLight ? GRAY_LIGHT_BG : '#0B0F19');
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      } else if (canvasBackground === 'obsidian') {
        ctx.save();
        const grad = ctx.createRadialGradient(width / 2, height / 2, 50, width / 2, height / 2, Math.max(width, height));
        if (isLight) {
          grad.addColorStop(0, '#F1F5F9');
          grad.addColorStop(1, '#CBD5E1');
        } else {
          grad.addColorStop(0, '#0f172a');
          grad.addColorStop(1, '#020617');
        }
        ctx.fillStyle = grad;
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      } else if (canvasBackground === 'grid') {
        ctx.save();
        ctx.fillStyle = isLight ? GRAY_LIGHT_BG : '#090d16';
        ctx.fillRect(0, 0, width, height);

        const gridSize = 40 * cam.zoom;
        const offsetX = cam.x % gridSize;
        const offsetY = cam.y % gridSize;

        ctx.strokeStyle = isLight ? 'rgba(148, 163, 184, 0.45)' : 'rgba(56, 189, 248, 0.12)';
        ctx.lineWidth = 1;
        ctx.beginPath();
        for (let x = offsetX; x < width; x += gridSize) {
          ctx.moveTo(x, 0);
          ctx.lineTo(x, height);
        }
        for (let y = offsetY; y < height; y += gridSize) {
          ctx.moveTo(0, y);
          ctx.lineTo(width, y);
        }
        ctx.stroke();
        ctx.restore();
      } else if (canvasBackground === 'dots') {
        ctx.save();
        ctx.fillStyle = isLight ? GRAY_LIGHT_BG : '#080c14';
        ctx.fillRect(0, 0, width, height);
        ctx.restore();
      }

      // Draw dot matrix overlay if enabled
      if (
        showBackgroundGrid &&
        (canvasBackground === 'dots' ||
          canvasBackground === 'nebula' ||
          canvasBackground === 'image' ||
          canvasBackground === 'solid')
      ) {
        const gridSize = 32 * cam.zoom;
        const offsetX = cam.x % gridSize;
        const offsetY = cam.y % gridSize;

        ctx.fillStyle = isLight ? 'rgba(100, 116, 139, 0.45)' : currentTheme.canvas.gridColor;
        ctx.globalAlpha = isLight ? 0.45 : currentTheme.canvas.gridAlpha;
        for (let x = offsetX; x < width; x += gridSize) {
          for (let y = offsetY; y < height; y += gridSize) {
            ctx.beginPath();
            ctx.arc(x, y, 1.2, 0, Math.PI * 2);
            ctx.fill();
          }
        }
        ctx.globalAlpha = 1.0;
      }

      // ----------------------------------------------------
      // 3. Draw Spring Edges (Styled Connection Lines)
      // ----------------------------------------------------
      for (const edge of storeEdges) {
        const n1 = simNodesRef.current.get(edge.sourceNodeId);
        const n2 = simNodesRef.current.get(edge.targetNodeId);
        if (!n1 || !n2) continue;

        const p1 = worldToScreen(n1.x, n1.y);
        const p2 = worldToScreen(n2.x, n2.y);

        const isSelected = selectedNodeId === n1.id || selectedNodeId === n2.id || hoveredEdgeId === edge.id;
        const isHovered = hoveredEdgeId === edge.id;

        ctx.save();
        drawConnectionPath(ctx, p1, p2, currentTheme.connectionStyle);

        if (isHovered) {
          ctx.strokeStyle = currentTheme.edge.strokeHovered;
          ctx.lineWidth = 2.2 * cam.zoom;
          ctx.setLineDash([4, 4]);
        } else if (isSelected) {
          ctx.strokeStyle = currentTheme.edge.strokeSelected;
          ctx.lineWidth = 2.0 * cam.zoom;
          ctx.setLineDash([]);
        } else {
          ctx.strokeStyle = currentTheme.edge.strokeDefault;
          ctx.lineWidth = 1.2 * cam.zoom;
          ctx.setLineDash([]);
        }

        ctx.stroke();

        // 3.1. Animated Flow on Curved Edges (Slow, Gentle, Smooth Movement)
        if (currentTheme.connectionStyle === 'curved') {
          // A. Slow Gentle Flowing Dash Stream along bezier curve
          ctx.save();
          ctx.beginPath();
          drawConnectionPath(ctx, p1, p2, 'curved');
          ctx.strokeStyle = isHovered || isSelected ? currentTheme.edge.strokeHovered : currentTheme.edge.strokeSelected;
          ctx.lineWidth = (isHovered ? 1.6 : 1.1) * cam.zoom;
          ctx.setLineDash([3, 9]);
          ctx.lineDashOffset = -animTimeRef.current * 7; // Slow & tranquil
          ctx.globalAlpha = isHovered || isSelected ? 0.8 : 0.4;
          ctx.stroke();
          ctx.restore();

          // B. Gentle Slow-Moving Soft Light Droplet
          const edgeSeed = ((edge.id.charCodeAt(0) || 1) * 37 + (edge.id.charCodeAt(edge.id.length - 1) || 3) * 19) % 100 / 100;
          const flowProgress = ((animTimeRef.current * 0.16 + edgeSeed) % 1.0); // Gentle slow motion
          const pulsePt = getCurvedPoint(p1, p2, flowProgress);

          ctx.save();
          ctx.beginPath();
          ctx.arc(pulsePt.x, pulsePt.y, (isSelected || isHovered ? 2.0 : 1.5) * cam.zoom, 0, Math.PI * 2);
          ctx.fillStyle = currentTheme.edge.strokeHovered;
          ctx.shadowColor = currentTheme.previewColor;
          ctx.shadowBlur = 6 * cam.zoom;
          ctx.globalAlpha = isSelected || isHovered ? 0.85 : 0.55;
          ctx.fill();
          ctx.restore();
        }

        // Edge Label: Only visible if specifically enabled for this individual edge (or currently being edited)
        const isLabelVisible = (visibleEdgeLabelIds.has(edge.id) || editingEdgeDialog?.edge.id === edge.id) && Boolean(edge.label);
        if (isLabelVisible && edge.label) {
          const midX = (p1.x + p2.x) / 2;
          const midY = (p1.y + p2.y) / 2;

          ctx.font = `600 ${Math.max(10, Math.min(13, 11 * cam.zoom))}px Vazirmatn, Inter, sans-serif`;
          const textMetrics = ctx.measureText(edge.label);
          const textWidth = textMetrics.width;
          const padX = 3.5 * cam.zoom;
          const padY = 1.2 * cam.zoom;
          const boxW = Math.max(16, textWidth + padX * 2);
          const boxH = Math.max(13, 12 * cam.zoom + padY * 2);
          const x0 = midX - boxW / 2;
          const y0 = midY - boxH / 2;

          ctx.save();

          // 1. Box Background
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x0, y0, boxW, boxH, 2.5 * cam.zoom);
          } else {
            ctx.rect(x0, y0, boxW, boxH);
          }
          ctx.fillStyle = isSelected || isHovered ? currentTheme.edge.labelHoverBg : currentTheme.edge.labelBg;
          ctx.fill();

          // 2. Compact Themed Border
          ctx.lineWidth = isSelected || isHovered ? 1.2 : 0.85;
          ctx.strokeStyle = isSelected || isHovered ? currentTheme.edge.labelHoverBorder : currentTheme.edge.labelBorder;
          ctx.stroke();

          // 3. Themed Text
          ctx.fillStyle = isSelected || isHovered ? currentTheme.edge.labelHoverText : currentTheme.edge.labelText;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';
          ctx.fillText(edge.label, midX, midY + 0.5);

          ctx.restore();
        }

        ctx.restore();
      }

      // ----------------------------------------------------
      // 4. Draw Shift + Drag Tether Link Line
      // ----------------------------------------------------
      if (linkingSourceIdRef.current) {
        const srcNode = simNodesRef.current.get(linkingSourceIdRef.current);
        if (srcNode) {
          const p1 = worldToScreen(srcNode.x, srcNode.y);
          const p2 = worldToScreen(currentMouseWorldPos.current.x, currentMouseWorldPos.current.y);

          ctx.save();
          drawConnectionPath(ctx, p1, p2, currentTheme.connectionStyle);
          ctx.strokeStyle = currentTheme.edge.tetherStroke;
          ctx.lineWidth = 1.8 * cam.zoom;
          ctx.setLineDash([5, 5]);
          ctx.stroke();

          // Anchor dot
          ctx.beginPath();
          ctx.arc(p2.x, p2.y, 3.5 * cam.zoom, 0, Math.PI * 2);
          ctx.fillStyle = currentTheme.edge.tetherDot;
          ctx.fill();
          ctx.restore();
        }
      }

      // ----------------------------------------------------
      // 5. Draw Styled Nodes (Shapes: Circle, Rounded-Box, Capsule, Hexagon)
      // ----------------------------------------------------
      for (const node of simNodes) {
        // Safe tags parsing for filtering & matching
        const nodeTags = Array.isArray(node.tags)
          ? node.tags
          : typeof node.tags === 'string'
            ? (node.tags as string).replace(/[\[\]"]/g, '').split(',').map((t) => t.trim()).filter(Boolean)
            : [];

        // Check filter visibility (only text searchQuery dims, selecting a tag keeps all nodes solid)
        let isDimmed = false;
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchTitle = node.title.toLowerCase().includes(q);
          const matchTag = nodeTags.some((t: string) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchTag) isDimmed = true;
        }

        const isTagMatch = Boolean(activeTagFilter && nodeTags.includes(activeTagFilter));

        const p = worldToScreen(node.x, node.y);
        const shape = currentTheme.nodeShape;
        const dim = getNodeDimensions(node, shape, cam.zoom);

        const isSelected = selectedNodeId === node.id;
        const isHovered = hoveredNodeId === node.id;
        const isLinkTarget = linkTargetIdRef.current === node.id;
        const isHighlighted = node.highlighted;
        const isImageNode = node.nodeType === 'image';
        const isInsideCard = !isImageNode && (shape === 'rounded-box' || shape === 'capsule');
        const hasLoopWave = isTagMatch || isSelected;

        ctx.save();
        if (isDimmed) ctx.globalAlpha = 0.25;

        // A0. Loop Wave Animation for Selected Node or Active Tag Match
        if (hasLoopWave) {
          const wavePeriod = 3.2;
          const numWaves = 2;
          const maxExpansion = (node.nodeType === 'image' ? 25 : 20) * cam.zoom;

          for (let w = 0; w < numWaves; w++) {
            const waveProgress = ((animTimeRef.current / wavePeriod) + (w / numWaves)) % 1.0;
            const extra = waveProgress * maxExpansion;
            const alpha = Math.sin((1 - waveProgress) * (Math.PI / 2)) * (1 - waveProgress) * 0.75;

            let waveColor = currentTheme.wave.primaryRgba(alpha);
            if (node.highlighted) {
              if (node.highlightColor === 'red') {
                waveColor = `rgba(239, 68, 68, ${alpha})`;
              } else if (node.highlightColor === 'green') {
                waveColor = `rgba(34, 197, 94, ${alpha})`;
              } else {
                waveColor = `rgba(245, 158, 11, ${alpha})`;
              }
            } else if (node.importance >= 8) {
              waveColor = `rgba(244, 63, 94, ${alpha})`;
            } else if (node.importance >= 6) {
              waveColor = `rgba(245, 158, 11, ${alpha})`;
            }

            ctx.save();
            const waveDim = {
              width: dim.width + extra * 2,
              height: dim.height + extra * 2,
              radius: dim.radius + extra,
              isImage: dim.isImage,
            };
            drawShapePath(ctx, p.x, p.y, shape, waveDim);
            ctx.lineWidth = Math.max(0.9, (1.5 - waveProgress * 0.8) * cam.zoom);
            ctx.strokeStyle = waveColor;
            ctx.stroke();
            ctx.restore();
          }
        }

        // A. Radiant Glowing Halos on Highlight / Select / Hover / Link Target
        const haloExtra = isSelected ? 12 * cam.zoom : isHovered ? 8 * cam.zoom : isHighlighted ? 14 * cam.zoom : isLinkTarget ? 12 * cam.zoom : 0;
        if (haloExtra > 0) {
          const haloDim = {
            width: dim.width + haloExtra * 2,
            height: dim.height + haloExtra * 2,
            radius: dim.radius + haloExtra,
            isImage: dim.isImage,
          };

          const gradient = ctx.createRadialGradient(
            p.x,
            p.y,
            dim.radius * 0.3,
            p.x,
            p.y,
            haloDim.radius + (shape === 'rounded-box' || shape === 'capsule' ? haloDim.width / 4 : 0)
          );

          if (isLinkTarget) {
            gradient.addColorStop(0, currentTheme.halos.linkTargetInner);
            gradient.addColorStop(1, currentTheme.halos.linkTargetOuter);
          } else if (isHighlighted) {
            if (node.highlightColor === 'red') {
              gradient.addColorStop(0, 'rgba(239, 68, 68, 0.8)');
              gradient.addColorStop(1, 'rgba(185, 28, 28, 0)');
            } else if (node.highlightColor === 'green') {
              gradient.addColorStop(0, 'rgba(34, 197, 94, 0.8)');
              gradient.addColorStop(1, 'rgba(21, 128, 61, 0)');
            } else {
              gradient.addColorStop(0, 'rgba(245, 158, 11, 0.8)');
              gradient.addColorStop(1, 'rgba(245, 158, 11, 0)');
            }
          } else if (isSelected) {
            gradient.addColorStop(0, currentTheme.halos.selectedInner);
            gradient.addColorStop(1, currentTheme.halos.selectedOuter);
          } else {
            gradient.addColorStop(0, currentTheme.halos.hoverInner);
            gradient.addColorStop(1, currentTheme.halos.hoverOuter);
          }

          drawShapePath(ctx, p.x, p.y, shape, haloDim);
          ctx.fillStyle = gradient;
          ctx.fill();
        }

        // B. Node Body Fill and Border
        let fillCol = currentTheme.node.baseFill;
        let borderCol = currentTheme.node.baseBorder;
        let penWidth = (1.2 + (node.importance / 10) * 0.6) * cam.zoom;

        if (isLinkTarget) {
          fillCol = currentTheme.node.linkTargetFill;
          borderCol = currentTheme.node.linkTargetBorder;
          penWidth = 2.4 * cam.zoom;
        } else if (isHighlighted) {
          if (node.highlightColor === 'red') {
            fillCol = '#dc2626';
            borderCol = '#ff3355';
          } else if (node.highlightColor === 'green') {
            fillCol = '#16a34a';
            borderCol = '#22c55e';
          } else {
            fillCol = '#d97706';
            borderCol = '#fde047';
          }
          penWidth = 2.2 * cam.zoom;
        } else if (isSelected) {
          fillCol = currentTheme.node.selectedFill;
          borderCol = currentTheme.node.selectedBorder;
          penWidth = 2.0 * cam.zoom;
        } else if (isHovered) {
          fillCol = currentTheme.node.hoverFill;
          borderCol = currentTheme.node.hoverBorder;
          penWidth = 1.6 * cam.zoom;
        }

        if (isImageNode && node.imageElement?.complete) {
          // Circular clipped image rendering
          ctx.save();
          ctx.beginPath();
          ctx.arc(p.x, p.y, dim.radius, 0, Math.PI * 2);
          ctx.clip();
          ctx.drawImage(node.imageElement, p.x - dim.radius, p.y - dim.radius, dim.radius * 2, dim.radius * 2);
          ctx.restore();

          // Border on top of image
          ctx.beginPath();
          ctx.arc(p.x, p.y, dim.radius, 0, Math.PI * 2);
          ctx.lineWidth = penWidth;
          ctx.strokeStyle = borderCol;
          ctx.stroke();
        } else if (shape === 'rounded-box') {
          // Minimalist Executive Flowchart Card (High-contrast Porcelain Card on Navy Canvas)
          const x0 = p.x - dim.width / 2;
          const y0 = p.y - dim.height / 2;
          const r = 6 * cam.zoom;

          // 1. Crisp Card Background
          const cardGrad = ctx.createLinearGradient(p.x, y0, p.x, y0 + dim.height);
          if (isLight) {
            if (isSelected) {
              cardGrad.addColorStop(0, '#0284c7');
              cardGrad.addColorStop(1, '#0369a1');
            } else if (isHovered) {
              cardGrad.addColorStop(0, '#ffffff');
              cardGrad.addColorStop(1, '#f0f9ff');
            } else {
              cardGrad.addColorStop(0, '#ffffff');
              cardGrad.addColorStop(1, '#f8fafc');
            }
          } else {
            cardGrad.addColorStop(0, isSelected ? '#1c2e4a' : isHovered ? '#16253d' : '#0e1828');
            cardGrad.addColorStop(1, isSelected ? '#122036' : isHovered ? '#0f1b2e' : '#09101d');
          }

          drawShapePath(ctx, p.x, p.y, shape, dim);
          ctx.fillStyle = isHighlighted ? fillCol : cardGrad;
          ctx.fill();

          // 2. High-Contrast Header Accent Line (2.2px)
          ctx.save();
          ctx.beginPath();
          if (typeof ctx.roundRect === 'function') {
            ctx.roundRect(x0 + 1, y0 + 1, dim.width - 2, 2.2 * cam.zoom, [r, r, 0, 0]);
          } else {
            ctx.rect(x0 + 1, y0 + 1, dim.width - 2, 2.2 * cam.zoom);
          }
          ctx.fillStyle = isHighlighted
            ? borderCol
            : isSelected
              ? (isLight ? '#7dd3fc' : 'rgba(56, 189, 248, 0.85)')
              : isHovered
                ? (isLight ? '#0284c7' : 'rgba(56, 189, 248, 0.65)')
                : (isLight ? '#0284c7' : 'rgba(56, 189, 248, 0.35)');
          ctx.fill();
          ctx.restore();

          // 3. Crisp Themed Border
          drawShapePath(ctx, p.x, p.y, shape, dim);
          ctx.lineWidth = isSelected ? 1.8 * cam.zoom : 1.2 * cam.zoom;
          ctx.strokeStyle = isSelected
            ? '#0284c7'
            : isHovered
              ? '#0284c7'
              : isLight
                ? '#94a3b8'
                : 'rgba(56, 189, 248, 0.28)';
          ctx.stroke();
        } else {
          // Geometric Shape rendering (Capsule pill, hexagon, circle)
          drawShapePath(ctx, p.x, p.y, shape, dim);
          ctx.fillStyle = fillCol;
          ctx.fill();

          ctx.lineWidth = penWidth;
          ctx.strokeStyle = borderCol;
          ctx.stroke();
        }

        // C. Typography Text Label (Inside Card/Pill for Tree & Mindmap, or Underneath for Circle, Hexagon & Image)
        const text = node.title;

        if (isImageNode) {
          // Text rendered underneath image node
          const labelY = p.y + dim.radius + 8 * cam.zoom;
          ctx.font = `${isSelected || isHighlighted ? 'bold ' : '500 '}${Math.max(10.5, Math.min(14, 12 * cam.zoom))}px Vazirmatn, Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          ctx.shadowColor = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.95)';
          ctx.shadowBlur = 4 * cam.zoom;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 1.2 * cam.zoom;

          if (isHighlighted) {
            ctx.fillStyle = node.highlightColor === 'red' ? '#dc2626' : node.highlightColor === 'green' ? '#16a34a' : '#d97706';
          } else if (isSelected) {
            ctx.fillStyle = isLight ? '#0284c7' : currentTheme.node.labelTextSelected;
          } else if (isHovered) {
            ctx.fillStyle = isLight ? '#0284c7' : currentTheme.node.labelTextHover;
          } else {
            ctx.fillStyle = isLight ? '#0f172a' : currentTheme.node.labelText;
          }

          ctx.fillText(text, p.x, labelY);
        } else if (shape === 'rounded-box') {
          const hasSubtitle = nodeTags.length > 0 || Boolean(node.note) || Boolean(node.imageUrl);

          if (hasSubtitle) {
            // Two-row layout: Title on top, Tag/Note/Image on bottom
            const titleY = p.y - 7.5 * cam.zoom;
            ctx.font = `${isSelected || isHighlighted ? 'bold ' : '700 '}${Math.max(11, Math.min(13.5, 11.5 * cam.zoom))}px Vazirmatn, Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (isHighlighted) {
              ctx.fillStyle = node.highlightColor === 'red' ? '#ffccd5' : node.highlightColor === 'green' ? '#bbf7d0' : '#fef08a';
            } else if (isSelected) {
              ctx.fillStyle = '#ffffff';
            } else if (isHovered) {
              ctx.fillStyle = isLight ? '#0284c7' : '#7dd3fc';
            } else {
              ctx.fillStyle = isLight ? '#0a192f' : '#f0f9ff';
            }

            ctx.fillText(text, p.x, titleY);

            // Row 2: Minimal Tag Badge / Image Indicator
            const subY = p.y + 10.5 * cam.zoom;
            let displayTag = nodeTags[0] ? `#${nodeTags[0]}` : '';
            if (!displayTag && node.imageUrl) {
              displayTag = language === 'fa' ? '🖼️ تصویر' : '🖼️ Image';
            } else if (!displayTag && node.note) {
              displayTag = language === 'fa' ? 'یادداشت' : 'Note';
            }

            if (displayTag) {
              ctx.font = `600 ${Math.max(9, Math.min(11, 9.5 * cam.zoom))}px Vazirmatn, Inter, sans-serif`;
              const tagMetrics = ctx.measureText(displayTag);
              const tagW = tagMetrics.width + 12 * cam.zoom;
              const tagH = 15 * cam.zoom;
              const tagX0 = p.x - tagW / 2;
              const tagY0 = subY - tagH / 2;

              ctx.save();
              ctx.beginPath();
              if (typeof ctx.roundRect === 'function') {
                ctx.roundRect(tagX0, tagY0, tagW, tagH, 3.5 * cam.zoom);
              } else {
                ctx.rect(tagX0, tagY0, tagW, tagH);
              }
              // Clean soft background
              ctx.fillStyle = isLight ? '#e0f2fe' : 'rgba(56, 189, 248, 0.14)';
              ctx.fill();

              ctx.fillStyle = isLight ? '#0369a1' : '#7dd3fc';
              ctx.textAlign = 'center';
              ctx.textBaseline = 'middle';
              ctx.fillText(displayTag, p.x, subY + 0.5);
              ctx.restore();
            }
          } else {
            // Single-row centered title
            ctx.font = `${isSelected || isHighlighted ? 'bold ' : '700 '}${Math.max(11, Math.min(13.5, 11.5 * cam.zoom))}px Vazirmatn, Inter, sans-serif`;
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';

            if (isHighlighted) {
              ctx.fillStyle = node.highlightColor === 'red' ? '#ffccd5' : node.highlightColor === 'green' ? '#bbf7d0' : '#fef08a';
            } else if (isSelected) {
              ctx.fillStyle = '#ffffff';
            } else if (isHovered) {
              ctx.fillStyle = isLight ? '#0284c7' : '#7dd3fc';
            } else {
              ctx.fillStyle = isLight ? '#0a192f' : '#f0f9ff';
            }

            ctx.fillText(text, p.x, p.y + 0.5);
          }
        } else if (isInsideCard) {
          // Text rendered inside capsule pill
          ctx.font = `${isSelected || isHighlighted ? 'bold ' : '600 '}${Math.max(10, Math.min(13, 11 * cam.zoom))}px Vazirmatn, Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'middle';

          if (isHighlighted) {
            ctx.fillStyle = node.highlightColor === 'red' ? '#ffccd5' : node.highlightColor === 'green' ? '#bbf7d0' : '#fef08a';
          } else if (isSelected) {
            ctx.fillStyle = currentTheme.node.labelTextSelected;
          } else if (isHovered) {
            ctx.fillStyle = currentTheme.node.labelTextHover;
          } else {
            ctx.fillStyle = currentTheme.node.labelText;
          }

          ctx.fillText(text, p.x, p.y + 0.5);
        } else {
          // Text rendered underneath node dot/crystal
          const labelY = p.y + dim.radius + 7 * cam.zoom;
          ctx.font = `${isSelected || isHighlighted ? 'bold ' : '600 '}${Math.max(10, Math.min(14, 11.5 * cam.zoom))}px Vazirmatn, Inter, sans-serif`;
          ctx.textAlign = 'center';
          ctx.textBaseline = 'top';

          ctx.shadowColor = isLight ? 'rgba(255, 255, 255, 0.95)' : 'rgba(0, 0, 0, 0.95)';
          ctx.shadowBlur = 4 * cam.zoom;
          ctx.shadowOffsetX = 0;
          ctx.shadowOffsetY = 1.2 * cam.zoom;

          if (isHighlighted) {
            ctx.fillStyle = node.highlightColor === 'red' ? '#dc2626' : node.highlightColor === 'green' ? '#16a34a' : '#d97706';
          } else if (isSelected) {
            ctx.fillStyle = isLight ? '#0284c7' : currentTheme.node.labelTextSelected;
          } else if (isHovered) {
            ctx.fillStyle = isLight ? '#0284c7' : currentTheme.node.labelTextHover;
          } else {
            ctx.fillStyle = isLight ? '#0f172a' : currentTheme.node.labelText;
          }

          ctx.fillText(text, p.x, labelY);
        }

        // D. Distinct Image Badge Icon on Canvas ONLY for text nodes with an attached image (image nodes do not need an icon)
        const isTextNodeWithImage = !isImageNode && Boolean(node.imageUrl);
        if (isTextNodeWithImage) {
          if (shape === 'rounded-box') {
            // Position badge prominently on the top-right corner of the flowchart card
            const badgeSize = Math.max(15, Math.min(22, 17 * cam.zoom));
            const badgeX = p.x + dim.width / 2 - badgeSize * 0.72;
            const badgeY = p.y - dim.height / 2 + badgeSize * 0.72;
            drawNodeImageBadge(ctx, badgeX, badgeY, badgeSize, isLight, isHovered);
          } else {
            // Position badge on top-right quadrant for circular, capsule, and hexagon text nodes
            const badgeSize = Math.max(14, Math.min(20, 16 * cam.zoom));
            const badgeX = p.x + dim.radius * 0.72;
            const badgeY = p.y - dim.radius * 0.72;
            drawNodeImageBadge(ctx, badgeX, badgeY, badgeSize, isLight, isHovered);
          }
        }

        ctx.restore();
      }

      ctx.restore();
      animationFrameId = requestAnimationFrame(render);
    };

    animationFrameId = requestAnimationFrame(render);
    return () => cancelAnimationFrame(animationFrameId);
  }, [storeEdges, selectedNodeId, hoveredNodeId, hoveredEdgeId, searchQuery, activeTagFilter, currentTheme, worldToScreen, visibleEdgeLabelIds, editingEdgeDialog]);

  // Mouse Handlers
  const handleMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    if (e.button === 1 || (e.button === 0 && e.altKey)) {
      isPanningRef.current = true;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      return;
    }

    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldPos = screenToWorld(mouseX, mouseY);

    // Find clicked node with adaptive hit testing across zoom levels and shapes
    let clickedNode: SimNode | null = null;
    for (const node of Array.from(simNodesRef.current.values())) {
      if (hitTestSimNode(node, worldPos, currentTheme.nodeShape, cameraRef.current.zoom)) {
        clickedNode = node;
        break;
      }
    }

    if (e.button === 0) {
      if (e.shiftKey && clickedNode) {
        // Shift + Drag: Start connecting link
        linkingSourceIdRef.current = clickedNode.id;
        linkTargetIdRef.current = null;
        currentMouseWorldPos.current = worldPos;
      } else if (clickedNode) {
        // Select and drag node
        setSelectedNodeId(clickedNode.id);
        draggingNodeIdRef.current = clickedNode.id;
        setContextMenu(null);
      } else {
        // Click on empty canvas: Clear selection or pan
        setSelectedNodeId(null);
        setContextMenu(null);
        isPanningRef.current = true;
        panStartRef.current = { x: e.clientX, y: e.clientY };
      }
    }
  };

  const handleMouseMove = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldPos = screenToWorld(mouseX, mouseY);
    currentMouseWorldPos.current = worldPos;

    // 1. Pan Camera
    if (isPanningRef.current) {
      const dx = e.clientX - panStartRef.current.x;
      const dy = e.clientY - panStartRef.current.y;
      panStartRef.current = { x: e.clientX, y: e.clientY };
      setCamera((prev) => ({
        ...prev,
        x: prev.x + dx,
        y: prev.y + dy,
      }));
      return;
    }

    // 2. Drag Node
    if (draggingNodeIdRef.current) {
      const node = simNodesRef.current.get(draggingNodeIdRef.current);
      if (node) {
        node.x = worldPos.x;
        node.y = worldPos.y;
        node.vx = 0;
        node.vy = 0;
      }
      return;
    }

    // 3. Shift-linking hover target detection
    if (linkingSourceIdRef.current) {
      let targetId: string | null = null;
      for (const node of Array.from(simNodesRef.current.values())) {
        if (node.id === linkingSourceIdRef.current) continue;
        if (hitTestSimNode(node, worldPos, currentTheme.nodeShape, cameraRef.current.zoom, 4)) {
          targetId = node.id;
          break;
        }
      }
      linkTargetIdRef.current = targetId;
      return;
    }

    // 4. Hover detection
    let hoveredNode: string | null = null;
    for (const node of Array.from(simNodesRef.current.values())) {
      if (hitTestSimNode(node, worldPos, currentTheme.nodeShape, cameraRef.current.zoom)) {
        hoveredNode = node.id;
        break;
      }
    }
    setHoveredNodeId(hoveredNode);

    // 5. Edge Hover detection (if not hovering a node)
    let hoveredEdge: string | null = null;
    if (!hoveredNode) {
      for (const edge of storeEdges) {
        const n1 = simNodesRef.current.get(edge.sourceNodeId);
        const n2 = simNodesRef.current.get(edge.targetNodeId);
        if (!n1 || !n2) continue;

        const dx = n2.x - n1.x;
        const dy = n2.y - n1.y;
        const lenSq = dx * dx + dy * dy;
        if (lenSq === 0) continue;

        let t = ((worldPos.x - n1.x) * dx + (worldPos.y - n1.y) * dy) / lenSq;
        t = Math.max(0, Math.min(1, t));
        const projX = n1.x + t * dx;
        const projY = n1.y + t * dy;
        const dist = Math.hypot(worldPos.x - projX, worldPos.y - projY);

        if (dist <= 10 / cameraRef.current.zoom) {
          hoveredEdge = edge.id;
          break;
        }
      }
    }
    setHoveredEdgeId(hoveredEdge);
  };

  const handleMouseUp = (e: React.MouseEvent<HTMLCanvasElement>) => {
    const canvas = canvasRef.current;
    const rect = canvas?.getBoundingClientRect();
    const mouseX = rect ? e.clientX - rect.left : 0;
    const mouseY = rect ? e.clientY - rect.top : 0;
    const worldPos = screenToWorld(mouseX, mouseY);

    // End Shift Linking with robust target check
    if (linkingSourceIdRef.current) {
      let finalTargetId = linkTargetIdRef.current;
      if (!finalTargetId) {
        for (const node of Array.from(simNodesRef.current.values())) {
          if (node.id === linkingSourceIdRef.current) continue;
          if (hitTestSimNode(node, worldPos, currentTheme.nodeShape, cameraRef.current.zoom, 4)) {
            finalTargetId = node.id;
            break;
          }
        }
      }

      if (finalTargetId) {
        const srcNode = storeNodes.find((n) => n.id === linkingSourceIdRef.current);
        const tgtNode = storeNodes.find((n) => n.id === finalTargetId);
        const isImage = srcNode?.nodeType === 'image' || tgtNode?.nodeType === 'image';
        const defaultLabel = isImage ? 'image' : (tgtNode?.tags?.[0] || srcNode?.tags?.[0] || 'thought');
        addEdge(linkingSourceIdRef.current, finalTargetId, defaultLabel);
      }
    }
    linkingSourceIdRef.current = null;
    linkTargetIdRef.current = null;

    // End Dragging & Batch save positions
    if (draggingNodeIdRef.current) {
      const node = simNodesRef.current.get(draggingNodeIdRef.current);
      if (node) {
        batchUpdatePositions([
          {
            id: node.id,
            posX: Math.round(node.x),
            posY: Math.round(node.y),
          },
        ]);
      }
      draggingNodeIdRef.current = null;
    }

    isPanningRef.current = false;
  };

  // Zoom with Wheel (registered as non-passive to eliminate console warnings)
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const onWheel = (e: WheelEvent) => {
      e.preventDefault();
      const zoomFactor = e.deltaY < 0 ? 1.1 : 0.9;

      const rect = canvas.getBoundingClientRect();
      const mouseX = e.clientX - rect.left;
      const mouseY = e.clientY - rect.top;

      setCamera((prev) => {
        const newZoom = Math.max(0.2, Math.min(2.8, prev.zoom * zoomFactor));
        const wx = (mouseX - prev.x) / prev.zoom;
        const wy = (mouseY - prev.y) / prev.zoom;
        return {
          zoom: newZoom,
          x: mouseX - wx * newZoom,
          y: mouseY - wy * newZoom,
        };
      });
    };

    canvas.addEventListener('wheel', onWheel, { passive: false });
    return () => {
      canvas.removeEventListener('wheel', onWheel);
    };
  }, []);

  // Double click node to edit note
  const handleDoubleClick = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    e.stopPropagation();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldPos = screenToWorld(mouseX, mouseY);

    // 1. Check double click on node
    for (const node of Array.from(simNodesRef.current.values())) {
      if (hitTestSimNode(node, worldPos, currentTheme.nodeShape, cameraRef.current.zoom, 4)) {
        const liveNode = storeNodes.find((n) => n.id === node.id) || node.original;
        setSelectedNodeId(liveNode.id);
        onEditNode(liveNode);
        return;
      }
    }

    // 2. Check double click on edge to edit / view description directly on this specific edge
    for (const edge of storeEdges) {
      const n1 = simNodesRef.current.get(edge.sourceNodeId);
      const n2 = simNodesRef.current.get(edge.targetNodeId);
      if (!n1 || !n2) continue;

      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;

      let tVal = ((worldPos.x - n1.x) * dx + (worldPos.y - n1.y) * dy) / lenSq;
      tVal = Math.max(0, Math.min(1, tVal));
      const projX = n1.x + tVal * dx;
      const projY = n1.y + tVal * dy;
      const dist = Math.hypot(worldPos.x - projX, worldPos.y - projY);

      if (dist <= 14 / cameraRef.current.zoom) {
        const srcNode = storeNodes.find((n) => n.id === edge.sourceNodeId);
        const tgtNode = storeNodes.find((n) => n.id === edge.targetNodeId);
        setEditingEdgeDialog({
          edge,
          screenX: Math.min(window.innerWidth - 320, Math.max(20, mouseX)),
          screenY: Math.min(window.innerHeight - 200, Math.max(20, mouseY)),
          label: edge.label || '',
          sourceTitle: srcNode?.title || (language === 'fa' ? 'نود مبدا' : 'Source Node'),
          targetTitle: tgtNode?.title || (language === 'fa' ? 'نود مقصد' : 'Target Node'),
        });
        setContextMenu(null);
        return;
      }
    }
  };

  // Right-click context menu (Supports node & empty canvas)
  const handleContextMenu = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    const canvas = canvasRef.current;
    if (!canvas) return;
    const rect = canvas.getBoundingClientRect();
    const mouseX = e.clientX - rect.left;
    const mouseY = e.clientY - rect.top;
    const worldPos = screenToWorld(mouseX, mouseY);

    for (const node of Array.from(simNodesRef.current.values())) {
      if (hitTestSimNode(node, worldPos, currentTheme.nodeShape, cameraRef.current.zoom, 2)) {
        setSelectedNodeId(node.id);
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          worldX: worldPos.x,
          worldY: worldPos.y,
          node: node.original,
          isEmptyCanvas: false,
        });
        return;
      }
    }

    // Check if right-clicked on an edge
    for (const edge of storeEdges) {
      const n1 = simNodesRef.current.get(edge.sourceNodeId);
      const n2 = simNodesRef.current.get(edge.targetNodeId);
      if (!n1 || !n2) continue;

      const dx = n2.x - n1.x;
      const dy = n2.y - n1.y;
      const lenSq = dx * dx + dy * dy;
      if (lenSq === 0) continue;

      let t = ((worldPos.x - n1.x) * dx + (worldPos.y - n1.y) * dy) / lenSq;
      t = Math.max(0, Math.min(1, t));
      const projX = n1.x + t * dx;
      const projY = n1.y + t * dy;
      const dist = Math.hypot(worldPos.x - projX, worldPos.y - projY);

      if (dist <= 12 / cameraRef.current.zoom) {
        setContextMenu({
          x: e.clientX,
          y: e.clientY,
          worldX: worldPos.x,
          worldY: worldPos.y,
          edge,
          isEmptyCanvas: false,
        });
        return;
      }
    }

    // Right-click on empty canvas
    setContextMenu({
      x: e.clientX,
      y: e.clientY,
      worldX: worldPos.x,
      worldY: worldPos.y,
      isEmptyCanvas: true,
    });
  };

  // Toggle Highlight color
  const handleToggleHighlight = (nodeId: string, color: string = 'gold') => {
    const node = simNodesRef.current.get(nodeId);
    if (!node) return;
    const nextHighlighted = !node.highlighted || node.highlightColor !== color;
    updateNode(nodeId, {
      highlighted: nextHighlighted,
      highlightColor: color,
    });
    setContextMenu(null);
  };

  // Fit View
  const handleFitView = () => {
    const simNodes = Array.from(simNodesRef.current.values());
    if (simNodes.length === 0 || !canvasRef.current) return;

    let minX = Infinity, maxX = -Infinity, minY = Infinity, maxY = -Infinity;
    simNodes.forEach((n) => {
      if (n.x < minX) minX = n.x;
      if (n.x > maxX) maxX = n.x;
      if (n.y < minY) minY = n.y;
      if (n.y > maxY) maxY = n.y;
    });

    const padding = 100;
    const graphWidth = maxX - minX + padding * 2;
    const graphHeight = maxY - minY + padding * 2;
    const canvasWidth = canvasRef.current.clientWidth;
    const canvasHeight = canvasRef.current.clientHeight;

    const zoomX = canvasWidth / graphWidth;
    const zoomY = canvasHeight / graphHeight;
    const zoom = Math.max(0.3, Math.min(1.5, Math.min(zoomX, zoomY)));

    const midX = (minX + maxX) / 2;
    const midY = (minY + maxY) / 2;

    setCamera({
      zoom,
      x: canvasWidth / 2 - midX * zoom,
      y: canvasHeight / 2 - midY * zoom,
    });
  };

  return (
    <div className={`relative w-full h-full ${isLight ? 'bg-slate-100' : 'bg-[#0B0F19]'} overflow-hidden select-none`}>
      {/* HTML5 Physics Canvas */}
      <canvas
        ref={canvasRef}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onDoubleClick={handleDoubleClick}
        onContextMenu={handleContextMenu}
        className="w-full h-full cursor-grab active:cursor-grabbing block"
      />

      {/* Loading Overlay */}
      {isLoading && (
        <div className="absolute inset-0 z-40 flex items-center justify-center bg-black/45 backdrop-blur-[2px] pointer-events-none transition-all duration-200 animate-fade-in">
          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className={`flex items-center gap-3.5 px-6 py-4 rounded-2xl border shadow-2xl backdrop-blur-xl ${
              isLight
                ? 'bg-white/95 border-sky-200 text-slate-800 shadow-sky-500/15'
                : 'bg-[#0a1124]/95 border-cyan-500/50 text-cyan-100 shadow-[0_0_35px_rgba(6,182,212,0.3)]'
            }`}
          >
            <div className="relative flex items-center justify-center w-9 h-9 shrink-0">
              <div className="absolute inset-0 rounded-full border-2 border-cyan-500/30 border-t-cyan-400 animate-spin" />
              <Sparkles className="w-4 h-4 text-cyan-400 animate-pulse" />
            </div>
            <div>
              <p className="text-xs font-bold leading-tight">
                {language === 'fa' ? 'در حال بارگذاری نقشه ذهنی و ارتباطات...' : 'Loading mind map nodes & connections...'}
              </p>
              <p className="text-[10px] text-slate-400 mt-1">
                «{activePage?.title || (language === 'fa' ? 'صفحه نقشه' : 'Mindmap Page')}»
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Floating Toolbar Controls - Always on bottom-left away from the right sidebar */}
      <div className={`absolute bottom-5 left-5 flex items-center gap-1.5 ${isLight ? 'bg-white/90 border-slate-300 shadow-lg' : 'bg-slate-900/90 border-slate-800 shadow-2xl'} border rounded-xl p-1 backdrop-blur-md z-20`}>
        <button
          onClick={handleFitView}
          title={t.fitViewTooltip}
          className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-600 hover:text-cyan-600' : 'hover:bg-slate-800 text-slate-300 hover:text-cyan-400'}`}
        >
          <RotateCcw className="w-4 h-4" />
        </button>
        <button
          onClick={() => setCamera((c) => ({ ...c, zoom: Math.min(2.5, c.zoom * 1.2) }))}
          title={t.zoomInTooltip}
          className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-600 hover:text-cyan-600' : 'hover:bg-slate-800 text-slate-300 hover:text-cyan-400'}`}
        >
          <ZoomIn className="w-4 h-4" />
        </button>
        <button
          onClick={() => setCamera((c) => ({ ...c, zoom: Math.max(0.3, c.zoom * 0.8) }))}
          title={t.zoomOutTooltip}
          className={`p-2 rounded-lg transition-colors ${isLight ? 'hover:bg-slate-100 text-slate-600 hover:text-cyan-600' : 'hover:bg-slate-800 text-slate-300 hover:text-cyan-400'}`}
        >
          <ZoomOut className="w-4 h-4" />
        </button>
        <div className={`w-[1px] h-4 ${isLight ? 'bg-slate-300' : 'bg-slate-700'} mx-1`} />
        <span className={`text-[11px] font-mono ${isLight ? 'text-slate-600' : 'text-slate-400'} px-2`}>
          {Math.round(camera.zoom * 100)}%
        </span>

        {storeNodes.length > 0 && (
          <>
            <div className={`w-[1px] h-4 ${isLight ? 'bg-slate-300' : 'bg-slate-700'} mx-0.5`} />
            <button
              onClick={() => setIsClearConfirmOpen(true)}
              title={t.clearGraphBtn}
              className={`px-2 py-1.5 rounded-lg transition-all flex items-center gap-1.5 ${
                isLight
                  ? 'hover:bg-rose-50 text-slate-500 hover:text-rose-600'
                  : 'hover:bg-rose-950/60 text-slate-400 hover:text-rose-400'
              }`}
            >
              <Trash2 className="w-3.5 h-3.5 text-rose-500" />
              <span className="hidden sm:inline text-[11px] font-semibold text-rose-500">
                {t.clearGraphBtn}
              </span>
            </button>
          </>
        )}
      </div>

      {/* Top Hint Badge - Always on top-left */}
      <div className={`absolute top-4 left-4 ${isLight ? 'bg-white/90 border-slate-300 text-slate-700 shadow-md' : 'bg-slate-900/80 border-slate-800/80 text-slate-400'} border rounded-xl px-3 py-1.5 text-[11px] backdrop-blur-md pointer-events-none flex items-center gap-2`}>
        <span className="w-2 h-2 rounded-full bg-cyan-400 animate-pulse" />
        <span>{t.canvasHint}</span>
      </div>

      {/* Context Menu for Nodes, Edges & Empty Canvas */}
      {contextMenu && (
        <div
          dir={isRtl ? 'rtl' : 'ltr'}
          style={{ top: contextMenu.y, left: contextMenu.x }}
          className={`fixed ${isLight ? 'bg-white border-slate-300 shadow-xl' : 'bg-[#0F172A] border-slate-700/90 shadow-2xl'} border rounded-xl p-1.5 z-50 text-xs min-w-[210px] space-y-1 animate-fade-in`}
          onClick={(e) => e.stopPropagation()}
        >
          {contextMenu.isEmptyCanvas ? (
            <>
              <div className={`px-2.5 py-1 text-[11px] font-bold ${isLight ? 'text-slate-500 border-slate-200' : 'text-slate-400 border-slate-800'} border-b`}>
                {t.ctxAddStandalone}
              </div>
              <button
                onClick={() => {
                  const title = prompt(t.enterNodeTitlePrompt);
                  if (title?.trim()) {
                    addNode(title.trim(), 6, '', contextMenu.worldX, contextMenu.worldY);
                  }
                  setContextMenu(null);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 ${isLight ? 'text-slate-700 hover:text-cyan-600 hover:bg-slate-100' : 'text-slate-200 hover:text-cyan-300 hover:bg-slate-800/80'} rounded-lg transition-colors text-start`}
              >
                <Plus className="w-3.5 h-3.5 text-cyan-500" />
                {t.ctxAddTextNode}
              </button>
              <button
                onClick={() => {
                  setAddImageParentId(null);
                  setAddImagePos({ x: contextMenu.worldX, y: contextMenu.worldY });
                  setIsAddImageOpen(true);
                  setContextMenu(null);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 ${isLight ? 'text-slate-700 hover:text-amber-600 hover:bg-slate-100' : 'text-slate-200 hover:text-amber-300 hover:bg-slate-800/80'} rounded-lg transition-colors text-start`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                {t.ctxAddImageNode}
              </button>
            </>
          ) : contextMenu.node ? (
            <>
              <div className={`px-2.5 py-1 text-[11px] font-bold text-cyan-500 ${isLight ? 'border-slate-200' : 'border-slate-800'} border-b truncate`}>
                {contextMenu.node.title}
              </div>

              {/* Sub-node Creation Actions */}
              <button
                onClick={async () => {
                  const parent = contextMenu.node!;
                  const title = prompt(t.enterSubnodeTitlePrompt);
                  if (title?.trim()) {
                    const connectedEdges = storeEdges.filter(
                      (e) => e.sourceNodeId === parent.id || e.targetNodeId === parent.id
                    );
                    const count = connectedEdges.length;
                    const angle = count * 1.05 + 0.6;
                    const isTreeOrFlowchart = currentTheme.id === 'matrix' || currentTheme.nodeShape === 'rounded-box';
                    const dist = Math.round(98 * (isTreeOrFlowchart ? 1.35 : 1.0));
                    const newX = Math.round(parent.posX + Math.cos(angle) * dist);
                    const newY = Math.round(parent.posY + Math.sin(angle) * dist);
                    const importance = Math.max(1, (parent.importance || 5) - 1);
                    const tag = parent.tags?.[0] || 'thought';

                    const created = await addNode(title.trim(), importance, '', newX, newY, [tag]);
                    if (created) {
                      await addEdge(parent.id, created.id, tag);
                    }
                  }
                  setContextMenu(null);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 ${isLight ? 'text-slate-700 hover:text-cyan-600 hover:bg-slate-100' : 'text-slate-200 hover:text-cyan-300 hover:bg-slate-800/80'} rounded-lg transition-colors text-start font-medium`}
              >
                <Plus className="w-3.5 h-3.5 text-cyan-500" />
                {t.ctxAddTextChild}
              </button>
              <button
                onClick={() => {
                  const parent = contextMenu.node!;
                  const connectedEdges = storeEdges.filter(
                    (e) => e.sourceNodeId === parent.id || e.targetNodeId === parent.id
                  );
                  const count = connectedEdges.length;
                  const angle = count * 1.05 + 0.6;
                  const isTreeOrFlowchart = currentTheme.id === 'matrix' || currentTheme.nodeShape === 'rounded-box';
                  const dist = Math.round(112 * (isTreeOrFlowchart ? 1.35 : 1.0));
                  const newX = Math.round(parent.posX + Math.cos(angle) * dist);
                  const newY = Math.round(parent.posY + Math.sin(angle) * dist);

                  setAddImageParentId(parent.id);
                  addImageParentIdRef.current = parent.id;
                  setAddImagePos({ x: newX, y: newY });
                  setIsAddImageOpen(true);
                  setContextMenu(null);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 ${isLight ? 'text-slate-700 hover:text-amber-600 hover:bg-slate-100' : 'text-slate-200 hover:text-amber-300 hover:bg-slate-800/80'} rounded-lg transition-colors text-start font-medium`}
              >
                <ImageIcon className="w-3.5 h-3.5 text-amber-500" />
                {t.ctxAddImageChild}
              </button>

              <div className={`border-t ${isLight ? 'border-slate-200' : 'border-slate-800'} my-1`} />

              <button
                onClick={() => {
                  onEditNode(contextMenu.node!);
                  setContextMenu(null);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 ${isLight ? 'text-slate-700 hover:text-cyan-600 hover:bg-slate-100' : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80'} rounded-lg transition-colors text-start`}
              >
                <FileText className="w-3.5 h-3.5 text-cyan-500" />
                {t.ctxEditMarkdown}
              </button>
              <button
                onClick={() => {
                  if (onOpenSubTopics) onOpenSubTopics(contextMenu.node!);
                  else onDeepDiveNode?.(contextMenu.node!);
                  setContextMenu(null);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 ${isLight ? 'text-slate-700 hover:text-cyan-600 hover:bg-slate-100' : 'text-slate-300 hover:text-cyan-300 hover:bg-slate-800/80'} rounded-lg transition-colors text-start`}
              >
                <Sparkles className="w-3.5 h-3.5 text-cyan-400" />
                {t.ctxAiSubtopics}
              </button>
              <button
                onClick={() => {
                  if (onOpenSocratic) onOpenSocratic(contextMenu.node!);
                  else onDeepDiveNode?.(contextMenu.node!);
                  setContextMenu(null);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 ${isLight ? 'text-slate-700 hover:text-amber-600 hover:bg-slate-100' : 'text-slate-300 hover:text-amber-300 hover:bg-slate-800/80'} rounded-lg transition-colors text-start`}
              >
                <HelpCircle className="w-3.5 h-3.5 text-amber-400" />
                {t.ctxAiSocratic}
              </button>

              {/* Highlight Submenu */}
              <div className={`pt-1 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <div className={`px-2.5 py-1 text-[10px] ${isLight ? 'text-slate-500' : 'text-slate-400'} font-semibold flex items-center gap-1`}>
                  <Highlighter className="w-3 h-3 text-amber-500" />
                  {t.ctxHighlight}
                </div>
                <div className="flex items-center gap-1.5 px-2.5 py-1">
                  <button
                    onClick={() => handleToggleHighlight(contextMenu.node!.id, 'gold')}
                    title={t.ctxHighlightGold}
                    className={`flex-1 py-1 rounded border text-[10px] font-bold flex items-center justify-center gap-1 ${contextMenu.node.highlighted && contextMenu.node.highlightColor === 'gold'
                      ? 'bg-amber-500/20 border-amber-500 text-amber-500'
                      : isLight
                        ? 'bg-slate-50 border-slate-200 text-amber-600 hover:bg-amber-50'
                        : 'bg-slate-900 border-amber-800/60 text-amber-400 hover:bg-amber-950/40'
                      }`}
                  >
                    {t.ctxHighlightGold}
                  </button>
                  <button
                    onClick={() => handleToggleHighlight(contextMenu.node!.id, 'red')}
                    title={t.ctxHighlightRed}
                    className={`flex-1 py-1 rounded border text-[10px] font-bold flex items-center justify-center gap-1 ${contextMenu.node.highlighted && contextMenu.node.highlightColor === 'red'
                      ? 'bg-rose-500/20 border-rose-500 text-rose-500'
                      : isLight
                        ? 'bg-slate-50 border-slate-200 text-rose-600 hover:bg-rose-50'
                        : 'bg-slate-900 border-rose-800/60 text-rose-400 hover:bg-rose-950/40'
                      }`}
                  >
                    {t.ctxHighlightRed}
                  </button>
                  <button
                    onClick={() => handleToggleHighlight(contextMenu.node!.id, 'green')}
                    title={t.ctxHighlightGreen}
                    className={`flex-1 py-1 rounded border text-[10px] font-bold flex items-center justify-center gap-1 ${contextMenu.node.highlighted && contextMenu.node.highlightColor === 'green'
                      ? 'bg-emerald-500/20 border-emerald-500 text-emerald-500'
                      : isLight
                        ? 'bg-slate-50 border-slate-200 text-emerald-600 hover:bg-emerald-50'
                        : 'bg-slate-900 border-emerald-800/60 text-emerald-400 hover:bg-emerald-950/40'
                      }`}
                  >
                    {t.ctxHighlightGreen}
                  </button>
                </div>
              </div>

              <div className={`pt-1 border-t ${isLight ? 'border-slate-200' : 'border-slate-800'}`}>
                <button
                  onClick={() => {
                    deleteNode(contextMenu.node!.id);
                    setContextMenu(null);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-500 ${isLight ? 'hover:bg-rose-50' : 'hover:bg-rose-950/60'} rounded-lg transition-colors text-start`}
                >
                  <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                  {t.ctxDeleteNode}
                </button>
              </div>
            </>
          ) : contextMenu.edge ? (
            <>
              <div className={`px-2.5 py-1 text-[11px] font-bold text-cyan-500 ${isLight ? 'border-slate-200' : 'border-slate-800'} border-b truncate`}>
                {contextMenu.edge.label ? `${t.ctxEdgeTag} ${contextMenu.edge.label}` : t.ctxEdgeTitle}
              </div>
              <button
                onClick={() => {
                  const edge = contextMenu.edge!;
                  const srcNode = storeNodes.find((n) => n.id === edge.sourceNodeId);
                  const tgtNode = storeNodes.find((n) => n.id === edge.targetNodeId);
                  setEditingEdgeDialog({
                    edge,
                    screenX: Math.min(window.innerWidth - 320, Math.max(20, contextMenu.x)),
                    screenY: Math.min(window.innerHeight - 200, Math.max(20, contextMenu.y)),
                    label: edge.label || '',
                    sourceTitle: srcNode?.title || (language === 'fa' ? 'نود مبدا' : 'Source Node'),
                    targetTitle: tgtNode?.title || (language === 'fa' ? 'نود مقصد' : 'Target Node'),
                  });
                  setContextMenu(null);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 ${isLight ? 'text-slate-700 hover:text-cyan-600 hover:bg-slate-100' : 'text-slate-200 hover:text-cyan-300 hover:bg-slate-800/80'} rounded-lg transition-colors text-start font-medium`}
              >
                <FileText className="w-3.5 h-3.5 text-cyan-500" />
                {t.ctxEditEdgeLabel}
              </button>
              {contextMenu.edge.label && (
                <button
                  onClick={() => {
                    const edgeId = contextMenu.edge!.id;
                    setVisibleEdgeLabelIds((prev) => {
                      const next = new Set(prev);
                      if (next.has(edgeId)) next.delete(edgeId);
                      else next.add(edgeId);
                      try {
                        localStorage.setItem('mindmap_visible_edge_labels', JSON.stringify(Array.from(next)));
                      } catch (e) { }
                      return next;
                    });
                    setContextMenu(null);
                  }}
                  className={`w-full flex items-center gap-2 px-2.5 py-1.5 ${isLight ? 'text-slate-700 hover:text-slate-900 hover:bg-slate-100' : 'text-slate-300 hover:text-white hover:bg-slate-800/80'} rounded-lg transition-colors text-start text-xs`}
                >
                  <Eye className="w-3.5 h-3.5 text-slate-400" />
                  {visibleEdgeLabelIds.has(contextMenu.edge.id) ? (language === 'fa' ? 'مخفی کردن برچسب این یال' : 'Hide edge label') : (language === 'fa' ? 'نمایش برچسب این یال' : 'Show edge label')}
                </button>
              )}
              <button
                onClick={() => {
                  deleteEdge(contextMenu.edge!.id);
                  setContextMenu(null);
                }}
                className={`w-full flex items-center gap-2 px-2.5 py-1.5 text-rose-500 ${isLight ? 'hover:bg-rose-50' : 'hover:bg-rose-950/60'} rounded-lg transition-colors text-start`}
              >
                <Trash2 className="w-3.5 h-3.5 text-rose-500" />
                {t.ctxDeleteEdge}
              </button>
            </>
          ) : null}
        </div>
      )}

      {/* Direct On-Edge Edit Floating Dialog */}
      {editingEdgeDialog && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className={`w-full max-w-sm rounded-2xl border shadow-2xl p-4 space-y-3.5 ${isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0f172a] border-slate-700/90 text-slate-100'
              }`}
          >
            {/* Header */}
            <div className="flex items-center justify-between pb-2 border-b border-slate-800">
              <div className="flex items-center gap-2">
                <div className="w-7 h-7 rounded-lg bg-cyan-600/20 border border-cyan-500/40 flex items-center justify-center text-cyan-400">
                  <FileText className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="text-xs font-bold text-slate-100">{t.ctxEditEdgeLabel}</h3>
                  <p className="text-[10px] text-slate-400 truncate max-w-[200px]">
                    «{editingEdgeDialog.sourceTitle}» ⟷ «{editingEdgeDialog.targetTitle}»
                  </p>
                </div>
              </div>
              <button
                onClick={() => setEditingEdgeDialog(null)}
                className="p-1 text-slate-400 hover:text-white rounded-lg transition-colors"
              >
                <X className="w-4 h-4" />
              </button>
            </div>

            {/* Input */}
            <div className="space-y-1">
              <label className="text-xs font-semibold text-slate-300">{language === 'fa' ? 'متن برچسب یا توضیح یال:' : 'Edge label or description:'}</label>
              <input
                type="text"
                autoFocus
                value={editingEdgeDialog.label}
                onChange={(e) =>
                  setEditingEdgeDialog({
                    ...editingEdgeDialog,
                    label: e.target.value,
                  })
                }
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    e.preventDefault();
                    const edgeId = editingEdgeDialog.edge.id;
                    const cleanLabel = editingEdgeDialog.label.trim();
                    updateEdge(edgeId, { label: cleanLabel });
                    setVisibleEdgeLabelIds((prev) => {
                      const next = new Set(prev);
                      if (cleanLabel) next.add(edgeId);
                      else next.delete(edgeId);
                      try {
                        localStorage.setItem('mindmap_visible_edge_labels', JSON.stringify(Array.from(next)));
                      } catch (err) { }
                      return next;
                    });
                    setEditingEdgeDialog(null);
                  } else if (e.key === 'Escape') {
                    setEditingEdgeDialog(null);
                  }
                }}
                placeholder={language === 'fa' ? 'مثال: زیرشاخه، ایده مرتبط، نیازمندی...' : 'e.g. Subtopic, Related idea, Prerequisite...'}
                className="w-full bg-slate-900 border border-slate-700 rounded-xl px-3 py-2 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-cyan-500 focus:ring-1 focus:ring-cyan-500"
              />
            </div>

            {/* Actions */}
            <div className="flex items-center justify-between gap-2 pt-1">
              {editingEdgeDialog.edge.label ? (
                <button
                  type="button"
                  onClick={() => {
                    const edgeId = editingEdgeDialog.edge.id;
                    updateEdge(edgeId, { label: '' });
                    setVisibleEdgeLabelIds((prev) => {
                      const next = new Set(prev);
                      next.delete(edgeId);
                      try {
                        localStorage.setItem('mindmap_visible_edge_labels', JSON.stringify(Array.from(next)));
                      } catch (err) { }
                      return next;
                    });
                    setEditingEdgeDialog(null);
                  }}
                  className="text-xs text-rose-400 hover:text-rose-300 px-2 py-1.5 rounded-lg hover:bg-rose-950/40 transition-colors"
                >
                  {language === 'fa' ? 'حذف برچسب' : 'Delete Label'}
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-2">
                <button
                  type="button"
                  onClick={() => setEditingEdgeDialog(null)}
                  className="px-3 py-1.5 text-xs text-slate-400 hover:text-slate-200 rounded-lg hover:bg-slate-800 transition-colors"
                >
                  {language === 'fa' ? 'انصراف' : 'Cancel'}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    const edgeId = editingEdgeDialog.edge.id;
                    const cleanLabel = editingEdgeDialog.label.trim();
                    updateEdge(edgeId, { label: cleanLabel });
                    setVisibleEdgeLabelIds((prev) => {
                      const next = new Set(prev);
                      if (cleanLabel) next.add(edgeId);
                      else next.delete(edgeId);
                      try {
                        localStorage.setItem('mindmap_visible_edge_labels', JSON.stringify(Array.from(next)));
                      } catch (err) { }
                      return next;
                    });
                    setEditingEdgeDialog(null);
                  }}
                  className="px-4 py-1.5 text-xs font-bold bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl shadow-sm transition-all"
                >
                  {language === 'fa' ? 'ذخیره و نمایش' : 'Save & Display'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Add Image Node Modal */}
      <AddImageNodeDialog
        isOpen={isAddImageOpen}
        onClose={() => {
          setIsAddImageOpen(false);
          addImageParentIdRef.current = null;
          setAddImageParentId(null);
        }}
        onAdd={async (title, imageUrl, imageSize, importance) => {
          const parentId = addImageParentIdRef.current || addImageParentId;
          const created = await useGraphStore.getState().addNode({
            title,
            importance,
            note: '',
            posX: addImagePos.x,
            posY: addImagePos.y,
            tags: ['image'],
            nodeType: 'image',
            imageUrl,
            imageSize,
          });
          if (created && parentId) {
            await useGraphStore.getState().addEdge(parentId, created.id, 'image');
          }
          addImageParentIdRef.current = null;
          setAddImageParentId(null);
        }}
      />

      {/* Clear Graph Confirmation Modal */}
      {isClearConfirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in">
          <div
            dir={isRtl ? 'rtl' : 'ltr'}
            className={`w-full max-w-sm rounded-2xl border shadow-2xl p-5 space-y-4 ${
              isLight ? 'bg-white border-slate-300 text-slate-900' : 'bg-[#0f172a] border-slate-700/90 text-slate-100'
            }`}
          >
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-rose-500/15 border border-rose-500/30 flex items-center justify-center text-rose-500 shrink-0">
                <Trash2 className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-sm font-bold">{t.clearGraphConfirmTitle}</h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  «{activePage?.title || (language === 'fa' ? 'صفحه جاری' : 'Current Page')}»
                </p>
              </div>
            </div>

            <p className="text-xs text-slate-400 leading-relaxed">
              {t.clearGraphConfirmDesc}
            </p>

            <div className="flex items-center justify-end gap-2 pt-2 border-t border-slate-800">
              <button
                type="button"
                onClick={() => setIsClearConfirmOpen(false)}
                className={`px-3 py-2 text-xs font-semibold rounded-xl transition-colors ${
                  isLight ? 'text-slate-600 hover:bg-slate-100' : 'text-slate-300 hover:bg-slate-800'
                }`}
              >
                {t.clearGraphCancelBtn}
              </button>
              <button
                type="button"
                onClick={async () => {
                  await clearCurrentPageNodes();
                  setIsClearConfirmOpen(false);
                }}
                className="px-4 py-2 text-xs font-bold bg-rose-600 hover:bg-rose-500 text-white rounded-xl shadow-lg shadow-rose-600/30 transition-all flex items-center gap-1.5"
              >
                <Trash2 className="w-3.5 h-3.5" />
                <span>{t.clearGraphConfirmBtn}</span>
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
