import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import type { Workflow, WorkflowNode, WorkflowEdge, WorkflowListItem, WorkflowValidationResult, WorkflowVersionListItem, ExecutionListItem, WorkflowExecution } from '../types/workflow';
import * as api from '../api/workflowApi';
import { WorkflowRunner, type TestMessage, type WorkflowRunnerState, type WorkflowContext, type WorkflowTelemetry, type StateSnapshot } from '../services/workflowRunner';
import { DEMO_WORKFLOW_DATA, hasGuestDemoBeenSeeded, markGuestDemoAsSeeded } from '../data/demoWorkflow';
import { webSocketService } from '../services/WebSocketService';

interface WorkflowState {
  // Current workflow
  workflow: Workflow | null;

  // Workflow list
  workflows: WorkflowListItem[];

  // UI state
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;
  validationResult: WorkflowValidationResult | null;
  sidebarOpen: boolean;
  propertiesPanelOpen: boolean;

  // Test mode state
  isTestMode: boolean;
  testDrawerOpen: boolean;
  testDrawerHeight: number;
  testMessages: TestMessage[];
  currentTestNodeId: string | null;
  visitedTestNodeIds: string[];
  isTestRunning: boolean;
  isTestPaused: boolean;
  workflowRunner: WorkflowRunner | null;
  workflowContext: WorkflowContext;
  workflowTelemetry: WorkflowTelemetry | null;

  // Version state
  versions: (WorkflowVersionListItem & { isCurrent: boolean })[];
  selectedVersion: number | null;
  isLoadingVersions: boolean;
  sidebarTab: 'workflows' | 'versions' | 'executions';

  // Execution state
  executions: ExecutionListItem[];
  selectedExecution: WorkflowExecution | null;
  isLoadingExecutions: boolean;

  // State viewer state
  stateViewerOpen: boolean;
  stateSnapshots: StateSnapshot[];

  // Remote execution state
  isRemoteMode: boolean;
  remoteRole: 'HOST' | 'REMOTE' | null;

  // Actions
  setWorkflow: (workflow: Workflow | null) => void;
  setNodes: (nodes: WorkflowNode[]) => void;
  setEdges: (edges: WorkflowEdge[]) => void;
  onNodesChange: (changes: NodeChange<WorkflowNode>[]) => void;
  onEdgesChange: (changes: EdgeChange<WorkflowEdge>[]) => void;
  onConnect: (connection: Connection) => void;
  addNode: (node: WorkflowNode) => void;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNode['data']>) => void;
  updateEdgeData: (edgeId: string, data: Partial<WorkflowEdge['data']>) => void;
  deleteSelected: () => void;
  selectNode: (nodeId: string | null) => void;
  selectEdge: (edgeId: string | null) => void;

  // Workflow management
  loadWorkflows: () => Promise<void>;
  loadWorkflow: (id: string) => Promise<void>;
  createWorkflow: (name: string, description?: string) => Promise<void>;
  saveWorkflow: () => Promise<void>;
  deleteWorkflow: (id: string) => Promise<void>;
  duplicateWorkflow: (id: string) => Promise<void>;
  validateWorkflow: () => Promise<void>;
  exportWorkflow: () => void;
  importWorkflow: (json: string) => Promise<void>;
  seedDemoWorkflowForGuest: () => Promise<void>;

  // UI actions
  toggleSidebar: () => void;
  togglePropertiesPanel: () => void;
  setError: (error: string | null) => void;

  // Test mode actions
  openTestDrawer: () => void;
  closeTestDrawer: () => void;
  setTestDrawerHeight: (height: number) => void;
  startTest: () => void;
  stopTest: () => void;
  resetTest: () => void;
  selectTestOption: (optionId: string) => void;
  continueTestLoop: (shouldContinue: boolean) => void;
  submitForm: (formData: Record<string, unknown>) => void;

  // Version actions
  setSidebarTab: (tab: 'workflows' | 'versions' | 'executions') => void;
  loadVersions: () => Promise<void>;
  previewVersion: (version: number) => Promise<void>;
  restoreVersion: (version: number) => Promise<void>;
  clearVersionPreview: () => void;

  // Execution actions
  loadExecutions: () => Promise<void>;
  viewExecution: (executionId: string) => Promise<void>;
  clearExecutionView: () => void;
  deleteExecution: (executionId: string) => Promise<void>;

  // State viewer actions
  toggleStateViewer: () => void;
  openStateViewer: () => void;
  closeStateViewer: () => void;

  // Remote execution actions
  startRemoteSession: (role: 'HOST' | 'REMOTE') => void;
  handleRemoteMessage: (data: any) => void;
}

