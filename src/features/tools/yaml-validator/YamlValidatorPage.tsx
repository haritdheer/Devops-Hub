import { useState, useCallback } from 'react';
import * as yaml from 'js-yaml';
import {
  Copy, Check, Trash2, RefreshCw, Play, FileText,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ToolShell } from '../../../components/common/ToolShell';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { useToolPersistence } from '../../../hooks/useToolPersistence';

const SAMPLES: Record<string, string> = {
  'Generic Config': `name: my-service\nversion: "1.0.0"\nenvironment: production\n\nserver:\n  host: 0.0.0.0\n  port: 8080\n  timeout: 30s\n\ndatabase:\n  host: db.example.com\n  port: 5432\n  name: myapp\n  pool:\n    min: 2\n    max: 10\n\nlogging:\n  level: info\n  format: json`,
  'K8s Deployment': `apiVersion: apps/v1\nkind: Deployment\nmetadata:\n  name: my-app\n  namespace: default\n  labels:\n    app: my-app\n    version: v1\nspec:\n  replicas: 3\n  selector:\n    matchLabels:\n      app: my-app\n  template:\n    metadata:\n      labels:\n        app: my-app\n    spec:\n      containers:\n      - name: app\n        image: my-app:1.0.0\n        ports:\n        - containerPort: 8080\n        resources:\n          requests:\n            memory: 128Mi\n            cpu: 100m\n          limits:\n            memory: 256Mi\n            cpu: 500m`,
  'Docker Compose': `version: '3.8'\nservices:\n  web:\n    image: nginx:alpine\n    ports:\n      - "80:80"\n    depends_on:\n      - api\n  api:\n    build: ./api\n    environment:\n      - NODE_ENV=production\n      - DATABASE_URL=postgres://db:5432/app\n    ports:\n      - "3000:3000"\n  db:\n    image: postgres:15\n    volumes:\n      - pgdata:/var/lib/postgresql/data\nvolumes:\n  pgdata:`,
};

type ParseStatus = 'idle' | 'valid' | 'invalid';

interface YamlMeta {
  keys: number;
  depth: number;
  type: string;
}

function getYamlMeta(parsed: unknown, depth = 0): YamlMeta {
  if (Array.isArray(parsed)) {
    const inner = parsed.map((i) => getYamlMeta(i, depth + 1));
    return {
      keys: parsed.length,
      depth: Math.max(depth, ...inner.map((m) => m.depth)),
      type: 'array',
    };
  }
  if (parsed && typeof parsed === 'object') {
    const keys = Object.keys(parsed as object);
    const inner = Object.values(parsed as object).map((v) => getYamlMeta(v, depth + 1));
    return {
      keys: keys.length,
      depth: Math.max(depth, ...inner.map((m) => m.depth)),
      type: 'object',
    };
  }
  return { keys: 0, depth, type: typeof parsed };
}

