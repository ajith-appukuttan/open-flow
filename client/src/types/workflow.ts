import type { Node, Edge } from '@xyflow/react';

export type NodeType = 'start' | 'end' | 'action' | 'decision' | 'parallel' | 'loop' | 'form';

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE';

export interface KeyValuePair {
  key: string;
  value: string;
}

export interface ApiConfig {
  url: string;
  method: HttpMethod;
  headers: KeyValuePair[];
  body: string;
  queryParams: KeyValuePair[];
}

// Form Builder Types
export type FormComponentType = 
  | 'text' | 'textarea' | 'number' | 'email' | 'password' | 'date' | 'file'
  | 'select' | 'multiselect' | 'radio' | 'checkbox' | 'toggle' | 'slider'
  | 'label' | 'divider' | 'card' | 'image'
  | 'submit' | 'cancel';

export interface FormComponentOption {
  label: string;
  value: string;
}

export interface FormComponentValidation {
  min?: number;
  max?: number;
  pattern?: string;
  minLength?: number;
  maxLength?: number;
}

export interface FormComponent {
  id: string;
  type: FormComponentType;
  label?: string;
  name: string;
  placeholder?: string;
  defaultValue?: string;
  required?: boolean;
  options?: FormComponentOption[];
  validation?: FormComponentValidation;
  width?: 'full' | 'half';
  // For image component
  src?: string;
  alt?: string;
  // For card/section
  children?: FormComponent[];
}

export interface FormConfig {
  title?: string;
  description?: string;
  components: FormComponent[];
  submitLabel?: string;
  cancelLabel?: string;
}

export interface WorkflowNodeData {
  [key: string]: unknown;
  label: string;
  description?: string;
  // Decision node specific
  condition?: string;
  // Action node specific
  actionType?: string;
  apiConfig?: ApiConfig;
  // Loop node specific
  loopCount?: number;
  loopCondition?: string;
  // Parallel node specific
  branches?: number;
  // Form node specific
  formConfig?: FormConfig;
  // Test mode state (injected by canvas)
  isTestActive?: boolean;
  isTestVisited?: boolean;
  isTestMode?: boolean;
}

export type WorkflowNode = Node<WorkflowNodeData, NodeType>;
export type WorkflowEdge = Edge<{ label?: string }>;

export interface Workflow {
  id: string;
  name: string;
  description: string;
  userId?: string;
  createdAt: string;
  updatedAt: string;
  currentVersion?: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowVersion {
  version: number;
  savedAt: string;
  message?: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

export interface WorkflowVersionListItem {
  version: number;
  savedAt: string;
  message?: string;
  nodeCount: number;
  edgeCount: number;
}

export interface WorkflowValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export interface WorkflowListItem {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  nodeCount: number;
}

// Execution tracking types
export type ExecutionStatus = 'running' | 'completed' | 'failed' | 'cancelled';

export interface ExecutionStep {
  nodeId: string;
  nodeLabel: string;
  nodeType: NodeType;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  status: 'success' | 'failed' | 'skipped';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersion: number;
  workflowName: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  status: ExecutionStatus;
  steps: ExecutionStep[];
  context: Record<string, unknown>;
  error?: string;
}

export interface ExecutionListItem {
  id: string;
  workflowVersion: number;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  status: ExecutionStatus;
  stepCount: number;
  error?: string;
}
