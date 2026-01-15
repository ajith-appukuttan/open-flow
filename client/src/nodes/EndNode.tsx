import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { Square, Check } from 'lucide-react';
import type { WorkflowNodeData } from '../types/workflow';

type EndNodeType = Node<WorkflowNodeData, 'end'>;

const EndNode = memo(({ data, selected }: NodeProps<EndNodeType>) => {
  const { isTestActive, isTestVisited, isTestMode } = data;
  
  return (
    <div
      className={`workflow-node px-4 py-3 rounded-2xl bg-gradient-to-br from-red-500 to-red-600 shadow-lg border-2 min-w-[120px] transition-all duration-200 relative
        ${selected ? 'border-white node-selected' : 'border-red-400/50'}
        ${isTestActive ? 'test-node-active' : ''}
        ${isTestMode && !isTestActive && !isTestVisited ? 'opacity-40' : ''}
      `}
    >
      {isTestVisited && (
        <div className="absolute -top-2 -right-2 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center border-2 border-canvas-bg z-10">
          <Check size={12} className="text-white" />
        </div>
      )}
      
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-red-300 !border-2 !border-red-700"
      />
      
      <div className="flex items-center gap-2 text-white">
        <div className="w-8 h-8 bg-white/20 rounded-full flex items-center justify-center">
          <Square size={14} fill="white" />
        </div>
        <span className="font-semibold text-sm">{data.label}</span>
      </div>
    </div>
  );
});

EndNode.displayName = 'EndNode';
export default EndNode;
