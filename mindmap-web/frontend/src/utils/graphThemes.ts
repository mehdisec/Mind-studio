import { GraphThemeKey } from '../types';

export type NodeShapeType = 'circle' | 'rounded-box' | 'capsule' | 'hexagon';
export type ConnectionStyleType = 'straight' | 'orthogonal' | 'curved' | 'circuit';

export interface GraphThemeDefinition {
  id: GraphThemeKey;
  name: string;
  nameEn: string;
  description: string;
  descriptionEn: string;
  previewColor: string;
  previewGradient: string;
  badgeBg: string;
  badgeBorder: string;
  badgeText: string;

  // Shape & Connection Model
  nodeShape: NodeShapeType;
  connectionStyle: ConnectionStyleType;

  // Node Colors
  node: {
    baseFill: string;
    baseBorder: string;
    hoverFill: string;
    hoverBorder: string;
    selectedFill: string;
    selectedBorder: string;
    linkTargetFill: string;
    linkTargetBorder: string;
    labelText: string;
    labelTextHover: string;
    labelTextSelected: string;
  };

  // Halos and Glows
  halos: {
    selectedInner: string;
    selectedOuter: string;
    hoverInner: string;
    hoverOuter: string;
    linkTargetInner: string;
    linkTargetOuter: string;
  };

  // Edges & Connection Lines
  edge: {
    strokeDefault: string;
    strokeSelected: string;
    strokeHovered: string;
    tetherStroke: string;
    tetherDot: string;
    labelBg: string;
    labelBorder: string;
    labelText: string;
    labelHoverBg: string;
    labelHoverBorder: string;
    labelHoverText: string;
  };

  // Wave ripple animation for tag match
  wave: {
    primaryRgba: (alpha: number) => string;
  };

  // Canvas Grid Dots & Ambient
  canvas: {
    gridColor: string;
    gridAlpha: number;
    bgOverlay: string;
  };
}

