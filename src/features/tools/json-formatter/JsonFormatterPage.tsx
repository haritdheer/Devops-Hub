import { useState, useCallback } from 'react';
import {
  Copy, Check, Trash2, AlignLeft, Minimize2, Play, Braces, FileText,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ToolShell } from '../../../components/common/ToolShell';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { useToolPersistence } from '../../../hooks/useToolPersistence';

const SAMPLES: Record<string, string> = {
  'API Response': `{"status":"ok","data":{"user":{"id":1,"name":"Jane Smith","email":"jane@example.com","roles":["admin","editor"]},"meta":{"total":42,"page":1,"perPage":10}}}`,
  'Package.json': `{"name":"my-app","version":"1.0.0","description":"A sample package","scripts":{"dev":"vite","build":"tsc && vite build","test":"vitest"},"dependencies":{"react":"^18.0.0","react-dom":"^18.0.0"},"devDependencies":{"typescript":"^5.0.0","vite":"^5.0.0"}}`,
  Config: `{"server":{"host":"0.0.0.0","port":8080,"timeout":30},"database":{"url":"postgresql://localhost:5432/mydb","pool":{"min":2,"max":10}},"features":{"auth":true,"cache":true,"rateLimit":false}}`,
};

type ParseStatus = 'idle' | 'valid' | 'invalid';
type ViewMode = 'prettified' | 'minified';

function countJsonKeys(obj: unknown): number {
  if (Array.isArray(obj)) return obj.reduce((acc, v) => acc + countJsonKeys(v), obj.length);
  if (obj && typeof obj === 'object') {
    const entries = Object.entries(obj as Record<string, unknown>);
    return entries.reduce((acc, [, v]) => acc + countJsonKeys(v), entries.length);
  }
  return 0;
}

function getJsonType(obj: unknown): string {
  if (Array.isArray(obj)) return 'array';
  if (obj === null) return 'null';
  return typeof obj;
}

function formatBytes(n: number) {
  return n < 1024 ? `${n} B` : `${(n / 1024).toFixed(1)} KB`;
}

