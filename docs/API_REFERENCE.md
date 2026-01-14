# API Reference

This document provides a complete reference for the Workflow Designer REST API.

---

## Overview

The Workflow Designer API is a RESTful service that provides endpoints for managing workflows. All requests and responses use JSON format.

### Base URL

```
http://localhost:3001/api
```

### Authentication

Currently, the API does not require authentication. For production deployments, implement your preferred authentication mechanism (JWT, API Keys, OAuth2).

### Content Type

All requests must include:
```
Content-Type: application/json
```

### Error Handling

The API returns standard HTTP status codes:

| Status | Description |
|--------|-------------|
| 200 | Success |
| 201 | Created |
| 400 | Bad Request - Invalid input |
| 404 | Not Found - Resource doesn't exist |
| 500 | Internal Server Error |

Error responses include:
```json
{
  "error": "Error message describing the issue"
}
```

---

## Endpoints

### Workflows

#### List All Workflows

Retrieves a summary list of all workflows.

```http
GET /workflows
```

**Parameters:** None

**Response:** `200 OK`
```json
[
  {
    "id": "24b88b92-0692-44f4-8afb-a2d2eed60526",
    "name": "User Onboarding",
    "description": "New user registration flow",
    "createdAt": "2024-01-15T10:30:00.000Z",
    "updatedAt": "2024-01-15T14:22:00.000Z",
    "nodeCount": 8
  },
  {
    "id": "f7e3a1b2-9c8d-4e5f-a6b7-c8d9e0f1a2b3",
    "name": "Order Processing",
    "description": "E-commerce order workflow",
    "createdAt": "2024-01-10T08:00:00.000Z",
    "updatedAt": "2024-01-14T16:45:00.000Z",
    "nodeCount": 12
  }
]
```

---

#### Get Single Workflow

Retrieves a complete workflow with all nodes and edges.

```http
GET /workflows/:id
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | path | Workflow UUID |

**Response:** `200 OK`
```json
{
  "id": "24b88b92-0692-44f4-8afb-a2d2eed60526",
  "name": "User Onboarding",
  "description": "New user registration flow",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T14:22:00.000Z",
  "nodes": [
    {
      "id": "start-1",
      "type": "start",
      "position": { "x": 250, "y": 50 },
      "data": {
        "label": "Start"
      }
    },
    {
      "id": "action-1",
      "type": "action",
      "position": { "x": 250, "y": 150 },
      "data": {
        "label": "Validate Email",
        "description": "Check if email is valid",
        "actionType": "api_call",
        "apiConfig": {
          "url": "https://api.example.com/validate-email",
          "method": "POST",
          "headers": [
            { "key": "Content-Type", "value": "application/json" }
          ],
          "body": "{\"email\": \"{{input.email}}\"}",
          "queryParams": []
        }
      }
    },
    {
      "id": "decision-1",
      "type": "decision",
      "position": { "x": 250, "y": 300 },
      "data": {
        "label": "Email Valid?",
        "condition": "{{Validate Email.response.valid}} === true"
      }
    },
    {
      "id": "end-1",
      "type": "end",
      "position": { "x": 250, "y": 450 },
      "data": {
        "label": "Complete"
      }
    }
  ],
  "edges": [
    {
      "id": "edge-1",
      "source": "start-1",
      "target": "action-1",
      "type": "smoothstep"
    },
    {
      "id": "edge-2",
      "source": "action-1",
      "target": "decision-1",
      "type": "smoothstep"
    },
    {
      "id": "edge-3",
      "source": "decision-1",
      "sourceHandle": "yes",
      "target": "end-1",
      "label": "Yes",
      "type": "smoothstep"
    }
  ]
}
```

**Error Response:** `404 Not Found`
```json
{
  "error": "Workflow not found"
}
```

---

#### Create Workflow

Creates a new workflow.

```http
POST /workflows
```

**Request Body:**
```json
{
  "name": "New Workflow",
  "description": "Optional description",
  "nodes": [
    {
      "id": "start-1",
      "type": "start",
      "position": { "x": 250, "y": 100 },
      "data": { "label": "Start" }
    }
  ],
  "edges": []
}
```

| Field | Type | Required | Description |
|-------|------|----------|-------------|
| name | string | Yes | Workflow name (1-255 chars) |
| description | string | No | Optional description |
| nodes | array | No | Array of node objects |
| edges | array | No | Array of edge objects |

**Response:** `201 Created`
```json
{
  "id": "new-uuid-here",
  "name": "New Workflow",
  "description": "Optional description",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T10:30:00.000Z",
  "nodes": [...],
  "edges": [...]
}
```

---

#### Update Workflow

Updates an existing workflow.

```http
PUT /workflows/:id
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | path | Workflow UUID |

**Request Body:**
```json
{
  "name": "Updated Workflow Name",
  "description": "Updated description",
  "nodes": [...],
  "edges": [...]
}
```

**Response:** `200 OK`
```json
{
  "id": "24b88b92-0692-44f4-8afb-a2d2eed60526",
  "name": "Updated Workflow Name",
  "description": "Updated description",
  "createdAt": "2024-01-15T10:30:00.000Z",
  "updatedAt": "2024-01-15T16:00:00.000Z",
  "nodes": [...],
  "edges": [...]
}
```

---

#### Delete Workflow

Deletes a workflow permanently.

