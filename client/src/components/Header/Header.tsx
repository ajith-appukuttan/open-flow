import { useEffect, useState, useRef } from 'react';
import {
  Save,
  Download,
  Upload,
  CheckCircle,
  AlertTriangle,
  Loader2,
  PanelLeftClose,
  PanelLeftOpen,
  PanelRightClose,
  PanelRightOpen,
  Workflow,
  Play,
  ChevronDown,
  History,
  RotateCcw,
  Check,
  ArrowRight,
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import UserMenu from '../Auth/UserMenu';

export default function Header() {
  const {
    workflow,
    isSaving,
    validationResult,
    sidebarOpen,
    propertiesPanelOpen,
    testDrawerOpen,
    isTestRunning,
    versions,
    isLoadingVersions,
    selectedVersion,
    saveWorkflow,
    validateWorkflow,
    exportWorkflow,
    importWorkflow,
    toggleSidebar,
    togglePropertiesPanel,
    setError,
    openTestDrawer,
    loadVersions,
    previewVersion,
    restoreVersion,
    setSidebarTab,
  } = useWorkflowStore();

  const [workflowName, setWorkflowName] = useState(workflow?.name || 'Untitled Workflow');
  const [showVersionDropdown, setShowVersionDropdown] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    setWorkflowName(workflow?.name || 'Untitled Workflow');
  }, [workflow?.name]);

  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setShowVersionDropdown(false);
      }
    }

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Load versions when dropdown opens
  useEffect(() => {
    if (showVersionDropdown && workflow?.id) {
      loadVersions();
    }
  }, [showVersionDropdown, workflow?.id, loadVersions]);

  const handleImport = () => {
    const input = document.createElement('input');
    input.type = 'file';
    input.accept = '.json';
    input.onchange = async (e) => {
      const file = (e.target as HTMLInputElement).files?.[0];
      if (file) {
        try {
          const text = await file.text();
          await importWorkflow(text);
        } catch {
          setError('Failed to import workflow');
        }
      }
    };
    input.click();
  };

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setWorkflowName(e.target.value);
  };

  const handleNameBlur = () => {
    if (workflow && workflowName !== workflow.name) {
      useWorkflowStore.setState({
        workflow: { ...workflow, name: workflowName },
      });
    }
  };

  const formatDate = (dateString: string) => {
    const date = new Date(dateString);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  };

  const handleVersionClick = (version: number, isCurrent: boolean) => {
    if (!isCurrent) {
      previewVersion(version);
    }
    setShowVersionDropdown(false);
  };

  const handleRestoreVersion = (version: number, e: React.MouseEvent) => {
    e.stopPropagation();
    restoreVersion(version);
    setShowVersionDropdown(false);
  };

  const handleViewAllVersions = () => {
    setShowVersionDropdown(false);
    setSidebarTab('versions');
    if (!sidebarOpen) {
      toggleSidebar();
    }
  };

  // Get recent 5 versions for the dropdown
  const recentVersions = versions.slice(0, 5);

  return (
    <header className="h-14 bg-panel-bg border-b border-panel-border flex items-center justify-between px-4 shrink-0">
      <div className="flex items-center gap-4">
        <button
          onClick={toggleSidebar}
          className="p-2 hover:bg-panel-hover rounded-lg transition-colors text-gray-400 hover:text-white"
          title={sidebarOpen ? 'Hide sidebar' : 'Show sidebar'}
        >
          {sidebarOpen ? <PanelLeftClose size={20} /> : <PanelLeftOpen size={20} />}
        </button>
        
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <Workflow size={20} className="text-white" />
          </div>
          <div className="relative" ref={dropdownRef}>
            {/* Workflow name with version dropdown trigger */}
            <div className="flex items-center gap-2">
              <input
                type="text"
                value={workflowName}
                onChange={handleNameChange}
                onBlur={handleNameBlur}
                className="bg-transparent text-lg font-semibold text-white border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-0.5 -ml-2"
                placeholder="Workflow name"
              />
              {workflow?.currentVersion && (
                <button
                  onClick={() => setShowVersionDropdown(!showVersionDropdown)}
                  className="flex items-center gap-1 px-2 py-1 text-xs bg-indigo-500/20 text-indigo-300 rounded-md hover:bg-indigo-500/30 transition-colors"
                >
                  <History size={12} />
                  v{selectedVersion ?? workflow.currentVersion}
                  <ChevronDown size={12} className={`transition-transform ${showVersionDropdown ? 'rotate-180' : ''}`} />
                </button>
              )}
            </div>
            <p className="text-xs text-gray-500 ml-0.5">
              {workflow?.nodes?.length || 0} nodes · {workflow?.edges?.length || 0} connections
              {selectedVersion !== null && (
                <span className="text-amber-400 ml-2">• Previewing v{selectedVersion}</span>
              )}
            </p>

            {/* Version Dropdown */}
            {showVersionDropdown && (
              <div className="absolute top-full left-0 mt-2 w-64 bg-panel-bg border border-panel-border rounded-xl shadow-2xl z-50 overflow-hidden">
                {/* Header */}
                <div className="px-3 py-2 border-b border-panel-border bg-white/5">
                  <p className="text-xs font-medium text-gray-400 uppercase tracking-wider">Version History</p>
                </div>

                {/* Version list */}
                <div className="max-h-64 overflow-y-auto">
                  {isLoadingVersions ? (
                    <div className="flex items-center justify-center py-6">
                      <Loader2 size={20} className="animate-spin text-indigo-400" />
                    </div>
                  ) : recentVersions.length === 0 ? (
                    <div className="py-6 text-center text-gray-500 text-sm">
                      <History size={24} className="mx-auto mb-2 opacity-50" />
                      <p>No versions yet</p>
                      <p className="text-xs mt-1">Save to create a version</p>
                    </div>
                  ) : (
                    recentVersions.map((version) => (
                      <div
                        key={version.version}
                        onClick={() => handleVersionClick(version.version, version.isCurrent)}
                        className={`flex items-center justify-between px-3 py-2.5 cursor-pointer transition-colors ${
                          version.isCurrent
                            ? 'bg-emerald-500/10'
                            : selectedVersion === version.version
                            ? 'bg-indigo-500/10'
                            : 'hover:bg-white/5'
                        }`}
                      >
                        <div className="flex items-center gap-2">
                          {version.isCurrent ? (
                            <Check size={14} className="text-emerald-400" />
                          ) : (
                            <div className="w-3.5" />
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-medium text-white">v{version.version}</span>
                              {version.isCurrent && (
                                <span className="text-xs px-1.5 py-0.5 bg-emerald-500/20 text-emerald-300 rounded">
                                  Current
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-gray-500">{formatDate(version.savedAt)}</p>
                          </div>
                        </div>
                        {!version.isCurrent && (
                          <button
                            onClick={(e) => handleRestoreVersion(version.version, e)}
                            className="p-1.5 text-gray-400 hover:text-emerald-400 hover:bg-emerald-500/10 rounded transition-colors"
                            title="Restore this version"
                          >
                            <RotateCcw size={14} />
                          </button>
                        )}
                      </div>
                    ))
                  )}
                </div>

                {/* Footer */}
                {versions.length > 0 && (
                  <div className="border-t border-panel-border">
                    <button
                      onClick={handleViewAllVersions}
                      className="w-full flex items-center justify-between px-3 py-2.5 text-sm text-indigo-400 hover:bg-white/5 transition-colors"
                    >
                      <span>View all versions</span>
                      <ArrowRight size={14} />
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {validationResult && (
          <div
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm ${
              validationResult.valid
                ? 'bg-green-500/20 text-green-400'
                : 'bg-yellow-500/20 text-yellow-400'
            }`}
          >
            {validationResult.valid ? (
              <>
                <CheckCircle size={16} />
                Valid
              </>
            ) : (
              <>
                <AlertTriangle size={16} />
                {validationResult.errors.length} errors
              </>
            )}
          </div>
        )}

        {/* Test Flow Button */}
        <button
          onClick={openTestDrawer}
          disabled={testDrawerOpen}
          className={`px-3 py-2 rounded-lg text-sm font-medium transition-colors flex items-center gap-2 ${
            testDrawerOpen || isTestRunning
              ? 'bg-emerald-600/30 text-emerald-300 border border-emerald-500/50'
              : 'bg-emerald-600 hover:bg-emerald-500 text-white'
          }`}
          title="Test workflow execution"
        >
          <Play size={16} className={isTestRunning ? 'animate-pulse' : ''} />
          Test Flow
        </button>

        <div className="w-px h-6 bg-panel-border mx-1" />

        <button
          onClick={validateWorkflow}
          className="px-3 py-2 bg-panel-hover hover:bg-indigo-600/30 rounded-lg text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2"
          title="Validate workflow"
        >
          <CheckCircle size={16} />
          Validate
        </button>

        <button
          onClick={handleImport}
          className="px-3 py-2 bg-panel-hover hover:bg-indigo-600/30 rounded-lg text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2"
          title="Import workflow"
        >
          <Upload size={16} />
          Import
        </button>

        <button
          onClick={exportWorkflow}
          className="px-3 py-2 bg-panel-hover hover:bg-indigo-600/30 rounded-lg text-sm text-gray-300 hover:text-white transition-colors flex items-center gap-2"
          title="Export workflow"
        >
          <Download size={16} />
          Export
        </button>

        <button
          onClick={saveWorkflow}
          disabled={isSaving}
          className="px-4 py-2 bg-indigo-600 hover:bg-indigo-500 disabled:bg-indigo-600/50 rounded-lg text-sm text-white font-medium transition-colors flex items-center gap-2"
        >
          {isSaving ? (
            <>
              <Loader2 size={16} className="animate-spin" />
              Saving...
            </>
          ) : (
            <>
              <Save size={16} />
              Save
            </>
          )}
        </button>

        <button
          onClick={togglePropertiesPanel}
          className="p-2 hover:bg-panel-hover rounded-lg transition-colors text-gray-400 hover:text-white ml-2"
          title={propertiesPanelOpen ? 'Hide properties' : 'Show properties'}
        >
          {propertiesPanelOpen ? <PanelRightClose size={20} /> : <PanelRightOpen size={20} />}
        </button>

        <div className="w-px h-6 bg-panel-border mx-2" />
        
        <UserMenu />
      </div>
    </header>
  );
}
