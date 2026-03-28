import * as yaml from 'js-yaml';

export interface YamlParseResult {
  valid: boolean;
  parsed?: unknown;
  formatted?: string;
  error?: {
    message: string;
    line?: number;
    column?: number;
  };
  stats?: {
    keys: number;
    depth: number;
    lines: number;
  };
}

function countKeys(obj: unknown, depth = 0): { keys: number; depth: number } {
  if (typeof obj !== 'object' || obj === null) return { keys: 0, depth };
  let keys = 0;
  let maxDepth = depth;
  for (const val of Object.values(obj as Record<string, unknown>)) {
    keys++;
    const child = countKeys(val, depth + 1);
    keys += child.keys;
    if (child.depth > maxDepth) maxDepth = child.depth;
  }
  return { keys, depth: maxDepth };
}

export function parseYaml(input: string): YamlParseResult {
  if (!input.trim()) {
    return { valid: false, error: { message: 'Input is empty' } };
  }
  try {
    const parsed = yaml.load(input);
    const formatted = yaml.dump(parsed, { indent: 2, lineWidth: -1 });
    const { keys, depth } = countKeys(parsed);
    return {
      valid: true,
      parsed,
      formatted,
      stats: { keys, depth, lines: formatted.split('\n').length },
    };
  } catch (e: unknown) {
    const err = e as { message: string; mark?: { line: number; column: number } };
    return {
      valid: false,
      error: {
        message: err.message?.replace(/\n[\s\S]*/g, '').trim(),
        line: err.mark?.line !== undefined ? err.mark.line + 1 : undefined,
        column: err.mark?.column,
      },
    };
  }
}
