// Clean Mind Map initial dataset without doodles

export const initialNodes = [
  // 1. Root Central Node
  {
    id: 'root-1',
    type: 'root',
    position: { x: 0, y: 0 },
    data: {
      label: 'MIND MAP',
      fontSize: 48,
      color: '#557A46',
    },
  },

  // 2. Branch 1: SELF DISCOVERY (Top Left)
  {
    id: 'branch-self-discovery',
    type: 'branch',
    position: { x: -220, y: -220 },
    data: {
      label: 'SELF\nDISCOVERY',
      collapsed: false,
      color: '#557A46',
    },
  },
  {
    id: 'sub-strengths',
    type: 'subnode',
    position: { x: -470, y: -270 },
    data: { label: 'Strengths & Weaknesses' },
  },
  {
    id: 'sub-core-values',
    type: 'subnode',
    position: { x: -470, y: -210 },
    data: { label: 'Core Values' },
  },
  {
    id: 'sub-passion',
    type: 'subnode',
    position: { x: -470, y: -150 },
    data: { label: 'Passion & Purpose' },
  },

  // 3. Branch 2: BRAND IDENTITY (Top Right)
  {
    id: 'branch-brand-identity',
    type: 'branch',
    position: { x: 230, y: -220 },
    data: {
      label: 'BRAND\nIDENTITY',
      collapsed: false,
      color: '#557A46',
    },
  },
  {
    id: 'sub-personal-logo',
    type: 'subnode',
    position: { x: 470, y: -270 },
    data: { label: 'Personal Logo or Style' },
  },
  {
    id: 'sub-consistent-tone',
    type: 'subnode',
    position: { x: 470, y: -210 },
    data: { label: 'Consistent Tone & Voice' },
  },
  {
    id: 'sub-usp',
    type: 'subnode',
    position: { x: 470, y: -150 },
    data: { label: 'Unique Selling Proposition' },
  },

  // 4. Branch 3: NETWORKING (Middle Right)
  {
    id: 'branch-networking',
    type: 'branch',
    position: { x: 380, y: 30 },
    data: {
      label: 'NETWORKING',
      collapsed: false,
      color: '#557A46',
    },
  },
  {
    id: 'sub-relationships',
    type: 'subnode',
    position: { x: 610, y: -20 },
    data: { label: 'Building Relationships' },
  },
  {
    id: 'sub-collaborations',
    type: 'subnode',
    position: { x: 610, y: 35 },
    data: { label: 'Collaborations' },
  },
  {
    id: 'sub-communities',
    type: 'subnode',
    position: { x: 610, y: 90 },
    data: { label: 'Engaging in Communities' },
  },

  // 5. Branch 4: ONLINE PRESENCE (Bottom Center)
  {
    id: 'branch-online-presence',
    type: 'branch',
    position: { x: -70, y: 260 },
    data: {
      label: 'ONLINE\nPRESENCE',
      collapsed: false,
      color: '#557A46',
    },
  },
  {
    id: 'sub-social-media',
    type: 'subnode',
    position: { x: 170, y: 210 },
    data: { label: 'Social Media Optimization' },
  },
  {
    id: 'sub-portfolio',
    type: 'subnode',
    position: { x: 170, y: 265 },
    data: { label: 'Personal Portfolio' },
  },
  {
    id: 'sub-content-creation',
    type: 'subnode',
    position: { x: 170, y: 320 },
    data: { label: 'Content Creation' },
  },

  // 6. Branch 5: CONSISTENCY (Middle Left)
  {
    id: 'branch-consistency',
    type: 'branch',
    position: { x: -390, y: 30 },
    data: {
      label: 'CONSISTENCY',
      collapsed: false,
      color: '#557A46',
    },
  },
  {
    id: 'sub-regular-updates',
    type: 'subnode',
    position: { x: -620, y: -20 },
    data: { label: 'Regular Updates' },
  },
  {
    id: 'sub-feedback',
    type: 'subnode',
    position: { x: -620, y: 35 },
    data: { label: 'Feedback & Reflection' },
  },
  {
    id: 'sub-learning',
    type: 'subnode',
    position: { x: -620, y: 90 },
    data: { label: 'Continuous Learning' },
  },
];

