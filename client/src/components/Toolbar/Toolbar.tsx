import { Play, Square, Cog, GitBranch, GitMerge, RefreshCw, Trash2, FileInput } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import type { NodeType } from '../../types/workflow';

interface NodeToolItem {
  type: NodeType;
  label: string;
  icon: React.ReactNode;
  color: string;
  description: string;
}

const nodeTools: NodeToolItem[] = [
  {
    type: 'start',
    label: 'Start',
    icon: <Play size={16} fill="currentColor" />,
    color: 'from-emerald-500 to-emerald-600',
    description: 'Entry point',
  },
  {
    type: 'end',
    label: 'End',
    icon: <Square size={14} fill="currentColor" />,
    color: 'from-red-500 to-red-600',
    description: 'Terminal point',
  },
  {
    type: 'action',
    label: 'Action',
    icon: <Cog size={16} />,
    color: 'from-blue-500 to-blue-600',
    description: 'Execute step',
  },
  {
    type: 'decision',
    label: 'Decision',
    icon: <GitBranch size={16} />,
    color: 'from-amber-400 to-amber-500',
    description: 'If/Else branch',
  },
  {
    type: 'parallel',
    label: 'Parallel',
    icon: <GitMerge size={16} />,
    color: 'from-purple-500 to-purple-600',
    description: 'Fork/Join',
  },
  {
    type: 'loop',
    label: 'Loop',
    icon: <RefreshCw size={16} />,
    color: 'from-orange-400 to-orange-500',
    description: 'Iteration',
  },
  {
    type: 'form',
    label: 'Form',
    icon: <FileInput size={16} />,
    color: 'from-violet-500 to-purple-600',
    description: 'User Input',
  },
];

export default function Toolbar() {
  const { selectedNodeId, selectedEdgeId, deleteSelected } = useWorkflowStore();
  const hasSelection = selectedNodeId || selectedEdgeId;

  const onDragStart = (event: React.DragEvent, nodeType: NodeType) => {
    event.dataTransfer.setData('application/reactflow', nodeType);
    event.dataTransfer.effectAllowed = 'move';
  };

  return (
    <div className="h-16 bg-panel-bg border-b border-panel-border flex items-center px-4 gap-2 shrink-0">
      <div className="flex items-center gap-1 mr-4">
        <span className="text-xs text-gray-400 uppercase tracking-wider font-medium">
          Nodes
        </span>
      </div>
      
      <div className="flex items-center gap-2">
        {nodeTools.map((tool) => (
          <button
            key={tool.type}
            draggable
            onDragStart={(e) => onDragStart(e, tool.type)}
            className={`group flex items-center gap-2 px-3 py-2 rounded-lg bg-gradient-to-br ${tool.color} text-white shadow-md hover:shadow-lg hover:scale-105 transition-all duration-200 cursor-grab active:cursor-grabbing`}
            title={`${tool.label} - ${tool.description}\nDrag to canvas`}
          >
            <span className="opacity-90">{tool.icon}</span>
            <span className="text-xs font-medium hidden sm:inline">{tool.label}</span>
          </button>
        ))}
      </div>
      
      <div className="flex-1" />
      
      {hasSelection && (
        <button
          onClick={deleteSelected}
          className="flex items-center gap-2 px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 hover:text-red-300 transition-colors"
          title="Delete selected (Backspace/Delete)"
        >
          <Trash2 size={16} />
          <span className="text-sm">Delete</span>
        </button>
      )}
      
      <div className="text-xs text-gray-500 hidden md:block">
        Drag nodes to canvas · Connect nodes with edges
      </div>
    </div>
  );
}
