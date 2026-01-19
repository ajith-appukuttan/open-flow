import { useState, useEffect, useCallback } from 'react';
import { 
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
  List,
  RefreshCw
} from 'lucide-react';
import type { StateSnapshot, WorkflowContext, NodeOutput } from '../../services/workflowRunner';

interface StateViewerData {
  snapshots: StateSnapshot[];
  currentContext: WorkflowContext;
  currentNodeId: string | null;
  isRunning: boolean;
  isPaused: boolean;
  executionStatus: string;
}

type TabType = 'state' | 'steps';

// BroadcastChannel name for communication
const CHANNEL_NAME = 'workflow-state-viewer';

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
        <span className="text-purple-400 font-mono text-sm">{name}:</span>
        <span className={`font-mono text-sm ${getTypeColor()}`}>{renderValue()}</span>
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
          <ChevronDown size={14} className="text-gray-500" />
        ) : (
          <ChevronRight size={14} className="text-gray-500" />
        )}
        <span className="text-purple-400 font-mono text-sm">{name}:</span>
        <span className="text-gray-500 font-mono text-sm">{preview}</span>
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

// Step item component
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
      return <Circle size={14} className="text-blue-400" />;
    }
    if (snapshot.action.includes('NODE_OUTPUT')) {
      return <CheckCircle2 size={14} className="text-green-400" />;
    }
    if (snapshot.action.includes('COMPLETE')) {
      return <CheckCircle2 size={14} className="text-green-500" />;
    }
    if (snapshot.action.includes('STOPPED') || snapshot.action.includes('ERROR')) {
      return <XCircle size={14} className="text-red-400" />;
    }
    return <Circle size={14} className="text-gray-400" />;
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
      className={`p-3 cursor-pointer border-l-4 transition-colors ${
        isSelected 
          ? 'bg-indigo-500/20 border-indigo-500' 
          : 'border-transparent hover:bg-white/5'
      }`}
      onClick={onClick}
    >
      <div className="flex items-center gap-2">
        {getStatusIcon()}
        <span className="text-sm font-medium text-gray-200 truncate flex-1">
          {snapshot.action}
        </span>
      </div>
      <div className="flex items-center gap-2 mt-1 ml-6">
        <Clock size={12} className="text-gray-500" />
        <span className="text-xs text-gray-500 font-mono">
          {formatTime(snapshot.timestamp)}
        </span>
        {snapshot.nodeLabel && (
          <span className="text-xs text-indigo-400 bg-indigo-400/10 px-1.5 py-0.5 rounded">
            {snapshot.nodeLabel}
          </span>
        )}
      </div>
      {snapshot.diff && (
        <div className="flex gap-3 mt-1 ml-6">
          {snapshot.diff.added && (
            <span className="text-xs text-green-400">
              +{snapshot.diff.added.length} added
            </span>
          )}
          {snapshot.diff.modified && (
            <span className="text-xs text-yellow-400">
              ~{snapshot.diff.modified.length} modified
            </span>
          )}
          {snapshot.diff.removed && (
            <span className="text-xs text-red-400">
              -{snapshot.diff.removed.length} removed
            </span>
          )}
        </div>
      )}
    </div>
  );
}

