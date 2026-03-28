import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { toolRegistry } from '../../plugins/registry';
import { CommandPalette } from '../command-palette/CommandPalette';

function getTitleFromPath(pathname: string) {
  if (pathname === '/') return { title: 'Dashboard', subtitle: 'DevOps Utility Hub' };
  const tool = toolRegistry.find((t) => t.route === pathname);
  if (tool) return { title: tool.name, subtitle: tool.description };
  return { title: 'DevOps Hub', subtitle: '' };
}

function scrollToTeam() {
  document.getElementById('blitzkrieg-team')?.scrollIntoView({ behavior: 'smooth', block: 'start' });
}

export function AppLayout() {
  const location = useLocation();
  const navigate = useNavigate();
  const { title, subtitle } = getTitleFromPath(location.pathname);
  const [paletteOpen, setPaletteOpen] = useState(false);

  const handleTeamClick = () => {
    if (location.pathname === '/') {
      scrollToTeam();
    } else {
      navigate('/');
      setTimeout(scrollToTeam, 300);
    }
  };

  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
        e.preventDefault();
        setPaletteOpen((p) => !p);
      }
    };
    window.addEventListener('keydown', handler);
    return () => window.removeEventListener('keydown', handler);
  }, []);

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Background gradient */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pointer-events-none" />
      <div className="fixed top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      <Sidebar />

      <div className="flex flex-col flex-1 overflow-hidden relative">
        <Topbar title={title} subtitle={subtitle} onSearchClick={() => setPaletteOpen(true)} />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        <div className="flex-shrink-0 px-6 py-2 border-t border-slate-800/60 flex items-center justify-end gap-3">
          <p className="text-xs text-white-600">
            Made with ❤️ by <span className="text-white-600 font-medium">Blitzkrieg Team</span>
          </p>
          <span className="text-slate-700 text-xs">·</span>
          <button
            onClick={handleTeamClick}
            className="text-xs text-cyan-500/200 hover:text-cyan-400 transition-colors underline underline-offset-2 decoration-dotted"
          >
            Learn more on Dashboard ↗
          </button>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
