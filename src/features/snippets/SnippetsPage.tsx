import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Bookmark, Trash2, Search, Clock, Tag, FileCode2, Braces, Key, Binary, Container, Layers, GitCompare, ScrollText, ArrowLeftRight } from 'lucide-react';
import { Link } from 'react-router-dom';
import { clsx } from 'clsx';
import { toolRegistry } from '../../plugins/registry';

const ICON_MAP: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  FileCode2, Braces, Key, Binary, Container, Layers, GitCompare, ScrollText, ArrowLeftRight,
};

interface Snippet {
  id: string;
  toolId: string;
  label: string;
  content: string;
  savedAt: number;
}

function getStoredSnippets(): Snippet[] {
  try {
    return JSON.parse(localStorage.getItem('devops_hub_snippets') || '[]');
  } catch {
    return [];
  }
}

function deleteSnippet(id: string) {
  const all = getStoredSnippets().filter((s) => s.id !== id);
  localStorage.setItem('devops_hub_snippets', JSON.stringify(all));
}

function formatAge(ts: number) {
  const diff = Date.now() - ts;
  const m = Math.floor(diff / 60000);
  const h = Math.floor(diff / 3600000);
  const d = Math.floor(diff / 86400000);
  if (d > 0) return `${d}d ago`;
  if (h > 0) return `${h}h ago`;
  if (m > 0) return `${m}m ago`;
  return 'just now';
}

export function SnippetsPage() {
  const [snippets, setSnippets] = useState<Snippet[]>(getStoredSnippets);
  const [search, setSearch] = useState('');
  const [filterTool, setFilterTool] = useState<string>('all');

  const toolsWithSnippets = useMemo(() => {
    const ids = new Set(snippets.map((s) => s.toolId));
    return toolRegistry.filter((t) => ids.has(t.id));
  }, [snippets]);

  const filtered = useMemo(() => {
    return snippets.filter((s) => {
      if (filterTool !== 'all' && s.toolId !== filterTool) return false;
      if (search && !s.label.toLowerCase().includes(search.toLowerCase()) && !s.content.toLowerCase().includes(search.toLowerCase())) return false;
      return true;
    });
  }, [snippets, filterTool, search]);

  const handleDelete = (id: string) => {
    deleteSnippet(id);
    setSnippets(getStoredSnippets());
  };

  return (
    <div className="p-6 space-y-6 max-w-5xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-lg font-semibold text-white">Saved Snippets</h2>
          <p className="text-xs text-slate-500 mt-0.5">{snippets.length} saved item{snippets.length !== 1 ? 's' : ''}</p>
        </div>
      </div>

      {snippets.length === 0 ? (
        /* Empty state */
        <motion.div
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          className="flex flex-col items-center justify-center py-24 text-center"
        >
          <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mb-5">
            <Bookmark size={24} className="text-slate-600" />
          </div>
          <h3 className="text-base font-semibold text-slate-400 mb-2">No saved snippets yet</h3>
          <p className="text-sm text-slate-600 max-w-xs leading-relaxed">
            Use any tool and save your inputs as snippets for quick access later.
          </p>
          <div className="flex flex-wrap gap-2 mt-6 justify-center">
            {toolRegistry.slice(0, 4).map((tool) => (
              <Link
                key={tool.id}
                to={tool.route}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-400 hover:text-slate-200 text-xs transition-colors"
              >
                {tool.name}
              </Link>
            ))}
          </div>
        </motion.div>
      ) : (
        <>
          {/* Filters */}
          <div className="flex items-center gap-3 flex-wrap">
            <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 rounded-lg px-3 py-1.5">
              <Search size={12} className="text-slate-500" />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search snippets..."
                className="bg-transparent text-xs text-slate-300 placeholder-slate-600 outline-none w-40"
              />
            </div>

            <div className="flex items-center gap-1 flex-wrap">
              <button
                onClick={() => setFilterTool('all')}
                className={clsx(
                  'text-xs px-3 py-1.5 rounded-lg border transition-colors',
                  filterTool === 'all'
                    ? 'bg-slate-700 border-slate-600 text-white'
                    : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-300'
                )}
              >
                All
              </button>
              {toolsWithSnippets.map((tool) => {
                const Icon = ICON_MAP[tool.icon];
                return (
                  <button
                    key={tool.id}
                    onClick={() => setFilterTool(tool.id)}
                    className={clsx(
                      'flex items-center gap-1 text-xs px-3 py-1.5 rounded-lg border transition-colors',
                      filterTool === tool.id
                        ? 'bg-slate-700 border-slate-600 text-white'
                        : 'bg-slate-800/40 border-slate-700/40 text-slate-500 hover:text-slate-300'
                    )}
                  >
                    {Icon && <Icon size={11} className={tool.color} />}
                    {tool.name}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Snippets grid */}
          <AnimatePresence>
            {filtered.length === 0 ? (
              <motion.p
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="text-sm text-slate-600 text-center py-12"
              >
                No snippets match your search
              </motion.p>
            ) : (
              <motion.div
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                className="grid grid-cols-1 md:grid-cols-2 gap-4"
              >
                {filtered.map((snippet) => {
                  const tool = toolRegistry.find((t) => t.id === snippet.toolId);
                  const Icon = tool ? ICON_MAP[tool.icon] : null;
                  return (
                    <motion.div
                      key={snippet.id}
                      layout
                      initial={{ opacity: 0, scale: 0.97 }}
                      animate={{ opacity: 1, scale: 1 }}
                      exit={{ opacity: 0, scale: 0.97 }}
                      className="glass-card p-4 group"
                    >
                      <div className="flex items-start justify-between gap-2 mb-3">
                        <div className="flex items-center gap-2 min-w-0">
                          {Icon && tool && <Icon size={14} className={tool.color} />}
                          <p className="text-sm font-medium text-white truncate">{snippet.label}</p>
                        </div>
                        <button
                          onClick={() => handleDelete(snippet.id)}
                          className="flex-shrink-0 opacity-0 group-hover:opacity-100 p-1 rounded text-slate-600 hover:text-red-400 transition-all"
                        >
                          <Trash2 size={13} />
                        </button>
                      </div>

                      <pre className="text-xs font-mono text-slate-500 leading-relaxed bg-slate-950/40 rounded-lg p-3 overflow-hidden max-h-20 whitespace-pre-wrap">
                        {snippet.content.slice(0, 200)}{snippet.content.length > 200 ? '…' : ''}
                      </pre>

                      <div className="flex items-center justify-between mt-3">
                        <div className="flex items-center gap-2 text-xs text-slate-600">
                          <Clock size={10} />
                          {formatAge(snippet.savedAt)}
                        </div>
                        {tool && (
                          <Link
                            to={tool.route}
                            className="flex items-center gap-1 text-xs text-slate-500 hover:text-cyan-400 transition-colors"
                          >
                            <Tag size={10} /> {tool.name}
                          </Link>
                        )}
                      </div>
                    </motion.div>
                  );
                })}
              </motion.div>
            )}
          </AnimatePresence>
        </>
      )}
    </div>
  );
}
