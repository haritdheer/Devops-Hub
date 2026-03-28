export type LogLevel = 'ERROR' | 'WARN' | 'INFO' | 'DEBUG' | 'TRACE' | 'UNKNOWN';

export interface LogLine {
  raw: string;
  level: LogLevel;
  timestamp?: string;
  message: string;
  lineNumber: number;
}

export interface LogPattern {
  pattern: string;
  count: number;
  level: LogLevel;
  lines: number[];
}

export interface LogAnalysisResult {
  lines: LogLine[];
  stats: Record<LogLevel, number>;
  patterns: LogPattern[];
  total: number;
}

const LEVEL_PATTERNS: [LogLevel, RegExp][] = [
  ['ERROR', /\b(ERROR|FATAL|CRIT|CRITICAL|ERR)\b/i],
  ['WARN', /\b(WARN|WARNING)\b/i],
  ['INFO', /\b(INFO|NOTICE)\b/i],
  ['DEBUG', /\b(DEBUG)\b/i],
  ['TRACE', /\b(TRACE|VERBOSE)\b/i],
];

const TIMESTAMP_RE = /\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}/;

function detectLevel(line: string): LogLevel {
  for (const [level, re] of LEVEL_PATTERNS) {
    if (re.test(line)) return level;
  }
  return 'UNKNOWN';
}

function extractMessage(line: string): string {
  return line.replace(TIMESTAMP_RE, '').replace(/^\s*\[?\w+\]?\s*/g, '').trim() || line;
}

function normalizePattern(msg: string): string {
  return msg
    .replace(/\b\d{4}-\d{2}-\d{2}[T ]\d{2}:\d{2}:\d{2}(\.\d+)?Z?\b/g, '<timestamp>')
    .replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, '<uuid>')
    .replace(/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/g, '<ip>')
    .replace(/\b\d+\b/g, '<n>')
    .trim();
}

export function analyzeLogs(input: string): LogAnalysisResult {
  const rawLines = input.split('\n');
  const lines: LogLine[] = [];
  const stats: Record<LogLevel, number> = { ERROR: 0, WARN: 0, INFO: 0, DEBUG: 0, TRACE: 0, UNKNOWN: 0 };
  const patternMap = new Map<string, LogPattern>();

  for (let i = 0; i < rawLines.length; i++) {
    const raw = rawLines[i];
    if (!raw.trim()) continue;
    const level = detectLevel(raw);
    const tsMatch = raw.match(TIMESTAMP_RE);
    const message = extractMessage(raw);
    lines.push({ raw, level, timestamp: tsMatch?.[0], message, lineNumber: i + 1 });
    stats[level]++;

    if (level === 'ERROR' || level === 'WARN') {
      const pat = normalizePattern(message);
      if (patternMap.has(pat)) {
        const existing = patternMap.get(pat)!;
        existing.count++;
        existing.lines.push(i + 1);
      } else {
        patternMap.set(pat, { pattern: pat.slice(0, 120), count: 1, level, lines: [i + 1] });
      }
    }
  }

  const patterns = [...patternMap.values()]
    .filter((p) => p.count > 0)
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  return { lines, stats, patterns, total: lines.length };
}
