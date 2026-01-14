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
} from 'lucide-react';
import type { TestMessage } from '../../services/workflowRunner';
import type { NodeType } from '../../types/workflow';

interface ChatMessageProps {
  message: TestMessage;
  onSelectOption?: (optionId: string) => void;
  onContinueLoop?: (shouldContinue: boolean) => void;
  isLatest?: boolean;
}

const nodeIcons: Record<NodeType, React.ReactNode> = {
  start: <Play size={14} className="fill-current" />,
  end: <Square size={12} className="fill-current" />,
  action: <Cog size={14} />,
  decision: <GitBranch size={14} />,
  parallel: <GitMerge size={14} />,
  loop: <RefreshCw size={14} />,
};

export default function ChatMessage({
  message,
  onSelectOption,
  onContinueLoop,
  isLatest,
}: ChatMessageProps) {
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
            {message.apiResponse?.data && (
              <pre className="mt-2 text-xs text-gray-400 bg-canvas-bg rounded p-2 overflow-auto max-h-32 font-mono">
                {typeof message.apiResponse.data === 'string'
                  ? message.apiResponse.data
                  : JSON.stringify(message.apiResponse.data, null, 2)}
              </pre>
            )}
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

      default:
        return <span className="text-gray-300">{message.content}</span>;
    }
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
