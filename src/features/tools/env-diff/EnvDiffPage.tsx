import { useState, useMemo } from 'react';
import { motion } from 'framer-motion';
import { GitCompare, Plus, Minus, RefreshCw, ArrowLeftRight, Eye, EyeOff } from 'lucide-react';
import { clsx } from 'clsx';
import { ToolShell } from '../../../components/common/ToolShell';
import { diffEnvFiles } from '../../../lib/parsers/env-diff';
import type { DiffEntry } from '../../../lib/parsers/env-diff';

const SAMPLE_LEFT = `# Production environment
NODE_ENV=production
PORT=3000
DATABASE_URL=postgresql://prod-db:5432/myapp
REDIS_URL=redis://prod-redis:6379
API_KEY=prod_key_abc123
LOG_LEVEL=warn
ENABLE_CACHE=true
MAX_CONNECTIONS=50
SENTRY_DSN=https://abc@sentry.io/123`;

const SAMPLE_RIGHT = `# Staging environment
NODE_ENV=staging
PORT=3000
DATABASE_URL=postgresql://staging-db:5432/myapp_staging
REDIS_URL=redis://staging-redis:6379
API_KEY=staging_key_xyz789
LOG_LEVEL=debug
ENABLE_CACHE=false
MAX_CONNECTIONS=10
NEW_FEATURE_FLAG=true
DEBUG_MODE=true`;

const STATUS_CONFIG = {
  added: { bg: 'bg-green-500/10', border: 'border-green-500/20', text: 'text-green-400', badge: 'bg-green-500/15 text-green-400', icon: Plus, label: 'Added' },
  removed: { bg: 'bg-red-500/10', border: 'border-red-500/20', text: 'text-red-400', badge: 'bg-red-500/15 text-red-400', icon: Minus, label: 'Removed' },
  changed: { bg: 'bg-yellow-500/10', border: 'border-yellow-500/20', text: 'text-yellow-400', badge: 'bg-yellow-500/15 text-yellow-400', icon: ArrowLeftRight, label: 'Changed' },
  unchanged: { bg: 'bg-transparent', border: 'border-slate-700/20', text: 'text-slate-500', badge: 'bg-slate-800 text-slate-600', icon: Eye, label: 'Same' },
};

function DiffRow({ entry, showUnchanged, maskValues }: { entry: DiffEntry; showUnchanged: boolean; maskValues: boolean }) {
  const cfg = STATUS_CONFIG[entry.status];
  if (entry.status === 'unchanged' && !showUnchanged) return null;
  const IconComp = cfg.icon;

  const maskVal = (v?: string) => {
    if (!v || !maskValues) return v;
    const looksSecret = /key|secret|token|pass|pwd|auth|api/i.test(entry.key);
    return looksSecret ? '••••••••' : v;
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className={clsx('grid grid-cols-[1fr_auto_1fr_auto] gap-3 px-4 py-2.5 border-b items-center', cfg.bg, cfg.border)}
      style={{ borderBottomWidth: 1 }}
    >
      <div className="font-mono text-xs text-slate-300 truncate">{entry.key}</div>
      <div className={clsx('flex-shrink-0 w-5 h-5 rounded-full flex items-center justify-center', cfg.badge)}>
        <IconComp size={10} />
      </div>
      <div className="font-mono text-xs text-slate-400 truncate text-right">{maskVal(entry.leftValue) ?? <span className="text-slate-700 italic">—</span>}</div>
      <div className="font-mono text-xs truncate text-right">
        {entry.status === 'changed' || entry.status === 'added' ? (
          <span className={cfg.text}>{maskVal(entry.rightValue)}</span>
        ) : entry.status === 'removed' ? (
          <span className="text-slate-700 italic">—</span>
        ) : (
          <span className="text-slate-500">{maskVal(entry.rightValue)}</span>
        )}
      </div>
    </motion.div>
  );
}

