import type { Workflow, WorkflowListItem, WorkflowValidationResult, WorkflowVersion, WorkflowVersionListItem } from '../types/workflow';
import { auth } from '../config/firebase';

const API_BASE = '/api';
const GUEST_ID_KEY = 'workflow_designer_guest_id';

function getCurrentUserId(): string {
  // First check if user is authenticated with Firebase
  const user = auth.currentUser;
  if (user) {
    return user.uid;
  }
  
  // Otherwise check for guest ID
  const guestId = localStorage.getItem(GUEST_ID_KEY);
  if (guestId) {
    return guestId;
  }
  
  throw new Error('User not authenticated');
}

async function handleResponse<T>(response: Response): Promise<T> {
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Request failed' }));
    throw new Error(error.message || `HTTP error ${response.status}`);
  }
  return response.json();
}

export async function getWorkflows(): Promise<WorkflowListItem[]> {
  const userId = getCurrentUserId();
  const response = await fetch(`${API_BASE}/workflows?userId=${userId}`);
  return handleResponse<WorkflowListItem[]>(response);
}

export async function getWorkflow(id: string): Promise<Workflow> {
  const userId = getCurrentUserId();
  const response = await fetch(`${API_BASE}/workflows/${id}?userId=${userId}`);
  return handleResponse<Workflow>(response);
}

export async function createWorkflow(data: {
  name: string;
  description?: string;
  nodes?: Workflow['nodes'];
  edges?: Workflow['edges'];
}): Promise<Workflow> {
  const userId = getCurrentUserId();
  const response = await fetch(`${API_BASE}/workflows`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...data, userId }),
  });
  return handleResponse<Workflow>(response);
}

export async function updateWorkflow(id: string, workflow: Workflow): Promise<Workflow> {
  const userId = getCurrentUserId();
  const response = await fetch(`${API_BASE}/workflows/${id}?userId=${userId}`, {
    method: 'PUT',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ ...workflow, userId }),
  });
  return handleResponse<Workflow>(response);
}

export async function deleteWorkflow(id: string): Promise<void> {
  const userId = getCurrentUserId();
  const response = await fetch(`${API_BASE}/workflows/${id}?userId=${userId}`, {
    method: 'DELETE',
  });
  if (!response.ok) {
    const error = await response.json().catch(() => ({ message: 'Delete failed' }));
    throw new Error(error.message);
  }
}

export async function validateWorkflow(id: string): Promise<WorkflowValidationResult> {
  const userId = getCurrentUserId();
  const response = await fetch(`${API_BASE}/workflows/${id}/validate?userId=${userId}`, {
    method: 'POST',
  });
  return handleResponse<WorkflowValidationResult>(response);
}

// Version API functions

export async function getWorkflowVersions(workflowId: string): Promise<(WorkflowVersionListItem & { isCurrent: boolean })[]> {
  const userId = getCurrentUserId();
  const response = await fetch(`${API_BASE}/workflows/${workflowId}/versions?userId=${userId}`);
  return handleResponse<(WorkflowVersionListItem & { isCurrent: boolean })[]>(response);
}

export async function getWorkflowVersion(workflowId: string, version: number): Promise<WorkflowVersion & { workflowId: string; workflowName: string; isCurrent: boolean }> {
  const userId = getCurrentUserId();
  const response = await fetch(`${API_BASE}/workflows/${workflowId}/versions/${version}?userId=${userId}`);
  return handleResponse<WorkflowVersion & { workflowId: string; workflowName: string; isCurrent: boolean }>(response);
}

export async function restoreWorkflowVersion(workflowId: string, version: number): Promise<Workflow> {
  const userId = getCurrentUserId();
  const response = await fetch(`${API_BASE}/workflows/${workflowId}/versions/${version}/restore?userId=${userId}`, {
    method: 'POST',
  });
  return handleResponse<Workflow>(response);
}
