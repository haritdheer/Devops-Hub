import { useState, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Calendar, RotateCcw, Info } from 'lucide-react';
import { clsx } from 'clsx';
import { parseCron, type CronParseResult, type CronMode } from '../../../lib/parsers/cron';

const STORAGE_KEY = 'tool_cron_tester';
const MODE_KEY = 'tool_cron_tester_mode';

const UNIX_PRESETS = [
  { label: 'Every minute',   value: '* * * * *' },
  { label: 'Every 5 min',    value: '*/5 * * * *' },
  { label: 'Every 15 min',   value: '*/15 * * * *' },
  { label: 'Every 30 min',   value: '*/30 * * * *' },
  { label: 'Every hour',     value: '0 * * * *' },
  { label: 'Daily midnight', value: '0 0 * * *' },
  { label: 'Daily 9am',      value: '0 9 * * *' },
  { label: 'Every weekday',  value: '0 9 * * 1-5' },
  { label: 'Weekly Monday',  value: '0 0 * * 1' },
  { label: 'Monthly 1st',    value: '0 0 1 * *' },
  { label: 'Yearly Jan 1',   value: '0 0 1 1 *' },
  { label: 'Twice daily',    value: '0 6,18 * * *' },
];

const QUARTZ_PRESETS = [
  { label: 'Every minute',      value: '0 * * ? * *' },
  { label: 'Every 5 min',       value: '0 0/5 * ? * *' },
  { label: 'Every 15 min',      value: '0 0/15 * ? * *' },
  { label: 'Every 30 min',      value: '0 0/30 * ? * *' },
  { label: 'Every hour',        value: '0 0 * ? * *' },
  { label: 'Daily midnight',    value: '0 0 0 * * ?' },
  { label: 'Daily 9am',         value: '0 0 9 * * ?' },
  { label: 'Every weekday',     value: '0 0 9 ? * MON-FRI' },
  { label: 'Weekly Monday',     value: '0 0 0 ? * MON' },
  { label: 'Monthly 1st',       value: '0 0 0 1 * ?' },
  { label: 'Last day of month', value: '0 0 0 L * ?' },
  { label: 'Last Friday',       value: '0 0 0 ? * 6L' },
];

const UNIX_PARTS = [
  { key: 'minute'     as const, label: 'Minute',  range: '0–59' },
  { key: 'hour'       as const, label: 'Hour',    range: '0–23' },
  { key: 'dayOfMonth' as const, label: 'Day',     range: '1–31' },
  { key: 'month'      as const, label: 'Month',   range: '1–12' },
  { key: 'dayOfWeek'  as const, label: 'Weekday', range: '0–6' },
];

const QUARTZ_PARTS = [
  { key: 'second'     as const, label: 'Second',  range: '0–59' },
  { key: 'minute'     as const, label: 'Minute',  range: '0–59' },
  { key: 'hour'       as const, label: 'Hour',    range: '0–23' },
  { key: 'dayOfMonth' as const, label: 'Day',     range: '1–31, L, W' },
  { key: 'month'      as const, label: 'Month',   range: '1–12' },
  { key: 'dayOfWeek'  as const, label: 'Weekday', range: '1–7, L, #' },
  { key: 'year'       as const, label: 'Year',    range: '1970–2099' },
];

const DEFAULT: Record<CronMode, string> = {
  unix:   '*/5 * * * *',
  quartz: '0 0/5 * ? * *',
};

function getStored(mode: CronMode): string {
  return localStorage.getItem(`${STORAGE_KEY}_${mode}`) || DEFAULT[mode];
}