export function YamlValidatorPage() {
  const [input, setInput] = useToolPersistence('tool_yaml_validator', SAMPLES['Generic Config']);
  const [status, setStatus] = useState<ParseStatus>('idle');
  const [error, setError] = useState<string>('');
  const [output, setOutput] = useState<string>('');
  const [meta, setMeta] = useState<YamlMeta | null>(null);
  const [copied, setCopied] = useState(false);

  const validate = useCallback(() => {
    if (!input.trim()) {
      setStatus('idle');
      setOutput('');
      setMeta(null);
      return;
    }
    try {
      const parsed = yaml.load(input);
      const formatted = yaml.dump(parsed, { indent: 2, lineWidth: 120 });
      setOutput(formatted);
      setMeta(getYamlMeta(parsed));
      setStatus('valid');
      setError('');
    } catch (e: unknown) {
      setStatus('invalid');
      setError(e instanceof Error ? e.message : 'Invalid YAML');
      setOutput('');
      setMeta(null);
    }
  }, [input]);

  const format = useCallback(() => {
    try {
      const parsed = yaml.load(input);
      const formatted = yaml.dump(parsed, { indent: 2, lineWidth: 120 });
      setInput(formatted);
      setOutput(formatted);
      setMeta(getYamlMeta(parsed));
      setStatus('valid');
      setError('');
    } catch (e: unknown) {
      setStatus('invalid');
      setError(e instanceof Error ? e.message : 'Invalid YAML');
    }
  }, [input, setInput]);

  const copy = useCallback(() => {
    navigator.clipboard.writeText(output || input);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [output, input]);

  const handleTextareaKeyDown = useCallback(
    (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
      if (e.key === 'Tab') {
        e.preventDefault();
        const el = e.currentTarget;
        const s = el.selectionStart;
        const end = el.selectionEnd;
        const newVal = input.substring(0, s) + '  ' + input.substring(end);
        setInput(newVal);
        // Restore cursor position after React re-render
        requestAnimationFrame(() => {
          el.selectionStart = s + 2;
          el.selectionEnd = s + 2;
        });
      }
    },
    [input, setInput]
  );

  return (
    <ToolShell>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <StatusBadge
            status={status}
            message={
              status === 'valid'
                ? 'Valid YAML'
                : status === 'invalid'
                ? 'Invalid YAML'
                : 'Ready to validate'
            }
          />
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* Sample selector */}
          <select
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 cursor-pointer focus:outline-none"
            onChange={(e) => {
              if (e.target.value) {
                setInput(SAMPLES[e.target.value]);
                setStatus('idle');
                setOutput('');
                setMeta(null);
              }
              e.target.value = '';
            }}
            defaultValue=""
          >
            <option value="" disabled>
              Load Sample
            </option>
            {Object.keys(SAMPLES).map((s) => (
              <option key={s} value={s}>
                {s}
              </option>
            ))}
          </select>
          <button
            onClick={() => {
              setInput('');
              setStatus('idle');
              setOutput('');
              setMeta(null);
            }}
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
            {copied ? <Check size={13} /> : <Copy size={13} />}
            {copied ? 'Copied!' : 'Copy'}
          </button>
          <button
            onClick={format}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            <RefreshCw size={13} /> Format
          </button>
          <button
            onClick={validate}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 text-xs font-medium transition-colors"
          >
            <Play size={13} /> Validate
          </button>
        </div>
      </div>

      {/* Body */}
      <div className="flex flex-col md:flex-row gap-4 flex-1 min-h-0">
        {/* Input Panel */}
        <div className="flex-1 flex flex-col glass-card overflow-hidden min-h-48 md:min-h-0">
          <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 flex-shrink-0">
            <span className="text-xs font-medium text-slate-400">Input</span>
            <span className="text-xs text-slate-600">{input.split('\n').length} lines</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => {
              setInput(e.target.value);
              setStatus('idle');
            }}
            onKeyDown={handleTextareaKeyDown}
            placeholder="Paste your YAML here..."
            className="flex-1 w-full bg-transparent text-slate-300 font-mono text-sm p-4 resize-none focus:outline-none leading-relaxed"
            spellCheck={false}
          />
        </div>

        {/* Output Panel */}
        <div className="flex-1 flex flex-col gap-3 min-h-48 md:min-h-0">
          {/* Error card */}
          {status === 'invalid' && (
            <div className="glass-card p-4 border-red-500/20 bg-red-500/5 flex-shrink-0">
              <p className="text-xs font-semibold text-red-400 mb-1">Parse Error</p>
              <p className="text-xs text-red-300/80 font-mono leading-relaxed whitespace-pre-wrap">
                {error}
              </p>
            </div>
          )}

          {/* Meta card */}
          {status === 'valid' && meta && (
            <div className="glass-card p-4 flex-shrink-0">
              <p className="text-xs font-semibold text-slate-400 mb-3">Structure</p>
              <div className="grid grid-cols-3 gap-3">
                {[
                  { label: 'Root Keys', value: meta.keys },
                  { label: 'Max Depth', value: meta.depth },
                  { label: 'Root Type', value: meta.type },
                ].map((s) => (
                  <div key={s.label} className="text-center p-2 rounded-lg bg-slate-800/40">
                    <p className="text-lg font-bold text-white">{s.value}</p>
                    <p className="text-xs text-slate-500">{s.label}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Output card */}
          <div className="flex-1 flex flex-col glass-card overflow-hidden min-h-0">
            <div className="flex items-center justify-between px-4 py-2 border-b border-slate-700/50 flex-shrink-0">
              <span className="text-xs font-medium text-slate-400">Output</span>
              {status === 'valid' && (
                <span className="text-xs text-green-400">Formatted</span>
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
