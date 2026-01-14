import type { Workflow } from '../types/workflow';

export const DEMO_WORKFLOW_DATA: Omit<Workflow, 'id' | 'createdAt' | 'updatedAt' | 'userId'> = {
  name: 'Sample API Workflow',
  description: 'A demo workflow showing how to call an API and make decisions based on the response',
  nodes: [
    {
      id: 'start-1',
      type: 'start',
      position: { x: 300, y: 50 },
      data: { label: 'Start' },
    },
    {
      id: 'action-1',
      type: 'action',
      position: { x: 250, y: 180 },
      data: {
        label: 'Fetch Users',
        description: 'Call JSONPlaceholder API to get users',
        actionType: 'api_call',
        apiConfig: {
          url: 'https://jsonplaceholder.typicode.com/users',
          method: 'GET',
          headers: [],
          body: '',
          queryParams: [],
        },
      },
    },
    {
      id: 'decision-1',
      type: 'decision',
      position: { x: 240, y: 350 },
      data: {
        label: 'Check Count',
        description: 'Check if we got users',
        condition: '{{Fetch Users.response.length}} > 5',
      },
    },
    {
      id: 'action-2',
      type: 'action',
      position: { x: 50, y: 520 },
      data: {
        label: 'Log Success',
        description: 'Many users found',
        actionType: 'log',
      },
    },
    {
      id: 'action-3',
      type: 'action',
      position: { x: 400, y: 520 },
      data: {
        label: 'Log Warning',
        description: 'Few users found',
        actionType: 'log',
      },
    },
    {
      id: 'end-1',
      type: 'end',
      position: { x: 100, y: 680 },
      data: { label: 'Success End' },
    },
    {
      id: 'end-2',
      type: 'end',
      position: { x: 450, y: 680 },
      data: { label: 'Warning End' },
    },
  ],
  edges: [
    {
      id: 'edge-1',
      source: 'start-1',
      target: 'action-1',
      type: 'smoothstep',
    },
    {
      id: 'edge-2',
      source: 'action-1',
      target: 'decision-1',
      type: 'smoothstep',
    },
    {
      id: 'edge-3',
      source: 'decision-1',
      sourceHandle: 'yes',
      target: 'action-2',
      type: 'smoothstep',
      label: 'Yes',
    },
    {
      id: 'edge-4',
      source: 'decision-1',
      sourceHandle: 'no',
      target: 'action-3',
      type: 'smoothstep',
      label: 'No',
    },
    {
      id: 'edge-5',
      source: 'action-2',
      target: 'end-1',
      type: 'smoothstep',
    },
    {
      id: 'edge-6',
      source: 'action-3',
      target: 'end-2',
      type: 'smoothstep',
    },
  ],
};

export const GUEST_DEMO_SEEDED_KEY = 'workflow_designer_guest_demo_seeded';

export function hasGuestDemoBeenSeeded(): boolean {
  return localStorage.getItem(GUEST_DEMO_SEEDED_KEY) === 'true';
}

export function markGuestDemoAsSeeded(): void {
  localStorage.setItem(GUEST_DEMO_SEEDED_KEY, 'true');
}

export function clearGuestDemoSeeded(): void {
  localStorage.removeItem(GUEST_DEMO_SEEDED_KEY);
}