export function CronTesterPage() {
  const [mode, setMode] = useState<CronMode>(
    () => (localStorage.getItem(MODE_KEY) as CronMode) || 'unix'
  );
  const [input, setInput] = useState(() => getStored(
    (localStorage.getItem(MODE_KEY) as CronMode) || 'unix'
  ));
  const [result, setResult] = useState<CronParseResult>(() =>
    parseCron(getStored((localStorage.getItem(MODE_KEY) as CronMode) || 'unix'),
              (localStorage.getItem(MODE_KEY) as CronMode) || 'unix')
  );

  const handleInput = useCallback((val: string, currentMode: CronMode) => {
    setInput(val);
    setResult(parseCron(val, currentMode));
    localStorage.setItem(`${STORAGE_KEY}_${currentMode}`, val);
  }, []);

  const handleModeChange = (newMode: CronMode) => {
    if (newMode === mode) return;
    setMode(newMode);
    localStorage.setItem(MODE_KEY, newMode);
    const saved = getStored(newMode);
    setInput(saved);
    setResult(parseCron(saved, newMode));
  };

  const presets      = mode === 'unix' ? UNIX_PRESETS : QUARTZ_PRESETS;
  const partLabels   = mode === 'unix' ? UNIX_PARTS   : QUARTZ_PARTS.filter(p => {
    // Only show year column when the expression actually has 7 fields
    if (p.key === 'year') return result.valid && result.parts?.year !== undefined;
    return true;
  });
  const gridCols = mode === 'unix' ? 'grid-cols-5' : partLabels.length === 7 ? 'grid-cols-7' : 'grid-cols-6';
  const placeholder = mode === 'unix' ? '* * * * *' : '0 0 12 * * ?';

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Input card */}
      <div className="glass-card p-6">
        {/* Header row */}
        <div className="flex items-center gap-3 mb-4 flex-wrap">
          <Clock size={18} className="text-blue-400 flex-shrink-0" />
          <span className="text-sm font-semibold text-white">Cron Expression</span>

          {/* Mode toggle */}
          <div className="flex items-center rounded-lg bg-slate-800/60 border border-slate-700/50 p-0.5 gap-0.5">
            {(['unix', 'quartz'] as CronMode[]).map((m) => (
              <button
                key={m}
                onClick={() => handleModeChange(m)}
                className={clsx(
                  'px-3 py-1 rounded-md text-xs font-semibold transition-all capitalize',
                  mode === m
                    ? 'bg-blue-600 text-white shadow'
                    : 'text-slate-400 hover:text-slate-200'
                )}
              >
                {m === 'unix' ? 'Unix' : 'Quartz'}
              </button>
            ))}
          </div>

          {/* Valid / Invalid badge */}
          {result.valid ? (
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/25 text-green-400 text-xs font-semibold">
              <CheckCircle2 size={11} /> Valid
            </div>
          ) : input.trim() ? (
            <div className="ml-auto flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-semibold">
              <XCircle size={11} /> Invalid
            </div>
          ) : null}
        </div>

        {/* Input row */}
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => handleInput(e.target.value, mode)}
            spellCheck={false}
            className="flex-1 bg-slate-950/60 border border-slate-700/50 focus:border-blue-500/50 rounded-lg px-4 py-3 text-white font-mono text-lg outline-none transition-colors tracking-widest"
            placeholder={placeholder}
          />
          <button
            onClick={() => handleInput('', mode)}
            className="px-3 py-3 rounded-lg bg-slate-700/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Quartz cheat-sheet hint */}
        {mode === 'quartz' && (
          <p className="mt-2 text-xs text-slate-600 font-mono">
            sec  min  hour  day  month  weekday  [year] &nbsp;·&nbsp; special: ? L W #
          </p>
        )}

        {/* Parts breakdown */}
        <div className={clsx('grid gap-2 mt-4', gridCols)}>
          {partLabels.map((part) => (
            <div key={part.key} className="text-center">
              <div className={clsx(
                'py-2 px-1 rounded-lg bg-slate-800/60 border text-sm font-mono font-bold truncate',
                result.valid && result.parts
                  ? 'border-blue-500/20 text-blue-300'
                  : 'border-slate-700/40 text-slate-500'
              )}>
                {result.valid && result.parts ? (result.parts[part.key] ?? '–') : '–'}
              </div>
              <p className="text-xs text-slate-600 mt-1">{part.label}</p>
              <p className="text-xs text-slate-700 leading-tight">{part.range}</p>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {result.valid && (
          <motion.div key="valid" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Human-readable description */}
            <div className="glass-card p-5">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Human Readable</p>
              <p className="text-lg font-semibold text-white leading-relaxed">{result.description}</p>
            </div>

            {/* Next runs */}
            {result.nextRuns && result.nextRuns.length > 0 && (
              <div className="glass-card overflow-hidden">
                <div className="px-4 py-3 border-b border-slate-700/40 flex items-center gap-2">
                  <Calendar size={13} className="text-blue-400" />
                  <span className="text-xs font-semibold text-slate-300">Next 8 Executions</span>
                  {result.nextRunsApproximate && (
                    <div className="ml-auto flex items-center gap-1 text-xs text-amber-500/80">
                      <Info size={11} />
                      <span>approximate — Quartz modifiers (L, W, #) simplified</span>
                    </div>
                  )}
                </div>
                <div className="divide-y divide-slate-700/30">
                  {result.nextRuns.map((run, i) => (
                    <div key={i} className="px-4 py-2.5 flex items-center gap-4">
                      <span className="text-xs text-slate-700 w-5 font-mono">{i + 1}</span>
                      <span className="text-xs font-mono text-slate-300">{run}</span>
                      {i === 0 && (
                        <span className="ml-auto text-xs px-2 py-0.5 rounded-full bg-blue-500/15 border border-blue-500/25 text-blue-400">
                          Next
                        </span>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </motion.div>
        )}

        {!result.valid && input.trim() && (
          <motion.div key="invalid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card border-red-500/20 bg-red-500/5 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300 mb-1">Invalid Expression</p>
                <p className="text-xs text-red-400/80 font-mono">{result.error}</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Presets */}
      <div>
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">
          {mode === 'unix' ? 'Unix' : 'Quartz'} Presets
        </p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {presets.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleInput(preset.value, mode)}
              className={clsx(
                'text-left p-3 rounded-lg border transition-all text-xs',
                input === preset.value
                  ? 'bg-blue-500/20 border-blue-500/30 text-blue-300'
                  : 'bg-slate-800/40 border-slate-700/40 text-slate-400 hover:border-slate-600/60 hover:text-slate-300'
              )}
            >
              <p className="font-medium mb-1">{preset.label}</p>
              <p className="font-mono text-slate-600 text-xs">{preset.value}</p>
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}
