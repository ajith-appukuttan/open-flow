import type { Workflow, WorkflowListItem, WorkflowValidationResult } from '../types/workflow';

const API_BASE = '/api';

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }
  return response.json();
}

export async function getWorkflows(): Promise<WorkflowListItem[]> {
  const response = await fetch(`${API_BASE}/workflows`);
  return handleResponse<WorkflowListItem[]>(response);
}

export async function getWorkflow(id: string): Promise<Workflow> {
  const response = await fetch(`${API_BASE}/workflows/${id}`);
  return handleResponse<Workflow>(response);
}

export async function createWorkflow(data: {
  name: string;
  description?: string;
  nodes?: Workflow['nodes'];
  edges?: Workflow['edges'];
}): Promise<Workflow> {
  const response = await fetch(`${API_BASE}/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(data),
  });
  return handleResponse<Workflow>(response);
}

export async function updateWorkflow(id: string, workflow: Workflow): Promise<Workflow> {
  const response = await fetch(`${API_BASE}/workflows/${id}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(workflow),
  });
  return handleResponse<Workflow>(response);
}

export async function deleteWorkflow(id: string): Promise<void> {
  const response = await fetch(`${API_BASE}/workflows/${id}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Delete failed' }));
    throw new Error(error.message);
  }
}

export async function validateWorkflow(id: string): Promise<WorkflowValidationResult> {
  const response = await fetch(`${API_BASE}/workflows/${id}/validate`, {
    method: 'POST',
  });
  return handleResponse<WorkflowValidationResult>(response);
}
