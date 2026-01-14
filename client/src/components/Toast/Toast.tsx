import { useEffect } from 'react';
import { X, AlertCircle, CheckCircle, AlertTriangle, Info } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

type ToastType = 'error' | 'success' | 'warning' | 'info';

const toastConfig: Record<ToastType, { icon: React.ReactNode; bg: string; border: string }> = {
  error: {
    icon: <AlertCircle size={20} />,
    bg: 'bg-red-500/20',
    border: 'border-red-500/50',
  },
  success: {
    icon: <CheckCircle size={20} />,
    bg: 'bg-green-500/20',
    border: 'border-green-500/50',
  },
  warning: {
    icon: <AlertTriangle size={20} />,
    bg: 'bg-yellow-500/20',
    border: 'border-yellow-500/50',
  },
  info: {
    icon: <Info size={20} />,
    bg: 'bg-blue-500/20',
    border: 'border-blue-500/50',
  },
};

export default function Toast() {
  const { error, validationResult, setError } = useWorkflowStore();

  useEffect(() => {
    if (error) {
      const timer = setTimeout(() => setError(null), 5000);
      return () => clearTimeout(timer);
    }
  }, [error, setError]);

  if (!error && !validationResult) return null;

  const renderToast = (
    message: string,
    type: ToastType,
    onClose: () => void,
    details?: string[]
  ) => {
    const config = toastConfig[type];
    return (
      <div
        className={`${config.bg} ${config.border} border rounded-lg p-4 shadow-lg backdrop-blur-sm animate-slideIn`}
      >
        <div className="flex items-start gap-3">
          <div className={`shrink-0 ${type === 'error' ? 'text-red-400' : type === 'success' ? 'text-green-400' : type === 'warning' ? 'text-yellow-400' : 'text-blue-400'}`}>
            {config.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className="text-sm font-medium text-white">{message}</p>
            {details && details.length > 0 && (
              <ul className="mt-2 space-y-1">
                {details.map((detail, i) => (
                  <li key={i} className="text-xs text-gray-400">
                    • {detail}
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            onClick={onClose}
            className="shrink-0 p-1 hover:bg-white/10 rounded transition-colors text-gray-400 hover:text-white"
          >
            <X size={16} />
          </button>
        </div>
      </div>
    );
  };

  return (
    <div className="fixed bottom-4 right-4 z-50 space-y-2 max-w-md">
      {error && renderToast(error, 'error', () => setError(null))}
      
      {validationResult && !validationResult.valid && (
        renderToast(
          'Workflow validation failed',
          'warning',
          () => useWorkflowStore.setState({ validationResult: null }),
          validationResult.errors
        )
      )}
      
      {validationResult?.valid && (
        renderToast(
          'Workflow is valid',
          'success',
          () => useWorkflowStore.setState({ validationResult: null }),
          validationResult.warnings.length > 0 ? validationResult.warnings : undefined
        )
      )}
    </div>
  );
}
