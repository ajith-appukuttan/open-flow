# Workflow Designer

[![TypeScript](https://img.shields.io/badge/TypeScript-5.0-blue.svg)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-18.3-61dafb.svg)](https://reactjs.org/)
[![Node.js](https://img.shields.io/badge/Node.js-18+-green.svg)](https://nodejs.org/)
[![License](https://img.shields.io/badge/License-MIT-yellow.svg)](LICENSE)

A professional-grade visual state management workflow designer built with React and Node.js. Create, edit, test, and deploy workflow diagrams with an intuitive Microsoft Visio-like interface.

---

## Table of Contents

- [Overview](#overview)
- [Key Features](#key-features)
- [Architecture](#architecture)
- [Getting Started](#getting-started)
- [Documentation](#documentation)
- [API Reference](#api-reference)
- [Contributing](#contributing)
- [License](#license)

---

## Overview

Workflow Designer is an enterprise-ready visual workflow building platform that enables teams to design, test, and manage complex business processes. It provides a drag-and-drop interface for creating state machines with support for conditional branching, parallel execution, loops, and API integrations.

### Use Cases

- **Business Process Automation** - Design approval workflows, onboarding processes
- **API Orchestration** - Chain multiple API calls with conditional logic
- **State Machine Design** - Model complex application states and transitions
- **Integration Workflows** - Connect disparate systems with visual pipelines
- **Decision Trees** - Build interactive decision-making flows

---

## Key Features

### Visual Workflow Design
- Drag-and-drop canvas with pan, zoom, and grid snapping
- Six specialized node types for comprehensive workflow modeling
- Smart edge routing with animated connections
- Mini-map for large workflow navigation

### Node Types

| Node | Purpose | Visual |
|------|---------|--------|
| **Start** | Entry point for workflow execution | 🟢 Green circle |
| **End** | Terminal point marking completion | 🔴 Red circle |
| **Action** | Execute operations (API calls, transformations) | 🔵 Blue rectangle |
| **Decision** | Conditional branching with Yes/No/Default paths | 🟡 Amber diamond |
| **Parallel** | Fork execution into concurrent branches | 🟣 Purple hexagon |
| **Loop** | Iterate with count or condition-based control | 🟠 Orange circle |

### API Integration
- Configure HTTP requests directly in Action nodes
- Support for GET, POST, PUT, PATCH, DELETE methods
- Custom headers and query parameters
- JSON request body editor
- Built-in API testing from the properties panel

### Data Flow Between Steps
- Reference outputs from previous nodes using `{{NodeLabel.response}}`
- Support for nested property access: `{{API.response.data[0].id}}`
- Auto-resolve variables in URLs, headers, body, and conditions
- Available variables panel shows accessible data from upstream nodes

### Interactive Testing
- Chat-style test runner with real-time execution visualization
- Visual highlighting of current and visited nodes
- Automatic condition evaluation with fallback to manual selection
- Live API execution during tests with response display
- Resizable test drawer panel

### Workflow Management
- Create, duplicate, and delete workflows
- Import/export workflows as JSON
- Server-side persistence with file-based storage
- Workflow validation with detailed error reporting

---

## Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React)                           │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌──────────────────┐ │
│  │  Header  │  │  Sidebar │  │  Canvas  │  │ Properties Panel │ │
│  └──────────┘  └──────────┘  └──────────┘  └──────────────────┘ │
│                       │                            │            │
│                       ▼                            ▼            │
│              ┌─────────────────────────────────────────┐        │
│              │         Zustand Store                   │        │
│              │  • Workflow state    • UI state         │        │
│              │  • Test runner       • Validation       │        │
│              └─────────────────────────────────────────┘        │
│                              │                                  │
│                              ▼                                  │
│              ┌─────────────────────────────────────────┐        │
│              │         Workflow Runner Service         │        │
│              │  • Node execution    • Context mgmt     │        │
│              │  • API calls         • Condition eval   │        │
│              └─────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
                               │
                               │ HTTP REST API
                               ▼
┌─────────────────────────────────────────────────────────────────┐
│                       SERVER (Express)                          │
├─────────────────────────────────────────────────────────────────┤
│  ┌──────────────────┐  ┌──────────────────┐                     │
│  │   Routes         │  │   Services       │                     │
│  │  /api/workflows  │──│  • Storage       │                     │
│  │                  │  │  • Validation    │                     │
│  └──────────────────┘  └──────────────────┘                     │
│                              │                                  │
│                              ▼                                  │
│              ┌─────────────────────────────────────────┐        │
│              │      File System (JSON Storage)         │        │
│              │          /data/workflows/*.json         │        │
│              └─────────────────────────────────────────┘        │
└─────────────────────────────────────────────────────────────────┘
```

### Tech Stack

| Layer | Technology | Purpose |
|-------|------------|---------|
| **Frontend** | React 18 + TypeScript | UI components and logic |
| **State** | Zustand | Global state management |
| **Canvas** | @xyflow/react | Visual node graph rendering |
| **Styling** | Tailwind CSS | Utility-first styling |
| **Build** | Vite | Fast development and bundling |
| **Backend** | Express + TypeScript | REST API server |
| **Storage** | File System (JSON) | Workflow persistence |

---

## Getting Started

### Prerequisites

- **Node.js** 18.0 or higher
- **npm** 9.0+ or **yarn** 1.22+

### Quick Start

```bash
# Clone the repository
git clone <repository-url>
cd workflowdesigner

# Install dependencies
cd server && npm install
cd ../client && npm install

# Start the server (Terminal 1)
cd server && npm run dev
# Server runs at http://localhost:3001

# Start the client (Terminal 2)
cd client && npm run dev
# Client runs at http://localhost:5173
```

### Production Build

```bash
# Build server
cd server && npm run build

# Build client
cd client && npm run build
```

---

## Documentation

### Project Structure

```
workflowdesigner/
├── client/                          # React Frontend Application
│   ├── src/
│   │   ├── api/                     # API client functions
│   │   │   └── workflowApi.ts       # REST API wrapper
│   │   ├── components/              # React UI components
│   │   │   ├── Canvas/              # React Flow canvas wrapper
│   │   │   ├── Header/              # Application header bar
│   │   │   ├── PropertiesPanel/     # Node/edge property editor
│   │   │   ├── Sidebar/             # Workflow list sidebar
│   │   │   ├── TestDrawer/          # Interactive test runner
│   │   │   ├── Toast/               # Notification system
│   │   │   └── Toolbar/             # Node palette toolbar
│   │   ├── nodes/                   # Custom React Flow nodes
│   │   │   ├── StartNode.tsx
│   │   │   ├── EndNode.tsx
│   │   │   ├── ActionNode.tsx
│   │   │   ├── DecisionNode.tsx
│   │   │   ├── ParallelNode.tsx
│   │   │   └── LoopNode.tsx
│   │   ├── services/                # Business logic services
│   │   │   └── workflowRunner.ts    # Test execution engine
│   │   ├── store/                   # State management
│   │   │   └── workflowStore.ts     # Zustand store
│   │   ├── types/                   # TypeScript definitions
│   │   │   └── workflow.ts          # Core type definitions
│   │   ├── App.tsx                  # Root application component
│   │   ├── main.tsx                 # Application entry point
│   │   └── index.css                # Global styles
│   ├── index.html
│   ├── package.json
│   ├── tailwind.config.js
│   ├── tsconfig.json
│   └── vite.config.ts
│
├── server/                          # Express Backend Server
│   ├── src/
│   │   ├── routes/
│   │   │   └── workflows.ts         # Workflow API endpoints
│   │   ├── services/
│   │   │   ├── storageService.ts    # File system operations
│   │   │   └── validationService.ts # Workflow validation
│   │   └── index.ts                 # Server entry point
│   ├── package.json
│   └── tsconfig.json
│
├── data/                            # Data storage directory
│   └── workflows/                   # JSON workflow files
│
└── README.md                        # This file
```

### Core Concepts

#### Workflows
A workflow is a directed graph consisting of nodes and edges. Each workflow has:
- **Unique ID** - UUID for identification
- **Metadata** - Name, description, timestamps
- **Nodes** - Processing units with type-specific behavior
- **Edges** - Connections defining execution flow

#### Nodes
Nodes are the building blocks of workflows:

```typescript
interface WorkflowNode {
  id: string;              // Unique identifier
  type: NodeType;          // start | end | action | decision | parallel | loop
  position: { x, y };      // Canvas coordinates
  data: {
    label: string;         // Display name
    description?: string;  // Optional description
    // Type-specific properties...
  };
}
```

#### Edges
Edges connect nodes and define execution flow:

```typescript
interface WorkflowEdge {
  id: string;              // Unique identifier
  source: string;          // Source node ID
  target: string;          // Target node ID
  sourceHandle?: string;   // Output handle (e.g., 'yes', 'no')
  label?: string;          // Edge label for display
}
```

#### Workflow Context
During test execution, the runner maintains a context object storing outputs from each executed node:

```typescript
interface WorkflowContext {
  [nodeLabel: string]: {
    response: unknown;     // Node output data
    status?: number;       // HTTP status (API calls)
    timestamp: Date;       // Execution time
    nodeType: NodeType;    // Type of node
  };
}
```

### Variable Syntax

Reference data from previous nodes using double curly braces:

| Syntax | Description | Example |
|--------|-------------|---------|
| `{{NodeLabel.response}}` | Full response from a node | `{{Get User.response}}` |
| `{{NodeLabel.response.field}}` | Access nested property | `{{API.response.data.id}}` |
| `{{NodeLabel.response[0]}}` | Access array element | `{{List.response[0].name}}` |
| `{{NodeLabel.status}}` | HTTP status code | `{{API.status}}` |

**Usage Examples:**

```
URL:     https://api.example.com/users/{{Get User.response.id}}
Header:  Authorization: Bearer {{Auth.response.token}}
Body:    {"userId": "{{Get User.response.id}}", "status": "active"}
Condition: {{Get User.response.active}} === true
```

### Action Node: API Configuration

When an Action node's type is "API Call", configure:

| Field | Description |
|-------|-------------|
| **URL** | Endpoint URL (supports variables) |
| **Method** | HTTP method (GET, POST, PUT, PATCH, DELETE) |
| **Headers** | Key-value pairs for request headers |
| **Query Params** | URL query parameters |
| **Body** | JSON request body (POST/PUT/PATCH) |

### Decision Node: Condition Evaluation

Decision nodes support automatic condition evaluation:

1. **With Condition** - If a condition is set and can be evaluated:
   - Variables are resolved from context
   - Expression is evaluated as JavaScript
   - `true` → Takes "Yes" path automatically
   - `false` → Takes "No" path automatically

2. **Without Condition / Evaluation Fails**:
   - User is prompted to select a path manually

**Condition Examples:**

```javascript
// Simple comparison
{{API.response}}.length > 100

// Boolean check
{{User.response.isActive}} === true

// Nested property
{{Order.response.status}} === "completed"

// Array check
{{Items.response[0].available}} === true
```

---

## API Reference

### Base URL
```
http://localhost:3001/api
```

### Endpoints

#### List Workflows
```http
GET /workflows
```

**Response:**
```json
[
  {
    "id": "uuid",
    "name": "My Workflow",
    "description": "Description",
    "createdAt": "2024-01-01T00:00:00.000Z",
    "updatedAt": "2024-01-01T00:00:00.000Z",
    "nodeCount": 5
  }
]
```

#### Get Workflow
```http
GET /workflows/:id
```

**Response:**
```json
{
  "id": "uuid",
  "name": "My Workflow",
  "description": "Description",
  "createdAt": "2024-01-01T00:00:00.000Z",
  "updatedAt": "2024-01-01T00:00:00.000Z",
  "nodes": [...],
  "edges": [...]
}
```

#### Create Workflow
```http
POST /workflows
Content-Type: application/json

{
  "name": "New Workflow",
  "description": "Optional description",
  "nodes": [...],
  "edges": [...]
}
```

#### Update Workflow
```http
PUT /workflows/:id
Content-Type: application/json

{
  "name": "Updated Name",
  "description": "Updated description",
  "nodes": [...],
  "edges": [...]
}
```

#### Delete Workflow
```http
DELETE /workflows/:id
```

#### Validate Workflow
```http
POST /workflows/:id/validate
```

**Response:**
```json
{
  "valid": true,
  "errors": [],
  "warnings": ["Consider adding more descriptive labels"]
}
```

### Workflow JSON Schema

```json
{
  "$schema": "http://json-schema.org/draft-07/schema#",
  "type": "object",
  "required": ["id", "name", "nodes", "edges"],
  "properties": {
    "id": { "type": "string", "format": "uuid" },
    "name": { "type": "string", "minLength": 1 },
    "description": { "type": "string" },
    "createdAt": { "type": "string", "format": "date-time" },
    "updatedAt": { "type": "string", "format": "date-time" },
    "nodes": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "type", "position", "data"],
        "properties": {
          "id": { "type": "string" },
          "type": { "enum": ["start", "end", "action", "decision", "parallel", "loop"] },
          "position": {
            "type": "object",
            "properties": {
              "x": { "type": "number" },
              "y": { "type": "number" }
            }
          },
          "data": {
            "type": "object",
            "required": ["label"],
            "properties": {
              "label": { "type": "string" },
              "description": { "type": "string" },
              "actionType": { "type": "string" },
              "apiConfig": { "type": "object" },
              "condition": { "type": "string" },
              "loopCount": { "type": "integer" },
              "loopCondition": { "type": "string" },
              "branches": { "type": "integer" }
            }
          }
        }
      }
    },
    "edges": {
      "type": "array",
      "items": {
        "type": "object",
        "required": ["id", "source", "target"],
        "properties": {
          "id": { "type": "string" },
          "source": { "type": "string" },
          "target": { "type": "string" },
          "sourceHandle": { "type": "string" },
          "label": { "type": "string" }
        }
      }
    }
  }
}
```

---

## User Guide

### Creating Your First Workflow

1. **Start the Application**
   - Launch server and client as described in Getting Started
   - Navigate to http://localhost:5173

2. **Create a New Workflow**
   - Click "New Workflow" in the sidebar
   - Enter a name and optional description

3. **Add Nodes**
   - Drag nodes from the toolbar onto the canvas
   - A Start node is created by default

4. **Connect Nodes**
   - Click and drag from a node's output handle (bottom/sides)
   - Drop on another node's input handle (top)

5. **Configure Node Properties**
   - Select a node to open the Properties Panel
   - Set labels, descriptions, and type-specific settings

6. **Save Your Workflow**
   - Click "Save" in the header
   - Workflow is persisted to the server

### Testing Workflows

1. **Open Test Drawer**
   - Click "Test Flow" button in the header
   - Resizable drawer opens at the bottom

2. **Start Test**
   - Click "Start Test" to begin execution
   - Current node is highlighted on canvas

3. **Interactive Decisions**
   - At Decision nodes, conditions are auto-evaluated when possible
   - Manual selection appears if evaluation fails

4. **View API Responses**
   - API calls display request details and responses
   - Use response data in subsequent nodes

5. **Stop/Reset**
   - "Stop" ends execution immediately
   - "Reset" clears test state for a fresh run

### Best Practices

1. **Naming Conventions**
   - Use descriptive, unique labels for nodes
   - Labels are used for variable references (`{{NodeLabel.response}}`)

2. **Workflow Organization**
   - Keep workflows focused on single processes
   - Use Parallel nodes for concurrent operations
   - Use Loop nodes for repetitive tasks

3. **Error Handling**
   - Add Decision nodes after API calls to check status
   - Provide alternative paths for failure scenarios

4. **Testing**
   - Test workflows incrementally as you build
   - Verify API configurations with "Test API" button
   - Check variable resolution in the test chat

---

## Troubleshooting

### Common Issues

| Issue | Solution |
|-------|----------|
| Cannot connect nodes | Ensure you're dragging from source (output) to target (input) handle |
| Variables not resolving | Check node label matches exactly (case-sensitive) |
| API call fails | Verify URL, check CORS settings on target API |
| Condition not evaluating | Ensure referenced nodes have executed before the decision |
| Canvas not responding | Try refreshing the browser |

### Debug Mode

Open browser DevTools (F12) to view:
- Console logs for workflow execution
- Network tab for API calls
- React DevTools for component state

---

## Contributing

### Development Setup

```bash
# Install dependencies
cd client && npm install
cd ../server && npm install

# Run in development mode with hot reload
cd server && npm run dev
cd client && npm run dev
```

### Code Style

- TypeScript strict mode enabled
- ESLint for code quality
- Prettier for formatting
- Follow existing patterns in codebase

### Pull Request Process

1. Fork the repository
2. Create a feature branch
3. Make changes with tests
4. Submit PR with description
5. Address review feedback

---

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## Support

For issues and feature requests, please use the GitHub Issues page.

---

**Built with ❤️ using React, TypeScript, and Node.js**
