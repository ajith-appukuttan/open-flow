import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getAllWorkflowFiles,
  readWorkflow,
  writeWorkflow,
  deleteWorkflowFile,
  workflowExists,
} from '../services/storageService.js';
import { validateWorkflow } from '../services/validationService.js';

const router = Router();

interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { label: string };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  updatedAt: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

// List all workflows
router.get('/', (_req, res) => {
  try {
    const files = getAllWorkflowFiles();
    const workflows = files.map(file => {
      const id = file.replace('.json', '');
      const workflow = readWorkflow(id) as Workflow;
      return {
        id: workflow.id,
        name: workflow.name,
        description: workflow.description,
        createdAt: workflow.createdAt,
        updatedAt: workflow.updatedAt,
        nodeCount: workflow.nodes?.length || 0,
      };
    }).sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    res.json(workflows);
  } catch (error) {
    res.status(500).json({ message: 'Failed to list workflows' });
  }
});

// Get single workflow
router.get('/:id', (req, res) => {
  try {
    const { id } = req.params;
    const workflow = readWorkflow(id);

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (error) {
    res.status(500).json({ message: 'Failed to get workflow' });
  }
});

// Create new workflow
router.post('/', (req, res) => {
  try {
    const { name, description = '', nodes, edges } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Workflow name is required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const workflow: Workflow = {
      id,
      name,
      description,
      createdAt: now,
      updatedAt: now,
      nodes: nodes || [
        {
          id: 'start-1',
          type: 'start',
          position: { x: 250, y: 100 },
          data: { label: 'Start' },
        },
      ],
      edges: edges || [],
    };

    writeWorkflow(id, workflow);
    res.status(201).json(workflow);
  } catch (error) {
    res.status(500).json({ message: 'Failed to create workflow' });
  }
});

// Update workflow
router.put('/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!workflowExists(id)) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const existing = readWorkflow(id) as Workflow;
    const { name, description, nodes, edges } = req.body;

    const workflow: Workflow = {
      ...existing,
      name: name ?? existing.name,
      description: description ?? existing.description,
      nodes: nodes ?? existing.nodes,
      edges: edges ?? existing.edges,
      updatedAt: new Date().toISOString(),
    };

    writeWorkflow(id, workflow);
    res.json(workflow);
  } catch (error) {
    res.status(500).json({ message: 'Failed to update workflow' });
  }
});

// Delete workflow
router.delete('/:id', (req, res) => {
  try {
    const { id } = req.params;

    if (!deleteWorkflowFile(id)) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    res.status(204).send();
  } catch (error) {
    res.status(500).json({ message: 'Failed to delete workflow' });
  }
});

// Validate workflow
router.post('/:id/validate', (req, res) => {
  try {
    const { id } = req.params;
    const workflow = readWorkflow(id) as Workflow;

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const result = validateWorkflow(workflow);
    res.json(result);
  } catch (error) {
    res.status(500).json({ message: 'Failed to validate workflow' });
  }
});

export default router;
