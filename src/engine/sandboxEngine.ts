/**
 * Sandbox Engine — Network Simulator Runtime
 *
 * Executes "Detective Script" (JS) in a safe Node.js vm context.
 * Replaces static text parsing with a stateful spatial traversal engine.
 * The player controls a "Recon Drone" on a simulated network.
 */

import vm from 'vm';

export interface NodeData {
  id: string; // usually an IP
  type: string;
  ports: number[];
  files: Record<string, string>;
  connections: string[];
}

export interface MissionData {
  network: NodeData[];
  start_node: string;
  expected_output?: string;
}

export interface ActionTrace {
  type: 'start' | 'scan' | 'move' | 'download' | 'print' | 'error';
  target?: string;
  data?: any;
  message?: string;
}

export interface SandboxResult {
  output: string;
  trace: ActionTrace[];
  error: string | null;
  timed_out: boolean;
}

const TIMEOUT_MS = 5000;

export function runCode(code: string, missionData: MissionData): SandboxResult {
  const trace: ActionTrace[] = [];
  const outputLines: string[] = [];

  // Robust initialization
  const networkNodes = missionData.network || [];
  const nodeMap = new Map<string, NodeData>(networkNodes.map(n => [n.id, n]));
  
  let currentNodeId = missionData.start_node || (networkNodes.length > 0 ? networkNodes[0].id : '');
  
  // Ensure the current node exists in the map
  if (currentNodeId && !nodeMap.has(currentNodeId) && networkNodes.length > 0) {
    currentNodeId = networkNodes[0].id;
  }

  // Pre-flight check
  if (nodeMap.size === 0) {
    return {
      output: "",
      trace: [],
      error: "ENGINE ERROR: No network infrastructure detected in mission data.",
      timed_out: false
    };
  }

  trace.push({ type: 'start', target: currentNodeId });

  const sandbox: Record<string, unknown> = {
    // Spatial API
    get_current_node: () => currentNodeId,
    
    get_connected_nodes: () => {
      const node = nodeMap.get(currentNodeId);
      return [...(node?.connections || [])];
    },
    
    connect_to: (ip: string) => {
      const node = nodeMap.get(currentNodeId);
      if (!node?.connections.includes(ip)) {
        throw new Error(`CONNECTION REFUSED: Target ${ip} is not reachable from ${currentNodeId}.`);
      }
      currentNodeId = ip;
      trace.push({ type: 'move', target: ip });
      return true;
    },
    
    scan_target: () => {
      const node = nodeMap.get(currentNodeId);
      if (!node) throw new Error(`PROTOCOL ERROR: Drone has lost sync with the network grid at node [${currentNodeId}].`);
      const data = { type: node.type, ports: [...node.ports], files: Object.keys(node.files || {}) };
      trace.push({ type: 'scan', target: currentNodeId, data });
      return data;
    },
    
    download_file: (filename: string) => {
      const node = nodeMap.get(currentNodeId);
      if (!node || !node.files || typeof node.files[filename] === 'undefined') {
        throw new Error(`FILE NOT FOUND: '${filename}' does not exist on ${currentNodeId}.`);
      }
      const content = node.files[filename];
      trace.push({ type: 'download', target: currentNodeId, message: filename });
      return content;
    },
    
    print: (...args: unknown[]) => {
      const line = args.map(a => {
        if (Array.isArray(a)) return JSON.stringify(a).replace(/"/g, '').slice(1, -1);
        if (typeof a === 'object') return JSON.stringify(a);
        return String(a);
      }).join(' ');
      outputLines.push(line);
      trace.push({ type: 'print', message: line });
    },

    // Safety rules
    process: undefined, require: undefined, __dirname: undefined, __filename: undefined,
    module: undefined, exports: undefined, fetch: undefined,
    setTimeout: undefined, setInterval: undefined, clearTimeout: undefined, clearInterval: undefined,
    eval: undefined, Function: undefined,
  };

  vm.createContext(sandbox);

  try {
    vm.runInContext(code, sandbox, {
      timeout: TIMEOUT_MS,
      breakOnSigint: true,
    });

    return {
      output: outputLines.join('\n').trim(),
      trace,
      error: null,
      timed_out: false,
    };
  } catch (err: any) {
    if (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
      trace.push({ type: 'error', message: 'TIMEOUT: Script exceeded 5 second limit.' });
      return { output: outputLines.join('\n').trim(), trace, error: 'TIMEOUT: Script exceeded 5 second limit.', timed_out: true };
    }
    const clean = err.message?.replace(/\bat evalmachine.*/, '').trim() || 'Unknown error';
    trace.push({ type: 'error', message: clean });
    return { output: outputLines.join('\n').trim(), trace, error: clean, timed_out: false };
  }
}

export function validateOutput(actual: string, expected: string): boolean {
  if (!expected) return false;
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  return normalize(actual) === normalize(expected);
}
