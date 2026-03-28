import { useState } from 'react';
import { motion } from 'framer-motion';
import { Settings, Trash2, CheckCircle2, Info, Database, Palette, Keyboard } from 'lucide-react';
import { clsx } from 'clsx';
import { toolRegistry } from '../../plugins/registry';

function clearAll() {
  toolRegistry.forEach((tool) => {
    localStorage.removeItem(tool.persistenceKey);
  });
  localStorage.removeItem('devops_hub_snippets');
}

interface SettingRowProps {
  label: string;
  description: string;
  children: React.ReactNode;
}

function SettingRow({ label, description, children }: SettingRowProps) {
  return (
    <div className="flex items-center justify-between py-4 border-b border-slate-700/30 last:border-0">
      <div className="mr-8">
        <p className="text-sm font-medium text-white">{label}</p>
        <p className="text-xs text-slate-500 mt-0.5">{description}</p>
      </div>
      <div className="flex-shrink-0">{children}</div>
    </div>
  );
}

function Toggle({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) {
  return (
    <button
      role="switch"
      aria-checked={value}
      onClick={() => onChange(!value)}
      className={clsx(
        'relative inline-flex w-11 h-6 flex-shrink-0 cursor-pointer rounded-full transition-colors duration-200 focus:outline-none',
        value ? 'bg-cyan-500' : 'bg-slate-700'
      )}
    >
      <span
        className={clsx(
          'absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition-transform duration-200',
          value ? 'translate-x-5' : 'translate-x-0'
        )}
      />
    </button>
  );
}

const SHORTCUT_ROWS = [
  { keys: ['Ctrl', 'K'], label: 'Open Command Palette' },
  { keys: ['Esc'], label: 'Close modal / palette' },
  { keys: ['↑', '↓'], label: 'Navigate palette results' },
  { keys: ['Enter'], label: 'Open selected tool' },
  { keys: ['Tab'], label: 'Insert indent in editors' },
];

export function SettingsPage() {
  const [cleared, setCleared] = useState(false);
  const [persistence, setPersistence] = useState(true);
  const [animations, setAnimations] = useState(true);

  const handleClearAll = () => {
    clearAll();
    setCleared(true);
    setTimeout(() => setCleared(false), 2500);
  };

  const toolsWithData = toolRegistry.filter(
    (t) => localStorage.getItem(t.persistenceKey) !== null
  );

  const sections = [
    { id: 'general', label: 'General', icon: Settings },
    { id: 'storage', label: 'Storage', icon: Database },
    { id: 'appearance', label: 'Appearance', icon: Palette },
    { id: 'shortcuts', label: 'Shortcuts', icon: Keyboard },
  ];

  const [activeSection, setActiveSection] = useState('general');

  return (
    <div className="flex h-full">
      {/* Sidebar nav */}
      <div className="w-48 border-r border-slate-700/50 p-4 flex-shrink-0">
        <p className="text-xs font-semibold text-slate-600 uppercase tracking-wider mb-3">Settings</p>
        <nav className="space-y-1">
          {sections.map(({ id, label, icon: Icon }) => (
            <button
              key={id}
              onClick={() => setActiveSection(id)}
              className={clsx(
                'w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-sm text-left transition-colors',
                activeSection === id
                  ? 'bg-slate-700/60 text-white'
                  : 'text-slate-400 hover:text-slate-200 hover:bg-slate-800/60'
              )}
            >
              <Icon size={14} className={activeSection === id ? 'text-cyan-400' : 'text-slate-500'} />
              {label}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto p-6 max-w-2xl">
        <motion.div
          key={activeSection}
          initial={{ opacity: 0, x: 8 }}
          animate={{ opacity: 1, x: 0 }}
          transition={{ duration: 0.2 }}
          className="space-y-2"
        >
          {activeSection === 'general' && (
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700/40">
                <p className="text-sm font-semibold text-white">General</p>
              </div>
              <div className="px-5">
                <SettingRow
                  label="Persist editor inputs"
                  description="Automatically save your last input for each tool"
                >
                  <Toggle value={persistence} onChange={setPersistence} />
                </SettingRow>
                <SettingRow
                  label="Enable animations"
                  description="Smooth transitions and hover effects throughout the UI"
                >
                  <Toggle value={animations} onChange={setAnimations} />
                </SettingRow>
                <SettingRow
                  label="App version"
                  description="Current version of DevOps Utility Hub"
                >
                  <span className="text-xs font-mono text-slate-500 px-2.5 py-1 rounded-full bg-slate-800 border border-slate-700/50">
                    v1.0.0
                  </span>
                </SettingRow>
              </div>
            </div>
          )}

          {activeSection === 'storage' && (
            <div className="space-y-4">
              <div className="glass-card overflow-hidden">
                <div className="px-5 py-4 border-b border-slate-700/40">
                  <p className="text-sm font-semibold text-white">Saved Data</p>
                </div>
                <div className="p-5 space-y-3">
                  <div className="flex items-start gap-3 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30">
                    <Info size={14} className="text-blue-400 flex-shrink-0 mt-0.5" />
                    <p className="text-xs text-slate-400 leading-relaxed">
                      Editor inputs are persisted in your browser's localStorage. This data stays on your machine and is never sent anywhere.
                    </p>
                  </div>

                  {toolsWithData.length > 0 ? (
                    <div>
                      <p className="text-xs text-slate-500 mb-2">{toolsWithData.length} tool{toolsWithData.length !== 1 ? 's' : ''} with saved data</p>
                      <div className="space-y-1">
                        {toolsWithData.map((tool) => {
                          const val = localStorage.getItem(tool.persistenceKey) || '';
                          return (
                            <div key={tool.id} className="flex items-center justify-between px-3 py-2 rounded-lg bg-slate-800/30 text-xs">
                              <span className="text-slate-400">{tool.name}</span>
                              <span className="text-slate-600">{val.length} chars</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-600">No tool data saved yet.</p>
                  )}
                </div>
              </div>

              <div className="glass-card p-5">
                <p className="text-sm font-semibold text-white mb-1">Clear All Data</p>
                <p className="text-xs text-slate-500 mb-4">
                  Removes all saved editor inputs, snippets, and recent tool history from localStorage.
                </p>
                <button
                  onClick={handleClearAll}
                  className={clsx(
                    'flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium border transition-all',
                    cleared
                      ? 'bg-green-500/15 border-green-500/25 text-green-400'
                      : 'bg-red-500/10 border-red-500/20 text-red-400 hover:bg-red-500/20'
                  )}
                >
                  {cleared ? <CheckCircle2 size={14} /> : <Trash2 size={14} />}
                  {cleared ? 'Cleared!' : 'Clear all saved data'}
                </button>
              </div>
            </div>
          )}

          {activeSection === 'appearance' && (
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700/40">
                <p className="text-sm font-semibold text-white">Appearance</p>
              </div>
              <div className="px-5">
                <SettingRow
                  label="Theme"
                  description="Interface color theme"
                >
                  <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-xs text-slate-400">
                    <div className="w-3 h-3 rounded-full bg-slate-950 border border-slate-600" />
                    Dark (default)
                  </div>
                </SettingRow>
                <SettingRow
                  label="Accent color"
                  description="Primary highlight color across the UI"
                >
                  <div className="flex items-center gap-2">
                    {['cyan', 'violet', 'blue', 'green'].map((color) => (
                      <button
                        key={color}
                        className={clsx(
                          'w-5 h-5 rounded-full border-2 transition-all',
                          color === 'cyan'
                            ? 'bg-cyan-500 border-cyan-400 ring-2 ring-cyan-500/30'
                            : color === 'violet'
                            ? 'bg-violet-500 border-violet-400'
                            : color === 'blue'
                            ? 'bg-blue-500 border-blue-400'
                            : 'bg-green-500 border-green-400'
                        )}
                      />
                    ))}
                  </div>
                </SettingRow>
                <SettingRow
                  label="Font size"
                  description="Editor and code panel font size"
                >
                  <select className="text-xs px-3 py-1.5 rounded-lg bg-slate-800/60 border border-slate-700/50 text-slate-400 focus:outline-none cursor-pointer">
                    <option>12px</option>
                    <option selected>13px</option>
                    <option>14px</option>
                    <option>16px</option>
                  </select>
                </SettingRow>
              </div>
            </div>
          )}

          {activeSection === 'shortcuts' && (
            <div className="glass-card overflow-hidden">
              <div className="px-5 py-4 border-b border-slate-700/40">
                <p className="text-sm font-semibold text-white">Keyboard Shortcuts</p>
              </div>
              <div className="divide-y divide-slate-700/30">
                {SHORTCUT_ROWS.map(({ keys, label }) => (
                  <div key={label} className="flex items-center justify-between px-5 py-3">
                    <span className="text-sm text-slate-400">{label}</span>
                    <div className="flex items-center gap-1">
                      {keys.map((k) => (
                        <kbd
                          key={k}
                          className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700 text-xs text-slate-400 font-mono"
                        >
                          {k}
                        </kbd>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </motion.div>
      </div>
    </div>
  );
}
