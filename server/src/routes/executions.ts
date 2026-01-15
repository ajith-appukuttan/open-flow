import { Router } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  saveExecution,
  getExecution,
  getExecutions,
  deleteExecution,
  type WorkflowExecution,
} from '../services/executionService.js';
import { workflowExists } from '../services/storageService.js';

const router = Router();

// Middleware to validate userId
function requireUserId(req: any, res: any, next: any) {
  const userId = req.query.userId || req.body?.userId;
  if (!userId) {
    return res.status(400).json({ message: 'userId is required' });
  }
  req.userId = userId;
  next();
}

// List all executions for a workflow
router.get('/:workflowId/executions', requireUserId, (req: any, res) => {
  try {
    const { workflowId } = req.params;
    const userId = req.userId;

    if (!workflowExists(userId, workflowId)) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const executions = getExecutions(userId, workflowId);
    
    // Return list items (without full step details)
    const listItems = executions.map(exec => ({
      id: exec.id,
      workflowVersion: exec.workflowVersion,
      startedAt: exec.startedAt,
      completedAt: exec.completedAt,
      duration: exec.duration,
      status: exec.status,
      stepCount: exec.steps.length,
      error: exec.error,
    }));

    res.json(listItems);
  } catch (error) {
    console.error('Error listing executions:', error);
    res.status(500).json({ message: 'Failed to list executions' });
  }
});

// Get single execution with full details
router.get('/:workflowId/executions/:executionId', requireUserId, (req: any, res) => {
  try {
    const { workflowId, executionId } = req.params;
    const userId = req.userId;

    if (!workflowExists(userId, workflowId)) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const execution = getExecution(userId, workflowId, executionId);
    if (!execution) {
      return res.status(404).json({ message: 'Execution not found' });
    }

    res.json(execution);
  } catch (error) {
    console.error('Error getting execution:', error);
    res.status(500).json({ message: 'Failed to get execution' });
  }
});

// Save a new execution
router.post('/:workflowId/executions', requireUserId, (req: any, res) => {
  try {
    const { workflowId } = req.params;
    const userId = req.userId;

    if (!workflowExists(userId, workflowId)) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    const {
      workflowVersion,
      workflowName,
      startedAt,
      completedAt,
      duration,
      status,
      steps,
      context,
      error,
    } = req.body;

    if (!workflowVersion || !workflowName || !startedAt || !status) {
      return res.status(400).json({ message: 'Missing required execution fields' });
    }

    const execution: WorkflowExecution = {
      id: `exec-${Date.now()}-${uuidv4().slice(0, 8)}`,
      workflowId,
      workflowVersion,
      workflowName,
      startedAt,
      completedAt,
      duration,
      status,
      steps: steps || [],
      context: context || {},
      error,
    };

    const saved = saveExecution(userId, workflowId, execution);
    res.status(201).json(saved);
  } catch (error) {
    console.error('Error saving execution:', error);
    res.status(500).json({ message: 'Failed to save execution' });
  }
});

// Delete an execution
router.delete('/:workflowId/executions/:executionId', requireUserId, (req: any, res) => {
  try {
    const { workflowId, executionId } = req.params;
    const userId = req.userId;

    if (!workflowExists(userId, workflowId)) {
      return res.status(404).json({ message: 'Workflow not found' });
    }

    if (!deleteExecution(userId, workflowId, executionId)) {
      return res.status(404).json({ message: 'Execution not found' });
    }

    res.status(204).send();
  } catch (error) {
    console.error('Error deleting execution:', error);
    res.status(500).json({ message: 'Failed to delete execution' });
  }
});

export default router;
