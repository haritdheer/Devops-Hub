import { Search, Command, Menu } from 'lucide-react';

interface TopbarProps {
  title?: string;
  subtitle?: string;
  onSearchClick?: () => void;
  onMenuClick?: () => void;
}

export function Topbar({ title, subtitle, onSearchClick, onMenuClick }: TopbarProps) {
  return (
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
  );
}
