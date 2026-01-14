import type { Node, Edge } from '@xyflow/react';

export type NodeType = 'start' | 'end' | 'action' | 'decision' | 'parallel' | 'loop';

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

export interface WorkflowNodeData {
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
  createdAt: string;
  updatedAt: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
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
