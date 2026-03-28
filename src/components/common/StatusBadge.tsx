import { CheckCircle2, XCircle, AlertCircle } from 'lucide-react';
import { clsx } from 'clsx';

type Status = 'valid' | 'invalid' | 'idle' | 'warning';

interface StatusBadgeProps {
  status: Status;
  message?: string;
}

export function StatusBadge({ status, message }: StatusBadgeProps) {
  const config = {
    valid: { icon: CheckCircle2, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20', label: message || 'Valid' },
    invalid: { icon: XCircle, color: 'text-red-400', bg: 'bg-red-500/10 border-red-500/20', label: message || 'Invalid' },
    idle: { icon: AlertCircle, color: 'text-slate-400', bg: 'bg-slate-800/60 border-slate-700/50', label: message || 'Ready' },
    warning: { icon: AlertCircle, color: 'text-yellow-400', bg: 'bg-yellow-500/10 border-yellow-500/20', label: message || 'Warning' },
  };

  const { icon: Icon, color, bg, label } = config[status];

  return (
    <div className={clsx('flex items-center gap-2 px-3 py-1.5 rounded-lg border text-sm font-medium', bg, color)}>
      <Icon size={14} />
      <span>{label}</span>
    </div>
  );
}
