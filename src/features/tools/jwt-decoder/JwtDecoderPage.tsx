import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Key, CheckCircle2, XCircle, Clock, Copy, RotateCcw,
  AlertTriangle, Shield, User, Calendar, Hash, Globe,
} from 'lucide-react';
import { clsx } from 'clsx';
import { parseJwt, type JwtParseResult } from '../../../lib/parsers/jwt';

const STORAGE_KEY = 'tool_jwt_decoder';

// A sample JWT (header.payload.signature format, decoded payload has exp far in future)
// header: {"alg":"HS256","typ":"JWT"}
// payload: {"sub":"user_123","name":"Jane Smith","email":"jane@example.com","roles":["admin","editor"],"iss":"https://auth.example.com","iat":1700000000,"exp":9999999999}
const SAMPLE_JWT =
  'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiJ1c2VyXzEyMyIsIm5hbWUiOiJKYW5lIFNtaXRoIiwiZW1haWwiOiJqYW5lQGV4YW1wbGUuY29tIiwicm9sZXMiOlsiYWRtaW4iLCJlZGl0b3IiXSwiaXNzIjoiaHR0cHM6Ly9hdXRoLmV4YW1wbGUuY29tIiwiaWF0IjoxNzAwMDAwMDAwLCJleHAiOjk5OTk5OTk5OTl9.SflKxwRJSMeKKF2QT4fwpMeJf36POk6yJV_adQssw5c';

function formatTimestamp(ts: number): string {
  return new Date(ts * 1000).toLocaleString();
}

function StatusBadge({ status }: { status: JwtParseResult['status'] }) {
  const config = {
    active: { color: 'bg-green-500/15 border-green-500/25 text-green-400', icon: CheckCircle2, label: 'Active' },
    expired: { color: 'bg-red-500/15 border-red-500/25 text-red-400', icon: XCircle, label: 'Expired' },
    'not-yet-valid': { color: 'bg-yellow-500/15 border-yellow-500/25 text-yellow-400', icon: Clock, label: 'Not Yet Valid' },
    'no-expiry': { color: 'bg-slate-700/60 border-slate-700/50 text-slate-400', icon: Shield, label: 'No Expiry' },
  };
  if (!status) return null;
  const { color, icon: Icon, label } = config[status];
  return (
    <div className={clsx('flex items-center gap-1.5 px-2.5 py-1 rounded-full border text-xs font-semibold', color)}>
      <Icon size={12} /> {label}
    </div>
  );
}

function JsonDisplay({ data }: { data: unknown }) {
  return (
    <pre className="text-xs font-mono text-slate-300 leading-relaxed whitespace-pre-wrap overflow-auto">
      {JSON.stringify(data, null, 2)}
    </pre>
  );
}

const CLAIM_LABELS: Record<string, { label: string; icon: React.ComponentType<{ size?: number; className?: string }>; description: string }> = {
  sub: { label: 'Subject', icon: User, description: 'Identifies the principal of the JWT' },
  iss: { label: 'Issuer', icon: Globe, description: 'Identifies who issued the JWT' },
  exp: { label: 'Expires At', icon: Clock, description: 'Time after which the JWT is invalid' },
  iat: { label: 'Issued At', icon: Calendar, description: 'Time at which the JWT was issued' },
  nbf: { label: 'Not Before', icon: Clock, description: 'Time before which the JWT is invalid' },
  jti: { label: 'JWT ID', icon: Hash, description: 'Unique identifier for the JWT' },
  aud: { label: 'Audience', icon: Globe, description: 'Recipients the JWT is intended for' },
};

