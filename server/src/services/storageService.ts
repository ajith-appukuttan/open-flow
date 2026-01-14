import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../../data/workflows');

export function ensureDataDirectory(): void {
  if (!fs.existsSync(DATA_DIR)) {
    fs.mkdirSync(DATA_DIR, { recursive: true });
    console.log(`📁 Created data directory: ${DATA_DIR}`);
  }
}

export function getWorkflowPath(id: string): string {
  return path.join(DATA_DIR, `${id}.json`);
}

export function getAllWorkflowFiles(): string[] {
  ensureDataDirectory();
  return fs.readdirSync(DATA_DIR).filter(file => file.endsWith('.json'));
}

export function readWorkflow(id: string): object | null {
  const filePath = getWorkflowPath(id);
  if (!fs.existsSync(filePath)) {
    return null;
  }
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

export function writeWorkflow(id: string, data: object): void {
  ensureDataDirectory();
  const filePath = getWorkflowPath(id);
  fs.writeFileSync(filePath, JSON.stringify(data, null, 2), 'utf-8');
}

export function deleteWorkflowFile(id: string): boolean {
  const filePath = getWorkflowPath(id);
  if (!fs.existsSync(filePath)) {
    return false;
  }
  fs.unlinkSync(filePath);
  return true;
}

export function workflowExists(id: string): boolean {
  return fs.existsSync(getWorkflowPath(id));
}
