import { useEffect, useRef, useState } from 'react';
import { motion, useInView, useMotionValue, useTransform, animate } from 'framer-motion';
import { Link } from 'react-router-dom';
import {
  Zap, Shield, Clock, TrendingUp, ArrowRight,
  FileCode2, Braces, Key, Container, Layers,
  GitCompare, ScrollText, Binary, ArrowLeftRight,
  CheckCircle2, RefreshCw, ArrowUpRight, Mail, Briefcase, GraduationCap, Code2, Swords, ExternalLink,
} from 'lucide-react';
import { getFeaturedTools, toolRegistry } from '../../plugins/registry';
import { clsx } from 'clsx';

const iconComponents: Record<string, React.ComponentType<{ size?: number; className?: string }>> = {
  FileCode2, Braces, Key, Clock, Binary, Container,
  Layers, GitCompare, ArrowLeftRight, ScrollText,
};

// ─── Animated counter hook ────────────────────────────────────────────────────
function useCountUp(target: number, duration = 1.4) {
  const motionVal = useMotionValue(0);
  const rounded = useTransform(motionVal, (v) => Math.round(v));
  const [display, setDisplay] = useState(0);
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true });

  useEffect(() => {
    if (!inView) return;
    const controls = animate(motionVal, target, { duration, ease: 'easeOut' });
    const unsub = rounded.on('change', setDisplay);
    return () => { controls.stop(); unsub(); };
  }, [inView, target, duration, motionVal, rounded]);

  return { ref, display };
}

// ─── Single animated counter card ────────────────────────────────────────────
function StatCard({
  label, target, suffix = '', icon: Icon, color, bg, delay = 0,
}: {
  label: string; target: number; suffix?: string;
  icon: React.ComponentType<{ size?: number; className?: string }>;
  color: string; bg: string; delay?: number;
}) {
  const { ref, display } = useCountUp(target, 1.2);

  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay, duration: 0.4 }}
      className="glass-card p-4 flex items-center gap-4"
    >
      <div className={clsx('w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0', bg)}>
        <Icon size={18} className={color} />
      </div>
      <div>
        <p ref={ref as React.RefObject<HTMLParagraphElement>} className="text-2xl font-bold text-white tabular-nums">
          {suffix === '∞' ? '∞' : `${display}${suffix}`}
        </p>
        <p className="text-xs text-slate-500">{label}</p>
      </div>
    </motion.div>
  );
}

// ─── Category config ──────────────────────────────────────────────────────────
const CATEGORIES = [
  {
    id: 'validation', label: 'Validation', count: 2, total: 10,
    bar: 'bg-green-500', glow: 'shadow-green-500/30',
    card: 'from-green-500/20 to-emerald-500/10', border: 'border-green-500/20',
    text: 'text-green-400', description: 'YAML, JSON validation and formatting',
    stackColor: 'bg-green-500',
  },
  {
    id: 'inspection', label: 'Inspection', count: 3, total: 10,
    bar: 'bg-cyan-500', glow: 'shadow-cyan-500/30',
    card: 'from-cyan-500/20 to-blue-500/10', border: 'border-cyan-500/20',
    text: 'text-cyan-400', description: 'JWT, Docker, Kubernetes inspection',
    stackColor: 'bg-cyan-500',
  },
  {
    id: 'analysis', label: 'Analysis', count: 3, total: 10,
    bar: 'bg-violet-500', glow: 'shadow-violet-500/30',
    card: 'from-purple-500/20 to-violet-500/10', border: 'border-purple-500/20',
    text: 'text-violet-400', description: 'Cron, Env diff, Log analysis',
    stackColor: 'bg-violet-500',
  },
  {
    id: 'conversion', label: 'Conversion', count: 2, total: 10,
    bar: 'bg-orange-500', glow: 'shadow-orange-500/30',
    card: 'from-orange-500/20 to-red-500/10', border: 'border-orange-500/20',
    text: 'text-orange-400', description: 'Base64, cURL conversion',
    stackColor: 'bg-orange-500',
  },
];

// ─── Animated horizontal bar ──────────────────────────────────────────────────
function AnimatedBar({
  pct, color, glow, delay,
}: { pct: number; color: string; glow: string; delay: number }) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="flex-1 h-2 bg-slate-800 rounded-full overflow-hidden">
      <motion.div
        className={clsx('h-full rounded-full shadow-lg', color, glow)}
        initial={{ width: 0 }}
        animate={inView ? { width: `${pct}%` } : { width: 0 }}
        transition={{ duration: 0.9, delay, ease: [0.25, 0.46, 0.45, 0.94] }}
      />
    </div>
  );
}

