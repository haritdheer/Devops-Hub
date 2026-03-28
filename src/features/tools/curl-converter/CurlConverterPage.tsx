import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeftRight, Copy, Check, RotateCcw, Globe, AlertTriangle } from 'lucide-react';
import { clsx } from 'clsx';
import { ToolShell } from '../../../components/common/ToolShell';
import { StatusBadge } from '../../../components/common/StatusBadge';
import { useToolPersistence } from '../../../hooks/useToolPersistence';
import { parseCurl, convertToFetch, convertToAxios } from '../../../lib/parsers/curl';

const SAMPLE = `curl -X POST 'https://api.example.com/v1/users' \\
  -H 'Authorization: Bearer eyJhbGciOiJIUzI1NiJ9.token' \\
  -H 'Content-Type: application/json' \\
  -H 'X-Request-ID: abc-123' \\
  -d '{"name":"Jane Smith","email":"jane@example.com","role":"admin"}'`;

const PRESETS = [
  {
    label: 'GET with auth',
    value: `curl -H 'Authorization: Bearer token123' 'https://api.example.com/users'`,
  },
  {
    label: 'POST JSON',
    value: `curl -X POST 'https://api.example.com/users' -H 'Content-Type: application/json' -d '{"name":"Alice"}'`,
  },
  {
    label: 'PUT request',
    value: `curl -X PUT 'https://api.example.com/users/42' -H 'Authorization: Bearer token' -H 'Content-Type: application/json' -d '{"name":"Updated"}'`,
  },
];

type OutputTab = 'fetch' | 'axios';

function CodeBlock({ code, label }: { code: string; label: string }) {
  const [copied, setCopied] = useState(false);
  const copy = () => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  return (
    <div className="flex-1 glass-card overflow-hidden flex flex-col min-h-0">
      <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-2">
          <div className="flex gap-1.5">
            <div className="w-2.5 h-2.5 rounded-full bg-red-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-yellow-500/50" />
            <div className="w-2.5 h-2.5 rounded-full bg-green-500/50" />
          </div>
          <span className="text-xs text-slate-500">{label}</span>
        </div>
        <button
          onClick={copy}
          className={clsx(
            'flex items-center gap-1 text-xs transition-colors',
            copied ? 'text-green-400' : 'text-slate-500 hover:text-slate-300'
          )}
        >
          {copied ? <Check size={11} /> : <Copy size={11} />} {copied ? 'Copied!' : 'Copy'}
        </button>
      </div>
      <pre className="flex-1 overflow-auto p-4 text-xs font-mono text-slate-300 leading-relaxed">{code}</pre>
    </div>
  );
}