const createDefaultWorkflow = (): Workflow => ({
  id: '',
  name: 'Untitled Workflow',
  description: '',
  createdAt: new Date().toISOString(),
  updatedAt: new Date().toISOString(),
  nodes: [
    {
      id: 'start-1',
      type: 'start',
      position: { x: 250, y: 100 },
      data: { label: 'Start' },
    },
  ],
  edges: [],
});

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  workflow: createDefaultWorkflow(),
  workflows: [],
  selectedNodeId: null,
  selectedEdgeId: null,
  isSaving: false,
  isLoading: false,
  error: null,
  validationResult: null,
  sidebarOpen: true,
  propertiesPanelOpen: true,

  // Test mode initial state
  isTestMode: false,
  testDrawerOpen: false,
  testDrawerHeight: 300,
  testMessages: [],
  currentTestNodeId: null,
  visitedTestNodeIds: [],
  isTestRunning: false,
  isTestPaused: false,
  workflowRunner: null,
  workflowContext: {},
  workflowTelemetry: null,

  // Version initial state
  versions: [],
  selectedVersion: null,
  isLoadingVersions: false,
  sidebarTab: 'workflows',

  // Execution initial state
  executions: [],
  selectedExecution: null,
  isLoadingExecutions: false,

  // State viewer initial state
  stateViewerOpen: false,
  stateSnapshots: [],

  // Remote execution initial state
  isRemoteMode: false,
  remoteRole: null,

  setWorkflow: (workflow) => set({ workflow, selectedNodeId: null, selectedEdgeId: null }),

  setNodes: (nodes) => {
    const workflow = get().workflow;
    if (workflow) {
      set({ workflow: { ...workflow, nodes } });
    }
  },

  setEdges: (edges) => {
    const workflow = get().workflow;
    if (workflow) {
      set({ workflow: { ...workflow, edges } });
    }
  },

  onNodesChange: (changes) => {
    const workflow = get().workflow;
    if (workflow) {
      const nodes = applyNodeChanges(changes, workflow.nodes);
      set({ workflow: { ...workflow, nodes } });
    }
  },

  onEdgesChange: (changes) => {
    const workflow = get().workflow;
    if (workflow) {
      const edges = applyEdgeChanges(changes, workflow.edges);
      set({ workflow: { ...workflow, edges } });
    }
  },

  onConnect: (connection) => {
    const workflow = get().workflow;
    if (workflow) {
      const edges = addEdge(
        { ...connection, id: `edge-${Date.now()}`, type: 'smoothstep' },
        workflow.edges
      );
      set({ workflow: { ...workflow, edges } });
    }
  },

  addNode: (node) => {
    const workflow = get().workflow;
    if (workflow) {
      set({ workflow: { ...workflow, nodes: [...workflow.nodes, node] } });
    }
  },

  updateNodeData: (nodeId, data) => {
    const workflow = get().workflow;
    if (workflow) {
      const nodes = workflow.nodes.map((node) =>
        node.id === nodeId ? { ...node, data: { ...node.data, ...data } } : node
      );
      set({ workflow: { ...workflow, nodes } });
    }
  },

  updateEdgeData: (edgeId, data) => {
    const workflow = get().workflow;
    if (workflow) {
      const edges = workflow.edges.map((edge) =>
        edge.id === edgeId ? { ...edge, data: { ...edge.data, ...data } } : edge
      );
      set({ workflow: { ...workflow, edges } });
    }
  },

  deleteSelected: () => {
    const { workflow, selectedNodeId, selectedEdgeId } = get();
    if (!workflow) return;

    if (selectedNodeId) {
      // Don't allow deleting the start node if it's the only one
      const startNodes = workflow.nodes.filter((n) => n.type === 'start');
      const nodeToDelete = workflow.nodes.find((n) => n.id === selectedNodeId);
      if (nodeToDelete?.type === 'start' && startNodes.length <= 1) {
        set({ error: 'Cannot delete the only Start node' });
        return;
      }

      const nodes = workflow.nodes.filter((n) => n.id !== selectedNodeId);
      const edges = workflow.edges.filter(
        (e) => e.source !== selectedNodeId && e.target !== selectedNodeId
      );
      set({ workflow: { ...workflow, nodes, edges }, selectedNodeId: null });
    } else if (selectedEdgeId) {
      const edges = workflow.edges.filter((e) => e.id !== selectedEdgeId);
      set({ workflow: { ...workflow, edges }, selectedEdgeId: null });
    }
  },

  selectNode: (nodeId) => set({ selectedNodeId: nodeId, selectedEdgeId: null }),
  selectEdge: (edgeId) => set({ selectedEdgeId: edgeId, selectedNodeId: null }),

  loadWorkflows: async () => {
    set({ isLoading: true, error: null });
    try {
      const workflows = await api.getWorkflows();
      set({ workflows, isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  seedDemoWorkflowForGuest: async () => {
    // Check if demo has already been seeded for this guest
    if (hasGuestDemoBeenSeeded()) {
      return;
    }

    try {
      // Create the demo workflow
      const workflow = await api.createWorkflow({
        name: DEMO_WORKFLOW_DATA.name,
        description: DEMO_WORKFLOW_DATA.description,
        nodes: DEMO_WORKFLOW_DATA.nodes,
        edges: DEMO_WORKFLOW_DATA.edges,
      });

      // Mark as seeded so we don't create it again
      markGuestDemoAsSeeded();

      // Load it as the current workflow and refresh the list
      set({ workflow });
      get().loadWorkflows();
    } catch (err) {
      console.error('Failed to seed demo workflow:', err);
      // Don't set error - this is a background operation
    }
  },

  loadWorkflow: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const workflow = await api.getWorkflow(id);
      set({ workflow, isLoading: false, selectedNodeId: null, selectedEdgeId: null });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  createWorkflow: async (name, description = '') => {
    set({ isLoading: true, error: null });
    try {
      const workflow = await api.createWorkflow({ name, description });
      set({ workflow, isLoading: false });
      get().loadWorkflows();
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  saveWorkflow: async () => {
    const { workflow } = get();
    if (!workflow) return;

    set({ isSaving: true, error: null });
    try {
      if (workflow.id) {
        const updated = await api.updateWorkflow(workflow.id, workflow);
        set({ workflow: updated, isSaving: false });
      } else {
        const created = await api.createWorkflow({
          name: workflow.name,
          description: workflow.description,
          nodes: workflow.nodes,
          edges: workflow.edges,
        });
        set({ workflow: created, isSaving: false });
      }
      get().loadWorkflows();
    } catch (err) {
      set({ error: (err as Error).message, isSaving: false });
    }
  },

  deleteWorkflow: async (id) => {
    set({ isLoading: true, error: null });
    try {
      await api.deleteWorkflow(id);
      const { workflow } = get();
      if (workflow?.id === id) {
        set({ workflow: createDefaultWorkflow() });
      }
      get().loadWorkflows();
      set({ isLoading: false });
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  duplicateWorkflow: async (id) => {
    set({ isLoading: true, error: null });
    try {
      const original = await api.getWorkflow(id);
      const duplicate = await api.createWorkflow({
        name: `${original.name} (Copy)`,
        description: original.description,
        nodes: original.nodes,
        edges: original.edges,
      });
      set({ workflow: duplicate, isLoading: false });
      get().loadWorkflows();
    } catch (err) {
      set({ error: (err as Error).message, isLoading: false });
    }
  },

  validateWorkflow: async () => {
    const { workflow } = get();
    if (!workflow?.id) {
      set({ error: 'Please save the workflow first' });
      return;
    }

    try {
      const result = await api.validateWorkflow(workflow.id);
      set({ validationResult: result });
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  exportWorkflow: () => {
    const { workflow } = get();
    if (!workflow) return;

    const blob = new Blob([JSON.stringify(workflow, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${workflow.name.replace(/\s+/g, '_')}.json`;
    a.click();
    URL.revokeObjectURL(url);
  },

  importWorkflow: async (json) => {
    try {
      const data = JSON.parse(json);
      const workflow = await api.createWorkflow({
        name: data.name || 'Imported Workflow',
        description: data.description || '',
        nodes: data.nodes || [],
        edges: data.edges || [],
      });
      set({ workflow });
      get().loadWorkflows();
    } catch {
      set({ error: 'Invalid workflow JSON' });
    }
  },

  toggleSidebar: () => set((state) => ({ sidebarOpen: !state.sidebarOpen })),
  togglePropertiesPanel: () => set((state) => ({ propertiesPanelOpen: !state.propertiesPanelOpen })),
  setError: (error) => set({ error }),

  // Test mode actions
  openTestDrawer: () => {
    set({ testDrawerOpen: true, isTestMode: true });
  },

  closeTestDrawer: () => {
    const { workflowRunner } = get();
    if (workflowRunner) {
      workflowRunner.stop();
    }
    set({
      testDrawerOpen: false,
      isTestMode: false,
      isTestRunning: false,
      isTestPaused: false,
      currentTestNodeId: null,
      workflowRunner: null,
    });
  },

  setTestDrawerHeight: (height) => {
    set({ testDrawerHeight: Math.max(150, Math.min(600, height)) });
  },

  startTest: () => {
    const { workflow } = get();
    if (!workflow) {
      set({ error: 'No workflow to test' });
      return;
    }

    const handleStateChange = (runnerState: WorkflowRunnerState) => {
      set({
        testMessages: runnerState.messages,
        currentTestNodeId: runnerState.currentNodeId,
        visitedTestNodeIds: runnerState.visitedNodeIds,
        isTestRunning: runnerState.isRunning,
        isTestPaused: runnerState.isPaused,
        workflowContext: runnerState.context,
        workflowTelemetry: runnerState.telemetry,
        stateSnapshots: runnerState.stateSnapshots,
      });
    };

    const runner = new WorkflowRunner(workflow, handleStateChange);
    set({
      workflowRunner: runner,
      testMessages: [],
      currentTestNodeId: null,
      visitedTestNodeIds: [],
      isTestRunning: true,
      isTestPaused: false,
    });

    // If hosting a remote session, notify remote client
    const { isRemoteMode, remoteRole } = get();
    if (isRemoteMode && remoteRole === 'HOST') {
      webSocketService.send({ type: 'START_WORKFLOW', workflow });
    }

    runner.start();
  },

  stopTest: () => {
    const { workflowRunner } = get();
    if (workflowRunner) {
      workflowRunner.stop();
    }
    set({
      isTestRunning: false,
      isTestPaused: false,
      currentTestNodeId: null,
    });
  },

  resetTest: () => {
    const { workflowRunner } = get();
    if (workflowRunner) {
      workflowRunner.reset();
    }
    set({
      testMessages: [],
      currentTestNodeId: null,
      visitedTestNodeIds: [],
      isTestRunning: false,
      isTestPaused: false,
      workflowContext: {},
      workflowTelemetry: null,
      stateSnapshots: [],
    });
  },

  selectTestOption: (optionId) => {
    const { workflowRunner, currentTestNodeId, workflow } = get();
    if (!workflowRunner || !currentTestNodeId || !workflow) return;

    const currentNode = workflow.nodes.find((n) => n.id === currentTestNodeId);
    if (!currentNode) return;

    if (currentNode.type === 'decision') {
      workflowRunner.selectDecisionOption(optionId);
    } else if (currentNode.type === 'parallel') {
      workflowRunner.selectParallelBranch(optionId);
    }

    // If hosting, send update to remote
    const { isRemoteMode, remoteRole } = get();
    if (isRemoteMode && remoteRole === 'HOST') {
      webSocketService.send({
        type: 'USER_INPUT_REQUEST',
        nodeId: currentTestNodeId,
        options: currentNode.data.options // relay options if needed, though remote might have workflow def
      });
    }
  },

  continueTestLoop: (shouldContinue) => {
    const { workflowRunner } = get();
    if (!workflowRunner) return;
    workflowRunner.continueLoop(shouldContinue);
  },

  submitForm: (formData) => {
    const { workflowRunner } = get();
    if (!workflowRunner) return;
    workflowRunner.submitForm(formData);

    // If hosting, notify remote (or if remote submitting to host)
    const { isRemoteMode, remoteRole } = get();
    if (isRemoteMode && remoteRole === 'REMOTE') {
      webSocketService.send({ type: 'USER_INPUT_RESPONSE', mb_data: formData });
    }
  },

  // Version actions
  setSidebarTab: (tab) => set({ sidebarTab: tab }),

  loadVersions: async () => {
    const { workflow } = get();
    if (!workflow?.id) {
      set({ versions: [] });
      return;
    }

    set({ isLoadingVersions: true });
    try {
      const versions = await api.getWorkflowVersions(workflow.id);
      set({ versions, isLoadingVersions: false });
    } catch (err) {
      console.error('Failed to load versions:', err);
      set({ versions: [], isLoadingVersions: false });
    }
  },

  previewVersion: async (version) => {
    const { workflow } = get();
    if (!workflow?.id) return;

    set({ isLoadingVersions: true, selectedVersion: version });
    try {
      const versionData = await api.getWorkflowVersion(workflow.id, version);
      // Temporarily update the canvas with this version's data
      set({
        workflow: {
          ...workflow,
          nodes: versionData.nodes,
          edges: versionData.edges,
        },
        isLoadingVersions: false,
      });
    } catch (err) {
      console.error('Failed to preview version:', err);
      set({ isLoadingVersions: false, selectedVersion: null });
    }
  },

  restoreVersion: async (version) => {
    const { workflow } = get();
    if (!workflow?.id) return;

    set({ isLoadingVersions: true });
    try {
      const restoredWorkflow = await api.restoreWorkflowVersion(workflow.id, version);
      set({
        workflow: restoredWorkflow,
        selectedVersion: null,
        isLoadingVersions: false,
      });
      // Reload versions to reflect the new current version
      get().loadVersions();
      get().loadWorkflows();
    } catch (err) {
      set({ error: (err as Error).message, isLoadingVersions: false });
    }
  },

  clearVersionPreview: () => {
    const { workflow, selectedVersion } = get();
    if (!workflow?.id || selectedVersion === null) return;

    // Reload the current version
    set({ selectedVersion: null });
    get().loadWorkflow(workflow.id);
  },

  // Execution actions
  loadExecutions: async () => {
    const { workflow } = get();
    if (!workflow?.id) {
      set({ executions: [] });
      return;
    }

    set({ isLoadingExecutions: true });
    try {
      const executions = await api.getExecutions(workflow.id);
      set({ executions, isLoadingExecutions: false });
    } catch (err) {
      console.error('Failed to load executions:', err);
      set({ executions: [], isLoadingExecutions: false });
    }
  },

  viewExecution: async (executionId) => {
    const { workflow } = get();
    if (!workflow?.id) return;

    set({ isLoadingExecutions: true });
    try {
      const execution = await api.getExecution(workflow.id, executionId);
      set({ selectedExecution: execution, isLoadingExecutions: false });
    } catch (err) {
      console.error('Failed to load execution:', err);
      set({ isLoadingExecutions: false, error: (err as Error).message });
    }
  },

  clearExecutionView: () => {
    set({ selectedExecution: null });
  },

  deleteExecution: async (executionId) => {
    const { workflow } = get();
    if (!workflow?.id) return;

    try {
      await api.deleteExecution(workflow.id, executionId);
      // Reload executions
      get().loadExecutions();
    } catch (err) {
      set({ error: (err as Error).message });
    }
  },

  // State viewer actions
  toggleStateViewer: () => set((state) => ({ stateViewerOpen: !state.stateViewerOpen })),
  openStateViewer: () => set({ stateViewerOpen: true }),
  closeStateViewer: () => set({ stateViewerOpen: false }),

  startRemoteSession: (role) => {
    webSocketService.connect(role);
    set({ isRemoteMode: true, remoteRole: role });

    webSocketService.onMessage((data) => {
      get().handleRemoteMessage(data);
    });
  },

  handleRemoteMessage: (data) => {
    const { remoteRole, workflowRunner, isTestRunning } = get();

    switch (data.type) {
      case 'START_WORKFLOW':
        if (remoteRole === 'REMOTE') {
          // In a real app, we might sync the workflow definition here
          // For now assuming same workflow or just entering "listen" mode
          set({ isTestRunning: true, testMessages: [], isTestPaused: false });
          console.log('Remote started workflow');
        }
        break;
      case 'WORKFLOW_STATUS':
        // Update local view based on host status
        if (remoteRole === 'REMOTE') {
          // This would need more complex syncing of runner state
        }
        break;
      case 'USER_INPUT_REQUEST':
        if (remoteRole === 'REMOTE') {
          set({
            isTestPaused: true,
            currentTestNodeId: data.nodeId,
            // Construct a fake message to trigger UI
            testMessages: [...get().testMessages, {
              id: Date.now().toString(),
              type: 'form', // or derive from node
              content: 'Remote requested input',
              timestamp: new Date(),
              nodeId: data.nodeId,
              options: data.options
            }]
          });
        }
        break;
      case 'USER_INPUT_RESPONSE':
        if (remoteRole === 'HOST' && isTestRunning && workflowRunner) {
          // Simulate user input on host
          workflowRunner.submitForm(data.mb_data);
        }
        break;
    }
  }
}));
