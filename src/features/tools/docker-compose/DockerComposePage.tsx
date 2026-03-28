import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Container, AlertTriangle, CheckCircle2, Copy,
  RotateCcw, Server, Globe, HardDrive,
  ArrowRight, Package,
} from 'lucide-react';
import { clsx } from 'clsx';
import { parseDockerCompose } from '../../../lib/parsers/docker-compose';
import type { DockerComposeResult, DockerService } from '../../../lib/parsers/docker-compose';

const STORAGE_KEY = 'tool_docker_compose';

const DEFAULT_COMPOSE = `version: '3.8'
services:
  web:
    image: nginx:alpine
    ports:
      - "80:80"
      - "443:443"
    volumes:
      - ./html:/usr/share/nginx/html
      - ./nginx.conf:/etc/nginx/nginx.conf
    depends_on:
      - api
    restart: unless-stopped

  api:
    build:
      context: .
      dockerfile: Dockerfile
    ports:
      - "3000:3000"
    environment:
      NODE_ENV: production
      PORT: 3000
      DATABASE_URL: postgresql://db:5432/myapp
    depends_on:
      - db
    restart: unless-stopped

  db:
    image: postgres:15-alpine
    ports:
      - "5432:5432"
    environment:
      POSTGRES_DB: myapp
      POSTGRES_USER: admin
      POSTGRES_PASSWORD: secret
    volumes:
      - postgres_data:/var/lib/postgresql/data
    restart: unless-stopped

  redis:
    image: redis:7-alpine
    ports:
      - "6379:6379"
    restart: unless-stopped

volumes:
  postgres_data:

networks:
  default:
    driver: bridge`;

