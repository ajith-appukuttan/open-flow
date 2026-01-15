import { useState, useEffect } from 'react';
import {
  X,
  Play,
  Pause,
  SkipForward,
  SkipBack,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  ChevronDown,
  ChevronRight,
  Code,
  ArrowRight,
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import type { ExecutionStep } from '../../types/workflow';

function formatDate(date: Date, formatStr: string): string {
  if (formatStr === 'h:mm:ss.SSS a') {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true }) + '.' + date.getMilliseconds().toString().padStart(3, '0');
  }
  if (formatStr === 'h:mm:ss a') {
    return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  }
  if (formatStr === 'MMM d, yyyy h:mm:ss a') {
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }) + ' ' +
           date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true });
  }
  return date.toLocaleString();
}

const statusConfig: Record<string, { icon: typeof CheckCircle; color: string; bgColor: string }> = {
  success: { icon: CheckCircle, color: 'text-emerald-400', bgColor: 'bg-emerald-500/20' },
  failed: { icon: XCircle, color: 'text-red-400', bgColor: 'bg-red-500/20' },
  skipped: { icon: AlertCircle, color: 'text-gray-400', bgColor: 'bg-gray-500/20' },
};

function formatDuration(ms: number | undefined): string {
  if (!ms) return '-';
  if (ms < 1000) return `${ms}ms`;
  if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
  const mins = Math.floor(ms / 60000);
  const secs = ((ms % 60000) / 1000).toFixed(1);
  return `${mins}m ${secs}s`;
}

