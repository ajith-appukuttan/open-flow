import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../../data/workflows');
const MAX_EXECUTIONS = 50;

export interface ExecutionStep {
  nodeId: string;
  nodeLabel: string;
  nodeType: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  status: 'success' | 'failed' | 'skipped';
  input?: Record<string, unknown>;
  output?: Record<string, unknown>;
  error?: string;
  metadata?: Record<string, unknown>;
}

export interface WorkflowExecution {
  id: string;
  workflowId: string;
  workflowVersion: number;
  workflowName: string;
  startedAt: string;
  completedAt?: string;
  duration?: number;
  status: 'running' | 'completed' | 'failed' | 'cancelled';
  steps: ExecutionStep[];
  context: Record<string, unknown>;
  error?: string;
}

function getExecutionsDir(userId: string, workflowId: string): string {
  return path.join(DATA_DIR, userId, workflowId, 'executions');
}

function ensureExecutionsDir(userId: string, workflowId: string): string {
  const dir = getExecutionsDir(userId, workflowId);
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
  }
  return dir;
}

function getExecutionPath(userId: string, workflowId: string, executionId: string): string {
  return path.join(getExecutionsDir(userId, workflowId), `${executionId}.json`);
}

export function saveExecution(userId: string, workflowId: string, execution: WorkflowExecution): WorkflowExecution {
  ensureExecutionsDir(userId, workflowId);
  const filePath = getExecutionPath(userId, workflowId, execution.id);
  fs.writeFileSync(filePath, JSON.stringify(execution, null, 2), 'utf-8');
  
  // Prune old executions
  pruneOldExecutions(userId, workflowId);
  
  return execution;
}

export function getExecution(userId: string, workflowId: string, executionId: string): WorkflowExecution | null {
  const filePath = getExecutionPath(userId, workflowId, executionId);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

export function getExecutions(userId: string, workflowId: string): WorkflowExecution[] {
  const dir = getExecutionsDir(userId, workflowId);
  if (!fs.existsSync(dir)) {
    return [];
  }
  
  const files = fs.readdirSync(dir).filter(f => f.endsWith('.json'));
  const executions: WorkflowExecution[] = [];
  
  for (const file of files) {
    try {
      const content = fs.readFileSync(path.join(dir, file), 'utf-8');
      executions.push(JSON.parse(content));
    } catch (err) {
      console.error(`Failed to read execution file ${file}:`, err);
    }
  }
  
  // Sort by startedAt descending (newest first)
  return executions.sort((a, b) => 
    new Date(b.startedAt).getTime() - new Date(a.startedAt).getTime()
  );
}

export function deleteExecution(userId: string, workflowId: string, executionId: string): boolean {
  const filePath = getExecutionPath(userId, workflowId, executionId);
  if (!fs.existsSync(filePath)) {
    return false;
  }
  fs.unlinkSync(filePath);
  return true;
}

function pruneOldExecutions(userId: string, workflowId: string): void {
  const executions = getExecutions(userId, workflowId);
  
  if (executions.length > MAX_EXECUTIONS) {
    // Delete oldest executions beyond the limit
    const toDelete = executions.slice(MAX_EXECUTIONS);
    for (const exec of toDelete) {
      const filePath = getExecutionPath(userId, workflowId, exec.id);
      if (fs.existsSync(filePath)) {
        fs.unlinkSync(filePath);
        console.log(`🗑️ Pruned old execution: ${exec.id}`);
      }
    }
  }
}

export function executionExists(userId: string, workflowId: string, executionId: string): boolean {
  return fs.existsSync(getExecutionPath(userId, workflowId, executionId));
}
