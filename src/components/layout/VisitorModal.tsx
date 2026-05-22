import { motion, AnimatePresence } from 'framer-motion';
import { X, Zap, Shield, Clock, GitBranch } from 'lucide-react';

const AVATARS = [
  'https://randomuser.me/api/portraits/men/32.jpg',
  'https://randomuser.me/api/portraits/women/44.jpg',
  'https://randomuser.me/api/portraits/men/11.jpg',
  'https://randomuser.me/api/portraits/women/68.jpg',
  'https://randomuser.me/api/portraits/men/75.jpg',
  'https://randomuser.me/api/portraits/women/21.jpg',
  'https://randomuser.me/api/portraits/men/54.jpg',
  'https://randomuser.me/api/portraits/women/57.jpg',
];

const FEATURES = [
  { icon: Shield,    label: 'YAML & JSON Validate' },
  { icon: Zap,       label: 'JWT Decode' },
  { icon: Clock,     label: 'Cron Test' },
  { icon: GitBranch, label: 'K8s Inspect' },
];

interface VisitorModalProps {
  open: boolean;
  count: number | null;
  onClose: () => void;
}

export function VisitorModal({ open, count, onClose }: VisitorModalProps) {
  return (
    <AnimatePresence>
      {open && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          onClick={onClose}
        >
          {/* Backdrop */}
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          {/* Modal */}
          <motion.div
            className="relative bg-slate-900 border border-slate-700/60 rounded-2xl p-6 max-w-sm w-full shadow-2xl"
            initial={{ scale: 0.92, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.94, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Close */}
            <button
              onClick={onClose}
              className="absolute top-4 right-4 p-1 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
            >
              <X size={15} />
            </button>

            {/* Avatars */}
            <div className="flex items-center mb-5">
              <div className="flex">
                {AVATARS.map((src, i) => (
                  <img
                    key={i}
                    src={src}
                    alt="user"
                    className="w-9 h-9 rounded-full border-2 border-slate-900 object-cover flex-shrink-0"
                    style={{ marginLeft: i === 0 ? 0 : -10, zIndex: i }}
                  />
                ))}
              </div>
              <span className="ml-3 text-xs text-slate-400 font-medium">
                +{count !== null ? Math.max(count - AVATARS.length, 92) : 100}  more
              </span>
            </div>

            {/* Headline */}
            <h2 className="text-lg font-bold text-white leading-snug mb-2">
              100+ developers use this daily
            </h2>
            <p className="text-sm text-slate-400 leading-relaxed mb-5">
              Engineers worldwide rely on <span className="text-white font-medium">DevOps Hub</span> to
              validate configs, decode tokens, test schedules, inspect manifests, and analyze
              logs — without switching between a dozen browser tabs.
            </p>

            {/* Feature chips */}
            <div className="grid grid-cols-2 gap-2">
              {FEATURES.map(({ icon: Icon, label }) => (
                <div
                  key={label}
                  className="flex items-center gap-2 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-xs text-slate-300"
                >
                  <Icon size={13} className="text-blue-400 flex-shrink-0" />
                  {label}
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
