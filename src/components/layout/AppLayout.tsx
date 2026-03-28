import { useState, useEffect } from 'react';
import { Outlet, useLocation, useNavigate } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { toolRegistry } from '../../plugins/registry';
import { CommandPalette } from '../command-palette/CommandPalette';
import { motion, AnimatePresence } from 'framer-motion';

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
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);

  // Close mobile sidebar on route change
  useEffect(() => {
    setMobileSidebarOpen(false);
  }, [location.pathname]);

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

  const handleTeamClick = () => {
    if (location.pathname === '/') {
      scrollToTeam();
    } else {
      navigate('/');
      setTimeout(scrollToTeam, 300);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-slate-950">
      {/* Background gradients */}
      <div className="fixed inset-0 bg-gradient-to-br from-slate-950 via-slate-900 to-slate-950 pointer-events-none" />
      <div className="fixed top-0 left-0 w-96 h-96 bg-cyan-500/5 rounded-full blur-3xl pointer-events-none" />
      <div className="fixed bottom-0 right-0 w-96 h-96 bg-violet-500/5 rounded-full blur-3xl pointer-events-none" />

      {/* Mobile backdrop */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={() => setMobileSidebarOpen(false)}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm z-30 md:hidden"
          />
        )}
      </AnimatePresence>

      {/* Sidebar — desktop: static, mobile: fixed drawer */}
      <div className="hidden md:block flex-shrink-0 relative z-20">
        <Sidebar />
      </div>

      {/* Mobile sidebar drawer */}
      <AnimatePresence>
        {mobileSidebarOpen && (
          <motion.div
            initial={{ x: '-100%' }}
            animate={{ x: 0 }}
            exit={{ x: '-100%' }}
            transition={{ type: 'tween', duration: 0.25 }}
            className="fixed inset-y-0 left-0 z-40 md:hidden"
          >
            <Sidebar onClose={() => setMobileSidebarOpen(false)} />
          </motion.div>
        )}
      </AnimatePresence>

      <div className="flex flex-col flex-1 overflow-hidden relative min-w-0">
        <Topbar
          title={title}
          subtitle={subtitle}
          onSearchClick={() => setPaletteOpen(true)}
          onMenuClick={() => setMobileSidebarOpen(true)}
        />
        <main className="flex-1 overflow-auto">
          <Outlet />
        </main>
        <div className="flex-shrink-0 px-4 py-2 border-t border-slate-800/60 flex items-center justify-end gap-2 flex-wrap">
          <p className="text-xs text-white-600">
            Made with ❤️ by <span className="text-white-600 font-medium">Blitzkrieg Team</span>
          </p>
          <span className="text-slate-700 text-xs hidden sm:inline">·</span>
          <button
            onClick={handleTeamClick}
            className="text-xs text-cyan-500/70 hover:text-cyan-400 transition-colors underline underline-offset-2 decoration-dotted hidden sm:inline"
          >
            Learn more on Dashboard ↗
          </button>
        </div>
      </div>

      <CommandPalette open={paletteOpen} onClose={() => setPaletteOpen(false)} />
    </div>
  );
}
