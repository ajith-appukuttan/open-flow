import { useEffect, useState, useMemo } from 'react';
import {
  Settings,
  Type,
  FileText,
  Hash,
  GitBranch,
  RefreshCw,
  Layers,
  X,
  Globe,
  Play,
  Loader2,
  CheckCircle,
  AlertCircle,
  Braces,
  Copy,
} from 'lucide-react';
import { useWorkflowStore } from '../../store/workflowStore';
import KeyValueEditor from './KeyValueEditor';
import FormBuilder from '../FormBuilder/FormBuilder';
import type { WorkflowNodeData, NodeType, ApiConfig, KeyValuePair, HttpMethod, WorkflowNode, WorkflowEdge, FormConfig } from '../../types/workflow';

const nodeTypeLabels: Record<NodeType, { label: string; icon: React.ReactNode }> = {
  start: { label: 'Start Node', icon: <div className="w-3 h-3 rounded-full bg-emerald-500" /> },
  end: { label: 'End Node', icon: <div className="w-3 h-3 rounded-full bg-red-500" /> },
  action: { label: 'Action Node', icon: <div className="w-3 h-3 rounded bg-blue-500" /> },
  decision: { label: 'Decision Node', icon: <div className="w-3 h-3 rotate-45 bg-amber-500" /> },
  parallel: { label: 'Parallel Node', icon: <div className="w-3 h-3 rounded bg-purple-500" /> },
  loop: { label: 'Loop Node', icon: <div className="w-3 h-3 rounded-full bg-orange-500" /> },
  form: { label: 'Form Node', icon: <div className="w-3 h-3 rounded bg-violet-500" /> },
};

const HTTP_METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE'];

const defaultApiConfig: ApiConfig = {
  url: '',
  method: 'GET',
  headers: [],
  body: '',
  queryParams: [],
};

interface ApiTestResult {
  status: number;
  statusText: string;
  data: unknown;
  error?: string;
}

// Helper function to get all upstream nodes (nodes that can execute before the selected node)
function getUpstreamNodes(
  selectedNodeId: string,
  nodes: WorkflowNode[],
  edges: WorkflowEdge[]
): WorkflowNode[] {
  const upstream: Set<string> = new Set();
  const visited: Set<string> = new Set();
  
  // Build a reverse adjacency list (target -> sources)
  const reverseGraph: Map<string, string[]> = new Map();
  edges.forEach(edge => {
    const sources = reverseGraph.get(edge.target) || [];
    sources.push(edge.source);
    reverseGraph.set(edge.target, sources);
  });
  
  // BFS to find all upstream nodes
  const queue = [selectedNodeId];
  while (queue.length > 0) {
    const nodeId = queue.shift()!;
    if (visited.has(nodeId)) continue;
    visited.add(nodeId);
    
    const sources = reverseGraph.get(nodeId) || [];
    sources.forEach(sourceId => {
      if (!visited.has(sourceId)) {
        upstream.add(sourceId);
        queue.push(sourceId);
      }
    });
  }
  
  // Return nodes that are upstream, excluding the selected node itself
  return nodes.filter(n => upstream.has(n.id));
}

// Helper function to generate available variable suggestions
function getVariableSuggestions(upstreamNodes: WorkflowNode[]): { variable: string; description: string }[] {
  const suggestions: { variable: string; description: string }[] = [];
  
  upstreamNodes.forEach(node => {
    const nodeType = node.type as NodeType;
    const label = node.data.label;
    
    // All nodes have a response
    suggestions.push({
      variable: `{{${label}.response}}`,
      description: `Full response from "${label}"`,
    });
    
    // Add type-specific suggestions
    if (nodeType === 'action') {
      if (node.data.actionType === 'api_call') {
        suggestions.push({
          variable: `{{${label}.response.data}}`,
          description: `Response data from API call`,
        });
        suggestions.push({
          variable: `{{${label}.response.id}}`,
          description: `ID field from response (example)`,
        });
        suggestions.push({
          variable: `{{${label}.status}}`,
          description: `HTTP status code`,
        });
      }
    } else if (nodeType === 'decision') {
      suggestions.push({
        variable: `{{${label}.response.selectedOption}}`,
        description: `Selected decision option`,
      });
    } else if (nodeType === 'loop') {
      suggestions.push({
        variable: `{{${label}.response.iteration}}`,
        description: `Current loop iteration number`,
      });
    }
  });
  
  return suggestions;
}

