// Milestone Roadmap Journey Template (Hand-drawn Paper Airplane Milestone Trail)

export const milestoneNodes = [
  // Trajectory Waypoint 1 (Start of Path)
  {
    id: 'ms-wp-1',
    type: 'waypointNode',
    position: { x: -430, y: 220 },
    data: {},
  },
  // Step 01: Lightbulb
  {
    id: 'ms-step-1',
    type: 'milestoneNode',
    position: { x: -460, y: 70 },
    data: {
      stepNumber: '01',
      title: 'TITLE OF STEP ONE',
      desc: 'LOREM IPSUM DOLOR SIT AMET, CONSECTETUER ADIPISCING ELIT, SED DIAM NONUMMY NIBH EUISMOD TINCIDUNT UT LAOREET DOLORE MAGNA ALIQUAM ERAT VOLUTPAT. UT WISI ENIM AD MINIM',
      iconType: 'lightbulb',
      iconPosition: 'left',
    },
  },

  // Trajectory Waypoint 2
  {
    id: 'ms-wp-2',
    type: 'waypointNode',
    position: { x: -220, y: 110 },
    data: {},
  },
  // Step 02: Rocket
  {
    id: 'ms-step-2',
    type: 'milestoneNode',
    position: { x: -160, y: 140 },
    data: {
      stepNumber: '02',
      title: 'TITLE OF STEP TWO',
      desc: 'LOREM IPSUM DOLOR SIT AMET, CONSECTETUER ADIPISCING ELIT, SED DIAM NONUMMY NIBH EUISMOD TINCIDUNT UT LAOREET DOLORE MAGNA ALIQUAM ERAT VOLUTPAT. UT WISI ENIM AD MINIM',
      iconType: 'rocket',
      iconPosition: 'left',
    },
  },

  // Trajectory Waypoint 3
  {
    id: 'ms-wp-3',
    type: 'waypointNode',
    position: { x: -120, y: -40 },
    data: {},
  },
  // Step 03: Gears
  {
    id: 'ms-step-3',
    type: 'milestoneNode',
    position: { x: -410, y: -190 },
    data: {
      stepNumber: '03',
      title: 'TITLE OF STEP THREE',
      desc: 'LOREM IPSUM DOLOR SIT AMET, CONSECTETUER ADIPISCING ELIT, SED DIAM NONUMMY NIBH EUISMOD TINCIDUNT UT LAOREET DOLORE MAGNA ALIQUAM ERAT VOLUTPAT. UT WISI ENIM AD MINIM',
      iconType: 'gears',
      iconPosition: 'right',
    },
  },

  // Trajectory Waypoint 4
  {
    id: 'ms-wp-4',
    type: 'waypointNode',
    position: { x: 30, y: -110 },
    data: {},
  },
  // Step 04: Target
  {
    id: 'ms-step-4',
    type: 'milestoneNode',
    position: { x: 50, y: -30 },
    data: {
      stepNumber: '04',
      title: 'TITLE OF STEP FOUR',
      desc: 'LOREM IPSUM DOLOR SIT AMET, CONSECTETUER ADIPISCING ELIT, SED DIAM NONUMMY NIBH EUISMOD TINCIDUNT UT LAOREET DOLORE MAGNA ALIQUAM ERAT VOLUTPAT. UT WISI ENIM AD MINIM',
      iconType: 'target',
      iconPosition: 'left',
    },
  },

  // Flight Goal: Paper Airplane
  {
    id: 'ms-paper-plane',
    type: 'paperPlaneNode',
    position: { x: 230, y: -270 },
    data: {},
  },
];

export const milestoneEdges = [
  // Waypoint 1 -> Step 01
  {
    id: 'e-ms-wp1-step1',
    source: 'ms-wp-1',
    target: 'ms-step-1',
    sourceHandle: 'source-top',
    targetHandle: 'target-bottom',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 3.2 },
  },

  // Waypoint 1 -> Waypoint 2 (Main Curved Flight Trail)
  {
    id: 'e-ms-wp1-wp2',
    source: 'ms-wp-1',
    target: 'ms-wp-2',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'solid', strokeColor: '#1A1A1A', strokeWidth: 3.6 },
  },

  // Waypoint 2 -> Step 02
  {
    id: 'e-ms-wp2-step2',
    source: 'ms-wp-2',
    target: 'ms-step-2',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 3.2 },
  },

  // Waypoint 2 -> Waypoint 3 (Curving Trail Upward)
  {
    id: 'e-ms-wp2-wp3',
    source: 'ms-wp-2',
    target: 'ms-wp-3',
    sourceHandle: 'source-top',
    targetHandle: 'target-bottom',
    type: 'sketch',
    data: { styleType: 'solid', strokeColor: '#1A1A1A', strokeWidth: 3.6 },
  },

  // Waypoint 3 -> Step 03
  {
    id: 'e-ms-wp3-step3',
    source: 'ms-wp-3',
    target: 'ms-step-3',
    sourceHandle: 'source-left',
    targetHandle: 'target-right',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 3.2 },
  },

  // Waypoint 3 -> Waypoint 4 (Curving Trail to Target)
  {
    id: 'e-ms-wp3-wp4',
    source: 'ms-wp-3',
    target: 'ms-wp-4',
    sourceHandle: 'source-right',
    targetHandle: 'target-left',
    type: 'sketch',
    data: { styleType: 'solid', strokeColor: '#1A1A1A', strokeWidth: 3.6 },
  },

  // Waypoint 4 -> Step 04
  {
    id: 'e-ms-wp4-step4',
    source: 'ms-wp-4',
    target: 'ms-step-4',
    sourceHandle: 'source-bottom',
    targetHandle: 'target-top',
    type: 'sketch',
    data: { styleType: 'solid-arrow', strokeColor: '#1A1A1A', strokeWidth: 3.2 },
  },

  // Waypoint 4 -> Paper Airplane (Dashed Flight Speed Line)
  {
    id: 'e-ms-wp4-plane',
    source: 'ms-wp-4',
    target: 'ms-paper-plane',
    sourceHandle: 'source-top-right',
    targetHandle: 'target-bottom-left',
    type: 'sketch',
    data: { styleType: 'dashed', strokeColor: '#1A1A1A', strokeWidth: 3.2 },
  },
];

export const milestoneTemplate = {
  id: 'milestone-plane',
  name: 'Milestone Paper Plane Journey',
  nameFa: 'مسیر مایل‌استون و موشک کاغذی (نقشه راه)',
  description: 'Hand-drawn milestone journey with lightbulb, rocket, gears, and interactive Paper Airplane endpoint that adds new steps on click.',
  category: 'Milestone Roadmap',
  thumbnail: '✈️',
  backgroundStyle: 'sunshine-yellow',
  defaultNodes: milestoneNodes,
  defaultEdges: milestoneEdges,
  shapes: [
    { type: 'milestoneNode', label: 'Milestone Step', icon: 'Target' },
    { type: 'paperPlaneNode', label: 'Paper Airplane Goal', icon: 'Send' },
  ],
};
