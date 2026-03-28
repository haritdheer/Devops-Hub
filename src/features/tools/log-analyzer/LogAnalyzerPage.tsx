import { useState, useMemo } from 'react';
import {
  ScrollText, AlertCircle, AlertTriangle, Info, Bug, Search, RotateCcw,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ToolShell } from '../../../components/common/ToolShell';
import { useToolPersistence } from '../../../hooks/useToolPersistence';
import { analyzeLogs } from '../../../lib/analyzers/logs';
import type { LogLevel, LogLine } from '../../../lib/analyzers/logs';

const SAMPLE_LOGS = `2024-01-15 10:23:01 INFO  Server started on port 3000
2024-01-15 10:23:02 INFO  Database connection established
2024-01-15 10:23:05 DEBUG Request received: GET /api/users
2024-01-15 10:23:05 INFO  Fetching users from database
2024-01-15 10:23:06 ERROR Failed to connect to cache: Connection refused at redis://localhost:6379
2024-01-15 10:23:06 WARN  Falling back to database query (cache miss)
2024-01-15 10:23:07 INFO  Returned 42 users
2024-01-15 10:23:10 DEBUG Request received: POST /api/orders
2024-01-15 10:23:10 ERROR Failed to connect to cache: Connection refused at redis://localhost:6379
2024-01-15 10:23:11 ERROR Database query timeout after 5000ms: SELECT * FROM orders WHERE user_id=123
2024-01-15 10:23:12 WARN  Retry attempt 1 of 3 for order processing
2024-01-15 10:23:13 ERROR Database query timeout after 5000ms: SELECT * FROM orders WHERE user_id=456
2024-01-15 10:23:14 WARN  High memory usage detected: 87% of 2GB
2024-01-15 10:23:15 ERROR Failed to connect to cache: Connection refused at redis://localhost:6379
2024-01-15 10:23:16 INFO  Health check passed
2024-01-15 10:23:20 DEBUG Request received: DELETE /api/sessions/789
2024-01-15 10:23:21 ERROR Unhandled exception in session cleanup: NullPointerException at SessionManager.java:142
2024-01-15 10:23:22 WARN  Session cleanup degraded - running in safe mode
2024-01-15 10:23:25 INFO  Scheduled job: db-cleanup started
2024-01-15 10:23:26 ERROR Database query timeout after 5000ms: DELETE FROM sessions WHERE expires_at < NOW()`;

const LEVEL_CONFIG: Record<LogLevel, {
  color: string;
  bg: string;
  border: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  dim: string;
  chipBg: string;
  chipBorder: string;
}> = {
  ERROR: {
    color: 'text-red-400',
    bg: 'bg-red-500/5',
    border: 'border-red-500/10',
    icon: AlertCircle,
    dim: 'text-red-500/40',
    chipBg: 'bg-red-500/10',
    chipBorder: 'border-red-500/20',
  },
  WARN: {
    color: 'text-yellow-400',
    bg: 'bg-yellow-500/5',
    border: 'border-yellow-500/10',
    icon: AlertTriangle,
    dim: 'text-yellow-500/40',
    chipBg: 'bg-yellow-500/10',
    chipBorder: 'border-yellow-500/20',
  },
  INFO: {
    color: 'text-blue-400',
    bg: 'bg-transparent',
    border: 'border-transparent',
    icon: Info,
    dim: 'text-blue-500/30',
    chipBg: 'bg-blue-500/10',
    chipBorder: 'border-blue-500/20',
  },
  DEBUG: {
    color: 'text-slate-400',
    bg: 'bg-transparent',
    border: 'border-transparent',
    icon: Bug,
    dim: 'text-slate-600',
    chipBg: 'bg-slate-500/10',
    chipBorder: 'border-slate-500/20',
  },
  TRACE: {
    color: 'text-slate-600',
    bg: 'bg-transparent',
    border: 'border-transparent',
    icon: Bug,
    dim: 'text-slate-700',
    chipBg: 'bg-slate-700/10',
    chipBorder: 'border-slate-700/20',
  },
  UNKNOWN: {
    color: 'text-slate-500',
    bg: 'bg-transparent',
    border: 'border-transparent',
    icon: Info,
    dim: 'text-slate-600',
    chipBg: 'bg-slate-600/10',
    chipBorder: 'border-slate-600/20',
  },
};

type Filter = LogLevel | 'ALL';

function LogRow({ line }: { line: LogLine }) {
  const cfg = LEVEL_CONFIG[line.level];
  const Icon = cfg.icon;
  return (
    <div className={clsx('flex items-start gap-3 px-4 py-1.5 border-b text-xs font-mono', cfg.bg, cfg.border)} style={{ borderBottomWidth: 1 }}>
      <span className="text-slate-700 w-8 flex-shrink-0 text-right select-none">{line.lineNumber}</span>
      <Icon size={11} className={clsx('flex-shrink-0 mt-0.5', cfg.color)} />
      {line.timestamp && (
        <span className="text-slate-600 flex-shrink-0">{line.timestamp}</span>
      )}
      <span className={clsx('flex-shrink-0 font-semibold w-14', cfg.color)}>{line.level}</span>
      <span className="text-slate-300 break-all">{line.message}</span>
    </div>
  );
}

