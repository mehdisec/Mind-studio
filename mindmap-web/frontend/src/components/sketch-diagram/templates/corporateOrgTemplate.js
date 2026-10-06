// Corporate Organization Chart Template (Modern Cards with Straight Orthogonal Grid Alignments)

export const corporateOrgNodes = [
  // 1. CEO (Executive Top Center - Mathematically Centered)
  {
    id: 'corp-ceo',
    type: 'corpNode',
    position: { x: -115, y: -200 },
    data: {
      name: 'Bailey Dupont',
      role: 'Chief Executive Officer',
      isCeo: true,
      accentColor: '#EF4444',
      width: '230px',
    },
  },

  // 2. Column 1: IT & Security (Yellow)
  {
    id: 'corp-col1-head',
    type: 'corpNode',
    position: { x: -405, y: -40 },
    data: {
      name: 'Aaron Loeb',
      role: 'Chief Information Officer',
      accentColor: '#F59E0B',
      width: '210px',
    },
  },
  {
    id: 'corp-col1-sub1',
    type: 'corpNode',
    position: { x: -405, y: 75 },
    data: {
      name: 'Juliana Silva',
      role: 'Information Security Manager',
      accentColor: '#F59E0B',
      width: '210px',
    },
  },

  // 3. Column 2: Finance (Green)
  {
    id: 'corp-col2-head',
    type: 'corpNode',
    position: { x: -135, y: -40 },
    data: {
      name: 'Chidi Eze',
      role: 'Chief Financial Officer',
      accentColor: '#10B981',
      width: '210px',
    },
  },
  {
    id: 'corp-col2-sub1',
    type: 'corpNode',
    position: { x: -135, y: 75 },
    data: {
      name: 'Drew Feig',
      role: 'Finance Division Manager',
      accentColor: '#10B981',
      width: '210px',
    },
  },
  {
    id: 'corp-col2-sub2',
    type: 'corpNode',
    position: { x: -135, y: 190 },
    data: {
      name: 'Ndemi Otieno',
      role: 'Payroll & Tax Manager',
      accentColor: '#10B981',
      width: '210px',
    },
  },

  // 4. Column 3: Technology (Blue)
  {
    id: 'corp-col3-head',
    type: 'corpNode',
    position: { x: 135, y: -40 },
    data: {
      name: 'Alfredo Torres',
      role: 'Chief Technical Officer',
      accentColor: '#3B82F6',
      width: '210px',
    },
  },
  {
    id: 'corp-col3-sub1',
    type: 'corpNode',
    position: { x: 135, y: 75 },
    data: {
      name: 'Neil Tran',
      role: 'Quality Assurance Manager',
      accentColor: '#3B82F6',
      width: '210px',
    },
  },
  {
    id: 'corp-col3-sub2',
    type: 'corpNode',
    position: { x: 135, y: 190 },
    data: {
      name: 'Matt Zhang',
      role: 'Product Innovation Manager',
      accentColor: '#3B82F6',
      width: '210px',
    },
  },
  {
    id: 'corp-col3-sub3',
    type: 'corpNode',
    position: { x: 135, y: 305 },
    data: {
      name: 'Murad Naser',
      role: 'Digital Infrastructure Manager',
      accentColor: '#3B82F6',
      width: '210px',
    },
  },

  // 5. Column 4: Marketing (Orange)
  {
    id: 'corp-col4-head',
    type: 'corpNode',
    position: { x: 405, y: -40 },
    data: {
      name: 'Estelle Darcy',
      role: 'Chief Marketing Officer',
      accentColor: '#F97316',
      width: '210px',
    },
  },
  {
    id: 'corp-col4-sub1',
    type: 'corpNode',
    position: { x: 405, y: 75 },
    data: {
      name: 'Taylor Alonso',
      role: 'Online Channels Manager',
      accentColor: '#F97316',
      width: '210px',
    },
  },
  {
    id: 'corp-col4-sub2',
    type: 'corpNode',
    position: { x: 405, y: 190 },
    data: {
      name: 'Teddy Yu',
      role: 'Product Marketing Manager',
      accentColor: '#F97316',
      width: '210px',
    },
  },
];

