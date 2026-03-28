export interface JsonParseResult {
  valid: boolean;
  parsed?: unknown;
  prettified?: string;
  minified?: string;
  error?: {
    message: string;
    position?: number;
  };
  stats?: {
    keys: number;
    depth: number;
    size: string;
    type: string;
  };
}

function countJsonKeys(obj: unknown, depth = 0): { keys: number; depth: number } {
  if (Array.isArray(obj)) {
    let keys = 0;
    let maxDepth = depth;
    for (const item of obj) {
      const child = countJsonKeys(item, depth + 1);
      keys += child.keys;
      if (child.depth > maxDepth) maxDepth = child.depth;
    }
    return { keys, depth: maxDepth };
  }
  if (typeof obj === 'object' && obj !== null) {
    let keys = Object.keys(obj).length;
    let maxDepth = depth;
    for (const val of Object.values(obj as Record<string, unknown>)) {
      const child = countJsonKeys(val, depth + 1);
      keys += child.keys;
      if (child.depth > maxDepth) maxDepth = child.depth;
    }
    return { keys, depth: maxDepth };
  }
  return { keys: 0, depth };
}

function formatSize(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`;
  return `${(bytes / 1024).toFixed(1)} KB`;
}

export function parseJson(input: string): JsonParseResult {
  if (!input.trim()) return { valid: false, error: { message: 'Input is empty' } };
  try {
    const parsed = JSON.parse(input);
    const prettified = JSON.stringify(parsed, null, 2);
    const minified = JSON.stringify(parsed);
    const { keys, depth } = countJsonKeys(parsed);
    const type = Array.isArray(parsed) ? 'Array' : typeof parsed === 'object' ? 'Object' : typeof parsed;
    return {
      valid: true,
      parsed,
      prettified,
      minified,
      stats: {
        keys,
        depth,
        size: formatSize(new Blob([input]).size),
        type,
      },
    };
  } catch (e: unknown) {
    const err = e as Error;
    const match = err.message.match(/position (\d+)/);
    return {
      valid: false,
      error: {
        message: err.message,
        position: match ? parseInt(match[1]) : undefined,
      },
    };
  }
}
