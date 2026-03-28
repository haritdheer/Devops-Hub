import cronstrue from 'cronstrue';
import { CronExpressionParser } from 'cron-parser';

export interface CronParseResult {
  valid: boolean;
  expression?: string;
  description?: string;
  nextRuns?: string[];
  error?: string;
  parts?: {
    minute: string;
    hour: string;
    dayOfMonth: string;
    month: string;
    dayOfWeek: string;
  };
}

export function parseCron(expression: string): CronParseResult {
  const trimmed = expression.trim();
  if (!trimmed) return { valid: false, error: 'Expression is empty' };

  try {
    const description = cronstrue.toString(trimmed, { throwExceptionOnParseError: true });
    const interval = CronExpressionParser.parse(trimmed);
    const nextRuns: string[] = [];
    for (let i = 0; i < 8; i++) {
      nextRuns.push(interval.next().toDate().toLocaleString());
    }

    const parts = trimmed.split(/\s+/);
    const [minute = '*', hour = '*', dayOfMonth = '*', month = '*', dayOfWeek = '*'] = parts;

    return {
      valid: true,
      expression: trimmed,
      description,
      nextRuns,
      parts: { minute, hour, dayOfMonth, month, dayOfWeek },
    };
  } catch (e: unknown) {
    return { valid: false, error: (e as Error).message };
  }
}
