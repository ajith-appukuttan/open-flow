import { ReactFlowProvider } from '@xyflow/react';
import WorkflowCanvas from './components/Canvas/WorkflowCanvas';
import Toolbar from './components/Toolbar/Toolbar';
import Sidebar from './components/Sidebar/Sidebar';
import PropertiesPanel from './components/PropertiesPanel/PropertiesPanel';
import Header from './components/Header/Header';
import Toast from './components/Toast/Toast';
import TestDrawer from './components/TestDrawer/TestDrawer';

function App() {
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
      </div>
    </ReactFlowProvider>
  );
}

export default App;