export const GRAPH_THEMES: Record<GraphThemeKey, GraphThemeDefinition> = {
  cyberpunk: {
    id: 'cyberpunk',
    name: 'شبکه شناور (دایره‌ای نئونی)',
    nameEn: 'Floating Force Network',
    description: 'نودهای دایره‌ای کلاسیک با خطوط مستقیم کشسان و هاله‌های نئون فیروزه‌ای',
    descriptionEn: 'Classic circular nodes with straight elastic bonds and neon cyan glow',
    previewColor: '#38bdf8',
    previewGradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    badgeBg: 'bg-cyan-950/70',
    badgeBorder: 'border-cyan-500/80',
    badgeText: 'text-cyan-300',

    nodeShape: 'circle',
    connectionStyle: 'straight',

    node: {
      baseFill: '#1e293b',
      baseBorder: '#475569',
      hoverFill: '#334155',
      hoverBorder: '#94a3b8',
      selectedFill: '#0f172a',
      selectedBorder: '#f8fafc',
      linkTargetFill: '#0284c7',
      linkTargetBorder: '#38bdf8',
      labelText: '#e2e8f0',
      labelTextHover: '#38bdf8',
      labelTextSelected: '#ffffff',
    },

    halos: {
      selectedInner: 'rgba(56, 189, 248, 0.65)',
      selectedOuter: 'rgba(56, 189, 248, 0)',
      hoverInner: 'rgba(148, 163, 184, 0.35)',
      hoverOuter: 'rgba(148, 163, 184, 0)',
      linkTargetInner: 'rgba(56, 189, 248, 0.75)',
      linkTargetOuter: 'rgba(56, 189, 248, 0)',
    },

    edge: {
      strokeDefault: 'rgba(100, 116, 139, 0.6)',
      strokeSelected: '#38bdf8',
      strokeHovered: '#38bdf8',
      tetherStroke: '#38bdf8',
      tetherDot: '#38bdf8',
      labelBg: '#0b0f19',
      labelBorder: 'rgba(56, 189, 248, 0.65)',
      labelText: '#38bdf8',
      labelHoverBg: '#0f172a',
      labelHoverBorder: '#38bdf8',
      labelHoverText: '#7dd3fc',
    },

    wave: {
      primaryRgba: (a) => `rgba(56, 189, 248, ${a})`,
    },

    canvas: {
      gridColor: '#1e293b',
      gridAlpha: 0.35,
      bgOverlay: 'rgba(8, 12, 20, 0.45)',
    },
  },

  matrix: {
    id: 'matrix',
    name: 'درختی و فلوچارت (کارت آبی ملایم)',
    nameEn: 'Flowchart & Tree (Soft Blue Cards)',
    description: 'کارت‌های خوانا با نمایش تگ‌ها، تم آبی ملایم، طراحی مینیمال و یال‌های منحنی با حرکت آرام و روان',
    descriptionEn: 'Readable cards with tags, soft blue theme, minimal design, and smooth curved edges',
    previewColor: '#38bdf8',
    previewGradient: 'linear-gradient(135deg, #0284c7 0%, #38bdf8 100%)',
    badgeBg: 'bg-sky-950/60',
    badgeBorder: 'border-sky-500/60',
    badgeText: 'text-sky-300',

    nodeShape: 'rounded-box',
    connectionStyle: 'curved',

    node: {
      baseFill: '#0f172a',
      baseBorder: 'rgba(56, 189, 248, 0.45)',
      hoverFill: '#16233b',
      hoverBorder: '#38bdf8',
      selectedFill: '#1e293b',
      selectedBorder: '#7dd3fc',
      linkTargetFill: '#0369a1',
      linkTargetBorder: '#38bdf8',
      labelText: '#f0f9ff',
      labelTextHover: '#7dd3fc',
      labelTextSelected: '#ffffff',
    },

    halos: {
      selectedInner: 'rgba(56, 189, 248, 0.55)',
      selectedOuter: 'rgba(56, 189, 248, 0)',
      hoverInner: 'rgba(56, 189, 248, 0.3)',
      hoverOuter: 'rgba(56, 189, 248, 0)',
      linkTargetInner: 'rgba(56, 189, 248, 0.7)',
      linkTargetOuter: 'rgba(56, 189, 248, 0)',
    },

    edge: {
      strokeDefault: 'rgba(56, 189, 248, 0.4)',
      strokeSelected: '#38bdf8',
      strokeHovered: '#7dd3fc',
      tetherStroke: '#0284c7',
      tetherDot: '#38bdf8',
      labelBg: '#0b1320',
      labelBorder: 'rgba(56, 189, 248, 0.5)',
      labelText: '#7dd3fc',
      labelHoverBg: '#111d30',
      labelHoverBorder: '#38bdf8',
      labelHoverText: '#e0f2fe',
    },

    wave: {
      primaryRgba: (a) => `rgba(56, 189, 248, ${a})`,
    },

    canvas: {
      gridColor: '#1e293b',
      gridAlpha: 0.3,
      bgOverlay: 'rgba(8, 14, 24, 0.48)',
    },
  },

  cosmic: {
    id: 'cosmic',
    name: 'مایندمپ ارگانیک (کپسول منحنی)',
    nameEn: 'Curved Mindmap Branches',
    description: 'کپسول‌های نرم با شاخه‌های منحنی و روان بزیر و نور ماوراء بنفش',
    descriptionEn: 'Soft capsule nodes with smooth curved Bezier branches and ultraviolet lighting',
    previewColor: '#c084fc',
    previewGradient: 'linear-gradient(135deg, #7e22ce 0%, #d946ef 100%)',
    badgeBg: 'bg-purple-950/70',
    badgeBorder: 'border-purple-500/80',
    badgeText: 'text-purple-300',

    nodeShape: 'capsule',
    connectionStyle: 'curved',

    node: {
      baseFill: '#2e1065',
      baseBorder: '#7e22ce',
      hoverFill: '#3b0764',
      hoverBorder: '#c084fc',
      selectedFill: '#1e1b4b',
      selectedBorder: '#fdf4ff',
      linkTargetFill: '#9333ea',
      linkTargetBorder: '#e879f9',
      labelText: '#f3e8ff',
      labelTextHover: '#e879f9',
      labelTextSelected: '#ffffff',
    },

    halos: {
      selectedInner: 'rgba(192, 132, 252, 0.75)',
      selectedOuter: 'rgba(192, 132, 252, 0)',
      hoverInner: 'rgba(168, 85, 247, 0.4)',
      hoverOuter: 'rgba(168, 85, 247, 0)',
      linkTargetInner: 'rgba(232, 121, 249, 0.8)',
      linkTargetOuter: 'rgba(232, 121, 249, 0)',
    },

    edge: {
      strokeDefault: 'rgba(147, 51, 234, 0.5)',
      strokeSelected: '#c084fc',
      strokeHovered: '#e879f9',
      tetherStroke: '#e879f9',
      tetherDot: '#e879f9',
      labelBg: '#180828',
      labelBorder: 'rgba(192, 132, 252, 0.75)',
      labelText: '#e879f9',
      labelHoverBg: '#2a0c47',
      labelHoverBorder: '#f0abfc',
      labelHoverText: '#fae8ff',
    },

    wave: {
      primaryRgba: (a) => `rgba(217, 70, 239, ${a})`,
    },

    canvas: {
      gridColor: '#4c1d95',
      gridAlpha: 0.38,
      bgOverlay: 'rgba(12, 6, 24, 0.52)',
    },
  },

  solar: {
    id: 'solar',
    name: 'مدار کریستالی (شش‌ضلعی)',
    nameEn: 'Cyber Circuit & Hexagons',
    description: 'نودهای هندسی شش‌ضلعی با خطوط زاویه‌دار مدار چاپی و طلای گرم',
    descriptionEn: 'Geometric hexagonal nodes with angled circuit lines and warm amber gold',
    previewColor: '#fbbf24',
    previewGradient: 'linear-gradient(135deg, #d97706 0%, #fbbf24 100%)',
    badgeBg: 'bg-amber-950/70',
    badgeBorder: 'border-amber-500/80',
    badgeText: 'text-amber-300',

    nodeShape: 'hexagon',
    connectionStyle: 'circuit',

    node: {
      baseFill: '#291804',
      baseBorder: '#b45309',
      hoverFill: '#451a03',
      hoverBorder: '#fbbf24',
      selectedFill: '#1c1002',
      selectedBorder: '#fffbeb',
      linkTargetFill: '#d97706',
      linkTargetBorder: '#fbbf24',
      labelText: '#fef3c7',
      labelTextHover: '#fbbf24',
      labelTextSelected: '#ffffff',
    },

    halos: {
      selectedInner: 'rgba(251, 191, 36, 0.75)',
      selectedOuter: 'rgba(251, 191, 36, 0)',
      hoverInner: 'rgba(245, 158, 11, 0.4)',
      hoverOuter: 'rgba(245, 158, 11, 0)',
      linkTargetInner: 'rgba(251, 191, 36, 0.85)',
      linkTargetOuter: 'rgba(251, 191, 36, 0)',
    },

    edge: {
      strokeDefault: 'rgba(217, 119, 6, 0.55)',
      strokeSelected: '#fbbf24',
      strokeHovered: '#fde68a',
      tetherStroke: '#fbbf24',
      tetherDot: '#fbbf24',
      labelBg: '#1c1205',
      labelBorder: 'rgba(251, 191, 36, 0.75)',
      labelText: '#fbbf24',
      labelHoverBg: '#331e04',
      labelHoverBorder: '#fde68a',
      labelHoverText: '#fffbeb',
    },

    wave: {
      primaryRgba: (a) => `rgba(251, 191, 36, ${a})`,
    },

    canvas: {
      gridColor: '#78350f',
      gridAlpha: 0.35,
      bgOverlay: 'rgba(20, 12, 4, 0.48)',
    },
  },

  emerald: {
    id: 'emerald',
    name: 'سیناپس بیولوژیک (زمرد عصبی)',
    nameEn: 'Bio-Synapse Emerald',
    description: 'الهام‌گرفته از شبکه‌های عصبی مغز با نودهای دایره‌ای زمردی درخشان و انحناهای بیولومینسنت',
    descriptionEn: 'Inspired by neural brain synapses with emerald nodes and bioluminescent curves',
    previewColor: '#10b981',
    previewGradient: 'linear-gradient(135deg, #059669 0%, #34d399 100%)',
    badgeBg: 'bg-emerald-950/70',
    badgeBorder: 'border-emerald-500/80',
    badgeText: 'text-emerald-300',

    nodeShape: 'circle',
    connectionStyle: 'curved',

    node: {
      baseFill: '#064e3b',
      baseBorder: '#059669',
      hoverFill: '#065f46',
      hoverBorder: '#34d399',
      selectedFill: '#022c22',
      selectedBorder: '#a7f3d0',
      linkTargetFill: '#10b981',
      linkTargetBorder: '#6ee7b7',
      labelText: '#ecfdf5',
      labelTextHover: '#34d399',
      labelTextSelected: '#ffffff',
    },

    halos: {
      selectedInner: 'rgba(52, 211, 153, 0.75)',
      selectedOuter: 'rgba(52, 211, 153, 0)',
      hoverInner: 'rgba(16, 185, 129, 0.4)',
      hoverOuter: 'rgba(16, 185, 129, 0)',
      linkTargetInner: 'rgba(52, 211, 153, 0.85)',
      linkTargetOuter: 'rgba(52, 211, 153, 0)',
    },

    edge: {
      strokeDefault: 'rgba(16, 185, 129, 0.45)',
      strokeSelected: '#34d399',
      strokeHovered: '#6ee7b7',
      tetherStroke: '#34d399',
      tetherDot: '#34d399',
      labelBg: '#022c22',
      labelBorder: 'rgba(52, 211, 153, 0.7)',
      labelText: '#34d399',
      labelHoverBg: '#064e3b',
      labelHoverBorder: '#6ee7b7',
      labelHoverText: '#ecfdf5',
    },

    wave: {
      primaryRgba: (a) => `rgba(52, 211, 153, ${a})`,
    },

    canvas: {
      gridColor: '#064e3b',
      gridAlpha: 0.35,
      bgOverlay: 'rgba(2, 44, 34, 0.45)',
    },
  },

  crimson: {
    id: 'crimson',
    name: 'پایپ‌لاین مهندسی (مستطیل یاقوتی ۹۰ درجه)',
    nameEn: 'Crimson Engineering Pipeline',
    description: 'کارت‌های تمیز با اتصالات مهندسی پلکانی و اورتوگونال ۹۰ درجه و قرمز یاقوتی پرانرژی',
    descriptionEn: 'Clean cards with stepped 90-degree orthogonal connections and ruby red accent',
    previewColor: '#f43f5e',
    previewGradient: 'linear-gradient(135deg, #e11d48 0%, #fb7185 100%)',
    badgeBg: 'bg-rose-950/70',
    badgeBorder: 'border-rose-500/80',
    badgeText: 'text-rose-300',

    nodeShape: 'rounded-box',
    connectionStyle: 'orthogonal',

    node: {
      baseFill: '#4c0519',
      baseBorder: '#be123c',
      hoverFill: '#881337',
      hoverBorder: '#fb7185',
      selectedFill: '#2a040e',
      selectedBorder: '#ffe4e6',
      linkTargetFill: '#e11d48',
      linkTargetBorder: '#f43f5e',
      labelText: '#fff1f2',
      labelTextHover: '#fb7185',
      labelTextSelected: '#ffffff',
    },

    halos: {
      selectedInner: 'rgba(244, 63, 94, 0.75)',
      selectedOuter: 'rgba(244, 63, 94, 0)',
      hoverInner: 'rgba(225, 29, 72, 0.4)',
      hoverOuter: 'rgba(225, 29, 72, 0)',
      linkTargetInner: 'rgba(244, 63, 94, 0.85)',
      linkTargetOuter: 'rgba(244, 63, 94, 0)',
    },

    edge: {
      strokeDefault: 'rgba(244, 63, 94, 0.45)',
      strokeSelected: '#fb7185',
      strokeHovered: '#fda4af',
      tetherStroke: '#f43f5e',
      tetherDot: '#f43f5e',
      labelBg: '#2a040e',
      labelBorder: 'rgba(244, 63, 94, 0.7)',
      labelText: '#fb7185',
      labelHoverBg: '#4c0519',
      labelHoverBorder: '#fda4af',
      labelHoverText: '#fff1f2',
    },

    wave: {
      primaryRgba: (a) => `rgba(244, 63, 94, ${a})`,
    },

    canvas: {
      gridColor: '#881337',
      gridAlpha: 0.3,
      bgOverlay: 'rgba(30, 4, 10, 0.5)',
    },
  },

  quantum: {
    id: 'quantum',
    name: 'ترازهای کوانتومی (مدار زرین)',
    nameEn: 'Quantum Gold Orbit',
    description: 'پیوندهای مستقیم کوانتومی ذرات با خطوط دقیق و درخشش طلایی کهربایی عمیق',
    descriptionEn: 'Direct quantum particle bonds with precise lines and rich amber-gold brilliance',
    previewColor: '#f59e0b',
    previewGradient: 'linear-gradient(135deg, #b45309 0%, #fcd34d 100%)',
    badgeBg: 'bg-amber-950/70',
    badgeBorder: 'border-amber-400/80',
    badgeText: 'text-amber-200',

    nodeShape: 'circle',
    connectionStyle: 'straight',

    node: {
      baseFill: '#451a03',
      baseBorder: '#b45309',
      hoverFill: '#78350f',
      hoverBorder: '#fcd34d',
      selectedFill: '#260e02',
      selectedBorder: '#fef3c7',
      linkTargetFill: '#d97706',
      linkTargetBorder: '#f59e0b',
      labelText: '#fef9c3',
      labelTextHover: '#fde047',
      labelTextSelected: '#ffffff',
    },

    halos: {
      selectedInner: 'rgba(245, 158, 11, 0.75)',
      selectedOuter: 'rgba(245, 158, 11, 0)',
      hoverInner: 'rgba(217, 119, 6, 0.4)',
      hoverOuter: 'rgba(217, 119, 6, 0)',
      linkTargetInner: 'rgba(245, 158, 11, 0.85)',
      linkTargetOuter: 'rgba(245, 158, 11, 0)',
    },

    edge: {
      strokeDefault: 'rgba(245, 158, 11, 0.45)',
      strokeSelected: '#fcd34d',
      strokeHovered: '#fef08a',
      tetherStroke: '#f59e0b',
      tetherDot: '#f59e0b',
      labelBg: '#260e02',
      labelBorder: 'rgba(245, 158, 11, 0.7)',
      labelText: '#fcd34d',
      labelHoverBg: '#451a03',
      labelHoverBorder: '#fef08a',
      labelHoverText: '#fef9c3',
    },

    wave: {
      primaryRgba: (a) => `rgba(245, 158, 11, ${a})`,
    },

    canvas: {
      gridColor: '#78350f',
      gridAlpha: 0.32,
      bgOverlay: 'rgba(25, 10, 2, 0.48)',
    },
  },

  synthwave: {
    id: 'synthwave',
    name: 'سینت‌ویو دهه ۸۰ (کپسول نئون پخ‌دار)',
    nameEn: '80s Synthwave Sunset',
    description: 'کپسول‌های افقی به سبک رترو-فیوچریستیک با خطوط زاویه‌دار مدار چاپی و صورتی سایبرپانک',
    descriptionEn: 'Horizontal capsules in retro-futuristic style with circuit lines and cyberpunk pink',
    previewColor: '#ec4899',
    previewGradient: 'linear-gradient(135deg, #be185d 0%, #f472b6 100%)',
    badgeBg: 'bg-pink-950/70',
    badgeBorder: 'border-pink-500/80',
    badgeText: 'text-pink-300',

    nodeShape: 'capsule',
    connectionStyle: 'circuit',

    node: {
      baseFill: '#500724',
      baseBorder: '#db2777',
      hoverFill: '#700c35',
      hoverBorder: '#f472b6',
      selectedFill: '#2c0413',
      selectedBorder: '#fdf2f8',
      linkTargetFill: '#be185d',
      linkTargetBorder: '#f472b6',
      labelText: '#fce7f3',
      labelTextHover: '#f472b6',
      labelTextSelected: '#ffffff',
    },

    halos: {
      selectedInner: 'rgba(236, 72, 153, 0.75)',
      selectedOuter: 'rgba(236, 72, 153, 0)',
      hoverInner: 'rgba(219, 39, 119, 0.4)',
      hoverOuter: 'rgba(219, 39, 119, 0)',
      linkTargetInner: 'rgba(236, 72, 153, 0.85)',
      linkTargetOuter: 'rgba(236, 72, 153, 0)',
    },

    edge: {
      strokeDefault: 'rgba(236, 72, 153, 0.45)',
      strokeSelected: '#f472b6',
      strokeHovered: '#fbcfe8',
      tetherStroke: '#ec4899',
      tetherDot: '#ec4899',
      labelBg: '#2c0413',
      labelBorder: 'rgba(236, 72, 153, 0.7)',
      labelText: '#f472b6',
      labelHoverBg: '#500724',
      labelHoverBorder: '#fbcfe8',
      labelHoverText: '#fce7f3',
    },

    wave: {
      primaryRgba: (a) => `rgba(236, 72, 153, ${a})`,
    },

    canvas: {
      gridColor: '#831843',
      gridAlpha: 0.35,
      bgOverlay: 'rgba(28, 4, 15, 0.52)',
    },
  },

  monochrome: {
    id: 'monochrome',
    name: 'مینیمال تیتانیوم (ادیتوریال آکادمیک)',
    nameEn: 'Editorial Titanium Minimal',
    description: 'طراحی باکلاس سیاه و سفید مات با کنتراست تیتانیوم، بدون شلوغی رنگی و متمرکز بر تفکر عمیق',
    descriptionEn: 'Classy matte monochrome design with titanium contrast focused on deep thinking',
    previewColor: '#94a3b8',
    previewGradient: 'linear-gradient(135deg, #475569 0%, #cbd5e1 100%)',
    badgeBg: 'bg-slate-900',
    badgeBorder: 'border-slate-500/80',
    badgeText: 'text-slate-200',

    nodeShape: 'rounded-box',
    connectionStyle: 'curved',

    node: {
      baseFill: '#0f172a',
      baseBorder: '#475569',
      hoverFill: '#1e293b',
      hoverBorder: '#94a3b8',
      selectedFill: '#020617',
      selectedBorder: '#f8fafc',
      linkTargetFill: '#334155',
      linkTargetBorder: '#cbd5e1',
      labelText: '#f8fafc',
      labelTextHover: '#e2e8f0',
      labelTextSelected: '#ffffff',
    },

    halos: {
      selectedInner: 'rgba(148, 163, 184, 0.65)',
      selectedOuter: 'rgba(148, 163, 184, 0)',
      hoverInner: 'rgba(100, 116, 139, 0.35)',
      hoverOuter: 'rgba(100, 116, 139, 0)',
      linkTargetInner: 'rgba(203, 213, 225, 0.75)',
      linkTargetOuter: 'rgba(203, 213, 225, 0)',
    },

    edge: {
      strokeDefault: 'rgba(148, 163, 184, 0.35)',
      strokeSelected: '#e2e8f0',
      strokeHovered: '#f8fafc',
      tetherStroke: '#94a3b8',
      tetherDot: '#cbd5e1',
      labelBg: '#090d16',
      labelBorder: 'rgba(148, 163, 184, 0.6)',
      labelText: '#cbd5e1',
      labelHoverBg: '#1e293b',
      labelHoverBorder: '#f8fafc',
      labelHoverText: '#ffffff',
    },

    wave: {
      primaryRgba: (a) => `rgba(148, 163, 184, ${a})`,
    },

    canvas: {
      gridColor: '#334155',
      gridAlpha: 0.28,
      bgOverlay: 'rgba(10, 15, 26, 0.45)',
    },
  },
};

