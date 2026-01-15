import { useState } from 'react';
import {
  Play,
  Square,
  Cog,
  GitBranch,
  GitMerge,
  RefreshCw,
  CheckCircle,
  AlertCircle,
  MessageSquare,
  User,
  Globe,
  BarChart3,
  FileInput,
} from 'lucide-react';
import type { TestMessage, WorkflowTelemetry } from '../../services/workflowRunner';
import type { NodeType, FormConfig } from '../../types/workflow';
import FormComponentRenderer from '../FormBuilder/FormComponentRenderer';

interface ChatMessageProps {
  message: TestMessage;
  onSelectOption?: (optionId: string) => void;
  onContinueLoop?: (shouldContinue: boolean) => void;
  onSubmitForm?: (formData: Record<string, unknown>) => void;
  isLatest?: boolean;
}

const nodeIcons: Record<NodeType, React.ReactNode> = {
  start: <Play size={14} className="fill-current" />,
  end: <Square size={12} className="fill-current" />,
  action: <Cog size={14} />,
  decision: <GitBranch size={14} />,
  parallel: <GitMerge size={14} />,
  loop: <RefreshCw size={14} />,
  form: <FileInput size={14} />,
};

export default function ChatMessage({
  message,
  onSelectOption,
  onContinueLoop,
  onSubmitForm,
  isLatest,
}: ChatMessageProps) {
  const [formValues, setFormValues] = useState<Record<string, unknown>>({});

  const handleFormValueChange = (name: string, value: unknown) => {
    setFormValues((prev) => ({ ...prev, [name]: value }));
  };

  const handleFormSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onSubmitForm) {
      onSubmitForm(formValues);
    }
  };

  const renderForm = (formConfig: FormConfig) => {
    return (
      <form onSubmit={handleFormSubmit} className="space-y-3 mt-3 ml-8">
        {formConfig.components.map((component) => {
          if (component.type === 'submit' || component.type === 'cancel') {
            return null; // We'll add our own submit button
          }
          return (
            <div key={component.id} className={component.width === 'half' ? 'w-1/2 inline-block pr-2' : 'w-full'}>
              <FormComponentRenderer
                component={component}
                preview={true}
                value={formValues[component.name]}
                onChange={(value) => handleFormValueChange(component.name, value)}
              />
            </div>
          );
        })}
        <div className="flex gap-2 pt-2">
          <button
            type="submit"
            className="px-4 py-2 bg-violet-600 hover:bg-violet-500 text-white text-sm font-medium rounded-lg transition-colors"
          >
            {formConfig.submitLabel || 'Submit'}
          </button>
        </div>
      </form>
    );
  };

  const renderContent = () => {
    switch (message.type) {
      case 'system':
        return (
          <div className="flex items-start gap-2 text-gray-400 text-sm italic">
            <MessageSquare size={14} className="mt-0.5 shrink-0 opacity-50" />
            <span className="whitespace-pre-wrap font-mono text-xs">{message.content}</span>
          </div>
        );

      case 'node':
        return (
          <div className="flex items-start gap-2">
            <div
              className={`w-6 h-6 rounded-md flex items-center justify-center shrink-0 ${
                message.nodeType === 'start'
                  ? 'bg-emerald-500/20 text-emerald-400'
                  : message.nodeType === 'action'
                  ? 'bg-blue-500/20 text-blue-400'
                  : 'bg-indigo-500/20 text-indigo-400'
              }`}
            >
              {message.nodeType && nodeIcons[message.nodeType]}
            </div>
            <span className="text-gray-200">{message.content}</span>
          </div>
        );

      case 'api':
        return (
          <div className="flex items-start gap-2">
            <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-cyan-500/20 text-cyan-400">
              <Globe size={14} />
            </div>
            <span className="text-cyan-300 font-medium">{message.content}</span>
          </div>
        );

      case 'api_response':
        const isSuccess = message.apiResponse && !message.apiResponse.error && 
          message.apiResponse.status >= 200 && message.apiResponse.status < 400;
        return (
          <div className={`ml-8 p-2 rounded-lg border ${
            isSuccess 
              ? 'bg-green-500/10 border-green-500/30' 
              : 'bg-red-500/10 border-red-500/30'
          }`}>
            <div className="flex items-center gap-2">
              {isSuccess ? (
                <CheckCircle size={14} className="text-green-400" />
              ) : (
                <AlertCircle size={14} className="text-red-400" />
              )}
              <span className={`text-sm ${isSuccess ? 'text-green-300' : 'text-red-300'}`}>
                {message.content}
              </span>
            </div>
            {message.apiResponse?.data !== undefined && message.apiResponse?.data !== null ? (
              <pre className="mt-2 text-xs text-gray-400 bg-canvas-bg rounded p-2 overflow-auto max-h-32 font-mono">
                {typeof message.apiResponse.data === 'string'
                  ? message.apiResponse.data
                  : JSON.stringify(message.apiResponse.data, null, 2)}
              </pre>
            ) : null}
          </div>
        );

      case 'decision':
        return (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-amber-500/20 text-amber-400">
                <GitBranch size={14} />
              </div>
              <span className="text-amber-300">{message.content}</span>
            </div>
            {message.options && isLatest && (
              <div className="flex flex-wrap gap-2 ml-8">
                {message.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => onSelectOption?.(option.id)}
                    className="px-4 py-2 bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/50 rounded-lg text-sm text-amber-200 font-medium transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'parallel':
        return (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-purple-500/20 text-purple-400">
                <GitMerge size={14} />
              </div>
              <span className="text-purple-300">{message.content}</span>
            </div>
            {message.options && isLatest && (
              <div className="flex flex-wrap gap-2 ml-8">
                {message.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() => onSelectOption?.(option.id)}
                    className="px-4 py-2 bg-purple-500/20 hover:bg-purple-500/30 border border-purple-500/50 rounded-lg text-sm text-purple-200 font-medium transition-colors"
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'loop':
        return (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-orange-500/20 text-orange-400">
                <RefreshCw size={14} />
              </div>
              <span className="text-orange-300">{message.content}</span>
            </div>
            {message.options && isLatest && (
              <div className="flex flex-wrap gap-2 ml-8">
                {message.options.map((option) => (
                  <button
                    key={option.id}
                    onClick={() =>
                      onContinueLoop?.(option.id === 'continue')
                    }
                    className={`px-4 py-2 border rounded-lg text-sm font-medium transition-colors ${
                      option.id === 'continue'
                        ? 'bg-orange-500/20 hover:bg-orange-500/30 border-orange-500/50 text-orange-200'
                        : 'bg-green-500/20 hover:bg-green-500/30 border-green-500/50 text-green-200'
                    }`}
                  >
                    {option.label}
                  </button>
                ))}
              </div>
            )}
          </div>
        );

      case 'user':
        return (
          <div className="flex items-start gap-2 justify-end">
            <span className="text-gray-200 bg-indigo-600/30 px-3 py-1.5 rounded-lg rounded-br-sm">
              {message.content}
            </span>
            <div className="w-6 h-6 rounded-full flex items-center justify-center shrink-0 bg-indigo-500/30 text-indigo-300">
              <User size={12} />
            </div>
          </div>
        );

      case 'success':
        return (
          <div className="flex items-start gap-2 bg-green-500/10 border border-green-500/30 rounded-lg p-3">
            <CheckCircle size={18} className="text-green-400 shrink-0 mt-0.5" />
            <span className="text-green-300">{message.content}</span>
          </div>
        );

      case 'error':
        return (
          <div className="flex items-start gap-2 bg-red-500/10 border border-red-500/30 rounded-lg p-3">
            <AlertCircle size={18} className="text-red-400 shrink-0 mt-0.5" />
            <span className="text-red-300">{message.content}</span>
          </div>
        );

      case 'telemetry':
        return renderTelemetry(message.telemetry);

      case 'form':
        return (
          <div className="space-y-2">
            <div className="flex items-start gap-2">
              <div className="w-6 h-6 rounded-md flex items-center justify-center shrink-0 bg-violet-500/20 text-violet-400">
                <FileInput size={14} />
              </div>
              <span className="text-violet-300 font-medium">{message.content}</span>
            </div>
            {message.formConfig && isLatest && renderForm(message.formConfig)}
          </div>
        );

      default:
        return <span className="text-gray-300">{message.content}</span>;
    }
  };

  const formatDuration = (ms: number): string => {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = ((ms % 60000) / 1000).toFixed(1);
    return `${mins}m ${secs}s`;
  };

  const renderTelemetry = (telemetry?: WorkflowTelemetry) => {
    if (!telemetry) return null;

    return (
      <div className="bg-gradient-to-br from-indigo-500/10 to-purple-500/10 border border-indigo-500/30 rounded-lg p-4 space-y-3">
        <div className="flex items-center gap-2 text-indigo-300 font-semibold">
          <BarChart3 size={18} />
          <span>Execution Summary</span>
        </div>
        
        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="space-y-1">
            <div className="text-gray-400">Total Time</div>
            <div className="text-2xl font-bold text-white">
              {formatDuration(telemetry.totalDuration || 0)}
            </div>
          </div>
          <div className="space-y-1">
            <div className="text-gray-400">Steps Executed</div>
            <div className="text-2xl font-bold text-white">
              {telemetry.summary.totalNodes}
            </div>
          </div>
        </div>

        {telemetry.summary.errorCount > 0 && (
          <div className="flex gap-4 text-sm">
            <span className="text-green-400">✓ {telemetry.summary.successCount} success</span>
            <span className="text-red-400">✗ {telemetry.summary.errorCount} errors</span>
          </div>
        )}

        <div className="border-t border-indigo-500/20 pt-3">
          <div className="text-xs text-gray-400 mb-2">Step Breakdown</div>
          <div className="space-y-1 max-h-40 overflow-y-auto">
            {telemetry.steps.map((step, index) => {
              const statusIcon = step.status === 'success' ? '✓' : step.status === 'error' ? '✗' : '○';
              const statusColor = step.status === 'success' ? 'text-green-400' : step.status === 'error' ? 'text-red-400' : 'text-gray-400';
              
              let detail = '';
              if (step.metadata?.apiStatus) {
                detail = `${step.metadata.apiStatus}`;
              } else if (step.metadata?.conditionResult !== undefined) {
                detail = step.metadata.conditionResult ? 'true' : 'false';
              } else if (step.metadata?.loopIteration !== undefined) {
                detail = `#${step.metadata.loopIteration}`;
              }

              return (
                <div key={step.nodeId + index} className="flex items-center justify-between text-xs font-mono">
                  <div className="flex items-center gap-2 flex-1 min-w-0">
                    <span className="text-gray-500 w-4">{index + 1}.</span>
                    <span className="text-gray-300 truncate">{step.nodeLabel}</span>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    {detail && <span className="text-gray-500">{detail}</span>}
                    <span className="text-gray-400 w-16 text-right">{formatDuration(step.duration)}</span>
                    <span className={statusColor}>{statusIcon}</span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="text-xs text-gray-400 pt-2 border-t border-indigo-500/20">
          Average Step Time: {formatDuration(telemetry.summary.avgStepDuration)}
        </div>
      </div>
    );
  };

  return (
    <div
      className={`animate-fadeIn ${
        message.type === 'user' ? 'text-right' : ''
      }`}
    >
      {renderContent()}
    </div>
  );
}
