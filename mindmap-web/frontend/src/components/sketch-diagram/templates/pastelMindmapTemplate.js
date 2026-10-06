// Pastel Mind Map Template (Soft Organic Pastel Colors & Shapes)

export const pastelNodes = [
  // 1. Central Root Node (Lavender Lilac)
  {
    id: 'pastel-root',
    type: 'pastelNode',
    position: { x: -85, y: -50 },
    data: {
      label: 'MIND\nMAPPING',
      shape: 'root',
      bgColor: '#9B8ECB',
      textColor: '#FFFFFF',
      fontSize: '22px',
      width: '170px',
      height: '100px',
    },
  },

  // 2. Main Branch: Habits (Top Left - Peach/Coral)
  {
    id: 'pastel-habits',
    type: 'pastelNode',
    position: { x: -280, y: -210 },
    data: {
      label: 'Habits',
      shape: 'squircle',
      bgColor: '#FFAE9C',
      textColor: '#2D3748',
      fontSize: '18px',
      width: '115px',
      height: '105px',
    },
  },
  // Subnodes for Habits (Mint Green Rectangles)
  {
    id: 'pastel-sub-plan',
    type: 'pastelNode',
    position: { x: -480, y: -260 },
    data: { label: 'Plan', shape: 'rect', bgColor: '#C6E9DE', textColor: '#2D3748', width: '110px', height: '52px' },
  },
  {
    id: 'pastel-sub-study',
    type: 'pastelNode',
    position: { x: -480, y: -190 },
    data: { label: 'Study', shape: 'rect', bgColor: '#C6E9DE', textColor: '#2D3748', width: '110px', height: '52px' },
  },
  {
    id: 'pastel-sub-system',
    type: 'pastelNode',
    position: { x: -480, y: -120 },
    data: { label: 'System', shape: 'rect', bgColor: '#C6E9DE', textColor: '#2D3748', width: '110px', height: '52px' },
  },

  // 3. Main Branch: Goals (Top Right - Warm Peach)
  {
    id: 'pastel-goals',
    type: 'pastelNode',
    position: { x: 180, y: -210 },
    data: {
      label: 'Goals',
      shape: 'squircle',
      bgColor: '#FFD19D',
      textColor: '#2D3748',
      fontSize: '18px',
      width: '115px',
      height: '105px',
    },
  },
  // Subnodes for Goals (Lilac Ovals)
  {
    id: 'pastel-sub-research',
    type: 'pastelNode',
    position: { x: 380, y: -260 },
    data: { label: 'Research', shape: 'oval', bgColor: '#DEC8F9', textColor: '#2D3748', width: '135px', height: '50px' },
  },
  {
    id: 'pastel-sub-lecture',
    type: 'pastelNode',
    position: { x: 380, y: -190 },
    data: { label: 'Lecture', shape: 'oval', bgColor: '#DEC8F9', textColor: '#2D3748', width: '135px', height: '50px' },
  },
  {
    id: 'pastel-sub-conclusions',
    type: 'pastelNode',
    position: { x: 380, y: -120 },
    data: { label: 'Conclusions', shape: 'oval', bgColor: '#DEC8F9', textColor: '#2D3748', width: '135px', height: '50px' },
  },

  // 4. Main Branch: Motivation (Middle Right - Lilac Oval)
  {
    id: 'pastel-motivation',
    type: 'pastelNode',
    position: { x: 200, y: -20 },
    data: {
      label: 'Motivation',
      shape: 'oval',
      bgColor: '#DEC8F9',
      textColor: '#2D3748',
      fontSize: '17px',
      width: '145px',
      height: '60px',
    },
  },
  // Subnodes for Motivation (Peach Squircles)
  {
    id: 'pastel-sub-tips',
    type: 'pastelNode',
    position: { x: 440, y: -50 },
    data: { label: 'Tips', shape: 'squircle', bgColor: '#FFD19D', textColor: '#2D3748', width: '80px', height: '80px' },
  },
  {
    id: 'pastel-sub-roadmap',
    type: 'pastelNode',
    position: { x: 440, y: 55 },
    data: { label: 'Roadmap', shape: 'squircle', bgColor: '#FFD19D', textColor: '#2D3748', width: '85px', height: '85px' },
  },

  // 5. Main Branch: Review (Bottom Right - Mint Green Rect)
  {
    id: 'pastel-review',
    type: 'pastelNode',
    position: { x: 180, y: 170 },
    data: {
      label: 'Review',
      shape: 'rect',
      bgColor: '#C6E9DE',
      textColor: '#2D3748',
      fontSize: '18px',
      width: '135px',
      height: '60px',
    },
  },
  // Subnodes for Review (Peach/Coral Squircles)
  {
    id: 'pastel-sub-notes',
    type: 'pastelNode',
    position: { x: 90, y: 290 },
    data: { label: 'Notes', shape: 'squircle', bgColor: '#FFAE9C', textColor: '#2D3748', width: '80px', height: '80px' },
  },
  {
    id: 'pastel-sub-method',
    type: 'pastelNode',
    position: { x: 205, y: 290 },
    data: { label: 'Method', shape: 'squircle', bgColor: '#FFAE9C', textColor: '#2D3748', width: '80px', height: '80px' },
  },
  {
    id: 'pastel-sub-discuss',
    type: 'pastelNode',
    position: { x: 320, y: 290 },
    data: { label: 'Discuss', shape: 'squircle', bgColor: '#FFAE9C', textColor: '#2D3748', width: '80px', height: '80px' },
  },

  // 6. Main Branch: Learning Style (Bottom Left - Warm Peach)
  {
    id: 'pastel-learning-style',
    type: 'pastelNode',
    position: { x: -280, y: 170 },
    data: {
      label: 'Learning\nStyle',
      shape: 'squircle',
      bgColor: '#FFD19D',
      textColor: '#2D3748',
      fontSize: '17px',
      width: '115px',
      height: '105px',
    },
  },
  // Subnodes for Learning Style (Lilac Ovals)
  {
    id: 'pastel-sub-read',
    type: 'pastelNode',
    position: { x: -480, y: 130 },
    data: { label: 'Read', shape: 'oval', bgColor: '#DEC8F9', textColor: '#2D3748', width: '120px', height: '48px' },
  },
  {
    id: 'pastel-sub-listen',
    type: 'pastelNode',
    position: { x: -480, y: 195 },
    data: { label: 'Listen', shape: 'oval', bgColor: '#DEC8F9', textColor: '#2D3748', width: '120px', height: '48px' },
  },
  {
    id: 'pastel-sub-summarize',
    type: 'pastelNode',
    position: { x: -480, y: 260 },
    data: { label: 'Summarize', shape: 'oval', bgColor: '#DEC8F9', textColor: '#2D3748', width: '130px', height: '48px' },
  },

  // 7. Main Branch: Organization (Middle Left - Mint Green Rect)
  {
    id: 'pastel-organization',
    type: 'pastelNode',
    position: { x: -330, y: -20 },
    data: {
      label: 'Organization',
      shape: 'rect',
      bgColor: '#C6E9DE',
      textColor: '#2D3748',
      fontSize: '17px',
      width: '145px',
      height: '60px',
    },
  },
  // Subnode for Organization (Warm Peach Squircle)
  {
    id: 'pastel-sub-breaks',
    type: 'pastelNode',
    position: { x: -500, y: -35 },
    data: { label: 'Breaks', shape: 'squircle', bgColor: '#FFD19D', textColor: '#2D3748', width: '95px', height: '90px' },
  },
];

