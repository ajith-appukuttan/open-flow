import { useEffect, useState } from 'react';
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
    saveWorkflow,
    validateWorkflow,
    exportWorkflow,
    importWorkflow,
    toggleSidebar,
    togglePropertiesPanel,
    setError,
    openTestDrawer,
  } = useWorkflowStore();

  const [workflowName, setWorkflowName] = useState(workflow?.name || 'Untitled Workflow');

  useEffect(() => {
    setWorkflowName(workflow?.name || 'Untitled Workflow');
  }, [workflow?.name]);

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
          <div>
            <input
              type="text"
              value={workflowName}
              onChange={handleNameChange}
              onBlur={handleNameBlur}
              className="bg-transparent text-lg font-semibold text-white border-none outline-none focus:ring-2 focus:ring-indigo-500 rounded px-2 py-0.5 -ml-2"
              placeholder="Workflow name"
            />
            <p className="text-xs text-gray-500 ml-0.5">
              {workflow?.nodes?.length || 0} nodes · {workflow?.edges?.length || 0} connections
            </p>
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
