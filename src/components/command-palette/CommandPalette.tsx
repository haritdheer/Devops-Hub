import { useState, useEffect, useRef, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Search, ArrowRight } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { clsx } from 'clsx';
import { toolRegistry } from '../../plugins/registry';

// Map icon names to simple emoji/symbol fallbacks since we can't dynamically import Lucide in this context
const CATEGORY_COLORS: Record<string, string> = {
  validation: 'text-green-400',
  inspection: 'text-cyan-400',
  analysis: 'text-blue-400',
  conversion: 'text-orange-400',
};

interface CommandPaletteProps {
  open: boolean;
  onClose: () => void;
}

export function CommandPalette({ open, onClose }: CommandPaletteProps) {
  const [query, setQuery] = useState('');
  const [selected, setSelected] = useState(0);
  const navigate = useNavigate();
  const inputRef = useRef<HTMLInputElement>(null);

  const results = toolRegistry.filter((tool) => {
    if (!query) return true;
    const q = query.toLowerCase();
    return (
      tool.name.toLowerCase().includes(q) ||
      tool.description.toLowerCase().includes(q) ||
      tool.tags.some((t) => t.includes(q)) ||
      tool.category.includes(q)
    );
  });

  useEffect(() => {
    if (open) {
      setQuery('');
      setSelected(0);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  }, [open]);

  useEffect(() => {
    setSelected(0);
  }, [query]);

  const go = useCallback((route: string) => {
    navigate(route);
    onClose();
  }, [navigate, onClose]);

  useEffect(() => {
    if (!open) return;
    const handler = (e: KeyboardEvent) => {
      if (e.key === 'Escape') { onClose(); return; }
      if (e.key === 'ArrowDown') { e.preventDefault(); setSelected((s) => Math.min(s + 1, results.length - 1)); }
      if (e.key === 'ArrowUp') { e.preventDefault(); setSelected((s) => Math.max(s - 1, 0)); }
      if (e.key === 'Enter' && results[selected]) go(results[selected].route);
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, [open, results, selected, onClose, go]);

  return (
    <AnimatePresence>
      {open && (
        <>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50"
          />
          <div className="fixed inset-0 flex items-start justify-center pt-24 px-4 z-50 pointer-events-none">
            <motion.div
              initial={{ opacity: 0, scale: 0.96, y: -10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.96, y: -10 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg bg-slate-900 border border-slate-700/60 rounded-2xl shadow-2xl overflow-hidden pointer-events-auto"
            >
              {/* Search input */}
              <div className="flex items-center gap-3 px-4 py-3.5 border-b border-slate-700/50">
                <Search size={15} className="text-slate-500 flex-shrink-0" />
                <input
                  ref={inputRef}
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search tools..."
                  className="flex-1 bg-transparent text-sm text-white placeholder-slate-500 outline-none"
                />
                <kbd className="text-xs px-1.5 py-0.5 rounded bg-slate-800 border border-slate-700 text-slate-500">ESC</kbd>
              </div>

              {/* Results */}
              <div className="max-h-80 overflow-auto py-2">
                {results.length === 0 ? (
                  <p className="text-center text-xs text-slate-600 py-8">No tools found</p>
                ) : (
                  results.map((tool, i) => (
                    <button
                      key={tool.id}
                      onClick={() => go(tool.route)}
                      onMouseEnter={() => setSelected(i)}
                      className={clsx(
                        'w-full flex items-center gap-3 px-4 py-2.5 text-left transition-colors',
                        i === selected ? 'bg-slate-800/60' : 'hover:bg-slate-800/30'
                      )}
                    >
                      <div className={clsx('w-7 h-7 rounded-lg flex items-center justify-center flex-shrink-0 text-xs font-bold', CATEGORY_COLORS[tool.category], 'bg-slate-800 border border-slate-700/50')}>
                        {tool.name.charAt(0)}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm text-white">{tool.name}</p>
                        <p className="text-xs text-slate-500 truncate">{tool.description}</p>
                      </div>
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <span className="text-xs text-slate-600 capitalize">{tool.category}</span>
                        {i === selected && <ArrowRight size={12} className="text-slate-500" />}
                      </div>
                    </button>
                  ))
                )}
              </div>

              {/* Footer */}
              <div className="px-4 py-2.5 border-t border-slate-700/50 flex items-center gap-4 text-xs text-slate-600">
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700">↑↓</kbd> navigate</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700">↵</kbd> open</span>
                <span className="flex items-center gap-1"><kbd className="px-1 py-0.5 rounded bg-slate-800 border border-slate-700">esc</kbd> close</span>
                <span className="ml-auto">{results.length} tools</span>
              </div>
            </motion.div>
          </div>
        </>
      )}
    </AnimatePresence>
  );
}
