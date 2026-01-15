import { memo } from 'react';
import { Handle, Position, type NodeProps, type Node } from '@xyflow/react';
import { FileInput, Check } from 'lucide-react';
import type { WorkflowNodeData } from '../types/workflow';

type FormNodeType = Node<WorkflowNodeData, 'form'>;

const FormNode = memo(({ data, selected }: NodeProps<FormNodeType>) => {
  const { isTestActive, isTestVisited, isTestMode, formConfig } = data;
  const fieldCount = formConfig?.components?.filter(c => 
    !['label', 'divider', 'submit', 'cancel', 'image'].includes(c.type)
  ).length || 0;
  
  return (
    <div
      className={`workflow-node px-4 py-3 rounded-xl bg-gradient-to-br from-violet-500 to-purple-600 shadow-lg border-2 min-w-[140px] transition-all duration-200 relative
        ${selected ? 'border-white node-selected' : 'border-violet-400/50'}
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
        className="!w-3 !h-3 !bg-violet-300 !border-2 !border-violet-700"
      />
      
      <div className="flex items-center gap-2 text-white">
        <div className={`w-8 h-8 bg-white/20 rounded-lg flex items-center justify-center ${isTestActive ? 'animate-pulse' : ''}`}>
          <FileInput size={16} />
        </div>
        <div className="flex flex-col">
          <span className="font-semibold text-sm">{data.label}</span>
          <span className="text-xs text-violet-200 opacity-80">
            {fieldCount > 0 ? `${fieldCount} field${fieldCount !== 1 ? 's' : ''}` : 'Form'}
          </span>
        </div>
      </div>
      
      <Handle
        type="source"
        position={Position.Bottom}
        className="!w-3 !h-3 !bg-violet-300 !border-2 !border-violet-700"
      />
    </div>
  );
});

FormNode.displayName = 'FormNode';
export default FormNode;