export const corporateOrgEdges = [
  // CEO -> 4 Department Heads (Sharp Orthogonal 90-Degree Step Connectors)
  {
    id: 'e-ceo-it',
    source: 'corp-ceo',
    target: 'corp-col1-head',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    type: 'sketch',
    data: {
      pathType: 'step',
      isOrthogonal: true,
      isCorp: true,
      styleType: 'dashed',
      strokeColor: '#9CA3AF',
      strokeWidth: 1.8,
    },
  },
  {
    id: 'e-ceo-finance',
    source: 'corp-ceo',
    target: 'corp-col2-head',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    type: 'sketch',
    data: {
      pathType: 'step',
      isOrthogonal: true,
      isCorp: true,
      styleType: 'dashed',
      strokeColor: '#9CA3AF',
      strokeWidth: 1.8,
    },
  },
  {
    id: 'e-ceo-tech',
    source: 'corp-ceo',
    target: 'corp-col3-head',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    type: 'sketch',
    data: {
      pathType: 'step',
      isOrthogonal: true,
      isCorp: true,
      styleType: 'dashed',
      strokeColor: '#9CA3AF',
      strokeWidth: 1.8,
    },
  },
  {
    id: 'e-ceo-marketing',
    source: 'corp-ceo',
    target: 'corp-col4-head',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    type: 'sketch',
    data: {
      pathType: 'step',
      isOrthogonal: true,
      isCorp: true,
      styleType: 'dashed',
      strokeColor: '#9CA3AF',
      strokeWidth: 1.8,
    },
  },

  // Column 1 (IT) Head -> Sub
  {
    id: 'e-col1-1',
    source: 'corp-col1-head',
    target: 'corp-col1-sub1',
    sourceHandle: 'source-left',
    targetHandle: 'target-left',
    type: 'sketch',
    data: {
      pathType: 'step',
      isOrthogonal: true,
      isCorp: true,
      styleType: 'dashed',
      strokeColor: '#F59E0B',
      strokeWidth: 2,
    },
  },

  // Column 2 (Finance) Head -> Subs
  {
    id: 'e-col2-1',
    source: 'corp-col2-head',
    target: 'corp-col2-sub1',
    sourceHandle: 'source-left',
    targetHandle: 'target-left',
    type: 'sketch',
    data: {
      pathType: 'step',
      isOrthogonal: true,
      isCorp: true,
      styleType: 'dashed',
      strokeColor: '#10B981',
      strokeWidth: 2,
    },
  },
  {
    id: 'e-col2-2',
    source: 'corp-col2-head',
    target: 'corp-col2-sub2',
    sourceHandle: 'source-left',
    targetHandle: 'target-left',
    type: 'sketch',
    data: {
      pathType: 'step',
      isOrthogonal: true,
      isCorp: true,
      styleType: 'dashed',
      strokeColor: '#10B981',
      strokeWidth: 2,
    },
  },

  // Column 3 (Tech) Head -> Subs
  {
    id: 'e-col3-1',
    source: 'corp-col3-head',
    target: 'corp-col3-sub1',
    sourceHandle: 'source-left',
    targetHandle: 'target-left',
    type: 'sketch',
    data: {
      pathType: 'step',
      isOrthogonal: true,
      isCorp: true,
      styleType: 'dashed',
      strokeColor: '#3B82F6',
      strokeWidth: 2,
    },
  },
  {
    id: 'e-col3-2',
    source: 'corp-col3-head',
    target: 'corp-col3-sub2',
    sourceHandle: 'source-left',
    targetHandle: 'target-left',
    type: 'sketch',
    data: {
      pathType: 'step',
      isOrthogonal: true,
      isCorp: true,
      styleType: 'dashed',
      strokeColor: '#3B82F6',
      strokeWidth: 2,
    },
  },
  {
    id: 'e-col3-3',
    source: 'corp-col3-head',
    target: 'corp-col3-sub3',
    sourceHandle: 'source-left',
    targetHandle: 'target-left',
    type: 'sketch',
    data: {
      pathType: 'step',
      isOrthogonal: true,
      isCorp: true,
      styleType: 'dashed',
      strokeColor: '#3B82F6',
      strokeWidth: 2,
    },
  },

  // Column 4 (Marketing) Head -> Subs
  {
    id: 'e-col4-1',
    source: 'corp-col4-head',
    target: 'corp-col4-sub1',
    sourceHandle: 'source-left',
    targetHandle: 'target-left',
    type: 'sketch',
    data: {
      pathType: 'step',
      isOrthogonal: true,
      isCorp: true,
      styleType: 'dashed',
      strokeColor: '#F97316',
      strokeWidth: 2,
    },
  },
  {
    id: 'e-col4-2',
    source: 'corp-col4-head',
    target: 'corp-col4-sub2',
    sourceHandle: 'source-left',
    targetHandle: 'target-left',
    type: 'sketch',
    data: {
      pathType: 'step',
      isOrthogonal: true,
      isCorp: true,
      styleType: 'dashed',
      strokeColor: '#F97316',
      strokeWidth: 2,
    },
  },
];

export const corporateOrgTemplate = {
  id: 'corporate-org',
  name: 'Corporate Organization Chart',
  nameFa: 'چارت سازمانی شرکتی (کارت‌های مدرن)',
  description: 'Clean modern hierarchy cards with straight orthogonal grid lines and automatic column alignment.',
  category: 'Organization Chart',
  thumbnail: '🏢',
  backgroundStyle: 'clean',
  defaultNodes: corporateOrgNodes,
  defaultEdges: corporateOrgEdges,
  shapes: [
    { type: 'corpNode', label: 'Member Card', icon: 'User' },
    { type: 'corpCeo', label: 'Executive Card', icon: 'UserCheck' },
  ],
};