// ─── Stacked bar ─────────────────────────────────────────────────────────────
function StackedBar() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true });

  return (
    <div ref={ref} className="flex h-3 rounded-full overflow-hidden gap-px">
      {CATEGORIES.map((cat, i) => (
        <motion.div
          key={cat.id}
          className={clsx('h-full', cat.stackColor)}
          initial={{ flex: 0 }}
          animate={inView ? { flex: cat.count } : { flex: 0 }}
          transition={{ duration: 0.8, delay: i * 0.1, ease: 'easeOut' }}
        />
      ))}
    </div>
  );
}

// ─── Animated Stats Bar section ───────────────────────────────────────────────
function AnimatedStatsBar() {
  const sectionRef = useRef<HTMLDivElement>(null);
  const inView = useInView(sectionRef, { once: true });

  return (
    <motion.div
      ref={sectionRef}
      initial={{ opacity: 0, y: 20 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.5 }}
      className="glass-card p-6 space-y-6"
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-sm font-semibold text-white">Platform Coverage</h2>
          <p className="text-xs text-slate-500 mt-0.5">
            {toolRegistry.length} tools across {CATEGORIES.length} workflow categories
          </p>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-green-400 bg-green-500/10 border border-green-500/20 px-2.5 py-1 rounded-full">
          <CheckCircle2 size={11} />
          All systems ready
        </div>
      </div>

      {/* Stacked overview bar */}
      <div className="space-y-2">
        <StackedBar />
        <div className="flex items-center gap-4 flex-wrap">
          {CATEGORIES.map((cat) => (
            <div key={cat.id} className="flex items-center gap-1.5">
              <div className={clsx('w-2 h-2 rounded-full', cat.stackColor)} />
              <span className="text-xs text-slate-500">{cat.label}</span>
              <span className="text-xs font-semibold text-slate-400">{cat.count}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Per-category bars */}
      <div className="space-y-4">
        {CATEGORIES.map((cat, i) => {
          const pct = (cat.count / cat.total) * 100;
          return (
            <div key={cat.id} className="space-y-1.5">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className={clsx('text-xs font-semibold', cat.text)}>{cat.label}</span>
                  <span className="text-xs text-slate-600">{cat.description}</span>
                </div>
                <div className="flex items-center gap-2">
                  <motion.span
                    className={clsx('text-xs font-bold tabular-nums', cat.text)}
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: i * 0.1 + 0.6 }}
                  >
                    {cat.count} tool{cat.count !== 1 ? 's' : ''}
                  </motion.span>
                  <motion.span
                    className="text-xs text-slate-600"
                    initial={{ opacity: 0 }}
                    animate={inView ? { opacity: 1 } : {}}
                    transition={{ delay: i * 0.1 + 0.7 }}
                  >
                    {pct}%
                  </motion.span>
                </div>
              </div>
              <AnimatedBar
                pct={pct}
                color={cat.bar}
                glow={cat.glow}
                delay={i * 0.12 + 0.2}
              />
            </div>
          );
        })}
      </div>

      {/* Bottom quick-access row */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 pt-2 border-t border-slate-700/40">
        {[
          { label: 'Parsers built', value: 8, icon: RefreshCw, color: 'text-cyan-400' },
          { label: 'Persistence keys', value: toolRegistry.length, icon: Shield, color: 'text-violet-400' },
          { label: 'Tool presets', value: 18, icon: Zap, color: 'text-yellow-400' },
          { label: 'Open source', value: '100%', icon: ArrowUpRight, color: 'text-green-400' },
        ].map((item, i) => {
          const Icon = item.icon;
          return (
            <motion.div
              key={item.label}
              initial={{ opacity: 0, scale: 0.9 }}
              animate={inView ? { opacity: 1, scale: 1 } : {}}
              transition={{ delay: i * 0.08 + 0.5, duration: 0.3 }}
              className="flex flex-col gap-1 p-3 rounded-lg bg-slate-800/40 border border-slate-700/30"
            >
              <Icon size={13} className={item.color} />
              <p className={clsx('text-lg font-bold tabular-nums', item.color)}>
                {item.value}
              </p>
              <p className="text-xs text-slate-600">{item.label}</p>
            </motion.div>
          );
        })}
      </div>
    </motion.div>
  );
}

// ─── About / Team section ────────────────────────────────────────────────────
const TEAM = [
  {
    name: 'Hardik Dheer',
    role: 'Specialist Programmer (Upcoming Engineer @Target)',
    company: 'Infosys',
    degree: 'B.Tech CSE · GGSIPU · GPA 9.5',
    bio: 'Full-stack engineer with deep backend expertise in Spring Boot, Kafka, and SQL at scale. Builds GST compliance systems processing 1M+ daily transactions.',
    skills: ['Spring Boot', 'React', 'Node.js', 'Kafka', 'PostgreSQL', 'TypeScript'],
    linkedin: 'https://www.linkedin.com/in/hardik-dheer-646582216/',
    email: 'hardikdheer12@gmail.com',
    gradient: 'from-violet-500/20 via-purple-500/10 to-slate-900/0',
    border: 'hover:border-violet-500/40',
    glow: 'hover:shadow-violet-500/10',
    accent: 'text-violet-400',
    accentBg: 'bg-violet-500/10 border-violet-500/20',
    avatarGrad: 'from-violet-500 to-purple-600',
    initials: 'HD',
  },
  {
    name: 'Harit Dheer',
    role: 'Software Developer',
    company: 'THB · Sekhmet Technologies',
    degree: 'B.Tech IT · GGSIPU · GPA 9.36',
    bio: 'Frontend-focused full-stack developer building scalable healthcare CRMs. Specialises in React, TypeScript, performance optimisation, and privacy-first architecture.',
    skills: ['React', 'TypeScript', 'Node.js', 'Next.js', 'Redux', 'PWA'],
    linkedin: 'https://www.linkedin.com/in/harit-dheer-612a28203/',
    email: 'haritdheer@gmail.com',
    gradient: 'from-cyan-500/20 via-blue-500/10 to-slate-900/0',
    border: 'hover:border-cyan-500/40',
    glow: 'hover:shadow-cyan-500/10',
    accent: 'text-cyan-400',
    accentBg: 'bg-cyan-500/10 border-cyan-500/20',
    avatarGrad: 'from-cyan-500 to-blue-600',
    initials: 'HD',
  },
];

function AboutSection() {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, margin: '-80px' });

  return (
    <motion.div
      id="blitzkrieg-team"
      ref={ref}
      initial={{ opacity: 0, y: 24 }}
      animate={inView ? { opacity: 1, y: 0 } : {}}
      transition={{ duration: 0.6 }}
      className="space-y-6"
    >
      {/* Section header */}
      <div className="flex flex-col items-center text-center gap-3">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={inView ? { scale: 1, opacity: 1 } : {}}
          transition={{ delay: 0.1, duration: 0.4 }}
          className="flex items-center gap-2 px-4 py-1.5 rounded-full bg-slate-800/60 border border-slate-700/50"
        >
          <Swords size={13} className="text-yellow-400" />
          <span className="text-xs font-bold text-yellow-400 uppercase tracking-widest">Blitzkrieg Team</span>
          <Swords size={13} className="text-yellow-400" />
        </motion.div>
        <motion.h2
          initial={{ opacity: 0, y: 8 }}
          animate={inView ? { opacity: 1, y: 0 } : {}}
          transition={{ delay: 0.2, duration: 0.4 }}
          className="text-2xl font-bold text-white"
        >
          Built by{' '}
          <span className="bg-gradient-to-r from-violet-400 via-cyan-400 to-blue-400 bg-clip-text text-transparent">
            engineers, for engineers
          </span>
        </motion.h2>
        <motion.p
          initial={{ opacity: 0 }}
          animate={inView ? { opacity: 1 } : {}}
          transition={{ delay: 0.3, duration: 0.4 }}
          className="text-sm text-slate-500 max-w-md leading-relaxed"
        >
          Two brothers. One shared obsession with clean code, great developer tooling, and shipping things that actually work.
        </motion.p>
      </div>

      {/* Team cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {TEAM.map((member, i) => (
          <motion.div
            key={member.name}
            initial={{ opacity: 0, x: i === 0 ? -24 : 24 }}
            animate={inView ? { opacity: 1, x: 0 } : {}}
            transition={{ delay: 0.25 + i * 0.12, duration: 0.5, ease: 'easeOut' }}
            whileHover={{ y: -4 }}
            className={clsx(
              'relative overflow-hidden glass-card p-6 border transition-all duration-300 group',
              'hover:shadow-xl',
              member.border,
              member.glow
            )}
          >
            {/* Background glow */}
            <div className={clsx('absolute inset-0 bg-gradient-to-br opacity-40 pointer-events-none', member.gradient)} />

            {/* Animated corner accent */}
            <div className="absolute top-0 right-0 w-32 h-32 opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none">
              <div className={clsx('absolute top-0 right-0 w-32 h-32 rounded-full blur-2xl', member.accentBg.split(' ')[0])} />
            </div>

            <div className="relative space-y-4">
              {/* Avatar + name row */}
              <div className="flex items-start gap-4">
                <motion.div
                  whileHover={{ scale: 1.08, rotate: 3 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className={clsx(
                    'w-14 h-14 rounded-2xl bg-gradient-to-br flex items-center justify-center flex-shrink-0 shadow-lg',
                    member.avatarGrad
                  )}
                >
                  <span className="text-white font-bold text-lg tracking-tight">{member.initials}</span>
                </motion.div>

                <div className="flex-1 min-w-0">
                  <h3 className="text-base font-bold text-white">{member.name}</h3>
                  <div className="flex items-start gap-1.5 mt-0.5">
                    <Briefcase size={11} className="text-slate-500 flex-shrink-0 mt-0.5" />
                    <p className={clsx('text-xs font-medium leading-snug', member.accent)}>{member.role}</p>
                  </div>
                  <p className="text-xs text-slate-600">{member.company}</p>
                </div>
              </div>

              {/* Degree */}
              <div className="flex items-center gap-2">
                <GraduationCap size={12} className="text-slate-600 flex-shrink-0" />
                <span className="text-xs text-slate-500">{member.degree}</span>
              </div>

              {/* Bio */}
              <p className="text-xs text-slate-400 leading-relaxed">{member.bio}</p>

              {/* Skills */}
              <div>
                <div className="flex items-center gap-1.5 mb-2">
                  <Code2 size={11} className="text-slate-600" />
                  <span className="text-xs text-slate-600 uppercase tracking-wider font-medium">Stack</span>
                </div>
                <div className="flex flex-wrap gap-1.5">
                  {member.skills.map((skill, si) => (
                    <motion.span
                      key={skill}
                      initial={{ opacity: 0, scale: 0.8 }}
                      animate={inView ? { opacity: 1, scale: 1 } : {}}
                      transition={{ delay: 0.4 + i * 0.1 + si * 0.04 }}
                      className={clsx(
                        'text-xs px-2 py-0.5 rounded-full border font-medium',
                        member.accentBg, member.accent
                      )}
                    >
                      {skill}
                    </motion.span>
                  ))}
                </div>
              </div>

              {/* Divider */}
              <div className="border-t border-slate-700/40 pt-4 flex items-center justify-between">
                <a
                  href={member.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className={clsx(
                    'flex items-center gap-2 px-3 py-1.5 rounded-lg border text-xs font-medium transition-all duration-200',
                    member.accentBg, member.accent,
                    'hover:scale-105 hover:shadow-lg'
                  )}
                >
                  <ExternalLink size={12} />
                  LinkedIn
                </a>
                <a
                  href={`mailto:${member.email}`}
                  className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-300 transition-colors"
                >
                  <Mail size={12} />
                  {member.email}
                </a>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Bottom tagline */}
      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={inView ? { opacity: 1, y: 0 } : {}}
        transition={{ delay: 0.6, duration: 0.4 }}
        className="flex items-center justify-center gap-3"
      >
        <div className="h-px flex-1 bg-gradient-to-r from-transparent to-slate-700/50" />
        <span className="text-xs text-white-600 px-3">Made with ❤️ · Blitzkrieg Team · 2026</span>
        <div className="h-px flex-1 bg-gradient-to-l from-transparent to-slate-700/50" />
      </motion.div>
    </motion.div>
  );
}

// ─── Main page ────────────────────────────────────────────────────────────────
const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
};
const itemVariants = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
};