export function JwtDecoderPage() {
  const [input, setInput] = useState(() => localStorage.getItem(STORAGE_KEY) || SAMPLE_JWT);
  const [result, setResult] = useState(() => parseJwt(localStorage.getItem(STORAGE_KEY) || SAMPLE_JWT));
  const [copied, setCopied] = useState<string | null>(null);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, input); }, [input]);

  const handleInput = (val: string) => { setInput(val); setResult(parseJwt(val)); };

  const copy = (text: string, key: string) => {
    navigator.clipboard.writeText(text);
    setCopied(key);
    setTimeout(() => setCopied(null), 1500);
  };

  const parts = input.trim().split('.');
  const hasParts = parts.length === 3;

  return (
    <div className="p-6 space-y-5 max-w-5xl mx-auto">
      {/* Input */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-3 border-b border-slate-700/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Key size={14} className="text-purple-400" />
            <span className="text-xs font-semibold text-slate-300">JWT Token</span>
          </div>
          <div className="flex items-center gap-2">
            <button
              onClick={() => handleInput(SAMPLE_JWT)}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors px-2 py-1 rounded bg-slate-800/60"
            >
              Load Sample
            </button>
            <button
              onClick={() => handleInput('')}
              className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
            >
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
        <div className="p-4">
          <textarea
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            spellCheck={false}
            rows={4}
            className="w-full bg-slate-950/60 text-slate-200 text-xs font-mono p-3 rounded-lg resize-none outline-none leading-relaxed border border-slate-700/40 focus:border-purple-500/40 transition-colors"
            placeholder="Paste your JWT token here..."
          />
          {/* Color-coded parts */}
          {hasParts && (
            <div className="mt-3 p-3 bg-slate-950/40 rounded-lg text-xs font-mono leading-relaxed break-all">
              <span className="text-cyan-400">{parts[0]}</span>
              <span className="text-slate-600">.</span>
              <span className="text-violet-400">{parts[1]}</span>
              <span className="text-slate-600">.</span>
              <span className="text-slate-500">{parts[2]}</span>
            </div>
          )}
        </div>
      </div>

      <AnimatePresence mode="wait">
        {result.valid && result.header && result.payload && (
          <motion.div key="valid" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} className="space-y-4">
            {/* Status row */}
            <div className="flex flex-wrap items-center gap-3">
              <StatusBadge status={result.status} />
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/50 text-slate-400 text-xs">
                <Shield size={11} /> {result.header.alg}
              </div>
              {result.expiresIn && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Clock size={11} /> {result.expiresIn}
                </div>
              )}
              {result.issuedAgo && (
                <div className="flex items-center gap-1.5 text-xs text-slate-500">
                  <Calendar size={11} /> {result.issuedAgo}
                </div>
              )}
            </div>

            {/* Three panels */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              {/* Header */}
              <div className="glass-card overflow-hidden">
                <div className="px-3 py-2.5 border-b border-slate-700/40 flex items-center justify-between">
                  <span className="text-xs font-semibold text-cyan-400">Header</span>
                  <button onClick={() => copy(JSON.stringify(result.header, null, 2), 'header')} className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1">
                    <Copy size={11} /> {copied === 'header' ? 'Copied' : ''}
                  </button>
                </div>
                <div className="p-3">
                  <JsonDisplay data={result.header} />
                </div>
              </div>

              {/* Payload */}
              <div className="glass-card overflow-hidden">
                <div className="px-3 py-2.5 border-b border-slate-700/40 flex items-center justify-between">
                  <span className="text-xs font-semibold text-violet-400">Payload</span>
                  <button onClick={() => copy(JSON.stringify(result.payload, null, 2), 'payload')} className="text-xs text-slate-600 hover:text-slate-400 flex items-center gap-1">
                    <Copy size={11} /> {copied === 'payload' ? 'Copied' : ''}
                  </button>
                </div>
                <div className="p-3">
                  <JsonDisplay data={result.payload} />
                </div>
              </div>

              {/* Signature */}
              <div className="glass-card overflow-hidden">
                <div className="px-3 py-2.5 border-b border-slate-700/40">
                  <span className="text-xs font-semibold text-slate-400">Signature</span>
                </div>
                <div className="p-3">
                  <p className="text-xs font-mono text-slate-500 break-all leading-relaxed">{result.signature}</p>
                  <p className="text-xs text-slate-700 mt-3">Signature verification requires the secret key on the server side.</p>
                </div>
              </div>
            </div>

            {/* Claims detail */}
            <div className="glass-card overflow-hidden">
              <div className="px-4 py-3 border-b border-slate-700/40">
                <span className="text-xs font-semibold text-slate-300">Decoded Claims</span>
              </div>
              <div className="divide-y divide-slate-700/30">
                {Object.entries(result.payload).map(([key, value]) => {
                  const meta = CLAIM_LABELS[key];
                  const isTimestamp = (key === 'exp' || key === 'iat' || key === 'nbf') && typeof value === 'number';
                  return (
                    <div key={key} className="px-4 py-3 flex items-start gap-4">
                      <div className="w-28 flex-shrink-0">
                        <p className="text-xs font-mono text-cyan-400/80">{key}</p>
                        {meta && <p className="text-xs text-slate-600">{meta.label}</p>}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-mono text-slate-300 break-all">
                          {isTimestamp
                            ? formatTimestamp(value as number)
                            : typeof value === 'object'
                            ? JSON.stringify(value)
                            : String(value)}
                        </p>
                        {meta && <p className="text-xs text-slate-600 mt-0.5">{meta.description}</p>}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </motion.div>
        )}

        {!result.valid && input.trim() && (
          <motion.div key="invalid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="glass-card border-red-500/20 bg-red-500/5 p-5">
            <div className="flex items-start gap-3">
              <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
              <div>
                <p className="text-sm font-semibold text-red-300 mb-1">Invalid Token</p>
                <p className="text-xs text-red-400/80">{result.error}</p>
              </div>
            </div>
          </motion.div>
        )}

        {!input.trim() && (
          <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-16">
            <Key size={32} className="mx-auto text-slate-700 mb-3" />
            <p className="text-sm text-slate-600">Paste a JWT token above to decode it</p>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
