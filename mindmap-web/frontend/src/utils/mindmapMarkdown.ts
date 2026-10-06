import { MindNode, MindEdge, MindPage } from '../types';

/**
 * Trigger download of any text content (Markdown / JSON) as a file in the browser
 */
export function downloadFile(content: string, filename: string, mimeType: string = 'text/markdown;charset=utf-8') {
  const blob = new Blob([content], { type: mimeType });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

// ==========================================
// 1. MIND MAP (GRAPH) EXPORT & IMPORT
// ==========================================

export function exportMindmapToMarkdown(pageTitle: string, nodes: MindNode[], edges: MindEdge[]): string {
  const safeTitle = pageTitle || 'MindMap Knowledge Graph';
  let md = `# ${safeTitle}\n\n`;
  md += `> Exported from MindMap Studio on ${new Date().toLocaleDateString('fa-IR')}\n\n`;

  if (nodes.length === 0) {
    md += `*(No concepts found in this graph)*\n`;
    return md;
  }

  // Find incoming and outgoing edges
  const childMap = new Map<string, string[]>();
  const parentMap = new Map<string, string>();
  edges.forEach((e) => {
    if (!childMap.has(e.sourceNodeId)) {
      childMap.set(e.sourceNodeId, []);
    }
    childMap.get(e.sourceNodeId)!.push(e.targetNodeId);
    parentMap.set(e.targetNodeId, e.sourceNodeId);
  });

  // Identify root nodes (nodes without incoming edges)
  const rootNodes = nodes.filter((n) => !parentMap.has(n.id));
  const renderedNodes = new Set<string>();

  const renderNodeHierarchy = (nodeId: string, level: number = 0): string => {
    const node = nodes.find((n) => n.id === nodeId);
    if (!node) return '';
    renderedNodes.add(node.id);

    const indent = '  '.repeat(level);
    const tagsStr = Array.isArray(node.tags) && node.tags.length > 0 
      ? ` ${node.tags.map((t) => `#${t}`).join(' ')}` 
      : '';
    const importanceStr = node.importance > 5 ? ` ⭐${node.importance}` : '';
    
    let res = `${indent}- **${node.title}**${importanceStr}${tagsStr}\n`;

    if (node.note && node.note.trim()) {
      const noteLines = node.note.trim().split('\n');
      noteLines.forEach((line) => {
        res += `${indent}  > ${line}\n`;
      });
    }

    const children = childMap.get(nodeId) || [];
    children.forEach((childId) => {
      if (!renderedNodes.has(childId)) {
        res += renderNodeHierarchy(childId, level + 1);
      }
    });

    return res;
  };

  // Render root trees first
  rootNodes.forEach((root) => {
    md += renderNodeHierarchy(root.id, 0);
    md += '\n';
  });

  // Render any remaining disconnected nodes
  const unrendered = nodes.filter((n) => !renderedNodes.has(n.id));
  if (unrendered.length > 0) {
    md += `## Additional Concepts\n\n`;
    unrendered.forEach((node) => {
      md += renderNodeHierarchy(node.id, 0);
    });
  }

  return md;
}

export interface ParsedMindmapItem {
  id: string;
  title: string;
  note: string;
  tags: string[];
  importance: number;
  parentId: string | null;
  level: number;
}

/**
 * Parses markdown text into hierarchical mind map nodes and edges
 */
export function parseMarkdownToMindmap(markdownText: string): {
  title: string;
  items: ParsedMindmapItem[];
} {
  const lines = markdownText.split(/\r?\n/);
  let title = 'Imported MindMap';
  const items: ParsedMindmapItem[] = [];
  
  // Track hierarchy per indentation / heading level
  const stack: { id: string; level: number }[] = [];
  let currentItem: ParsedMindmapItem | null = null;
  let itemCounter = 1;

  for (let i = 0; i < lines.length; i++) {
    const rawLine = lines[i];
    const trimmed = rawLine.trim();
    if (!trimmed) continue;

    // Check for title: # Title
    if (trimmed.startsWith('# ') && !items.length) {
      title = trimmed.replace(/^#\s+/, '').trim();
      continue;
    }

    // Check for notes (blockquotes): > Note text
    if (trimmed.startsWith('>') && currentItem) {
      const noteText = trimmed.replace(/^>\s*/, '').trim();
      currentItem.note = currentItem.note ? `${currentItem.note}\n${noteText}` : noteText;
      continue;
    }

    // Check for Markdown list items (- , * , + , 1. ) or subheadings (## , ### )
    let lineLevel = 0;
    let textContent = '';

    if (/^#{2,6}\s+/.test(trimmed)) {
      const match = trimmed.match(/^(#{2,6})\s+(.*)$/);
      if (match) {
        lineLevel = match[1].length - 1; // ## is level 1, ### is level 2
        textContent = match[2].trim();
      }
    } else if (/^[\s]*[-*+]\s+/.test(rawLine) || /^[\s]*\d+\.\s+/.test(rawLine)) {
      const leadingSpaces = rawLine.match(/^(\s*)/)?.[1].length || 0;
      lineLevel = Math.floor(leadingSpaces / 2) + 1;
      textContent = trimmed.replace(/^[-*+]\s+/, '').replace(/^\d+\.\s+/, '').trim();
    } else {
      // Plain text line: append to current note or treat as node
      if (currentItem) {
        currentItem.note = currentItem.note ? `${currentItem.note}\n${trimmed}` : trimmed;
      }
      continue;
    }

    if (!textContent) continue;

    // Extract tags (#tag) and stars (⭐5 or Importance: 8)
    const tags: string[] = [];
    const tagMatches = textContent.match(/#([\w\u0600-\u06FF]+)/g);
    if (tagMatches) {
      tagMatches.forEach((t) => tags.push(t.replace('#', '')));
    }

    let importance = 5;
    const starMatch = textContent.match(/⭐\s*(\d+)/) || textContent.match(/Importance:\s*(\d+)/i);
    if (starMatch) {
      importance = Math.min(10, Math.max(1, parseInt(starMatch[1], 10)));
    }

    // Clean title
    const cleanTitle = textContent
      .replace(/#[\w\u0600-\u06FF]+/g, '')
      .replace(/⭐\s*\d+/g, '')
      .replace(/\(Importance:\s*\d+\)/gi, '')
      .replace(/^\*\*|\*\*$/g, '')
      .replace(/^__|\__$/g, '')
      .trim();

    // Determine parent from stack
    while (stack.length > 0 && stack[stack.length - 1].level >= lineLevel) {
      stack.pop();
    }

    const parentId = stack.length > 0 ? stack[stack.length - 1].id : null;
    const itemId = `imported_node_${Date.now()}_${itemCounter++}`;

    const newItem: ParsedMindmapItem = {
      id: itemId,
      title: cleanTitle || `Concept ${itemCounter}`,
      note: '',
      tags,
      importance,
      parentId,
      level: lineLevel,
    };

    items.push(newItem);
    currentItem = newItem;
    stack.push({ id: itemId, level: lineLevel });
  }

  return { title, items };
}

// ==========================================
// 2. DIAGRAM STUDIO EXPORT & IMPORT
// ==========================================

export function exportDiagramToMarkdown(
  title: string,
  templateId: string,
  themeId: string | null,
  nodes: any[],
  edges: any[]
): string {
  const safeTitle = title || 'Sketch Diagram';
  let md = `# ${safeTitle}\n\n`;
  md += `> **Diagram Studio Project** | Template: \`${templateId}\` | Theme: \`${themeId || 'default'}\`\n`;
  md += `> Export Date: ${new Date().toLocaleDateString('fa-IR')} ${new Date().toLocaleTimeString('fa-IR')}\n\n`;

  md += `## 📌 Diagram Elements (${nodes.length} Items)\n\n`;
  nodes.forEach((n, idx) => {
    const label = n.data?.label || n.data?.title || n.data?.name || n.type || `Node ${idx + 1}`;
    const cleanLabel = String(label).replace(/\n/g, ' ');
    md += `- **${cleanLabel}** (Type: \`${n.type}\`, Pos: \`[${Math.round(n.position?.x || 0)}, ${Math.round(n.position?.y || 0)}]\`)\n`;
    if (n.data?.desc) {
      md += `  > ${n.data.desc}\n`;
    }
    if (n.data?.role) {
      md += `  > Role: ${n.data.role}\n`;
    }
  });

  md += `\n## 🔗 Connectors (${edges.length} Links)\n\n`;
  edges.forEach((e) => {
    const sourceNode = nodes.find((n) => n.id === e.source);
    const targetNode = nodes.find((n) => n.id === e.target);
    const sLabel = sourceNode?.data?.label || sourceNode?.data?.title || e.source;
    const tLabel = targetNode?.data?.label || targetNode?.data?.title || e.target;
    const style = e.data?.styleType || e.type || 'solid';
    md += `- **${sLabel}** ➔ **${tLabel}** (\`${style}\`)\n`;
  });

  md += `\n## 💾 Full Diagram Model (Raw Spec)\n\n`;
  md += `\`\`\`json:sketch-diagram-data\n`;
  md += JSON.stringify(
    {
      title: safeTitle,
      templateId,
      themeId,
      nodes,
      edges,
      version: '2.0',
    },
    null,
    2
  );
  md += `\n\`\`\`\n`;

  return md;
}

export function parseMarkdownToDiagram(markdownText: string): {
  title: string;
  templateId?: string;
  themeId?: string;
  nodes: any[];
  edges: any[];
} | null {
  // 1. Check if raw JSON block exists
  const jsonMatch =
    markdownText.match(/```(?:json:sketch-diagram-data|json)\s*([\s\S]*?)\s*```/) ||
    markdownText.match(/\{[\s\S]*"nodes"[\s\S]*"edges"[\s\S]*\}/);

  if (jsonMatch) {
    try {
      const jsonStr = jsonMatch[1] || jsonMatch[0];
      const parsed = JSON.parse(jsonStr);
      if (Array.isArray(parsed.nodes)) {
        return {
          title: parsed.title || 'Imported Diagram',
          templateId: parsed.templateId || 'mindmap-sketch',
          themeId: parsed.themeId || 'grid',
          nodes: parsed.nodes,
          edges: parsed.edges || [],
        };
      }
    } catch (err) {
      console.warn('Failed to parse embedded diagram JSON, falling back to markdown list parser:', err);
    }
  }

  // 2. Parse standard markdown text as structured Mind Map Diagram nodes & edges
  const { title, items } = parseMarkdownToMindmap(markdownText);
  if (items.length === 0) return null;

  const nodes: any[] = [];
  const edges: any[] = [];

  // Root node
  const rootItem = items.find((i) => !i.parentId) || items[0];
  const rootNode = {
    id: rootItem.id,
    type: 'root',
    position: { x: 0, y: 0 },
    data: {
      label: rootItem.title,
      color: '#557A46',
    },
    selected: true,
  };
  nodes.push(rootNode);

  // Group child items into branches
  const branchItems = items.filter((i) => i.parentId === rootItem.id || (!i.parentId && i.id !== rootItem.id));
  const subItems = items.filter((i) => i.parentId && i.parentId !== rootItem.id);

  const totalBranches = Math.max(1, branchItems.length);
  branchItems.forEach((bItem, idx) => {
    const isRight = idx < Math.ceil(totalBranches / 2);
    const sideIdx = isRight ? idx : idx - Math.ceil(totalBranches / 2);
    const sideCount = isRight ? Math.ceil(totalBranches / 2) : totalBranches - Math.ceil(totalBranches / 2);
    const yOffset = (sideIdx - (sideCount - 1) / 2) * 160;
    const xOffset = isRight ? 320 : -320;

    const branchNode = {
      id: bItem.id,
      type: 'branch',
      position: { x: xOffset, y: yOffset },
      data: {
        label: bItem.title,
        color: '#557A46',
        collapsed: false,
        childCount: 0,
      },
    };
    nodes.push(branchNode);

    edges.push({
      id: `e-${rootNode.id}-${bItem.id}`,
      source: rootNode.id,
      target: bItem.id,
      sourceHandle: isRight ? 'source-right' : 'source-left',
      targetHandle: isRight ? 'target-left' : 'target-right',
      type: 'sketch',
      data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 3 },
    });
  });

  // Attach subnodes
  subItems.forEach((sItem, idx) => {
    const parentNode = nodes.find((n) => n.id === sItem.parentId) || nodes[1] || rootNode;
    const isRight = parentNode.position.x >= 0;
    const subX = parentNode.position.x + (isRight ? 240 : -240);
    const subY = parentNode.position.y + (idx % 3) * 60;

    const subNode = {
      id: sItem.id,
      type: 'subnode',
      position: { x: subX, y: subY },
      data: {
        label: sItem.title,
      },
    };
    nodes.push(subNode);

    edges.push({
      id: `e-${parentNode.id}-${sItem.id}`,
      source: parentNode.id,
      target: sItem.id,
      sourceHandle: isRight ? 'source-right' : 'source-left',
      targetHandle: isRight ? 'target-left' : 'target-right',
      type: 'sketch',
      data: { styleType: 'dashed', strokeColor: '#555555', strokeWidth: 1.8 },
    });
  });

  return {
    title,
    templateId: 'mindmap-sketch',
    themeId: 'grid',
    nodes,
    edges,
  };
}