export function DashboardPage() {
  const featuredTools = getFeaturedTools();

  return (
    <div className="p-6 space-y-8">
      {/* Hero */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl bg-gradient-to-br from-slate-900/80 to-slate-800/40 border border-slate-700/50 p-8"
      >
        <div className="absolute top-0 right-0 w-64 h-64 bg-cyan-500/10 rounded-full blur-3xl" />
        <div className="absolute bottom-0 left-1/3 w-48 h-48 bg-violet-500/10 rounded-full blur-3xl" />
        <div className="relative">
          <div className="flex items-center gap-2 mb-4">
            <div className="w-7 h-7 rounded-lg bg-gradient-to-br from-cyan-500 to-blue-600 flex items-center justify-center">
              <Zap size={14} className="text-white" />
            </div>
            <span className="text-xs font-semibold text-cyan-400 uppercase tracking-wider">
              DevOps Utility Hub
            </span>
          </div>
          <h1 className="text-3xl font-bold text-white mb-2">
            Your{' '}
            <span className="bg-gradient-to-r from-cyan-400 via-blue-400 to-violet-400 bg-clip-text text-transparent">
              command center
            </span>{' '}
            for DevOps workflows
          </h1>
          <p className="text-slate-400 max-w-xl text-sm leading-relaxed">
            Validate configs, inspect tokens, test schedules, analyze logs, and parse manifests — all
            in one premium workspace built for engineers.
          </p>
          <div className="flex gap-3 mt-6 flex-wrap">
            <Link
              to="/tools/yaml-validator"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-cyan-500/20 border border-cyan-500/30 text-cyan-300 text-sm font-medium hover:bg-cyan-500/30 transition-colors"
            >
              Get Started <ArrowRight size={14} />
            </Link>
            <Link
              to="/tools/jwt-decoder"
              className="flex items-center gap-2 px-4 py-2 rounded-lg bg-slate-700/60 border border-slate-600/50 text-slate-300 text-sm font-medium hover:bg-slate-700 transition-colors"
            >
              Decode JWT
            </Link>
          </div>
        </div>
      </motion.div>

      {/* Animated stat cards with count-up */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <StatCard label="Total Tools"  target={11} icon={Zap}       color="text-cyan-400"   bg="bg-cyan-500/10"   delay={0}    />
        <StatCard label="Categories"   target={4}  icon={Shield}    color="text-violet-400" bg="bg-violet-500/10" delay={0.08} />
        <StatCard label="Parsers"      target={8}  icon={TrendingUp} color="text-green-400"  bg="bg-green-500/10"  delay={0.16} />
        <StatCard label="Always Free"  target={0}  suffix="∞" icon={Clock} color="text-blue-400" bg="bg-blue-500/10" delay={0.24} />
      </div>

      {/* ── Animated Stats Bar ── */}
      <AnimatedStatsBar />

      {/* Featured Tools */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Featured Tools</h2>
          <span className="text-xs text-slate-500">{featuredTools.length} tools</span>
        </div>
        <motion.div
          variants={containerVariants}
          initial="hidden"
          animate="visible"
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
        >
          {featuredTools.map((tool) => {
            const Icon = iconComponents[tool.icon];
            return (
              <motion.div key={tool.id} variants={itemVariants}>
                <Link
                  to={tool.route}
                  className={clsx(
                    'block glass-card p-5 hover:border-slate-600/60 transition-all duration-200 group',
                    'hover:scale-[1.02] hover:shadow-lg hover:shadow-slate-900/50'
                  )}
                >
                  <div className="flex items-start justify-between mb-3">
                    <div className={clsx('w-10 h-10 rounded-xl bg-gradient-to-br flex items-center justify-center', tool.gradient)}>
                      {Icon && <Icon size={18} className={tool.color} />}
                    </div>
                    <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 capitalize">
                      {tool.category}
                    </span>
                  </div>
                  <h3 className="text-sm font-semibold text-white mb-1 group-hover:text-cyan-300 transition-colors">
                    {tool.name}
                  </h3>
                  <p className="text-xs text-slate-500 leading-relaxed">{tool.description}</p>
                  <div className="flex flex-wrap gap-1 mt-3">
                    {tool.tags.slice(0, 3).map((tag) => (
                      <span key={tag} className="text-xs px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-600">
                        {tag}
                      </span>
                    ))}
                  </div>
                </Link>
              </motion.div>
            );
          })}
        </motion.div>
      </div>

      {/* Categories */}
      <div>
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-sm font-semibold text-white">Browse by Category</h2>
        </div>
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
          {CATEGORIES.map((cat) => (
            <div
              key={cat.id}
              className={clsx(
                'glass-card p-4 border bg-gradient-to-br cursor-pointer hover:scale-[1.02] transition-transform',
                cat.card, cat.border
              )}
            >
              <p className={clsx('text-sm font-semibold mb-1 capitalize', cat.text)}>{cat.label}</p>
              <p className="text-xs text-slate-500 mb-2">{cat.description}</p>
              <span className="text-xs text-slate-600">{cat.count} tools</span>
            </div>
          ))}
        </div>
      </div>

      {/* ── About / Team ── */}
      <AboutSection />
    </div>
  );
}
