import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { Cog, Check } from 'lucide-react';
import type { WorkflowNodeData } from '../types/workflow';

const ActionNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const { isTestActive, isTestVisited, isTestMode } = data;
  
  return (
    <div
      className={`workflow-node px-4 py-3 rounded-xl bg-gradient-to-br from-blue-500 to-blue-600 shadow-lg border-2 min-w-[140px] transition-all duration-200 relative
        ${selected ? 'border-white node-selected' : 'border-blue-400/50'}
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
        className="!w-3 !h-3 !bg-blue-300 !border-2 !border-blue-700"
      />
      
      <div className="flex items-center gap-2 text-white">
        <div className={`w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center ${isTestActive ? 'animate-spin' : ''}`}>
          <Cog size={16} />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{data.label}</span>
          {data.actionType && (
            <span className="text-xs text-blue-200 opacity-80">{data.actionType}</span>
          )}
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-blue-300 !border-2 !border-blue-700"
      />
    </div>
  );
});

ActionNode.displayName = 'ActionNode';
export default ActionNode;
