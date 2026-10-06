// Sketch utilities and layout helpers

export const generateId = (prefix = 'node') => {
  return `${prefix}_${Date.now()}_${Math.random().toString(36).substring(2, 7)}`;
};

/**
 * Transforms all nodes and edges to match the selected Theme with perfect readability and contrast
 */
export const applyThemeToDiagram = (themeId, nodes, edges) => {
  const isDarkStudio = themeId === 'dark-studio' || themeId === 'dark';
  const isLightStudio = themeId === 'light-studio';
  const isDark = themeId === 'dark-slate' || isDarkStudio;
  const isYellow = themeId === 'sunshine-yellow';
  const isGrid = themeId === 'grid';
  const isClean = themeId === 'clean' || isLightStudio;
  const isPastelTheme = themeId === 'pastel-cream';

  const updatedNodes = nodes.map((node) => {
    const data = { ...node.data };

    if (isDarkStudio) {
      // Main Studio Dark Mode Theme (#0B0F19 background)
      if (node.type === 'root') {
        data.bgColor = '#0F172A';
        data.borderColor = '#38BDF8';
        data.color = '#38BDF8';
        data.textColor = '#F8FAFC';
      } else if (node.type === 'branch') {
        data.bgColor = '#111827';
        data.borderColor = '#818CF8';
        data.color = '#818CF8';
        data.textColor = '#F8FAFC';
      } else if (node.type === 'subnode') {
        data.bgColor = '#1E293B';
        data.borderColor = '#38BDF8';
        data.textColor = '#F1F5F9';
      } else if (node.type === 'corpNode') {
        data.bgColor = '#0F172A';
        data.borderColor = '#334155';
        data.textColor = '#F8FAFC';
        data.accentColor = data.accentColor || '#38BDF8';
      } else if (node.type === 'pastelNode') {
        data.bgColor = '#1E293B';
        data.borderColor = '#64748B';
        data.textColor = '#F8FAFC';
      } else if (['process', 'decision', 'terminal', 'headerProcess'].includes(node.type)) {
        data.bgColor = '#0F172A';
        data.borderColor = '#38BDF8';
        data.textColor = '#F8FAFC';
      } else if (node.type === 'milestoneNode') {
        data.borderColor = '#38BDF8';
        data.color = '#38BDF8';
        data.textColor = '#F8FAFC';
      } else if (node.type === 'waypointNode') {
        data.borderColor = '#38BDF8';
        data.color = '#38BDF8';
      }
    } else if (isLightStudio) {
      // Main Studio Light Mode Theme (#F8FAFD background)
      if (node.type === 'root') {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#2563EB';
        data.color = '#2563EB';
        data.textColor = '#0B192C';
      } else if (node.type === 'branch' || node.type === 'subnode') {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#3B82F6';
        data.color = '#3B82F6';
        data.textColor = '#0B192C';
      } else if (node.type === 'corpNode') {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#CBD5E1';
        data.textColor = '#0B192C';
      } else if (node.type === 'pastelNode') {
        data.textColor = '#0B192C';
      } else if (['process', 'decision', 'terminal', 'headerProcess'].includes(node.type)) {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#1E293B';
        data.textColor = '#0B192C';
      } else if (node.type === 'milestoneNode') {
        data.borderColor = '#1E293B';
        data.color = '#1E293B';
        data.textColor = '#0B192C';
      } else if (node.type === 'waypointNode') {
        data.borderColor = '#1E293B';
        data.color = '#1E293B';
      }
    } else if (isDark) {
      // Dark Slate Theme (#18181B background)
      if (node.type === 'root') {
        data.bgColor = '#27272A';
        data.borderColor = '#38BDF8';
        data.color = '#38BDF8';
        data.textColor = '#F8FAFC';
      } else if (node.type === 'branch') {
        data.bgColor = '#27272A';
        data.borderColor = '#818CF8';
        data.color = '#818CF8';
        data.textColor = '#F8FAFC';
      } else if (node.type === 'subnode') {
        data.bgColor = '#1F2937';
        data.borderColor = '#60A5FA';
        data.textColor = '#F3F4F6';
      } else if (node.type === 'corpNode') {
        data.bgColor = '#27272A';
        data.borderColor = '#3F3F46';
        data.textColor = '#F8FAFC';
        data.accentColor = data.accentColor || '#38BDF8';
      } else if (node.type === 'pastelNode') {
        data.bgColor = '#334155';
        data.borderColor = '#94A3B8';
        data.textColor = '#F8FAFC';
      } else if (['process', 'decision', 'terminal', 'headerProcess'].includes(node.type)) {
        data.bgColor = '#27272A';
        data.borderColor = '#38BDF8';
        data.textColor = '#F8FAFC';
      } else if (node.type === 'milestoneNode') {
        data.borderColor = '#38BDF8';
        data.color = '#38BDF8';
        data.textColor = '#F8FAFC';
      } else if (node.type === 'waypointNode') {
        data.borderColor = '#38BDF8';
        data.color = '#38BDF8';
      }
    } else if (isYellow) {
      // Sunshine Yellow Theme (#FDCA2F background)
      if (node.type === 'root' || node.type === 'branch' || node.type === 'subnode') {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#1A1A1A';
        data.color = '#1A1A1A';
        data.textColor = '#1A1A1A';
      } else if (node.type === 'corpNode') {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#1A1A1A';
        data.textColor = '#111827';
      } else if (node.type === 'pastelNode') {
        data.textColor = '#1A1A1A';
        data.borderColor = '#1A1A1A';
      } else if (['process', 'decision', 'terminal', 'headerProcess'].includes(node.type)) {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#1A1A1A';
        data.textColor = '#1A1A1A';
      } else if (node.type === 'milestoneNode') {
        data.borderColor = '#1A1A1A';
        data.color = '#1A1A1A';
        data.textColor = '#1A1A1A';
      } else if (node.type === 'waypointNode') {
        data.borderColor = '#1A1A1A';
        data.color = '#1A1A1A';
      }
    } else if (isGrid) {
      // Graph Paper Grid Theme (#FAF9F5 background)
      if (node.type === 'root') {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#1E293B';
        data.color = '#1E293B';
        data.textColor = '#0F172A';
      } else if (node.type === 'branch' || node.type === 'subnode') {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#334155';
        data.color = '#334155';
        data.textColor = '#0F172A';
      } else if (node.type === 'corpNode') {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#CBD5E1';
        data.textColor = '#0F172A';
      } else if (node.type === 'pastelNode') {
        data.textColor = '#0F172A';
        data.borderColor = '#334155';
      } else if (['process', 'decision', 'terminal', 'headerProcess'].includes(node.type)) {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#1E293B';
        data.textColor = '#0F172A';
      } else if (node.type === 'milestoneNode') {
        data.borderColor = '#1E293B';
        data.color = '#1E293B';
        data.textColor = '#0F172A';
      } else if (node.type === 'waypointNode') {
        data.borderColor = '#1E293B';
        data.color = '#1E293B';
      }
    } else if (isClean) {
      // Clean Studio White Theme (#FFFFFF background)
      if (node.type === 'root') {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#2563EB';
        data.color = '#2563EB';
        data.textColor = '#1E293B';
      } else if (node.type === 'branch' || node.type === 'subnode') {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#3B82F6';
        data.color = '#3B82F6';
        data.textColor = '#1E293B';
      } else if (node.type === 'corpNode') {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#E2E8F0';
        data.textColor = '#0F172A';
      } else if (node.type === 'pastelNode') {
        data.textColor = '#1E293B';
      } else if (['process', 'decision', 'terminal', 'headerProcess'].includes(node.type)) {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#0F172A';
        data.textColor = '#0F172A';
      } else if (node.type === 'milestoneNode') {
        data.borderColor = '#0F172A';
        data.color = '#0F172A';
        data.textColor = '#0F172A';
      } else if (node.type === 'waypointNode') {
        data.borderColor = '#0F172A';
        data.color = '#0F172A';
      }
    } else if (isPastelTheme) {
      // Pastel Warm Cream Theme (#FFFDF8 background)
      if (node.type === 'root') {
        data.bgColor = '#FFAE9C';
        data.borderColor = '#2D4233';
        data.color = '#2D4233';
        data.textColor = '#2D3748';
      } else if (node.type === 'branch' || node.type === 'subnode') {
        data.bgColor = '#DEC8F9';
        data.borderColor = '#2D4233';
        data.color = '#2D4233';
        data.textColor = '#2D3748';
      } else if (node.type === 'corpNode') {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#E5E7EB';
        data.textColor = '#1F2937';
      } else if (node.type === 'pastelNode') {
        data.textColor = '#2D3748';
      } else if (['process', 'decision', 'terminal', 'headerProcess'].includes(node.type)) {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#283A2E';
        data.textColor = '#283A2E';
      } else if (node.type === 'milestoneNode') {
        data.borderColor = '#283A2E';
        data.color = '#283A2E';
        data.textColor = '#283A2E';
      } else if (node.type === 'waypointNode') {
        data.borderColor = '#283A2E';
        data.color = '#283A2E';
      }
    } else {
      // Parchment Vintage Theme (#FBFBF6 background)
      if (node.type === 'root') {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#1A1A1A';
        data.color = '#557A46';
        data.textColor = '#557A46';
      } else if (node.type === 'branch') {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#1A1A1A';
        data.color = '#557A46';
        data.textColor = '#557A46';
      } else if (node.type === 'subnode') {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#1A1A1A';
        data.textColor = '#1A1A1A';
      } else if (node.type === 'corpNode') {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#E5E7EB';
        data.textColor = '#111827';
      } else if (node.type === 'pastelNode') {
        data.textColor = '#2D3748';
      } else if (['process', 'decision', 'terminal', 'headerProcess'].includes(node.type)) {
        data.bgColor = '#FFFFFF';
        data.borderColor = '#1A1A1A';
        data.textColor = '#1A1A1A';
      } else if (node.type === 'milestoneNode') {
        data.borderColor = '#1A1A1A';
        data.color = '#1A1A1A';
        data.textColor = '#1A1A1A';
      } else if (node.type === 'waypointNode') {
        data.borderColor = '#1A1A1A';
        data.color = '#1A1A1A';
      }
    }

    return {
      ...node,
      data,
    };
  });

  const updatedEdges = edges.map((edge) => {
    let edgeStroke = '#1A1A1A';
    if (isDarkStudio) {
      edgeStroke = '#38BDF8';
    } else if (isDark) {
      edgeStroke = '#94A3B8';
    } else if (isLightStudio) {
      edgeStroke = '#3B82F6';
    } else if (isYellow) {
      edgeStroke = '#1A1A1A';
    } else if (isGrid) {
      edgeStroke = '#334155';
    } else if (isClean) {
      edgeStroke = '#475569';
    } else if (isPastelTheme) {
      edgeStroke = '#374151';
    }

    return {
      ...edge,
      data: {
        ...edge.data,
        strokeColor: edgeStroke,
      },
      style: {
        ...edge.style,
        stroke: edgeStroke,
      },
    };
  });

  return { nodes: updatedNodes, edges: updatedEdges };
};

