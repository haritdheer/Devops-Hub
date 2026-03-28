import { useState, useEffect, useCallback, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Send,
  Plus,
  Trash2,
  ChevronDown,
  ChevronUp,
  Clock,
  Loader2,
  AlertTriangle,
  Globe,
  Lock,
  List,
  FileJson,
  Copy,
  Check,
  Terminal,
  Eye,
  X,
} from 'lucide-react';
import { clsx } from 'clsx';
import { ToolShell } from '../../../components/common/ToolShell';
import { useToolPersistence } from '../../../hooks/useToolPersistence';

// ---------------------------------------------------------------------------
// Types
// ---------------------------------------------------------------------------

type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
type RequestTab = 'params' | 'headers' | 'body' | 'auth';
type ResponseTab = 'body' | 'headers' | 'preview';
type BodyType = 'json' | 'text' | 'form';
type AuthType = 'none' | 'bearer' | 'basic';

interface KVRow {
  id: string;
  enabled: boolean;
  key: string;
  value: string;
}

interface AuthConfig {
  type: AuthType;
  token: string;
  username: string;
  password: string;
}

interface ResponseData {
  status: number;
  statusText: string;
  timeMs: number;
  sizeBytes: number;
  headers: Record<string, string>;
  body: string;
  isJson: boolean;
}

interface HistoryEntry {
  id: string;
  method: HttpMethod;
  url: string;
  status: number | null;
  timestamp: Date;
  params: KVRow[];
  headers: KVRow[];
  body: string;
  bodyType: BodyType;
  auth: AuthConfig;
}

// ---------------------------------------------------------------------------
// Constants
// ---------------------------------------------------------------------------

const METHODS: HttpMethod[] = ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS'];

const METHOD_COLORS: Record<HttpMethod, string> = {
  GET: 'bg-green-500/15 border-green-500/25 text-green-400',
  POST: 'bg-blue-500/15 border-blue-500/25 text-blue-400',
  PUT: 'bg-yellow-500/15 border-yellow-500/25 text-yellow-400',
  PATCH: 'bg-orange-500/15 border-orange-500/25 text-orange-400',
  DELETE: 'bg-red-500/15 border-red-500/25 text-red-400',
  HEAD: 'bg-slate-700/60 border-slate-600/40 text-slate-400',
  OPTIONS: 'bg-slate-700/60 border-slate-600/40 text-slate-400',
};

const DEFAULT_HEADERS: KVRow[] = [
  { id: 'h1', enabled: true, key: 'Content-Type', value: 'application/json' },
  { id: 'h2', enabled: true, key: 'Accept', value: 'application/json' },
];

const BODY_METHODS: HttpMethod[] = ['POST', 'PUT', 'PATCH', 'DELETE'];

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function formatBytes(n: number): string {
  if (n < 1024) return `${n} B`;
  if (n < 1024 * 1024) return `${(n / 1024).toFixed(1)} KB`;
  return `${(n / (1024 * 1024)).toFixed(2)} MB`;
}

function statusColor(code: number): string {
  if (code >= 200 && code < 300) return 'bg-green-500/15 border-green-500/30 text-green-400';
  if (code >= 300 && code < 400) return 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400';
  return 'bg-red-500/15 border-red-500/30 text-red-400';
}

function historyStatusColor(code: number | null): string {
  if (code === null) return 'text-slate-500';
  if (code >= 200 && code < 300) return 'text-green-400';
  if (code >= 300 && code < 400) return 'text-yellow-400';
  return 'text-red-400';
}

