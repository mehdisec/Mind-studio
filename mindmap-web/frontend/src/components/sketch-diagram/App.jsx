import React, { useState, useCallback, useMemo, useRef, useEffect } from 'react';
import {
  ReactFlow,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  SelectionMode,
  getNodesBounds,
} from '@xyflow/react';
import * as htmlToImage from 'html-to-image';
import confetti from 'canvas-confetti';

// Mind Map Node Components
import RootNode from './components/nodes/RootNode';
import BranchNode from './components/nodes/BranchNode';
import SubNode from './components/nodes/SubNode';
import DoodleNode from './components/nodes/DoodleNode';
import TextNode from './components/nodes/TextNode';

import ImageNode from './components/nodes/ImageNode';
import {
  PlusSquare,
  Type,
  Image as ImageIcon,
  Copy,
  Trash2,
  Wand2,
  Maximize,
  Upload,
  Clipboard,
} from 'lucide-react';

// Flowchart Node Components
import ProcessNode from './components/nodes/flowchart/ProcessNode';
import DecisionNode from './components/nodes/flowchart/DecisionNode';
import TerminalNode from './components/nodes/flowchart/TerminalNode';
import HeaderNode from './components/nodes/flowchart/HeaderNode';

// Pastel Mind Map Node Component
import PastelNode from './components/nodes/pastel/PastelNode';

// Corporate Org Chart Node Component
import CorporateOrgNode from './components/nodes/corporate/CorporateOrgNode';

// Milestone Roadmap Node Components
import MilestoneNode from './components/nodes/milestone/MilestoneNode';
import PaperPlaneNode from './components/nodes/milestone/PaperPlaneNode';
import WaypointNode from './components/nodes/milestone/WaypointNode';

// Edge Component
import SketchEdge from './components/edges/SketchEdge';

// UI Components
import Toolbar from './components/Toolbar';
import DoodleDrawer from './components/DoodleDrawer';
import HelpModal from './components/HelpModal';
import { useDiagramStudioStore } from '../../stores/useDiagramStudioStore';
import {
  exportDiagramToMarkdown,
  parseMarkdownToDiagram,
  downloadFile,
} from '../../utils/mindmapMarkdown';

// Templates Registry
import { TEMPLATES, getTemplateById } from './templates/templateRegistry';
import {
  generateId,
  calculateRadialMindmapLayout,
  calculateCorporateOrgLayout,
  applyThemeToDiagram,
  DOODLE_PRESETS,
} from './utils/sketchUtils';

const nodeTypes = {
  // Mindmap nodes
  root: RootNode,
  branch: BranchNode,
  subnode: SubNode,
  doodle: DoodleNode,
  text: TextNode,
  image: ImageNode,
  // Flowchart nodes
  process: ProcessNode,
  decision: DecisionNode,
  terminal: TerminalNode,
  headerProcess: HeaderNode,
  // Pastel nodes
  pastelNode: PastelNode,
  // Corporate Org nodes
  corpNode: CorporateOrgNode,
  // Milestone nodes
  milestoneNode: MilestoneNode,
  paperPlaneNode: PaperPlaneNode,
  waypointNode: WaypointNode,
};

const edgeTypes = {
  sketch: SketchEdge,
};

