import type { Workflow, WorkflowNode, WorkflowEdge, NodeType, ApiConfig, KeyValuePair, WorkflowExecution, ExecutionStep, ExecutionStatus } from '../types/workflow';
import * as api from '../api/workflowApi';

export type MessageType = 'system' | 'node' | 'decision' | 'user' | 'success' | 'error' | 'loop' | 'parallel' | 'api' | 'api_response' | 'telemetry';

export interface TestMessage {
  id: string;
  type: MessageType;
  content: string;
  nodeId?: string;
  nodeType?: NodeType;
  timestamp: Date;
  options?: { id: string; label: string }[];
  apiResponse?: {
    status: number;
    statusText: string;
    data: unknown;
    error?: string;
  };
  telemetry?: WorkflowTelemetry;
}

// Context entry for storing node outputs
export interface NodeOutput {
  response: unknown;
  status?: number;
  statusText?: string;
  timestamp: Date;
  nodeType: NodeType;
}

// Workflow execution context - stores outputs from all executed nodes
export interface WorkflowContext {
  [nodeLabel: string]: NodeOutput;
}

// Telemetry types for tracking execution performance
export interface StepTelemetry {
  nodeId: string;
  nodeLabel: string;
  nodeType: NodeType;
  startTime: Date;
  endTime: Date;
  duration: number; // milliseconds
  status: 'success' | 'error' | 'skipped';
  metadata?: {
    apiUrl?: string;
    apiMethod?: string;
    apiStatus?: number;
    condition?: string;
    conditionResult?: boolean;
    loopIteration?: number;
  };
}

export interface WorkflowTelemetry {
  workflowId: string;
  workflowName: string;
  startTime: Date;
  endTime?: Date;
  totalDuration?: number; // milliseconds
  steps: StepTelemetry[];
  summary: {
    totalNodes: number;
    successCount: number;
    errorCount: number;
    avgStepDuration: number;
  };
}

export interface WorkflowRunnerState {
  isRunning: boolean;
  isPaused: boolean;
  currentNodeId: string | null;
  visitedNodeIds: string[];
  messages: TestMessage[];
  loopCounters: Record<string, number>;
  context: WorkflowContext;
  telemetry: WorkflowTelemetry | null;
  currentStepStartTime: Date | null;
  // Execution tracking
  executionSteps: ExecutionStep[];
  executionStartTime: Date | null;
  executionStatus: ExecutionStatus;
}

/**
 * Resolves a path like "nodeLabel.response.data.id" or "nodeLabel.response[0].name"
 * from the workflow context
 */
function getValueByPath(obj: unknown, path: string): unknown {
  const parts = path.match(/([^.\[\]]+)|\[(\d+)\]/g);
  if (!parts) return undefined;

  let current: unknown = obj;
  for (const part of parts) {
    if (current === null || current === undefined) return undefined;
    
    // Handle array index [0]
    if (part.startsWith('[') && part.endsWith(']')) {
      const index = parseInt(part.slice(1, -1));
      if (Array.isArray(current)) {
        current = current[index];
      } else {
        return undefined;
      }
    } else {
      // Handle object property
      if (typeof current === 'object' && current !== null) {
        current = (current as Record<string, unknown>)[part];
      } else {
        return undefined;
      }
    }
  }
  return current;
}

/**
 * Resolves all {{variable}} placeholders in a string using the workflow context
 * Supports paths like: {{NodeLabel.response}}, {{NodeLabel.response.data.id}}, {{NodeLabel.response[0].name}}
 */
function resolveVariables(template: string, context: WorkflowContext): string {
  if (!template || typeof template !== 'string') return template;
  
  // Match {{...}} patterns
  const variablePattern = /\{\{([^}]+)\}\}/g;
  
  return template.replace(variablePattern, (match, variablePath) => {
    const trimmedPath = variablePath.trim();
    
    // Split into node label and property path
    // Handle node labels with spaces by finding the first known context key
    let nodeLabel: string | null = null;
    let propertyPath: string = '';
    
    // Try to find a matching node label in context
    const contextKeys = Object.keys(context);
    for (const key of contextKeys) {
      if (trimmedPath.startsWith(key + '.') || trimmedPath === key) {
        nodeLabel = key;
        propertyPath = trimmedPath.slice(key.length + 1); // +1 for the dot
        break;
      }
    }
    
    if (!nodeLabel) {
      // Fallback: try splitting by first dot
      const firstDot = trimmedPath.indexOf('.');
      if (firstDot > 0) {
        nodeLabel = trimmedPath.slice(0, firstDot);
        propertyPath = trimmedPath.slice(firstDot + 1);
      } else {
        nodeLabel = trimmedPath;
        propertyPath = '';
      }
    }
    
    const nodeOutput = context[nodeLabel];
    if (!nodeOutput) {
      // Return original if node not found
      return match;
    }
    
    // If no property path, return the whole node output
    if (!propertyPath) {
      const value = nodeOutput.response;
      return typeof value === 'object' ? JSON.stringify(value) : String(value ?? '');
    }
    
    // Get the value at the path
    const value = getValueByPath(nodeOutput, propertyPath);
    
    if (value === undefined || value === null) {
      return match; // Return original if path not found
    }
    
    // Convert to string
    return typeof value === 'object' ? JSON.stringify(value) : String(value);
  });
}

