// Flowchart Sketch Template (Hand-drawn Flowchart on graph paper)

export const flowchartNodes = [
  // Top Header Box (Wide Process)
  {
    id: 'fc-header',
    type: 'headerProcess',
    position: { x: 215, y: 40 },
    data: {
      label: 'Lorem ipsum\nDolor',
      width: '190px',
      height: '75px',
    },
  },

  // Column 1 (Leftmost column)
  {
    id: 'fc-proc-1',
    type: 'process',
    position: { x: 175, y: 170 },
    data: {
      label: 'Lorem\nipsum',
      width: '115px',
      height: '75px',
    },
  },
  {
    id: 'fc-dec-1',
    type: 'decision',
    position: { x: 170, y: 300 },
    data: {
      label: 'Lorem',
    },
  },
  {
    id: 'fc-term-1',
    type: 'terminal',
    position: { x: 170, y: 430 },
    data: {
      label: 'Lorem',
      width: '115px',
      height: '65px',
    },
  },

  // Column 2
  {
    id: 'fc-proc-2',
    type: 'process',
    position: { x: 360, y: 170 },
    data: {
      label: 'Lorem\nipsum',
      width: '115px',
      height: '75px',
    },
  },
  {
    id: 'fc-proc-3',
    type: 'process',
    position: { x: 360, y: 300 },
    data: {
      label: 'Lorem\nipsum',
      width: '115px',
      height: '75px',
    },
  },
  {
    id: 'fc-dec-2',
    type: 'decision',
    position: { x: 355, y: 430 },
    data: {
      label: 'Lorem',
    },
  },

  // Column 3
  {
    id: 'fc-dec-3',
    type: 'decision',
    position: { x: 550, y: 170 },
    data: {
      label: 'Lorem',
    },
  },
  {
    id: 'fc-proc-4',
    type: 'process',
    position: { x: 550, y: 300 },
    data: {
      label: 'Lorem\nipsum',
      width: '115px',
      height: '75px',
    },
  },

  // Column 4 (Rightmost column)
  {
    id: 'fc-proc-5',
    type: 'process',
    position: { x: 730, y: 170 },
    data: {
      label: 'Lorem\nipsum',
      width: '115px',
      height: '75px',
    },
  },
  {
    id: 'fc-term-2',
    type: 'terminal',
    position: { x: 710, y: 310 },
    data: {
      label: 'Lorem\nipsum',
      width: '145px',
      height: '75px',
    },
  },
];

export const flowchartEdges = [
  // Header to Col 1 & Col 2
  {
    id: 'e-fc-1',
    source: 'fc-header',
    target: 'fc-proc-1',
    sourceHandle: 'source-bottom-left',
    targetHandle: 'target-top',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 2.8 },
  },
  {
    id: 'e-fc-2',
    source: 'fc-header',
    target: 'fc-proc-2',
    sourceHandle: 'source-bottom-right',
    targetHandle: 'target-top',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 2.8 },
  },

  // Col 1 Flow: Proc 1 -> Dec 1 -> Term 1
  {
    id: 'e-fc-3',
    source: 'fc-proc-1',
    target: 'fc-dec-1',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 2.8 },
  },
  {
    id: 'e-fc-4',
    source: 'fc-dec-1',
    target: 'fc-term-1',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 2.8 },
  },

  // Loop back from Dec 1 (left) up to Header (left)
  {
    id: 'e-fc-loop',
    source: 'fc-dec-1',
    target: 'fc-header',
    sourceHandle: 'source-left',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 2.8 },
  },

  // Col 2 Flow: Proc 2 -> Proc 3 -> Dec 2
  {
    id: 'e-fc-5',
    source: 'fc-proc-2',
    target: 'fc-proc-3',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 2.8 },
  },
  {
    id: 'e-fc-6',
    source: 'fc-proc-3',
    target: 'fc-dec-2',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 2.8 },
  },

  // Bottom Connection: Term 1 -> Dec 2
  {
    id: 'e-fc-7',
    source: 'fc-term-1',
    target: 'fc-dec-2',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 2.8 },
  },

  // Dec 2 connects right and up to Proc 4
  {
    id: 'e-fc-8',
    source: 'fc-dec-2',
    target: 'fc-proc-4',
    sourceHandle: 'source-right',
    targetHandle: 'target-bottom',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 2.8 },
  },

  // Col 3 Flow: Proc 4 -> Dec 3
  {
    id: 'e-fc-9',
    source: 'fc-proc-4',
    target: 'fc-dec-3',
    sourceHandle: 'source-top',
    targetHandle: 'target-bottom',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 2.8 },
  },

  // Dec 3 Branches: to Proc 2 (left) and to Proc 5 (right)
  {
    id: 'e-fc-10',
    source: 'fc-dec-3',
    target: 'fc-proc-2',
    sourceHandle: 'source-left',
    targetHandle: 'target-right',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 2.8 },
  },
  {
    id: 'e-fc-11',
    source: 'fc-dec-3',
    target: 'fc-proc-5',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 2.8 },
  },

  // Col 4 Flow: Proc 5 -> Term 2
  {
    id: 'e-fc-12',
    source: 'fc-proc-5',
    target: 'fc-term-2',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 2.8 },
  },
];

export const flowchartTemplate = {
  id: 'flowchart-sketch',
  name: 'Hand-Drawn Flowchart',
  nameFa: 'فلوچارت دست‌ساز (طرح تصویر)',
  description: 'Hand-drawn flowchart with processes, decisions, terminals, and graph paper texture matching the uploaded diagram.',
  category: 'Flowchart',
  thumbnail: '📋',
  backgroundStyle: 'grid',
  defaultNodes: flowchartNodes,
  defaultEdges: flowchartEdges,
  shapes: [
    { type: 'headerProcess', label: 'Header Box', icon: 'RectangleHorizontal' },
    { type: 'process', label: 'Process', icon: 'Square' },
    { type: 'decision', label: 'Decision', icon: 'Rhombus' },
    { type: 'terminal', label: 'Terminal / Start / End', icon: 'Circle' },
  ],
};
