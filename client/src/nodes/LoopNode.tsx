import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import { RefreshCw, Check } from 'lucide-react';
import type { WorkflowNodeData } from '../types/workflow';

const LoopNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
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
        className="!w-3 !h-3 !bg-orange-300 !border-2 !border-orange-700"
      />
      
      {/* Circle shape */}
      <div
        className={`w-28 h-28 rounded-full bg-gradient-to-br from-orange-400 to-orange-500 shadow-lg border-2 flex items-center justify-center
          ${selected ? 'border-white' : 'border-orange-300/50'}
        `}
      >
        <div className="flex flex-col items-center gap-1 text-white">
          <div className={`w-8 h-8 bg-white/20 rounded-full flex items-center justify-center ${isTestActive ? 'animate-spin' : ''}`}>
            <RefreshCw size={16} />
          </div>
          <span className="font-semibold text-sm">{data.label}</span>
          {data.loopCount !== undefined && (
            <span className="text-xs text-orange-100 opacity-80">
              {data.loopCount}x
            </span>
          )}
          {data.loopCondition && (
            <span className="text-xs text-orange-100 opacity-80 max-w-[70px] truncate text-center">
              {data.loopCondition}
            </span>
          )}
        </div>
      </div>
      
      {/* Loop back handle */}
      <Handle
        type="source"
        position={Position.Left}
        id="loop"
        className="!w-3 !h-3 !bg-orange-300 !border-2 !border-orange-700"
        style={{ left: -6, top: '50%' }}
      />
      
      {/* Exit handle */}
      <Handle
        type="source"
        position={Position.Bottom}
        id="exit"
        className="!w-3 !h-3 !bg-green-400 !border-2 !border-green-700"
      />
    </div>
  );
});

LoopNode.displayName = 'LoopNode';
export default LoopNode;
