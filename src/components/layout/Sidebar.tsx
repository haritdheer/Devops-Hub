import { NavLink } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  LayoutDashboard,
  FileCode2,
  Braces,
  Key,
  Clock,
  Binary,
  Container,
  Layers,
  GitCompare,
  ArrowLeftRight,
  ScrollText,
  Bookmark,
  Settings,
  ChevronLeft,
  ChevronRight,
  Zap,
  X,
} from 'lucide-react';
import { useAppStore } from '../../app/store';
import { clsx } from 'clsx';

const iconMap: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  LayoutDashboard,
  FileCode2,
  Braces,
  Key,
  Clock,
  Binary,
  Container,
  Layers,
  GitCompare,
  ArrowLeftRight,
  ScrollText,
  Bookmark,
  Settings,
};

interface NavItem {
  label: string;
  icon?: string;
  path?: string;
  color?: string;
  type?: string;
  heading?: string;
}

const navItems: NavItem[] = [
  { label: 'Dashboard', icon: 'LayoutDashboard', path: '/' },
  { label: 'Divider', type: 'divider', heading: 'Validation' },
  { label: 'YAML Validator', icon: 'FileCode2', path: '/tools/yaml-validator', color: 'text-green-400' },
  { label: 'JSON Formatter', icon: 'Braces', path: '/tools/json-formatter', color: 'text-yellow-400' },
  { label: 'Divider', type: 'divider', heading: 'Inspection' },
  { label: 'JWT Decoder', icon: 'Key', path: '/tools/jwt-decoder', color: 'text-purple-400' },
  { label: 'Docker Compose', icon: 'Container', path: '/tools/docker-compose', color: 'text-cyan-400' },
  { label: 'K8s Inspector', icon: 'Layers', path: '/tools/k8s-inspector', color: 'text-indigo-400' },
  { label: 'Divider', type: 'divider', heading: 'Analysis' },
  { label: 'Cron Tester', icon: 'Clock', path: '/tools/cron-tester', color: 'text-blue-400' },
  { label: 'Env Diff', icon: 'GitCompare', path: '/tools/env-diff', color: 'text-pink-400' },
  { label: 'Log Analyzer', icon: 'ScrollText', path: '/tools/log-analyzer', color: 'text-red-400' },
  { label: 'Divider', type: 'divider', heading: 'Conversion' },
  { label: 'Base64', icon: 'Binary', path: '/tools/base64', color: 'text-orange-400' },
  { label: 'cURL Converter', icon: 'ArrowLeftRight', path: '/tools/curl-converter', color: 'text-teal-400' },
  { label: 'Divider', type: 'divider', heading: 'Workspace' },
  { label: 'Snippets', icon: 'Bookmark', path: '/snippets', color: 'text-slate-400' },
  { label: 'Settings', icon: 'Settings', path: '/settings', color: 'text-slate-400' },
];

interface SidebarProps {
  onClose?: () => void;
}

export function Sidebar({ onClose }: SidebarProps) {
  const { sidebarCollapsed, toggleSidebar } = useAppStore();

  return (
    <motion.aside
      animate={{ width: (onClose || !sidebarCollapsed) ? 240 : 64 }}
      transition={{ duration: 0.2, ease: 'easeInOut' }}
      className="relative flex flex-col h-screen bg-slate-900/80 backdrop-blur-xl border-r border-slate-700/50 flex-shrink-0 overflow-hidden z-20"
    >
      {/* Logo */}
      <div className="flex items-center gap-3 px-4 py-5 border-b border-slate-700/50">
        <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center flex-shrink-0">
          <Zap size={16} className="text-white" />
        </div>
        <AnimatePresence>
          {(onClose || !sidebarCollapsed) && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="overflow-hidden flex-1"
            >
              <p className="text-sm font-bold text-white whitespace-nowrap">DevOps Hub</p>
              <p className="text-xs text-slate-500 whitespace-nowrap">Utility Platform</p>
            </motion.div>
          )}
        </AnimatePresence>
        {onClose && (
          <button onClick={onClose} className="ml-auto p-1 text-slate-500 hover:text-slate-300 md:hidden">
            <X size={16} />
          </button>
        )}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto py-3 space-y-0.5 px-2">
        {navItems.map((item, index) => {
          if (item.type === 'divider') {
            return (
              <div key={index} className="pt-4 pb-1">
                <AnimatePresence>
                  {(onClose || !sidebarCollapsed) && (
                    <motion.p
                      initial={{ opacity: 0 }}
                      animate={{ opacity: 1 }}
                      exit={{ opacity: 0 }}
                      className="text-xs font-semibold text-slate-600 uppercase tracking-wider px-2"
                    >
                      {item.heading}
                    </motion.p>
                  )}
                </AnimatePresence>
                {!onClose && sidebarCollapsed && <div className="h-px bg-slate-700/50 mx-1 mt-1" />}
              </div>
            );
          }

          const Icon = iconMap[item.icon!];
          return (
            <NavLink
              key={item.path}
              to={item.path!}
              end={item.path === '/'}
              className={({ isActive }) =>
                clsx(
                  'flex items-center gap-3 px-2 py-2 rounded-lg text-sm transition-all duration-150 group relative',
                  isActive
                    ? 'bg-slate-700/60 text-white'
                    : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
                )
              }
            >
              {({ isActive }) => (
                <>
                  {isActive && (
                    <motion.div
                      layoutId="sidebar-active"
                      className="absolute inset-0 rounded-lg bg-slate-700/60"
                      style={{ zIndex: -1 }}
                    />
                  )}
                  {Icon && (
                    <Icon
                      size={18}
                      className={clsx(
                        'flex-shrink-0 transition-colors',
                        isActive ? (item.color || 'text-cyan-400') : 'text-slate-500 group-hover:text-slate-300'
                      )}
                    />
                  )}
                  <AnimatePresence>
                    {(onClose || !sidebarCollapsed) && (
                      <motion.span
                        initial={{ opacity: 0 }}
                        animate={{ opacity: 1 }}
                        exit={{ opacity: 0 }}
                        transition={{ duration: 0.15 }}
                        className="whitespace-nowrap"
                      >
                        {item.label}
                      </motion.span>
                    )}
                  </AnimatePresence>
                </>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Toggle — desktop only */}
      <button
        onClick={toggleSidebar}
        className="absolute -right-3 top-20 w-6 h-6 rounded-full bg-slate-700 border border-slate-600 hidden md:flex items-center justify-center text-slate-400 hover:text-white hover:bg-slate-600 transition-colors z-30"
      >
        {sidebarCollapsed ? <ChevronRight size={12} /> : <ChevronLeft size={12} />}
      </button>
    </motion.aside>
  );
}
