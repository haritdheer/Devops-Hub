import cronstrue from 'cronstrue';
import { CronExpressionParser } from 'cron-parser';

export type CronMode = 'unix' | 'quartz';

export interface CronParseResult {
  valid: boolean;
  expression?: string;
  description?: string;
  nextRuns?: string[];
  nextRunsApproximate?: boolean;
  error?: string;
  parts?: {
    second?: string;
    minute: string;
    hour: string;
    dayOfMonth: string;
    month: string;
    dayOfWeek: string;
    year?: string;
  };
  mode?: CronMode;
}

const QUARTZ_SPECIAL = /[LW#?]/;

// Sanitize a Quartz field to a Unix-compatible value for next-run approximation
function sanitizeFieldForUnix(field: string): string {
  if (field === '?' || field === 'L' || field === 'LW') return '*';
  if (/^\d+L$/.test(field)) return field.slice(0, -1);  // e.g. 5L → 5
  if (/^\d+W$/.test(field)) return field.slice(0, -1);  // e.g. 15W → 15
  if (field.includes('#')) return field.split('#')[0];   // e.g. 2#3 → 2
  return field;
}

export function parseCron(expression: string, mode: CronMode = 'unix'): CronParseResult {
  const trimmed = expression.trim();
  if (!trimmed) return { valid: false, error: 'Expression is empty' };

  const parts = trimmed.split(/\s+/);

  if (mode === 'unix' && parts.length !== 5) {
    return { valid: false, error: `Unix cron requires exactly 5 fields, got ${parts.length}` };
  }
  if (mode === 'quartz' && (parts.length < 6 || parts.length > 7)) {
    return { valid: false, error: `Quartz cron requires 6 or 7 fields, got ${parts.length}` };
  }

  try {
    const description = cronstrue.toString(trimmed, { throwExceptionOnParseError: true });

    if (mode === 'unix') {
      const interval = CronExpressionParser.parse(trimmed);
      const nextRuns: string[] = [];
      for (let i = 0; i < 8; i++) nextRuns.push(interval.next().toDate().toLocaleString());
      const [minute, hour, dayOfMonth, month, dayOfWeek] = parts;
      return { valid: true, expression: trimmed, description, nextRuns, parts: { minute, hour, dayOfMonth, month, dayOfWeek }, mode };
    }

    // Quartz mode
    const [second, minute, hour, dayOfMonth, month, dayOfWeek, year] = parts;
    const hasSpecial = QUARTZ_SPECIAL.test(trimmed);

    let nextRuns: string[] | undefined;
    let nextRunsApproximate = false;

    // Approximate next runs by mapping Quartz middle 5 fields to Unix format
    const unixExpr = [minute, hour, dayOfMonth, month, dayOfWeek]
      .map(sanitizeFieldForUnix)
      .join(' ');
    try {
      const interval = CronExpressionParser.parse(unixExpr);
      nextRuns = [];
      for (let i = 0; i < 8; i++) nextRuns.push(interval.next().toDate().toLocaleString());
      nextRunsApproximate = hasSpecial;
    } catch {
      // Complex expression — skip next runs
    }

    return {
      valid: true,
      expression: trimmed,
      description,
      nextRuns,
      nextRunsApproximate,
      parts: { second, minute, hour, dayOfMonth, month, dayOfWeek, ...(year ? { year } : {}) },
      mode,
    };
  } catch (e: unknown) {
    return { valid: false, error: (e as Error).message };
  }
}
