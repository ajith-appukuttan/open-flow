import { useEffect } from 'react';
import { History, RotateCcw, Check, Eye, Loader2 } from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';

export default function VersionHistory() {
  const {
    workflow,
    versions,
    selectedVersion,
    isLoadingVersions,
    loadVersions,
    previewVersion,
    restoreVersion,
    clearVersionPreview,
  } = useWorkflowStore();

  useEffect(() => {
    if (workflow?.id) {
      loadVersions();
    }
  }, [workflow?.id, loadVersions]);

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);

    if (diffMins < 1) return 'Just now';
    if (diffMins < 60) return `${diffMins}m ago`;
    if (diffHours < 24) return `${diffHours}h ago`;
    if (diffDays < 7) return `${diffDays}d ago`;
    
    return date.toLocaleDateString('en-US', {
      month: 'short',
      day: 'numeric',
      hour: 'numeric',
      minute: '2-digit',
    });
  };

  if (!workflow?.id) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-sm">
        <History size={32} className="mb-2 opacity-50" />
        <p>Save your workflow to see version history</p>
      </div>
    );
  }

  if (isLoadingVersions && versions.length === 0) {
    return (
      <div className="flex items-center justify-center h-48">
        <Loader2 size={24} className="animate-spin text-indigo-400" />
      </div>
    );
  }

  if (versions.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center h-48 text-gray-500 text-sm">
        <History size={32} className="mb-2 opacity-50" />
        <p>No versions yet</p>
        <p className="text-xs mt-1">Versions are created when you save</p>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Version preview banner */}
      {selectedVersion !== null && (
        <div className="p-3 bg-amber-500/10 border-b border-amber-500/30 flex items-center justify-between">
          <div className="flex items-center gap-2 text-amber-300 text-sm">
            <Eye size={16} />
            <span>Previewing v{selectedVersion}</span>
          </div>
          <button
            onClick={clearVersionPreview}
            className="text-xs text-amber-300 hover:text-amber-200 underline"
          >
            Exit preview
          </button>
        </div>
      )}

      {/* Version list */}
      <div className="flex-1 overflow-y-auto">
        {versions.map((version) => (
          <div
            key={version.version}
            className={`p-3 border-b border-panel-border hover:bg-white/5 transition-colors ${
              selectedVersion === version.version ? 'bg-indigo-500/10' : ''
            } ${version.isCurrent ? 'bg-emerald-500/5' : ''}`}
          >
            <div className="flex items-start justify-between">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2">
                  <span className="text-sm font-medium text-white">
                    v{version.version}
                  </span>
                  {version.isCurrent && (
                    <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-400 mt-0.5">
                  {formatDate(version.savedAt)}
                </p>
                {version.message && (
                  <p className="text-xs text-gray-500 mt-1 truncate">
                    {version.message}
                  </p>
                )}
                <p className="text-xs text-gray-600 mt-1">
                  {version.nodeCount} nodes · {version.edgeCount} edges
                </p>
              </div>

              <div className="flex items-center gap-1 ml-2">
                {!version.isCurrent && selectedVersion !== version.version && (
                  <button
                    onClick={() => previewVersion(version.version)}
                    className="p-1.5 text-gray-400 hover:text-indigo-400 hover:bg-indigo-500/10 rounded transition-colors"
                    title="Preview this version"
                  >
                    <Eye size={14} />
                  </button>
                )}
                {!version.isCurrent && (
                  <button
                    onClick={() => restoreVersion(version.version)}
                    disabled={isLoadingVersions}
                    className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors disabled:opacity-50"
                    title="Restore this version"
                  >
                    <RotateCcw size={14} />
                  </button>
                )}
                {version.isCurrent && (
                  <div className="p-1.5 text-emerald-400">
                    <Check size={14} />
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Footer info */}
      <div className="p-3 border-t border-panel-border bg-panel-bg/50">
        <p className="text-xs text-gray-500 text-center">
          Last 10 versions are kept
        </p>
      </div>
    </div>
  );
}
