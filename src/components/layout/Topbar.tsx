import { Search, Command } from 'lucide-react';

interface TopbarProps {
  title?: string;
  subtitle?: string;
  onSearchClick?: () => void;
}

export function Topbar({ title, subtitle, onSearchClick }: TopbarProps) {
  return (
    <header className="h-14 flex items-center justify-between px-6 border-b border-slate-700/50 bg-slate-900/40 backdrop-blur-sm flex-shrink-0">
      <div>
        {title && <h1 className="text-sm font-semibold text-white">{title}</h1>}
        {subtitle && <p className="text-xs text-slate-500">{subtitle}</p>}
      </div>
      <div className="flex items-center gap-2">
        <button onClick={onSearchClick} className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 hover:text-slate-200 text-xs transition-colors">
          <Search size={13} />
          <span>Search tools...</span>
          <kbd className="flex items-center gap-0.5 px-1.5 py-0.5 rounded bg-slate-700 text-slate-400 text-xs">
            <Command size={9} />K
          </kbd>
        </button>
      </div>
    </header>
  );
}
