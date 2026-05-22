import { useState } from 'react';
import { Search, Command, Menu, Eye, Users2 } from 'lucide-react';
import { useVisitorCount } from '../../hooks/useVisitorCount';
import { VisitorModal } from './VisitorModal';
import { ContributorsModal } from './ContributorsModal';

interface TopbarProps {
  title?: string;
  subtitle?: string;
  onSearchClick?: () => void;
  onMenuClick?: () => void;
}

export function Topbar({ title, subtitle, onSearchClick, onMenuClick }: TopbarProps) {
  const visitorCount = useVisitorCount();
  const [visitorModalOpen, setVisitorModalOpen] = useState(false);
  const [contributorsOpen, setContributorsOpen] = useState(false);

  const apiFailed = !visitorCount.loading && visitorCount.count === null;

  return (
    <>
      <header className="h-14 flex items-center justify-between px-4 border-b border-slate-700/50 bg-slate-900/40 backdrop-blur-sm flex-shrink-0 gap-3">
        <div className="flex items-center gap-3 min-w-0">
          {/* Hamburger — mobile only */}
          <button
            onClick={onMenuClick}
            className="md:hidden flex-shrink-0 p-1.5 rounded-lg text-slate-400 hover:text-slate-200 hover:bg-slate-800/60 transition-colors"
          >
            <Menu size={18} />
          </button>
          <div className="min-w-0">
            {title && <h1 className="text-sm font-semibold text-white truncate">{title}</h1>}
            {subtitle && <p className="text-xs text-slate-500 truncate hidden sm:block">{subtitle}</p>}
          </div>
        </div>

        <div className="flex items-center gap-2 flex-shrink-0">

          {/* Contributors button — always visible, text hidden on mobile */}
          <button
            onClick={() => setContributorsOpen(true)}
            className="flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 hover:border-slate-600/70 text-xs transition-colors"
          >
            <Users2 size={13} />
            <span className="hidden sm:inline">Contributors</span>
          </button>

          {/* Visitor count — always visible, clickable only on API failure */}
          <button
            onClick={() => { if (apiFailed) setVisitorModalOpen(true); }}
            className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 text-xs transition-colors ${
              apiFailed ? 'hover:border-blue-500/40 hover:text-slate-200 cursor-pointer' : 'cursor-default'
            }`}
          >
            <Eye size={13} />
            {visitorCount.loading ? (
              <span className="hidden sm:inline w-8 h-3 rounded bg-slate-700 animate-pulse" />
            ) : visitorCount.count !== null ? (
              <span className="hidden sm:inline">
                <span className="text-slate-200 font-medium">{visitorCount.count.toLocaleString()}</span>
                <span className="text-slate-500 ml-1">visitors</span>
              </span>
            ) : (
              <span className="hidden sm:inline text-slate-400">100+ users</span>
            )}
          </button>

          {/* Search */}
          <button
            onClick={onSearchClick}
            className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 text-xs transition-colors"
          >
            <Search size={13} />
            <span className="hidden sm:inline">Search tools...</span>
            <kbd className="hidden sm:flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 text-xs">
              <Command size={9} />K
            </kbd>
          </button>
        </div>
      </header>

      <VisitorModal
        open={visitorModalOpen}
        count={visitorCount.count}
        onClose={() => setVisitorModalOpen(false)}
      />
      <ContributorsModal
        open={contributorsOpen}
        onClose={() => setContributorsOpen(false)}
      />
    </>
  );
}