function buildUrl(base: string, params: KVRow[]): string {
  const enabled = params.filter((p) => p.enabled && p.key.trim());
  if (!enabled.length) return base;
  try {
    const url = new URL(base);
    enabled.forEach((p) => url.searchParams.set(p.key, p.value));
    return url.toString();
  } catch {
    const qs = enabled.map((p) => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&');
    return base.includes('?') ? `${base}&${qs}` : `${base}?${qs}`;
  }
}

function tryPrettyJson(raw: string): string {
  try {
    return JSON.stringify(JSON.parse(raw), null, 2);
  } catch {
    return raw;
  }
}

interface ParsedCurl {
  method: HttpMethod;
  url: string;
  headers: KVRow[];
  body: string;
  bodyType: BodyType;
}

function parseCurl(cmd: string): ParsedCurl | null {
  try {
    // Normalize line continuations and collapse whitespace
    const normalized = cmd
      .replace(/\\\n/g, ' ')
      .replace(/\\\r\n/g, ' ')
      .trim();

    if (!normalized.toLowerCase().startsWith('curl')) return null;

    // Tokenize respecting quotes
    const tokens: string[] = [];
    let current = '';
    let inSingle = false;
    let inDouble = false;
    for (let i = 0; i < normalized.length; i++) {
      const ch = normalized[i];
      if (ch === "'" && !inDouble) { inSingle = !inSingle; continue; }
      if (ch === '"' && !inSingle) { inDouble = !inDouble; continue; }
      if ((ch === ' ' || ch === '\t') && !inSingle && !inDouble) {
        if (current) { tokens.push(current); current = ''; }
      } else {
        current += ch;
      }
    }
    if (current) tokens.push(current);

    let method: HttpMethod = 'GET';
    let url = '';
    const headers: KVRow[] = [];
    let body = '';
    let bodyType: BodyType = 'json';

    for (let i = 0; i < tokens.length; i++) {
      const t = tokens[i];
      if (t === 'curl') continue;
      if (t === '-X' || t === '--request') {
        method = (tokens[++i]?.toUpperCase() as HttpMethod) || 'GET';
      } else if (t === '-H' || t === '--header') {
        const raw = tokens[++i] || '';
        const colon = raw.indexOf(':');
        if (colon > -1) {
          headers.push({ id: uid(), enabled: true, key: raw.slice(0, colon).trim(), value: raw.slice(colon + 1).trim() });
        }
      } else if (t === '-d' || t === '--data' || t === '--data-raw' || t === '--data-binary') {
        body = tokens[++i] || '';
        method = method === 'GET' ? 'POST' : method;
        // Detect form vs json
        const ct = headers.find((h) => h.key.toLowerCase() === 'content-type')?.value || '';
        if (ct.includes('x-www-form-urlencoded')) bodyType = 'form';
        else if (ct.includes('text/plain')) bodyType = 'text';
        else bodyType = 'json';
        // Try to pretty print if json
        body = tryPrettyJson(body);
      } else if (t === '--form' || t === '-F') {
        const pair = tokens[++i] || '';
        body += (body ? '\n' : '') + pair;
        bodyType = 'form';
        method = method === 'GET' ? 'POST' : method;
      } else if (!t.startsWith('-')) {
        // URL
        url = t;
      }
    }

    if (!url) return null;
    return { method, url, headers, body, bodyType };
  } catch {
    return null;
  }
}

// ---------------------------------------------------------------------------
// Sub-components
// ---------------------------------------------------------------------------

interface KVTableProps {
  rows: KVRow[];
  onChange: (rows: KVRow[]) => void;
  keyPlaceholder?: string;
  valuePlaceholder?: string;
}

function KVTable({ rows, onChange, keyPlaceholder = 'Key', valuePlaceholder = 'Value' }: KVTableProps) {
  const update = (id: string, field: keyof KVRow, val: string | boolean) => {
    onChange(rows.map((r) => (r.id === id ? { ...r, [field]: val } : r)));
  };
  const remove = (id: string) => onChange(rows.filter((r) => r.id !== id));
  const add = () => onChange([...rows, { id: uid(), enabled: true, key: '', value: '' }]);

  return (
    <div className="flex flex-col gap-1">
      {rows.map((row) => (
        <div key={row.id} className="flex items-center gap-1.5">
          <input
            type="checkbox"
            checked={row.enabled}
            onChange={(e) => update(row.id, 'enabled', e.target.checked)}
            className="w-3.5 h-3.5 flex-shrink-0 accent-cyan-500 cursor-pointer"
          />
          <input
            type="text"
            value={row.key}
            onChange={(e) => update(row.id, 'key', e.target.value)}
            placeholder={keyPlaceholder}
            className="flex-1 min-w-0 bg-slate-800/50 border border-slate-700/40 rounded px-2 py-1 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
          />
          <input
            type="text"
            value={row.value}
            onChange={(e) => update(row.id, 'value', e.target.value)}
            placeholder={valuePlaceholder}
            className="flex-1 min-w-0 bg-slate-800/50 border border-slate-700/40 rounded px-2 py-1 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
          />
          <button
            onClick={() => remove(row.id)}
            className="flex-shrink-0 p-1 text-slate-600 hover:text-red-400 transition-colors"
          >
            <Trash2 size={12} />
          </button>
        </div>
      ))}
      <button
        onClick={add}
        className="mt-1 flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-400 transition-colors self-start"
      >
        <Plus size={12} /> Add row
      </button>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Main component
// ---------------------------------------------------------------------------

export function ApiTesterPage() {
  // Persisted state
  const [url, setUrl] = useToolPersistence('tool_api_tester', 'https://jsonplaceholder.typicode.com/posts/1');

  // Method persistence via localStorage + useState
  const [method, setMethod] = useState<HttpMethod>(() => {
    try { return (localStorage.getItem('tool_api_tester_method') as HttpMethod) || 'GET'; } catch { return 'GET'; }
  });
  useEffect(() => { try { localStorage.setItem('tool_api_tester_method', method); } catch {} }, [method]);

  // Params persistence
  const [params, setParams] = useState<KVRow[]>(() => {
    try {
      const raw = localStorage.getItem('tool_api_tester_params');
      return raw ? (JSON.parse(raw) as KVRow[]) : [];
    } catch { return []; }
  });
  useEffect(() => { try { localStorage.setItem('tool_api_tester_params', JSON.stringify(params)); } catch {} }, [params]);

  // Headers persistence
  const [headers, setHeaders] = useState<KVRow[]>(() => {
    try {
      const raw = localStorage.getItem('tool_api_tester_headers');
      return raw ? (JSON.parse(raw) as KVRow[]) : DEFAULT_HEADERS;
    } catch { return DEFAULT_HEADERS; }
  });
  useEffect(() => { try { localStorage.setItem('tool_api_tester_headers', JSON.stringify(headers)); } catch {} }, [headers]);

  // Other request state
  const [reqTab, setReqTab] = useState<RequestTab>('params');
  const [bodyType, setBodyType] = useState<BodyType>('json');
  const [body, setBody] = useState('{\n  \n}');
  const [auth, setAuth] = useState<AuthConfig>({ type: 'none', token: '', username: '', password: '' });

  // Response state
  const [loading, setLoading] = useState(false);
  const [response, setResponse] = useState<ResponseData | null>(null);
  const [responseError, setResponseError] = useState<string | null>(null);
  const [resTab, setResTab] = useState<ResponseTab>('body');
  const [bodyCopied, setBodyCopied] = useState(false);

  // History
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [historyOpen, setHistoryOpen] = useState(false);

  // cURL import
  const [curlOpen, setCurlOpen] = useState(false);
  const [curlInput, setCurlInput] = useState('');
  const [curlError, setCurlError] = useState('');

  const abortRef = useRef<AbortController | null>(null);

  const restoreHistory = useCallback((entry: HistoryEntry) => {
    setUrl(entry.url);
    setMethod(entry.method);
    setParams(entry.params);
    setHeaders(entry.headers);
    setBody(entry.body);
    setBodyType(entry.bodyType);
    setAuth(entry.auth);
    setHistoryOpen(false);
    setResponse(null);
    setResponseError(null);
  }, [setUrl]);

  const sendRequest = useCallback(async () => {
    if (!url.trim()) return;

    abortRef.current?.abort();
    const controller = new AbortController();
    abortRef.current = controller;

    setLoading(true);
    setResponse(null);
    setResponseError(null);

    const finalUrl = buildUrl(url.trim(), params);

    // Build headers object
    const reqHeaders: Record<string, string> = {};
    headers.filter((h) => h.enabled && h.key.trim()).forEach((h) => { reqHeaders[h.key] = h.value; });

    // Auth header
    if (auth.type === 'bearer' && auth.token.trim()) {
      reqHeaders['Authorization'] = `Bearer ${auth.token.trim()}`;
    } else if (auth.type === 'basic' && (auth.username || auth.password)) {
      reqHeaders['Authorization'] = `Basic ${btoa(`${auth.username}:${auth.password}`)}`;
    }

    const start = performance.now();

    try {
      const fetchOptions: RequestInit = {
        method,
        headers: reqHeaders,
        signal: controller.signal,
      };

      if (BODY_METHODS.includes(method) && bodyType !== 'form') {
        fetchOptions.body = body;
      } else if (BODY_METHODS.includes(method) && bodyType === 'form') {
        // form body: parse key=value lines
        const fd = new URLSearchParams();
        body.split('\n').forEach((line) => {
          const [k, ...rest] = line.split('=');
          if (k?.trim()) fd.set(k.trim(), rest.join('=').trim());
        });
        fetchOptions.body = fd.toString();
        if (!reqHeaders['Content-Type']) reqHeaders['Content-Type'] = 'application/x-www-form-urlencoded';
      }

      const res = await fetch(finalUrl, fetchOptions);
      const elapsed = performance.now() - start;

      const resText = await res.text();
      const resHeaders: Record<string, string> = {};
      res.headers.forEach((val, key) => { resHeaders[key] = val; });

      const isJson =
        (res.headers.get('content-type') || '').includes('application/json') ||
        (resText.trimStart().startsWith('{') || resText.trimStart().startsWith('['));

      const sizeBytes = new Blob([resText]).size;

      const data: ResponseData = {
        status: res.status,
        statusText: res.statusText,
        timeMs: Math.round(elapsed),
        sizeBytes,
        headers: resHeaders,
        body: isJson ? tryPrettyJson(resText) : resText,
        isJson,
      };

      setResponse(data);
      setResTab('body');

      // Add to history (keep last 8)
      const entry: HistoryEntry = {
        id: uid(),
        method,
        url: url.trim(),
        status: res.status,
        timestamp: new Date(),
        params: [...params],
        headers: [...headers],
        body,
        bodyType,
        auth: { ...auth },
      };
      setHistory((prev) => [entry, ...prev].slice(0, 8));
    } catch (err: unknown) {
      if (err instanceof Error && err.name === 'AbortError') return;

      const msg = err instanceof Error ? err.message : 'Unknown error';
      const isCors = msg.toLowerCase().includes('failed to fetch') || msg.toLowerCase().includes('network');

      setResponseError(
        isCors
          ? "Request failed — this may be a CORS issue. The API server must allow requests from browser origins. Check the browser console for more details."
          : `Network error: ${msg}`
      );

      // Still add to history with null status
      const entry: HistoryEntry = {
        id: uid(),
        method,
        url: url.trim(),
        status: null,
        timestamp: new Date(),
        params: [...params],
        headers: [...headers],
        body,
        bodyType,
        auth: { ...auth },
      };
      setHistory((prev) => [entry, ...prev].slice(0, 8));
    } finally {
      setLoading(false);
    }
  }, [url, method, params, headers, body, bodyType, auth]);

  const handleKeyDown = useCallback((e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter' && (e.ctrlKey || e.metaKey)) sendRequest();
  }, [sendRequest]);

  const importCurl = useCallback(() => {
    const parsed = parseCurl(curlInput.trim());
    if (!parsed) { setCurlError('Could not parse cURL command. Make sure it starts with "curl".'); return; }
    setUrl(parsed.url);
    setMethod(parsed.method);
    if (parsed.headers.length > 0) setHeaders((prev) => {
      const existingKeys = new Set(parsed.headers.map((h) => h.key.toLowerCase()));
      const kept = prev.filter((h) => !existingKeys.has(h.key.toLowerCase()));
      return [...parsed.headers, ...kept];
    });
    if (parsed.body) { setBody(parsed.body); setBodyType(parsed.bodyType); }
    setCurlInput('');
    setCurlError('');
    setCurlOpen(false);
  }, [curlInput, setUrl]);

  const copyBody = () => {
    if (response?.body) {
      navigator.clipboard.writeText(response.body);
      setBodyCopied(true);
      setTimeout(() => setBodyCopied(false), 2000);
    }
  };

  const showBodyTab = BODY_METHODS.includes(method);

  return (
    <ToolShell>
      {/* ------------------------------------------------------------------ */}
      {/* Header row                                                          */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex items-center justify-between flex-shrink-0 flex-wrap gap-2">
        <div className="flex items-center gap-2">
          <Globe size={14} className="text-cyan-400" />
          <span className="text-sm font-semibold text-slate-300">API Tester</span>
          <span className="text-xs text-slate-600 hidden sm:inline">Postman-style HTTP client</span>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => { setCurlOpen((o) => !o); setHistoryOpen(false); }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Terminal size={12} /> Import cURL
          </button>
          <button
            onClick={() => { setHistoryOpen((o) => !o); setCurlOpen(false); }}
            className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 transition-colors"
          >
            <Clock size={12} />
            History
            {history.length > 0 && (
              <span className="ml-1 bg-cyan-500/20 text-cyan-400 text-[10px] px-1.5 rounded-full border border-cyan-500/30">
                {history.length}
              </span>
            )}
            {historyOpen ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
          </button>
        </div>
      </div>

      {/* ------------------------------------------------------------------ */}
      {/* History panel                                                       */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {historyOpen && (
          <motion.div
            key="history"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex-shrink-0"
          >
            <div className="glass-card p-3">
              <p className="text-xs font-medium text-slate-500 mb-2 flex items-center gap-1.5">
                <List size={11} /> Recent requests (click to restore)
              </p>
              {history.length === 0 ? (
                <p className="text-xs text-slate-600">No requests yet.</p>
              ) : (
                <div className="flex flex-col gap-1">
                  {history.map((entry) => (
                    <button
                      key={entry.id}
                      onClick={() => restoreHistory(entry)}
                      className="flex items-center gap-2 text-left px-2 py-1.5 rounded-md hover:bg-slate-700/30 transition-colors group"
                    >
                      <span className={clsx('text-[10px] font-bold px-1.5 py-0.5 rounded border flex-shrink-0', METHOD_COLORS[entry.method])}>
                        {entry.method}
                      </span>
                      <span className="flex-1 truncate text-xs font-mono text-slate-400 group-hover:text-slate-200 transition-colors">
                        {entry.url}
                      </span>
                      {entry.status !== null && (
                        <span className={clsx('text-xs font-mono font-semibold flex-shrink-0', historyStatusColor(entry.status))}>
                          {entry.status}
                        </span>
                      )}
                      {entry.status === null && (
                        <span className="text-xs text-red-500 flex-shrink-0">ERR</span>
                      )}
                      <span className="text-[10px] text-slate-600 flex-shrink-0">
                        {entry.timestamp.toLocaleTimeString()}
                      </span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* cURL import panel                                                   */}
      {/* ------------------------------------------------------------------ */}
      <AnimatePresence>
        {curlOpen && (
          <motion.div
            key="curl-panel"
            initial={{ opacity: 0, height: 0 }}
            animate={{ opacity: 1, height: 'auto' }}
            exit={{ opacity: 0, height: 0 }}
            transition={{ duration: 0.2 }}
            className="overflow-hidden flex-shrink-0"
          >
            <div className="glass-card p-3 flex flex-col gap-2">
              <div className="flex items-center justify-between">
                <p className="text-xs font-medium text-slate-400 flex items-center gap-1.5">
                  <Terminal size={12} className="text-cyan-400" /> Paste cURL command
                </p>
                <button onClick={() => setCurlOpen(false)} className="text-slate-600 hover:text-slate-300 transition-colors">
                  <X size={14} />
                </button>
              </div>
              <textarea
                value={curlInput}
                onChange={(e) => { setCurlInput(e.target.value); setCurlError(''); }}
                placeholder={`curl -X POST https://api.example.com/users \\\n  -H "Content-Type: application/json" \\\n  -H "Authorization: Bearer token123" \\\n  -d '{"name":"Jane"}'`}
                rows={4}
                spellCheck={false}
                className="w-full bg-slate-800/50 border border-slate-700/40 rounded-md text-xs font-mono text-slate-300 placeholder-slate-600 p-3 resize-none focus:outline-none focus:border-cyan-500/40 transition-colors leading-relaxed"
              />
              {curlError && <p className="text-xs text-red-400">{curlError}</p>}
              <div className="flex items-center gap-2">
                <button
                  onClick={importCurl}
                  disabled={!curlInput.trim()}
                  className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30 text-xs font-medium transition-colors disabled:opacity-40"
                >
                  <Terminal size={12} /> Import
                </button>
                <p className="text-[10px] text-slate-600">Fields will be auto-populated from the cURL command</p>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ------------------------------------------------------------------ */}
      {/* Main body: request + response                                       */}
      {/* ------------------------------------------------------------------ */}
      <div className="flex-1 flex flex-col md:flex-row gap-3 md:gap-4 min-h-0">

        {/* ============================================================== */}
        {/* REQUEST PANEL                                                   */}
        {/* ============================================================== */}
        <div className="flex flex-col gap-3 w-full md:w-[46%] flex-shrink-0 min-h-0">

          {/* URL bar */}
          <div className="glass-card flex items-stretch overflow-hidden flex-shrink-0">
            {/* Method selector */}
            <div className="relative flex-shrink-0">
              <select
                value={method}
                onChange={(e) => setMethod(e.target.value as HttpMethod)}
                className={clsx(
                  'h-full appearance-none text-xs font-bold pl-3 pr-7 py-2.5 border-r border-slate-700/50 bg-transparent focus:outline-none cursor-pointer transition-colors',
                  METHOD_COLORS[method]
                )}
              >
                {METHODS.map((m) => (
                  <option key={m} value={m} className="bg-slate-900 text-slate-200 font-bold">
                    {m}
                  </option>
                ))}
              </select>
              <ChevronDown size={10} className="absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none text-slate-500" />
            </div>

            {/* URL input */}
            <input
              type="text"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              onKeyDown={handleKeyDown}
              placeholder="https://api.example.com/endpoint"
              className="flex-1 min-w-0 bg-transparent font-mono text-xs text-slate-300 placeholder-slate-600 px-3 py-2.5 focus:outline-none"
              spellCheck={false}
            />

            {/* Send button */}
            <button
              onClick={sendRequest}
              disabled={loading || !url.trim()}
              className={clsx(
                'flex items-center gap-1.5 px-4 text-xs font-semibold border-l border-slate-700/50 transition-colors flex-shrink-0',
                'bg-cyan-500/20 border-l-cyan-500/30 text-cyan-300 hover:bg-cyan-500/30',
                'disabled:opacity-40 disabled:cursor-not-allowed'
              )}
            >
              {loading ? <Loader2 size={13} className="animate-spin" /> : <Send size={13} />}
              <span className="hidden sm:inline">{loading ? 'Sending…' : 'Send'}</span>
            </button>
          </div>

          {/* Hint */}
          <p className="text-[10px] text-slate-700 -mt-1 flex-shrink-0">
            Tip: Ctrl+Enter / ⌘+Enter to send
          </p>

          {/* Request tabs */}
          <div className="flex-1 flex flex-col glass-card overflow-hidden min-h-0">
            {/* Tab bar */}
            <div className="flex items-center gap-0.5 px-2 pt-2 border-b border-slate-700/40 flex-shrink-0">
              {(['params', 'headers', 'body', 'auth'] as RequestTab[]).map((t) => {
                if (t === 'body' && !showBodyTab) return null;
                return (
                  <button
                    key={t}
                    onClick={() => setReqTab(t)}
                    className={clsx(
                      'px-3 py-1.5 text-xs font-medium rounded-t-md capitalize transition-colors',
                      reqTab === t
                        ? 'bg-slate-800/80 text-cyan-300 border border-b-0 border-slate-700/50'
                        : 'text-slate-500 hover:text-slate-300'
                    )}
                  >
                    {t}
                    {t === 'params' && params.filter((p) => p.enabled && p.key).length > 0 && (
                      <span className="ml-1 text-[10px] text-cyan-500">
                        {params.filter((p) => p.enabled && p.key).length}
                      </span>
                    )}
                    {t === 'headers' && headers.filter((h) => h.enabled && h.key).length > 0 && (
                      <span className="ml-1 text-[10px] text-cyan-500">
                        {headers.filter((h) => h.enabled && h.key).length}
                      </span>
                    )}
                  </button>
                );
              })}
            </div>

            {/* Tab content */}
            <div className="flex-1 overflow-y-auto p-3 min-h-0">
              <AnimatePresence mode="wait">
                {/* --- Params --- */}
                {reqTab === 'params' && (
                  <motion.div key="params" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                    <p className="text-[10px] text-slate-600 mb-2">
                      Enabled params are appended to the URL as query string.
                    </p>
                    <KVTable
                      rows={params}
                      onChange={setParams}
                      keyPlaceholder="param"
                      valuePlaceholder="value"
                    />
                  </motion.div>
                )}

                {/* --- Headers --- */}
                {reqTab === 'headers' && (
                  <motion.div key="headers" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }}>
                    <p className="text-[10px] text-slate-600 mb-2">
                      Headers to include with the request.
                    </p>
                    <KVTable
                      rows={headers}
                      onChange={setHeaders}
                      keyPlaceholder="Header-Name"
                      valuePlaceholder="value"
                    />
                  </motion.div>
                )}

                {/* --- Body --- */}
                {reqTab === 'body' && showBodyTab && (
                  <motion.div key="body" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="flex flex-col gap-2 h-full">
                    {/* Body type selector */}
                    <div className="flex items-center gap-1">
                      {(['json', 'text', 'form'] as BodyType[]).map((bt) => (
                        <button
                          key={bt}
                          onClick={() => setBodyType(bt)}
                          className={clsx(
                            'text-[10px] px-2.5 py-1 rounded capitalize transition-colors border',
                            bodyType === bt
                              ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                              : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-300'
                          )}
                        >
                          {bt === 'json' ? 'JSON' : bt === 'text' ? 'Text' : 'Form (URL-encoded)'}
                        </button>
                      ))}
                    </div>
                    <textarea
                      value={body}
                      onChange={(e) => setBody(e.target.value)}
                      spellCheck={false}
                      placeholder={
                        bodyType === 'json'
                          ? '{\n  "key": "value"\n}'
                          : bodyType === 'form'
                          ? 'key1=value1\nkey2=value2'
                          : 'Request body text...'
                      }
                      className="flex-1 min-h-[120px] w-full bg-slate-800/40 border border-slate-700/40 rounded-md text-xs font-mono text-slate-300 placeholder-slate-700 p-3 resize-none focus:outline-none focus:border-cyan-500/40 transition-colors leading-relaxed"
                    />
                  </motion.div>
                )}

                {/* --- Auth --- */}
                {reqTab === 'auth' && (
                  <motion.div key="auth" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} transition={{ duration: 0.12 }} className="flex flex-col gap-3">
                    {/* Auth type */}
                    <div className="flex items-center gap-1">
                      {(['none', 'bearer', 'basic'] as AuthType[]).map((at) => (
                        <button
                          key={at}
                          onClick={() => setAuth((a) => ({ ...a, type: at }))}
                          className={clsx(
                            'text-[10px] px-2.5 py-1 rounded capitalize transition-colors border',
                            auth.type === at
                              ? 'bg-cyan-500/20 border-cyan-500/30 text-cyan-300'
                              : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-300'
                          )}
                        >
                          {at === 'none' ? 'No Auth' : at === 'bearer' ? 'Bearer Token' : 'Basic Auth'}
                        </button>
                      ))}
                    </div>

                    <AnimatePresence mode="wait">
                      {auth.type === 'bearer' && (
                        <motion.div key="bearer" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-1.5">
                          <label className="text-[10px] text-slate-500 flex items-center gap-1">
                            <Lock size={10} /> Token
                          </label>
                          <input
                            type="text"
                            value={auth.token}
                            onChange={(e) => setAuth((a) => ({ ...a, token: e.target.value }))}
                            placeholder="eyJhbGciOiJIUzI1NiJ9..."
                            className="w-full bg-slate-800/50 border border-slate-700/40 rounded px-3 py-2 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
                          />
                          {auth.token && (
                            <p className="text-[10px] text-slate-600 font-mono truncate">
                              Authorization: Bearer {auth.token.slice(0, 30)}{auth.token.length > 30 ? '…' : ''}
                            </p>
                          )}
                        </motion.div>
                      )}

                      {auth.type === 'basic' && (
                        <motion.div key="basic" initial={{ opacity: 0, y: 4 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} className="flex flex-col gap-2">
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-slate-500">Username</label>
                            <input
                              type="text"
                              value={auth.username}
                              onChange={(e) => setAuth((a) => ({ ...a, username: e.target.value }))}
                              placeholder="username"
                              className="w-full bg-slate-800/50 border border-slate-700/40 rounded px-3 py-2 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
                            />
                          </div>
                          <div className="flex flex-col gap-1.5">
                            <label className="text-[10px] text-slate-500">Password</label>
                            <input
                              type="password"
                              value={auth.password}
                              onChange={(e) => setAuth((a) => ({ ...a, password: e.target.value }))}
                              placeholder="••••••••"
                              className="w-full bg-slate-800/50 border border-slate-700/40 rounded px-3 py-2 text-xs font-mono text-slate-300 placeholder-slate-600 focus:outline-none focus:border-cyan-500/40 transition-colors"
                            />
                          </div>
                        </motion.div>
                      )}

                      {auth.type === 'none' && (
                        <motion.p key="none" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="text-xs text-slate-600">
                          No authentication will be added to this request.
                        </motion.p>
                      )}
                    </AnimatePresence>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </div>
        </div>

        {/* ============================================================== */}
        {/* RESPONSE PANEL                                                  */}
        {/* ============================================================== */}
        <div className="flex-1 flex flex-col glass-card overflow-hidden min-h-[300px] md:min-h-0">
          <AnimatePresence mode="wait">

            {/* Loading */}
            {loading && (
              <motion.div key="loading" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
                <Loader2 size={28} className="text-cyan-400 animate-spin" />
                <p className="text-sm text-slate-500">Sending request…</p>
              </motion.div>
            )}

            {/* Error */}
            {!loading && responseError && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col p-4 gap-3">
                <div className="flex items-start gap-3 p-4 rounded-lg bg-red-500/10 border border-red-500/20">
                  <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                  <div>
                    <p className="text-sm font-semibold text-red-300 mb-1">Request Failed</p>
                    <p className="text-xs text-red-400/80 leading-relaxed">{responseError}</p>
                  </div>
                </div>
              </motion.div>
            )}

            {/* Response data */}
            {!loading && response && (
              <motion.div key="response" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col min-h-0">
                {/* Status bar */}
                <div className="flex items-center gap-3 px-3 py-2 border-b border-slate-700/40 flex-wrap gap-y-1.5 flex-shrink-0">
                  <span className={clsx('text-xs font-bold px-2.5 py-0.5 rounded-full border', statusColor(response.status))}>
                    {response.status} {response.statusText}
                  </span>
                  <span className="text-xs text-slate-500 flex items-center gap-1">
                    <Clock size={11} className="text-slate-600" />
                    {response.timeMs} ms
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatBytes(response.sizeBytes)}
                  </span>
                  <div className="ml-auto flex items-center gap-0.5">
                    {(['body', 'headers', 'preview'] as ResponseTab[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setResTab(t)}
                        className={clsx(
                          'px-3 py-1 text-xs capitalize rounded-md transition-colors flex items-center gap-1',
                          resTab === t
                            ? 'bg-cyan-500/20 border border-cyan-500/30 text-cyan-300'
                            : 'text-slate-500 hover:text-slate-300'
                        )}
                      >
                        {t === 'preview' && <Eye size={10} />}{t}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Body tab */}
                {resTab === 'body' && (
                  <div className="flex-1 flex flex-col min-h-0">
                    <div className="flex items-center justify-between px-3 py-1.5 border-b border-slate-700/30 flex-shrink-0">
                      <div className="flex items-center gap-1.5">
                        <FileJson size={12} className={response.isJson ? 'text-yellow-400' : 'text-slate-600'} />
                        <span className="text-[10px] text-slate-500">
                          {response.isJson ? 'JSON' : 'Plain Text'}
                        </span>
                      </div>
                      <button
                        onClick={copyBody}
                        className={clsx(
                          'flex items-center gap-1 text-xs transition-colors',
                          bodyCopied ? 'text-green-400' : 'text-slate-600 hover:text-slate-300'
                        )}
                      >
                        {bodyCopied ? <Check size={11} /> : <Copy size={11} />}
                        {bodyCopied ? 'Copied!' : 'Copy'}
                      </button>
                    </div>
                    <pre className="flex-1 overflow-auto p-3 text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap break-all">
                      {response.body || '(empty body)'}
                    </pre>
                  </div>
                )}

                {/* Headers tab */}
                {resTab === 'headers' && (
                  <div className="flex-1 overflow-y-auto p-3 min-h-0">
                    {Object.entries(response.headers).length === 0 ? (
                      <p className="text-xs text-slate-600">No response headers.</p>
                    ) : (
                      <div className="flex flex-col gap-1">
                        {Object.entries(response.headers).map(([k, v]) => (
                          <div key={k} className="flex items-start gap-2 py-1 border-b border-slate-800/50 last:border-0">
                            <span className="text-xs font-mono text-cyan-400/80 flex-shrink-0 w-48 truncate">{k}</span>
                            <span className="text-xs font-mono text-slate-400 break-all">{v}</span>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

                {/* Preview tab */}
                {resTab === 'preview' && (
                  <div className="flex-1 flex flex-col min-h-0">
                    {response.isJson ? (
                      <div className="flex-1 overflow-auto p-3">
                        <pre className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap break-all">
                          {response.body}
                        </pre>
                      </div>
                    ) : (
                      <iframe
                        srcDoc={response.body}
                        sandbox="allow-scripts"
                        className="flex-1 w-full border-0 bg-white rounded-b-lg"
                        title="Response Preview"
                      />
                    )}
                  </div>
                )}
              </motion.div>
            )}

            {/* Idle / empty state */}
            {!loading && !response && !responseError && (
              <motion.div key="idle" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="flex-1 flex flex-col items-center justify-center gap-3 p-8">
                <Send size={30} className="text-slate-700" />
                <div className="text-center">
                  <p className="text-sm text-slate-600 mb-1">No response yet</p>
                  <p className="text-xs text-slate-700">Configure your request and click Send</p>
                </div>
              </motion.div>
            )}

          </AnimatePresence>
        </div>
      </div>
    </ToolShell>
  );
}