/**
 * Safely evaluates a condition string and returns a boolean result.
 * Returns { success: true, result: boolean } if evaluation succeeds,
 * or { success: false, error: string } if it fails.
 */
function evaluateCondition(condition: string, context: WorkflowContext): { success: true; result: boolean } | { success: false; error: string } {
  try {
    // First resolve any {{variable}} placeholders
    const resolvedCondition = resolveVariables(condition, context);
    
    // Check if there are unresolved variables (still contains {{)
    if (resolvedCondition.includes('{{')) {
      return { success: false, error: 'Unresolved variables in condition' };
    }
    
    // Create a safe evaluation function
    // We use Function constructor to evaluate the expression in a controlled way
    // This allows expressions like: [1,2,3].length > 2, "hello" === "hello", etc.
    const evalFn = new Function(`
      "use strict";
      try {
        return !!(${resolvedCondition});
      } catch (e) {
        throw e;
      }
    `);
    
    const result = evalFn();
    
    if (typeof result !== 'boolean') {
      // Coerce to boolean for truthy/falsy values
      return { success: true, result: Boolean(result) };
    }
    
    return { success: true, result };
  } catch (err) {
    return { success: false, error: (err as Error).message };
  }
}

/**
 * Resolves variables in an API config object
 */
function resolveApiConfig(config: ApiConfig, context: WorkflowContext): ApiConfig {
  return {
    url: resolveVariables(config.url, context),
    method: config.method,
    headers: config.headers?.map((h: KeyValuePair) => ({
      key: resolveVariables(h.key, context),
      value: resolveVariables(h.value, context),
    })) || [],
    body: resolveVariables(config.body, context),
    queryParams: config.queryParams?.map((p: KeyValuePair) => ({
      key: resolveVariables(p.key, context),
      value: resolveVariables(p.value, context),
    })) || [],
  };
}

export class WorkflowRunner {
  private workflow: Workflow;
  private state: WorkflowRunnerState;
  private onStateChange: (state: WorkflowRunnerState) => void;

  constructor(workflow: Workflow, onStateChange: (state: WorkflowRunnerState) => void) {
    this.workflow = workflow;
    this.onStateChange = onStateChange;
    this.state = {
      isRunning: false,
      isPaused: false,
      currentNodeId: null,
      visitedNodeIds: [],
      messages: [],
      loopCounters: {},
      context: {},
      telemetry: null,
      currentStepStartTime: null,
      executionSteps: [],
      executionStartTime: null,
      executionStatus: 'running',
    };
  }

  // Helper to format duration in human-readable format
  private formatDuration(ms: number): string {
    if (ms < 1000) return `${ms}ms`;
    if (ms < 60000) return `${(ms / 1000).toFixed(2)}s`;
    const mins = Math.floor(ms / 60000);
    const secs = ((ms % 60000) / 1000).toFixed(1);
    return `${mins}m ${secs}s`;
  }

  // Start tracking a step
  private startStepTiming(): void {
    this.updateState({ currentStepStartTime: new Date() });
  }

  // Record step telemetry
  private recordStepTelemetry(
    node: WorkflowNode,
    status: 'success' | 'error' | 'skipped',
    metadata?: StepTelemetry['metadata']
  ): void {
    const endTime = new Date();
    const startTime = this.state.currentStepStartTime || endTime;
    const duration = endTime.getTime() - startTime.getTime();

    const stepTelemetry: StepTelemetry = {
      nodeId: node.id,
      nodeLabel: node.data.label,
      nodeType: node.type as NodeType,
      startTime,
      endTime,
      duration,
      status,
      metadata,
    };

    if (this.state.telemetry) {
      const updatedSteps = [...this.state.telemetry.steps, stepTelemetry];
      const successCount = updatedSteps.filter(s => s.status === 'success').length;
      const errorCount = updatedSteps.filter(s => s.status === 'error').length;
      const totalDuration = updatedSteps.reduce((sum, s) => sum + s.duration, 0);

      this.updateState({
        telemetry: {
          ...this.state.telemetry,
          steps: updatedSteps,
          summary: {
            totalNodes: updatedSteps.length,
            successCount,
            errorCount,
            avgStepDuration: Math.round(totalDuration / updatedSteps.length),
          },
        },
        currentStepStartTime: null,
      });
    }
  }

