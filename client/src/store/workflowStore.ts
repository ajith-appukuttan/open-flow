import { create } from 'zustand';
import {
  applyNodeChanges,
  applyEdgeChanges,
  addEdge,
  type NodeChange,
  type EdgeChange,
  type Connection,
} from '@xyflow/react';
import type { Workflow, WorkflowNode, WorkflowEdge, WorkflowListItem, WorkflowValidationResult } from '../types/workflow';
import * as api from '../api/workflowApi';
import { WorkflowRunner, type TestMessage, type WorkflowRunnerState, type WorkflowContext } from '../services/workflowRunner';

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
  },
  
  continueTestLoop: (shouldContinue) => {
    const { workflowRunner } = get();
    if (!workflowRunner) return;
    workflowRunner.continueLoop(shouldContinue);
  },
}));
