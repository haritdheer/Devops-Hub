import { motion, AnimatePresence } from 'framer-motion';
import { X, ExternalLink, Mail, GraduationCap, Building2 } from 'lucide-react';

const TEAM = [
  {
    name: 'Hardik Dheer',
    role: 'Specialist Programmer',
    roleTag: 'Upcoming Engineer @Target',
    company: 'Infosys',
    degree: 'B.Tech CSE · GGSIPU · GPA 9.5',
    bio: 'Backend engineer building GST compliance systems processing 1M+ daily transactions with Spring Boot, Kafka, and SQL at scale.',
    skills: ['Spring Boot', 'Kafka', 'PostgreSQL', 'React', 'Node.js', 'TypeScript'],
    linkedin: 'https://www.linkedin.com/in/hardik-dheer-646582216/',
    email: 'hardikdheer12@gmail.com',
    avatarGrad: 'from-violet-500 to-purple-600',
    accent: 'text-violet-400',
    accentBg: 'bg-violet-500/10 border-violet-500/20',
    border: 'border-violet-500/20',
    glow: 'from-violet-500/10',
  },
  {
    name: 'Harit Dheer',
    role: 'Software Developer',
    roleTag: 'THB · Sekhmet Technologies',
    company: 'THB',
    degree: 'B.Tech IT · GGSIPU · GPA 9.36',
    bio: 'Frontend-focused full-stack developer building scalable healthcare CRMs with React, TypeScript, and privacy-first architecture.',
    skills: ['React', 'TypeScript', 'Next.js', 'Node.js', 'Redux', 'PWA'],
    linkedin: 'https://www.linkedin.com/in/harit-dheer-612a28203/',
    email: 'haritdheer@gmail.com',
    avatarGrad: 'from-cyan-500 to-blue-600',
    accent: 'text-cyan-400',
    accentBg: 'bg-cyan-500/10 border-cyan-500/20',
    border: 'border-cyan-500/20',
    glow: 'from-cyan-500/10',
  },
];

interface ContributorsModalProps {
  open: boolean;
  onClose: () => void;
}

export function ContributorsModal({ open, onClose }: ContributorsModalProps) {
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
          <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />

          <motion.div
            className="relative w-full max-w-2xl"
            initial={{ scale: 0.93, opacity: 0, y: 16 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 8 }}
            transition={{ type: 'spring', stiffness: 340, damping: 28 }}
            onClick={(e) => e.stopPropagation()}
          >
            {/* Header bar */}
            <div className="bg-slate-900 border border-slate-700/60 rounded-t-2xl px-5 py-4 flex items-center justify-between">
              <div>
                <p className="text-xs text-slate-500 uppercase tracking-wider mb-0.5">Built by</p>
                <h2 className="text-base font-bold text-white">Blitzkrieg Team</h2>
              </div>
              <button
                onClick={onClose}
                className="p-1.5 rounded-lg text-slate-500 hover:text-slate-300 hover:bg-slate-800 transition-colors"
              >
                <X size={15} />
              </button>
            </div>

            {/* Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 border-x border-b border-slate-700/60 rounded-b-2xl overflow-hidden">
              {TEAM.map((member, i) => (
                <div
                  key={member.name}
                  className={`relative bg-slate-900 p-5 flex flex-col gap-3 ${i === 0 ? 'sm:border-r border-slate-700/60 border-b sm:border-b-0' : ''}`}
                >
                  {/* Subtle gradient glow */}
                  <div className={`absolute inset-0 bg-gradient-to-br ${member.glow} to-transparent opacity-60 pointer-events-none`} />

                  {/* Avatar + name */}
                  <div className="flex items-center gap-3 relative">
                    <div className={`w-12 h-12 rounded-xl bg-gradient-to-br ${member.avatarGrad} flex items-center justify-center text-sm font-bold text-white flex-shrink-0 shadow-lg`}>
                      HD
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-bold text-white">{member.name}</p>
                      <p className={`text-xs font-medium ${member.accent}`}>{member.role}</p>
                    </div>
                  </div>

                  {/* Meta */}
                  <div className="flex flex-col gap-1 relative">
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <Building2 size={11} className="flex-shrink-0" />
                      <span>{member.roleTag}</span>
                    </div>
                    <div className="flex items-center gap-1.5 text-xs text-slate-500">
                      <GraduationCap size={11} className="flex-shrink-0" />
                      <span>{member.degree}</span>
                    </div>
                  </div>

                  {/* Bio */}
                  <p className="text-xs text-slate-400 leading-relaxed relative">{member.bio}</p>

                  {/* Skills */}
                  <div className="flex flex-wrap gap-1.5 relative">
                    {member.skills.map((s) => (
                      <span key={s} className={`text-xs px-2 py-0.5 rounded-full border ${member.accentBg} ${member.accent}`}>
                        {s}
                      </span>
                    ))}
                  </div>

                  {/* Connect links */}
                  <div className="flex gap-2 mt-auto pt-1 relative">
                    <a
                      href={member.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-blue-600/15 border border-blue-500/25 text-blue-400 text-xs font-medium hover:bg-blue-600/25 transition-colors"
                    >
                      <ExternalLink size={12} /> LinkedIn
                    </a>
                    <a
                      href={`mailto:${member.email}`}
                      className="flex-1 flex items-center justify-center gap-1.5 py-2 rounded-lg bg-slate-800/60 border border-slate-700/40 text-slate-400 text-xs font-medium hover:text-slate-200 hover:border-slate-600 transition-colors"
                    >
                      <Mail size={12} /> Email
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