/**
 * Calculates auto layout positions around a central node (similar to reference mindmap)
 */
export const calculateRadialMindmapLayout = (nodes, edges) => {
  const rootNode = nodes.find(n => n.type === 'root');
  if (!rootNode) return nodes;

  const rootX = rootNode.position.x;
  const rootY = rootNode.position.y;

  // Find direct branches from root
  const branchEdges = edges.filter(e => e.source === rootNode.id);
  const branchIds = branchEdges.map(e => e.target);
  const branchNodes = nodes.filter(n => branchIds.includes(n.id) && n.type === 'branch');

  const updatedNodes = [...nodes];

  // Radial angles or preset slots matching reference photo:
  // Slot 1: Top-Left (-135 deg or -280, -220)
  // Slot 2: Top-Right (-45 deg or 280, -220)
  // Slot 3: Mid-Right (0 deg or 420, 0)
  // Slot 4: Bottom-Center (90 deg or 0, 240)
  // Slot 5: Mid-Left (180 deg or -420, 0)

  const defaultSlots = [
    { x: -260, y: -200, align: 'left' },
    { x: 260, y: -200, align: 'right' },
    { x: 400, y: 30, align: 'right' },
    { x: -70, y: 240, align: 'center' },
    { x: -400, y: 30, align: 'left' },
    { x: 300, y: 240, align: 'right' },
    { x: -300, y: 240, align: 'left' },
  ];

  branchNodes.forEach((bNode, idx) => {
    const slot = defaultSlots[idx % defaultSlots.length];
    const bX = rootX + slot.x;
    const bY = rootY + slot.y;

    // Update branch node position
    const nodeIdx = updatedNodes.findIndex(n => n.id === bNode.id);
    if (nodeIdx !== -1) {
      updatedNodes[nodeIdx] = {
        ...updatedNodes[nodeIdx],
        position: { x: bX, y: bY },
      };
    }

    // Find children subnodes of this branch
    const subEdges = edges.filter(e => e.source === bNode.id);
    const subIds = subEdges.map(e => e.target);
    const subNodes = nodes.filter(n => subIds.includes(n.id) && n.type === 'subnode');

    const isRightSide = slot.x >= 0;
    const isTop = slot.y < 0;

    subNodes.forEach((sNode, sIdx) => {
      const sNodeIdx = updatedNodes.findIndex(n => n.id === sNode.id);
      if (sNodeIdx !== -1) {
        let subX = bX + (isRightSide ? 220 : -220);
        let subY = bY + (sIdx - (subNodes.length - 1) / 2) * 55;

        // Special adjustment for top or bottom branches
        if (Math.abs(slot.x) < 100) {
          subX = bX + 220;
          subY = bY + (sIdx - 1) * 55;
        }

        updatedNodes[sNodeIdx] = {
          ...updatedNodes[sNodeIdx],
          position: { x: subX, y: subY },
        };
      }
    });
  });

  return updatedNodes;
};

