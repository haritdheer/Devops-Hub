import { useLocation } from 'react-router-dom';
import { Construction } from 'lucide-react';
import { toolRegistry } from '../../plugins/registry';

export function ToolPlaceholder() {
  const location = useLocation();
  const tool = toolRegistry.find((t) => t.route === location.pathname);

  return (
    <div className="flex flex-col items-center justify-center h-full text-center p-8">
      <div className="w-16 h-16 rounded-2xl bg-slate-800/60 border border-slate-700/50 flex items-center justify-center mb-4">
        <Construction size={28} className="text-slate-500" />
      </div>
      <h2 className="text-lg font-semibold text-white mb-2">{tool?.name || 'Tool'}</h2>
      <p className="text-sm text-slate-500 max-w-sm">
        {tool?.description || 'This tool is coming soon.'}
      </p>
      <span className="mt-4 text-xs px-3 py-1 rounded-full bg-slate-800 border border-slate-700 text-slate-500">
        Coming Soon
      </span>
    </div>
  );
}