function DiagramCanvas({
  initialTemplateId = 'milestone-plane',
  initialTheme = null,
  initialTitle = null,
  initialNodes = null,
  initialEdges = null,
  onStateChange,
  onSave,
  onExport,
  className = '',
  style = {},
}) {
  const [activeTemplateId, setActiveTemplateId] = useState(initialTemplateId);
  const activeTemplate = useMemo(() => getTemplateById(activeTemplateId), [activeTemplateId]);

  const defaultTheme = initialTheme || 'grid';
  const initialData = useMemo(() => {
    if (initialNodes && Array.isArray(initialNodes) && initialNodes.length > 0) {
      return {
        nodes: initialNodes,
        edges: initialEdges && Array.isArray(initialEdges) ? initialEdges : activeTemplate.defaultEdges,
      };
    }
    return applyThemeToDiagram(defaultTheme, activeTemplate.defaultNodes, activeTemplate.defaultEdges);
  }, [initialNodes, initialEdges, activeTemplate, defaultTheme]);

  const [nodes, setNodes, onNodesChange] = useNodesState(initialData.nodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(initialData.edges);
  const [activeTheme, setActiveTheme] = useState(defaultTheme); // Default to Graph Paper Grid theme

  const [title, setTitle] = useState(
    initialTitle ||
      (activeTemplateId === 'milestone-plane'
        ? 'Milestone Paper Plane Journey'
        : activeTemplateId === 'corporate-org'
        ? 'Corporate Organization Chart'
        : activeTemplateId === 'pastel-mindmap'
        ? 'Pastel Organic Mind Map'
        : activeTemplateId === 'flowchart-sketch'
        ? 'Hand-Drawn Flowchart'
        : 'Brand Identity Mind Map')
  );

  const [isDoodlesOpen, setIsDoodlesOpen] = useState(false);
  const [isHelpOpen, setIsHelpOpen] = useState(false);

  // Notify parent component on state changes
  useEffect(() => {
    if (onStateChange) {
      onStateChange({ nodes, edges, templateId: activeTemplateId, theme: activeTheme, title });
    }
  }, [nodes, edges, activeTemplateId, activeTheme, title, onStateChange]);

  const reactFlowWrapper = useRef(null);
  const { fitView, screenToFlowPosition, project } = useReactFlow();

  const effectiveTheme = activeTheme || activeTemplate.backgroundStyle || 'grid';

  // Initial fit view on mount for 30% smaller spacious overview
  useEffect(() => {
    const timer = setTimeout(() => {
      fitView({ padding: 0.55, duration: 450 });
    }, 120);
    return () => clearTimeout(timer);
  }, [fitView]);

  // Currently selected node and edge for color changes
  const selectedNode = useMemo(() => nodes.find((n) => n.selected), [nodes]);
  const selectedEdge = useMemo(() => edges.find((e) => e.selected), [edges]);

  // Handle label updates
  const handleLabelChange = useCallback((nodeId, newText) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, label: newText },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Handle rich data updates
  const handleDataChange = useCallback((nodeId, newData) => {
    setNodes((nds) =>
      nds.map((node) => {
        if (node.id === nodeId) {
          return {
            ...node,
            data: { ...node.data, ...newData },
          };
        }
        return node;
      })
    );
  }, [setNodes]);

  // Handle deleting an edge
  const handleDeleteEdge = useCallback((edgeId) => {
    setEdges((eds) => eds.filter((e) => e.id !== edgeId));
  }, [setEdges]);

  // Handle deleting nodes & cascaded edges
  const handleDeleteNode = useCallback((nodeId) => {
    setNodes((nds) => {
      const toDelete = new Set([nodeId]);
      let addedMore = true;
      while (addedMore) {
        addedMore = false;
        edges.forEach((e) => {
          if (toDelete.has(e.source) && !toDelete.has(e.target)) {
            toDelete.add(e.target);
            addedMore = true;
          }
        });
      }
      return nds.filter((n) => !toDelete.has(n.id));
    });

    setEdges((eds) =>
      eds.filter((e) => e.source !== nodeId && e.target !== nodeId)
    );
  }, [edges, setNodes, setEdges]);

  // Real-time Node Color Change (supports single and multi-selection recoloring)
  const handleNodeColorChange = useCallback((nodeId, newColor, target = 'all') => {
    setNodes((nds) => {
      const selectedCount = nds.filter((n) => n.selected).length;
      const targetIds = new Set();
      if (selectedCount > 1) {
        nds.forEach((n) => {
          if (n.selected || n.id === nodeId) targetIds.add(n.id);
        });
      } else if (nodeId) {
        targetIds.add(nodeId);
      } else {
        nds.forEach((n) => {
          if (n.selected) targetIds.add(n.id);
        });
      }

      return nds.map((node) => {
        if (targetIds.has(node.id)) {
          const updatedData = { ...node.data };
          if (target === 'border') {
            updatedData.borderColor = newColor;
            updatedData.color = newColor;
            updatedData.accentColor = newColor;
          } else if (target === 'bg') {
            updatedData.bgColor = newColor;
          } else if (target === 'text') {
            updatedData.textColor = newColor;
          } else {
            // 'all'
            updatedData.color = newColor;
            updatedData.borderColor = newColor;
            updatedData.accentColor = newColor;
            if (node.type === 'pastelNode' || node.type === 'root' || node.type === 'branch' || node.type === 'subnode') {
              updatedData.bgColor = newColor;
            }
          }
          return {
            ...node,
            data: updatedData,
          };
        }
        return node;
      });
    });
  }, [setNodes]);

  // Real-time Edge Color Change (supports single and multi-selection)
  const handleEdgeColorChange = useCallback((edgeId, newColor) => {
    setEdges((eds) => {
      const selectedCount = eds.filter((e) => e.selected).length;
      const targetIds = new Set();
      if (selectedCount > 1) {
        eds.forEach((e) => {
          if (e.selected || e.id === edgeId) targetIds.add(e.id);
        });
      } else if (edgeId) {
        targetIds.add(edgeId);
      } else {
        eds.forEach((e) => {
          if (e.selected) targetIds.add(e.id);
        });
      }

      return eds.map((edge) => {
        if (targetIds.has(edge.id)) {
          return {
            ...edge,
            data: {
              ...edge.data,
              strokeColor: newColor,
            },
            style: {
              ...edge.style,
              stroke: newColor,
            },
          };
        }
        return edge;
      });
    });
  }, [setEdges]);

  // Active Line / Edge Style Preferences (bezier / step / straight, dashed / solid, arrows, stroke width)
  const [activeLineStyle, setActiveLineStyle] = useState({
    pathType: 'bezier',
    styleType: 'solid-arrow',
    hasArrow: true,
    strokeWidth: 2.8,
  });

  const handleEdgeStyleChange = useCallback((edgeId, styleUpdates) => {
    setActiveLineStyle((prev) => ({ ...prev, ...styleUpdates }));
    setEdges((eds) => {
      const selectedCount = eds.filter((e) => e.selected).length;
      const targetIds = new Set();
      if (selectedCount > 1) {
        eds.forEach((e) => {
          if (e.selected || e.id === edgeId) targetIds.add(e.id);
        });
      } else if (edgeId) {
        targetIds.add(edgeId);
      } else {
        eds.forEach((e) => {
          if (e.selected) targetIds.add(e.id);
        });
      }

      if (targetIds.size === 0) return eds;

      return eds.map((edge) => {
        if (targetIds.has(edge.id)) {
          const updatedData = { ...edge.data, ...styleUpdates };
          const isDashed = updatedData.styleType === 'dashed' || updatedData.styleType === 'dashed-orthogonal';
          return {
            ...edge,
            data: updatedData,
            style: {
              ...edge.style,
              strokeWidth: updatedData.strokeWidth || edge.style?.strokeWidth,
              strokeDasharray: isDashed ? '5,5' : undefined,
            },
          };
        }
        return edge;
      });
    });
  }, [setEdges]);

  // User's latest typography preferences for rapid frictionless text creation
  const [latestTypography, setLatestTypography] = useState({
    fontFamily: 'Vazirmatn, sans-serif',
    fontSize: 20,
    bold: false,
    italic: false,
    textAlign: 'center',
  });

  // Add Free-form Text Node with Custom Fonts
  const handleAddText = useCallback((textOptions = {}, customPosition = null) => {
    const mergedOptions = { ...latestTypography, ...textOptions };
    setLatestTypography(mergedOptions);

    const newTextId = generateId('text');
    const pos = customPosition || {
      x: 350 + (Math.random() - 0.5) * 80,
      y: 220 + (Math.random() - 0.5) * 80,
    };

    const newTextNode = {
      id: newTextId,
      type: 'text',
      position: pos,
      style: {
        width: 170,
        height: 52,
      },
      data: {
        label: mergedOptions.label || 'متن جدید...',
        fontFamily: mergedOptions.fontFamily || 'Vazirmatn, sans-serif',
        fontSize: mergedOptions.fontSize || 20,
        bold: mergedOptions.bold || false,
        italic: mergedOptions.italic || false,
        textAlign: mergedOptions.textAlign || 'center',
        textColor: mergedOptions.textColor || (effectiveTheme === 'dark-studio' || effectiveTheme === 'dark-slate' ? '#F8FAFC' : '#1A1A1A'),
      },
      selected: true,
    };

    setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), newTextNode]);
  }, [latestTypography, effectiveTheme, setNodes]);

  // Real-time Font and Typography change for nodes
  const handleFontChange = useCallback((nodeId, fontOptions) => {
    setLatestTypography((prev) => ({ ...prev, ...fontOptions }));
    setNodes((nds) => {
      const selectedCount = nds.filter((n) => n.selected).length;
      const targetIds = new Set();
      if (selectedCount > 1) {
        nds.forEach((n) => {
          if (n.selected || n.id === nodeId) targetIds.add(n.id);
        });
      } else if (nodeId) {
        targetIds.add(nodeId);
      } else {
        nds.forEach((n) => {
          if (n.selected) targetIds.add(n.id);
        });
      }

      if (targetIds.size === 0) return nds;

      return nds.map((node) => {
        if (targetIds.has(node.id)) {
          return {
            ...node,
            data: {
              ...node.data,
              ...fontOptions,
            },
          };
        }
        return node;
      });
    });
  }, [setNodes]);

  // Add Uploaded Image Node with balanced proportional dimensions
  const uploadPositionRef = useRef(null);
  const imageFileInputRef = useRef(null);

  const handleAddImage = useCallback((file, customPosition = null) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const dataUrl = e.target.result;
      const img = new Image();
      img.onload = () => {
        const origW = img.naturalWidth || 300;
        const origH = img.naturalHeight || 300;

        // Calculate balanced proportional size: max 240px wide/tall, min 90px
        let w = origW;
        let h = origH;
        const MAX_DIM = 240;
        const MIN_DIM = 90;

        if (w > MAX_DIM || h > MAX_DIM) {
          if (w >= h) {
            h = Math.round((h * MAX_DIM) / w);
            w = MAX_DIM;
          } else {
            w = Math.round((w * MAX_DIM) / h);
            h = MAX_DIM;
          }
        } else if (w < MIN_DIM && h < MIN_DIM) {
          if (w >= h) {
            h = Math.round((h * MIN_DIM) / w);
            w = MIN_DIM;
          } else {
            w = Math.round((w * MIN_DIM) / h);
            h = MIN_DIM;
          }
        }

        const pos = customPosition || {
          x: 350 + (Math.random() - 0.5) * 80,
          y: 220 + (Math.random() - 0.5) * 80,
        };

        const newImageId = generateId('img');
        const newImageNode = {
          id: newImageId,
          type: 'image',
          position: pos,
          style: {
            width: w,
            height: h,
          },
          data: {
            src: dataUrl,
            imgUrl: dataUrl,
            label: file.name || 'Uploaded Image',
            rotation: 0,
            onDeleteNode: handleDeleteNode,
          },
          selected: true,
        };

        setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), newImageNode]);
      };
      img.src = dataUrl;
    };
    reader.readAsDataURL(file);
  }, [handleDeleteNode, setNodes]);

  const handleImageFileChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      handleAddImage(file, uploadPositionRef.current);
      if (imageFileInputRef.current) {
        imageFileInputRef.current.value = '';
      }
    }
  };

  // Comprehensive Theme Switcher: changes background, nodes, borders, text, and edges for high contrast
  const handleChangeTheme = useCallback((themeId) => {
    setActiveTheme(themeId);
    setNodes((currentNodes) => {
      setEdges((currentEdges) => {
        const { nodes: updatedNodes, edges: updatedEdges } = applyThemeToDiagram(
          themeId,
          currentNodes,
          currentEdges
        );
        return updatedEdges;
      });
      const { nodes: updatedNodes } = applyThemeToDiagram(themeId, currentNodes, edges);
      return updatedNodes;
    });
  }, [edges, setNodes, setEdges]);

  // Switch Template
  const handleSelectTemplate = useCallback(
    (templateId) => {
      const selectedTpl = getTemplateById(templateId);
      setActiveTemplateId(templateId);
      setActiveTheme(null); // Reset to template default
      setNodes(selectedTpl.defaultNodes);
      setEdges(selectedTpl.defaultEdges);
      setTitle(
        templateId === 'milestone-plane'
          ? 'Milestone Paper Plane Journey'
          : templateId === 'corporate-org'
          ? 'Corporate Organization Chart'
          : templateId === 'pastel-mindmap'
          ? 'Pastel Organic Mind Map'
          : templateId === 'flowchart-sketch'
          ? 'Hand-Drawn Flowchart'
          : 'Brand Identity Mind Map'
      );
      setTimeout(() => {
        fitView({ duration: 450, padding: 0.55 });
      }, 60);
    },
    [fitView, setNodes, setEdges]
  );

  // Add Next Sequential Milestone Step (Triggered by Paper Airplane or Toolbar)
  const handleAddMilestone = useCallback(() => {
    const currentMilestones = nodes.filter((n) => n.type === 'milestoneNode');
    const count = currentMilestones.length;
    const nextStepNum = count + 1;
    const nextStepNumber = String(nextStepNum).padStart(2, '0');

    const iconList = ['lightbulb', 'rocket', 'gears', 'target', 'trophy', 'star', 'flag'];
    const nextIcon = iconList[(count) % iconList.length];

    const planeNode = nodes.find((n) => n.type === 'paperPlaneNode') || {
      id: 'ms-paper-plane',
      position: { x: 230, y: -270 },
    };

    const newWaypointId = generateId('ms-wp');
    const newStepId = generateId('ms-step');

    // Place new waypoint where the plane was
    const wpX = planeNode.position.x - 30;
    const wpY = planeNode.position.y + 110;

    // Alternate placement side for zigzag dynamic roadmap feel
    const isLeftPlacement = count % 2 === 0;
    const stepX = isLeftPlacement ? wpX - 340 : wpX + 30;
    const stepY = isLeftPlacement ? wpY - 80 : wpY + 40;

    // Move Paper Plane forward into the sky
    const newPlaneX = planeNode.position.x + 220;
    const newPlaneY = planeNode.position.y - 130;

    const newWaypoint = {
      id: newWaypointId,
      type: 'waypointNode',
      position: { x: wpX, y: wpY },
      data: {},
    };

    const newStepNode = {
      id: newStepId,
      type: 'milestoneNode',
      position: { x: stepX, y: stepY },
      data: {
        stepNumber: nextStepNumber,
        title: `TITLE OF STEP ${nextStepNumber}`,
        desc: 'LOREM IPSUM DOLOR SIT AMET, CONSECTETUER ADIPISCING ELIT, SED DIAM NONUMMY NIBH EUISMOD TINCIDUNT UT LAOREET DOLORE MAGNA ALIQUAM ERAT VOLUTPAT.',
        iconType: nextIcon,
        iconPosition: isLeftPlacement ? 'right' : 'left',
      },
    };

    // Find the edge leading to the paper plane and redirect it to the new waypoint
    const planeEdge = edges.find((e) => e.target === planeNode.id);
    const previousWpId = planeEdge ? planeEdge.source : 'ms-wp-' + count;

    const remainingEdges = edges.filter((e) => e.target !== planeNode.id);

    const newEdgeToWp = {
      id: `e-${previousWpId}-${newWaypointId}_${Date.now()}`,
      source: previousWpId,
      target: newWaypointId,
      sourceHandle: 'source-right',
      targetHandle: 'target-left',
      type: 'sketch',
      data: { styleType: 'solid', strokeColor: '#1A1A1A', strokeWidth: 3.6 },
    };

    const newEdgeToStep = {
      id: `e-${newWaypointId}-${newStepId}_${Date.now()}`,
      source: newWaypointId,
      target: newStepId,
      sourceHandle: isLeftPlacement ? 'source-left' : 'source-bottom',
      targetHandle: isLeftPlacement ? 'target-right' : 'target-top',
      type: 'sketch',
      data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 3.2 },
    };

    const newEdgeToPlane = {
      id: `e-${newWaypointId}-plane_${Date.now()}`,
      source: newWaypointId,
      target: planeNode.id,
      sourceHandle: 'source-top-right',
      targetHandle: 'target-bottom-left',
      type: 'sketch',
      data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 3.2 },
    };

    // Theme styling
    const { nodes: [styledWp, styledStep], edges: [styledE1, styledE2, styledE3] } = applyThemeToDiagram(
      effectiveTheme,
      [newWaypoint, newStepNode],
      [newEdgeToWp, newEdgeToStep, newEdgeToPlane]
    );

    setNodes((nds) => [
      ...nds.map((n) =>
        n.type === 'paperPlaneNode'
          ? { ...n, position: { x: newPlaneX, y: newPlaneY } }
          : n
      ),
      styledWp || newWaypoint,
      styledStep || newStepNode,
    ]);

    setEdges(() => [
      ...remainingEdges,
      styledE1 || newEdgeToWp,
      styledE2 || newEdgeToStep,
      styledE3 || newEdgeToPlane,
    ]);

    confetti({
      particleCount: 40,
      spread: 50,
      origin: { y: 0.7 },
    });

    setTimeout(() => {
      fitView({ duration: 450, padding: 0.55 });
    }, 60);
  }, [nodes, edges, effectiveTheme, fitView, setNodes, setEdges]);

  // Add Dynamic Shapes (supports click-to-add & drag-and-drop onto coordinates)
  const handleAddShape = useCallback(
    (shapeType, customPosition = null) => {
      if (shapeType === 'text') {
        handleAddText({}, customPosition);
        return;
      }

      if (shapeType === 'milestoneNext' && !customPosition) {
        handleAddMilestone();
        return;
      }

      const newId = generateId(shapeType);
      const defaultLabels = {
        process: 'Lorem\nipsum',
        decision: 'Lorem',
        terminal: 'Lorem\nipsum',
        headerProcess: 'Lorem ipsum\nDolor',
        pastelSquircle: 'Topic',
        pastelOval: 'Sub-topic',
        pastelRect: 'Detail',
        root: 'Main Topic',
        branch: 'Topic',
        subnode: 'Detail Item',
      };

      const corpAccents = ['#3B82F6', '#10B981', '#F59E0B', '#F97316', '#8B5CF6'];
      const randomAccent = corpAccents[Math.floor(Math.random() * corpAccents.length)];
      const pastelColors = ['#FFAE9C', '#FFD19D', '#DEC8F9', '#C6E9DE'];
      const randomPastel = pastelColors[Math.floor(Math.random() * pastelColors.length)];

      const pos = customPosition || {
        x: 100 + (Math.random() - 0.5) * 140,
        y: 100 + (Math.random() - 0.5) * 140,
      };

      let actualType = shapeType;
      let shapeData = {
        label: defaultLabels[shapeType] || 'New Point',
      };

      if (shapeType === 'corpNode') {
        shapeData = {
          name: 'Employee Name',
          role: 'Position Title',
          accentColor: randomAccent,
          width: '210px',
        };
      } else if (shapeType === 'corpCeo') {
        actualType = 'corpNode';
        shapeData = {
          name: 'Executive Leader',
          role: 'Chief Executive Officer',
          isCeo: true,
          accentColor: '#EF4444',
          width: '235px',
        };
      } else if (shapeType.startsWith('pastel')) {
        actualType = 'pastelNode';
        const subShape = shapeType === 'pastelOval' ? 'oval' : shapeType === 'pastelRect' ? 'rect' : 'squircle';
        shapeData = {
          label: defaultLabels[shapeType] || 'New Point',
          shape: subShape,
          bgColor: randomPastel,
          textColor: '#2D3748',
        };
      } else if (shapeType === 'milestoneNext' || shapeType === 'milestoneNode') {
        actualType = 'milestoneNode';
        const count = nodes.filter((n) => n.type === 'milestoneNode').length + 1;
        shapeData = {
          stepNumber: String(count).padStart(2, '0'),
          title: `TITLE OF STEP ${String(count).padStart(2, '0')}`,
          desc: 'LOREM IPSUM DOLOR SIT AMET, CONSECTETUER ADIPISCING ELIT, SED DIAM NONUMMY NIBH EUISMOD.',
          iconType: 'lightbulb',
          iconPosition: 'left',
        };
      } else if (shapeType === 'paperPlaneNode') {
        actualType = 'paperPlaneNode';
        shapeData = {};
      } else if (shapeType === 'waypointNode') {
        actualType = 'waypointNode';
        shapeData = {};
      }

      const newNode = {
        id: newId,
        type: actualType,
        position: pos,
        data: shapeData,
        selected: true,
      };

      // Theme-conforming style application
      const { nodes: [themedNode] } = applyThemeToDiagram(effectiveTheme, [newNode], []);

      setNodes((nds) => [
        ...nds.map((n) => ({ ...n, selected: false })),
        themedNode || newNode,
      ]);
    },
    [effectiveTheme, handleAddMilestone, nodes, setNodes]
  );

  // Double click on ANY of the 8 handles to spawn and connect a new node in that direction
  const handleHandleDoubleClick = useCallback((nodeId, direction) => {
    const parent = nodes.find((n) => n.id === nodeId);
    if (!parent) return;

    let offsetX = 220;
    let offsetY = 0;
    let sourceHandle = `source-${direction}`;
    let targetHandle = 'target-left';

    switch (direction) {
      case 'top':
        offsetX = 0;
        offsetY = -150;
        targetHandle = 'target-bottom';
        break;
      case 'top-right':
        offsetX = 200;
        offsetY = -140;
        targetHandle = 'target-bottom-left';
        break;
      case 'right':
        offsetX = 220;
        offsetY = 0;
        targetHandle = 'target-left';
        break;
      case 'bottom-right':
        offsetX = 200;
        offsetY = 140;
        targetHandle = 'target-top-left';
        break;
      case 'bottom':
        offsetX = 0;
        offsetY = 110;
        targetHandle = 'target-top';
        break;
      case 'bottom-left':
        offsetX = -200;
        offsetY = 140;
        targetHandle = 'target-top-right';
        break;
      case 'left':
        offsetX = -220;
        offsetY = 0;
        targetHandle = 'target-right';
        break;
      case 'top-left':
        offsetX = -200;
        offsetY = -140;
        targetHandle = 'target-bottom-right';
        break;
      default:
        offsetX = 220;
        offsetY = 0;
        targetHandle = 'target-left';
    }

    const isCorp = parent.type === 'corpNode';
    const isPastel = parent.type === 'pastelNode';
    const isFlowchart = ['process', 'decision', 'terminal', 'headerProcess'].includes(parent.type);
    
    let newNodeType = 'subnode';
    let newId = generateId('sub');
    let strokeColor = '#1A1A1A';
    let strokeWidth = 2.8;
    let styleType = 'solid-arrow';
    let newNodeData = { label: 'New Point' };

    if (isCorp) {
      newNodeType = 'corpNode';
      newId = generateId('corp');
      const accent = parent.data.accentColor || '#3B82F6';
      strokeColor = accent;
      strokeWidth = 2;
      styleType = 'dashed';

      newNodeData = {
        name: 'Team Member',
        role: 'Department Specialist',
        accentColor: accent,
        width: '210px',
      };
    } else if (isPastel) {
      newNodeType = 'pastelNode';
      newId = generateId('pst');
      strokeColor = '#283A2E';
      strokeWidth = 3.2;

      const isRoot = parent.data.shape === 'root';
      const childColor = isRoot ? '#FFAE9C' : '#DEC8F9';
      const childShape = isRoot ? 'squircle' : 'oval';

      newNodeData = {
        label: isRoot ? 'New Topic' : 'New Point',
        shape: childShape,
        bgColor: childColor,
        textColor: '#2D3748',
      };
    } else if (isFlowchart) {
      newNodeType = 'process';
      newId = generateId('proc');
      newNodeData = { label: 'Lorem\nipsum' };
    } else if (parent.type === 'root') {
      newNodeType = 'branch';
      newId = generateId('branch');
      newNodeData = { label: 'NEW TOPIC', color: '#557A46' };
    }

    const newNode = {
      id: newId,
      type: newNodeType,
      selected: false,
      position: {
        x: parent.position.x + offsetX,
        y: parent.position.y + offsetY,
      },
      data: newNodeData,
    };

    const newEdge = {
      id: `e-${parent.id}-${sourceHandle}-${newId}-${targetHandle}_${Date.now()}`,
      source: parent.id,
      target: newId,
      sourceHandle,
      targetHandle,
      type: 'sketch',
      data: {
        styleType,
        strokeColor,
        strokeWidth,
      },
    };

    const { nodes: [styledNode], edges: [styledEdge] } = applyThemeToDiagram(
      effectiveTheme,
      [newNode],
      [newEdge]
    );

    setNodes((nds) => [...nds, styledNode || newNode]);
    setEdges((eds) => [...eds, styledEdge || newEdge]);
  }, [nodes, effectiveTheme, setNodes, setEdges]);

  // Handle branch collapsing & expanding (Mind Map)
  const handleToggleCollapse = useCallback((branchId) => {
    setNodes((nds) => {
      const branch = nds.find((n) => n.id === branchId);
      if (!branch) return nds;

      const willBeCollapsed = !branch.data.collapsed;

      const childIds = new Set();
      edges.forEach((e) => {
        if (e.source === branchId) {
          childIds.add(e.target);
        }
      });

      return nds.map((n) => {
        if (n.id === branchId) {
          return {
            ...n,
            data: {
              ...n.data,
              collapsed: willBeCollapsed,
              childCount: childIds.size,
            },
          };
        }
        if (childIds.has(n.id)) {
          return {
            ...n,
            hidden: willBeCollapsed,
          };
        }
        return n;
      });
    });

    setEdges((eds) => {
      const childTargetIds = new Set(
        edges.filter((e) => e.source === branchId).map((e) => e.target)
      );
      return eds.map((e) => {
        if (childTargetIds.has(e.target) || e.source === branchId) {
          const branch = nodes.find((n) => n.id === branchId);
          const willBeCollapsed = branch ? !branch.data.collapsed : false;
          return {
            ...e,
            hidden: willBeCollapsed,
          };
        }
        return e;
      });
    });
  }, [nodes, edges, setNodes, setEdges]);

  // Add a new branch from Root Node (keeps root selected)
  const handleAddBranch = useCallback((fromNodeId = null, direction = 'right') => {
    const root = (fromNodeId ? nodes.find((n) => n.id === fromNodeId) : null) || nodes.find((n) => n.type === 'root') || nodes[0];
    const rootPos = root ? root.position : { x: 0, y: 0 };

    let offsetX = 340;
    let offsetY = 0;
    let sourceHandle = 'source-right';
    let targetHandle = 'target-left';

    if (direction === 'top') {
      offsetX = 0;
      offsetY = -240;
      sourceHandle = 'source-top';
      targetHandle = 'target-bottom';
    } else if (direction === 'bottom') {
      offsetX = 0;
      offsetY = 240;
      sourceHandle = 'source-bottom';
      targetHandle = 'target-top';
    } else if (direction === 'left') {
      offsetX = -340;
      offsetY = 0;
      sourceHandle = 'source-left';
      targetHandle = 'target-right';
    }

    const randomJitter = (Math.random() - 0.5) * 30;
    const newBranchId = generateId('branch');
    const newBranchNode = {
      id: newBranchId,
      type: 'branch',
      selected: false,
      position: {
        x: rootPos.x + offsetX + randomJitter,
        y: rootPos.y + offsetY + randomJitter,
      },
      data: {
        label: 'NEW TOPIC',
        color: '#557A46',
        collapsed: false,
        childCount: 0,
      },
    };

    const newEdge = {
      id: `e-${root?.id || 'root'}-${newBranchId}`,
      source: root?.id || 'root-1',
      target: newBranchId,
      sourceHandle,
      targetHandle,
      type: 'sketch',
      data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 3 },
    };

    const { nodes: [styledBranch], edges: [styledEdge] } = applyThemeToDiagram(
      effectiveTheme,
      [newBranchNode],
      [newEdge]
    );

    setNodes((nds) => [...nds, styledBranch || newBranchNode]);
    setEdges((eds) => [...eds, styledEdge || newEdge]);
  }, [nodes, effectiveTheme, setNodes, setEdges]);

  // Add Subnode to a Branch (keeps branch selected)
  const handleAddSubnode = useCallback((branchId) => {
    const branch = nodes.find((n) => n.id === branchId);
    if (!branch) return;

    const existingChildren = edges.filter((e) => e.source === branchId);
    const count = existingChildren.length;

    const isLeft = branch.position.x < 0;
    const offsetX = isLeft ? -220 : 220;
    const offsetY = (count - 1) * 55;
    const sourceHandle = isLeft ? 'source-left' : 'source-right';
    const targetHandle = isLeft ? 'target-right' : 'target-left';

    const newSubnodeId = generateId('sub');
    const newSubNode = {
      id: newSubnodeId,
      type: 'subnode',
      selected: false,
      position: {
        x: branch.position.x + offsetX,
        y: branch.position.y + offsetY,
      },
      data: {
        label: 'Key Point ' + (count + 1),
      },
    };

    const newEdge = {
      id: `e-${branchId}-${newSubnodeId}`,
      source: branchId,
      target: newSubnodeId,
      sourceHandle,
      targetHandle,
      type: 'sketch',
      data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 2 },
    };

    const { nodes: [styledSub], edges: [styledEdge] } = applyThemeToDiagram(
      effectiveTheme,
      [newSubNode],
      [newEdge]
    );

    setNodes((nds) => [...nds, styledSub || newSubNode]);
    setEdges((eds) => [...eds, styledEdge || newEdge]);
  }, [nodes, edges, effectiveTheme, setNodes, setEdges]);

  // Add Sibling to a Subnode
  const handleAddSibling = useCallback((subnodeId) => {
    const currentSub = nodes.find((n) => n.id === subnodeId);
    if (!currentSub) return;

    const incomingEdge = edges.find((e) => e.target === subnodeId);
    if (!incomingEdge) return;

    const parentId = incomingEdge.source;
    const newSubnodeId = generateId('sub');
    const newSubNode = {
      id: newSubnodeId,
      type: 'subnode',
      selected: false,
      position: {
        x: currentSub.position.x,
        y: currentSub.position.y + 55,
      },
      data: {
        label: 'Next Item',
      },
    };

    const newEdge = {
      id: `e-${parentId}-${newSubnodeId}`,
      source: parentId,
      target: newSubnodeId,
      sourceHandle: incomingEdge.sourceHandle || 'source-right',
      targetHandle: incomingEdge.targetHandle || 'target-left',
      type: 'sketch',
      data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 2 },
    };

    const { nodes: [styledSub], edges: [styledEdge] } = applyThemeToDiagram(
      effectiveTheme,
      [newSubNode],
      [newEdge]
    );

    setNodes((nds) => [...nds, styledSub || newSubNode]);
    setEdges((eds) => [...eds, styledEdge || newEdge]);
  }, [nodes, edges, effectiveTheme, setNodes, setEdges]);

  // Add Child to a Subnode
  const handleAddChild = useCallback((subnodeId) => {
    const currentSub = nodes.find((n) => n.id === subnodeId);
    if (!currentSub) return;

    const isLeft = currentSub.position.x < 0;
    const offsetX = isLeft ? -190 : 190;
    const sourceHandle = isLeft ? 'source-left' : 'source-right';
    const targetHandle = isLeft ? 'target-right' : 'target-left';

    const newSubnodeId = generateId('sub');
    const newSubNode = {
      id: newSubnodeId,
      type: 'subnode',
      selected: false,
      position: {
        x: currentSub.position.x + offsetX,
        y: currentSub.position.y + 20,
      },
      data: {
        label: 'Detail note',
      },
    };

    const newEdge = {
      id: `e-${subnodeId}-${newSubnodeId}`,
      source: subnodeId,
      target: newSubnodeId,
      sourceHandle,
      targetHandle,
      type: 'sketch',
      data: { styleType: 'dashed', strokeColor: '#555555', strokeWidth: 1.8 },
    };

    const { nodes: [styledSub], edges: [styledEdge] } = applyThemeToDiagram(
      effectiveTheme,
      [newSubNode],
      [newEdge]
    );

    setNodes((nds) => [...nds, styledSub || newSubNode]);
    setEdges((eds) => [...eds, styledEdge || newEdge]);
  }, [nodes, effectiveTheme, setNodes, setEdges]);

  // Add Doodle sticker
  const handleSelectDoodle = useCallback((doodleInput, customPosition = null) => {
    const doodleId = typeof doodleInput === 'object' && doodleInput !== null ? doodleInput.id : doodleInput;
    const doodleDef = DOODLE_PRESETS.find((d) => d.id === doodleId) || DOODLE_PRESETS[0];
    const newDoodleId = generateId('doodle');
    const randomAngle = (Math.random() - 0.5) * 6;

    const pos = customPosition || {
      x: 300 + (Math.random() - 0.5) * 150,
      y: 200 + (Math.random() - 0.5) * 150,
    };

    const initialW = doodleDef?.width || 80;
    const initialH = doodleDef?.height || 80;

    const newDoodle = {
      id: newDoodleId,
      type: 'doodle',
      position: pos,
      style: {
        width: initialW,
        height: initialH,
      },
      data: {
        doodleId,
        imgUrl: doodleDef?.imgUrl,
        rotation: randomAngle,
        onDeleteNode: handleDeleteNode,
      },
      selected: true,
    };

    setNodes((nds) => [...nds.map((n) => ({ ...n, selected: false })), newDoodle]);
    setIsDoodlesOpen(false);
  }, [handleDeleteNode, setNodes]);

  // Clipboard state for Copy & Paste
  const clipboardRef = useRef({ nodes: [], edges: [] });
  const [clipboard, setClipboard] = useState({ nodes: [], edges: [] });
  const pasteCountRef = useRef(1);

  // Copy Selected Nodes & their internal connections
  const handleCopy = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    const intraEdges = edges.filter(
      (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
    );

    const copyData = {
      nodes: JSON.parse(JSON.stringify(selectedNodes)),
      edges: JSON.parse(JSON.stringify(intraEdges)),
    };

    clipboardRef.current = copyData;
    setClipboard(copyData);
    try {
      sessionStorage.setItem('sketch_diagram_clipboard', JSON.stringify(copyData));
    } catch (_) {}
    pasteCountRef.current = 1;
  }, [nodes, edges]);

  // Paste Copied Nodes with new IDs and offset
  const handlePaste = useCallback(() => {
    let sourceData = clipboardRef.current;
    if (!sourceData || !sourceData.nodes || sourceData.nodes.length === 0) {
      try {
        const cached = sessionStorage.getItem('sketch_diagram_clipboard');
        if (cached) {
          sourceData = JSON.parse(cached);
          clipboardRef.current = sourceData;
        }
      } catch (_) {}
    }

    if (!sourceData || !sourceData.nodes || sourceData.nodes.length === 0) return;

    const offset = 35 * pasteCountRef.current;
    pasteCountRef.current += 1;

    const idMap = new Map();

    const newNodes = sourceData.nodes.map((node) => {
      const newId = generateId(node.type || 'node');
      idMap.set(node.id, newId);

      return {
        ...node,
        id: newId,
        selected: true,
        position: {
          x: (node.position?.x || 0) + offset,
          y: (node.position?.y || 0) + offset,
        },
      };
    });

    const newEdges = (sourceData.edges || []).map((edge) => {
      const newSource = idMap.get(edge.source);
      const newTarget = idMap.get(edge.target);
      const newEdgeId = `e-${newSource}-${edge.sourceHandle || 's'}-${newTarget}-${edge.targetHandle || 't'}_${Date.now()}`;

      return {
        ...edge,
        id: newEdgeId,
        source: newSource,
        target: newTarget,
      };
    });

    // Deselect existing nodes and select newly pasted nodes
    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false })),
      ...newNodes,
    ]);

    if (newEdges.length > 0) {
      setEdges((eds) => [...eds, ...newEdges]);
    }
  }, [setNodes, setEdges]);

  // Instant Duplicate (Ctrl+D)
  const handleDuplicate = useCallback(() => {
    const selectedNodes = nodes.filter((n) => n.selected);
    if (selectedNodes.length === 0) return;

    const selectedNodeIds = new Set(selectedNodes.map((n) => n.id));
    const intraEdges = edges.filter(
      (e) => selectedNodeIds.has(e.source) && selectedNodeIds.has(e.target)
    );

    const idMap = new Map();
    const offset = 35;

    const newNodes = selectedNodes.map((node) => {
      const newId = generateId(node.type || 'node');
      idMap.set(node.id, newId);

      return {
        ...node,
        id: newId,
        selected: true,
        position: {
          x: (node.position?.x || 0) + offset,
          y: (node.position?.y || 0) + offset,
        },
      };
    });

    const newEdges = intraEdges.map((edge) => {
      const newSource = idMap.get(edge.source);
      const newTarget = idMap.get(edge.target);
      const newEdgeId = `e-${newSource}-${edge.sourceHandle || 's'}-${newTarget}-${edge.targetHandle || 't'}_${Date.now()}`;

      return {
        ...edge,
        id: newEdgeId,
        source: newSource,
        target: newTarget,
      };
    });

    setNodes((nds) => [
      ...nds.map((n) => ({ ...n, selected: false })),
      ...newNodes,
    ]);

    if (newEdges.length > 0) {
      setEdges((eds) => [...eds, ...newEdges]);
    }
  }, [nodes, edges, setNodes, setEdges]);

  // Select All Nodes and Edges
  const handleSelectAll = useCallback(() => {
    setNodes((nds) => nds.map((n) => ({ ...n, selected: true })));
    setEdges((eds) => eds.map((edge) => ({ ...edge, selected: true })));
  }, [setNodes, setEdges]);

  // Keyboard Shortcuts (Tab, Enter, Ctrl+A, Ctrl+C, Ctrl+V, Ctrl+D)
  useEffect(() => {
    const handleKeyDown = (e) => {
      const activeTag = document.activeElement?.tagName;
      if (activeTag === 'INPUT' || activeTag === 'TEXTAREA' || document.activeElement?.isContentEditable) {
        return;
      }

      const isCtrlOrMeta = e.ctrlKey || e.metaKey;
      const isAKey = e.code === 'KeyA' || e.key?.toLowerCase() === 'a' || e.key === 'ش';
      const isCKey = e.code === 'KeyC' || e.key?.toLowerCase() === 'c' || e.key === 'ژ' || e.key === 'ز';
      const isVKey = e.code === 'KeyV' || e.key?.toLowerCase() === 'v' || e.key === 'ر';
      const isDKey = e.code === 'KeyD' || e.key?.toLowerCase() === 'd' || e.key === 'ی';

      // 0. Select All (Ctrl+A / Cmd+A)
      if (isCtrlOrMeta && isAKey) {
        e.preventDefault();
        e.stopPropagation();
        handleSelectAll();
        return;
      }

      // 1. Copy (Ctrl+C / Cmd+C)
      if (isCtrlOrMeta && isCKey) {
        e.preventDefault();
        e.stopPropagation();
        handleCopy();
        return;
      }

      // 2. Paste (Ctrl+V / Cmd+V)
      if (isCtrlOrMeta && isVKey) {
        e.preventDefault();
        e.stopPropagation();
        handlePaste();
        return;
      }

      // 3. Duplicate (Ctrl+D / Cmd+D)
      if (isCtrlOrMeta && isDKey) {
        e.preventDefault();
        e.stopPropagation();
        handleDuplicate();
        return;
      }

      // 4. Tab Key (Add Branch / Subnode / Next Shape)
      if (e.key === 'Tab') {
        e.preventDefault();
        const selectedNode = nodes.find((n) => n.selected);
        if (selectedNode) {
          if (selectedNode.type === 'corpNode') {
            handleHandleDoubleClick(selectedNode.id, 'bottom');
          } else if (selectedNode.type === 'milestoneNode' || selectedNode.type === 'paperPlaneNode') {
            handleAddMilestone();
          } else if (['process', 'decision', 'terminal', 'headerProcess'].includes(selectedNode.type)) {
            handleHandleDoubleClick(selectedNode.id, 'bottom');
          } else if (selectedNode.type === 'pastelNode') {
            handleHandleDoubleClick(selectedNode.id, 'right');
          } else if (selectedNode.type === 'root') {
            handleAddBranch(selectedNode.id, 'right');
          } else if (selectedNode.type === 'branch') {
            handleAddSubnode(selectedNode.id);
          } else if (selectedNode.type === 'subnode') {
            handleAddChild(selectedNode.id);
          }
        } else {
          if (activeTemplateId === 'mindmap-sketch') {
            handleAddBranch(null, 'right');
          } else if (activeTemplateId === 'milestone-plane') {
            handleAddMilestone();
          } else if (activeTemplateId === 'corporate-org') {
            handleAddShape('corpNode');
          } else if (activeTemplateId === 'pastel-mindmap') {
            handleAddShape('pastelSquircle');
          } else {
            handleAddShape('process');
          }
        }
      } else if (e.key === 'Enter') {
        const selectedNode = nodes.find((n) => n.selected);
        if (selectedNode && selectedNode.type === 'subnode') {
          e.preventDefault();
          handleAddSibling(selectedNode.id);
        }
      }
    };

    window.addEventListener('keydown', handleKeyDown, true);
    return () => window.removeEventListener('keydown', handleKeyDown, true);
  }, [nodes, activeTemplateId, handleSelectAll, handleAddBranch, handleAddSubnode, handleAddChild, handleAddSibling, handleAddShape, handleHandleDoubleClick, handleAddMilestone, handleCopy, handlePaste, handleDuplicate, setNodes, setEdges]);

  // Auto Layout for Diagrams
  const handleAutoLayout = useCallback(() => {
    if (activeTemplateId === 'corporate-org') {
      setNodes((nds) => calculateCorporateOrgLayout(nds, edges));
    } else {
      setNodes((nds) => calculateRadialMindmapLayout(nds, edges));
    }
    setTimeout(() => {
      fitView({ duration: 400, padding: 0.15 });
    }, 50);
  }, [activeTemplateId, edges, fitView, setNodes]);

  // Export JSON
  const handleExportJSON = useCallback(() => {
    const data = {
      templateId: activeTemplateId,
      title,
      nodes,
      edges,
      version: '2.0',
      exportedAt: new Date().toISOString(),
    };
    const jsonStr = JSON.stringify(data, null, 2);
    const blob = new Blob([jsonStr], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${title.toLowerCase().replace(/\s+/g, '_')}_sketch.json`;
    a.click();
    URL.revokeObjectURL(url);
  }, [activeTemplateId, title, nodes, edges]);

  // Import JSON
  const handleImportJSON = useCallback((importedData) => {
    if (importedData && importedData.nodes && importedData.edges) {
      if (importedData.templateId) {
        setActiveTemplateId(importedData.templateId);
      }
      setNodes(importedData.nodes);
      setEdges(importedData.edges);
      if (importedData.title) setTitle(importedData.title);
      setTimeout(() => {
        fitView({ duration: 400, padding: 0.2 });
      }, 50);
    }
  }, [fitView, setNodes, setEdges]);

  // Export Markdown (.md)
  const handleExportMarkdown = useCallback(() => {
    const mdContent = exportDiagramToMarkdown(
      title,
      activeTemplateId,
      effectiveTheme,
      nodes,
      edges
    );
    const filename = `${(title || 'diagram').toLowerCase().replace(/\s+/g, '_')}_project.md`;
    downloadFile(mdContent, filename);
  }, [title, activeTemplateId, effectiveTheme, nodes, edges]);

  // Import Markdown (.md)
  const handleImportMarkdown = useCallback((mdContent) => {
    const parsed = parseMarkdownToDiagram(mdContent);
    if (!parsed) {
      alert('محتوای فایل مارک‌داون معتبر نبوده یا قابل تبدیل به ساختار دیاگرام نمی‌باشد.');
      return;
    }
    if (parsed.templateId) {
      setActiveTemplateId(parsed.templateId);
    }
    if (parsed.themeId) {
      setActiveTheme(parsed.themeId);
    }
    if (parsed.title) {
      setTitle(parsed.title);
    }
    setNodes(parsed.nodes);
    setEdges(parsed.edges);
    setTimeout(() => {
      fitView({ duration: 400, padding: 0.2 });
    }, 60);
  }, [fitView, setNodes, setEdges]);

  // Export as High-Res Transparent PNG (Content Only, No UI/Menus/Background)
  const handleExportPNG = useCallback(async () => {
    if (!nodes || nodes.length === 0) {
      alert('محتوایی برای ذخیره در دیاگرام وجود ندارد.');
      return;
    }

    const viewportEl = document.querySelector('.react-flow__viewport');
    if (!viewportEl) return;

    try {
      // Calculate exact bounding box of all nodes in flow coordinates
      const nodesBounds = getNodesBounds(nodes);
      const padding = 60;
      const imageWidth = Math.ceil(nodesBounds.width + padding * 2);
      const imageHeight = Math.ceil(nodesBounds.height + padding * 2);

      // Frame viewport exactly around the nodes
      const transformX = -nodesBounds.x + padding;
      const transformY = -nodesBounds.y + padding;

      const dataUrl = await htmlToImage.toPng(viewportEl, {
        backgroundColor: null, // 100% transparent background
        width: imageWidth,
        height: imageHeight,
        pixelRatio: 2, // Ultra sharp 2x retina output
        style: {
          width: `${imageWidth}px`,
          height: `${imageHeight}px`,
          transform: `translate(${transformX}px, ${transformY}px)`,
        },
        filter: (el) => {
          // Exclude any UI overlays, controls, selection boxes, or connection handles if needed
          if (
            el?.classList?.contains('react-flow__controls') ||
            el?.classList?.contains('react-flow__minimap') ||
            el?.classList?.contains('react-flow__panel') ||
            el?.classList?.contains('nodrag') ||
            el?.classList?.contains('react-flow__resize-control')
          ) {
            return false;
          }
          return true;
        },
      });

      const safeTitle = (title || 'diagram').trim().toLowerCase().replace(/\s+/g, '_');
      const a = document.createElement('a');
      a.href = dataUrl;
      a.download = `${safeTitle}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);

      confetti({
        particleCount: 50,
        spread: 60,
        origin: { y: 0.8 },
      });
    } catch (err) {
      console.error('Export transparent PNG failed:', err);
      alert('خطا در ذخیره تصویر شفاف دیاگرام.');
    }
  }, [nodes, title]);

  // Pass handlers down to node data
  const enrichedNodes = useMemo(() => {
    return nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        onLabelChange: handleLabelChange,
        onDataChange: handleDataChange,
        onAddBranch: handleAddBranch,
        onAddSubnode: handleAddSubnode,
        onAddSibling: handleAddSibling,
        onAddChild: handleAddChild,
        onAddMilestone: handleAddMilestone,
        onDeleteNode: handleDeleteNode,
        onToggleCollapse: handleToggleCollapse,
        onHandleDoubleClick: handleHandleDoubleClick,
      },
    }));
  }, [
    nodes,
    handleLabelChange,
    handleDataChange,
    handleAddBranch,
    handleAddSubnode,
    handleAddSibling,
    handleAddChild,
    handleAddMilestone,
    handleDeleteNode,
    handleToggleCollapse,
    handleHandleDoubleClick,
  ]);

  // Enriched edges with onDeleteEdge callback
  const enrichedEdges = useMemo(() => {
    return edges.map((edge) => ({
      ...edge,
      data: {
        ...edge.data,
        onDeleteEdge: handleDeleteEdge,
      },
    }));
  }, [edges, handleDeleteEdge]);

  // Drag-and-drop interactive edge connection between ANY two chosen handles
  const onConnect = useCallback(
    (params) => {
      const isFlowchart = activeTemplateId === 'flowchart-sketch';
      const isPastel = activeTemplateId === 'pastel-mindmap';
      const isCorp = activeTemplateId === 'corporate-org';
      const isMilestone = activeTemplateId === 'milestone-plane';

      let defaultStroke = '#1A1A1A';
      if (isPastel) defaultStroke = '#283A2E';
      if (isCorp) {
        const sourceNode = nodes.find((n) => n.id === params.source);
        defaultStroke = sourceNode?.data?.accentColor || '#888888';
      } else if (effectiveTheme === 'dark-studio' || effectiveTheme === 'dark-slate') {
        defaultStroke = '#F8FAFC';
      }

      const pathType = activeLineStyle.pathType || (isCorp ? 'step' : 'bezier');
      const isOrthogonal = pathType === 'step';
      const styleType = activeLineStyle.styleType || (isCorp ? 'dashed' : isPastel || isFlowchart || isMilestone ? 'solid-arrow' : 'dashed');
      const hasArrow = activeLineStyle.hasArrow !== undefined ? activeLineStyle.hasArrow : styleType.includes('arrow');
      const strokeWidth = activeLineStyle.strokeWidth || (isCorp ? 2 : isPastel || isMilestone ? 3.2 : 2.8);

      setEdges((eds) =>
        addEdge(
          {
            ...params,
            id: `e-${params.source}-${params.sourceHandle || 's'}-${params.target}-${params.targetHandle || 't'}_${Date.now()}`,
            type: 'sketch',
            data: {
              pathType,
              isOrthogonal,
              isCorp,
              styleType,
              hasArrow,
              strokeColor: defaultStroke,
              strokeWidth,
            },
          },
          eds
        )
      );
    },
    [activeTemplateId, nodes, activeLineStyle, effectiveTheme, setEdges]
  );

  const bgClass =
    effectiveTheme === 'dark-studio'
      ? 'sketchbook-dark-studio-bg'
      : effectiveTheme === 'light-studio'
      ? 'sketchbook-light-studio-bg'
      : effectiveTheme === 'dark-slate'
      ? 'sketchbook-dark-bg'
      : effectiveTheme === 'sunshine-yellow'
      ? 'sketchbook-yellow-bg'
      : effectiveTheme === 'grid'
      ? 'sketchbook-grid-bg'
      : effectiveTheme === 'pastel-cream'
      ? 'sketchbook-pastel-bg'
      : effectiveTheme === 'clean'
      ? 'sketchbook-clean-bg'
      : 'sketchbook-dark-studio-bg';

  // Connect to DiagramStudioStore
  const {
    setActiveTemplateId: setStoreTemplateId,
    setActiveThemeId: setStoreThemeId,
    pendingAction,
    clearPendingAction,
  } = useDiagramStudioStore();

  useEffect(() => {
    setStoreTemplateId(activeTemplateId);
  }, [activeTemplateId, setStoreTemplateId]);

  useEffect(() => {
    setStoreThemeId(effectiveTheme);
  }, [effectiveTheme, setStoreThemeId]);

  // Handle actions triggered from DiagramSidebar
  useEffect(() => {
    if (!pendingAction) return;

    switch (pendingAction.type) {
      case 'selectTemplate':
        handleSelectTemplate(pendingAction.payload);
        break;
      case 'changeTheme':
        handleChangeTheme(pendingAction.payload);
        break;
      case 'addShape':
        if (pendingAction.payload === 'milestoneNext') {
          handleAddMilestone();
        } else {
          handleAddShape(pendingAction.payload);
        }
        break;
      case 'addDoodle':
        handleSelectDoodle(pendingAction.payload);
        break;
      case 'autoLayout':
        handleAutoLayout();
        break;
      case 'exportPNG':
        handleExportPNG();
        break;
      case 'exportJSON':
        handleExportJSON();
        break;
      case 'importJSON':
        handleImportJSON(pendingAction.payload);
        break;
      case 'exportMD':
        handleExportMarkdown();
        break;
      case 'importMD':
        handleImportMarkdown(pendingAction.payload);
        break;
      default:
        break;
    }

    clearPendingAction();
  }, [
    pendingAction,
    handleSelectTemplate,
    handleChangeTheme,
    handleAddMilestone,
    handleAddShape,
    handleSelectDoodle,
    handleAutoLayout,
    handleExportPNG,
    handleExportJSON,
    handleImportJSON,
    handleExportMarkdown,
    handleImportMarkdown,
    clearPendingAction,
  ]);

  // Drag & drop shape handler onto canvas
  const onDragOver = useCallback((event) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'copy';
  }, []);

  const onDrop = useCallback(
    (event) => {
      event.preventDefault();
      event.stopPropagation();
      const doodleId = event.dataTransfer.getData('application/reactflow/doodleId');
      const shapeType = event.dataTransfer.getData('application/reactflow/type');
      if (!doodleId && !shapeType) return;

      let dropPos = { x: 100, y: 100 };
      if (screenToFlowPosition) {
        dropPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      } else if (project && reactFlowWrapper.current) {
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        dropPos = project({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });
      }

      if (doodleId) {
        handleSelectDoodle(doodleId, dropPos);
      } else if (shapeType === 'doodle') {
        handleSelectDoodle('net_01', dropPos);
      } else if (shapeType) {
        handleAddShape(shapeType, dropPos);
      }
    },
    [screenToFlowPosition, project, handleSelectDoodle, handleAddShape]
  );

  // Context Menu state
  const [contextMenu, setContextMenu] = useState(null);
  const contextMenuRef = useRef(null);

  const handlePaneContextMenu = useCallback(
    (event) => {
      event.preventDefault();
      let flowPos = { x: 0, y: 0 };
      if (screenToFlowPosition) {
        flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      } else if (project && reactFlowWrapper.current) {
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        flowPos = project({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });
      }

      const menuWidth = 210;
      const menuHeight = 260;
      const posX = event.clientX + menuWidth > window.innerWidth ? event.clientX - menuWidth : event.clientX;
      const posY = event.clientY + menuHeight > window.innerHeight ? event.clientY - menuHeight : event.clientY;

      setContextMenu({
        x: posX,
        y: posY,
        flowX: flowPos.x,
        flowY: flowPos.y,
        targetNode: null,
      });
    },
    [screenToFlowPosition, project]
  );

  const handleNodeContextMenu = useCallback(
    (event, node) => {
      event.preventDefault();
      event.stopPropagation();
      let flowPos = { x: 0, y: 0 };
      if (screenToFlowPosition) {
        flowPos = screenToFlowPosition({ x: event.clientX, y: event.clientY });
      } else if (project && reactFlowWrapper.current) {
        const bounds = reactFlowWrapper.current.getBoundingClientRect();
        flowPos = project({
          x: event.clientX - bounds.left,
          y: event.clientY - bounds.top,
        });
      }

      setNodes((nds) => nds.map((n) => ({ ...n, selected: n.id === node.id })));

      const menuWidth = 210;
      const menuHeight = 260;
      const posX = event.clientX + menuWidth > window.innerWidth ? event.clientX - menuWidth : event.clientX;
      const posY = event.clientY + menuHeight > window.innerHeight ? event.clientY - menuHeight : event.clientY;

      setContextMenu({
        x: posX,
        y: posY,
        flowX: flowPos.x,
        flowY: flowPos.y,
        targetNode: node,
      });
    },
    [screenToFlowPosition, project, setNodes]
  );

  // Close context menu on outside click or Escape
  useEffect(() => {
    const handleGlobalPointer = (e) => {
      if (contextMenuRef.current && !contextMenuRef.current.contains(e.target)) {
        setContextMenu(null);
      }
    };
    const handleGlobalKeyDown = (e) => {
      if (e.key === 'Escape') {
        setContextMenu(null);
      }
    };
    window.addEventListener('pointerdown', handleGlobalPointer);
    window.addEventListener('keydown', handleGlobalKeyDown);
    return () => {
      window.removeEventListener('pointerdown', handleGlobalPointer);
      window.removeEventListener('keydown', handleGlobalKeyDown);
    };
  }, []);

  // Deselect all on empty canvas click
  const onPaneClick = useCallback(() => {
    setContextMenu(null);
    setNodes((nds) => nds.map((n) => (n.selected ? { ...n, selected: false } : n)));
    setEdges((eds) => eds.map((e) => (e.selected ? { ...e, selected: false } : e)));
  }, [setNodes, setEdges]);

  // Quick Add Node helper
  const handleQuickAddNode = useCallback((customPosition = null) => {
    if (activeTemplateId === 'corporate-org') {
      handleAddShape('corpNode', customPosition);
    } else if (activeTemplateId === 'milestone-plane') {
      handleAddMilestone();
    } else if (activeTemplateId === 'pastel-mindmap') {
      handleAddShape('pastelSquircle', customPosition);
    } else if (activeTemplateId === 'flowchart-sketch') {
      handleAddShape('process', customPosition);
    } else {
      handleAddShape('branch', customPosition);
    }
  }, [activeTemplateId, handleAddShape, handleAddMilestone]);

  return (
    <div
      ref={reactFlowWrapper}
      className={`mindmap-app-container ${bgClass} ${className}`}
      style={{ position: 'relative', width: '100%', height: '100%', overflow: 'hidden', ...style }}
    >
      {/* Hidden File Input for Image Uploads */}
      <input
        type="file"
        ref={imageFileInputRef}
        accept="image/*"
        style={{ display: 'none' }}
        onChange={handleImageFileChange}
      />

      {/* Hidden SVG Filter for authentic organic hand-drawn displacement (self-contained) */}
      <svg style={{ position: 'absolute', width: 0, height: 0, overflow: 'hidden' }} aria-hidden="true">
        <defs>
          <filter id="hand-drawn-filter" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.04" numOctaves="3" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="2.2" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <filter id="hand-drawn-heavy" x="-10%" y="-10%" width="120%" height="120%">
            <feTurbulence type="fractalNoise" baseFrequency="0.035" numOctaves="4" result="noise" />
            <feDisplacementMap in="SourceGraphic" in2="noise" scale="3.6" xChannelSelector="R" yChannelSelector="G" />
          </filter>
          <marker id="sketch-arrow" viewBox="0 0 10 10" refX="6" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M 0 1.5 L 8 5 L 0 8.5 z" fill="#1e1e1e" />
          </marker>
        </defs>
      </svg>

      {/* 1. React Flow Canvas (Layer 1 - Background Canvas) */}
      <div
        style={{ width: '100%', height: '100%', position: 'absolute', inset: 0, zIndex: 1 }}
      >
        <ReactFlow
          nodes={enrichedNodes}
          edges={enrichedEdges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          onDragOver={onDragOver}
          onDrop={onDrop}
          onPaneClick={onPaneClick}
          onPaneContextMenu={handlePaneContextMenu}
          onNodeContextMenu={handleNodeContextMenu}
          nodeTypes={nodeTypes}
          edgeTypes={edgeTypes}
          snapToGrid={true}
          snapGrid={[15, 15]}
          selectionKeyCode={['Shift']}
          multiSelectionKeyCode={['Shift', 'Control', 'Meta']}
          selectionMode={SelectionMode.Partial}
          panOnDrag={true}
          selectionOnDrag={false}
          panOnScroll={false}
          zoomOnScroll={true}
          elementsSelectable={true}
          nodesDraggable={true}
          fitView
          fitViewOptions={{ padding: 0.55 }}
          minZoom={0.2}
          maxZoom={2.5}
          deleteKeyCode={['Backspace', 'Delete']}
          defaultEdgeOptions={{ type: 'sketch' }}
          connectionLineStyle={{
            stroke: activeTemplateId === 'corporate-org' ? '#3B82F6' : activeTemplateId === 'pastel-mindmap' ? '#283A2E' : '#1A1A1A',
            strokeWidth: 2.8,
            strokeDasharray: '4,4',
          }}
        >
          <Controls showInteractive={false} position="bottom-left" />
          {effectiveTheme === 'dark-studio' ? (
            <Background color="#1e293b" gap={26} size={1.2} />
          ) : effectiveTheme === 'light-studio' ? (
            <Background color="#cbd5e1" gap={26} size={1.2} />
          ) : effectiveTheme === 'grid' ? (
            <Background color="#dedbd0" gap={24} size={1} />
          ) : effectiveTheme === 'sunshine-yellow' ? (
            <Background color="#eab308" gap={32} size={1.2} />
          ) : effectiveTheme === 'pastel-cream' ? (
            <Background color="#ede8dd" gap={28} size={1.2} />
          ) : effectiveTheme === 'dark-slate' ? (
            <Background color="#3F3F46" gap={24} size={1} />
          ) : (
            <Background color="#1e293b" gap={26} size={1.2} />
          )}
        </ReactFlow>
      </div>

      {/* 2. Photoshop-style Vertical Right Toolbar (UI Overlay) */}
      <Toolbar
        title={title}
        setTitle={setTitle}
        activeTemplate={activeTemplate}
        activeTheme={effectiveTheme}
        onChangeTheme={handleChangeTheme}
        onSelectTemplate={handleSelectTemplate}
        selectedNode={selectedNode}
        selectedEdge={selectedEdge}
        onNodeColorChange={handleNodeColorChange}
        onEdgeColorChange={handleEdgeColorChange}
        onEdgeStyleChange={handleEdgeStyleChange}
        activeLineStyle={activeLineStyle}
        onAddText={handleAddText}
        onFontChange={handleFontChange}
        onSelectAll={handleSelectAll}
        onAddBranch={() => handleAddBranch(null, 'right')}
        onAddShape={handleAddShape}
        onToggleDoodles={() => setIsDoodlesOpen(!isDoodlesOpen)}
        isDoodlesOpen={isDoodlesOpen}
        onAutoLayout={handleAutoLayout}
        onExportJSON={handleExportJSON}
        onImportJSON={handleImportJSON}
        onExportPNG={handleExportPNG}
        onOpenHelp={() => setIsHelpOpen(true)}
      />

      {/* 3. Doodles Drawer Modal (Layer 3 - Highest Z-Index) */}
      <DoodleDrawer
        isOpen={isDoodlesOpen}
        onClose={() => setIsDoodlesOpen(false)}
        onSelectDoodle={handleSelectDoodle}
      />

      {/* 4. Help Modal */}
      <HelpModal
        isOpen={isHelpOpen}
        onClose={() => setIsHelpOpen(false)}
      />

      {/* 5. Minimal Compact Context Menu (Right-Click Menu) */}
      {contextMenu && (
        <div
          ref={contextMenuRef}
          style={{
            position: 'fixed',
            left: `${contextMenu.x}px`,
            top: `${contextMenu.y}px`,
            zIndex: 1000,
          }}
          className="animate-pop bg-[#1E1E24]/95 backdrop-blur-md border border-[#374151] rounded-xl shadow-2xl p-1.5 min-w-[205px] text-white select-none text-xs font-medium"
        >
          {contextMenu.targetNode ? (
            <>
              <button
                onClick={() => {
                  handleDuplicate();
                  setContextMenu(null);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-700/80 transition-colors text-right cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Copy size={13} className="text-blue-400" />
                  <span>تکثیر نود (Duplicate)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Ctrl+D</span>
              </button>

              <button
                onClick={() => {
                  handleCopy();
                  setContextMenu(null);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-700/80 transition-colors text-right cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Copy size={13} className="text-emerald-400" />
                  <span>کپی (Copy)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Ctrl+C</span>
              </button>

              <div className="h-[1px] bg-slate-700/60 my-1" />

              <button
                onClick={() => {
                  handleDeleteNode(contextMenu.targetNode.id);
                  setContextMenu(null);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-rose-500/20 text-rose-400 transition-colors text-right cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Trash2 size={13} />
                  <span>حذف (Delete)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Del</span>
              </button>
            </>
          ) : (
            <>
              {/* Add New Node */}
              <button
                onClick={() => {
                  handleQuickAddNode({ x: contextMenu.flowX, y: contextMenu.flowY });
                  setContextMenu(null);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-700/80 transition-colors text-right cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <PlusSquare size={13} className="text-emerald-400" />
                  <span className="font-semibold text-slate-100">نود جدید (+ Add Node)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Tab</span>
              </button>

              {/* Add Text */}
              <button
                onClick={() => {
                  handleAddText(latestTypography, { x: contextMenu.flowX, y: contextMenu.flowY });
                  setContextMenu(null);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-700/80 transition-colors text-right cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Type size={13} className="text-cyan-400" />
                  <span className="font-semibold text-slate-100">افزودن متن (+ Text)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">T</span>
              </button>

              {/* Upload Image */}
              <button
                onClick={() => {
                  uploadPositionRef.current = { x: contextMenu.flowX, y: contextMenu.flowY };
                  imageFileInputRef.current?.click();
                  setContextMenu(null);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-700/80 transition-colors text-right cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <ImageIcon size={13} className="text-amber-400" />
                  <span className="font-semibold text-slate-100">آپلود تصویر (+ Image)</span>
                </div>
                <Upload size={11} className="text-slate-400" />
              </button>

              <div className="h-[1px] bg-slate-700/60 my-1" />

              {/* Paste */}
              <button
                onClick={() => {
                  handlePaste();
                  setContextMenu(null);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-700/80 transition-colors text-right cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Clipboard size={13} className="text-indigo-400" />
                  <span>چسباندن (Paste)</span>
                </div>
                <span className="text-[10px] text-slate-400 font-mono">Ctrl+V</span>
              </button>

              {/* Auto Layout */}
              <button
                onClick={() => {
                  handleAutoLayout();
                  setContextMenu(null);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-700/80 transition-colors text-right cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Wand2 size={13} className="text-purple-400" />
                  <span>مرتب‌سازی خودکار (Auto Layout)</span>
                </div>
              </button>

              {/* Fit View */}
              <button
                onClick={() => {
                  fitView({ duration: 400, padding: 0.25 });
                  setContextMenu(null);
                }}
                className="w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg hover:bg-slate-700/80 transition-colors text-right cursor-pointer"
              >
                <div className="flex items-center gap-2">
                  <Maximize size={13} className="text-sky-400" />
                  <span>نمای کامل (Fit View)</span>
                </div>
              </button>
            </>
          )}
        </div>
      )}
    </div>
  );
}

export { DiagramCanvas };

export default function App(props) {
  return (
    <ReactFlowProvider>
      <DiagramCanvas {...props} />
    </ReactFlowProvider>
  );
}
