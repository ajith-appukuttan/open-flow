import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { GitBranch, Check } from 'lucide-react';
import type { WorkflowNodeData } from '../types/workflow';

type DecisionNodeType = Node<WorkflowNodeData, 'decision'>;

const DecisionNode = memo(({ data, selected }: NodeProps<DecisionNodeType>) => {
  const { isTestActive, isTestVisited, isTestMode } = data;
  
  // Diamond size
  const size = 120;
  const halfSize = size / 2;
  
  return (
    <div
      className={`workflow-node transition-all duration-200 relative
        ${selected ? 'node-selected' : ''}
        ${isTestActive ? 'test-node-active' : ''}
        ${isTestMode && !isTestActive && !isTestVisited ? 'opacity-40' : ''}
      `}
      style={{ width: size, height: size }}
    >
      {isTestVisited && (
        <div className="absolute -top-2 right-2 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center border-2 border-canvas-bg z-20">
          <Check size={12} className="text-white" />
        </div>
      )}
      
      {/* Top handle - for incoming connections */}
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-amber-300 !border-2 !border-amber-700 !z-10"
        style={{ top: -6, left: halfSize - 6 }}
      />
      
      {/* Diamond shape using rotated square */}
      <div
        className={`absolute inset-0 rotate-45 bg-gradient-to-br from-amber-400 to-amber-500 shadow-lg border-2
          ${selected ? 'border-white' : 'border-amber-300/50'}
          ${isTestActive ? 'animate-pulse' : ''}
        `}
        style={{ 
          margin: Math.round(size * 0.146), // Offset to center the rotated square
          width: Math.round(size * 0.707),  // Size adjusted for rotation
          height: Math.round(size * 0.707),
        }}
      />
      
      {/* Content overlay - not rotated */}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-white z-10 pointer-events-none">
        <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
          <GitBranch size={16} />
        </div>
        <span className="font-semibold text-sm text-center mt-1">{data.label}</span>
        {data.condition && (
          <span className="text-xs text-amber-100 opacity-80 max-w-[80px] truncate text-center">
            {data.condition}
          </span>
        )}
      </div>
      
      {/* Left handle for "No" branch */}
      <Handle
        type="source"
        position={Position.Left}
        id="no"
        className="!w-3 !h-3 !bg-red-400 !border-2 !border-red-700 !z-10"
        style={{ left: -6, top: halfSize - 6 }}
      />
      
      {/* Right handle for "Yes" branch */}
      <Handle
        type="source"
        position={Position.Right}
        id="yes"
        className="!w-3 !h-3 !bg-green-400 !border-2 !border-green-700 !z-10"
        style={{ right: -6, top: halfSize - 6 }}
      />
      
      {/* Bottom handle for default path */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="default"
        className="!w-3 !h-3 !bg-amber-300 !border-2 !border-amber-700 !z-10"
        style={{ bottom: -6, left: halfSize - 6 }}
      />
    </div>
  );
});

DecisionNode.displayName = 'DecisionNode';
export default DecisionNode;
