/**
 * Sandbox Engine — Detective Script Runtime
 *
 * Executes "Detective Script" — JavaScript with Python-inspired
 * helper functions — in a safe Node.js vm context.
 *
 * The user writes code using these builtins:
 *   get_logs(), get_emails(), filter_time(), filter_keyword(),
 *   extract_ips(), extract_users(), find_failed(), find_success(), print()
 *
 * stdout is captured and returned as a string.
 */

import vm from 'vm';

export interface MissionData {
  logs?: string[];
  emails?: string[];
}

export interface SandboxResult {
  output: string;
  error: string | null;
  timed_out: boolean;
}

const TIMEOUT_MS = 5000;

// ── Helper implementations ─────────────────────────────────────────────────

function filterTime(data: string[], keyword: string): string[] {
  return data.filter(line => line.includes(keyword));
}

function filterKeyword(data: string[], keyword: string): string[] {
  return data.filter(line => line.toLowerCase().includes(keyword.toLowerCase()));
}

function extractIps(data: string[]): string[] {
  const ipRegex = /\b(\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3})\b/g;
  const ips = new Set<string>();
  for (const line of data) {
    const matches = line.match(ipRegex);
    if (matches) matches.forEach(ip => ips.add(ip));
  }
  return Array.from(ips);
}

function extractUsers(data: string[]): string[] {
  const userRegex = /(?:user:|from:|@)([a-zA-Z0-9._@-]+)/gi;
  const users = new Set<string>();
  for (const line of data) {
    let match: RegExpExecArray | null;
    const re = /(?:user:|from:)\s*([a-zA-Z0-9._@-]+)/gi;
    while ((match = re.exec(line)) !== null) {
      users.add(match[1].trim());
    }
  }
  return Array.from(users);
}

function findFailed(data: string[]): string[] {
  return data.filter(line =>
    line.toUpperCase().includes('FAILED') ||
    line.toUpperCase().includes('FAIL') ||
    line.toUpperCase().includes('DENIED')
  );
}

function findSuccess(data: string[]): string[] {
  return data.filter(line =>
    line.toUpperCase().includes('SUCCESS') ||
    line.toUpperCase().includes('GRANTED') ||
    line.toUpperCase().includes('OK')
  );
}

// ── Main Executor ──────────────────────────────────────────────────────────

export function runCode(code: string, missionData: MissionData): SandboxResult {
  const outputLines: string[] = [];

  // The sandbox context — all global helpers live here
  const sandbox: Record<string, unknown> = {
    // Data sources
    get_logs:  () => [...(missionData.logs  || [])],
    get_emails: () => [...(missionData.emails || [])],

    // Filters
    filter_time:    (data: string[], kw: string) => filterTime(data, kw),
    filter_keyword: (data: string[], kw: string) => filterKeyword(data, kw),

    // Extractors
    extract_ips:   (data: string[]) => extractIps(data),
    extract_users: (data: string[]) => extractUsers(data),

    // Classifiers
    find_failed:  (data: string[]) => findFailed(data),
    find_success: (data: string[]) => findSuccess(data),

    // Output — maps to Python's print()
    print: (...args: unknown[]) => {
      const line = args.map(a => {
        if (Array.isArray(a)) return JSON.stringify(a).replace(/"/g, '').slice(1, -1);
        return String(a);
      }).join(' ');
      outputLines.push(line);
    },

    // Safety: block dangerous globals
    process: undefined,
    require: undefined,
    __dirname: undefined,
    __filename: undefined,
    module: undefined,
    exports: undefined,
    fetch: undefined,
    setTimeout: undefined,
    setInterval: undefined,
    clearTimeout: undefined,
    clearInterval: undefined,
    eval: undefined,
    Function: undefined,
  };

  vm.createContext(sandbox);

  try {
    vm.runInContext(code, sandbox, {
      timeout: TIMEOUT_MS,
      breakOnSigint: true,
    });

    return {
      output: outputLines.join('\n').trim(),
      error: null,
      timed_out: false,
    };
  } catch (err: any) {
    if (err.code === 'ERR_SCRIPT_EXECUTION_TIMEOUT') {
      return { output: '', error: 'TIMEOUT: Script exceeded 5 second limit.', timed_out: true };
    }
    // Strip internal stack noise, only show the relevant line
    const clean = err.message?.replace(/\bat evalmachine.*/, '').trim() || 'Unknown error';
    return { output: outputLines.join('\n').trim(), error: clean, timed_out: false };
  }
}

// ── Output Validator ───────────────────────────────────────────────────────

/**
 * Compares the user's stdout to the expected output.
 * Trims whitespace and is case-insensitive.
 */
export function validateOutput(actual: string, expected: string): boolean {
  const normalize = (s: string) => s.trim().toLowerCase().replace(/\s+/g, ' ');
  return normalize(actual) === normalize(expected);
}
