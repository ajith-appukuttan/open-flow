import { useEffect, useState } from 'react';
import {
  Plus,
  Folder,
  FileJson,
  Trash2,
  Copy,
  Loader2,
  Search,
  ChevronDown,
  ChevronRight,
  History,
  FolderOpen,
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import VersionHistory from './VersionHistory';

export default function Sidebar() {
  const {
    workflows,
    workflow,
    sidebarOpen,
    isLoading,
    sidebarTab,
    setSidebarTab,
    loadWorkflows,
    loadWorkflow,
    createWorkflow,
    deleteWorkflow,
    duplicateWorkflow,
  } = useWorkflowStore();

  const [searchQuery, setSearchQuery] = useState('');
  const [isExpanded, setIsExpanded] = useState(true);
  const [showNewDialog, setShowNewDialog] = useState(false);
  const [newName, setNewName] = useState('');

  useEffect(() => {
    loadWorkflows();
  }, [loadWorkflows]);

  const filteredWorkflows = workflows.filter((w) =>
    w.name.toLowerCase().includes(searchQuery.toLowerCase())
  );

  const handleCreate = async () => {
    if (newName.trim()) {
      await createWorkflow(newName.trim());
      setNewName('');
      setShowNewDialog(false);
    }
  };

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    if (confirm('Are you sure you want to delete this workflow?')) {
      await deleteWorkflow(id);
    }
  };

  const handleDuplicate = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    await duplicateWorkflow(id);
  };

  if (!sidebarOpen) return null;

  return (
    <aside className="w-72 bg-panel-bg border-r border-panel-border flex flex-col shrink-0">
      {/* Tabs */}
      <div className="flex border-b border-panel-border">
        <button
          onClick={() => setSidebarTab('workflows')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            sidebarTab === 'workflows'
              ? 'text-white border-b-2 border-indigo-500 bg-white/5'
              : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          <FolderOpen size={16} />
          Workflows
        </button>
        <button
          onClick={() => setSidebarTab('versions')}
          className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
            sidebarTab === 'versions'
              ? 'text-white border-b-2 border-indigo-500 bg-white/5'
              : 'text-gray-400 hover:text-gray-300 hover:bg-white/5'
          }`}
        >
          <History size={16} />
          Versions
        </button>
      </div>

      {sidebarTab === 'workflows' ? (
        <>
          <div className="p-4 border-b border-panel-border">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
                Workflows
              </h2>
              <button
                onClick={() => setShowNewDialog(true)}
                className="p-1.5 hover:bg-panel-hover rounded-lg text-gray-400 hover:text-white transition-colors"
                title="Create new workflow"
              >
                <Plus size={18} />
              </button>
            </div>

            <div className="relative">
              <Search
                size={16}
                className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500"
              />
              <input
                type="text"
                placeholder="Search workflows..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="w-full bg-canvas-bg border border-panel-border rounded-lg pl-9 pr-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
            </div>
          </div>

          {showNewDialog && (
            <div className="p-4 border-b border-panel-border bg-panel-hover">
              <p className="text-sm text-gray-400 mb-2">New workflow name:</p>
              <input
                type="text"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleCreate()}
                placeholder="My Workflow"
                autoFocus
                className="w-full bg-canvas-bg border border-panel-border rounded-lg px-3 py-2 text-sm text-gray-300 placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 mb-2"
              />
              <div className="flex gap-2">
                <button
                  onClick={handleCreate}
                  className="flex-1 px-3 py-1.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white font-medium transition-colors"
                >
                  Create
                </button>
                <button
                  onClick={() => {
                    setShowNewDialog(false);
                    setNewName('');
                  }}
                  className="px-3 py-1.5 bg-panel-hover hover:bg-gray-600 rounded-lg text-sm text-gray-300 transition-colors"
                >
                  Cancel
                </button>
              </div>
            </div>
          )}

          <div className="flex-1 overflow-y-auto">
            <div className="p-2">
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="flex items-center gap-2 w-full px-2 py-1.5 text-left text-gray-400 hover:text-white transition-colors"
              >
                {isExpanded ? <ChevronDown size={16} /> : <ChevronRight size={16} />}
                <Folder size={16} />
                <span className="text-sm">All Workflows</span>
                <span className="text-xs text-gray-500 ml-auto">
                  {filteredWorkflows.length}
                </span>
              </button>

              {isExpanded && (
                <div className="ml-2 mt-1 space-y-1">
                  {isLoading ? (
                    <div className="flex items-center justify-center py-8 text-gray-500">
                      <Loader2 size={20} className="animate-spin" />
                    </div>
                  ) : filteredWorkflows.length === 0 ? (
                    <p className="text-sm text-gray-500 py-4 px-2 text-center">
                      {searchQuery ? 'No matching workflows' : 'No workflows yet'}
                    </p>
                  ) : (
                    filteredWorkflows.map((w) => (
                      <div
                        key={w.id}
                        onClick={() => loadWorkflow(w.id)}
                        className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-colors ${
                          workflow?.id === w.id
                            ? 'bg-indigo-600/30 text-white'
                            : 'hover:bg-panel-hover text-gray-300'
                        }`}
                      >
                        <FileJson size={16} className="shrink-0 text-indigo-400" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium truncate">{w.name}</p>
                          <p className="text-xs text-gray-500">
                            {w.nodeCount} nodes ·{' '}
                            {new Date(w.updatedAt).toLocaleDateString()}
                          </p>
                        </div>
                        <div className="hidden group-hover:flex items-center gap-1">
                          <button
                            onClick={(e) => handleDuplicate(w.id, e)}
                            className="p-1 hover:bg-gray-600 rounded transition-colors"
                            title="Duplicate"
                          >
                            <Copy size={14} />
                          </button>
                          <button
                            onClick={(e) => handleDelete(w.id, e)}
                            className="p-1 hover:bg-red-500/30 rounded text-red-400 transition-colors"
                            title="Delete"
                          >
                            <Trash2 size={14} />
                          </button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              )}
            </div>
          </div>

          <div className="p-4 border-t border-panel-border">
            <button
              onClick={() => setShowNewDialog(true)}
              className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-indigo-600 hover:bg-indigo-500 rounded-lg text-sm text-white font-medium transition-colors"
            >
              <Plus size={18} />
              New Workflow
            </button>
          </div>
        </>
      ) : (
        <VersionHistory />
      )}
    </aside>
  );
}