export function JsonFormatterPage() {
  const [input, setInput] = useToolPersistence('tool_json_formatter', SAMPLES['API Response']);
  const [status, setStatus] = useState<ParseStatus>('idle');
  const [error, setError] = useState('');
  const [prettified, setPrettified] = useState('');
  const [minified, setMinified] = useState('');
  const [view, setView] = useState<ViewMode>('prettified');
  const [meta, setMeta] = useState<{ keys: number; type: string; size: string } | null>(null);
  const [copied, setCopied] = useState(false);

  const parse = useCallback((text = input): { ok: boolean; parsed?: unknown } => {
    if (!text.trim()) {
      setStatus('idle');
      setPrettified('');
      setMinified('');
      setMeta(null);
      return { ok: false };
    }
    try {
      const parsed = JSON.parse(text);
      const pretty = JSON.stringify(parsed, null, 2);
      const mini = JSON.stringify(parsed);
      setPrettified(pretty);
      setMinified(mini);
      setMeta({
        keys: countJsonKeys(parsed),
        type: getJsonType(parsed),
        size: formatBytes(new Blob([text]).size),
      });
      setStatus('valid');
      setError('');
      return { ok: true, parsed };
    } catch (e: unknown) {
      setStatus('invalid');
      setError(e instanceof Error ? e.message : 'Invalid JSON');
      setPrettified('');
      setMinified('');
      setMeta(null);
      return { ok: false };
    }
  }, [input]);

  const validate = useCallback(() => parse(), [parse]);

  const prettify = useCallback(() => {
    const { ok, parsed } = parse();
    if (ok && parsed !== undefined) {
      setInput(JSON.stringify(parsed, null, 2));
      setView('prettified');
    }
  }, [parse, setInput]);

  const minify = useCallback(() => {
    const { ok, parsed } = parse();
    if (ok && parsed !== undefined) {
      setInput(JSON.stringify(parsed));
      setView('minified');
    }
  }, [parse, setInput]);

  const copy = useCallback(() => {
    const text = view === 'minified' ? minified : prettified;
    if (text) {
      navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }, [view, prettified, minified]);

  const output = view === 'minified' ? minified : prettified;

  return (
    <ToolShell>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
        <StatusBadge
          status={status}
          message={
            status === 'valid' ? 'Valid JSON' : status === 'invalid' ? 'Invalid JSON' : 'Ready'
          }
        />
        <div className="flex items-center gap-2 flex-wrap">
          <select
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 cursor-pointer focus:outline-none"
            onChange={(e) => {
              if (e.target.value) { setInput(SAMPLES[e.target.value]); setStatus('idle'); }
              e.target.value = '';
            }}
            defaultValue=""
          >
            <option value="" disabled>Load Sample</option>
            {Object.keys(SAMPLES).map((s) => <option key={s} value={s}>{s}</option>)}
          </select>
          <button
            onClick={() => { setInput(''); setStatus('idle'); setPrettified(''); setMinified(''); setMeta(null); }}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            <Trash2 size={13} /> Clear
          </button>
          <button
            onClick={copy}
            className={clsx(
              'flex items-center gap-1.5 px-3 py-1.5 rounded-lg border text-xs transition-colors',
              copied
                ? 'bg-green-500/10 border-green-500/20 text-green-400'
                : 'bg-slate-800/60 border-slate-700/50 text-slate-400 hover:text-slate-200'
            )}
          >
            {copied ? <Check size={13} /> : <Copy size={13} />} {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={minify}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            <Minimize2 size={13} /> Minify
          </button>
          <button
            onClick={prettify}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            <AlignLeft size={13} /> Prettify
          </button>
          <button
            onClick={validate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-yellow-500/20 border border-yellow-500/30 text-yellow-300 hover:bg-yellow-500/30 text-xs font-medium transition-colors"
          >
            <Play size={13} /> Validate
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        {/* Input */}
        <div className="flex-1 flex flex-col glass-card overflow-hidden min-h-48 md:min-h-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 flex-shrink-0">
            <span className="text-xs font-medium text-slate-400">Input</span>
            <span className="text-xs text-slate-600">{input.length} chars</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => { setInput(e.target.value); setStatus('idle'); }}
            placeholder='Paste your JSON here...'
            className="flex-1 w-full bg-transparent text-slate-300 font-mono text-sm p-4 resize-none focus:outline-none leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Output */}
        <div className="flex-1 flex flex-col gap-3 min-h-48 md:min-h-0">
          {/* Error */}
          {status === 'invalid' && (
            <div className="glass-card p-4 border-red-500/20 bg-red-500/5 flex-shrink-0">
              <p className="text-xs font-semibold text-red-400 mb-1">Parse Error</p>
              <p className="text-xs text-red-300/80 font-mono leading-relaxed">{error}</p>
            </div>
          )}

          {/* Meta */}
          {status === 'valid' && meta && (
            <div className="glass-card p-4 flex-shrink-0">
              <div className="flex items-center justify-between mb-3">
                <p className="text-xs font-semibold text-slate-400">Structure</p>
                <div className="flex gap-1">
                  {(['prettified', 'minified'] as const).map((m) => (
                    <button
                      key={m}
                      onClick={() => setView(m)}
                      className={clsx(
                        'text-xs px-2.5 py-1 rounded-md capitalize transition-colors',
                        view === m ? 'bg-slate-700 text-white' : 'text-slate-500 hover:text-slate-300'
                      )}
                    >
                      {m}
                    </button>
                  ))}
                </div>
              </div>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Root Type', value: meta.type },
                  { label: 'Keys', value: meta.keys },
                  { label: 'Size', value: meta.size },
                ].map((s) => (
                  <div key={s.label} className="text-center p-2 rounded-lg bg-slate-800/40">
                    <p className="text-lg font-bold text-white">{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output */}
          <div className="flex-1 flex flex-col glass-card overflow-hidden min-h-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 flex-shrink-0">
              <div className="flex items-center gap-2">
                <Braces size={12} className="text-yellow-400" />
                <span className="text-xs font-medium text-slate-400">Output</span>
              </div>
              {status === 'valid' && (
                <span className="text-xs text-yellow-400 capitalize">{view}</span>
              )}
            </div>
            {status === 'idle' && (
              <div className="flex-1 flex items-center justify-center">
                <div className="text-center">
                  <FileText size={32} className="text-slate-700 mx-auto mb-2" />
                  <p className="text-xs text-slate-600">Click Validate to see output</p>
                </div>
              </div>
            )}
            {(status === 'valid' || status === 'invalid') && (
              <pre className="flex-1 overflow-auto p-4 text-sm font-mono leading-relaxed text-slate-300 whitespace-pre-wrap">
                {output || (status === 'invalid' ? '// Fix errors to see output' : '')}
              </pre>
            )}
          </div>
        </div>
      </div>
    </ToolShell>
  );
}
