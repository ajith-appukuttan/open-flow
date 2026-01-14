import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DATA_DIR = path.join(__dirname, '../../../data/workflows');
const MAX_VERSIONS = 10;

// Interfaces for versioned workflows
interface WorkflowVersion {
  version: number;
  savedAt: string;
  message?: string;
  nodes: object[];
  edges: object[];
}

interface WorkflowMetadata {
  id: string;
  name: string;
  description: string;
  userId: string;
  createdAt: string;
  updatedAt: string;
  currentVersion: number;
}

export function ensureDataDirectory(userId?: string, workflowId?: string): string {
  let dir = DATA_DIR;
  if (userId) {
    dir = path.join(dir, userId);
  }
  if (workflowId) {
    dir = path.join(dir, workflowId);
  }
  if (!fs.existsSync(dir)) {
    fs.mkdirSync(dir, { recursive: true });
    console.log(`📁 Created data directory: ${dir}`);
  }
  return dir;
}

export function getWorkflowDir(userId: string, workflowId: string): string {
  return path.join(DATA_DIR, userId, workflowId);
}

export function getMetadataPath(userId: string, workflowId: string): string {
  return path.join(getWorkflowDir(userId, workflowId), 'metadata.json');
}

export function getVersionPath(userId: string, workflowId: string, version: number): string {
  return path.join(getWorkflowDir(userId, workflowId), `v${version}.json`);
}

export function getAllWorkflowDirs(userId: string): string[] {
  const userDir = ensureDataDirectory(userId);
  try {
    return fs.readdirSync(userDir).filter(item => {
      const itemPath = path.join(userDir, item);
      return fs.statSync(itemPath).isDirectory();
    });
  } catch {
    return [];
  }
}

export function readWorkflowMetadata(userId: string, workflowId: string): WorkflowMetadata | null {
  const metadataPath = getMetadataPath(userId, workflowId);
  if (!fs.existsSync(metadataPath)) {
    return null;
  }
  const content = fs.readFileSync(metadataPath, 'utf-8');
  return JSON.parse(content);
}

export function writeWorkflowMetadata(userId: string, workflowId: string, metadata: WorkflowMetadata): void {
  ensureDataDirectory(userId, workflowId);
  const metadataPath = getMetadataPath(userId, workflowId);
  fs.writeFileSync(metadataPath, JSON.stringify(metadata, null, 2), 'utf-8');
}

export function readVersion(userId: string, workflowId: string, version: number): WorkflowVersion | null {
  const versionPath = getVersionPath(userId, workflowId, version);
  if (!fs.existsSync(versionPath)) {
    return null;
  }
  const content = fs.readFileSync(versionPath, 'utf-8');
  return JSON.parse(content);
}

export function writeVersion(userId: string, workflowId: string, versionData: WorkflowVersion): void {
  ensureDataDirectory(userId, workflowId);
  const versionPath = getVersionPath(userId, workflowId, versionData.version);
  fs.writeFileSync(versionPath, JSON.stringify(versionData, null, 2), 'utf-8');
}

export function getVersionsList(userId: string, workflowId: string): number[] {
  const workflowDir = getWorkflowDir(userId, workflowId);
  if (!fs.existsSync(workflowDir)) {
    return [];
  }
  
  const files = fs.readdirSync(workflowDir);
  const versions: number[] = [];
  
  for (const file of files) {
    const match = file.match(/^v(\d+)\.json$/);
    if (match) {
      versions.push(parseInt(match[1], 10));
    }
  }
  
  return versions.sort((a, b) => b - a); // Sort descending (newest first)
}

export function pruneOldVersions(userId: string, workflowId: string): void {
  const versions = getVersionsList(userId, workflowId);
  
  // Keep only the last MAX_VERSIONS
  if (versions.length > MAX_VERSIONS) {
    const versionsToDelete = versions.slice(MAX_VERSIONS);
    for (const version of versionsToDelete) {
      const versionPath = getVersionPath(userId, workflowId, version);
      if (fs.existsSync(versionPath)) {
        fs.unlinkSync(versionPath);
        console.log(`🗑️ Pruned old version: v${version} of workflow ${workflowId}`);
      }
    }
  }
}