  // Record execution step for persistence
  private recordExecutionStep(
    node: WorkflowNode,
    status: 'success' | 'failed' | 'skipped',
    input?: Record<string, unknown>,
    output?: Record<string, unknown>,
    error?: string,
    metadata?: Record<string, unknown>
  ): void {
    const endTime = new Date();
    const startTime = this.state.currentStepStartTime || endTime;
    const duration = endTime.getTime() - startTime.getTime();

    const step: ExecutionStep = {
      nodeId: node.id,
      nodeLabel: node.data.label,
      nodeType: node.type as NodeType,
      startedAt: startTime.toISOString(),
      completedAt: endTime.toISOString(),
      duration,
      status,
      input,
      output,
      error,
      metadata,
    };

    this.updateState({
      executionSteps: [...this.state.executionSteps, step],
    });
  }

  // Save execution to server
  private async saveExecution(status: ExecutionStatus, error?: string): Promise<void> {
    if (!this.workflow.id) {
      console.log('Workflow not saved, skipping execution persistence');
      return;
    }

    const endTime = new Date();
    const startTime = this.state.executionStartTime || endTime;
    const duration = endTime.getTime() - startTime.getTime();

    try {
      await api.saveExecution(this.workflow.id, {
        workflowVersion: this.workflow.currentVersion || 1,
        workflowName: this.workflow.name,
        startedAt: startTime.toISOString(),
        completedAt: endTime.toISOString(),
        duration,
        status,
        steps: this.state.executionSteps,
        context: this.state.context as Record<string, unknown>,
        error,
      });
      console.log('Execution saved successfully');
    } catch (err) {
      console.error('Failed to save execution:', err);
    }
  }

  // Finalize telemetry at workflow end
  private finalizeTelemetry(): void {
    if (this.state.telemetry) {
      const endTime = new Date();
      const totalDuration = endTime.getTime() - this.state.telemetry.startTime.getTime();

      this.updateState({
        telemetry: {
          ...this.state.telemetry,
          endTime,
          totalDuration,
        },
      });
    }
  }

  // Display telemetry summary
  private displayTelemetrySummary(): void {
    if (!this.state.telemetry) return;

    const { telemetry } = this.state;
    const totalTime = this.formatDuration(telemetry.totalDuration || 0);

    // Add telemetry summary message
    this.addMessage({
      type: 'telemetry',
      content: `📊 Execution Summary`,
      telemetry: telemetry,
    });

    // Display summary details
    this.addMessage({
      type: 'system',
      content: `───────────────────────────────`,
    });

    this.addMessage({
      type: 'system',
      content: `⏱  Total Time: ${totalTime}`,
    });

    this.addMessage({
      type: 'system',
      content: `📍 Steps Executed: ${telemetry.summary.totalNodes}`,
    });

    if (telemetry.summary.errorCount > 0) {
      this.addMessage({
        type: 'system',
        content: `✓ Success: ${telemetry.summary.successCount}  ✗ Errors: ${telemetry.summary.errorCount}`,
      });
    }

    // Step breakdown
    this.addMessage({
      type: 'system',
      content: ``,
    });

    this.addMessage({
      type: 'system',
      content: `Step Breakdown:`,
    });

    telemetry.steps.forEach((step, index) => {
      const duration = this.formatDuration(step.duration).padStart(8);
      const statusIcon = step.status === 'success' ? '✓' : step.status === 'error' ? '✗' : '○';
      let detail = '';

      if (step.metadata?.apiStatus) {
        detail = ` ${step.metadata.apiStatus} ${step.metadata.apiMethod || ''}`;
      } else if (step.metadata?.conditionResult !== undefined) {
        detail = ` → ${step.metadata.conditionResult}`;
      } else if (step.metadata?.loopIteration !== undefined) {
        detail = ` #${step.metadata.loopIteration}`;
      }

      this.addMessage({
        type: 'system',
        content: `  ${(index + 1).toString().padStart(2)}. ${step.nodeLabel.padEnd(20)} ${duration}  ${statusIcon}${detail}`,
      });
    });

    this.addMessage({
      type: 'system',
      content: ``,
    });

    this.addMessage({
      type: 'system',
      content: `📈 Average Step Time: ${this.formatDuration(telemetry.summary.avgStepDuration)}`,
    });
  }

  private updateState(updates: Partial<WorkflowRunnerState>) {
    this.state = { ...this.state, ...updates };
    this.onStateChange(this.state);
  }

