import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  getAllWorkflowDirs,
  readWorkflow,
  writeWorkflow,
  deleteWorkflowDir,
  workflowExists,
  getVersionsList,
  readVersion,
  restoreVersion,
  readWorkflowMetadata,
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
  userId: string;
  currentVersion?: number;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

// Middleware to validate userId
function requireUserId(req: any, res: any, next: any) {
  const userId = req.query.userId || req.body?.userId;
  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }
  req.userId = userId;
  next();
}

// List all workflows for a user
router.get('/', requireUserId, (req: any, res) => {
  try {
    const userId = req.userId;
    const workflowDirs = getAllWorkflowDirs(userId);
    const workflows = workflowDirs
      .map(id => {
        const workflow = readWorkflow(userId, id) as Workflow | null;
        if (!workflow) return null;
        return {
          id: workflow.id,
          name: workflow.name,
          description: workflow.description,
          createdAt: workflow.createdAt,
          updatedAt: workflow.updatedAt,
          currentVersion: workflow.currentVersion,
          nodeCount: workflow.nodes?.length || 0,
        };
      })
      .filter(Boolean)
      .sort((a: any, b: any) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());

    res.json(workflows);
  } catch (error) {
    console.error('Error listing workflows:', error);
    res.status(500).json({ message: 'Failed to list workflows' });
  }
});

// Get single workflow
router.get('/:id', requireUserId, (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const workflow = readWorkflow(userId, id);

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    res.json(workflow);
  } catch (error) {
    console.error('Error getting workflow:', error);
    res.status(500).json({ message: 'Failed to get workflow' });
  }
});

// Create new workflow
router.post('/', (req, res) => {
  try {
    const { name, description = '', nodes, edges, userId } = req.body;

    if (!name) {
      return res.status(400).json({ message: 'Workflow name is required' });
    }

    if (!userId) {
      return res.status(400).json({ message: 'userId is required' });
    }

    const id = uuidv4();
    const now = new Date().toISOString();

    const workflow: Workflow = {
      id,
      name,
      description,
      userId,
      createdAt: now,
      updatedAt: now,
      currentVersion: 0,
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

    writeWorkflow(id, userId, workflow);
    
    // Read back the workflow to get the updated version
    const savedWorkflow = readWorkflow(userId, id);
    res.status(201).json(savedWorkflow);
  } catch (error) {
    console.error('Error creating workflow:', error);
    res.status(500).json({ message: 'Failed to create workflow' });
  }
});

// Update workflow (creates a new version)
router.put('/:id', requireUserId, (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!workflowExists(userId, id)) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const existing = readWorkflow(userId, id) as Workflow;
    const { name, description, nodes, edges } = req.body;

    const workflow: Workflow = {
      ...existing,
      name: name ?? existing.name,
      description: description ?? existing.description,
      nodes: nodes ?? existing.nodes,
      edges: edges ?? existing.edges,
    };

    writeWorkflow(id, userId, workflow);
    
    // Read back the workflow to get the updated version
    const savedWorkflow = readWorkflow(userId, id);
    res.json(savedWorkflow);
  } catch (error) {
    console.error('Error updating workflow:', error);
    res.status(500).json({ message: 'Failed to update workflow' });
  }
});

// Delete workflow
router.delete('/:id', requireUserId, (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!deleteWorkflowDir(userId, id)) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting workflow:', error);
    res.status(500).json({ message: 'Failed to delete workflow' });
  }
});

// Validate workflow
router.post('/:id/validate', requireUserId, (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;
    const workflow = readWorkflow(userId, id) as Workflow;

    if (!workflow) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const result = validateWorkflow(workflow);
    res.json(result);
  } catch (error) {
    console.error('Error validating workflow:', error);
    res.status(500).json({ message: 'Failed to validate workflow' });
  }
});

// ============ VERSION ENDPOINTS ============

// Get all versions for a workflow
router.get('/:id/versions', requireUserId, (req: any, res) => {
  try {
    const { id } = req.params;
    const userId = req.userId;

    if (!workflowExists(userId, id)) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const metadata = readWorkflowMetadata(userId, id);
    const versionNumbers = getVersionsList(userId, id);
    
    const versions = versionNumbers.map(versionNum => {
      const versionData = readVersion(userId, id, versionNum);
      if (!versionData) return null;
      
      return {
        version: versionData.version,
        savedAt: versionData.savedAt,
        message: versionData.message,
        nodeCount: versionData.nodes?.length || 0,
        edgeCount: versionData.edges?.length || 0,
        isCurrent: metadata?.currentVersion === versionNum,
      };
    }).filter(Boolean);

    res.json(versions);
  } catch (error) {
    console.error('Error getting versions:', error);
    res.status(500).json({ message: 'Failed to get versions' });
  }
});

// Get a specific version
router.get('/:id/versions/:version', requireUserId, (req: any, res) => {
  try {
    const { id, version } = req.params;
    const userId = req.userId;
    const versionNum = parseInt(version, 10);

    if (isNaN(versionNum)) {
      return res.status(400).json({ message: 'Invalid version number' });
    }

    if (!workflowExists(userId, id)) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const versionData = readVersion(userId, id, versionNum);
    if (!versionData) {
      return res.status(404).json({ message: 'Version not found' });
    }

    // Include metadata for context
    const metadata = readWorkflowMetadata(userId, id);
    
    res.json({
      ...versionData,
      workflowId: id,
      workflowName: metadata?.name,
      isCurrent: metadata?.currentVersion === versionNum,
    });
  } catch (error) {
    console.error('Error getting version:', error);
    res.status(500).json({ message: 'Failed to get version' });
  }
});

// Restore a specific version
router.post('/:id/versions/:version/restore', requireUserId, (req: any, res) => {
  try {
    const { id, version } = req.params;
    const userId = req.userId;
    const versionNum = parseInt(version, 10);

    if (isNaN(versionNum)) {
      return res.status(400).json({ message: 'Invalid version number' });
    }

    if (!workflowExists(userId, id)) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const restoredWorkflow = restoreVersion(userId, id, versionNum);
    if (!restoredWorkflow) {
      return res.status(404).json({ message: 'Version not found' });
    }

    res.json(restoredWorkflow);
  } catch (error) {
    console.error('Error restoring version:', error);
    res.status(500).json({ message: 'Failed to restore version' });
  }
});

export default router;