/**
 * Calculates strict orthogonal column grid alignment for Corporate Organization Chart
 */
export const calculateCorporateOrgLayout = (nodes, edges) => {
  const ceoNode = nodes.find(n => n.type === 'corpNode' && (n.data?.isCeo || n.id === 'corp-ceo')) || nodes[0];
  if (!ceoNode) return nodes;

  const updatedNodes = [...nodes];

  // Find department heads (nodes directly connected from CEO)
  const headEdges = edges.filter(e => e.source === ceoNode.id);
  const headIds = headEdges.map(e => e.target);
  const headNodes = nodes.filter(n => headIds.includes(n.id) && n.id !== ceoNode.id);

  const numCols = Math.max(headNodes.length, 1);
  const colWidth = 270;
  const startX = -((numCols - 1) * colWidth) / 2;

  // Align CEO centered at top
  const ceoIdx = updatedNodes.findIndex(n => n.id === ceoNode.id);
  if (ceoIdx !== -1) {
    updatedNodes[ceoIdx] = {
      ...updatedNodes[ceoIdx],
      position: { x: -115, y: -200 },
    };
  }

  // Align each column
  headNodes.forEach((hNode, colIdx) => {
    const colX = startX + colIdx * colWidth;
    const headY = -40;

    // Update head position
    const hIdx = updatedNodes.findIndex(n => n.id === hNode.id);
    if (hIdx !== -1) {
      updatedNodes[hIdx] = {
        ...updatedNodes[hIdx],
        position: { x: colX, y: headY },
      };
    }

    // Find subnodes under this head
    const subEdges = edges.filter(e => e.source === hNode.id);
    const subIds = subEdges.map(e => e.target);
    const subNodes = nodes.filter(n => subIds.includes(n.id) && n.id !== ceoNode.id && n.id !== hNode.id);

    subNodes.forEach((sNode, sIdx) => {
      const sIdxInAll = updatedNodes.findIndex(n => n.id === sNode.id);
      if (sIdxInAll !== -1) {
        updatedNodes[sIdxInAll] = {
          ...updatedNodes[sIdxInAll],
          position: { x: colX, y: headY + 115 * (sIdx + 1) },
        };
      }
    });
  });

  return updatedNodes;
};

