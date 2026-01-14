interface WorkflowNode {
  id: string;
  type: string;
  position: { x: number; y: number };
  data: { label: string; [key: string]: unknown };
}

interface WorkflowEdge {
  id: string;
  source: string;
  target: string;
  label?: string;
}

interface Workflow {
  id: string;
  name: string;
  description: string;
  nodes: WorkflowNode[];
  edges: WorkflowEdge[];
}

interface ValidationResult {
  valid: boolean;
  errors: string[];
  warnings: string[];
}

export function validateWorkflow(workflow: Workflow): ValidationResult {
  const errors: string[] = [];
  const warnings: string[] = [];

  // Check for Start nodes
  const startNodes = workflow.nodes.filter(n => n.type === 'start');
  if (startNodes.length === 0) {
    errors.push('Workflow must have at least one Start node');
  } else if (startNodes.length > 1) {
    warnings.push('Workflow has multiple Start nodes. Consider using only one entry point.');
  }

  // Check for End nodes
  const endNodes = workflow.nodes.filter(n => n.type === 'end');
  if (endNodes.length === 0) {
    warnings.push('Workflow has no End node. Consider adding at least one terminal point.');
  }

  // Build adjacency map
  const outgoingEdges = new Map<string, string[]>();
  const incomingEdges = new Map<string, string[]>();

  workflow.nodes.forEach(node => {
    outgoingEdges.set(node.id, []);
    incomingEdges.set(node.id, []);
  });

  workflow.edges.forEach(edge => {
    const sourceEdges = outgoingEdges.get(edge.source);
    const targetEdges = incomingEdges.get(edge.target);
    
    if (sourceEdges) {
      sourceEdges.push(edge.target);
    } else {
      errors.push(`Edge ${edge.id} references non-existent source node: ${edge.source}`);
    }
    
    if (targetEdges) {
      targetEdges.push(edge.source);
    } else {
      errors.push(`Edge ${edge.id} references non-existent target node: ${edge.target}`);
    }
  });

  // Check Start nodes don't have incoming edges
  startNodes.forEach(node => {
    const incoming = incomingEdges.get(node.id) || [];
    if (incoming.length > 0) {
      errors.push(`Start node "${node.data.label}" should not have incoming connections`);
    }
  });

  // Check End nodes don't have outgoing edges
  endNodes.forEach(node => {
    const outgoing = outgoingEdges.get(node.id) || [];
    if (outgoing.length > 0) {
      errors.push(`End node "${node.data.label}" should not have outgoing connections`);
    }
  });

  // Check for disconnected nodes (excluding Start and End)
  workflow.nodes.forEach(node => {
    if (node.type === 'start') return;
    
    const incoming = incomingEdges.get(node.id) || [];
    if (incoming.length === 0) {
      warnings.push(`Node "${node.data.label}" has no incoming connections and may be unreachable`);
    }
  });

  workflow.nodes.forEach(node => {
    if (node.type === 'end') return;
    
    const outgoing = outgoingEdges.get(node.id) || [];
    if (outgoing.length === 0) {
      warnings.push(`Node "${node.data.label}" has no outgoing connections`);
    }
  });

  // Check Decision nodes have at least 2 outgoing edges
  const decisionNodes = workflow.nodes.filter(n => n.type === 'decision');
  decisionNodes.forEach(node => {
    const outgoing = outgoingEdges.get(node.id) || [];
    if (outgoing.length < 2) {
      warnings.push(`Decision node "${node.data.label}" should have at least 2 outgoing connections for branching`);
    }
  });

  // Check Parallel nodes
  const parallelNodes = workflow.nodes.filter(n => n.type === 'parallel');
  parallelNodes.forEach(node => {
    const outgoing = outgoingEdges.get(node.id) || [];
    if (outgoing.length < 2) {
      warnings.push(`Parallel node "${node.data.label}" should have at least 2 outgoing connections for parallel execution`);
    }
  });

  // Check for cycles that don't involve Loop nodes
  const visited = new Set<string>();
  const recursionStack = new Set<string>();

  function detectCycle(nodeId: string, path: string[]): boolean {
    if (recursionStack.has(nodeId)) {
      const node = workflow.nodes.find(n => n.id === nodeId);
      if (node?.type !== 'loop') {
        // Check if cycle contains a loop node
        const cycleStart = path.indexOf(nodeId);
        const cyclePath = path.slice(cycleStart);
        const hasLoopInCycle = cyclePath.some(id => 
          workflow.nodes.find(n => n.id === id)?.type === 'loop'
        );
        if (!hasLoopInCycle) {
          warnings.push(`Potential infinite loop detected not controlled by a Loop node`);
        }
      }
      return true;
    }
    
    if (visited.has(nodeId)) return false;
    
    visited.add(nodeId);
    recursionStack.add(nodeId);
    
    const neighbors = outgoingEdges.get(nodeId) || [];
    for (const neighbor of neighbors) {
      detectCycle(neighbor, [...path, nodeId]);
    }
    
    recursionStack.delete(nodeId);
    return false;
  }

  startNodes.forEach(node => {
    visited.clear();
    recursionStack.clear();
    detectCycle(node.id, []);
  });

  return {
    valid: errors.length === 0,
    errors,
    warnings,
  };
}