export const getGraphTheme = (themeKey?: string | null, isLight: boolean = false): GraphThemeDefinition => {
  const baseTheme =
    themeKey && themeKey in GRAPH_THEMES
      ? GRAPH_THEMES[themeKey as GraphThemeKey]
      : GRAPH_THEMES.cyberpunk;

  if (!isLight) return baseTheme;

  const isCard = baseTheme.nodeShape === 'rounded-box';

  return {
    ...baseTheme,
    badgeBg: 'bg-slate-200',
    badgeBorder: 'border-slate-300',
    badgeText: 'text-slate-800 font-bold',
    node: {
      ...baseTheme.node,
      baseFill: isCard ? '#ffffff' : (baseTheme.previewColor || '#0284c7'),
      baseBorder: isCard ? '#94a3b8' : '#334155',
      hoverFill: isCard ? '#f8fafc' : '#0369a1',
      hoverBorder: '#0284c7',
      selectedFill: '#0284c7',
      selectedBorder: '#0369a1',
      labelText: isCard ? '#0f172a' : '#0f172a',
      labelTextHover: '#0284c7',
      labelTextSelected: isCard ? '#ffffff' : '#0284c7',
    },
    halos: {
      ...baseTheme.halos,
      selectedInner: 'rgba(2, 132, 199, 0.75)',
      hoverInner: 'rgba(148, 163, 184, 0.45)',
    },
    edge: {
      ...baseTheme.edge,
      strokeDefault: 'rgba(71, 85, 105, 0.65)',
      strokeSelected: '#0284c7',
      strokeHovered: '#0284c7',
      labelBg: '#ffffff',
      labelBorder: '#94a3b8',
      labelText: '#0f172a',
      labelHoverBg: '#0284c7',
      labelHoverBorder: '#0284c7',
      labelHoverText: '#ffffff',
    },
    canvas: {
      gridColor: '#94a3b8',
      gridAlpha: 0.35,
      bgOverlay: 'rgba(226, 232, 240, 0.70)',
    },
  };
};
