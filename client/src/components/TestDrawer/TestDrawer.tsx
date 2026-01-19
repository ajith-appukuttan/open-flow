import { useRef, useEffect, useCallback } from 'react';
import {
  Play,
  Square,
  RotateCcw,
  X,
  GripHorizontal,
  MessageCircle,
  Activity,
  Wifi,
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import ChatMessage from './ChatMessage';
import StateViewer from '../StateViewer/StateViewer';

export default function TestDrawer() {
  const {
    testDrawerOpen,
    testDrawerHeight,
    testMessages,
    isTestRunning,
    isTestPaused,
    setTestDrawerHeight,
    closeTestDrawer,
    startTest,
    stopTest,
    resetTest,
    selectTestOption,
    continueTestLoop,
    submitForm,
    // State viewer
    stateViewerOpen,
    stateSnapshots,
    workflowContext,
    currentTestNodeId,
    toggleStateViewer,
    closeStateViewer,
    // Remote
    isRemoteMode,
    remoteRole,
    startRemoteSession,
  } = useWorkflowStore();

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const drawerRef = useRef<HTMLDivElement>(null);
  const isDragging = useRef(false);
  const startY = useRef(0);
  const startHeight = useRef(0);

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [testMessages]);

  // Handle resize drag
  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDragging.current = true;
      startY.current = e.clientY;
      startHeight.current = testDrawerHeight;
      document.body.style.cursor = 'ns-resize';
      document.body.style.userSelect = 'none';
    },
    [testDrawerHeight]
  );

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      if (!isDragging.current) return;
      const delta = startY.current - e.clientY;
      setTestDrawerHeight(startHeight.current + delta);
    };

    const handleMouseUp = () => {
      isDragging.current = false;
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseup', handleMouseUp);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseup', handleMouseUp);
    };
  }, [setTestDrawerHeight]);

  if (!testDrawerOpen) return null;

  const latestMessage = testMessages[testMessages.length - 1];
  const hasInteraction =
    (latestMessage?.options &&
      (latestMessage.type === 'decision' ||
        latestMessage.type === 'parallel' ||
        latestMessage.type === 'loop')) ||
    latestMessage?.type === 'form';

  return (
    <div
      ref={drawerRef}
      className="absolute bottom-0 left-0 right-0 bg-panel-bg border-t border-panel-border shadow-2xl z-50 flex flex-col animate-slideUp"
      style={{ height: testDrawerHeight }}
    >
      {/* Resize Handle */}
      <div
        className="h-3 bg-panel-bg border-b border-panel-border cursor-ns-resize flex items-center justify-center hover:bg-panel-hover transition-colors group"
        onMouseDown={handleMouseDown}
      >
        <GripHorizontal
          size={16}
          className="text-gray-600 group-hover:text-gray-400 transition-colors"
        />
      </div>

      {/* Header */}
      <div className="h-12 px-4 border-b border-panel-border flex items-center justify-between shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 bg-gradient-to-br from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center">
            <MessageCircle size={16} className="text-white" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-white">Workflow Test</h3>
            <p className="text-xs text-gray-500">
              {isTestRunning
                ? isTestPaused
                  ? 'Waiting for input...'
                  : 'Running...'
                : testMessages.length > 0
                  ? 'Completed'
                  : 'Ready to start'}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {!isTestRunning && testMessages.length === 0 && (
            <button
              onClick={startTest}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm text-white font-medium transition-colors"
            >
              <Play size={14} />
              Start Test
            </button>
          )}

          {isTestRunning && (
            <button
              onClick={stopTest}
              className="flex items-center gap-2 px-3 py-1.5 bg-red-600/80 hover:bg-red-500 rounded-lg text-sm text-white font-medium transition-colors"
            >
              <Square size={14} />
              Stop
            </button>
          )}

          {testMessages.length > 0 && !isTestRunning && (
            <button
              onClick={resetTest}
              className="flex items-center gap-2 px-3 py-1.5 bg-panel-hover hover:bg-gray-600 rounded-lg text-sm text-gray-300 font-medium transition-colors"
            >
              <RotateCcw size={14} />
              Reset
            </button>
          )}

          {testMessages.length > 0 && !isTestRunning && (
            <button
              onClick={startTest}
              className="flex items-center gap-2 px-3 py-1.5 bg-emerald-600 hover:bg-emerald-500 rounded-lg text-sm text-white font-medium transition-colors"
            >
              <Play size={14} />
              Run Again
            </button>
          )}

          {/* State Viewer Toggle */}
          <button
            onClick={toggleStateViewer}
            className={`flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium transition-colors ${stateViewerOpen
              ? 'bg-indigo-600 text-white'
              : 'bg-panel-hover hover:bg-gray-600 text-gray-300'
              }`}
            title="Toggle State Viewer"
          >
            <Activity size={14} />
            State
          </button>

          {/* Remote Toggle */}
          <div className="flex items-center gap-1 bg-panel-hover rounded-lg p-1">
            {!isRemoteMode ? (
              <>
                <button
                  onClick={() => startRemoteSession('HOST')}
                  className="px-2 py-1 text-xs text-gray-300 hover:text-white transition-colors"
                  title="Host a remote session"
                >
                  Host
                </button>
                <div className="w-px h-3 bg-gray-600" />
                <button
                  onClick={() => startRemoteSession('REMOTE')}
                  className="px-2 py-1 text-xs text-gray-300 hover:text-white transition-colors"
                  title="Join a remote session"
                >
                  Join
                </button>
              </>
            ) : (
              <div className="flex items-center gap-2 px-2 py-1">
                <Wifi size={14} className="text-emerald-500" />
                <span className="text-xs text-emerald-500 font-medium">
                  {remoteRole === 'HOST' ? 'Hosting' : 'Connected'}
                </span>
              </div>
            )}
          </div>

          <button
            onClick={closeTestDrawer}
            className="p-1.5 hover:bg-panel-hover rounded-lg text-gray-500 hover:text-white transition-colors"
          >
            <X size={18} />
          </button>
        </div>
      </div>

      {/* Messages Area */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3">
        {testMessages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full text-gray-500">
            <MessageCircle size={40} className="mb-3 opacity-50" />
            <p className="text-sm">Click "Start Test" to simulate your workflow</p>
            <p className="text-xs mt-1 opacity-70">
              The test will walk through each node and ask for input at decision points
            </p>
          </div>
        ) : (
          testMessages.map((message, index) => (
            <ChatMessage
              key={message.id}
              message={message}
              onSelectOption={selectTestOption}
              onContinueLoop={continueTestLoop}
              onSubmitForm={submitForm}
              isLatest={index === testMessages.length - 1 && hasInteraction && isTestPaused}
            />
          ))
        )}
        <div ref={messagesEndRef} />
      </div>

      {/* Running indicator */}
      {isTestRunning && !isTestPaused && (
        <div className="absolute bottom-4 left-1/2 -translate-x-1/2">
          <div className="flex items-center gap-2 px-4 py-2 bg-indigo-600/30 backdrop-blur-sm rounded-full border border-indigo-500/50">
            <div className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse" />
            <span className="text-xs text-indigo-300">Executing...</span>
          </div>
        </div>
      )}

      {/* State Viewer */}
      <StateViewer
        isOpen={stateViewerOpen}
        onClose={closeStateViewer}
        snapshots={stateSnapshots}
        currentContext={workflowContext}
        currentNodeId={currentTestNodeId}
        isRunning={isTestRunning}
        isPaused={isTestPaused}
        executionStatus={isTestRunning ? 'running' : testMessages.length > 0 ? 'completed' : 'idle'}
      />
    </div>
  );
}
