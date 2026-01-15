import { useCallback, useRef, useMemo } from 'react';
import {
  ReactFlow,
  Background,
  Controls,
  MiniMap,
  BackgroundVariant,
  type NodeTypes,
  type EdgeTypes,
  type OnSelectionChangeFunc,
  SmoothStepEdge,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';

import { useWorkflowStore } from '../../store/workflowStore';
import StartNode from '../../nodes/StartNode';
import EndNode from '../../nodes/EndNode';
import ActionNode from '../../nodes/ActionNode';
import DecisionNode from '../../nodes/DecisionNode';
import ParallelNode from '../../nodes/ParallelNode';
import LoopNode from '../../nodes/LoopNode';
import FormNode from '../../nodes/FormNode';
import type { WorkflowNode, NodeType } from '../../types/workflow';

const nodeTypes: NodeTypes = {
  start: StartNode,
  end: EndNode,
  action: ActionNode,
  decision: DecisionNode,
  parallel: ParallelNode,
  loop: LoopNode,
  form: FormNode,
};

const edgeTypes: EdgeTypes = {
  smoothstep: SmoothStepEdge,
};

const nodeColor = (node: { type?: string }): string => {
  const colors: Record<NodeType, string> = {
    start: '#10b981',
    end: '#ef4444',
    action: '#3b82f6',
    decision: '#f59e0b',
    parallel: '#8b5cf6',
    loop: '#f97316',
    form: '#7c3aed',
  };
  return colors[node.type as NodeType] || '#6366f1';
};

export default function WorkflowCanvas() {
  const reactFlowWrapper = useRef<HTMLDivElement>(null);
  
  const {
    workflow,
    onNodesChange,
    onEdgesChange,
    onConnect,
    addNode,
    selectNode,
    selectEdge,
    isTestMode,
    currentTestNodeId,
    visitedTestNodeIds,
  } = useWorkflowStore();

  const onDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    event.dataTransfer.dropEffect = 'move';
  }, []);

  const onDrop = useCallback(
    (event: React.DragEvent) => {
      event.preventDefault();

      const type = event.dataTransfer.getData('application/reactflow') as NodeType;
      if (!type || !reactFlowWrapper.current) return;

      const bounds = reactFlowWrapper.current.getBoundingClientRect();
      const position = {
        x: event.clientX - bounds.left - 75,
        y: event.clientY - bounds.top - 25,
      };

      const labels: Record<NodeType, string> = {
        start: 'Start',
        end: 'End',
        action: 'Action',
        decision: 'Decision',
        parallel: 'Parallel',
        loop: 'Loop',
        form: 'User Input',
      };

      const newNode: WorkflowNode = {
        id: `${type}-${Date.now()}`,
        type,
        position,
        data: { label: labels[type] },
      };

      addNode(newNode);
    },
    [addNode]
  );

  const onSelectionChange: OnSelectionChangeFunc = useCallback(
    ({ nodes, edges }) => {
      if (nodes.length > 0) {
        selectNode(nodes[0].id);
      } else if (edges.length > 0) {
        selectEdge(edges[0].id);
      } else {
        selectNode(null);
      }
    },
    [selectNode, selectEdge]
  );

  const defaultEdgeOptions = useMemo(
    () => ({
      type: 'smoothstep',
      animated: true,
      style: { stroke: '#6366f1', strokeWidth: 2 },
    }),
    []
  );

  // Transform nodes to include test mode state
  const nodesWithTestState = useMemo(() => {
    if (!workflow) return [];
    
    return workflow.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isTestActive: isTestMode && currentTestNodeId === node.id,
        isTestVisited: isTestMode && visitedTestNodeIds.includes(node.id) && currentTestNodeId !== node.id,
        isTestMode: isTestMode,
      },
    }));
  }, [workflow, isTestMode, currentTestNodeId, visitedTestNodeIds]);

  if (!workflow) {
    return (
      <div className="flex-1 flex items-center justify-center bg-canvas-bg text-gray-400">
        No workflow selected
      </div>
    );
  }

  return (
    <div ref={reactFlowWrapper} className="flex-1 bg-canvas-bg">
      <ReactFlow
        nodes={nodesWithTestState}
        edges={workflow.edges}
        onNodesChange={onNodesChange}
        onEdgesChange={onEdgesChange}
        onConnect={onConnect}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onSelectionChange={onSelectionChange}
        nodeTypes={nodeTypes}
        edgeTypes={edgeTypes}
        defaultEdgeOptions={defaultEdgeOptions}
        fitView
        snapToGrid
        snapGrid={[15, 15]}
        deleteKeyCode={['Backspace', 'Delete']}
        multiSelectionKeyCode={['Meta', 'Control']}
        proOptions={{ hideAttribution: true }}
      >
        <Background
          variant={BackgroundVariant.Dots}
          gap={20}
          size={1}
          color="#2d2d5a"
        />
        <Controls
          showZoom
          showFitView
          showInteractive
          position="bottom-left"
        />
        <MiniMap
          nodeColor={nodeColor}
          nodeStrokeWidth={3}
          zoomable
          pannable
          position="bottom-right"
          style={{
            backgroundColor: '#1e1e3f',
            border: '1px solid #2d2d5a',
            borderRadius: '8px',
          }}
        />
      </ReactFlow>
    </div>
  );
}
