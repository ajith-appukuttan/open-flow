import { useEffect } from 'react';
import {
  Play,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  Trash2,
  Loader2,
  Eye,
  RefreshCw,
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import type { ExecutionListItem } from '../../types/workflow';

function formatDistanceToNow(date: Date, options?: { addSuffix?: boolean }): string {
  const now = new Date();
  const diffMs = now.getTime() - date.getTime();
  const diffSecs = Math.floor(diffMs / 1000);
  const diffMins = Math.floor(diffSecs / 60);
  const diffHours = Math.floor(diffMins / 60);
  const diffDays = Math.floor(diffHours / 24);
  
  let result: string;
  if (diffDays > 0) result = `${diffDays} day${diffDays > 1 ? 's' : ''}`;
  else if (diffHours > 0) result = `${diffHours} hour${diffHours > 1 ? 's' : ''}`;
  else if (diffMins > 0) result = `${diffMins} minute${diffMins > 1 ? 's' : ''}`;
  else result = 'less than a minute';
  
  return options?.addSuffix ? `${result} ago` : result;
}

function formatDate(date: Date): string {
  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) + ', ' +
         date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
}

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; label: string }> = {
  completed: { icon: CheckCircle, color: 'text-emerald-400', label: 'Completed' },
  failed: { icon: XCircle, color: 'text-red-400', label: 'Failed' },
  cancelled: { icon: AlertCircle, color: 'text-amber-400', label: 'Cancelled' },
  running: { icon: Play, color: 'text-blue-400', label: 'Running' },
};

function formatDuration(ms: number | undefined): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(1)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(0);
  return `${mins}m ${secs}s`;
}

function ExecutionItem({ execution, onView, onDelete }: {
  execution: ExecutionListItem;
  onView: () => void;
  onDelete: () => void;
}) {
  const config = statusConfig[execution.status] || statusConfig.running;
  const StatusIcon = config.icon;

  return (
    <div className="group p-3 bg-panel-hover/30 hover:bg-panel-hover rounded-lg transition-colors">
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-center gap-2 min-w-0">
          <StatusIcon size={16} className={config.color} />
          <div className="min-w-0">
            <p className="text-sm font-medium text-white truncate">
              v{execution.workflowVersion}
            </p>
            <p className="text-xs text-gray-500">
              {formatDate(new Date(execution.startedAt))}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button
            onClick={onView}
            className="p-1.5 hover:bg-white/10 rounded transition-colors"
            title="View execution details"
          >
            <Eye size={14} className="text-gray-400 hover:text-white" />
          </button>
          <button
            onClick={onDelete}
            className="p-1.5 hover:bg-red-500/20 rounded transition-colors"
            title="Delete execution"
          >
            <Trash2 size={14} className="text-gray-400 hover:text-red-400" />
          </button>
        </div>
      </div>
      
      <div className="mt-2 flex items-center gap-3 text-xs text-gray-400">
        <span className="flex items-center gap-1">
          <Clock size={12} />
          {formatDuration(execution.duration)}
        </span>
        <span>{execution.stepCount} steps</span>
        <span className={config.color}>{config.label}</span>
      </div>
      
      {execution.error && (
        <p className="mt-2 text-xs text-red-400 truncate" title={execution.error}>
          {execution.error}
        </p>
      )}
    </div>
  );
}

export default function ExecutionHistory() {
  const {
    workflow,
    executions,
    isLoadingExecutions,
    loadExecutions,
    viewExecution,
    deleteExecution,
  } = useWorkflowStore();

  useEffect(() => {
    if (workflow?.id) {
      loadExecutions();
    }
  }, [workflow?.id, loadExecutions]);

  const handleRefresh = () => {
    loadExecutions();
  };

  if (!workflow?.id) {
    return (
      <div className="p-4 text-center text-gray-500">
        <AlertCircle size={24} className="mx-auto mb-2 text-gray-600" />
        <p className="text-sm">Save the workflow first to track executions</p>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      <div className="flex items-center justify-between p-3 border-b border-panel-border">
        <h3 className="text-sm font-semibold text-gray-400">Execution History</h3>
        <button
          onClick={handleRefresh}
          disabled={isLoadingExecutions}
          className="p-1.5 hover:bg-white/10 rounded transition-colors"
          title="Refresh"
        >
          <RefreshCw
            size={14}
            className={`text-gray-400 hover:text-white ${isLoadingExecutions ? 'animate-spin' : ''}`}
          />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-3 space-y-2">
        {isLoadingExecutions && executions.length === 0 ? (
          <div className="flex items-center justify-center py-8">
            <Loader2 size={24} className="animate-spin text-gray-500" />
          </div>
        ) : executions.length === 0 ? (
          <div className="text-center py-8">
            <Play size={32} className="mx-auto mb-2 text-gray-600" />
            <p className="text-sm text-gray-500">No executions yet</p>
            <p className="text-xs text-gray-600 mt-1">
              Use "Test Flow" to run the workflow
            </p>
          </div>
        ) : (
          <>
            <p className="text-xs text-gray-500 mb-2">
              {executions.length} execution{executions.length !== 1 ? 's' : ''} · 
              Latest: {formatDistanceToNow(new Date(executions[0].startedAt), { addSuffix: true })}
            </p>
            {executions.map((execution) => (
              <ExecutionItem
                key={execution.id}
                execution={execution}
                onView={() => viewExecution(execution.id)}
                onDelete={() => {
                  if (confirm('Delete this execution record?')) {
                    deleteExecution(execution.id);
                  }
                }}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