export function saveWorkflowWithVersion(
  userId: string,
  workflowId: string,
  metadata: WorkflowMetadata,
  nodes: object[],
  edges: object[],
  message?: string
): { metadata: WorkflowMetadata; version: WorkflowVersion } {
  // Get current version number and increment
  const existingMetadata = readWorkflowMetadata(userId, workflowId);
  const newVersionNumber = existingMetadata ? existingMetadata.currentVersion + 1 : 1;
  
  // Update metadata
  const updatedMetadata: WorkflowMetadata = {
    ...metadata,
    currentVersion: newVersionNumber,
    updatedAt: new Date().toISOString(),
  };
  
  // Create version data
  const versionData: WorkflowVersion = {
    version: newVersionNumber,
    savedAt: updatedMetadata.updatedAt,
    message: message || 'Auto-saved',
    nodes,
    edges,
  };
  
  // Write metadata and version
  writeWorkflowMetadata(userId, workflowId, updatedMetadata);
  writeVersion(userId, workflowId, versionData);
  
  // Prune old versions
  pruneOldVersions(userId, workflowId);
  
  return { metadata: updatedMetadata, version: versionData };
}

export function readWorkflow(userId: string, workflowId: string): object | null {
  const metadata = readWorkflowMetadata(userId, workflowId);
  if (!metadata) {
    return null;
  }
  
  const currentVersion = readVersion(userId, workflowId, metadata.currentVersion);
  if (!currentVersion) {
    return null;
  }
  
  // Combine metadata and current version data
  return {
    id: metadata.id,
    name: metadata.name,
    description: metadata.description,
    userId: metadata.userId,
    createdAt: metadata.createdAt,
    updatedAt: metadata.updatedAt,
    currentVersion: metadata.currentVersion,
    nodes: currentVersion.nodes,
    edges: currentVersion.edges,
  };
}

export function deleteWorkflowDir(userId: string, workflowId: string): boolean {
  const workflowDir = getWorkflowDir(userId, workflowId);
  if (!fs.existsSync(workflowDir)) {
    return false;
  }
  
  // Delete all files in the directory
  const files = fs.readdirSync(workflowDir);
  for (const file of files) {
    fs.unlinkSync(path.join(workflowDir, file));
  }
  
  // Remove the directory
  fs.rmdirSync(workflowDir);
  return true;
}

export function workflowExists(userId: string, workflowId: string): boolean {
  return fs.existsSync(getMetadataPath(userId, workflowId));
}

export function restoreVersion(userId: string, workflowId: string, targetVersion: number): object | null {
  const metadata = readWorkflowMetadata(userId, workflowId);
  if (!metadata) {
    return null;
  }
  
  const versionData = readVersion(userId, workflowId, targetVersion);
  if (!versionData) {
    return null;
  }
  
  // Save as a new version with the restored content
  const result = saveWorkflowWithVersion(
    userId,
    workflowId,
    metadata,
    versionData.nodes,
    versionData.edges,
    `Restored from v${targetVersion}`
  );
  
  return {
    id: metadata.id,
    name: metadata.name,
    description: metadata.description,
    userId: metadata.userId,
    createdAt: metadata.createdAt,
    updatedAt: result.metadata.updatedAt,
    currentVersion: result.metadata.currentVersion,
    nodes: versionData.nodes,
    edges: versionData.edges,
  };
}

// Legacy compatibility functions - for backward compatibility during migration
export function getAllWorkflowFiles(userId: string): string[] {
  // Return workflow directory names as "files"
  return getAllWorkflowDirs(userId);
}

export function getWorkflowPath(id: string, userId: string): string {
  // Return the metadata path for compatibility checks
  return getMetadataPath(userId, id);
}

export function writeWorkflow(id: string, userId: string, data: any): void {
  const now = new Date().toISOString();
  
  const metadata: WorkflowMetadata = {
    id: data.id || id,
    name: data.name,
    description: data.description || '',
    userId: data.userId || userId,
    createdAt: data.createdAt || now,
    updatedAt: now,
    currentVersion: data.currentVersion || 0,
  };
  
  saveWorkflowWithVersion(
    userId,
    id,
    metadata,
    data.nodes || [],
    data.edges || [],
    'Saved'
  );
}

export function deleteWorkflowFile(id: string, userId: string): boolean {
  return deleteWorkflowDir(userId, id);
}