export const pastelEdges = [
  // Root to 6 Main Branches (Bold Charcoal/Dark Forest Green Arrows)
  {
    id: 'e-p-habits',
    source: 'pastel-root',
    target: 'pastel-habits',
    sourceHandle: 'source-top-left',
    targetHandle: 'target-bottom-right',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.5 },
  },
  {
    id: 'e-p-goals',
    source: 'pastel-root',
    target: 'pastel-goals',
    sourceHandle: 'source-top-right',
    targetHandle: 'target-bottom-left',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.5 },
  },
  {
    id: 'e-p-motivation',
    source: 'pastel-root',
    target: 'pastel-motivation',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.5 },
  },
  {
    id: 'e-p-review',
    source: 'pastel-root',
    target: 'pastel-review',
    sourceHandle: 'source-bottom-right',
    targetHandle: 'target-top-left',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.5 },
  },
  {
    id: 'e-p-learning',
    source: 'pastel-root',
    target: 'pastel-learning-style',
    sourceHandle: 'source-bottom-left',
    targetHandle: 'target-top-right',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.5 },
  },
  {
    id: 'e-p-organization',
    source: 'pastel-root',
    target: 'pastel-organization',
    sourceHandle: 'source-left',
    targetHandle: 'target-right',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.5 },
  },

  // Habits -> Subnodes
  {
    id: 'e-p-h1',
    source: 'pastel-habits',
    target: 'pastel-sub-plan',
    sourceHandle: 'source-top-left',
    targetHandle: 'target-right',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.2 },
  },
  {
    id: 'e-p-h2',
    source: 'pastel-habits',
    target: 'pastel-sub-study',
    sourceHandle: 'source-left',
    targetHandle: 'target-right',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.2 },
  },
  {
    id: 'e-p-h3',
    source: 'pastel-habits',
    target: 'pastel-sub-system',
    sourceHandle: 'source-bottom-left',
    targetHandle: 'target-right',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.2 },
  },

  // Goals -> Subnodes
  {
    id: 'e-p-g1',
    source: 'pastel-goals',
    target: 'pastel-sub-research',
    sourceHandle: 'source-top-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.2 },
  },
  {
    id: 'e-p-g2',
    source: 'pastel-goals',
    target: 'pastel-sub-lecture',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.2 },
  },
  {
    id: 'e-p-g3',
    source: 'pastel-goals',
    target: 'pastel-sub-conclusions',
    sourceHandle: 'source-bottom-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.2 },
  },

  // Motivation -> Subnodes
  {
    id: 'e-p-m1',
    source: 'pastel-motivation',
    target: 'pastel-sub-tips',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.2 },
  },
  {
    id: 'e-p-m2',
    source: 'pastel-motivation',
    target: 'pastel-sub-roadmap',
    sourceHandle: 'source-bottom-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.2 },
  },

  // Review -> Subnodes
  {
    id: 'e-p-r1',
    source: 'pastel-review',
    target: 'pastel-sub-notes',
    sourceHandle: 'source-bottom-left',
    targetHandle: 'target-top',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.2 },
  },
  {
    id: 'e-p-r2',
    source: 'pastel-review',
    target: 'pastel-sub-method',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.2 },
  },
  {
    id: 'e-p-r3',
    source: 'pastel-review',
    target: 'pastel-sub-discuss',
    sourceHandle: 'source-bottom-right',
    targetHandle: 'target-top',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.2 },
  },

  // Learning Style -> Subnodes
  {
    id: 'e-p-l1',
    source: 'pastel-learning-style',
    target: 'pastel-sub-read',
    sourceHandle: 'source-top-left',
    targetHandle: 'target-right',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.2 },
  },
  {
    id: 'e-p-l2',
    source: 'pastel-learning-style',
    target: 'pastel-sub-listen',
    sourceHandle: 'source-left',
    targetHandle: 'target-right',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.2 },
  },
  {
    id: 'e-p-l3',
    source: 'pastel-learning-style',
    target: 'pastel-sub-summarize',
    sourceHandle: 'source-bottom-left',
    targetHandle: 'target-right',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.2 },
  },

  // Organization -> Subnode
  {
    id: 'e-p-o1',
    source: 'pastel-organization',
    target: 'pastel-sub-breaks',
    sourceHandle: 'source-left',
    targetHandle: 'target-right',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#283A2E', strokeWidth: 3.2 },
  },
];

export const pastelMindmapTemplate = {
  id: 'pastel-mindmap',
  name: 'Pastel Organic Mind Map',
  nameFa: 'نقشه ذهنی پاستلی (طرح ابری و نرم)',
  description: 'Soft organic pastel squircles, ovals, and cute rounded blocks with playful thick arrow connectors.',
  category: 'Mind Map',
  thumbnail: '🌸',
  backgroundStyle: 'pastel-cream',
  defaultNodes: pastelNodes,
  defaultEdges: pastelEdges,
  shapes: [
    { type: 'pastelNode', label: 'Pastel Squircle', icon: 'Square' },
    { type: 'pastelNode', label: 'Pastel Oval', icon: 'Circle' },
    { type: 'pastelNode', label: 'Pastel Rect', icon: 'RectangleHorizontal' },
  ],
};