function ServiceCard({ service }: { service: DockerService }) {
  const envCount = service.environment
    ? Array.isArray(service.environment)
      ? service.environment.length
      : Object.keys(service.environment).length
    : 0;

  return (
    <div className="glass-card p-4 space-y-3">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-lg bg-cyan-500/15 border border-cyan-500/20 flex items-center justify-center">
            <Server size={13} className="text-cyan-400" />
          </div>
          <span className="text-sm font-semibold text-white">{service.name}</span>
        </div>
        {service.restart && (
          <span className="text-xs px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700/50 text-slate-500">
            {service.restart}
          </span>
        )}
      </div>

      {/* Image or build */}
      {service.image && (
        <div className="flex items-center gap-2">
          <Package size={12} className="text-slate-500" />
          <span className="text-xs font-mono text-cyan-400/80">{service.image}</span>
        </div>
      )}
      {service.build && !service.image && (
        <div className="flex items-center gap-2">
          <Package size={12} className="text-slate-500" />
          <span className="text-xs font-mono text-violet-400/80">
            build: {typeof service.build === 'string' ? service.build : service.build.context || '.'}
          </span>
        </div>
      )}

      {/* Ports */}
      {service.ports && service.ports.length > 0 && (
        <div>
          <p className="text-xs text-slate-600 mb-1.5 flex items-center gap-1">
            <Globe size={10} /> Ports
          </p>
          <div className="flex flex-wrap gap-1.5">
            {service.ports.map((p) => (
              <span key={p} className="text-xs font-mono px-2 py-0.5 rounded bg-blue-500/10 border border-blue-500/20 text-blue-400">
                {p}
              </span>
            ))}
          </div>
        </div>
      )}

      {/* Volumes */}
      {service.volumes && service.volumes.length > 0 && (
        <div>
          <p className="text-xs text-slate-600 mb-1.5 flex items-center gap-1">
            <HardDrive size={10} /> Volumes ({service.volumes.length})
          </p>
          <div className="space-y-1">
            {service.volumes.map((v) => (
              <div key={v} className="text-xs font-mono text-slate-500 flex items-center gap-1">
                <ArrowRight size={9} className="text-slate-700" /> {v}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Env vars count */}
      {envCount > 0 && (
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <span className="px-2 py-0.5 rounded bg-slate-800 border border-slate-700/40">
            {envCount} env var{envCount !== 1 ? 's' : ''}
          </span>
        </div>
      )}

      {/* Depends on */}
      {service.depends_on && service.depends_on.length > 0 && (
        <div className="flex flex-wrap gap-1.5 items-center">
          <span className="text-xs text-slate-600">depends on:</span>
          {service.depends_on.map((dep) => (
            <span key={dep} className="text-xs px-2 py-0.5 rounded-full bg-slate-800 text-slate-500 border border-slate-700/40">
              {dep}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function DockerComposePage() {
  const [input, setInput] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_COMPOSE);
  const [result, setResult] = useState<DockerComposeResult>(() => parseDockerCompose(localStorage.getItem(STORAGE_KEY) || DEFAULT_COMPOSE));
  const [copied, setCopied] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, input); }, [input]);

  const handleInput = (val: string) => { setInput(val); setResult(parseDockerCompose(val)); };

  const copy = () => {
    navigator.clipboard.writeText(input);
    setCopied(true);
    setTimeout(() => setCopied(false), 1500);
  };

  return (
    <div className="flex flex-col h-full">
      {/* Toolbar */}
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 bg-slate-900/30">
        <button onClick={() => handleInput(DEFAULT_COMPOSE)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 border border-slate-700/50 text-slate-400 text-xs font-medium hover:text-slate-200 hover:bg-slate-700 transition-colors">
          <Container size={13} /> Load Example
        </button>
        <button onClick={() => { setInput(''); setResult(parseDockerCompose('')); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 border border-slate-700/50 text-slate-400 text-xs font-medium hover:text-slate-200 hover:bg-slate-700 transition-colors">
          <RotateCcw size={13} /> Clear
        </button>
        <div className="ml-auto">
          {result.valid ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-green-500/15 border border-green-500/25 text-green-400 text-xs font-semibold">
              <CheckCircle2 size={12} /> Valid
            </div>
          ) : input.trim() ? (
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-red-500/15 border border-red-500/25 text-red-400 text-xs font-semibold">
              <AlertTriangle size={12} /> Error
            </div>
          ) : null}
        </div>
      </div>

      <div className="flex flex-1 overflow-hidden">
        {/* Left: Input */}
        <div className="flex flex-col w-2/5 border-r border-slate-700/50">
          <div className="px-4 py-2 border-b border-slate-700/30 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">docker-compose.yml</span>
            <button onClick={copy} className="flex items-center gap-1 text-xs text-slate-500 hover:text-slate-300 transition-colors">
              <Copy size={11} /> {copied ? 'Copied!' : 'Copy'}
            </button>
          </div>
          <textarea
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full bg-slate-950/50 text-slate-200 text-xs font-mono p-4 resize-none outline-none leading-relaxed"
            placeholder="Paste docker-compose.yml here..."
          />
        </div>

        {/* Right: Parsed output */}
        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {result.valid && result.services && (
              <motion.div key="valid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
                {/* Stats */}
                {result.stats && (
                  <div className="grid grid-cols-4 gap-3">
                    {[
                      { label: 'Services', value: result.stats.serviceCount, color: 'text-cyan-400' },
                      { label: 'Ports', value: result.stats.portCount, color: 'text-blue-400' },
                      { label: 'Volumes', value: result.stats.volumeCount, color: 'text-violet-400' },
                      { label: 'Networks', value: result.stats.networkCount, color: 'text-green-400' },
                    ].map(({ label, value, color }) => (
                      <div key={label} className="glass-card p-3 text-center">
                        <p className={clsx('text-xl font-bold', color)}>{value}</p>
                        <p className="text-xs text-slate-500">{label}</p>
                      </div>
                    ))}
                  </div>
                )}

                {/* Version */}
                {result.version && (
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span>Compose version:</span>
                    <span className="font-mono text-slate-400">{result.version}</span>
                  </div>
                )}

                {/* Service cards */}
                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {result.services.map((service, i) => (
                    <motion.div
                      key={service.name}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <ServiceCard service={service} />
                    </motion.div>
                  ))}
                </div>
              </motion.div>
            )}

            {!result.valid && input.trim() && (
              <motion.div key="error" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4">
                <div className="glass-card border-red-500/20 bg-red-500/5 p-4">
                  <div className="flex items-start gap-3">
                    <AlertTriangle size={16} className="text-red-400 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-300 mb-1">Parse Error</p>
                      <p className="text-xs text-red-400/80 font-mono">{result.error}</p>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}

            {!input.trim() && (
              <motion.div key="empty" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-center h-full">
                <div className="text-center">
                  <Container size={32} className="mx-auto text-slate-700 mb-3" />
                  <p className="text-sm text-slate-600">Paste a docker-compose.yml to preview</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