export function EnvDiffPage() {
  const [left, setLeft] = useState(SAMPLE_LEFT);
  const [right, setRight] = useState(SAMPLE_RIGHT);
  const [showUnchanged, setShowUnchanged] = useState(false);
  const [maskValues, setMaskValues] = useState(true);

  const result = useMemo(() => diffEnvFiles(left, right), [left, right]);
  const hasContent = left.trim() || right.trim();

  return (
    <ToolShell>
      {/* Stats row */}
      {hasContent && (
        <div className="flex items-center gap-3 flex-shrink-0 flex-wrap">
          {(['added', 'removed', 'changed', 'unchanged'] as const).map((s) => {
            const cfg = STATUS_CONFIG[s];
            const count = result.stats[s];
            return (
              <div key={s} className={clsx('flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium', cfg.badge, cfg.border)}>
                <span className="font-bold">{count}</span> {cfg.label}
              </div>
            );
          })}
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => setMaskValues(!maskValues)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 text-xs transition-colors"
            >
              {maskValues ? <EyeOff size={12} /> : <Eye size={12} />}
              {maskValues ? 'Show secrets' : 'Mask secrets'}
            </button>
            <button
              onClick={() => setShowUnchanged(!showUnchanged)}
              className={clsx(
                'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors',
                showUnchanged
                  ? 'bg-slate-700 border-slate-600 text-slate-200'
                  : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200'
              )}
            >
              <RefreshCw size={12} /> {showUnchanged ? 'Hide unchanged' : 'Show unchanged'}
            </button>
          </div>
        </div>
      )}

      {/* Two editors */}
      <div className="flex gap-4 flex-shrink-0" style={{ height: '220px' }}>
        {[
          { label: '.env (Left / Base)', value: left, onChange: setLeft, hint: 'e.g. production' },
          { label: '.env (Right / Compare)', value: right, onChange: setRight, hint: 'e.g. staging' },
        ].map(({ label, value, onChange, hint }) => (
          <div key={label} className="flex-1 flex flex-col glass-card overflow-hidden">
            <div className="px-4 py-2 border-b border-slate-700/40 flex-shrink-0">
              <p className="text-xs font-medium text-slate-400">{label}</p>
              <p className="text-xs text-slate-700">{hint}</p>
            </div>
            <textarea
              value={value}
              onChange={(e) => onChange(e.target.value)}
              spellCheck={false}
              className="flex-1 w-full bg-transparent text-slate-300 font-mono text-xs p-3 resize-none focus:outline-none leading-relaxed"
              placeholder={`KEY=value\n# comment\nANOTHER_KEY=value`}
            />
          </div>
        ))}
      </div>

      {/* Diff table */}
      {hasContent ? (
        <div className="flex-1 glass-card overflow-hidden flex flex-col min-h-0">
          {/* Column headers */}
          <div className="grid grid-cols-[1fr_auto_1fr_auto] gap-3 px-4 py-2.5 border-b border-slate-700/40 bg-slate-800/40 flex-shrink-0">
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider">Key</span>
            <span className="w-5" />
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Left value</span>
            <span className="text-xs font-semibold text-slate-500 uppercase tracking-wider text-right">Right value</span>
          </div>
          <div className="overflow-auto flex-1">
            {result.entries.length === 0 ? (
              <div className="flex items-center justify-center h-full">
                <div className="text-center">
                  <GitCompare size={28} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-600">Paste .env content above to compare</p>
                </div>
              </div>
            ) : (
              result.entries.map((entry) => (
                <DiffRow key={entry.key} entry={entry} showUnchanged={showUnchanged} maskValues={maskValues} />
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="flex-1 flex items-center justify-center glass-card">
          <div className="text-center">
            <GitCompare size={32} className="text-slate-700 mx-auto mb-3" />
            <p className="text-sm text-slate-600">Paste .env files above to compare</p>
          </div>
        </div>
      )}
    </ToolShell>
  );
}
