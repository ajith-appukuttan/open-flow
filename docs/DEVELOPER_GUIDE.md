# Developer Guide

This guide covers the technical architecture, development practices, and extension points for the Workflow Designer application.

---

## Table of Contents

1. [Architecture Overview](#architecture-overview)
2. [Frontend Architecture](#frontend-architecture)
3. [Backend Architecture](#backend-architecture)
4. [State Management](#state-management)
5. [Workflow Runner](#workflow-runner)
6. [Creating Custom Nodes](#creating-custom-nodes)
7. [Extending the API](#extending-the-api)
8. [Testing](#testing)
9. [Performance Considerations](#performance-considerations)

---

## Architecture Overview

### System Design

```
┌─────────────────────────────────────────────────────────────────────┐
│                          PRESENTATION LAYER                         │
│  ┌─────────────────────────────────────────────────────────────────┐│
│  │  React Components (Header, Sidebar, Canvas, Properties, etc.)  ││
│  └─────────────────────────────────────────────────────────────────┘│
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                          APPLICATION LAYER                          │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │  Zustand Store   │  │  Workflow Runner │  │    API Client    │  │
│  │  (State Mgmt)    │  │  (Execution)     │  │  (HTTP Calls)    │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
                                    │
                                    ▼
┌─────────────────────────────────────────────────────────────────────┐
│                            DATA LAYER                               │
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐  │
│  │   REST API       │  │  Storage Service │  │ Validation Svc   │  │
│  │   (Express)      │  │  (File System)   │  │ (Business Rules) │  │
│  └──────────────────┘  └──────────────────┘  └──────────────────┘  │
└─────────────────────────────────────────────────────────────────────┘
```

### Key Design Decisions

1. **Monorepo Structure** - Client and server in single repository for easier development
2. **TypeScript Everywhere** - Full type safety across frontend and backend
3. **Zustand over Redux** - Simpler state management with less boilerplate
4. **File-based Storage** - Simple persistence without database dependencies
5. **React Flow** - Industry-standard library for node-based UIs

---

## Frontend Architecture

### Component Hierarchy

```
App
├── Header
│   ├── Workflow Name/Description
│   ├── Action Buttons (Save, Validate, Export, Import)
│   └── Test Flow Button
├── Main Content Area
│   ├── Sidebar
│   │   └── Workflow List
│   ├── Canvas Area
│   │   ├── Toolbar (Node Palette)
│   │   └── WorkflowCanvas (React Flow)
│   └── PropertiesPanel
│       ├── Node Properties
│       ├── Edge Properties
│       ├── API Configuration
│       └── Available Variables
├── TestDrawer
│   ├── Chat Messages
│   └── Control Buttons
└── Toast (Notifications)
```

### Key Components

#### WorkflowCanvas (`components/Canvas/WorkflowCanvas.tsx`)

The core canvas component wrapping React Flow:

```typescript
export default function WorkflowCanvas() {
  // Access store state and actions
  const { workflow, onNodesChange, onEdgesChange, onConnect } = useWorkflowStore();

  // Transform nodes with test mode state
  const nodesWithTestState = useMemo(() => {
    return workflow.nodes.map((node) => ({
      ...node,
      data: {
        ...node.data,
        isTestActive: isTestMode && currentTestNodeId === node.id,
        isTestVisited: isTestMode && visitedTestNodeIds.includes(node.id),
      },
    }));
  }, [workflow, isTestMode, currentTestNodeId, visitedTestNodeIds]);

  return (
    <ReactFlow
      nodes={nodesWithTestState}
      edges={workflow.edges}
      onNodesChange={onNodesChange}
      onEdgesChange={onEdgesChange}
      onConnect={onConnect}
      nodeTypes={nodeTypes}
      // ... other props
    />
  );
}
```

#### Custom Node Components (`nodes/*.tsx`)

Each node type is a custom React component:

```typescript
// nodes/ActionNode.tsx
const ActionNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  const { isTestActive, isTestVisited, isTestMode } = data;
  
  return (
    <div className={`... ${isTestActive ? 'test-node-active' : ''}`}>
      <Handle type="target" position={Position.Top} />
      <div className="node-content">
        {/* Node visualization */}
      </div>
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});
```

### Styling Architecture

The application uses Tailwind CSS with custom theme extensions:

```javascript
// tailwind.config.js
module.exports = {
  theme: {
    extend: {
      colors: {
        'canvas-bg': '#0f0f23',      // Canvas background
        'panel-bg': '#1a1a3e',       // Panel background
        'panel-border': '#2d2d5a',   // Panel borders
        'panel-hover': '#252550',    // Hover states
      },
    },
  },
};
```

Custom CSS animations for test mode:

```css
/* index.css */
.test-node-active {
  animation: pulse-glow 1.5s infinite alternate;
}

@keyframes pulse-glow {
  0% { box-shadow: 0 0 0px rgba(99, 102, 241, 0.7); }
  100% { box-shadow: 0 0 20px rgba(99, 102, 241, 0.9); }
}
```

---

## Backend Architecture

### Server Structure

```typescript
// server/src/index.ts
import express from 'express';
import cors from 'cors';
import workflowRoutes from './routes/workflows';

const app = express();

app.use(cors());
app.use(express.json());
app.use('/api/workflows', workflowRoutes);

app.listen(3001);
```

### Service Layer

#### Storage Service

Handles file-based persistence:

```typescript
// services/storageService.ts
export class StorageService {
  private dataDir: string;

  async getAll(): Promise<WorkflowListItem[]> {
    const files = await fs.readdir(this.dataDir);
    // Read and parse each JSON file
  }

  async get(id: string): Promise<Workflow> {
    const filepath = path.join(this.dataDir, `${id}.json`);
    const content = await fs.readFile(filepath, 'utf-8');
    return JSON.parse(content);
  }

  async save(workflow: Workflow): Promise<void> {
    const filepath = path.join(this.dataDir, `${workflow.id}.json`);
    await fs.writeFile(filepath, JSON.stringify(workflow, null, 2));
  }

  async delete(id: string): Promise<void> {
    const filepath = path.join(this.dataDir, `${id}.json`);
    await fs.unlink(filepath);
  }
}
```

#### Validation Service

Implements business rules:

```typescript
// services/validationService.ts
export class ValidationService {
  validate(workflow: Workflow): ValidationResult {
    const errors: string[] = [];
    const warnings: string[] = [];

    // Check for single start node
    const startNodes = workflow.nodes.filter(n => n.type === 'start');
    if (startNodes.length !== 1) {
      errors.push('Workflow must have exactly one Start node');
    }

    // Check for at least one end node
    const endNodes = workflow.nodes.filter(n => n.type === 'end');
    if (endNodes.length === 0) {
      errors.push('Workflow must have at least one End node');
    }

    // Additional validations...

    return { valid: errors.length === 0, errors, warnings };
  }
}
```

---

## State Management

### Zustand Store Structure

```typescript
// store/workflowStore.ts
interface WorkflowState {
  // Data State
  workflow: Workflow | null;
  workflows: WorkflowListItem[];
  
  // UI State
  selectedNodeId: string | null;
  selectedEdgeId: string | null;
  sidebarOpen: boolean;
  propertiesPanelOpen: boolean;
  
  // Async State
  isSaving: boolean;
  isLoading: boolean;
  error: string | null;
  
  // Test Mode State
  isTestMode: boolean;
  testDrawerOpen: boolean;
  testMessages: TestMessage[];
  currentTestNodeId: string | null;
  visitedTestNodeIds: string[];
  workflowContext: WorkflowContext;
  
  // Actions
  setWorkflow: (workflow: Workflow | null) => void;
  onNodesChange: (changes: NodeChange[]) => void;
  onEdgesChange: (changes: EdgeChange[]) => void;
  onConnect: (connection: Connection) => void;
  updateNodeData: (nodeId: string, data: Partial<WorkflowNodeData>) => void;
  // ... more actions
}

export const useWorkflowStore = create<WorkflowState>((set, get) => ({
  // Initial state
  workflow: createDefaultWorkflow(),
  workflows: [],
  // ...

  // Actions
  setWorkflow: (workflow) => set({ workflow }),
  
  onNodesChange: (changes) => {
    const { workflow } = get();
    if (workflow) {
      const nodes = applyNodeChanges(changes, workflow.nodes);
      set({ workflow: { ...workflow, nodes } });
    }
  },
  // ...
}));
```

### State Flow Diagram

```
User Action
    │
    ▼
Component Event Handler
    │
    ▼
Store Action (set/get)
    │
    ▼
State Update
    │
    ▼
React Re-render (via useWorkflowStore hook)
    │
    ▼
Updated UI
```

---

## Workflow Runner

The `WorkflowRunner` class manages test execution:

### Core Architecture

```typescript
export class WorkflowRunner {
  private workflow: Workflow;
  private state: WorkflowRunnerState;
  private onStateChange: (state: WorkflowRunnerState) => void;

  constructor(workflow: Workflow, onStateChange: (state) => void) {
    this.workflow = workflow;
    this.onStateChange = onStateChange;
    this.state = initialState;
  }

  // Public API
  start(): void;
  stop(): void;
  reset(): void;
  selectDecisionOption(optionId: string): void;
  continueLoop(shouldContinue: boolean): void;

  // Private methods
  private executeNode(nodeId: string): void;
  private processNode(node: WorkflowNode): void;
  private handleStartNode(node: WorkflowNode): void;
  private handleEndNode(node: WorkflowNode): void;
  private handleActionNode(node: WorkflowNode): void;
  private handleDecisionNode(node: WorkflowNode): void;
  private handleLoopNode(node: WorkflowNode): void;
  private handleParallelNode(node: WorkflowNode): void;
}
```

### Variable Resolution

```typescript
// Resolve {{variable}} placeholders
function resolveVariables(template: string, context: WorkflowContext): string {
  const pattern = /\{\{([^}]+)\}\}/g;
  
  return template.replace(pattern, (match, path) => {
    // Parse path: "NodeLabel.response.data.id"
    const [nodeLabel, ...propertyPath] = parsePath(path);
    
    // Get value from context
    const nodeOutput = context[nodeLabel];
    if (!nodeOutput) return match;
    
    const value = getValueByPath(nodeOutput, propertyPath);
    return value !== undefined ? String(value) : match;
  });
}
```

### Condition Evaluation

```typescript
function evaluateCondition(condition: string, context: WorkflowContext): EvalResult {
  // Resolve variables first
  const resolved = resolveVariables(condition, context);
  
  // Check for unresolved variables
  if (resolved.includes('{{')) {
    return { success: false, error: 'Unresolved variables' };
  }
  
  // Safely evaluate
  try {
    const result = new Function(`return !!(${resolved})`)();
    return { success: true, result: Boolean(result) };
  } catch (err) {
    return { success: false, error: err.message };
  }
}
```

---

## Creating Custom Nodes

### Step 1: Define Node Type

Add to `types/workflow.ts`:

```typescript
export type NodeType = 'start' | 'end' | 'action' | 'decision' | 'parallel' | 'loop' | 'custom';

export interface WorkflowNodeData {
  label: string;
  description?: string;
  // Add custom node properties
  customProperty?: string;
}
```

### Step 2: Create Node Component

Create `nodes/CustomNode.tsx`:

```typescript
import { memo } from 'react';
import { Handle, Position, type NodeProps } from '@xyflow/react';
import type { WorkflowNodeData } from '../types/workflow';

const CustomNode = memo(({ data, selected }: NodeProps<WorkflowNodeData>) => {
  return (
    <div className={`custom-node ${selected ? 'selected' : ''}`}>
      <Handle type="target" position={Position.Top} />
      
      <div className="node-content">
        <span>{data.label}</span>
        {data.customProperty && <span>{data.customProperty}</span>}
      </div>
      
      <Handle type="source" position={Position.Bottom} />
    </div>
  );
});

CustomNode.displayName = 'CustomNode';
export default CustomNode;
```

### Step 3: Register Node Type

In `components/Canvas/WorkflowCanvas.tsx`:

```typescript
import CustomNode from '../../nodes/CustomNode';

const nodeTypes: NodeTypes = {
  start: StartNode,
  end: EndNode,
  action: ActionNode,
  decision: DecisionNode,
  parallel: ParallelNode,
  loop: LoopNode,
  custom: CustomNode, // Add here
};
```

### Step 4: Add to Toolbar

In `components/Toolbar/Toolbar.tsx`:

```typescript
const nodeItems = [
  // ... existing items
  { type: 'custom', label: 'Custom', icon: <CustomIcon />, color: 'bg-pink-500' },
];
```

### Step 5: Handle in Runner

In `services/workflowRunner.ts`:

```typescript
private processNode(node: WorkflowNode) {
  switch (node.type) {
    // ... existing cases
    case 'custom':
      this.handleCustomNode(node);
      break;
  }
}

private handleCustomNode(node: WorkflowNode) {
  // Custom execution logic
  this.addMessage({
    type: 'node',
    content: `Custom: ${node.data.label}`,
    nodeId: node.id,
  });
  
  // Store output in context
  this.storeNodeOutput(node.data.label, {
    response: { /* custom output */ },
    nodeType: 'custom',
  });
  
  // Continue to next node
  const edges = this.getOutgoingEdges(node.id);
  if (edges.length > 0) {
    this.executeNode(edges[0].target);
  }
}
```

---

## Extending the API

### Adding New Endpoints

1. Define route in `server/src/routes/workflows.ts`:

```typescript
// GET /api/workflows/:id/history
router.get('/:id/history', async (req, res) => {
  try {
    const history = await historyService.getHistory(req.params.id);
    res.json(history);
  } catch (error) {
    res.status(500).json({ error: error.message });
  }
});
```

2. Create service in `server/src/services/`:

```typescript
// services/historyService.ts
export class HistoryService {
  async getHistory(workflowId: string): Promise<ExecutionHistory[]> {
    // Implementation
  }
}
```

3. Add client API function in `client/src/api/workflowApi.ts`:

```typescript
export async function getWorkflowHistory(id: string): Promise<ExecutionHistory[]> {
  const response = await fetch(`${API_BASE}/workflows/${id}/history`);
  if (!response.ok) throw new Error('Failed to fetch history');
  return response.json();
}
```

---

## Testing

### Unit Testing Components

```typescript
// Example using Vitest and React Testing Library
import { render, screen } from '@testing-library/react';
import { describe, it, expect } from 'vitest';
import ActionNode from './ActionNode';

describe('ActionNode', () => {
  it('renders label correctly', () => {
    render(
      <ActionNode 
        data={{ label: 'Test Action' }}
        selected={false}
      />
    );
    expect(screen.getByText('Test Action')).toBeInTheDocument();
  });
});
```

### Testing the Store

```typescript
import { renderHook, act } from '@testing-library/react';
import { useWorkflowStore } from './workflowStore';

describe('workflowStore', () => {
  it('updates node data', () => {
    const { result } = renderHook(() => useWorkflowStore());
    
    act(() => {
      result.current.updateNodeData('node-1', { label: 'Updated' });
    });
    
    const node = result.current.workflow.nodes.find(n => n.id === 'node-1');
    expect(node.data.label).toBe('Updated');
  });
});
```

### E2E Testing

Using Playwright:

```typescript
import { test, expect } from '@playwright/test';

test('create and save workflow', async ({ page }) => {
  await page.goto('http://localhost:5173');
  
  // Create new workflow
  await page.click('text=New Workflow');
  await page.fill('input[placeholder="Workflow name"]', 'E2E Test');
  await page.click('text=Create');
  
  // Add nodes and save
  // ...
  
  await page.click('text=Save');
  await expect(page.locator('text=Saved')).toBeVisible();
});
```

---

## Performance Considerations

### Large Workflows

1. **Virtualization** - React Flow handles node virtualization automatically
2. **Memoization** - Use `memo()` for node components
3. **Selective Re-renders** - Use Zustand selectors

```typescript
// Bad - subscribes to entire store
const { workflow, selectedNodeId } = useWorkflowStore();

// Good - only re-renders when selected values change
const workflow = useWorkflowStore((state) => state.workflow);
const selectedNodeId = useWorkflowStore((state) => state.selectedNodeId);
```

### API Optimization

1. **Debounce saves** - Don't save on every keystroke
2. **Optimistic updates** - Update UI immediately, sync in background
3. **Caching** - Cache workflow list, invalidate on changes

### Bundle Size

1. **Code splitting** - Dynamic imports for rarely-used features
2. **Tree shaking** - Ensure proper ESM imports
3. **Dependency audit** - Regularly review dependencies

```typescript
// Dynamic import for heavy components
const TestDrawer = lazy(() => import('./components/TestDrawer/TestDrawer'));
```

---

## Debugging

### Development Tools

1. **React DevTools** - Inspect component hierarchy and state
2. **Zustand DevTools** - Via Redux DevTools extension
3. **Network Tab** - Monitor API calls

### Enable Zustand DevTools

```typescript
import { devtools } from 'zustand/middleware';

export const useWorkflowStore = create<WorkflowState>()(
  devtools(
    (set, get) => ({
      // ... store definition
    }),
    { name: 'WorkflowStore' }
  )
);
```

### Logging

```typescript
// Add to workflowRunner.ts for debugging
private addMessage(message: Omit<TestMessage, 'id' | 'timestamp'>) {
  if (process.env.NODE_ENV === 'development') {
    console.log('[Runner]', message.type, message.content);
  }
  // ...
}
```

---

## Next Steps

- Review [API Reference](./API_REFERENCE.md) for endpoint details
- See [Deployment Guide](./DEPLOYMENT.md) for production setup
- Check [Contributing Guidelines](./CONTRIBUTING.md) for code standards