/**
 * Hand-drawn SVG doodle paths & presets categorized into Network, General, and Doodles
 */
export const DOODLE_PRESETS = [
  // ================= 1. NETWORK & CLOUD STICKERS (Extracted directly from user uploaded sheets) =================
  // Sheet 1: 30 Icons
  { id: 'net_01', name: 'Server Stack', nameFa: 'کیس و رک سرور', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_01.png' },
  { id: 'net_02', name: 'Workstation PC', nameFa: 'کامپیوتر و کیبورد', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_02.png' },
  { id: 'net_03', name: 'Code Monitor', nameFa: 'کنسول کد مانیتور', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_03.png' },
  { id: 'net_04', name: 'Server Unit', nameFa: 'رک سرور متصل', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_04.png' },
  { id: 'net_05', name: 'Process Gears', nameFa: 'مانیتورینگ و پردازش', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_05.png' },
  { id: 'net_06', name: 'Antenna Tower', nameFa: 'دکل مخابراتی', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_06.png' },
  { id: 'net_07', name: 'Multi-Tier Server', nameFa: 'سرور چندطبقه', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_07.png' },
  { id: 'net_08', name: 'LAN Topology', nameFa: 'شبکه محلی LAN', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_08.png' },
  { id: 'net_09', name: 'HDD Drive', nameFa: 'هارد دیسک HDD', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_09.png' },
  { id: 'net_10', name: 'User Profile', nameFa: 'پروفایل کاربر وب', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_10.png' },
  { id: 'net_11', name: 'Matrix Display', nameFa: 'نمایشگر ماتریکس', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_11.png' },
  { id: 'net_12', name: 'Web Schedule', nameFa: 'زمان‌بندی و لاگ', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_12.png' },
  { id: 'net_13', name: 'Process Flow', nameFa: 'فلوچارت وب', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_13.png' },
  { id: 'net_14', name: 'Secure Screen', nameFa: 'سیستم امن با قفل', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_14.png' },
  { id: 'net_15', name: 'Login Form', nameFa: 'فرم لاگین و پسورد', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_15.png' },
  { id: 'net_16', name: 'CPU Microchip', nameFa: 'پردازنده و چیپست', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_16.png' },
  { id: 'net_17', name: 'Database Gear', nameFa: 'دیتابیس و تنظیمات', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_17.png' },
  { id: 'net_18', name: 'System Repair', nameFa: 'تعمیر و نگهداری', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_18.png' },
  { id: 'net_19', name: 'Cloud Screen', nameFa: 'مانیتورینگ ابری', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_19.png' },
  { id: 'net_20', name: 'Security Hacker', nameFa: 'امنیت و ضد هک', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_20.png' },
  { id: 'net_21', name: 'Firewall', nameFa: 'فایروال دیوار آتش', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_21.png' },
  { id: 'net_22', name: 'Database Shield', nameFa: 'دیتابیس امن و محافظت‌شده', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_22.png' },
  { id: 'net_23', name: 'Wi-Fi Router', nameFa: 'مودم و روتر بی‌سیم', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_23.png' },
  { id: 'net_24', name: 'Data Filter', nameFa: 'قیف و فیلتر داده', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_24.png' },
  { id: 'net_25', name: 'Multi Router', nameFa: 'روتر چندآنتنه', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_25.png' },
  { id: 'net_26', name: 'AI Neural Core', nameFa: 'مغز و مدار هوش مصنوعی', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_26.png' },
  { id: 'net_27', name: 'Global Network', nameFa: 'شبکه جهانی اینترنت', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_27.png' },
  { id: 'net_28', name: 'Shared Folder', nameFa: 'پوشه اشتراکی شبکه', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_28.png' },
  { id: 'net_29', name: 'Cloud Node', nameFa: 'ابر متصل به گره‌ها', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_29.png' },
  { id: 'net_30', name: 'Satellite', nameFa: 'ماهواره مخابراتی', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/net_icon_30.png' },

  // Sheet 2: 12 Cloud Technology Icons
  { id: 'cloud_01', name: 'Cloud Display', nameFa: 'سرور کلود مانیتور', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/cloud_icon_01.png' },
  { id: 'cloud_02', name: 'Mobile Notification', nameFa: 'پیام و اعلان موبایل', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/cloud_icon_02.png' },
  { id: 'cloud_03', name: 'Server Tower Pair', nameFa: 'برج دیتاسنتر ابری', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/cloud_icon_03.png' },
  { id: 'cloud_04', name: 'Code Script Screen', nameFa: 'اسکریپت و لاگ سرور', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/cloud_icon_04.png' },
  { id: 'cloud_05', name: 'Rack Bus', nameFa: 'باس ارتباطی رک', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/cloud_icon_05.png' },
  { id: 'cloud_06', name: 'Database Engine', nameFa: 'موتور پایگاه داده', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/cloud_icon_06.png' },
  { id: 'cloud_07', name: 'Network Storage', nameFa: 'فضای ذخیره‌سازی شبکه', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/cloud_icon_07.png' },
  { id: 'cloud_08', name: 'Mobile Cloud App', nameFa: 'اپلیکیشن ابری موبایل', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/cloud_icon_08.png' },
  { id: 'cloud_09', name: 'DB Refresh', nameFa: 'همگام‌سازی دیتابیس', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/cloud_icon_09.png' },
  { id: 'cloud_10', name: 'Cloud Download', nameFa: 'دانلود از فضای ابری', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/cloud_icon_10.png' },
  { id: 'cloud_11', name: 'Cloud Server Enclosure', nameFa: 'سرور مستقر در ابر', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/cloud_icon_11.png' },
  { id: 'cloud_12', name: 'Cloud Upload', nameFa: 'آپلود به فضای ابری', category: 'Network', width: 80, height: 80, imgUrl: '/stickers/network/cloud_icon_12.png' },

    // ================= 2. GENERAL STICKERS & ICONS (Extracted from sheet) =================
  { id: 'gen_monitor_sketch', name: 'Monitor Sketch', nameFa: 'مانیتور و طرح صفحه', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_monitor_sketch.png' },
  { id: 'gen_smartphone_app', name: 'Mobile Phone Hand', nameFa: 'موبایل در دست', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_smartphone_app.png' },
  { id: 'gen_coffee_cup', name: 'Hot Coffee Mug', nameFa: 'فنجان قهوه داغ', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_coffee_cup.png' },
  { id: 'gen_paint_brush', name: 'Paint Brush', nameFa: 'قلم‌مو و نقاشی', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_paint_brush.png' },
  { id: 'gen_speech_bubble_hatch', name: 'Chat Bubble Hatch', nameFa: 'حباب گفت‌وگوی هاشور', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_speech_bubble_hatch.png' },
  { id: 'gen_pencil_idea', name: 'Pencil Idea', nameFa: 'مداد و ایده', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_pencil_idea.png' },
  { id: 'gen_growth_bars', name: 'Bar Chart Arrow', nameFa: 'نمودار میله‌ای رشد', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_growth_bars.png' },
  { id: 'gen_alarm_clock', name: 'Alarm Clock', nameFa: 'ساعت زنگ‌دار', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_alarm_clock.png' },
  { id: 'gen_magnifying_glass', name: 'Magnifying Glass', nameFa: 'ذره‌بین و جستجو', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_magnifying_glass.png' },
  { id: 'gen_megaphone', name: 'Megaphone Loudspeaker', nameFa: 'بلندگو و اعلان', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_megaphone.png' },
  { id: 'gen_business_briefcase', name: 'Business Plan Case', nameFa: 'کیف اداری و پلن', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_business_briefcase.png' },
  { id: 'gen_pencils_holder', name: 'Pencil Stand Chart', nameFa: 'جامدادی و نمودار مدادها', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_pencils_holder.png' },
  { id: 'gen_mini_chat_cloud', name: 'Mini Chat Cloud', nameFa: 'ابر پیام کوچک', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_mini_chat_cloud.png' },
  { id: 'gen_big_idea_text', name: 'Big Idea Sketch', nameFa: 'طرح ایده بزرگ', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_big_idea_text.png' },
  { id: 'gen_pie_abcd', name: 'Pie Chart ABCD', nameFa: 'نمودار دایره‌ای دسته‌ها', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_pie_abcd.png' },
  { id: 'gen_rocket_launch', name: 'Rocket Startup', nameFa: 'موشک استارتاپ', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_rocket_launch.png' },
  { id: 'gen_coffee_topview', name: 'Coffee Top View', nameFa: 'قهوه از نمای بالا', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_coffee_topview.png' },
  { id: 'gen_study_grad_cap', name: 'Study Graduation Cap', nameFa: 'کلاه فارغ‌التحصیلی و مطالعه', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_study_grad_cap.png' },
  { id: 'gen_speaker_horn', name: 'Speaker Horn', nameFa: 'شیپور و بوق تبلیغات', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_speaker_horn.png' },
  { id: 'gen_idea_cloud_outline', name: 'Idea Cloud Outline', nameFa: 'ابر افکار توخالی', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_idea_cloud_outline.png' },
  { id: 'gen_laptop_computer', name: 'Laptop Computer', nameFa: 'لپ‌تاپ و رایانه', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_laptop_computer.png' },
  { id: 'gen_id_card_badge', name: 'ID Card Badge', nameFa: 'کارت شناسایی و پرسنلی', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_id_card_badge.png' },
  { id: 'gen_step_growth_chart', name: 'Growth Step Stairs', nameFa: 'پلکان و نمودار صعودی', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_step_growth_chart.png' },
  { id: 'gen_cloud_download_arrow', name: 'Cloud Download Arrow', nameFa: 'ابر و فلش دانلود', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_cloud_download_arrow.png' },
  { id: 'gen_wave_graph_analysis', name: 'Wave Graph Analysis', nameFa: 'نمودار موج و نوسان', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_wave_graph_analysis.png' },
  { id: 'gen_city_buildings', name: 'City Skyline Buildings', nameFa: 'ساختمان‌ها و شهر', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_city_buildings.png' },
  { id: 'gen_line_graph_points', name: 'Multi Point Line Graph', nameFa: 'نمودار خطی نقاط', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_line_graph_points.png' },
  { id: 'gen_paper_plane', name: 'Paper Airplane', nameFa: 'موشک کاغذی', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_paper_plane.png' },
  { id: 'gen_lightbulb_head_idea', name: 'Idea Person Lightbulb', nameFa: 'آدمک سرلامپی و تفکر', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_lightbulb_head_idea.png' },
  { id: 'gen_robot_vr_headset', name: 'VR Vision / Gadget', nameFa: 'عینک واقعیت مجازی / گجت', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_robot_vr_headset.png' },
  { id: 'gen_credit_card_chip', name: 'Credit Card Payment', nameFa: 'کارت اعتباری پرداخت', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_credit_card_chip.png' },
  { id: 'gen_mail_envelope_post', name: 'Mail Post Envelope', nameFa: 'نامه و پاکت پستی', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_mail_envelope_post.png' },
  { id: 'gen_classic_lightbulb', name: 'Classic Lightbulb Bulb', nameFa: 'لامپ کلاسیک خلاقیت', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_classic_lightbulb.png' },
  { id: 'gen_email_at_envelope', name: 'Email Envelope At', nameFa: 'ایمیل و پیام الکترونیکی', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_email_at_envelope.png' },
  { id: 'gen_vertical_speech_pill', name: 'Vertical Speech Pill', nameFa: 'کپسول عمودی پیام', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_vertical_speech_pill.png' },
  { id: 'gen_growth_arrow_stairs', name: 'Growth Steps 123', nameFa: 'مسیر رشد و شماره‌گذاری', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_growth_arrow_stairs.png' },
  { id: 'gen_video_camera_cinema', name: 'Cinema Film Camera', nameFa: 'دوربین فیلمبرداری سینمایی', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_video_camera_cinema.png' },
  { id: 'gen_scroll_diploma', name: 'Parchment Diploma Scroll', nameFa: 'طومار مدرک و گواهینامه', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_scroll_diploma.png' },
  { id: 'gen_movie_clapperboard', name: 'Movie Clapperboard', nameFa: 'کلاکت فیلم و برنامه‌ریزی', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_movie_clapperboard.png' },
  { id: 'gen_open_book_tree', name: 'Open Book Tree of Knowledge', nameFa: 'کتاب باز و درخت دانش', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_open_book_tree.png' },
  { id: 'gen_wave_chart_sine', name: 'Wave Frequency Graph', nameFa: 'نمودار سینوسی و فرکانس', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_wave_chart_sine.png' },
  { id: 'gen_curved_arrow_right', name: '3D Directional Arrow', nameFa: 'فلش راهنمای سه‌بعدی', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_curved_arrow_right.png' },
  { id: 'gen_upward_bar_growth', name: 'Trending Up Bar Chart', nameFa: 'نمودار میله‌ای رشد پرشتاب', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_upward_bar_growth.png' },
  { id: 'gen_money_bag_coins', name: 'Money Bag Dollar Coins', nameFa: 'کیسه دلار و سکه‌های طلا', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_money_bag_coins.png' },
  { id: 'gen_organic_leaves_plant', name: 'Organic Green Leaves', nameFa: 'برگ‌های گیاه و رشد ارگانیک', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_organic_leaves_plant.png' },
  { id: 'gen_clipboard_checklist', name: 'Clipboard Checklist Tasks', nameFa: 'تخته‌شاسی و وظایف', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_clipboard_checklist.png' },
  { id: 'gen_cloud_hatch_data', name: 'Cloud Hatch Data', nameFa: 'ابر و هاشور داده', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_cloud_hatch_data.png' },
  { id: 'gen_3d_pie_chart_slice', name: '3D Pie Chart Segment', nameFa: 'نمودار دایره‌ای قطاع‌بندی', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_3d_pie_chart_slice.png' },
  { id: 'gen_venn_diagram_abc', name: 'Venn Diagram Set ABC', nameFa: 'نمودار ون و همپوشانی', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_venn_diagram_abc.png' },
  { id: 'gen_mini_calculator', name: 'Calculator Numeric', nameFa: 'ماشین‌حساب و محاسبات', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_mini_calculator.png' },
  { id: 'gen_delivery_truck', name: 'Delivery Truck Shipping', nameFa: 'کامیون حمل و لجستیک', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_delivery_truck.png' },
  { id: 'gen_security_padlock', name: 'Security Padlock Key', nameFa: 'قفل امنیتی و حفاظت', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_security_padlock.png' },
  { id: 'gen_3d_circular_wheel', name: '3D Target Wheel Chart', nameFa: 'نمودار چرخ دایره‌ای سه بعدی', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_3d_circular_wheel.png' },
  { id: 'gen_battery_charge_bolt', name: 'Battery Energy Bolt', nameFa: 'باتری و شارژ انرژی', category: 'General', width: 80, height: 80, imgUrl: '/stickers/general/gen_battery_charge_bolt.png' },
  // ================= 3. DOODLES & ACCENTS =================
  // Hand-Drawn Sketch Arrows (Extracted from user uploaded sheet)
  { id: 'doodle_arrow_3d_up_right', name: '3D Isometric Arrow (Up-Right)', nameFa: 'فلش سه‌بعدی رو به بالا و راست', category: 'Doodles', width: 80, height: 80, imgUrl: '/stickers/doodles/doodle_arrow_3d_up_right.png' },
  { id: 'doodle_arrow_target_pin', name: 'Target Pin Up Arrow', nameFa: 'فلش سنجاقی نقطه‌ای رو به بالا', category: 'Doodles', width: 80, height: 80, imgUrl: '/stickers/doodles/doodle_arrow_target_pin.png' },
  { id: 'doodle_arrow_diagonal_sharp', name: 'Sharp Diagonal Arrow', nameFa: 'فلش تیز قطری رو به بالا', category: 'Doodles', width: 80, height: 80, imgUrl: '/stickers/doodles/doodle_arrow_diagonal_sharp.png' },
  { id: 'doodle_arrow_smooth_arc', name: 'Smooth Sweeping Arc Arrow', nameFa: 'فلش قوسی نرم به سمت راست', category: 'Doodles', width: 80, height: 80, imgUrl: '/stickers/doodles/doodle_arrow_smooth_arc.png' },
  { id: 'doodle_arrow_circle_loop', name: 'Circular Return Loop Arrow', nameFa: 'فلش دایره‌ای دوربرگردان', category: 'Doodles', width: 80, height: 80, imgUrl: '/stickers/doodles/doodle_arrow_circle_loop.png' },
  { id: 'doodle_arrow_elbow_right', name: '90° Corner Elbow Arrow', nameFa: 'فلش گوشه‌دار ۹۰ درجه به راست', category: 'Doodles', width: 80, height: 80, imgUrl: '/stickers/doodles/doodle_arrow_elbow_right.png' },
  { id: 'doodle_arrow_ribbon_right', name: 'Ribbon Banner Arrow', nameFa: 'فلش روبانی به سمت راست', category: 'Doodles', width: 80, height: 80, imgUrl: '/stickers/doodles/doodle_arrow_ribbon_right.png' },
  { id: 'doodle_arrow_spiral_curve', name: 'Spiral Hook Curve Arrow', nameFa: 'فلش قلاب مارپیچ', category: 'Doodles', width: 80, height: 80, imgUrl: '/stickers/doodles/doodle_arrow_spiral_curve.png' },
  { id: 'doodle_arrow_zigzag_growth', name: 'Zigzag Growth Trend Arrow', nameFa: 'فلش زیگزاگ رشد صعودی', category: 'Doodles', width: 80, height: 80, imgUrl: '/stickers/doodles/doodle_arrow_zigzag_growth.png' },
  { id: 'doodle_arrow_wide_down', name: 'Wide Flare Down Arrow', nameFa: 'فلش پهن رو به پایین', category: 'Doodles', width: 80, height: 80, imgUrl: '/stickers/doodles/doodle_arrow_wide_down.png' },
  { id: 'doodle_arrow_3d_arc_up', name: '3D Arc Curve Arrow', nameFa: 'فلش کمانی سه‌بعدی صعودی', category: 'Doodles', width: 80, height: 80, imgUrl: '/stickers/doodles/doodle_arrow_3d_arc_up.png' },
  { id: 'doodle_arrow_loop_swirl', name: 'Loop Swirl Ribbon Arrow', nameFa: 'فلش حلقه‌ای مارپیچی', category: 'Doodles', width: 80, height: 80, imgUrl: '/stickers/doodles/doodle_arrow_loop_swirl.png' },
  { id: 'doodle_arrow_u_turn_left', name: 'U-Turn Return Arrow', nameFa: 'فلش دوربرگردان U شکل به چپ', category: 'Doodles', width: 80, height: 80, imgUrl: '/stickers/doodles/doodle_arrow_u_turn_left.png' },
  { id: 'doodle_arrow_straight_up', name: 'Straight Vertical Up Arrow', nameFa: 'فلش مستقیم عمودی رو به بالا', category: 'Doodles', width: 80, height: 80, imgUrl: '/stickers/doodles/doodle_arrow_straight_up.png' },
  { id: 'doodle_arrow_sharp_down_right', name: 'Sharp Slanted Arrow (Down-Right)', nameFa: 'فلش زاویه‌دار رو به پایین و راست', category: 'Doodles', width: 80, height: 80, imgUrl: '/stickers/doodles/doodle_arrow_sharp_down_right.png' },
  { id: 'doodle_arrow_arc_pin_point', name: 'Pin Dot Arc Arrow', nameFa: 'فلش قوسی با نقطه اتصال', category: 'Doodles', width: 80, height: 80, imgUrl: '/stickers/doodles/doodle_arrow_arc_pin_point.png' },

  {
    id: 'doodle_star',
    name: 'Doodle Star',
    nameFa: 'ستاره دست‌نویس',
    category: 'Doodles',
    width: 45,
    height: 45,
    svg: `<svg viewBox="0 0 50 50" fill="#FEF08A" stroke="#1A1A1A" stroke-width="2.5" stroke-linejoin="round" stroke-linecap="round">
      <path d="M25 4 L30 18 L45 19 L33 29 L37 44 L25 35 L12 44 L17 29 L5 19 L20 18 Z" />
    </svg>`,
  },
  {
    id: 'doodle_curly_loop',
    name: 'Curly Loop (eeee)',
    nameFa: 'حلقه فنری تزئینی',
    category: 'Doodles',
    width: 90,
    height: 35,
    svg: `<svg viewBox="0 0 100 40" fill="none" stroke="#1A1A1A" stroke-width="2.5" stroke-linecap="round" stroke-linejoin="round">
      <path d="M5 25 C15 5 25 5 25 22 C25 35 12 32 20 20 C28 5 40 5 42 22 C44 35 32 32 40 20 C48 5 60 5 62 22 C64 35 52 32 60 20 C68 5 80 5 82 22 C84 35 72 32 80 20 C88 8 98 12 95 25" />
    </svg>`,
  },
  {
    id: 'doodle_arrow_curved_up',
    name: 'Curved Arrow (Up)',
    nameFa: 'فلش خمیده رو به بالا',
    category: 'Doodles',
    width: 60,
    height: 60,
    svg: `<svg viewBox="0 0 60 60" fill="none" stroke="#1A1A1A" stroke-width="2.8" stroke-linecap="round">
      <path d="M 12 48 C 22 45 34 35 32 14" />
      <path d="M 22 20 L 32 14 L 38 24" />
    </svg>`,
  },
  {
    id: 'doodle_arrow_curved_left',
    name: 'Curved Arrow (Left)',
    nameFa: 'فلش خمیده رو به چپ',
    category: 'Doodles',
    width: 60,
    height: 45,
    svg: `<svg viewBox="0 0 60 45" fill="none" stroke="#1A1A1A" stroke-width="2.8" stroke-linecap="round">
      <path d="M 48 20 C 35 20 24 25 12 32" />
      <path d="M 22 22 L 12 32 L 20 40" />
    </svg>`,
  },
  {
    id: 'doodle_green_hatch',
    name: 'Green Scribble / Hatch',
    nameFa: 'هاشور و خطوط تأکید',
    category: 'Doodles',
    width: 60,
    height: 30,
    svg: `<svg viewBox="0 0 70 35" fill="none" stroke="#557A46" stroke-width="3" stroke-linecap="round">
      <path d="M 8 28 L 22 8 M 20 28 L 34 8 M 32 28 L 46 8 M 44 28 L 58 8" />
    </svg>`,
  },
  {
    id: 'doodle_sparkles',
    name: 'Magic Sparkles',
    nameFa: 'جرقه و درخشش',
    category: 'Doodles',
    width: 50,
    height: 50,
    svg: `<svg viewBox="0 0 50 50" fill="none" stroke="#F59E0B" stroke-width="2.4" stroke-linecap="round">
      <path d="M 25 8 Q 25 25 42 25 Q 25 25 25 42 Q 25 25 8 25 Q 25 25 25 8 Z" fill="#FEF08A" />
      <circle cx="10" cy="10" r="1.5" fill="#F59E0B" />
      <circle cx="40" cy="40" r="2" fill="#F59E0B" />
    </svg>`,
  },
  {
    id: 'doodle_speech_bubble',
    name: 'Thought Bubble',
    nameFa: 'حباب فکر و دیالوگ',
    category: 'Doodles',
    width: 65,
    height: 55,
    svg: `<svg viewBox="0 0 65 55" fill="#FFFFFF" stroke="#1A1A1A" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round">
      <path d="M 10 14 C 10 8 18 6 32 6 C 46 6 54 8 54 18 C 54 28 46 32 32 32 C 26 32 20 33 14 38 L 16 31 C 12 28 10 22 10 14 Z" />
      <line x1="20" y1="16" x2="44" y2="16" stroke="#94A3B8" stroke-width="2" stroke-dasharray="3 2" />
      <line x1="20" y1="22" x2="36" y2="22" stroke="#94A3B8" stroke-width="2" stroke-dasharray="3 2" />
    </svg>`,
  },
  {
    id: 'doodle_corner_left',
    name: 'Corner Frame Left',
    nameFa: 'کادر تزئینی گوشه چپ',
    category: 'Doodles',
    width: 75,
    height: 75,
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="#557A46" stroke-linecap="round">
      <path d="M 5 95 C 10 65 5 40 25 25 C 45 10 70 15 95 5" stroke-width="5" />
      <path d="M 12 98 C 18 72 15 50 32 36 C 50 20 78 22 98 12" stroke-width="2.5" stroke-dasharray="3 5" />
      <circle cx="45" cy="30" r="2" fill="#557A46" />
      <circle cx="75" cy="15" r="2.5" fill="#557A46" />
    </svg>`,
  },
  {
    id: 'doodle_corner_right',
    name: 'Corner Frame Right',
    nameFa: 'کادر تزئینی گوشه راست',
    category: 'Doodles',
    width: 75,
    height: 75,
    svg: `<svg viewBox="0 0 100 100" fill="none" stroke="#557A46" stroke-linecap="round">
      <path d="M 95 95 C 90 65 95 40 75 25 C 55 10 30 15 5 5" stroke-width="5" />
      <path d="M 88 98 C 82 72 85 50 68 36 C 50 20 22 22 2 12" stroke-width="2.5" stroke-dasharray="3 5" />
      <circle cx="55" cy="30" r="2" fill="#557A46" />
      <circle cx="25" cy="15" r="2.5" fill="#557A46" />
    </svg>`,
  },
];