export const initialEdges = [
  // Root -> 5 Branches
  {
    id: 'e-root-self-discovery',
    source: 'root-1',
    target: 'branch-self-discovery',
    sourceHandle: 'source-top',
    targetHandle: 'target-bottom',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 3 },
  },
  {
    id: 'e-root-brand-identity',
    source: 'root-1',
    target: 'branch-brand-identity',
    sourceHandle: 'source-top',
    targetHandle: 'target-bottom',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 3 },
  },
  {
    id: 'e-root-networking',
    source: 'root-1',
    target: 'branch-networking',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 3 },
  },
  {
    id: 'e-root-online-presence',
    source: 'root-1',
    target: 'branch-online-presence',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 3 },
  },
  {
    id: 'e-root-consistency',
    source: 'root-1',
    target: 'branch-consistency',
    sourceHandle: 'source-left',
    targetHandle: 'target-right',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 3 },
  },

  // Branch 1 -> Subnodes
  {
    id: 'e-sd-1',
    source: 'branch-self-discovery',
    target: 'sub-strengths',
    sourceHandle: 'source-left',
    targetHandle: 'target-right',
    type: 'sketch',
    data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 2 },
  },
  {
    id: 'e-sd-2',
    source: 'branch-self-discovery',
    target: 'sub-core-values',
    sourceHandle: 'source-left',
    targetHandle: 'target-right',
    type: 'sketch',
    data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 2 },
  },
  {
    id: 'e-sd-3',
    source: 'branch-self-discovery',
    target: 'sub-passion',
    sourceHandle: 'source-left',
    targetHandle: 'target-right',
    type: 'sketch',
    data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 2 },
  },

  // Branch 2 -> Subnodes
  {
    id: 'e-bi-1',
    source: 'branch-brand-identity',
    target: 'sub-personal-logo',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 2 },
  },
  {
    id: 'e-bi-2',
    source: 'branch-brand-identity',
    target: 'sub-consistent-tone',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 2 },
  },
  {
    id: 'e-bi-3',
    source: 'branch-brand-identity',
    target: 'sub-usp',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 2 },
  },

  // Branch 3 -> Subnodes
  {
    id: 'e-nw-1',
    source: 'branch-networking',
    target: 'sub-relationships',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 2 },
  },
  {
    id: 'e-nw-2',
    source: 'branch-networking',
    target: 'sub-collaborations',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 2 },
  },
  {
    id: 'e-nw-3',
    source: 'branch-networking',
    target: 'sub-communities',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 2 },
  },

  // Branch 4 -> Subnodes
  {
    id: 'e-op-1',
    source: 'branch-online-presence',
    target: 'sub-social-media',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 2 },
  },
  {
    id: 'e-op-2',
    source: 'branch-online-presence',
    target: 'sub-portfolio',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 2 },
  },
  {
    id: 'e-op-3',
    source: 'branch-online-presence',
    target: 'sub-content-creation',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 2 },
  },

  // Branch 5 -> Subnodes
  {
    id: 'e-cs-1',
    source: 'branch-consistency',
    target: 'sub-regular-updates',
    sourceHandle: 'source-left',
    targetHandle: 'target-right',
    type: 'sketch',
    data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 2 },
  },
  {
    id: 'e-cs-2',
    source: 'branch-consistency',
    target: 'sub-feedback',
    sourceHandle: 'source-left',
    targetHandle: 'target-right',
    type: 'sketch',
    data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 2 },
  },
  {
    id: 'e-cs-3',
    source: 'branch-consistency',
    target: 'sub-learning',
    sourceHandle: 'source-left',
    targetHandle: 'target-right',
    type: 'sketch',
    data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 2 },
  },
];
