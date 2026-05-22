import { useState, useMemo, useDeferredValue, useEffect, useRef, useCallback } from 'react';
import {
  ScrollText, AlertCircle, AlertTriangle, Info, Bug, Search, RotateCcw, Upload, Loader2,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ToolShell } from '../../../components/common/ToolShell';
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

// Only persist logs smaller than 150 KB to avoid blocking localStorage
const MAX_PERSIST_BYTES = 150_000;
const STORAGE_KEY = 'tool_log_analyzer';

// Fixed row height enables O(1) virtual scroll math — must match the CSS below
const ROW_HEIGHT = 28;
const SCROLL_BUFFER = 10;

const LEVEL_CONFIG: Record<LogLevel, {
  color: string; bg: string; border: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  dim: string; chipBg: string; chipBorder: string;
}> = {
  ERROR: { color: 'text-red-400',    bg: 'bg-red-500/5',     border: 'border-red-500/10',    icon: AlertCircle,   dim: 'text-red-500/40',   chipBg: 'bg-red-500/10',    chipBorder: 'border-red-500/20' },
  WARN:  { color: 'text-yellow-400', bg: 'bg-yellow-500/5',  border: 'border-yellow-500/10', icon: AlertTriangle, dim: 'text-yellow-500/40', chipBg: 'bg-yellow-500/10', chipBorder: 'border-yellow-500/20' },
  INFO:  { color: 'text-blue-400',   bg: 'bg-transparent',   border: 'border-transparent',   icon: Info,          dim: 'text-blue-500/30',  chipBg: 'bg-blue-500/10',   chipBorder: 'border-blue-500/20' },
  DEBUG: { color: 'text-slate-400',  bg: 'bg-transparent',   border: 'border-transparent',   icon: Bug,           dim: 'text-slate-600',    chipBg: 'bg-slate-500/10',  chipBorder: 'border-slate-500/20' },
  TRACE: { color: 'text-slate-600',  bg: 'bg-transparent',   border: 'border-transparent',   icon: Bug,           dim: 'text-slate-700',    chipBg: 'bg-slate-700/10',  chipBorder: 'border-slate-700/20' },
  UNKNOWN:{ color: 'text-slate-500', bg: 'bg-transparent',   border: 'border-transparent',   icon: Info,          dim: 'text-slate-600',    chipBg: 'bg-slate-600/10',  chipBorder: 'border-slate-600/20' },
};

type Filter = LogLevel | 'ALL';

// Truncate message so every row is exactly ROW_HEIGHT tall (enables virtual scroll)
function LogRow({ line }: { line: LogLine }) {
  const cfg = LEVEL_CONFIG[line.level];
  const Icon = cfg.icon;
  return (
    <div
      className={clsx('flex items-center gap-3 px-4 border-b text-xs font-mono overflow-hidden', cfg.bg, cfg.border)}
      style={{ height: ROW_HEIGHT, borderBottomWidth: 1 }}
      title={line.raw}
    >
      <span className="text-slate-700 w-8 flex-shrink-0 text-right select-none">{line.lineNumber}</span>
      <Icon size={11} className={clsx('flex-shrink-0', cfg.color)} />
      {line.timestamp && <span className="text-slate-600 flex-shrink-0 hidden sm:inline">{line.timestamp}</span>}
      <span className={clsx('flex-shrink-0 font-semibold w-14', cfg.color)}>{line.level}</span>
      <span className="text-slate-300 truncate">{line.message}</span>
    </div>
  );
}

