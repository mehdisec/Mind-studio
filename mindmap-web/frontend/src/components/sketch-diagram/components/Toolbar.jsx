import React, { useState, useRef, useEffect } from 'react';
import {
  LayoutTemplate,
  Palette,
  Plus,
  Sparkles,
  Download,
  Upload,
  Image as ImageIcon,
  HelpCircle,
  Square,
  Diamond,
  Circle,
  RectangleHorizontal,
  UserCheck,
  User,
  Wand2,
  Check,
  Pipette,
  Type,
  Spline,
  Bold,
  Italic,
  AlignLeft,
  AlignCenter,
  AlignRight,
  MousePointerClick,
} from 'lucide-react';
import { TEMPLATES } from '../templates/templateRegistry';

export const FONTS_LIST = [
  { id: 'vazir', name: 'وزیرمتن (Vazirmatn)', family: 'Vazirmatn, sans-serif', sample: 'متن نمونه فارسی و English' },
  { id: 'lalezar', name: 'لاله‌زار (Lalezar)', family: 'Lalezar, cursive', sample: 'عنوان درشت فانتزی' },
  { id: 'caveat', name: 'دست‌نویس (Caveat)', family: 'Caveat, cursive', sample: 'Handwritten Organic Note' },
  { id: 'patrick', name: 'اسکچ (Patrick Hand)', family: '"Patrick Hand", cursive', sample: 'Sketch Doodle Label' },
  { id: 'amiri', name: 'امیری (Amiri)', family: 'Amiri, serif', sample: 'خط سنتی و کلاسیک' },
  { id: 'inter', name: 'اینتر مدرن (Inter)', family: 'Inter, sans-serif', sample: 'Modern English Interface' },
  { id: 'comic', name: 'کژوال (Comic Sans)', family: '"Comic Sans MS", "Comic Sans", cursive', sample: 'Casual Comic Style' },
  { id: 'mono', name: 'کنسول و کد (Monospace)', family: 'ui-monospace, SFMono-Regular, Menlo, Monaco, Consolas, monospace', sample: 'code_identifier = 100;' },
];

