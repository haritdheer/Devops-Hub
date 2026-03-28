import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Copy, RotateCcw, ArrowDown, AlertTriangle, CheckCircle2 } from 'lucide-react';
import { clsx } from 'clsx';

function encodeBase64(text: string): string {
  try {
    return btoa(unescape(encodeURIComponent(text)));
  } catch {
    return btoa(text);
  }
}

function decodeBase64(b64: string): { result: string; error?: string } {
  try {
    const decoded = decodeURIComponent(escape(atob(b64.trim())));
    return { result: decoded };
  } catch {
    try {
      return { result: atob(b64.trim()) };
    } catch {
      return { result: '', error: 'Invalid Base64 string' };
    }
  }
}

export function Base64ToolPage() {
  const [mode, setMode] = useState<'encode' | 'decode'>('encode');
  const [input, setInput] = useState('');
  const [copied, setCopied] = useState(false);

  const encoded = mode === 'encode' ? (input ? encodeBase64(input) : '') : input;
  const decodeResult = mode === 'decode' ? decodeBase64(input) : null;
  const output = mode === 'encode' ? encoded : (decodeResult?.result || '');
  const hasError = mode === 'decode' && input.trim() && decodeResult?.error;

  const copy = () => {
    if (output) {
      navigator.clipboard.writeText(output);
      setCopied(true);
      setTimeout(() => setCopied(false), 1500);
    }
  };

  const swapAndFlip = () => {
    if (output && !hasError) {
      setInput(output);
      setMode(mode === 'encode' ? 'decode' : 'encode');
    }
  };

  return (
    <div className="p-6 max-w-3xl mx-auto space-y-5">
      {/* Mode tabs */}
      <div className="flex gap-1 p-1 bg-slate-800/60 rounded-xl w-fit border border-slate-700/40">
        {(['encode', 'decode'] as const).map((m) => (
          <button
            key={m}
            onClick={() => { setMode(m); setInput(''); }}
            className={clsx(
              'px-5 py-2 rounded-lg text-sm font-medium transition-all capitalize',
              mode === m
                ? 'bg-orange-500/20 border border-orange-500/30 text-orange-300'
                : 'text-slate-500 hover:text-slate-300'
            )}
          >
            {m}
          </button>
        ))}
      </div>

      {/* Input */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center justify-between">
          <span className="text-xs font-medium text-slate-400">
            {mode === 'encode' ? 'Plain Text' : 'Base64 String'}
          </span>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600">{input.length} chars</span>
            <button onClick={() => setInput('')} className="text-xs text-slate-600 hover:text-slate-400 transition-colors">
              <RotateCcw size={12} />
            </button>
          </div>
        </div>
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          rows={6}
          spellCheck={false}
          className="w-full bg-slate-950/40 text-slate-200 text-sm font-mono p-4 resize-none outline-none leading-relaxed"
          placeholder={mode === 'encode' ? 'Enter text to encode...' : 'Enter Base64 string to decode...'}
        />
      </div>

      {/* Arrow + Swap */}
      <div className="flex items-center justify-center gap-3">
        <div className="flex-1 h-px bg-slate-700/40" />
        <button
          onClick={swapAndFlip}
          title="Use output as input (flip mode)"
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-orange-500/10 border border-orange-500/20 text-orange-400/60 hover:text-orange-300 hover:bg-orange-500/20 transition-all text-xs"
        >
          <ArrowDown size={14} />
          <span>{mode === 'encode' ? 'Encoded ↓' : 'Decoded ↓'}</span>
        </button>
        <div className="flex-1 h-px bg-slate-700/40" />
      </div>

      {/* Output */}
      <div className="glass-card overflow-hidden">
        <div className="px-4 py-2.5 border-b border-slate-700/40 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="text-xs font-medium text-slate-400">
              {mode === 'encode' ? 'Base64 Output' : 'Decoded Text'}
            </span>
            {mode === 'decode' && input.trim() && !hasError && (
              <div className="flex items-center gap-1 text-xs text-green-400">
                <CheckCircle2 size={11} /> Valid
              </div>
            )}
          </div>
          <div className="flex items-center gap-3">
            <span className="text-xs text-slate-600">{output.length} chars</span>
            <button
              onClick={copy}
              disabled={!output}
              className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors disabled:opacity-40"
            >
              <Copy size={11} /> {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
        </div>

        <AnimatePresence mode="wait">
          {hasError ? (
            <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4">
              <div className="flex items-center gap-2 text-red-400">
                <AlertTriangle size={14} />
                <p className="text-sm">{decodeResult?.error}</p>
              </div>
            </motion.div>
          ) : (
            <motion.div key="output" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
              <textarea
                value={output}
                readOnly
                rows={6}
                className="w-full bg-slate-950/20 text-slate-300 text-sm font-mono p-4 resize-none outline-none leading-relaxed"
                placeholder={mode === 'encode' ? 'Base64 output will appear here...' : 'Decoded text will appear here...'}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Info card */}
      <div className="glass-card p-4 text-xs text-slate-500 leading-relaxed">
        <p className="font-medium text-slate-400 mb-1">About Base64</p>
        <p>Base64 encoding converts binary data to ASCII text using 64 characters (A-Z, a-z, 0-9, +, /). It's commonly used in JWTs, data URLs, email attachments, and API responses.</p>
      </div>
    </div>
  );
}
