export interface EnvEntry {
  key: string;
  value: string;
}

export type DiffStatus = 'added' | 'removed' | 'changed' | 'unchanged';

export interface DiffEntry {
  key: string;
  leftValue?: string;
  rightValue?: string;
  status: DiffStatus;
}

export interface EnvDiffResult {
  entries: DiffEntry[];
  stats: {
    added: number;
    removed: number;
    changed: number;
    unchanged: number;
    total: number;
  };
}

function parseEnvFile(content: string): Map<string, string> {
  const map = new Map<string, string>();
  for (const line of content.split('\n')) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith('#')) continue;
    const eqIdx = trimmed.indexOf('=');
    if (eqIdx === -1) continue;
    const key = trimmed.slice(0, eqIdx).trim();
    const value = trimmed.slice(eqIdx + 1).trim().replace(/^["']|["']$/g, '');
    if (key) map.set(key, value);
  }
  return map;
}

export function diffEnvFiles(left: string, right: string): EnvDiffResult {
  const leftMap = parseEnvFile(left);
  const rightMap = parseEnvFile(right);
  const allKeys = new Set([...leftMap.keys(), ...rightMap.keys()]);
  const entries: DiffEntry[] = [];

  for (const key of [...allKeys].sort()) {
    const leftVal = leftMap.get(key);
    const rightVal = rightMap.get(key);
    let status: DiffStatus;
    if (leftVal === undefined) status = 'added';
    else if (rightVal === undefined) status = 'removed';
    else if (leftVal !== rightVal) status = 'changed';
    else status = 'unchanged';
    entries.push({ key, leftValue: leftVal, rightValue: rightVal, status });
  }

  const stats = {
    added: entries.filter((e) => e.status === 'added').length,
    removed: entries.filter((e) => e.status === 'removed').length,
    changed: entries.filter((e) => e.status === 'changed').length,
    unchanged: entries.filter((e) => e.status === 'unchanged').length,
    total: entries.length,
  };

  return { entries, stats };
}