export default function Toolbar({
  activeTemplate,
  activeTheme,
  onChangeTheme,
  onSelectTemplate,
  selectedNode,
  selectedEdge,
  onNodeColorChange,
  onEdgeColorChange,
  onEdgeStyleChange,
  activeLineStyle = { pathType: 'bezier', styleType: 'solid-arrow', hasArrow: true, strokeWidth: 2.8 },
  onAddText,
  onFontChange,
  onSelectAll,
  onAddBranch,
  onAddShape,
  onToggleDoodles,
  isDoodlesOpen,
  onAutoLayout,
  onExportJSON,
  onImportJSON,
  onExportPNG,
  onOpenHelp,
  title,
  setTitle,
}) {
  const [activeMenu, setActiveMenu] = useState(null); // 'templates' | 'color' | 'shapes' | 'theme' | 'lines' | 'text' | null
  const [colorTarget, setColorTarget] = useState('border'); // 'border' | 'bg' | 'text' | 'all'
  const [currentFontFamily, setCurrentFontFamily] = useState('Vazirmatn, sans-serif');
  const [currentFontSize, setCurrentFontSize] = useState(20);
  const [isBold, setIsBold] = useState(false);
  const [isItalic, setIsItalic] = useState(false);
  const [textAlign, setTextAlign] = useState('center');

  const fileInputRef = useRef(null);
  const toolbarRef = useRef(null);

  // Sync typography state when selectedNode changes
  useEffect(() => {
    if (selectedNode) {
      if (selectedNode.data?.fontFamily) setCurrentFontFamily(selectedNode.data.fontFamily);
      if (selectedNode.data?.fontSize) setCurrentFontSize(selectedNode.data.fontSize);
      if (selectedNode.data?.bold !== undefined) setIsBold(!!selectedNode.data.bold);
      if (selectedNode.data?.italic !== undefined) setIsItalic(!!selectedNode.data.italic);
      if (selectedNode.data?.textAlign) setTextAlign(selectedNode.data.textAlign);
    }
  }, [selectedNode]);

  // Close menus when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (toolbarRef.current && !toolbarRef.current.contains(e.target)) {
        setActiveMenu(null);
      }
    };
    document.addEventListener('pointerdown', handleClickOutside, true);
    document.addEventListener('mousedown', handleClickOutside, true);
    return () => {
      document.removeEventListener('pointerdown', handleClickOutside, true);
      document.removeEventListener('mousedown', handleClickOutside, true);
    };
  }, []);

  const handleFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = (event) => {
        try {
          const parsed = JSON.parse(event.target.result);
          onImportJSON(parsed);
        } catch (err) {
          alert('Invalid JSON file.');
        }
      };
      reader.readAsText(file);
    }
  };

  const isMilestone = activeTemplate?.id === 'milestone-plane';
  const isCorp = activeTemplate?.id === 'corporate-org';
  const isPastel = activeTemplate?.id === 'pastel-mindmap';
  const isFlowchart = activeTemplate?.id === 'flowchart-sketch';
  const isMindmap = activeTemplate?.id === 'mindmap-sketch';

  // Extract current color based on selected item and active target
  const getCurrentActiveColor = () => {
    if (selectedEdge) {
      return selectedEdge.data?.strokeColor || selectedEdge.style?.stroke || '#1A1A1A';
    }
    if (selectedNode) {
      if (colorTarget === 'border') {
        return (
          selectedNode.data?.borderColor ||
          selectedNode.data?.accentColor ||
          selectedNode.data?.color ||
          '#1A1A1A'
        );
      }
      if (colorTarget === 'bg') {
        return selectedNode.data?.bgColor || '#FFFFFF';
      }
      if (colorTarget === 'text') {
        return (
          selectedNode.data?.textColor ||
          selectedNode.data?.color ||
          '#1A1A1A'
        );
      }
      return (
        selectedNode.data?.borderColor ||
        selectedNode.data?.bgColor ||
        selectedNode.data?.color ||
        '#557A46'
      );
    }
    return '#557A46';
  };

  const currentColor = getCurrentActiveColor();

  // Apply color change to all selected Nodes and Edges
  const handleApplyColor = (color) => {
    if (onNodeColorChange && selectedNode) {
      onNodeColorChange(selectedNode.id, color, colorTarget);
    }
    if (onEdgeColorChange && selectedEdge) {
      onEdgeColorChange(selectedEdge.id, color);
    }
  };

  // Line Style changes
  const currentPathType = selectedEdge?.data?.pathType || activeLineStyle.pathType || 'bezier';
  const currentStyleType = selectedEdge?.data?.styleType || activeLineStyle.styleType || 'solid-arrow';
  const currentHasArrow = selectedEdge?.data?.hasArrow !== undefined ? selectedEdge.data.hasArrow : activeLineStyle.hasArrow;
  const currentStrokeWidth = selectedEdge?.data?.strokeWidth || activeLineStyle.strokeWidth || 2.8;

  const handleUpdateLine = (updates) => {
    if (onEdgeStyleChange) {
      onEdgeStyleChange(selectedEdge?.id || null, updates);
    }
  };

  // Text / Typography changes
  const handleApplyFont = (fontFamily) => {
    setCurrentFontFamily(fontFamily);
    if (onFontChange && selectedNode) {
      onFontChange(selectedNode.id, { fontFamily });
    }
  };

  const handleApplyFontSize = (fontSize) => {
    setCurrentFontSize(fontSize);
    if (onFontChange && selectedNode) {
      onFontChange(selectedNode.id, { fontSize });
    }
  };

  const handleToggleBold = () => {
    const next = !isBold;
    setIsBold(next);
    if (onFontChange && selectedNode) {
      onFontChange(selectedNode.id, { bold: next, fontWeight: next ? 800 : 600 });
    }
  };

  const handleToggleItalic = () => {
    const next = !isItalic;
    setIsItalic(next);
    if (onFontChange && selectedNode) {
      onFontChange(selectedNode.id, { italic: next });
    }
  };

  const handleApplyAlign = (align) => {
    setTextAlign(align);
    if (onFontChange && selectedNode) {
      onFontChange(selectedNode.id, { textAlign: align });
    }
  };

  const handleCreateNewText = () => {
    if (onAddText) {
      onAddText({
        fontFamily: currentFontFamily,
        fontSize: currentFontSize,
        bold: isBold,
        italic: isItalic,
        textAlign,
      });
      setActiveMenu(null);
    }
  };

  // Curated color swatches
  const COLOR_PALETTES = [
    {
      label: 'Strokes & Ink (کادر و خطوط)',
      colors: ['#1A1A1A', '#3B82F6', '#10B981', '#EF4444', '#F59E0B', '#8B5CF6', '#D9822B', '#557A46'],
    },
    {
      label: 'Pastel Fills (رنگ‌های پاستلی)',
      colors: ['#FFAE9C', '#FFD19D', '#DEC8F9', '#C6E9DE', '#FDE047', '#A7F3D0', '#BAE6FD', '#FFFFFF'],
    },
    {
      label: 'Deep & Studio',
      colors: ['#0F172A', '#1E293B', '#334155', '#475569', '#64748B', '#94A3B8', '#E2E8F0', '#F8FAFC'],
    },
  ];

  // Available themes
  const THEMES = [
    { id: 'grid', name: 'Graph Paper Grid (Default)', icon: '📐', bg: '#FAF9F5' },
    { id: 'dark-studio', name: 'Studio Dark', icon: '🌌', bg: '#0B0F19' },
    { id: 'light-studio', name: 'Studio Light', icon: '☀️', bg: '#F8FAFD' },
    { id: 'parchment', name: 'Parchment Sketch', icon: '📜', bg: '#FBFBF6' },
    { id: 'pastel-cream', name: 'Pastel Warm Cream', icon: '🌸', bg: '#FFFDF8' },
    { id: 'sunshine-yellow', name: 'Sunshine Yellow', icon: '☀️', bg: '#FDCA2F' },
    { id: 'clean', name: 'Clean Studio White', icon: '🏢', bg: '#FFFFFF' },
    { id: 'dark-slate', name: 'Dark Slate Studio', icon: '🌑', bg: '#18181B' },
  ];

  const toggleMenu = (menuName) => {
    setActiveMenu((prev) => (prev === menuName ? null : menuName));
  };

  const hasSelection = !!selectedNode || !!selectedEdge;

  return (
    <>
      {/* 1. Subtle Floating Title Pill at Top Left */}
      <div
        style={{
          position: 'absolute',
          top: '16px',
          left: '16px',
          zIndex: 40,
          display: 'flex',
          alignItems: 'center',
          gap: '8px',
          backgroundColor: 'rgba(255, 255, 255, 0.94)',
          backdropFilter: 'blur(8px)',
          border: '2px solid #1A1A1A',
          borderRadius: '16px',
          padding: '6px 14px',
          boxShadow: '3px 3px 0px rgba(0,0,0,0.85)',
        }}
      >
        <span style={{ fontSize: '18px' }}>
          {isMilestone ? '✈️' : isCorp ? '🏢' : isPastel ? '🌸' : isFlowchart ? '📋' : '🧠'}
        </span>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="sketch-title-input"
          style={{ minWidth: '170px', fontSize: '15px' }}
          title="Click to edit title"
        />
      </div>

      {/* 2. Photoshop-style Vertical Right-Docked Toolbar (Slim & Refined) */}
      <aside
        ref={toolbarRef}
        style={{
          position: 'absolute',
          right: '14px',
          top: '28px',
          zIndex: 90,
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          gap: '5px',
          backgroundColor: 'rgba(30, 30, 36, 0.95)',
          backdropFilter: 'blur(12px)',
          border: '1.5px solid #111827',
          borderRadius: '14px',
          padding: '6px 4px',
          boxShadow: '2px 2px 0px rgba(0,0,0,0.85), 0 8px 20px rgba(0,0,0,0.3)',
          pointerEvents: 'auto',
          color: '#F3F4F6',
        }}
      >
        {/* Active Item Color Swatch (Pipette / Swatch) */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => toggleMenu('color')}
            style={{
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              backgroundColor: currentColor,
              border: hasSelection ? '2px solid #FFFFFF' : '1.5px solid rgba(255,255,255,0.4)',
              cursor: 'pointer',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              boxShadow: hasSelection ? '0 0 8px rgba(255,255,255,0.5)' : 'none',
              transition: 'all 0.15s ease',
            }}
            title={
              selectedEdge
                ? `Edge Stroke Color (${currentColor})`
                : selectedNode
                ? `Node Color (${currentColor})`
                : 'Select a node or edge to change color'
            }
          >
            {hasSelection && (
              <Pipette
                size={13}
                color={currentColor === '#FFFFFF' ? '#1A1A1A' : '#FFFFFF'}
                style={{ filter: 'drop-shadow(0 1px 1px rgba(0,0,0,0.8))' }}
              />
            )}
          </button>

          {/* Color Palette Popover Flyout */}
          {activeMenu === 'color' && (
            <div
              style={{
                position: 'absolute',
                right: '50px',
                top: '-30px',
                width: '260px',
                backgroundColor: '#1E1E24',
                border: '2px solid #111827',
                borderRadius: '16px',
                padding: '14px',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.9), 0 10px 25px rgba(0,0,0,0.5)',
                color: '#fff',
                zIndex: 100,
              }}
              className="animate-pop"
            >
              <div
                style={{
                  fontSize: '13px',
                  fontWeight: 800,
                  marginBottom: '10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  paddingBottom: '6px',
                }}
              >
                <span>
                  {selectedEdge
                    ? '〰️ Edge Color (رنگ یال)'
                    : selectedNode
                    ? '🎨 Node Styling (رنگ نود)'
                    : '🎨 Color Picker'}
                </span>
                <span
                  style={{
                    fontSize: '10px',
                    padding: '2px 6px',
                    borderRadius: '4px',
                    backgroundColor: hasSelection ? '#2563EB' : '#374151',
                    color: '#fff',
                  }}
                >
                  {selectedEdge ? 'Edge' : selectedNode ? 'Node' : 'No selection'}
                </span>
              </div>

              {selectedNode && (
                <div
                  style={{
                    display: 'grid',
                    gridTemplateColumns: 'repeat(4, 1fr)',
                    gap: '4px',
                    marginBottom: '12px',
                    backgroundColor: '#131317',
                    padding: '3px',
                    borderRadius: '8px',
                  }}
                >
                  <button
                    onClick={() => setColorTarget('border')}
                    style={{
                      padding: '4px 2px',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: colorTarget === 'border' ? '#3B82F6' : 'transparent',
                      color: colorTarget === 'border' ? '#fff' : '#9CA3AF',
                    }}
                  >
                    Border
                  </button>
                  <button
                    onClick={() => setColorTarget('bg')}
                    style={{
                      padding: '4px 2px',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: colorTarget === 'bg' ? '#3B82F6' : 'transparent',
                      color: colorTarget === 'bg' ? '#fff' : '#9CA3AF',
                    }}
                  >
                    Fill
                  </button>
                  <button
                    onClick={() => setColorTarget('text')}
                    style={{
                      padding: '4px 2px',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: colorTarget === 'text' ? '#3B82F6' : 'transparent',
                      color: colorTarget === 'text' ? '#fff' : '#9CA3AF',
                    }}
                  >
                    Text
                  </button>
                  <button
                    onClick={() => setColorTarget('all')}
                    style={{
                      padding: '4px 2px',
                      fontSize: '11px',
                      fontWeight: 700,
                      borderRadius: '6px',
                      border: 'none',
                      cursor: 'pointer',
                      backgroundColor: colorTarget === 'all' ? '#3B82F6' : 'transparent',
                      color: colorTarget === 'all' ? '#fff' : '#9CA3AF',
                    }}
                  >
                    All
                  </button>
                </div>
              )}

              {COLOR_PALETTES.map((pal) => (
                <div key={pal.label} style={{ marginBottom: '10px' }}>
                  <div style={{ fontSize: '10.5px', color: '#9CA3AF', marginBottom: '4px' }}>
                    {pal.label}
                  </div>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(8, 1fr)', gap: '4px' }}>
                    {pal.colors.map((c) => (
                      <button
                        key={c}
                        onClick={() => handleApplyColor(c)}
                        style={{
                          width: '24px',
                          height: '24px',
                          borderRadius: '6px',
                          backgroundColor: c,
                          border:
                            currentColor.toLowerCase() === c.toLowerCase()
                              ? '2.5px solid #FFFFFF'
                              : '1px solid rgba(0,0,0,0.5)',
                          cursor: 'pointer',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          boxShadow: '0 1px 3px rgba(0,0,0,0.3)',
                        }}
                        title={c}
                      >
                        {currentColor.toLowerCase() === c.toLowerCase() && (
                          <Check
                            size={12}
                            color={c === '#FFFFFF' || c === '#FFAE9C' || c === '#FFD19D' ? '#1A1A1A' : '#FFFFFF'}
                            style={{ filter: 'drop-shadow(0 1px 1px #000)' }}
                          />
                        )}
                      </button>
                    ))}
                  </div>
                </div>
              ))}

              <div
                style={{
                  marginTop: '10px',
                  paddingTop: '8px',
                  borderTop: '1px solid rgba(255,255,255,0.15)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                }}
              >
                <span style={{ fontSize: '11px', color: '#ccc' }}>Custom Hex Color:</span>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '11px', color: '#9CA3AF', fontFamily: 'monospace' }}>
                    {currentColor}
                  </span>
                  <input
                    type="color"
                    value={currentColor.startsWith('#') && currentColor.length === 7 ? currentColor : '#1A1A1A'}
                    onChange={(e) => handleApplyColor(e.target.value)}
                    style={{
                      width: '32px',
                      height: '26px',
                      border: 'none',
                      borderRadius: '4px',
                      cursor: 'pointer',
                      backgroundColor: 'transparent',
                    }}
                  />
                </div>
              </div>
            </div>
          )}
        </div>

        <div style={{ width: '18px', height: '1px', backgroundColor: 'rgba(255,255,255,0.15)', margin: '1px 0' }} />

        {/* 1. Theme / Canvas Background Palette */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => toggleMenu('theme')}
            className="sketch-btn-icon"
            style={{
              backgroundColor: activeMenu === 'theme' ? '#557A46' : '#2B2B36',
              borderColor: '#374151',
              color: '#F3F4F6',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              borderWidth: '1.5px',
            }}
            title="Change Canvas Theme & Background (پوسته‌ها)"
          >
            <Palette size={15} />
          </button>

          {activeMenu === 'theme' && (
            <div
              style={{
                position: 'absolute',
                right: '38px',
                top: '-40px',
                width: '200px',
                backgroundColor: '#1E1E24',
                border: '1.5px solid #111827',
                borderRadius: '14px',
                padding: '10px',
                boxShadow: '3px 3px 0px rgba(0,0,0,0.9)',
                color: '#fff',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
              }}
              className="animate-pop"
            >
              <div style={{ fontSize: '12px', fontWeight: 800, marginBottom: '3px' }}>🎨 Canvas Themes</div>
              {THEMES.map((th) => (
                <button
                  key={th.id}
                  onClick={() => {
                    onChangeTheme(th.id);
                    setActiveMenu(null);
                  }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    padding: '5px 8px',
                    borderRadius: '7px',
                    border: activeTheme === th.id ? '1.5px solid #557A46' : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: activeTheme === th.id ? '#2A3B24' : '#2B2B36',
                    color: '#fff',
                    cursor: 'pointer',
                    fontSize: '11.5px',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span>{th.icon}</span>
                    <span>{th.name}</span>
                  </span>
                  {activeTheme === th.id && <Check size={13} color="#7E9F68" />}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* 2. Line Styles Tool (NEW!) */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => toggleMenu('lines')}
            className="sketch-btn-icon"
            style={{
              backgroundColor: activeMenu === 'lines' ? '#3B82F6' : '#2B2B36',
              borderColor: '#374151',
              color: '#F3F4F6',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              borderWidth: '1.5px',
            }}
            title="Line Types & Arrowhead Styles (انواع و استایل خطوط)"
          >
            <Spline size={15} />
          </button>

          {activeMenu === 'lines' && (
            <div
              style={{
                position: 'absolute',
                right: '38px',
                top: '50%',
                transform: 'translateY(-50%)',
                backgroundColor: '#1E1E24',
                border: '1.5px solid #111827',
                borderRadius: '12px',
                padding: '6px 5px',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.9), 0 8px 24px rgba(0,0,0,0.5)',
                color: '#fff',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                gap: '5px',
              }}
              className="animate-pop"
            >
              {/* Group 1: Path Type (Vertical) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <button
                  onClick={() => handleUpdateLine({ pathType: 'bezier', isOrthogonal: false })}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: currentPathType === 'bezier' ? '#2563EB' : '#2B2B36',
                    border: currentPathType === 'bezier' ? '1.5px solid #60A5FA' : '1px solid rgba(255,255,255,0.08)',
                    color: currentPathType === 'bezier' ? '#FFFFFF' : '#9CA3AF',
                    cursor: 'pointer',
                  }}
                  className="hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
                  title="منحنی نرم دستی (Bezier Curve)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M4 19 C 7 5, 17 21, 20 5" />
                  </svg>
                </button>

                <button
                  onClick={() => handleUpdateLine({ pathType: 'step', isOrthogonal: true })}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: currentPathType === 'step' ? '#2563EB' : '#2B2B36',
                    border: currentPathType === 'step' ? '1.5px solid #60A5FA' : '1px solid rgba(255,255,255,0.08)',
                    color: currentPathType === 'step' ? '#FFFFFF' : '#9CA3AF',
                    cursor: 'pointer',
                  }}
                  className="hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
                  title="خط شکسته ۹۰ درجه (Step Orthogonal)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M4 18 H 14 V 6 H 20" />
                  </svg>
                </button>

                <button
                  onClick={() => handleUpdateLine({ pathType: 'straight', isOrthogonal: false })}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: currentPathType === 'straight' ? '#2563EB' : '#2B2B36',
                    border: currentPathType === 'straight' ? '1.5px solid #60A5FA' : '1px solid rgba(255,255,255,0.08)',
                    color: currentPathType === 'straight' ? '#FFFFFF' : '#9CA3AF',
                    cursor: 'pointer',
                  }}
                  className="hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
                  title="خط مستقیم (Straight Line)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="4" y1="19" x2="20" y2="5" />
                  </svg>
                </button>

                <button
                  onClick={() => handleUpdateLine({ pathType: 'smoothstep', isOrthogonal: false })}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: currentPathType === 'smoothstep' ? '#2563EB' : '#2B2B36',
                    border: currentPathType === 'smoothstep' ? '1.5px solid #60A5FA' : '1px solid rgba(255,255,255,0.08)',
                    color: currentPathType === 'smoothstep' ? '#FFFFFF' : '#9CA3AF',
                    cursor: 'pointer',
                  }}
                  className="hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
                  title="گام نرم (Smooth Step)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <path d="M4 18 Q 12 18 12 12 Q 12 6 20 6" />
                  </svg>
                </button>
              </div>

              {/* Horizontal Divider */}
              <div style={{ width: '18px', height: '1px', backgroundColor: 'rgba(255,255,255,0.15)', margin: '1px 0' }} />

              {/* Group 2: Solid vs Dashed Pattern (Vertical) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <button
                  onClick={() => handleUpdateLine({ styleType: currentHasArrow ? 'solid-arrow' : 'solid' })}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: !currentStyleType.includes('dashed') ? '#2563EB' : '#2B2B36',
                    border: !currentStyleType.includes('dashed') ? '1.5px solid #60A5FA' : '1px solid rgba(255,255,255,0.08)',
                    color: !currentStyleType.includes('dashed') ? '#FFFFFF' : '#9CA3AF',
                    cursor: 'pointer',
                  }}
                  className="hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
                  title="خط پیوسته (Solid Line)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round">
                    <line x1="3" y1="12" x2="21" y2="12" />
                  </svg>
                </button>

                <button
                  onClick={() => handleUpdateLine({ styleType: 'dashed' })}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: currentStyleType.includes('dashed') ? '#2563EB' : '#2B2B36',
                    border: currentStyleType.includes('dashed') ? '1.5px solid #60A5FA' : '1px solid rgba(255,255,255,0.08)',
                    color: currentStyleType.includes('dashed') ? '#FFFFFF' : '#9CA3AF',
                    cursor: 'pointer',
                  }}
                  className="hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
                  title="خط‌چین (Dashed Line)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.8" strokeLinecap="round" strokeDasharray="3 3">
                    <line x1="3" y1="12" x2="21" y2="12" />
                  </svg>
                </button>
              </div>

              {/* Horizontal Divider */}
              <div style={{ width: '18px', height: '1px', backgroundColor: 'rgba(255,255,255,0.15)', margin: '1px 0' }} />

              {/* Group 3: Arrowhead (Vertical) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                <button
                  onClick={() => handleUpdateLine({ hasArrow: true, styleType: currentStyleType.includes('dashed') ? 'dashed' : 'solid-arrow' })}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: currentHasArrow ? '#2563EB' : '#2B2B36',
                    border: currentHasArrow ? '1.5px solid #60A5FA' : '1px solid rgba(255,255,255,0.08)',
                    color: currentHasArrow ? '#FFFFFF' : '#9CA3AF',
                    cursor: 'pointer',
                  }}
                  className="hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
                  title="فلش‌دار (With Arrowhead)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round">
                    <line x1="4" y1="12" x2="18" y2="12" />
                    <polyline points="13 7 18 12 13 17" />
                  </svg>
                </button>

                <button
                  onClick={() => handleUpdateLine({ hasArrow: false, styleType: currentStyleType.includes('dashed') ? 'dashed' : 'solid' })}
                  style={{
                    width: '26px',
                    height: '26px',
                    borderRadius: '6px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    backgroundColor: !currentHasArrow ? '#2563EB' : '#2B2B36',
                    border: !currentHasArrow ? '1.5px solid #60A5FA' : '1px solid rgba(255,255,255,0.08)',
                    color: !currentHasArrow ? '#FFFFFF' : '#9CA3AF',
                    cursor: 'pointer',
                  }}
                  className="hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
                  title="بدون فلش و ساده (Plain Line)"
                >
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round">
                    <line x1="4" y1="12" x2="20" y2="12" />
                  </svg>
                </button>
              </div>

              {/* Horizontal Divider */}
              <div style={{ width: '18px', height: '1px', backgroundColor: 'rgba(255,255,255,0.15)', margin: '1px 0' }} />

              {/* Group 4: Thickness (Vertical) */}
              <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '3px' }}>
                {[
                  { width: 1.8, title: 'ضخامت نازک ۲ پیکسل (Thin 2px)', stroke: 1.5 },
                  { width: 2.8, title: 'ضخامت متوسط ۳ پیکسل (Medium 3px)', stroke: 3 },
                  { width: 4.5, title: 'ضخامت درشت ۵ پیکسل (Thick 5px)', stroke: 5.5 },
                ].map((w) => (
                  <button
                    key={w.width}
                    onClick={() => handleUpdateLine({ strokeWidth: w.width })}
                    style={{
                      width: '26px',
                      height: '26px',
                      borderRadius: '6px',
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'center',
                      backgroundColor: currentStrokeWidth === w.width ? '#2563EB' : '#2B2B36',
                      border: currentStrokeWidth === w.width ? '1.5px solid #60A5FA' : '1px solid rgba(255,255,255,0.08)',
                      color: currentStrokeWidth === w.width ? '#FFFFFF' : '#9CA3AF',
                      cursor: 'pointer',
                    }}
                    className="hover:text-white hover:bg-slate-700 active:scale-95 transition-all"
                    title={w.title}
                  >
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <line x1="4" y1="12" x2="20" y2="12" strokeWidth={w.stroke} strokeLinecap="round" />
                    </svg>
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* 3. Text & Typography Tool (NEW!) */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => toggleMenu('text')}
            className="sketch-btn-icon"
            style={{
              backgroundColor: activeMenu === 'text' ? '#10B981' : '#2B2B36',
              borderColor: '#374151',
              color: '#F3F4F6',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              borderWidth: '1.5px',
            }}
            title="Text & Typography Fonts (متن و انتخاب فونت‌ها)"
          >
            <Type size={16} />
          </button>

          {activeMenu === 'text' && (
            <div
              style={{
                position: 'absolute',
                right: '38px',
                top: '-40px',
                width: '260px',
                backgroundColor: '#1E1E24',
                border: '1.5px solid #111827',
                borderRadius: '14px',
                padding: '12px',
                boxShadow: '4px 4px 0px rgba(0,0,0,0.9), 0 10px 25px rgba(0,0,0,0.5)',
                color: '#fff',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '10px',
              }}
              className="animate-pop"
            >
              <div
                style={{
                  fontSize: '12px',
                  fontWeight: 800,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  borderBottom: '1px solid rgba(255,255,255,0.1)',
                  paddingBottom: '4px',
                }}
              >
                <span>📝 Text & Fonts (متن و فونت)</span>
                <span
                  style={{
                    fontSize: '9px',
                    padding: '2px 5px',
                    borderRadius: '4px',
                    backgroundColor: selectedNode ? '#10B981' : '#374151',
                    color: '#fff',
                  }}
                >
                  {selectedNode ? 'Active Node' : 'New Text'}
                </span>
              </div>

              {/* Add Text Button */}
              <button
                onClick={handleCreateNewText}
                style={{
                  width: '100%',
                  padding: '7px 10px',
                  backgroundColor: '#10B981',
                  color: '#FFFFFF',
                  fontWeight: 800,
                  fontSize: '11.5px',
                  borderRadius: '8px',
                  border: 'none',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '6px',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.3)',
                }}
                className="hover:bg-emerald-600 active:scale-95 transition-all"
              >
                <Plus size={14} />
                افزودن متن به صفحه (+ Add Text)
              </button>

              {/* Font Family Selector */}
              <div>
                <div style={{ fontSize: '10.5px', color: '#9CA3AF', marginBottom: '4px' }}>
                  Font Family (خانواده فونت):
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '3px', maxHeight: '150px', overflowY: 'auto' }} className="custom-scrollbar">
                  {FONTS_LIST.map((f) => {
                    const isSelected = currentFontFamily.toLowerCase().includes(f.family.split(',')[0].toLowerCase().replace(/['"]/g, ''));
                    return (
                      <button
                        key={f.id}
                        onClick={() => handleApplyFont(f.family)}
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          padding: '4px 8px',
                          borderRadius: '6px',
                          border: isSelected ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.08)',
                          backgroundColor: isSelected ? '#064E3B' : '#2B2B36',
                          color: '#fff',
                          cursor: 'pointer',
                          textAlign: 'right',
                          fontFamily: f.family,
                        }}
                      >
                        <span style={{ fontSize: '12px' }}>{f.name}</span>
                        {isSelected && <Check size={12} color="#34D399" />}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Font Size & Formats */}
              <div>
                <div style={{ fontSize: '10.5px', color: '#9CA3AF', marginBottom: '4px' }}>
                  Size & Style (اندازه و استایل):
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
                  {/* Sizes */}
                  <select
                    value={currentFontSize}
                    onChange={(e) => handleApplyFontSize(Number(e.target.value))}
                    style={{
                      flex: 1,
                      backgroundColor: '#2B2B36',
                      color: '#fff',
                      border: '1px solid rgba(255,255,255,0.2)',
                      borderRadius: '6px',
                      padding: '4px 6px',
                      fontSize: '11px',
                      cursor: 'pointer',
                    }}
                  >
                    <option value={14}>14px - کوچک</option>
                    <option value={18}>18px - متن عادی</option>
                    <option value={22}>22px - متوسط</option>
                    <option value={28}>28px - عنوان</option>
                    <option value={36}>36px - سرتیتر</option>
                    <option value={48}>48px - درشت</option>
                  </select>

                  {/* Bold */}
                  <button
                    onClick={handleToggleBold}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: isBold ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: isBold ? '#064E3B' : '#2B2B36',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                    title="Bold (ضخیم)"
                  >
                    <Bold size={13} />
                  </button>

                  {/* Italic */}
                  <button
                    onClick={handleToggleItalic}
                    style={{
                      padding: '4px 8px',
                      borderRadius: '6px',
                      border: isItalic ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                      backgroundColor: isItalic ? '#064E3B' : '#2B2B36',
                      color: '#fff',
                      cursor: 'pointer',
                    }}
                    title="Italic (کج)"
                  >
                    <Italic size={13} />
                  </button>
                </div>
              </div>

              {/* Alignments */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '4px' }}>
                <button
                  onClick={() => handleApplyAlign('right')}
                  style={{
                    padding: '4px',
                    borderRadius: '6px',
                    border: textAlign === 'right' ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: textAlign === 'right' ? '#064E3B' : '#2B2B36',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Right Align (راست‌چین)"
                >
                  <AlignRight size={13} />
                </button>
                <button
                  onClick={() => handleApplyAlign('center')}
                  style={{
                    padding: '4px',
                    borderRadius: '6px',
                    border: textAlign === 'center' ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: textAlign === 'center' ? '#064E3B' : '#2B2B36',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Center Align (وسط‌چین)"
                >
                  <AlignCenter size={13} />
                </button>
                <button
                  onClick={() => handleApplyAlign('left')}
                  style={{
                    padding: '4px',
                    borderRadius: '6px',
                    border: textAlign === 'left' ? '1.5px solid #10B981' : '1px solid rgba(255,255,255,0.1)',
                    backgroundColor: textAlign === 'left' ? '#064E3B' : '#2B2B36',
                    color: '#fff',
                    cursor: 'pointer',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                  }}
                  title="Left Align (چپ‌چین)"
                >
                  <AlignLeft size={13} />
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 4. Add Shapes / Creation Tools (Template-aware flyout) */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => {
              if (isMindmap) onAddBranch();
              else if (isMilestone) onAddShape('milestoneNext');
              else toggleMenu('shapes');
            }}
            className="sketch-btn-icon"
            style={{
              backgroundColor: '#557A46',
              borderColor: '#4A6B3A',
              color: '#FFFFFF',
              width: '28px',
              height: '28px',
              borderRadius: '8px',
              borderWidth: '1.5px',
            }}
            title="Add Shape / Next Node"
          >
            <Plus size={16} />
          </button>

          {activeMenu === 'shapes' && (
            <div
              style={{
                position: 'absolute',
                right: '38px',
                top: '-30px',
                width: '180px',
                backgroundColor: '#1E1E24',
                border: '1.5px solid #111827',
                borderRadius: '14px',
                padding: '8px',
                boxShadow: '3px 3px 0px rgba(0,0,0,0.9)',
                color: '#fff',
                zIndex: 100,
                display: 'flex',
                flexDirection: 'column',
                gap: '5px',
              }}
              className="animate-pop"
            >
              <div style={{ fontSize: '11.5px', fontWeight: 800, marginBottom: '2px', color: '#9CA3AF' }}>
                Insert Shape
              </div>

              {isFlowchart && (
                <>
                  <button
                    onClick={() => {
                      onAddShape('process');
                      setActiveMenu(null);
                    }}
                    className="sketch-btn sketch-btn-sm"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <Square size={13} /> Process Box
                  </button>
                  <button
                    onClick={() => {
                      onAddShape('decision');
                      setActiveMenu(null);
                    }}
                    className="sketch-btn sketch-btn-sm"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <Diamond size={13} /> Decision
                  </button>
                  <button
                    onClick={() => {
                      onAddShape('terminal');
                      setActiveMenu(null);
                    }}
                    className="sketch-btn sketch-btn-sm"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <Circle size={13} /> Terminal
                  </button>
                  <button
                    onClick={() => {
                      onAddShape('headerProcess');
                      setActiveMenu(null);
                    }}
                    className="sketch-btn sketch-btn-sm"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <RectangleHorizontal size={13} /> Header Box
                  </button>
                </>
              )}

              {isPastel && (
                <>
                  <button
                    onClick={() => {
                      onAddShape('pastelSquircle');
                      setActiveMenu(null);
                    }}
                    className="sketch-btn sketch-btn-sm"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <Square size={13} color="#FFAE9C" /> Squircle
                  </button>
                  <button
                    onClick={() => {
                      onAddShape('pastelOval');
                      setActiveMenu(null);
                    }}
                    className="sketch-btn sketch-btn-sm"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <Circle size={13} color="#DEC8F9" /> Oval
                  </button>
                  <button
                    onClick={() => {
                      onAddShape('pastelRect');
                      setActiveMenu(null);
                    }}
                    className="sketch-btn sketch-btn-sm"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <RectangleHorizontal size={13} color="#C6E9DE" /> Rect
                  </button>
                </>
              )}

              {isCorp && (
                <>
                  <button
                    onClick={() => {
                      onAddShape('corpNode');
                      setActiveMenu(null);
                    }}
                    className="sketch-btn sketch-btn-sm"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <User size={13} color="#3B82F6" /> Member Card
                  </button>
                  <button
                    onClick={() => {
                      onAddShape('corpCeo');
                      setActiveMenu(null);
                    }}
                    className="sketch-btn sketch-btn-sm"
                    style={{ justifyContent: 'flex-start' }}
                  >
                    <UserCheck size={13} color="#EF4444" /> Executive Card
                  </button>
                </>
              )}
            </div>
          )}
        </div>

        {/* 5. Doodles / Stickers Drawer */}
        <button
          onClick={onToggleDoodles}
          className="sketch-btn-icon"
          style={{
            backgroundColor: isDoodlesOpen ? '#D9822B' : '#2B2B36',
            borderColor: '#374151',
            color: '#F3F4F6',
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            borderWidth: '1.5px',
          }}
          title="Doodles & Sketch Stickers (استیکرها)"
        >
          <Sparkles size={15} color={isDoodlesOpen ? '#FFFFFF' : '#D9822B'} />
        </button>

        {/* 6. Auto Layout / Align */}
        <button
          onClick={onAutoLayout}
          className="sketch-btn-icon"
          style={{
            backgroundColor: '#2B2B36',
            borderColor: '#374151',
            color: '#F3F4F6',
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            borderWidth: '1.5px',
          }}
          title={isCorp ? 'Auto-align Organization Chart Columns' : 'Auto-organize Diagram Layout'}
        >
          <Wand2 size={15} />
        </button>

        {/* 6.5 Select All (Ctrl+A) */}
        <button
          onClick={onSelectAll}
          className="sketch-btn-icon"
          style={{
            backgroundColor: '#2B2B36',
            borderColor: '#374151',
            color: '#F3F4F6',
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            borderWidth: '1.5px',
          }}
          title="انتخاب همگانی (Ctrl + A)"
        >
          <MousePointerClick size={15} />
        </button>

        <div style={{ width: '18px', height: '1px', backgroundColor: 'rgba(255,255,255,0.15)', margin: '1px 0' }} />

        {/* 7. Export PNG */}
        <button
          onClick={onExportPNG}
          className="sketch-btn-icon"
          style={{
            backgroundColor: '#2B2B36',
            borderColor: '#374151',
            color: '#7E9F68',
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            borderWidth: '1.5px',
          }}
          title="Export High Quality PNG Image"
        >
          <ImageIcon size={15} />
        </button>

        {/* 8. Save JSON */}
        <button
          onClick={onExportJSON}
          className="sketch-btn-icon"
          style={{
            backgroundColor: '#2B2B36',
            borderColor: '#374151',
            color: '#F3F4F6',
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            borderWidth: '1.5px',
          }}
          title="Save Diagram (JSON)"
        >
          <Download size={15} />
        </button>

        {/* 9. Load JSON */}
        <button
          onClick={() => fileInputRef.current?.click()}
          className="sketch-btn-icon"
          style={{
            backgroundColor: '#2B2B36',
            borderColor: '#374151',
            color: '#F3F4F6',
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            borderWidth: '1.5px',
          }}
          title="Load Diagram (JSON)"
        >
          <Upload size={15} />
        </button>

        <input
          ref={fileInputRef}
          type="file"
          accept=".json"
          onChange={handleFileChange}
          style={{ display: 'none' }}
        />

        {/* 10. Help & Shortcuts */}
        <button
          onClick={onOpenHelp}
          className="sketch-btn-icon"
          style={{
            backgroundColor: '#2B2B36',
            borderColor: '#374151',
            color: '#F3F4F6',
            width: '28px',
            height: '28px',
            borderRadius: '8px',
            borderWidth: '1.5px',
          }}
          title="Help & Shortcuts (?)"
        >
          <HelpCircle size={15} />
        </button>
      </aside>
    </>
  );
}