export function LogAnalyzerPage() {
  const [input, setInput] = useToolPersistence('tool_log_analyzer', SAMPLE_LOGS);
  const [filter, setFilter] = useState<Filter>('ALL');
  const [search, setSearch] = useState('');

  const result = useMemo(() => analyzeLogs(input), [input]);

  const filtered = useMemo(() => {
    return result.lines.filter((l) => {
      if (filter !== 'ALL' && l.level !== filter) return false;
      if (search && !l.raw.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [result.lines, filter, search]);

  const FILTERS: { label: string; value: Filter }[] = [
    { label: `All (${result.total})`, value: 'ALL' },
    { label: `Error (${result.stats.ERROR})`, value: 'ERROR' },
    { label: `Warn (${result.stats.WARN})`, value: 'WARN' },
    { label: `Info (${result.stats.INFO})`, value: 'INFO' },
    { label: `Debug (${result.stats.DEBUG})`, value: 'DEBUG' },
  ];

  return (
    <ToolShell>
      {/* Stat chips */}
      <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
        {(['ERROR', 'WARN', 'INFO', 'DEBUG'] as const).map((lvl) => {
          const cfg = LEVEL_CONFIG[lvl];
          const Icon = cfg.icon;
          return (
            <div key={lvl} className={clsx('flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium', cfg.color, cfg.chipBg, cfg.chipBorder)}>
              <Icon size={12} />
              <span className="font-bold">{result.stats[lvl]}</span>
              <span className="opacity-70">{lvl}</span>
            </div>
          );
        })}
      </div>

      <div className="flex gap-4 flex-1 min-h-0">
        {/* Left: paste area */}
        <div className="flex flex-col glass-card overflow-hidden" style={{ width: '40%' }}>
          <div className="px-4 py-2 border-b border-slate-700/40 flex items-center justify-between flex-shrink-0">
            <div className="flex items-center gap-2">
              <ScrollText size={12} className="text-red-400" />
              <span className="text-xs font-medium text-slate-400">Paste Logs</span>
            </div>
            <div className="flex items-center gap-2">
              <button onClick={() => setInput(SAMPLE_LOGS)} className="text-xs text-slate-600 hover:text-slate-400 px-2 py-0.5 rounded bg-slate-800/60">Sample</button>
              <button onClick={() => setInput('')} className="text-xs text-slate-600 hover:text-slate-400"><RotateCcw size={11} /></button>
            </div>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full bg-transparent text-slate-400 font-mono text-xs p-3 resize-none focus:outline-none leading-relaxed"
            placeholder="Paste your application logs here..."
          />
        </div>

        {/* Right: analyzed output */}
        <div className="flex-1 flex flex-col gap-3 min-h-0">
          {/* Patterns */}
          {result.patterns.length > 0 && (
            <div className="glass-card overflow-hidden flex-shrink-0">
              <div className="px-4 py-2.5 border-b border-slate-700/40">
                <span className="text-xs font-semibold text-slate-300">Repeated Patterns</span>
              </div>
              <div className="divide-y divide-slate-700/30 max-h-40 overflow-auto">
                {result.patterns.map((p, i) => {
                  const cfg = LEVEL_CONFIG[p.level];
                  const Icon = cfg.icon;
                  return (
                    <div key={i} className="px-4 py-2 flex items-start gap-3">
                      <Icon size={11} className={clsx('flex-shrink-0 mt-0.5', cfg.color)} />
                      <p className="text-xs font-mono text-slate-400 flex-1 truncate">{p.pattern}</p>
                      <span className={clsx('flex-shrink-0 text-xs font-bold px-2 py-0.5 rounded-full', cfg.color, 'bg-slate-800')}>
                        ×{p.count}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Filter + search bar */}
          <div className="flex items-center gap-2 flex-shrink-0 flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={clsx(
                  'text-xs px-3 py-1.5 rounded-lg border transition-colors',
                  filter === f.value
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-300'
                )}
              >
                {f.label}
              </button>
            ))}
            <div className="flex items-center gap-2 ml-auto bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-1.5">
              <Search size={12} className="text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search logs..."
                className="bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none w-32"
              />
            </div>
          </div>

          {/* Log lines */}
          <div className="flex-1 glass-card overflow-hidden flex flex-col min-h-0">
            <div className="px-4 py-2 border-b border-slate-700/40 flex-shrink-0 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                {filtered.length} line{filtered.length !== 1 ? 's' : ''}
                {filter !== 'ALL' || search ? ` (filtered)` : ''}
              </span>
            </div>
            <div className="overflow-auto flex-1">
              {filtered.length === 0 ? (
                <div className="flex items-center justify-center h-full">
                  <p className="text-xs text-slate-600">No matching log lines</p>
                </div>
              ) : (
                filtered.map((line) => <LogRow key={line.lineNumber} line={line} />)
              )}
            </div>
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