  private addMessage(message: Omit<TestMessage, 'id' | 'timestamp'>) {
    const newMessage: TestMessage = {
      ...message,
      id: `msg-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      timestamp: new Date(),
    };
    this.updateState({
      messages: [...this.state.messages, newMessage],
    });
    return newMessage;
  }

  private storeNodeOutput(nodeLabel: string, output: Omit<NodeOutput, 'timestamp'>) {
    const newContext = {
      ...this.state.context,
      [nodeLabel]: {
        ...output,
        timestamp: new Date(),
      },
    };
    this.updateState({ context: newContext });
  }

  private getNode(nodeId: string): WorkflowNode | undefined {
    return this.workflow.nodes.find((n) => n.id === nodeId);
  }

  private getOutgoingEdges(nodeId: string): WorkflowEdge[] {
    return this.workflow.edges.filter((e) => e.source === nodeId);
  }

  private getStartNode(): WorkflowNode | undefined {
    return this.workflow.nodes.find((n) => n.type === 'start');
  }

  // Public method to get current context (for UI display)
  getContext(): WorkflowContext {
    return this.state.context;
  }

  start() {
    const startNode = this.getStartNode();
    if (!startNode) {
      this.addMessage({
        type: 'error',
        content: 'No Start node found in workflow. Please add a Start node.',
      });
      return;
    }

    // Initialize telemetry
    const telemetry: WorkflowTelemetry = {
      workflowId: this.workflow.id,
      workflowName: this.workflow.name,
      startTime: new Date(),
      steps: [],
      summary: {
        totalNodes: 0,
        successCount: 0,
        errorCount: 0,
        avgStepDuration: 0,
      },
    };

    this.updateState({
      isRunning: true,
      isPaused: false,
      currentNodeId: null,
      visitedNodeIds: [],
      messages: [],
      loopCounters: {},
      context: {},
      telemetry,
      currentStepStartTime: null,
      executionSteps: [],
      executionStartTime: new Date(),
      executionStatus: 'running',
    });

    this.addMessage({
      type: 'system',
      content: `Starting workflow: "${this.workflow.name}"`,
    });

    this.executeNode(startNode.id);
  }

  stop() {
    this.addMessage({
      type: 'system',
      content: 'Workflow execution stopped.',
    });
    this.updateState({
      isRunning: false,
      isPaused: false,
      currentNodeId: null,
      executionStatus: 'cancelled',
    });
    // Save the cancelled execution
    this.saveExecution('cancelled', 'Execution stopped by user');
  }

  reset() {
    this.updateState({
      isRunning: false,
      isPaused: false,
      currentNodeId: null,
      visitedNodeIds: [],
      messages: [],
      loopCounters: {},
      context: {},
      telemetry: null,
      currentStepStartTime: null,
      executionSteps: [],
      executionStartTime: null,
      executionStatus: 'running',
    });
  }

  selectDecisionOption(optionId: string) {
    if (!this.state.isPaused || !this.state.currentNodeId) return;

    const currentNode = this.getNode(this.state.currentNodeId);
    if (!currentNode || currentNode.type !== 'decision') return;

    // Store the decision in context
    this.storeNodeOutput(currentNode.data.label, {
      response: { selectedOption: optionId },
      nodeType: 'decision',
    });

    // Record telemetry for manual decision selection
    this.recordStepTelemetry(currentNode, 'success', {
      condition: currentNode.data.condition,
      conditionResult: optionId === 'yes',
    });

    // Find the edge matching the selected option
    const edges = this.getOutgoingEdges(this.state.currentNodeId);
    const selectedEdge = edges.find((e) => e.sourceHandle === optionId || e.id === optionId);

    if (!selectedEdge) {
      // Try to find by label
      const edgeByLabel = edges.find(
        (e) => e.label?.toLowerCase() === optionId.toLowerCase() || 
               e.data?.label?.toLowerCase() === optionId.toLowerCase()
      );
      if (edgeByLabel) {
        this.addMessage({
          type: 'user',
          content: optionId.charAt(0).toUpperCase() + optionId.slice(1),
        });
        this.updateState({ isPaused: false });
        this.executeNode(edgeByLabel.target);
        return;
      }

      // Just take the first available edge for the option
      const edgeIndex = optionId === 'yes' ? 0 : optionId === 'no' ? 1 : 0;
      const fallbackEdge = edges[edgeIndex] || edges[0];
      if (fallbackEdge) {
        this.addMessage({
          type: 'user',
          content: optionId.charAt(0).toUpperCase() + optionId.slice(1),
        });
        this.updateState({ isPaused: false });
        this.executeNode(fallbackEdge.target);
        return;
      }

      this.addMessage({
        type: 'error',
        content: `No path found for option: ${optionId}`,
      });
      return;
    }

    this.addMessage({
      type: 'user',
      content: optionId.charAt(0).toUpperCase() + optionId.slice(1),
    });

    this.updateState({ isPaused: false });
    this.executeNode(selectedEdge.target);
  }

  selectParallelBranch(branchId: string) {
    if (!this.state.isPaused || !this.state.currentNodeId) return;

    const currentNode = this.getNode(this.state.currentNodeId);
    if (!currentNode || currentNode.type !== 'parallel') return;

    // Store the selected branch in context
    this.storeNodeOutput(currentNode.data.label, {
      response: { selectedBranch: branchId },
      nodeType: 'parallel',
    });

    // Record telemetry for parallel branch selection
    this.recordStepTelemetry(currentNode, 'success');

    const edges = this.getOutgoingEdges(this.state.currentNodeId);
    const selectedEdge = edges.find((e) => e.sourceHandle === branchId || e.id === branchId);

    if (!selectedEdge) {
      // Fallback: pick edge by index
      const branchIndex = parseInt(branchId.replace('branch-', '')) - 1 || 0;
      const fallbackEdge = edges[branchIndex] || edges[0];
      if (fallbackEdge) {
        this.addMessage({
          type: 'user',
          content: `Selected: Branch ${branchIndex + 1}`,
        });
        this.updateState({ isPaused: false });
        this.executeNode(fallbackEdge.target);
        return;
      }

      this.addMessage({
        type: 'error',
        content: `No path found for branch: ${branchId}`,
      });
      return;
    }

    this.addMessage({
      type: 'user',
      content: `Selected: ${branchId}`,
    });

    this.updateState({ isPaused: false });
    this.executeNode(selectedEdge.target);
  }

  continueLoop(shouldContinue: boolean) {
    if (!this.state.isPaused || !this.state.currentNodeId) return;

    const currentNode = this.getNode(this.state.currentNodeId);
    if (!currentNode || currentNode.type !== 'loop') return;

    const edges = this.getOutgoingEdges(this.state.currentNodeId);
    const currentCount = this.state.loopCounters[this.state.currentNodeId] || 0;
    
    if (shouldContinue) {
      // Find loop-back edge (usually left handle or 'loop' sourceHandle)
      const loopEdge = edges.find((e) => e.sourceHandle === 'loop') || edges[0];
      if (loopEdge) {
        const counter = currentCount + 1;
        
        // Store loop state in context
        this.storeNodeOutput(currentNode.data.label, {
          response: { iteration: counter, continued: true },
          nodeType: 'loop',
        });

        // Record telemetry for loop iteration
        this.recordStepTelemetry(currentNode, 'success', { loopIteration: counter });
        
        this.updateState({
          isPaused: false,
          loopCounters: { ...this.state.loopCounters, [this.state.currentNodeId]: counter },
        });
        this.addMessage({
          type: 'user',
          content: `Continue loop (iteration ${counter})`,
        });
        this.executeNode(loopEdge.target);
        return;
      }
    } else {
      // Find exit edge (usually bottom handle or 'exit' sourceHandle)
      const exitEdge = edges.find((e) => e.sourceHandle === 'exit') || edges[1] || edges[0];
      if (exitEdge) {
        // Store loop exit in context
        this.storeNodeOutput(currentNode.data.label, {
          response: { iteration: currentCount, continued: false, exited: true },
          nodeType: 'loop',
        });

        // Record telemetry for loop exit
        this.recordStepTelemetry(currentNode, 'success', { loopIteration: currentCount });
        
        this.addMessage({
          type: 'user',
          content: 'Exit loop',
        });
        this.updateState({ isPaused: false });
        this.executeNode(exitEdge.target);
        return;
      }
    }

    this.addMessage({
      type: 'error',
      content: 'No valid path found from loop node',
    });
  }

  private executeNode(nodeId: string) {
    const node = this.getNode(nodeId);
    if (!node) {
      this.addMessage({
        type: 'error',
        content: `Node not found: ${nodeId}`,
      });
      this.stop();
      return;
    }

    // Start timing this step
    this.startStepTiming();

    this.updateState({
      currentNodeId: nodeId,
      visitedNodeIds: [...this.state.visitedNodeIds, nodeId],
    });

    // Small delay for visual effect
    setTimeout(() => {
      this.processNode(node);
    }, 500);
  }

  private processNode(node: WorkflowNode) {
    const nodeType = node.type as NodeType;

    switch (nodeType) {
      case 'start':
        this.handleStartNode(node);
        break;
      case 'end':
        this.handleEndNode(node);
        break;
      case 'action':
        this.handleActionNode(node);
        break;
      case 'decision':
        this.handleDecisionNode(node);
        break;
      case 'parallel':
        this.handleParallelNode(node);
        break;
      case 'loop':
        this.handleLoopNode(node);
        break;
      default:
        this.addMessage({
          type: 'error',
          content: `Unknown node type: ${nodeType}`,
        });
        this.stop();
    }
  }

  private handleStartNode(node: WorkflowNode) {
    this.addMessage({
      type: 'node',
      content: `▶ ${node.data.label}`,
      nodeId: node.id,
      nodeType: 'start',
    });

    // Store start node in context
    this.storeNodeOutput(node.data.label, {
      response: { started: true, timestamp: new Date().toISOString() },
      nodeType: 'start',
    });

    const edges = this.getOutgoingEdges(node.id);
    if (edges.length === 0) {
      this.addMessage({
        type: 'error',
        content: 'Start node has no outgoing connections',
      });
      this.recordStepTelemetry(node, 'error');
      this.recordExecutionStep(node, 'failed', undefined, undefined, 'No outgoing connections');
      this.saveExecution('failed', 'Start node has no outgoing connections');
      this.stop();
      return;
    }

    // Record telemetry for start node
    this.recordStepTelemetry(node, 'success');

    // Record execution step
    this.recordExecutionStep(node, 'success', undefined, { started: true });

    this.executeNode(edges[0].target);
  }

  private handleEndNode(node: WorkflowNode) {
    // Store end node in context
    this.storeNodeOutput(node.data.label, {
      response: { completed: true, timestamp: new Date().toISOString() },
      nodeType: 'end',
    });

    // Record telemetry for end node
    this.recordStepTelemetry(node, 'success');

    // Record execution step for end node
    this.recordExecutionStep(
      node,
      'success',
      undefined,
      { completed: true }
    );

    // Finalize telemetry
    this.finalizeTelemetry();

    this.addMessage({
      type: 'success',
      content: `✓ Workflow completed at: ${node.data.label}`,
      nodeId: node.id,
      nodeType: 'end',
    });

    // Display telemetry summary
    this.displayTelemetrySummary();

    this.updateState({
      isRunning: false,
      isPaused: false,
      executionStatus: 'completed',
    });

    // Save the completed execution
    this.saveExecution('completed');
  }

  private async executeApiCall(apiConfig: ApiConfig): Promise<{
    status: number;
    statusText: string;
    data: unknown;
    error?: string;
  }> {
    try {
      // Build URL with query params
      let url = apiConfig.url;
      if (apiConfig.queryParams && apiConfig.queryParams.length > 0) {
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
      if (apiConfig.headers) {
        apiConfig.headers.forEach((h) => {
          if (h.key) headers[h.key] = h.value;
        });
      }

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

      return {
        status: response.status,
        statusText: response.statusText,
        data,
      };
    } catch (err) {
      return {
        status: 0,
        statusText: 'Error',
        data: null,
        error: (err as Error).message,
      };
    }
  }

  private async handleActionNode(node: WorkflowNode) {
    const isApiCall = node.data.actionType === 'api_call' && node.data.apiConfig?.url;

    if (isApiCall) {
      // Resolve variables in API config using current context
      const originalConfig = node.data.apiConfig!;
      const resolvedConfig = resolveApiConfig(originalConfig, this.state.context);
      
      this.addMessage({
        type: 'api',
        content: `🌐 API Call: ${node.data.label}`,
        nodeId: node.id,
        nodeType: 'action',
      });

      // Show resolved URL (with variables replaced)
      this.addMessage({
        type: 'system',
        content: `   ${resolvedConfig.method} ${resolvedConfig.url}`,
      });

      // If variables were resolved, show original for reference
      if (originalConfig.url !== resolvedConfig.url) {
        this.addMessage({
          type: 'system',
          content: `   (from: ${originalConfig.url})`,
        });
      }

      this.addMessage({
        type: 'system',
        content: `   ⏳ Calling API...`,
      });

      // Execute the actual API call with resolved config
      const response = await this.executeApiCall(resolvedConfig);

      // Store the response in context for use by subsequent nodes
      this.storeNodeOutput(node.data.label, {
        response: response.data,
        status: response.status,
        statusText: response.statusText,
        nodeType: 'action',
      });

      // Display the response
      const isSuccess = !response.error && response.status >= 200 && response.status < 400;
      
      this.addMessage({
        type: 'api_response',
        content: response.error 
          ? `   ❌ Error: ${response.error}`
          : `   ${isSuccess ? '✅' : '⚠️'} Response: ${response.status} ${response.statusText}`,
        nodeId: node.id,
        apiResponse: response,
      });

      // Show response data preview
      if (response.data !== null && response.data !== undefined) {
        const dataPreview = typeof response.data === 'string' 
          ? response.data.substring(0, 200) 
          : JSON.stringify(response.data, null, 2).substring(0, 200);
        
        this.addMessage({
          type: 'system',
          content: `   ${dataPreview}${dataPreview.length >= 200 ? '...' : ''}`,
        });
      }

      // Show hint about using the response
      this.addMessage({
        type: 'system',
        content: `   💡 Use {{${node.data.label}.response}} in subsequent nodes`,
      });

      // Record telemetry with API metadata
      this.recordStepTelemetry(node, isSuccess ? 'success' : 'error', {
        apiUrl: resolvedConfig.url,
        apiMethod: resolvedConfig.method,
        apiStatus: response.status,
      });

      // Record execution step with full details
      this.recordExecutionStep(
        node,
        isSuccess ? 'success' : 'failed',
        { apiConfig: resolvedConfig },
        { status: response.status, statusText: response.statusText, data: response.data },
        response.error,
        { apiUrl: resolvedConfig.url, apiMethod: resolvedConfig.method, statusCode: response.status }
      );

    } else {
      // Handle regular action
      this.addMessage({
        type: 'node',
        content: `⚙ Executing: ${node.data.label}`,
        nodeId: node.id,
        nodeType: 'action',
      });

      if (node.data.actionType) {
        this.addMessage({
          type: 'system',
          content: `   Action type: ${node.data.actionType}`,
        });
      }

      if (node.data.description) {
        // Resolve variables in description
        const resolvedDescription = resolveVariables(node.data.description, this.state.context);
        this.addMessage({
          type: 'system',
          content: `   ${resolvedDescription}`,
        });
      }

      // Store action execution in context
      this.storeNodeOutput(node.data.label, {
        response: { 
          executed: true, 
          actionType: node.data.actionType,
          description: node.data.description,
        },
        nodeType: 'action',
      });

      // Record telemetry for non-API action
      this.recordStepTelemetry(node, 'success');

      // Record execution step
      this.recordExecutionStep(
        node,
        'success',
        { actionType: node.data.actionType, description: node.data.description },
        { executed: true }
      );
    }

    const edges = this.getOutgoingEdges(node.id);
    if (edges.length === 0) {
      this.addMessage({
        type: 'error',
        content: `Action "${node.data.label}" has no outgoing connections. Workflow cannot continue.`,
      });
      this.recordStepTelemetry(node, 'error');
      this.stop();
      return;
    }

    // Auto-continue to next node after a brief delay
    setTimeout(() => {
      this.executeNode(edges[0].target);
    }, 800);
  }

  private handleDecisionNode(node: WorkflowNode) {
    this.addMessage({
      type: 'decision',
      content: `❓ Decision: ${node.data.label}`,
      nodeId: node.id,
      nodeType: 'decision',
    });

    const edges = this.getOutgoingEdges(node.id);
    if (edges.length === 0) {
      this.addMessage({
        type: 'error',
        content: `Decision "${node.data.label}" has no outgoing connections.`,
      });
      this.recordStepTelemetry(node, 'error');
      this.stop();
      return;
    }

    // Find Yes and No edges
    const yesEdge = edges.find((e) => e.sourceHandle === 'yes') || edges[0];
    const noEdge = edges.find((e) => e.sourceHandle === 'no') || edges[1];

    // If there's a condition, try to auto-evaluate it
    if (node.data.condition) {
      const resolvedCondition = resolveVariables(node.data.condition, this.state.context);
      
      this.addMessage({
        type: 'system',
        content: `   Condition: ${resolvedCondition}`,
      });
      
      if (node.data.condition !== resolvedCondition) {
        this.addMessage({
          type: 'system',
          content: `   (from: ${node.data.condition})`,
        });
      }

      // Attempt to evaluate the condition
      const evalResult = evaluateCondition(node.data.condition, this.state.context);
      
      if (evalResult.success) {
        const result = evalResult.result;
        
        this.addMessage({
          type: 'system',
          content: `   ✓ Evaluated: ${result ? 'TRUE' : 'FALSE'}`,
        });

        // Store the decision result in context
        this.storeNodeOutput(node.data.label, {
          response: { 
            condition: node.data.condition,
            resolvedCondition,
            evaluated: true,
            result,
            selectedPath: result ? 'yes' : 'no',
          },
          nodeType: 'decision',
        });

        // Auto-take the appropriate path
        if (result && yesEdge) {
          this.addMessage({
            type: 'system',
            content: `   → Taking "Yes" path`,
          });
          // Record telemetry for decision
          this.recordStepTelemetry(node, 'success', {
            condition: node.data.condition,
            conditionResult: true,
          });
          setTimeout(() => {
            this.executeNode(yesEdge.target);
          }, 500);
          return;
        } else if (!result && noEdge) {
          this.addMessage({
            type: 'system',
            content: `   → Taking "No" path`,
          });
          // Record telemetry for decision
          this.recordStepTelemetry(node, 'success', {
            condition: node.data.condition,
            conditionResult: false,
          });
          setTimeout(() => {
            this.executeNode(noEdge.target);
          }, 500);
          return;
        }
        
        // If we evaluated but couldn't find the right edge, fall through to prompt
        this.addMessage({
          type: 'system',
          content: `   ⚠ Could not find matching path, prompting for selection`,
        });
      } else {
        // Evaluation failed, show why and prompt user
        this.addMessage({
          type: 'system',
          content: `   ⚠ Could not auto-evaluate: ${evalResult.error}`,
        });
      }
    }

    // No condition or evaluation failed - prompt user to select
    // Generate options from edges
    const options = edges.map((edge, index) => {
      const label = edge.label || edge.data?.label || edge.sourceHandle || `Option ${index + 1}`;
      return {
        id: edge.sourceHandle || edge.id,
        label: label.charAt(0).toUpperCase() + label.slice(1),
      };
    });

    // Default to Yes/No if only handle IDs
    if (options.length >= 2 && options[0].label === 'Yes' || options.some(o => o.id === 'yes' || o.id === 'no')) {
      // Keep as is
    } else if (options.length === 2) {
      options[0].label = options[0].label || 'Yes';
      options[1].label = options[1].label || 'No';
    }

    this.addMessage({
      type: 'decision',
      content: 'Choose a path:',
      nodeId: node.id,
      options,
    });

    this.updateState({ isPaused: true });
  }

  private handleParallelNode(node: WorkflowNode) {
    this.addMessage({
      type: 'parallel',
      content: `⑆ Parallel: ${node.data.label}`,
      nodeId: node.id,
      nodeType: 'parallel',
    });

    const edges = this.getOutgoingEdges(node.id);
    if (edges.length === 0) {
      this.addMessage({
        type: 'error',
        content: `Parallel "${node.data.label}" has no outgoing connections.`,
      });
      this.recordStepTelemetry(node, 'error');
      this.stop();
      return;
    }

    if (edges.length === 1) {
      // Only one path, auto-continue
      this.storeNodeOutput(node.data.label, {
        response: { branches: 1 },
        nodeType: 'parallel',
      });
      this.recordStepTelemetry(node, 'success');
      setTimeout(() => {
        this.executeNode(edges[0].target);
      }, 500);
      return;
    }

    // Multiple branches - let user choose which to simulate
    const options = edges.map((edge, index) => ({
      id: edge.sourceHandle || edge.id,
      label: edge.label || edge.data?.label || `Branch ${index + 1}`,
    }));

    this.addMessage({
      type: 'parallel',
      content: 'Select a branch to simulate (in real execution, all branches run in parallel):',
      nodeId: node.id,
      options,
    });

    this.updateState({ isPaused: true });
  }

  private handleLoopNode(node: WorkflowNode) {
    const currentCount = this.state.loopCounters[node.id] || 0;
    const maxCount = node.data.loopCount;

    this.addMessage({
      type: 'loop',
      content: `🔄 Loop: ${node.data.label} (iteration ${currentCount + 1}${maxCount ? ` of ${maxCount}` : ''})`,
      nodeId: node.id,
      nodeType: 'loop',
    });

    if (node.data.loopCondition) {
      // Resolve variables in loop condition
      const resolvedCondition = resolveVariables(node.data.loopCondition, this.state.context);
      this.addMessage({
        type: 'system',
        content: `   Condition: ${resolvedCondition}`,
      });
    }

    const edges = this.getOutgoingEdges(node.id);
    if (edges.length === 0) {
      this.addMessage({
        type: 'error',
        content: `Loop "${node.data.label}" has no outgoing connections.`,
      });
      this.recordStepTelemetry(node, 'error', { loopIteration: currentCount + 1 });
      this.stop();
      return;
    }

    // If max count reached, auto-exit
    if (maxCount && currentCount >= maxCount) {
      this.addMessage({
        type: 'system',
        content: `   Max iterations (${maxCount}) reached. Exiting loop.`,
      });
      
      this.storeNodeOutput(node.data.label, {
        response: { iteration: currentCount, maxReached: true, exited: true },
        nodeType: 'loop',
      });
      
      this.recordStepTelemetry(node, 'success', { loopIteration: currentCount });
      
      const exitEdge = edges.find((e) => e.sourceHandle === 'exit') || edges[1] || edges[0];
      if (exitEdge) {
        setTimeout(() => {
          this.executeNode(exitEdge.target);
        }, 500);
        return;
      }
    }

    // Ask user whether to continue or exit
    this.addMessage({
      type: 'loop',
      content: 'Continue loop or exit?',
      nodeId: node.id,
      options: [
        { id: 'continue', label: 'Continue Loop' },
        { id: 'exit', label: 'Exit Loop' },
      ],
    });

    this.updateState({ isPaused: true });
  }
}

// Export utility functions for use in other components
export { resolveVariables, getValueByPath };
