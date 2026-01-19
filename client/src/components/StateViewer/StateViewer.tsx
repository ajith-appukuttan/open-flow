import { useState, useRef, useEffect, useCallback } from 'react';
import { 
  X, 
  Minus, 
  Maximize2, 
  Minimize2, 
  ExternalLink, 
  ChevronRight, 
  ChevronDown, 
  Circle,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  Copy,
  Check,
  Activity,
  Database,
  List
} from 'lucide-react';
import type { StateSnapshot, WorkflowContext, NodeOutput } from '../../services/workflowRunner';
import { CHANNEL_NAME } from './StateViewerPopout';

interface StateViewerProps {
  isOpen: boolean;
  onClose: () => void;
  snapshots: StateSnapshot[];
  currentContext: WorkflowContext;
  currentNodeId: string | null;
  isRunning: boolean;
  isPaused: boolean;
  executionStatus: string;
}

type TabType = 'state' | 'steps' | 'telemetry';

// Tree view component for displaying nested objects
function JsonTreeNode({ 
  name, 
  value, 
  depth = 0,
  searchTerm = ''
}: { 
  name: string; 
  value: unknown; 
  depth?: number;
  searchTerm?: string;
}) {
  const [isExpanded, setIsExpanded] = useState(depth < 2);
  
  const isObject = value !== null && typeof value === 'object';
  const isArray = Array.isArray(value);
  
  // Check if this node or its children match the search
  const matchesSearch = searchTerm && name.toLowerCase().includes(searchTerm.toLowerCase());
  
  const getTypeColor = () => {
    if (value === null) return 'text-gray-500';
    if (typeof value === 'string') return 'text-green-400';
    if (typeof value === 'number') return 'text-blue-400';
    if (typeof value === 'boolean') return 'text-yellow-400';
    return 'text-gray-300';
  };
  
  const renderValue = () => {
    if (value === null) return <span className="text-gray-500">null</span>;
    if (value === undefined) return <span className="text-gray-500">undefined</span>;
    if (typeof value === 'string') return <span className="text-green-400">"{value}"</span>;
    if (typeof value === 'number') return <span className="text-blue-400">{value}</span>;
    if (typeof value === 'boolean') return <span className="text-yellow-400">{value.toString()}</span>;
    return null;
  };
  
  if (!isObject) {
    return (
      <div 
        className={`flex items-center gap-1 py-0.5 ${matchesSearch ? 'bg-yellow-500/20 rounded' : ''}`}
        style={{ paddingLeft: depth * 16 }}
      >
        <span className="text-purple-400 font-mono text-xs">{name}:</span>
        <span className={`font-mono text-xs ${getTypeColor()}`}>{renderValue()}</span>
      </div>
    );
  }
  
  const entries = isArray ? value.map((v, i) => [i.toString(), v]) : Object.entries(value as object);
  const preview = isArray ? `Array(${value.length})` : `Object{${entries.length}}`;
  
  return (
    <div>
      <div 
        className={`flex items-center gap-1 py-0.5 cursor-pointer hover:bg-white/5 rounded ${matchesSearch ? 'bg-yellow-500/20' : ''}`}
        style={{ paddingLeft: depth * 16 }}
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {isExpanded ? (
          <ChevronDown size={12} className="text-gray-500" />
        ) : (
          <ChevronRight size={12} className="text-gray-500" />
        )}
        <span className="text-purple-400 font-mono text-xs">{name}:</span>
        <span className="text-gray-500 font-mono text-xs">{preview}</span>
      </div>
      {isExpanded && entries.map(([key, val]) => (
        <JsonTreeNode 
          key={key} 
          name={key} 
          value={val} 
          depth={depth + 1}
          searchTerm={searchTerm}
        />
      ))}
    </div>
  );
}