export default function StateViewerPopout() {
  const [data, setData] = useState<StateViewerData | null>(null);
  const [activeTab, setActiveTab] = useState<TabType>('state');
  const [selectedSnapshotId, setSelectedSnapshotId] = useState<string | null>(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [copied, setCopied] = useState(false);
  const [isConnected, setIsConnected] = useState(false);
  
  // Initialize from localStorage and set up BroadcastChannel
  useEffect(() => {
    // Try to get initial data from localStorage
    const storedData = localStorage.getItem('stateViewerData');
    if (storedData) {
      try {
        setData(JSON.parse(storedData));
      } catch (e) {
        console.error('Failed to parse stored state viewer data:', e);
      }
    }
    
    // Set up BroadcastChannel for real-time updates
    const channel = new BroadcastChannel(CHANNEL_NAME);
    
    channel.onmessage = (event) => {
      if (event.data.type === 'STATE_UPDATE') {
        setData(event.data.payload);
        setIsConnected(true);
      }
    };
    
    // Request initial state from main window
    channel.postMessage({ type: 'REQUEST_STATE' });
    
    // Set up storage listener as fallback
    const handleStorage = (e: StorageEvent) => {
      if (e.key === 'stateViewerData' && e.newValue) {
        try {
          setData(JSON.parse(e.newValue));
        } catch (err) {
          console.error('Failed to parse storage update:', err);
        }
      }
    };
    
    window.addEventListener('storage', handleStorage);
    
    return () => {
      channel.close();
      window.removeEventListener('storage', handleStorage);
    };
  }, []);
  
  // Update document title
  useEffect(() => {
    document.title = `State Viewer ${data?.isRunning ? '● Running' : data?.isPaused ? '◐ Paused' : '○'}`;
  }, [data?.isRunning, data?.isPaused]);
  
  const displayContext = selectedSnapshotId && data
    ? data.snapshots.find(s => s.id === selectedSnapshotId)?.context || data.currentContext
    : data?.currentContext || {};
  
  const copyState = useCallback(() => {
    navigator.clipboard.writeText(JSON.stringify(displayContext, null, 2));
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [displayContext]);
  
  const refreshData = useCallback(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME);
    channel.postMessage({ type: 'REQUEST_STATE' });
    channel.close();
    
    // Also try localStorage
    const storedData = localStorage.getItem('stateViewerData');
    if (storedData) {
      try {
        setData(JSON.parse(storedData));
      } catch (e) {
        console.error('Failed to parse stored data:', e);
      }
    }
  }, []);
  
  return (
    <div className="min-h-screen bg-[#0f0f1a] text-white">
      {/* Header */}
      <div className="sticky top-0 z-10 bg-[#1a1a2e] border-b border-white/10">
        <div className="flex items-center justify-between px-4 py-3">
          <div className="flex items-center gap-3">
            <Activity size={20} className="text-indigo-400" />
            <span className="text-lg font-semibold text-gray-200">State Viewer</span>
            {data?.isRunning && (
              <span className="flex items-center gap-1.5 text-xs bg-green-500/20 text-green-400 px-2.5 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
                Running
              </span>
            )}
            {data?.isPaused && (
              <span className="text-xs bg-yellow-500/20 text-yellow-400 px-2.5 py-1 rounded-full">
                Paused
              </span>
            )}
            {isConnected && (
              <span className="text-xs bg-blue-500/20 text-blue-400 px-2.5 py-1 rounded-full">
                Connected
              </span>
            )}
          </div>
          <button
            onClick={refreshData}
            className="flex items-center gap-2 px-3 py-1.5 text-sm bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
          >
            <RefreshCw size={14} />
            Refresh
          </button>
        </div>
        
        {/* Tabs */}
        <div className="flex border-t border-white/5">
          <button
            onClick={() => setActiveTab('state')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'state'
                ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <Database size={16} />
            State
          </button>
          <button
            onClick={() => setActiveTab('steps')}
            className={`flex items-center gap-2 px-6 py-3 text-sm font-medium transition-colors ${
              activeTab === 'steps'
                ? 'text-indigo-400 border-b-2 border-indigo-400 bg-indigo-400/5'
                : 'text-gray-400 hover:text-gray-200'
            }`}
          >
            <List size={16} />
            Steps
            {data && data.snapshots.length > 0 && (
              <span className="text-xs bg-white/10 px-2 py-0.5 rounded">
                {data.snapshots.length}
              </span>
            )}
          </button>
        </div>
      </div>
      
      {/* Content */}
      {!data ? (
        <div className="flex flex-col items-center justify-center min-h-[60vh] text-gray-500">
          <Activity size={48} className="mb-4 opacity-50" />
          <p className="text-lg">No state data available</p>
          <p className="text-sm mt-2">Start a workflow test to see state</p>
          <button
            onClick={refreshData}
            className="mt-4 flex items-center gap-2 px-4 py-2 bg-indigo-500/20 text-indigo-400 rounded-lg hover:bg-indigo-500/30 transition-colors"
          >
            <RefreshCw size={16} />
            Refresh
          </button>
        </div>
      ) : (
        <div className="flex h-[calc(100vh-120px)]">
          {activeTab === 'state' && (
            <div className="flex-1 flex flex-col overflow-hidden">
              {/* Search and actions */}
              <div className="flex items-center gap-3 p-4 border-b border-white/5">
                <div className="flex-1 relative">
                  <Search size={16} className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-500" />
                  <input
                    type="text"
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    placeholder="Filter state..."
                    className="w-full pl-10 pr-4 py-2 text-sm bg-white/5 border border-white/10 rounded-lg text-gray-200 placeholder-gray-500 focus:outline-none focus:border-indigo-500"
                  />
                </div>
                <button
                  onClick={copyState}
                  className="flex items-center gap-2 px-4 py-2 text-sm bg-white/5 hover:bg-white/10 rounded-lg transition-colors"
                  title="Copy state as JSON"
                >
                  {copied ? (
                    <>
                      <Check size={16} className="text-green-400" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Copy size={16} className="text-gray-400" />
                      Copy JSON
                    </>
                  )}
                </button>
              </div>
              
              {/* Current node */}
              {data.currentNodeId && (
                <div className="px-4 py-3 bg-indigo-500/10 border-b border-indigo-500/20">
                  <span className="text-sm text-gray-400">Current Node: </span>
                  <span className="text-sm text-indigo-400 font-medium">{data.currentNodeId}</span>
                </div>
              )}
              
              {/* State tree */}
              <div className="flex-1 overflow-auto p-4">
                {Object.keys(displayContext).length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <Database size={32} className="mb-3 opacity-50" />
                    <p className="text-sm">No state data yet</p>
                    <p className="text-xs text-gray-600 mt-1">Start the workflow to see state</p>
                  </div>
                ) : (
                  <div className="space-y-2">
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
                {data.snapshots.length === 0 ? (
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <List size={32} className="mb-3 opacity-50" />
                    <p className="text-sm">No steps recorded</p>
                  </div>
                ) : (
                  <div className="divide-y divide-white/5">
                    {data.snapshots.map((snapshot) => (
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
              <div className="w-1/2 overflow-y-auto p-4">
                {selectedSnapshotId ? (
                  <div className="space-y-3">
                    <h4 className="text-sm font-medium text-gray-300 border-b border-white/10 pb-2">
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
                  <div className="flex flex-col items-center justify-center h-full text-gray-500">
                    <p className="text-sm">Select a step to view state at that point</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      )}
      
      {/* Status bar */}
      <div className="fixed bottom-0 left-0 right-0 flex items-center justify-between px-4 py-2 bg-[#16162a] border-t border-white/10 text-xs text-gray-500">
        <span>
          {Object.keys(displayContext).length} node outputs • {data?.snapshots.length || 0} steps
        </span>
        <span>
          Status: <span className={
            data?.executionStatus === 'completed' ? 'text-green-400' :
            data?.executionStatus === 'running' ? 'text-blue-400' :
            data?.executionStatus === 'failed' ? 'text-red-400' :
            'text-gray-400'
          }>{data?.executionStatus || 'idle'}</span>
        </span>
      </div>
    </div>
  );
}

// Export the channel name for use in the main app
export { CHANNEL_NAME };