function StepDetails({ step, isExpanded, onToggle }: {
  step: ExecutionStep;
  isExpanded: boolean;
  onToggle: () => void;
}) {
  const config = statusConfig[step.status] || statusConfig.success;
  const StatusIcon = config.icon;

  return (
    <div className={`rounded-lg border ${config.bgColor} border-white/10`}>
      <button
        onClick={onToggle}
        className="w-full flex items-center gap-3 p-3 text-left hover:bg-white/5 transition-colors"
      >
        <StatusIcon size={16} className={config.color} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2">
            <span className="text-sm font-medium text-white">{step.nodeLabel}</span>
            <span className="text-xs text-gray-500 px-1.5 py-0.5 bg-white/10 rounded">
              {step.nodeType}
            </span>
          </div>
          <div className="flex items-center gap-3 mt-1 text-xs text-gray-400">
            <span className="flex items-center gap-1">
              <Clock size={10} />
              {formatDuration(step.duration)}
            </span>
            {step.startedAt && (
              <span>{formatDate(new Date(step.startedAt), 'h:mm:ss.SSS a')}</span>
            )}
          </div>
        </div>
        {isExpanded ? <ChevronDown size={16} className="text-gray-400" /> : <ChevronRight size={16} className="text-gray-400" />}
      </button>
      
      {isExpanded && (
        <div className="px-3 pb-3 space-y-3">
          {step.error && (
            <div className="p-2 bg-red-500/20 rounded text-xs text-red-300 font-mono">
              {step.error}
            </div>
          )}
          
          {step.input && Object.keys(step.input).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                <ArrowRight size={10} /> Input
              </p>
              <pre className="p-2 bg-black/30 rounded text-xs text-gray-300 font-mono overflow-x-auto max-h-32 overflow-y-auto">
                {JSON.stringify(step.input, null, 2)}
              </pre>
            </div>
          )}
          
          {step.output && Object.keys(step.output).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                <ArrowRight size={10} className="rotate-180" /> Output
              </p>
              <pre className="p-2 bg-black/30 rounded text-xs text-gray-300 font-mono overflow-x-auto max-h-32 overflow-y-auto">
                {JSON.stringify(step.output, null, 2)}
              </pre>
            </div>
          )}
          
          {step.metadata && Object.keys(step.metadata).length > 0 && (
            <div>
              <p className="text-xs font-semibold text-gray-500 mb-1 flex items-center gap-1">
                <Code size={10} /> Metadata
              </p>
              <pre className="p-2 bg-black/30 rounded text-xs text-gray-300 font-mono overflow-x-auto max-h-24 overflow-y-auto">
                {JSON.stringify(step.metadata, null, 2)}
              </pre>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

export default function ExecutionViewer() {
  const { selectedExecution, clearExecutionView } = useWorkflowStore();
  const [expandedSteps, setExpandedSteps] = useState<Set<number>>(new Set());
  const [replayIndex, setReplayIndex] = useState(-1);
  const [isReplaying, setIsReplaying] = useState(false);

  useEffect(() => {
    // Reset replay when execution changes
    setReplayIndex(-1);
    setIsReplaying(false);
    setExpandedSteps(new Set());
  }, [selectedExecution?.id]);

  useEffect(() => {
    if (isReplaying && selectedExecution) {
      const interval = setInterval(() => {
        setReplayIndex((prev) => {
          if (prev >= selectedExecution.steps.length - 1) {
            setIsReplaying(false);
            return prev;
          }
          return prev + 1;
        });
      }, 1000);
      return () => clearInterval(interval);
    }
  }, [isReplaying, selectedExecution]);

  if (!selectedExecution) return null;

  const execution = selectedExecution;
  const successCount = execution.steps.filter((s) => s.status === 'success').length;
  const failedCount = execution.steps.filter((s) => s.status === 'failed').length;

  const toggleStep = (index: number) => {
    const newExpanded = new Set(expandedSteps);
    if (newExpanded.has(index)) {
      newExpanded.delete(index);
    } else {
      newExpanded.add(index);
    }
    setExpandedSteps(newExpanded);
  };

  const handleReplay = () => {
    setReplayIndex(0);
    setIsReplaying(true);
  };

  const handlePause = () => {
    setIsReplaying(false);
  };

  const handlePrevStep = () => {
    setReplayIndex((prev) => Math.max(0, prev - 1));
  };

  const handleNextStep = () => {
    setReplayIndex((prev) => Math.min(execution.steps.length - 1, prev + 1));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm">
      <div className="bg-panel-bg border border-panel-border rounded-xl shadow-2xl w-full max-w-2xl max-h-[85vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-panel-border">
          <div>
            <h2 className="text-lg font-semibold text-white">Execution Details</h2>
            <p className="text-sm text-gray-400">
              {execution.workflowName} · v{execution.workflowVersion}
            </p>
          </div>
          <button
            onClick={clearExecutionView}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors"
          >
            <X size={20} className="text-gray-400" />
          </button>
        </div>

        {/* Summary Bar */}
        <div className="flex items-center justify-between px-4 py-3 bg-black/20 border-b border-panel-border">
          <div className="flex items-center gap-4 text-sm">
            <span className={`flex items-center gap-1.5 ${
              execution.status === 'completed' ? 'text-emerald-400' :
              execution.status === 'failed' ? 'text-red-400' :
              execution.status === 'cancelled' ? 'text-amber-400' : 'text-blue-400'
            }`}>
              {execution.status === 'completed' && <CheckCircle size={16} />}
              {execution.status === 'failed' && <XCircle size={16} />}
              {execution.status === 'cancelled' && <AlertCircle size={16} />}
              {execution.status.charAt(0).toUpperCase() + execution.status.slice(1)}
            </span>
            <span className="text-gray-400 flex items-center gap-1">
              <Clock size={14} />
              {formatDuration(execution.duration)}
            </span>
            <span className="text-gray-400">
              {execution.steps.length} steps
            </span>
          </div>
          <div className="flex items-center gap-2 text-xs">
            <span className="text-emerald-400">✓ {successCount}</span>
            {failedCount > 0 && <span className="text-red-400">✗ {failedCount}</span>}
          </div>
        </div>

        {/* Replay Controls */}
        <div className="flex items-center justify-center gap-2 p-3 border-b border-panel-border bg-black/10">
          <button
            onClick={handlePrevStep}
            disabled={replayIndex <= 0}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
          >
            <SkipBack size={16} className="text-gray-400" />
          </button>
          {isReplaying ? (
            <button
              onClick={handlePause}
              className="p-2 px-4 bg-amber-600 hover:bg-amber-500 rounded-lg transition-colors flex items-center gap-2"
            >
              <Pause size={16} className="text-white" />
              <span className="text-sm text-white">Pause</span>
            </button>
          ) : (
            <button
              onClick={handleReplay}
              className="p-2 px-4 bg-indigo-600 hover:bg-indigo-500 rounded-lg transition-colors flex items-center gap-2"
            >
              <Play size={16} className="text-white" />
              <span className="text-sm text-white">Replay</span>
            </button>
          )}
          <button
            onClick={handleNextStep}
            disabled={replayIndex >= execution.steps.length - 1}
            className="p-2 hover:bg-white/10 rounded-lg transition-colors disabled:opacity-30"
          >
            <SkipForward size={16} className="text-gray-400" />
          </button>
          {replayIndex >= 0 && (
            <span className="text-xs text-gray-400 ml-2">
              Step {replayIndex + 1} of {execution.steps.length}
            </span>
          )}
        </div>

        {/* Timeline */}
        <div className="p-4 border-b border-panel-border">
          <div className="flex items-center gap-1">
            {execution.steps.map((step, index) => {
              const config = statusConfig[step.status] || statusConfig.success;
              const isActive = replayIndex === index;
              const isPast = replayIndex > index;
              return (
                <button
                  key={index}
                  onClick={() => {
                    setReplayIndex(index);
                    setExpandedSteps(new Set([index]));
                  }}
                  className={`flex-1 h-2 rounded-full transition-all ${
                    isActive ? 'ring-2 ring-white ring-offset-2 ring-offset-panel-bg' :
                    isPast ? config.bgColor : 'bg-white/10'
                  }`}
                  style={{
                    backgroundColor: isPast || isActive ? undefined : undefined,
                  }}
                  title={`${step.nodeLabel} (${step.status})`}
                >
                  <div className={`h-full rounded-full ${
                    isPast || isActive ? (step.status === 'success' ? 'bg-emerald-500' : step.status === 'failed' ? 'bg-red-500' : 'bg-gray-500') : 'bg-white/20'
                  }`} />
                </button>
              );
            })}
          </div>
        </div>

        {/* Steps List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-2">
          {execution.steps.map((step, index) => (
            <div
              key={index}
              className={`transition-all ${
                replayIndex === index ? 'ring-2 ring-indigo-500 rounded-lg' : ''
              }`}
            >
              <StepDetails
                step={step}
                isExpanded={expandedSteps.has(index)}
                onToggle={() => toggleStep(index)}
              />
            </div>
          ))}
        </div>

        {/* Execution Context (collapsible) */}
        {Object.keys(execution.context).length > 0 && (
          <div className="border-t border-panel-border p-4">
            <details className="group">
              <summary className="flex items-center gap-2 cursor-pointer text-sm text-gray-400 hover:text-white">
                <ChevronRight size={14} className="group-open:rotate-90 transition-transform" />
                Final Context ({Object.keys(execution.context).length} entries)
              </summary>
              <pre className="mt-2 p-3 bg-black/30 rounded-lg text-xs text-gray-300 font-mono overflow-x-auto max-h-40 overflow-y-auto">
                {JSON.stringify(execution.context, null, 2)}
              </pre>
            </details>
          </div>
        )}

        {/* Footer */}
        <div className="flex items-center justify-between p-4 border-t border-panel-border text-xs text-gray-500">
          <span>Started: {formatDate(new Date(execution.startedAt), 'MMM d, yyyy h:mm:ss a')}</span>
          {execution.completedAt && (
            <span>Ended: {formatDate(new Date(execution.completedAt), 'h:mm:ss a')}</span>
          )}
        </div>
      </div>
    </div>
  );
}