export default function PropertiesPanel() {
  const {
    workflow,
    selectedNodeId,
    selectedEdgeId,
    propertiesPanelOpen,
    updateNodeData,
    updateEdgeData,
    togglePropertiesPanel,
  } = useWorkflowStore();

  const selectedNode = workflow?.nodes.find((n) => n.id === selectedNodeId);
  const selectedEdge = workflow?.edges.find((e) => e.id === selectedEdgeId);

  const [nodeData, setNodeData] = useState<Partial<WorkflowNodeData>>({});
  const [edgeLabel, setEdgeLabel] = useState('');
  const [apiConfig, setApiConfig] = useState<ApiConfig>(defaultApiConfig);
  const [isTestingApi, setIsTestingApi] = useState(false);
  const [apiTestResult, setApiTestResult] = useState<ApiTestResult | null>(null);
  const [showVariablesHelp, setShowVariablesHelp] = useState(false);
  const [copiedVariable, setCopiedVariable] = useState<string | null>(null);

  // Calculate upstream nodes and available variables
  const upstreamNodes = useMemo(() => {
    if (!selectedNodeId || !workflow) return [];
    return getUpstreamNodes(selectedNodeId, workflow.nodes, workflow.edges);
  }, [selectedNodeId, workflow]);

  const variableSuggestions = useMemo(() => {
    return getVariableSuggestions(upstreamNodes);
  }, [upstreamNodes]);

  const handleCopyVariable = (variable: string) => {
    navigator.clipboard.writeText(variable);
    setCopiedVariable(variable);
    setTimeout(() => setCopiedVariable(null), 2000);
  };

  useEffect(() => {
    if (selectedNode) {
      setNodeData(selectedNode.data);
      setApiConfig(selectedNode.data.apiConfig || defaultApiConfig);
      setApiTestResult(null);
    } else {
      setNodeData({});
      setApiConfig(defaultApiConfig);
      setApiTestResult(null);
    }
  }, [selectedNode]);

  useEffect(() => {
    if (selectedEdge) {
      // Edge label can be a string or React node, we only want strings
      const label = typeof selectedEdge.label === 'string' 
        ? selectedEdge.label 
        : (selectedEdge.data?.label as string | undefined) || '';
      setEdgeLabel(label);
    } else {
      setEdgeLabel('');
    }
  }, [selectedEdge]);

  const handleNodeDataChange = (key: keyof WorkflowNodeData, value: string | number) => {
    setNodeData((prev) => ({ ...prev, [key]: value }));
    if (selectedNodeId) {
      updateNodeData(selectedNodeId, { [key]: value });
    }
  };

  const handleApiConfigChange = (updates: Partial<ApiConfig>) => {
    const newConfig = { ...apiConfig, ...updates };
    setApiConfig(newConfig);
    if (selectedNodeId) {
      updateNodeData(selectedNodeId, { apiConfig: newConfig });
    }
  };

  const handleEdgeLabelChange = (value: string) => {
    setEdgeLabel(value);
    if (selectedEdgeId) {
      updateEdgeData(selectedEdgeId, { label: value });
    }
  };

  const handleTestApi = async () => {
    if (!apiConfig.url) {
      setApiTestResult({ status: 0, statusText: 'Error', data: null, error: 'URL is required' });
      return;
    }

    setIsTestingApi(true);
    setApiTestResult(null);

    try {
      // Build URL with query params
      let url = apiConfig.url;
      if (apiConfig.queryParams.length > 0) {
        const params = new URLSearchParams();
        apiConfig.queryParams.forEach((p) => {
          if (p.key) params.append(p.key, p.value);
        });
        const queryString = params.toString();
        if (queryString) {
          url += (url.includes('?') ? '&' : '?') + queryString;
        }
      }

      // Build headers
      const headers: Record<string, string> = {};
      apiConfig.headers.forEach((h) => {
        if (h.key) headers[h.key] = h.value;
      });

      // Make request
      const options: RequestInit = {
        method: apiConfig.method,
        headers,
      };

      if (['POST', 'PUT', 'PATCH'].includes(apiConfig.method) && apiConfig.body) {
        options.body = apiConfig.body;
        if (!headers['Content-Type']) {
          headers['Content-Type'] = 'application/json';
        }
      }

      const response = await fetch(url, options);
      let data: unknown;
      
      const contentType = response.headers.get('content-type');
      if (contentType?.includes('application/json')) {
        data = await response.json();
      } else {
        data = await response.text();
      }

      setApiTestResult({
        status: response.status,
        statusText: response.statusText,
        data,
      });
    } catch (err) {
      setApiTestResult({
        status: 0,
        statusText: 'Error',
        data: null,
        error: (err as Error).message,
      });
    } finally {
      setIsTestingApi(false);
    }
  };

  if (!propertiesPanelOpen) return null;

  const hasSelection = selectedNode || selectedEdge;
  const isApiAction = selectedNode?.type === 'action' && nodeData.actionType === 'api_call';
  const isFormNode = selectedNode?.type === 'form';

  const defaultFormConfig: FormConfig = {
    title: '',
    description: '',
    components: [],
    submitLabel: 'Submit',
  };

  const handleFormConfigChange = (newConfig: FormConfig) => {
    if (selectedNodeId) {
      updateNodeData(selectedNodeId, { formConfig: newConfig });
    }
  };

  return (
    <aside className="w-80 bg-panel-bg border-l border-panel-border flex flex-col shrink-0">
      <div className="p-4 border-b border-panel-border flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Settings size={18} className="text-indigo-400" />
          <h2 className="text-sm font-semibold text-gray-300 uppercase tracking-wider">
            Properties
          </h2>
        </div>
        <button
          onClick={togglePropertiesPanel}
          className="p-1 hover:bg-panel-hover rounded transition-colors text-gray-500 hover:text-white"
        >
          <X size={18} />
        </button>
      </div>

      {!hasSelection ? (
        <div className="flex-1 flex items-center justify-center text-gray-500 p-4 text-center">
          <div>
            <Layers size={40} className="mx-auto mb-3 opacity-50" />
            <p className="text-sm">Select a node or edge to view its properties</p>
          </div>
        </div>
      ) : selectedNode ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {/* Node Type Badge */}
          <div className="flex items-center gap-2 px-3 py-2 bg-panel-hover rounded-lg">
            {nodeTypeLabels[selectedNode.type as NodeType]?.icon}
            <span className="text-sm font-medium text-gray-300">
              {nodeTypeLabels[selectedNode.type as NodeType]?.label}
            </span>
          </div>

          {/* Label */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Type size={14} />
              Label
            </label>
            <input
              type="text"
              value={nodeData.label || ''}
              onChange={(e) => handleNodeDataChange('label', e.target.value)}
              className="w-full bg-canvas-bg border border-panel-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              placeholder="Node label"
            />
          </div>

          {/* Description */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <FileText size={14} />
              Description
            </label>
            <textarea
              value={nodeData.description || ''}
              onChange={(e) => handleNodeDataChange('description', e.target.value)}
              rows={2}
              className="w-full bg-canvas-bg border border-panel-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none"
              placeholder="Optional description"
            />
          </div>

          {/* Action-specific fields */}
          {selectedNode.type === 'action' && (
            <>
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Settings size={14} />
                  Action Type
                </label>
                <select
                  value={nodeData.actionType || ''}
                  onChange={(e) => handleNodeDataChange('actionType', e.target.value)}
                  className="w-full bg-canvas-bg border border-panel-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                >
                  <option value="">Select action type</option>
                  <option value="api_call">API Call</option>
                  <option value="database">Database Operation</option>
                  <option value="notification">Send Notification</option>
                  <option value="transform">Transform Data</option>
                  <option value="validate">Validate</option>
                  <option value="custom">Custom Action</option>
                </select>
              </div>

              {/* API Configuration Section */}
              {isApiAction && (
                <div className="space-y-4 pt-4 border-t border-panel-border">
                  <div className="flex items-center gap-2 text-sm font-medium text-blue-400">
                    <Globe size={16} />
                    API Configuration
                  </div>

                  {/* URL */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">URL</label>
                    <input
                      type="text"
                      value={apiConfig.url}
                      onChange={(e) => handleApiConfigChange({ url: e.target.value })}
                      className="w-full bg-canvas-bg border border-panel-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                      placeholder="https://api.example.com/endpoint"
                    />
                  </div>

                  {/* Method */}
                  <div>
                    <label className="text-sm text-gray-400 mb-2 block">Method</label>
                    <select
                      value={apiConfig.method}
                      onChange={(e) => handleApiConfigChange({ method: e.target.value as HttpMethod })}
                      className="w-full bg-canvas-bg border border-panel-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                    >
                      {HTTP_METHODS.map((method) => (
                        <option key={method} value={method}>
                          {method}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Headers */}
                  <KeyValueEditor
                    label="Headers"
                    pairs={apiConfig.headers}
                    onChange={(headers: KeyValuePair[]) => handleApiConfigChange({ headers })}
                    keyPlaceholder="Header name"
                    valuePlaceholder="Header value"
                  />

                  {/* Query Params */}
                  <KeyValueEditor
                    label="Query Params"
                    pairs={apiConfig.queryParams}
                    onChange={(queryParams: KeyValuePair[]) => handleApiConfigChange({ queryParams })}
                    keyPlaceholder="Param name"
                    valuePlaceholder="Param value"
                  />

                  {/* Request Body (only for POST/PUT/PATCH) */}
                  {['POST', 'PUT', 'PATCH'].includes(apiConfig.method) && (
                    <div>
                      <label className="text-sm text-gray-400 mb-2 block">Request Body (JSON)</label>
                      <textarea
                        value={apiConfig.body}
                        onChange={(e) => handleApiConfigChange({ body: e.target.value })}
                        rows={4}
                        className="w-full bg-canvas-bg border border-panel-border rounded-lg px-3 py-2 text-sm text-gray-300 font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500 resize-none"
                        placeholder='{"key": "value"}'
                      />
                    </div>
                  )}

                  {/* Test API Button */}
                  <button
                    onClick={handleTestApi}
                    disabled={isTestingApi || !apiConfig.url}
                    className="w-full flex items-center justify-center gap-2 px-4 py-2.5 bg-blue-600 hover:bg-blue-500 disabled:bg-blue-600/50 disabled:cursor-not-allowed rounded-lg text-sm text-white font-medium transition-colors"
                  >
                    {isTestingApi ? (
                      <>
                        <Loader2 size={16} className="animate-spin" />
                        Testing...
                      </>
                    ) : (
                      <>
                        <Play size={16} />
                        Test API
                      </>
                    )}
                  </button>

                  {/* API Test Result */}
                  {apiTestResult && (
                    <div
                      className={`p-3 rounded-lg border ${
                        apiTestResult.error || apiTestResult.status >= 400
                          ? 'bg-red-500/10 border-red-500/30'
                          : 'bg-green-500/10 border-green-500/30'
                      }`}
                    >
                      <div className="flex items-center gap-2 mb-2">
                        {apiTestResult.error || apiTestResult.status >= 400 ? (
                          <AlertCircle size={16} className="text-red-400" />
                        ) : (
                          <CheckCircle size={16} className="text-green-400" />
                        )}
                        <span
                          className={`text-sm font-medium ${
                            apiTestResult.error || apiTestResult.status >= 400
                              ? 'text-red-400'
                              : 'text-green-400'
                          }`}
                        >
                          {apiTestResult.error
                            ? 'Error'
                            : `${apiTestResult.status} ${apiTestResult.statusText}`}
                        </span>
                      </div>
                      <pre className="text-xs text-gray-400 bg-canvas-bg rounded p-2 overflow-auto max-h-32">
                        {apiTestResult.error ||
                          (typeof apiTestResult.data === 'string'
                            ? apiTestResult.data
                            : JSON.stringify(apiTestResult.data, null, 2))}
                      </pre>
                    </div>
                  )}

                  {/* Available Variables Section */}
                  {upstreamNodes.length > 0 && (
                    <div className="pt-4 border-t border-panel-border">
                      <button
                        onClick={() => setShowVariablesHelp(!showVariablesHelp)}
                        className="w-full flex items-center justify-between gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                      >
                        <div className="flex items-center gap-2">
                          <Braces size={16} />
                          <span className="font-medium">Available Variables</span>
                        </div>
                        <span className="text-xs text-gray-500">
                          {showVariablesHelp ? '▲' : '▼'} {variableSuggestions.length} variables
                        </span>
                      </button>
                      
                      {showVariablesHelp && (
                        <div className="mt-3 space-y-2">
                          <p className="text-xs text-gray-500 mb-2">
                            Use these in URL, headers, body, or query params. Click to copy.
                          </p>
                          {variableSuggestions.map((suggestion, index) => (
                            <button
                              key={index}
                              onClick={() => handleCopyVariable(suggestion.variable)}
                              className="w-full text-left p-2 bg-canvas-bg hover:bg-panel-hover rounded-lg transition-colors group"
                            >
                              <div className="flex items-center justify-between">
                                <code className="text-xs text-purple-400 font-mono">
                                  {suggestion.variable}
                                </code>
                                {copiedVariable === suggestion.variable ? (
                                  <span className="text-xs text-green-400">Copied!</span>
                                ) : (
                                  <Copy size={12} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                                )}
                              </div>
                              <p className="text-xs text-gray-500 mt-1">{suggestion.description}</p>
                            </button>
                          ))}
                        </div>
                      )}
                    </div>
                  )}
                </div>
              )}
            </>
          )}

          {/* Decision-specific fields */}
          {selectedNode.type === 'decision' && (
            <div className="space-y-4">
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <GitBranch size={14} />
                  Condition
                </label>
                <input
                  type="text"
                  value={nodeData.condition || ''}
                  onChange={(e) => handleNodeDataChange('condition', e.target.value)}
                  className="w-full bg-canvas-bg border border-panel-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                  placeholder="e.g., {{Get User.response.active}} === true"
                />
                <p className="text-xs text-gray-500 mt-1">
                  Use <code className="text-purple-400">{'{{NodeLabel.response}}'}</code> to reference previous outputs
                </p>
              </div>

              {/* Available Variables for Decision */}
              {upstreamNodes.length > 0 && (
                <div className="pt-3 border-t border-panel-border">
                  <button
                    onClick={() => setShowVariablesHelp(!showVariablesHelp)}
                    className="w-full flex items-center justify-between gap-2 text-sm text-purple-400 hover:text-purple-300 transition-colors"
                  >
                    <div className="flex items-center gap-2">
                      <Braces size={16} />
                      <span className="font-medium">Available Variables</span>
                    </div>
                    <span className="text-xs text-gray-500">
                      {showVariablesHelp ? '▲' : '▼'} {variableSuggestions.length} variables
                    </span>
                  </button>
                  
                  {showVariablesHelp && (
                    <div className="mt-3 space-y-2">
                      <p className="text-xs text-gray-500 mb-2">
                        Click to copy. Use in condition to evaluate dynamic values.
                      </p>
                      {variableSuggestions.map((suggestion, index) => (
                        <button
                          key={index}
                          onClick={() => handleCopyVariable(suggestion.variable)}
                          className="w-full text-left p-2 bg-canvas-bg hover:bg-panel-hover rounded-lg transition-colors group"
                        >
                          <div className="flex items-center justify-between">
                            <code className="text-xs text-purple-400 font-mono">
                              {suggestion.variable}
                            </code>
                            {copiedVariable === suggestion.variable ? (
                              <span className="text-xs text-green-400">Copied!</span>
                            ) : (
                              <Copy size={12} className="text-gray-500 opacity-0 group-hover:opacity-100 transition-opacity" />
                            )}
                          </div>
                          <p className="text-xs text-gray-500 mt-1">{suggestion.description}</p>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Loop-specific fields */}
          {selectedNode.type === 'loop' && (
            <>
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <Hash size={14} />
                  Loop Count
                </label>
                <input
                  type="number"
                  value={nodeData.loopCount || ''}
                  onChange={(e) => handleNodeDataChange('loopCount', parseInt(e.target.value) || 0)}
                  min={0}
                  className="w-full bg-canvas-bg border border-panel-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                  placeholder="Number of iterations"
                />
              </div>
              <div>
                <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                  <RefreshCw size={14} />
                  Loop Condition
                </label>
                <input
                  type="text"
                  value={nodeData.loopCondition || ''}
                  onChange={(e) => handleNodeDataChange('loopCondition', e.target.value)}
                  className="w-full bg-canvas-bg border border-panel-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
                  placeholder="e.g., items.length > 0"
                />
              </div>
            </>
          )}

          {/* Parallel-specific fields */}
          {selectedNode.type === 'parallel' && (
            <div>
              <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
                <Hash size={14} />
                Number of Branches
              </label>
              <input
                type="number"
                value={nodeData.branches || 2}
                onChange={(e) => handleNodeDataChange('branches', parseInt(e.target.value) || 2)}
                min={2}
                max={10}
                className="w-full bg-canvas-bg border border-panel-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              />
            </div>
          )}

          {/* Form-specific fields - Form Builder */}
          {isFormNode && (
            <div className="pt-4 border-t border-panel-border -mx-4 -mb-4">
              <FormBuilder
                config={selectedNode.data.formConfig || defaultFormConfig}
                onChange={handleFormConfigChange}
              />
            </div>
          )}

          {/* Node ID (read-only) */}
          <div className="pt-4 border-t border-panel-border">
            <label className="text-xs text-gray-500 mb-1 block">Node ID</label>
            <code className="text-xs text-gray-400 bg-canvas-bg px-2 py-1 rounded block overflow-hidden text-ellipsis">
              {selectedNode.id}
            </code>
          </div>
        </div>
      ) : selectedEdge ? (
        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          <div className="flex items-center gap-2 px-3 py-2 bg-panel-hover rounded-lg">
            <div className="w-8 h-0.5 bg-indigo-500" />
            <span className="text-sm font-medium text-gray-300">Connection</span>
          </div>

          {/* Edge Label */}
          <div>
            <label className="flex items-center gap-2 text-sm text-gray-400 mb-2">
              <Type size={14} />
              Label
            </label>
            <input
              type="text"
              value={edgeLabel}
              onChange={(e) => handleEdgeLabelChange(e.target.value)}
              className="w-full bg-canvas-bg border border-panel-border rounded-lg px-3 py-2 text-sm text-gray-300 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 focus:border-indigo-500"
              placeholder="e.g., Yes, No, Success"
            />
          </div>

          {/* Connection Info */}
          <div className="pt-4 border-t border-panel-border space-y-2">
            <div>
              <label className="text-xs text-gray-500 mb-1 block">From</label>
              <code className="text-xs text-gray-400 bg-canvas-bg px-2 py-1 rounded block">
                {selectedEdge.source}
              </code>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">To</label>
              <code className="text-xs text-gray-400 bg-canvas-bg px-2 py-1 rounded block">
                {selectedEdge.target}
              </code>
            </div>
            <div>
              <label className="text-xs text-gray-500 mb-1 block">Edge ID</label>
              <code className="text-xs text-gray-400 bg-canvas-bg px-2 py-1 rounded block overflow-hidden text-ellipsis">
                {selectedEdge.id}
              </code>
            </div>
          </div>
        </div>
      ) : null}
    </aside>
  );
}