// Step item component for the steps list
function StepItem({ 
  snapshot, 
  isSelected, 
  onClick 
}: { 
  snapshot: StateSnapshot; 
  isSelected: boolean;
  onClick: () => void;
}) {
  const getStatusIcon = () => {
    if (snapshot.action.includes('ENTER_NODE')) {
      return <Circle size={12} className="text-blue-400" />;
    }
    if (snapshot.action.includes('NODE_OUTPUT')) {
      return <CheckCircle2 size={12} className="text-green-400" />;
    }
    if (snapshot.action.includes('COMPLETE')) {
      return <CheckCircle2 size={12} className="text-green-500" />;
    }
    if (snapshot.action.includes('STOPPED') || snapshot.action.includes('ERROR')) {
      return <XCircle size={12} className="text-red-400" />;
    }
    return <Circle size={12} className="text-gray-400" />;
  };
  
  const formatTime = (date: Date) => {
    const d = new Date(date);
    const time = d.toLocaleTimeString('en-US', {
      hour12: false,
      hour: '2-digit',
      minute: '2-digit',
      second: '2-digit',
    });
    const ms = d.getMilliseconds().toString().padStart(3, '0');
    return `${time}.${ms}`;
  };
  
  return (
    <div 
      className={`p-2 cursor-pointer border-l-2 transition-colors ${
        isSelected 
          ? 'bg-indigo-500/20 border-indigo-500' 
          : 'border-transparent hover:bg-white/5'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-xs font-medium text-gray-200 truncate flex-1">
          {snapshot.action}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1 ml-5">
        <Clock size={10} className="text-gray-500" />
        <span className="text-[10px] text-gray-500 font-mono">
          {formatTime(snapshot.timestamp)}
        </span>
        {snapshot.nodeLabel && (
          <span className="text-[10px] text-indigo-400 bg-indigo-400/10 px-1 rounded">
            {snapshot.nodeLabel}
          </span>
        )}
      </div>
      {snapshot.diff && (
        <div className="flex gap-2 mt-1 ml-5">
          {snapshot.diff.added && (
            <span className="text-[10px] text-green-400">
              +{snapshot.diff.added.length}
            </span>
          )}
          {snapshot.diff.modified && (
            <span className="text-[10px] text-yellow-400">
              ~{snapshot.diff.modified.length}
            </span>
          )}
          {snapshot.diff.removed && (
            <span className="text-[10px] text-red-400">
              -{snapshot.diff.removed.length}
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function StateViewer({
  isOpen,
  onClose,
  snapshots,
  currentContext,
  currentNodeId,
  isRunning,
  isPaused,
  executionStatus,
}: StateViewerProps) {
  const [activeTab, setActiveTab] = useState<TabType>('state');
  const [isMinimized, setIsMinimized] = useState(false);
  const [isMaximized, setIsMaximized] = useState(false);
  const [position, setPosition] = useState({ x: 20, y: 100 });
  const [size, setSize] = useState({ width: 400, height: 500 });
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  
  const panelRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startY: number; startPosX: number; startPosY: number } | null>(null);
  const resizeRef = useRef<{ startX: number; startY: number; startWidth: number; startHeight: number } | null>(null);
  
  // Get the context to display (either from selected snapshot or current)
  const displayContext = selectedSnapshotId 
    ? snapshots.find(s => s.id === selectedSnapshotId)?.context || currentContext
    : currentContext;
  
  // Handle drag
  const handleDragStart = useCallback((e: React.MouseEvent) => {
    if (isMaximized) return;
    dragRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startPosX: position.x,
      startPosY: position.y,
    };
  }, [position, isMaximized]);
  
  const handleDrag = useCallback((e: MouseEvent) => {
    if (!dragRef.current) return;
    const dx = e.clientX - dragRef.current.startX;
    const dy = e.clientY - dragRef.current.startY;
    setPosition({
      x: Math.max(0, dragRef.current.startPosX + dx),
      y: Math.max(0, dragRef.current.startPosY + dy),
    });
  }, []);
  
  const handleDragEnd = useCallback(() => {
    dragRef.current = null;
  }, []);
  
  // Handle resize
  const handleResizeStart = useCallback((e: React.MouseEvent) => {
    e.stopPropagation();
    if (isMaximized) return;
    resizeRef.current = {
      startX: e.clientX,
      startY: e.clientY,
      startWidth: size.width,
      startHeight: size.height,
    };
  }, [size, isMaximized]);
  
  const handleResize = useCallback((e: MouseEvent) => {
    if (!resizeRef.current) return;
    const dx = e.clientX - resizeRef.current.startX;
    const dy = e.clientY - resizeRef.current.startY;
    setSize({
      width: Math.max(300, resizeRef.current.startWidth + dx),
      height: Math.max(200, resizeRef.current.startHeight + dy),
    });
  }, []);
  
  const handleResizeEnd = useCallback(() => {
    resizeRef.current = null;
  }, []);
  
  // Add/remove event listeners
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleDrag(e);
      handleResize(e);
    };
    
    const handleMouseUp = () => {
      handleDragEnd();
      handleResizeEnd();
    };
    
    window.addEventListener('mousemove', handleMouseMove);
    window.addEventListener('mouseup', handleMouseUp);
    
    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [handleDrag, handleDragEnd, handleResize, handleResizeEnd]);
  
  // Broadcast state updates to popout window
  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    
    // Send updates when state changes
    const stateData = {
      snapshots,
      currentContext,
      currentNodeId,
      isRunning,
      isPaused,
      executionStatus,
    };
    
    channel.postMessage({ type: 'STATE_UPDATE', payload: stateData });
    
    // Also update localStorage for fallback
    localStorage.setItem('stateViewerData', JSON.stringify(stateData));
    
    // Handle requests from popout
    channel.onmessage = (event) => {
      if (event.data.type === 'REQUEST_STATE') {
        channel.postMessage({ type: 'STATE_UPDATE', payload: stateData });
      }
    };
    
    return () => {
      channel.close();
    };
  }, [snapshots, currentContext, currentNodeId, isRunning, isPaused, executionStatus]);
  
  // Open in new window
  const openInNewWindow = () => {
    // Store current state in localStorage for the popout to read
    localStorage.setItem('stateViewerData', JSON.stringify({
      snapshots,
      currentContext,
      currentNodeId,
      isRunning,
      isPaused,
      executionStatus,
    }));
    
    // Open popout window
    const popout = window.open(
      '/state-viewer',
      'StateViewer',
      `width=${size.width + 100},height=${size.height + 100},left=100,top=100`
    );
    
    if (popout) {
      onClose();
    }
  };
  
  // Copy state to clipboard
  const copyState = () => {
    navigator.clipboard.writeText(JSON.stringify(displayContext, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  if (!isOpen) return null;
  
  const panelStyle = isMaximized
    ? { top: 0, left: 0, right: 0, bottom: 0, width: '100%', height: '100%' }
    : { top: position.y, left: position.x, width: size.width, height: isMinimized ? 'auto' : size.height };
  
  return (
    <div
      ref={panelRef}
      className={`fixed z-50 bg-[#1a1a2e] border border-white/10 rounded-lg shadow-2xl flex flex-col overflow-hidden ${
        isMaximized ? 'rounded-none' : ''
      }`}
      style={panelStyle}
    >
      {/* Header */}
      <div 
        className="flex items-center justify-between px-3 py-2 bg-[#16162a] border-b border-white/10 cursor-move select-none"
        onMouseDown={handleDragStart}
      >
        <div className="flex items-center gap-2">
          <Activity size={14} className="text-indigo-400" />
          <span className="text-sm font-medium text-gray-200">State Viewer</span>
          {isRunning && (
            <span className="flex items-center gap-1 text-[10px] bg-green-500/20 text-green-400 px-2 py-0.5 rounded-full">
              <span className="w-1.5 h-1.5 bg-green-400 rounded-full animate-pulse" />
              Running
            </span>
          )}
          {isPaused && (
            <span className="text-[10px] bg-yellow-500/20 text-yellow-400 px-2 py-0.5 rounded-full">
              Paused
            </span>
          )}
        </div>
        <div className="flex items-center gap-1">
          <button
            onClick={openInNewWindow}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title="Open in new window"
          >
            <ExternalLink size={14} className="text-gray-400" />
          </button>
          <button
            onClick={() => setIsMinimized(!isMinimized)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title={isMinimized ? 'Expand' : 'Minimize'}
          >
            <Minus size={14} className="text-gray-400" />
          </button>
          <button
            onClick={() => setIsMaximized(!isMaximized)}
            className="p-1 hover:bg-white/10 rounded transition-colors"
            title={isMaximized ? 'Restore' : 'Maximize'}
          >
            {isMaximized ? (
              <Minimize2 size={14} className="text-gray-400" />
            ) : (
              <Maximize2 size={14} className="text-gray-400" />
            )}
          </button>
          <button
            onClick={onClose}
            className="p-1 hover:bg-red-500/20 rounded transition-colors"
            title="Close"
          >
            <X size={14} className="text-gray-400" />
          </button>
        </div>
      </div>
      
      {!isMinimized && (
        <>
          {/* Tabs */}
          <div className="flex border-b border-white/10">
            <button
              onClick={() => setActiveTab('state')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors ${
                activeTab === 'state'
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <Database size={12} />
              State
            </button>
            <button
              onClick={() => setActiveTab('steps')}
              className={`flex items-center gap-2 px-4 py-2 text-xs font-medium transition-colors ${
                activeTab === 'steps'
                  ? 'text-indigo-400 border-b-2 border-indigo-400'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
            >
              <List size={12} />
              Steps
              {snapshots.length > 0 && (
                <span className="text-[10px] bg-white/10 px-1.5 rounded">
                  {snapshots.length}
                </span>
              )}
            </button>
          </div>
          
          {/* Content */}
          <div className="flex-1 overflow-hidden flex">
            {activeTab === 'state' && (
              <div className="flex-1 flex flex-col overflow-hidden">
                {/* Search and actions */}
                <div className="flex items-center gap-2 p-2 border-b border-white/5">
                  <div className="flex-1 relative">
                    <Search size={12} className="absolute left-2 top-1/2 -translate-y-1/2 text-gray-500" />
                    <input
                      type="text"
                      value={searchTerm}
                      onChange={(e) => setSearchTerm(e.target.value)}
                      placeholder="Filter state..."
                      className="w-full pl-7 pr-2 py-1 text-xs bg-white/5 border border-white/10 rounded text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                    />
                  </div>
                  <button
                    onClick={copyState}
                    className="flex items-center gap-1 px-2 py-1 text-xs bg-white/5 hover:bg-white/10 rounded transition-colors"
                    title="Copy state as JSON"
                  >
                    {copied ? (
                      <Check size={12} className="text-green-400" />
                    ) : (
                      <Copy size={12} className="text-gray-400" />
                    )}
                  </button>
                </div>
                
                {/* Current node indicator */}
                {currentNodeId && (
                  <div className="px-3 py-2 bg-indigo-500/10 border-b border-indigo-500/20 text-xs">
                    <span className="text-gray-400">Current Node: </span>
                    <span className="text-indigo-400 font-medium">{currentNodeId}</span>
                  </div>
                )}
                
                {/* State tree */}
                <div className="flex-1 overflow-auto p-2">
                  {Object.keys(displayContext).length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs">
                      <Database size={24} className="mb-2 opacity-50" />
                      <p>No state data yet</p>
                      <p className="text-gray-600">Start the workflow to see state</p>
                    </div>
                  ) : (
                    <div className="space-y-1">
                      {Object.entries(displayContext).map(([key, value]) => (
                        <JsonTreeNode 
                          key={key} 
                          name={key} 
                          value={value as NodeOutput}
                          searchTerm={searchTerm}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeTab === 'steps' && (
              <div className="flex flex-1 overflow-hidden">
                {/* Steps list */}
                <div className="w-1/2 border-r border-white/10 overflow-y-auto">
                  {snapshots.length === 0 ? (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs">
                      <List size={24} className="mb-2 opacity-50" />
                      <p>No steps recorded</p>
                    </div>
                  ) : (
                    <div>
                      {snapshots.map((snapshot) => (
                        <StepItem
                          key={snapshot.id}
                          snapshot={snapshot}
                          isSelected={selectedSnapshotId === snapshot.id}
                          onClick={() => setSelectedSnapshotId(
                            selectedSnapshotId === snapshot.id ? null : snapshot.id
                          )}
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Selected step detail */}
                <div className="w-1/2 overflow-y-auto p-2">
                  {selectedSnapshotId ? (
                    <div className="space-y-2">
                      <h4 className="text-xs font-medium text-gray-300">
                        State at this step:
                      </h4>
                      {Object.entries(displayContext).map(([key, value]) => (
                        <JsonTreeNode 
                          key={key} 
                          name={key} 
                          value={value as NodeOutput}
                        />
                      ))}
                    </div>
                  ) : (
                    <div className="flex flex-col items-center justify-center h-full text-gray-500 text-xs">
                      <p>Select a step to view state</p>
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
          
          {/* Status bar */}
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#16162a] border-t border-white/10 text-[10px] text-gray-500">
            <span>
              {Object.keys(displayContext).length} node outputs
            </span>
            <span>
              Status: <span className={
                executionStatus === 'completed' ? 'text-green-400' :
                executionStatus === 'running' ? 'text-blue-400' :
                executionStatus === 'failed' ? 'text-red-400' :
                'text-gray-400'
              }>{executionStatus}</span>
            </span>
          </div>
          
          {/* Resize handle */}
          {!isMaximized && (
            <div
              className="absolute right-0 bottom-0 w-4 h-4 cursor-se-resize"
              onMouseDown={handleResizeStart}
            >
              <div className="absolute right-1 bottom-1 w-2 h-2 border-r-2 border-b-2 border-white/20" />
            </div>
          )}
        </>
      )}
    </div>
  );
}
