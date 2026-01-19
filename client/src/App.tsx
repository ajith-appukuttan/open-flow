import { useEffect } from 'react';
import { ReactFlowProvider } from '@xyflow/react';
import WorkflowCanvas from './components/Canvas/WorkflowCanvas';
import Toolbar from './components/Toolbar/Toolbar';
import Sidebar from './components/Sidebar/Sidebar';
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel';
import Header from './components/Header/Header';
import Toast from './components/Toast/Toast';
import TestDrawer from './components/TestDrawer/TestDrawer';
import ExecutionViewer from './components/ExecutionViewer/ExecutionViewer';
import LoginPage from './components/Auth/LoginPage';
import StateViewerPopout from './components/StateViewer/StateViewerPopout';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import { useWorkflowStore } from './store/workflowStore';
import { Loader2 } from 'lucide-react';

function WorkflowDesigner() {
  const { isGuest } = useAuth();
  const { seedDemoWorkflowForGuest, loadWorkflows } = useWorkflowStore();

  useEffect(() => {
    // When entering as guest, seed the demo workflow then load workflows
    if (isGuest) {
      seedDemoWorkflowForGuest().then(() => {
        loadWorkflows();
      });
    } else {
      // For authenticated users, just load their workflows
      loadWorkflows();
    }
  }, [isGuest, seedDemoWorkflowForGuest, loadWorkflows]);

  return (
    <ReactFlowProvider>
      <div className="h-full w-full flex flex-col bg-canvas-bg">
        <Header />
        <div className="flex-1 flex overflow-hidden">
          <Sidebar />
          <div className="flex-1 flex flex-col relative">
            <Toolbar />
            <WorkflowCanvas />
            <TestDrawer />
          </div>
          <PropertiesPanel />
        </div>
        <Toast />
        <ExecutionViewer />
      </div>
    </ReactFlowProvider>
  );
}

function AppContent() {
  const { isAuthenticated, loading } = useAuth();

  if (loading) {
    return (
      <div className="h-full w-full flex items-center justify-center bg-canvas-bg">
        <div className="flex flex-col items-center gap-4">
          <Loader2 size={40} className="animate-spin text-indigo-500" />
          <p className="text-gray-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!isAuthenticated) {
    return <LoginPage />;
  }

  return <WorkflowDesigner />;
}

function App() {
  // Check if we're on the state-viewer popout route
  if (window.location.pathname === '/state-viewer') {
    return <StateViewerPopout />;
  }

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}

export default App;