```http
DELETE /workflows/:id
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | path | Workflow UUID |

**Response:** `200 OK`
```json
{
  "message": "Workflow deleted successfully"
}
```

---

#### Validate Workflow

Validates workflow structure and returns errors/warnings.

```http
POST /workflows/:id/validate
```

**Parameters:**

| Parameter | Type | Description |
|-----------|------|-------------|
| id | path | Workflow UUID |

**Response:** `200 OK`
```json
{
  "valid": true,
  "errors": [],
  "warnings": [
    "Node 'action-2' has no description",
    "Consider adding error handling after API calls"
  ]
}
```

**Validation Rules:**

| Rule | Severity | Description |
|------|----------|-------------|
| Single Start Node | Error | Workflow must have exactly one Start node |
| At Least One End Node | Error | Workflow must have at least one End node |
| Start Node Connectivity | Error | Start node must have outgoing connections |
| End Node Connectivity | Error | End nodes must have incoming connections |
| Orphan Nodes | Warning | All nodes should be connected |
| Missing Labels | Warning | Nodes should have descriptive labels |
| Unreachable Nodes | Warning | All nodes should be reachable from Start |

---

## Data Models

### Node Types

#### Start Node
```json
{
  "id": "start-1",
  "type": "start",
  "position": { "x": 250, "y": 100 },
  "data": {
    "label": "Start",
    "description": "Workflow entry point"
  }
}
```

#### End Node
```json
{
  "id": "end-1",
  "type": "end",
  "position": { "x": 250, "y": 500 },
  "data": {
    "label": "Complete",
    "description": "Successful completion"
  }
}
```

#### Action Node
```json
{
  "id": "action-1",
  "type": "action",
  "position": { "x": 250, "y": 200 },
  "data": {
    "label": "Fetch User Data",
    "description": "Retrieve user from API",
    "actionType": "api_call",
    "apiConfig": {
      "url": "https://api.example.com/users/{{userId}}",
      "method": "GET",
      "headers": [
        { "key": "Authorization", "value": "Bearer {{token}}" }
      ],
      "body": "",
      "queryParams": [
        { "key": "include", "value": "profile" }
      ]
    }
  }
}
```

**Action Types:**
- `api_call` - HTTP API request
- `database` - Database operation
- `notification` - Send notification
- `transform` - Data transformation
- `validate` - Validation logic
- `custom` - Custom action

#### Decision Node
```json
{
  "id": "decision-1",
  "type": "decision",
  "position": { "x": 250, "y": 350 },
  "data": {
    "label": "Is Active?",
    "description": "Check if user is active",
    "condition": "{{Fetch User Data.response.active}} === true"
  }
}
```

**Output Handles:**
- `yes` - Condition evaluates to true
- `no` - Condition evaluates to false
- `default` - Fallback path

#### Loop Node
```json
{
  "id": "loop-1",
  "type": "loop",
  "position": { "x": 250, "y": 300 },
  "data": {
    "label": "Process Items",
    "description": "Iterate through items",
    "loopCount": 10,
    "loopCondition": "{{items.response}}.length > 0"
  }
}
```

**Output Handles:**
- `loop` - Continue iteration
- `exit` - Exit loop

#### Parallel Node
```json
{
  "id": "parallel-1",
  "type": "parallel",
  "position": { "x": 250, "y": 300 },
  "data": {
    "label": "Parallel Tasks",
    "description": "Execute tasks concurrently",
    "branches": 3
  }
}
```

### Edge Schema
```json
{
  "id": "edge-1",
  "source": "start-1",
  "target": "action-1",
  "sourceHandle": "output",
  "targetHandle": "input",
  "label": "Begin",
  "type": "smoothstep",
  "data": {
    "label": "Begin"
  }
}
```

---

## Rate Limiting

For production deployments, implement rate limiting:

| Endpoint | Limit |
|----------|-------|
| GET /workflows | 100 requests/minute |
| POST /workflows | 20 requests/minute |
| PUT /workflows/:id | 30 requests/minute |
| DELETE /workflows/:id | 10 requests/minute |

---

## Versioning

The API uses URL versioning. Current version: **v1** (implicit)

Future versions will use:
```
/api/v2/workflows
```

---

## SDK Examples

### JavaScript/TypeScript

```typescript
// Using fetch
const response = await fetch('http://localhost:3001/api/workflows');
const workflows = await response.json();

// Using the provided API client
import * as api from './api/workflowApi';

const workflows = await api.getWorkflows();
const workflow = await api.getWorkflow('uuid');
const created = await api.createWorkflow({ name: 'New', description: '' });
const updated = await api.updateWorkflow('uuid', workflow);
await api.deleteWorkflow('uuid');
const validation = await api.validateWorkflow('uuid');
```

### cURL

```bash
# List workflows
curl http://localhost:3001/api/workflows

# Get single workflow
curl http://localhost:3001/api/workflows/24b88b92-0692-44f4-8afb-a2d2eed60526

# Create workflow
curl -X POST http://localhost:3001/api/workflows \
  -H "Content-Type: application/json" \
  -d '{"name": "New Workflow", "description": "Test"}'

# Update workflow
curl -X PUT http://localhost:3001/api/workflows/uuid \
  -H "Content-Type: application/json" \
  -d '{"name": "Updated Name"}'

# Delete workflow
curl -X DELETE http://localhost:3001/api/workflows/uuid

# Validate workflow
curl -X POST http://localhost:3001/api/workflows/uuid/validate
```

---

## Changelog

### v1.0.0 (Current)
- Initial API release
- CRUD operations for workflows
- Workflow validation endpoint
- File-based storage

### Planned Features
- Workflow versioning
- Execution history
- Webhook triggers
- Batch operations