// Renders only the rows visible in the viewport — the core perf fix for large logs
function VirtualLogList({ lines }: { lines: LogLine[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [scrollTop, setScrollTop] = useState(0);
  const [viewportH, setViewportH] = useState(400);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    setViewportH(el.clientHeight);
    const ro = new ResizeObserver(() => setViewportH(el.clientHeight));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  // Scroll to top when the list content changes (filter / search)
  useEffect(() => {
    containerRef.current?.scrollTo({ top: 0 });
    setScrollTop(0);
  }, [lines]);

  if (lines.length === 0) {
    return (
      <div ref={containerRef} className="overflow-auto flex-1 flex items-center justify-center">
        <p className="text-xs text-slate-600">No matching log lines</p>
      </div>
    );
  }

  const totalH   = lines.length * ROW_HEIGHT;
  const startIdx = Math.max(0, Math.floor(scrollTop / ROW_HEIGHT) - SCROLL_BUFFER);
  const endIdx   = Math.min(lines.length - 1, Math.ceil((scrollTop + viewportH) / ROW_HEIGHT) + SCROLL_BUFFER);

  return (
    <div
      ref={containerRef}
      className="overflow-auto flex-1"
      onScroll={e => setScrollTop(e.currentTarget.scrollTop)}
    >
      {/* Total height spacer keeps the scrollbar proportional */}
      <div style={{ height: totalH, position: 'relative' }}>
        <div style={{ position: 'absolute', top: startIdx * ROW_HEIGHT, width: '100%' }}>
          {lines.slice(startIdx, endIdx + 1).map(line => (
            <LogRow key={line.lineNumber} line={line} />
          ))}
        </div>
      </div>
    </div>
  );
}

export function LogAnalyzerPage() {
  const [rawInput, setRawInput] = useState<string>(() => {
    try { return localStorage.getItem(STORAGE_KEY) || SAMPLE_LOGS; } catch { return SAMPLE_LOGS; }
  });
  const [fileName, setFileName] = useState<string | null>(null);
  const [filter, setFilter]     = useState<Filter>('ALL');
  const [search, setSearch]     = useState('');
  const fileRef = useRef<HTMLInputElement>(null);

  // Persist to localStorage only for small-enough inputs; large logs would block the main thread
  useEffect(() => {
    if (rawInput.length <= MAX_PERSIST_BYTES) {
      try { localStorage.setItem(STORAGE_KEY, rawInput); } catch {}
    }
  }, [rawInput]);

  // useDeferredValue lets React update the textarea immediately and defer the
  // expensive analysis pass — the page stays responsive while the user types/pastes
  const deferredInput = useDeferredValue(rawInput);
  const isAnalyzing   = deferredInput !== rawInput;

  const result   = useMemo(() => analyzeLogs(deferredInput), [deferredInput]);
  const filtered = useMemo(() => result.lines.filter(l => {
    if (filter !== 'ALL' && l.level !== filter) return false;
    if (search && !l.raw.toLowerCase().includes(search.toLowerCase())) return false;
    return true;
  }), [result.lines, filter, search]);

  const handleFile = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setFileName(file.name);
    const reader = new FileReader();
    reader.onload = ev => setRawInput((ev.target?.result as string) ?? '');
    reader.readAsText(file);
    e.target.value = '';
  }, []);

  const handleReset = useCallback(() => {
    setRawInput('');
    setFileName(null);
  }, []);

  const FILTERS: { label: string; value: Filter }[] = [
    { label: `All (${result.total})`,          value: 'ALL' },
    { label: `Error (${result.stats.ERROR})`,  value: 'ERROR' },
    { label: `Warn (${result.stats.WARN})`,    value: 'WARN' },
    { label: `Info (${result.stats.INFO})`,    value: 'INFO' },
    { label: `Debug (${result.stats.DEBUG})`,  value: 'DEBUG' },
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
        {isAnalyzing && (
          <div className="flex items-center gap-1.5 text-xs text-slate-500 ml-auto">
            <Loader2 size={11} className="animate-spin" />
            Analyzing…
          </div>
        )}
      </div>

      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        {/* Left: paste / upload area */}
        <div className="flex flex-col glass-card overflow-hidden md:w-2/5 h-48 md:h-auto">
          <div className="px-4 py-2 border-b border-slate-700/40 flex items-center justify-between flex-shrink-0 gap-2">
            <div className="flex items-center gap-2 min-w-0">
              <ScrollText size={12} className="text-red-400 flex-shrink-0" />
              {fileName ? (
                <span className="text-xs text-slate-300 font-medium truncate" title={fileName}>{fileName}</span>
              ) : (
                <span className="text-xs font-medium text-slate-400">Paste Logs</span>
              )}
            </div>
            <div className="flex items-center gap-1 flex-shrink-0">
              {/* Hidden file input */}
              <input
                ref={fileRef}
                type="file"
                accept=".log,.txt,.out,.json,.xml,.csv"
                className="hidden"
                onChange={handleFile}
              />
              <button
                onClick={() => fileRef.current?.click()}
                className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 px-2 py-0.5 rounded bg-slate-800/60 transition-colors"
              >
                <Upload size={10} /> Upload
              </button>
              <button
                onClick={() => { setRawInput(SAMPLE_LOGS); setFileName(null); }}
                className="text-xs text-slate-600 hover:text-slate-400 px-2 py-0.5 rounded bg-slate-800/60"
              >
                Sample
              </button>
              <button onClick={handleReset} className="text-xs text-slate-600 hover:text-slate-400 p-0.5">
                <RotateCcw size={11} />
              </button>
            </div>
          </div>
          <textarea
            value={rawInput}
            onChange={e => setRawInput(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full bg-transparent text-slate-400 font-mono text-xs p-3 resize-none focus:outline-none leading-relaxed"
            placeholder="Paste your application logs here, or upload a file…"
          />
        </div>

        {/* Right: analysis output */}
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
            {FILTERS.map(f => (
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
                onChange={e => setSearch(e.target.value)}
                placeholder="Search logs..."
                className="bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none w-32"
              />
            </div>
          </div>

          {/* Log lines — virtualised */}
          <div className="flex-1 glass-card overflow-hidden flex flex-col min-h-0">
            <div className="px-4 py-2 border-b border-slate-700/40 flex-shrink-0 flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">
                {filtered.length.toLocaleString()} line{filtered.length !== 1 ? 's' : ''}
                {filter !== 'ALL' || search ? ' (filtered)' : ''}
              </span>
              {rawInput.length > MAX_PERSIST_BYTES && (
                <span className="text-xs text-amber-500/70">Large file — not saved to storage</span>
              )}
            </div>
            {/* key resets scroll position when filter/search changes */}
            <VirtualLogList key={`${filter}|${search}`} lines={filtered} />
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
