import { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Clock, CheckCircle2, XCircle, AlertTriangle, Calendar, RotateCcw } from 'lucide-react';
import { clsx } from 'clsx';
import { parseCron, type CronParseResult } from '../../../lib/parsers/cron';

const STORAGE_KEY = 'tool_cron_tester';

const PRESETS = [
  { label: 'Every minute', value: '* * * * *' },
  { label: 'Every 5 min', value: '*/5 * * * *' },
  { label: 'Every 15 min', value: '*/15 * * * *' },
  { label: 'Every hour', value: '0 * * * *' },
  { label: 'Daily midnight', value: '0 0 * * *' },
  { label: 'Daily 9am', value: '0 9 * * *' },
  { label: 'Every weekday', value: '0 9 * * 1-5' },
  { label: 'Weekly Monday', value: '0 0 * * 1' },
  { label: 'Monthly 1st', value: '0 0 1 * *' },
  { label: 'Yearly Jan 1', value: '0 0 1 1 *' },
  { label: 'Every 30 min', value: '*/30 * * * *' },
  { label: 'Twice daily', value: '0 6,18 * * *' },
];

const PART_LABELS = [
  { key: 'minute' as const, label: 'Minute', range: '0-59' },
  { key: 'hour' as const, label: 'Hour', range: '0-23' },
  { key: 'dayOfMonth' as const, label: 'Day', range: '1-31' },
  { key: 'month' as const, label: 'Month', range: '1-12' },
  { key: 'dayOfWeek' as const, label: 'Weekday', range: '0-6' },
];

export function CronTesterPage() {
  const [input, setInput] = useState(() => localStorage.getItem(STORAGE_KEY) || '*/5 * * * *');
  const [result, setResult] = useState<CronParseResult>(() => parseCron(localStorage.getItem(STORAGE_KEY) || '*/5 * * * *'));

  useEffect(() => { localStorage.setItem(STORAGE_KEY, input); }, [input]);

  const handleInput = useCallback((val: string) => {
    setInput(val);
    setResult(parseCron(val));
  }, []);

  return (
    <div className="p-6 space-y-6 max-w-4xl mx-auto">
      {/* Input */}
      <div className="glass-card p-6">
        <div className="flex items-center gap-3 mb-4">
          <Clock size={18} className="text-blue-400" />
          <span className="text-sm font-semibold text-white">Cron Expression</span>
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
        <div className="flex gap-3">
          <input
            type="text"
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            spellCheck={false}
            className="flex-1 bg-slate-950/60 border border-slate-700/50 focus:border-blue-500/50 rounded-lg px-4 py-3 text-white font-mono text-lg outline-none transition-colors tracking-widest"
            placeholder="* * * * *"
          />
          <button
            onClick={() => handleInput('')}
            className="px-3 py-3 rounded-lg bg-slate-700/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:bg-slate-700 transition-colors"
          >
            <RotateCcw size={16} />
          </button>
        </div>

        {/* Parts breakdown */}
        <div className="grid grid-cols-5 gap-2 mt-4">
          {PART_LABELS.map((part) => (
            <div key={part.key} className="text-center">
              <div className={clsx(
                'py-2 px-1 rounded-lg bg-slate-800/60 border text-sm font-mono font-bold',
                result.valid && result.parts
                  ? 'border-blue-500/20 text-blue-300'
                  : 'border-slate-700/40 text-slate-500'
              )}>
                {result.valid && result.parts ? result.parts[part.key] : '-'}
              </div>
              <p className="text-xs text-slate-600 mt-1">{part.label}</p>
              <p className="text-xs text-slate-700">{part.range}</p>
            </div>
          ))}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {result.valid && (
          <motion.div key="valid" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-5">
            {/* Description */}
            <div className="glass-card p-5">
              <p className="text-xs text-slate-500 mb-2 uppercase tracking-wider">Human Readable</p>
              <p className="text-lg font-semibold text-white leading-relaxed">{result.description}</p>
            </div>

            {/* Next runs */}
            <div className="glass-card overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/40 flex items-center gap-2">
                <Calendar size={13} className="text-blue-400" />
                <span className="text-xs font-semibold text-slate-300">Next 8 Executions</span>
              </div>
              <div className="divide-y divide-slate-700/30">
                {result.nextRuns?.map((run, i) => (
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
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Common Presets</p>
        <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
          {PRESETS.map((preset) => (
            <button
              key={preset.value}
              onClick={() => handleInput(preset.value)}
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
