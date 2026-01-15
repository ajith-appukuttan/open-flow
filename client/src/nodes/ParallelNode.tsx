import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { GitMerge, Check } from 'lucide-react';
import type { WorkflowNodeData } from '../types/workflow';

type ParallelNodeType = Node<WorkflowNodeData, 'parallel'>;

const ParallelNode = memo(({ data, selected }: NodeProps<ParallelNodeType>) => {
  const { isTestActive, isTestVisited, isTestMode } = data;
  
  return (
    <div
      className={`workflow-node transition-all duration-200 relative
        ${selected ? 'node-selected' : ''}
        ${isTestActive ? 'test-node-active' : ''}
        ${isTestMode && !isTestActive && !isTestVisited ? 'opacity-40' : ''}
      `}
    >
      {isTestVisited && (
        <div className="absolute -top-2 right-4 w-5 h-5 bg-emerald-400 rounded-full flex items-center justify-center border-2 border-canvas-bg z-10">
          <Check size={12} className="text-white" />
        </div>
      )}
      
      <Handle
        type="target"
        position={Position.Top}
        className="!w-3 !h-3 !bg-purple-300 !border-2 !border-purple-700"
      />
      
      {/* Hexagon shape using clip-path */}
      <div
        className={`w-36 h-24 bg-gradient-to-br from-purple-500 to-purple-600 shadow-lg border-2 flex items-center justify-center
          ${selected ? 'border-white' : 'border-purple-400/50'}
          ${isTestActive ? 'animate-pulse' : ''}
        `}
        style={{
          clipPath: 'polygon(25% 0%, 75% 0%, 100% 50%, 75% 100%, 25% 100%, 0% 50%)',
        }}
      >
        <div className="flex flex-col items-center gap-1 text-white">
          <div className="w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center">
            <GitMerge size={16} />
          </div>
          <span className="font-semibold text-sm">{data.label}</span>
          {data.branches && (
            <span className="text-xs text-purple-200 opacity-80">
              {data.branches} branches
            </span>
          )}
        </div>
      </div>
      
      {/* Left output */}
      <Handle
        type="source"
        position={Position.Left}
        id="branch-1"
        className="!w-3 !h-3 !bg-purple-300 !border-2 !border-purple-700"
        style={{ left: -6, top: '50%' }}
      />
      
      {/* Right output */}
      <Handle
        type="source"
        position={Position.Right}
        id="branch-2"
        className="!w-3 !h-3 !bg-purple-300 !border-2 !border-purple-700"
        style={{ right: -6, top: '50%' }}
      />
      
      {/* Bottom output for merged path */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="merged"
        className="!w-3 !h-3 !bg-purple-300 !border-2 !border-purple-700"
      />
    </div>
  );
});

ParallelNode.displayName = 'ParallelNode';
export default ParallelNode;