export function CurlConverterPage() {
  const [input, setInput] = useToolPersistence('tool_curl_converter', SAMPLE);
  const [activeTab, setActiveTab] = useState<OutputTab>('fetch');

  const parsed = useMemo(() => parseCurl(input), [input]);
  const fetchCode = useMemo(() => convertToFetch(parsed), [parsed]);
  const axiosCode = useMemo(() => convertToAxios(parsed), [parsed]);

  const status = !input.trim() ? 'idle' : parsed.valid ? 'valid' : 'invalid';

  return (
    <ToolShell>
      {/* Header */}
      <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
        <StatusBadge
          status={status}
          message={status === 'valid' ? `${parsed.method} request parsed` : status === 'invalid' ? parsed.error || 'Parse error' : 'Ready'}
        />
        <div className="flex items-center gap-2">
          <select
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 cursor-pointer focus:outline-none"
            onChange={(e) => { if (e.target.value) setInput(PRESETS[parseInt(e.target.value)].value); e.target.value = ''; }}
            defaultValue=""
          >
            <option value="" disabled>Load Preset</option>
            {PRESETS.map((p, i) => <option key={i} value={i}>{p.label}</option>)}
          </select>
          <button
            onClick={() => setInput(SAMPLE)}
            className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
          >
            Sample
          </button>
          <button
            onClick={() => setInput('')}
            className="flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <RotateCcw size={12} /> Clear
          </button>
        </div>
      </div>

      {/* Parsed metadata */}
      {parsed.valid && (
        <motion.div
          initial={{ opacity: 0, y: -4 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex items-center gap-3 flex-shrink-0 flex-wrap"
        >
          <span className={clsx(
            'text-xs px-2.5 py-1 rounded-full font-bold border',
            parsed.method === 'GET' ? 'bg-green-500/15 border-green-500/25 text-green-400' :
            parsed.method === 'POST' ? 'bg-blue-500/15 border-blue-500/25 text-blue-400' :
            parsed.method === 'PUT' ? 'bg-yellow-500/15 border-yellow-500/25 text-yellow-400' :
            parsed.method === 'DELETE' ? 'bg-red-500/15 border-red-500/25 text-red-400' :
            'bg-slate-700/60 border-slate-700/50 text-slate-400'
          )}>
            {parsed.method}
          </span>
          <div className="flex items-center gap-2 text-xs text-slate-400">
            <Globe size={12} className="text-slate-500" />
            <span className="font-mono text-teal-400/80 truncate max-w-xs">{parsed.url}</span>
          </div>
          {parsed.headers && Object.keys(parsed.headers).length > 0 && (
            <span className="text-xs text-slate-600">{Object.keys(parsed.headers).length} header{Object.keys(parsed.headers).length !== 1 ? 's' : ''}</span>
          )}
          {parsed.body && <span className="text-xs text-slate-600">has body</span>}
        </motion.div>
      )}

      {/* Input */}
      <div className="flex-shrink-0">
        <div className="glass-card overflow-hidden">
          <div className="px-4 py-2 border-b border-slate-700/40 flex items-center gap-2">
            <ArrowLeftRight size={12} className="text-teal-400" />
            <span className="text-xs font-medium text-slate-400">cURL Command</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => setInput(e.target.value)}
            spellCheck={false}
            rows={5}
            className="w-full bg-transparent text-slate-300 font-mono text-xs p-4 resize-none focus:outline-none leading-relaxed"
            placeholder="curl 'https://api.example.com/endpoint' -H 'Authorization: Bearer token' ..."
          />
        </div>
      </div>

      {/* Output */}
      <div className="flex-1 flex flex-col min-h-0">
        <AnimatePresence mode="wait">
          {parsed.valid ? (
            <motion.div key="valid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex flex-col min-h-0 gap-3">
              {/* Tabs */}
              <div className="flex items-center gap-1 flex-shrink-0">
                {(['fetch', 'axios'] as const).map((t) => (
                  <button
                    key={t}
                    onClick={() => setActiveTab(t)}
                    className={clsx(
                      'px-4 py-1.5 rounded-lg text-xs font-medium transition-colors capitalize',
                      activeTab === t ? 'bg-teal-500/20 border border-teal-500/30 text-teal-300' : 'text-slate-500 hover:text-slate-300'
                    )}
                  >
                    {t === 'fetch' ? 'fetch()' : 'axios'}
                  </button>
                ))}
              </div>

              {activeTab === 'fetch' ? (
                <CodeBlock key="fetch" code={fetchCode} label="fetch.js" />
              ) : (
                <CodeBlock key="axios" code={axiosCode} label="axios.js" />
              )}
            </motion.div>
          ) : input.trim() ? (
            <motion.div key="invalid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card border-red-500/20 bg-red-500/5 p-5">
              <div className="flex items-start gap-3">
                <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                <div>
                  <p className="text-sm font-semibold text-red-300 mb-1">Parse Error</p>
                  <p className="text-xs text-red-400/80 font-mono">{parsed.error}</p>
                </div>
              </div>
            </motion.div>
          ) : (
            <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex-1 flex items-center justify-center glass-card">
              <div className="text-center">
                <ArrowLeftRight size={28} className="mx-auto text-slate-700 mb-3" />
                <p className="text-sm text-slate-600">Paste a cURL command to convert it</p>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </ToolShell>
  );
}
