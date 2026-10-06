import React, { useCallback, useMemo, useEffect } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Edge,
  Node,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useGraphStore } from '../../stores/useGraphStore';
import { CustomMindNode } from './CustomMindNode';
import { CustomMindEdge } from './CustomMindEdge';
import { MindNode } from '../../types';
import { Sparkles, Plus, ZoomIn, ZoomOut, Maximize2 } from 'lucide-react';
import { Button } from '../common/Button';
import { useSettingsStore } from '../../stores/useSettingsStore';

interface GraphCanvasProps {
  onEditNode: (node: MindNode) => void;
  onDeepDiveNode: (node: MindNode) => void;
}

const nodeTypes = {
  mindNode: CustomMindNode,
};

const edgeTypes = {
  mindEdge: CustomMindEdge,
};

export const GraphCanvas: React.FC<GraphCanvasProps> = ({
  onEditNode,
  onDeepDiveNode,
}) => {
  const {
    nodes: storeNodes,
    edges: storeEdges,
    selectedNodeId,
    setSelectedNodeId,
    batchUpdatePositions,
    addEdge: storeAddEdge,
    deleteEdge: storeDeleteEdge,
    searchQuery,
    activeTagFilter,
    addNode,
  } = useGraphStore();

  const { language } = useSettingsStore();
  const isFa = language === 'fa';

  // Convert Store Nodes to ReactFlow Nodes
  const formattedFlowNodes: Node[] = useMemo(() => {
    return storeNodes
      .filter((n) => {
        if (searchQuery) {
          const q = searchQuery.toLowerCase();
          const matchTitle = n.title.toLowerCase().includes(q);
          const matchTag = n.tags?.some((t) => t.toLowerCase().includes(q));
          if (!matchTitle && !matchTag) return false;
        }
        if (activeTagFilter) {
          if (!n.tags?.includes(activeTagFilter)) return false;
        }
        return true;
      })
      .map((n) => ({
        id: n.id,
        type: 'mindNode',
        position: { x: n.posX || 0, y: n.posY || 0 },
        data: {
          ...n,
          onEdit: onEditNode,
          onDeepDive: onDeepDiveNode,
        },
        selected: n.id === selectedNodeId,
      }));
  }, [storeNodes, selectedNodeId, searchQuery, activeTagFilter, onEditNode, onDeepDiveNode]);

  // Convert Store Edges to ReactFlow Edges
  const formattedFlowEdges: Edge[] = useMemo(() => {
    return storeEdges.map((e) => ({
      id: e.id,
      source: e.sourceNodeId,
      target: e.targetNodeId,
      type: 'mindEdge',
      data: {
        label: e.label,
        weight: e.weight,
        onDelete: storeDeleteEdge,
      },
    }));
  }, [storeEdges, storeDeleteEdge]);

  const [nodes, setNodes, onNodesChange] = useNodesState(formattedFlowNodes);
  const [edges, setEdges, onEdgesChange] = useEdgesState(formattedFlowEdges);

  // Sync with store state updates
  useEffect(() => {
    setNodes(formattedFlowNodes);
  }, [formattedFlowNodes, setNodes]);

  useEffect(() => {
    setEdges(formattedFlowEdges);
  }, [formattedFlowEdges, setEdges]);

  // Handle new edge connection
  const onConnect = useCallback(
    (connection: Connection) => {
      if (connection.source && connection.target && connection.source !== connection.target) {
        storeAddEdge(connection.source, connection.target);
      }
    },
    [storeAddEdge]
  );

  // Save node position after dragging
  const onNodeDragStop = useCallback(
    (_: any, node: Node) => {
      batchUpdatePositions([
        {
          id: node.id,
          posX: Math.round(node.position.x),
          posY: Math.round(node.position.y),
        },
      ]);
    },
    [batchUpdatePositions]
  );

  // Selection change
  const onSelectionChange = useCallback(
    ({ nodes: selectedNodes }: { nodes: Node[] }) => {
      if (selectedNodes.length > 0) {
        setSelectedNodeId(selectedNodes[0].id);
      } else {
        setSelectedNodeId(null);
      }
    },
    [setSelectedNodeId]
  );

  return (
    <div className="relative w-full h-full bg-[#0B0F19]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onNodeDragStop={onNodeDragStop}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        fitView
        fitViewOptions={{ padding: 0.2 }}
        minZoom={0.2}
        maxZoom={2.5}
        className="touch-none"
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1.2}
          color="#1e293b"
        />

        <Controls
          className="!bg-slate-900 !border-slate-800 !shadow-xl !rounded-xl !p-1 !fill-slate-300"
          showInteractive={false}
        />

        <MiniMap
          nodeStrokeWidth={3}
          nodeColor={(node) => {
            const imp = (node.data as any)?.importance || 5;
            if (imp >= 8) return '#f43f5e';
            if (imp >= 6) return '#f59e0b';
            return '#06b6d4';
          }}
          maskColor="rgba(11, 15, 25, 0.75)"
          className="!bg-slate-950/90 !border !border-slate-800 !rounded-xl !overflow-hidden shadow-2xl"
          zoomable
          pannable
        />

        {/* Empty Canvas Overlay */}
        {nodes.length === 0 && (
          <Panel position="top-center" className="mt-32 pointer-events-none">
            <div className="bg-slate-900/90 border border-slate-800 rounded-2xl p-8 max-w-md text-center backdrop-blur-md shadow-2xl pointer-events-auto">
              <div className="w-12 h-12 bg-cyan-950 border border-cyan-800 rounded-2xl flex items-center justify-center mx-auto mb-4 text-cyan-400">
                <Sparkles className="w-6 h-6" />
              </div>
              <h3 className="text-lg font-bold text-slate-100 mb-2">{isFa ? 'گراف دانش شما خالی است' : 'Your knowledge graph is empty'}</h3>
              <p className="text-xs text-slate-400 mb-6 leading-relaxed">
                {isFa ? 'ایده‌ها، مدل‌های ذهنی و افکار خود را از طریق نوار بالای صفحه ثبت کنید یا با دکمه زیر اولین گره را بسازید.' : 'Capture your thoughts and ideas from the top bar or click below to create your first mind node.'}
              </p>
              <Button
                variant="cyber"
                onClick={() => addNode(isFa ? 'ایده و تفکر جدید' : 'New Idea & Thought', 8, isFa ? 'توضیحات اولیه پیرامون این مفهوم...' : 'Initial details about this concept...')}
                className="w-full"
              >
                <Plus className="w-4 h-4" />
                {isFa ? 'ایجاد اولین نود ذهنی' : 'Create First Mind Node'}
              </Button>
            </div>
          </Panel>
        )}
      </ReactFlow>
    </div>
  );
};
