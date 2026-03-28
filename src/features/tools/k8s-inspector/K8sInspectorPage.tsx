import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Layers, AlertTriangle, CheckCircle2, RotateCcw,
  Globe, Box,
} from 'lucide-react';
import { clsx } from 'clsx';
import { parseK8sManifest } from '../../../lib/parsers/k8s';
import type { K8sResource } from '../../../lib/parsers/k8s';

const STORAGE_KEY = 'tool_k8s_inspector';

const DEFAULT_MANIFEST = `apiVersion: apps/v1
kind: Deployment
metadata:
  name: frontend
  namespace: production
  labels:
    app: frontend
    tier: web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: frontend
  template:
    metadata:
      labels:
        app: frontend
    spec:
      containers:
        - name: app
          image: myapp/frontend:2.1.0
          ports:
            - containerPort: 3000
---
apiVersion: v1
kind: Service
metadata:
  name: frontend-service
  namespace: production
spec:
  type: LoadBalancer
  ports:
    - port: 80
      targetPort: 3000
      protocol: TCP
  selector:
    app: frontend
---
apiVersion: apps/v1
kind: Deployment
metadata:
  name: backend-api
  namespace: production
  labels:
    app: backend
    tier: api
spec:
  replicas: 2
  selector:
    matchLabels:
      app: backend
  template:
    metadata:
      labels:
        app: backend
    spec:
      containers:
        - name: api
          image: myapp/backend:1.5.2
          ports:
            - containerPort: 8080
        - name: sidecar
          image: envoyproxy/envoy:v1.25`;

const KIND_COLORS: Record<string, string> = {
  Deployment: 'text-blue-400 bg-blue-500/10 border-blue-500/20',
  StatefulSet: 'text-violet-400 bg-violet-500/10 border-violet-500/20',
  DaemonSet: 'text-orange-400 bg-orange-500/10 border-orange-500/20',
  Service: 'text-green-400 bg-green-500/10 border-green-500/20',
  ConfigMap: 'text-yellow-400 bg-yellow-500/10 border-yellow-500/20',
  Secret: 'text-red-400 bg-red-500/10 border-red-500/20',
  Pod: 'text-cyan-400 bg-cyan-500/10 border-cyan-500/20',
  Ingress: 'text-pink-400 bg-pink-500/10 border-pink-500/20',
};

function ResourceCard({ resource }: { resource: K8sResource }) {
  const kindColor = KIND_COLORS[resource.kind] || 'text-slate-400 bg-slate-700/20 border-slate-700/40';

  return (
    <div className="glass-card p-4 space-y-3">
      <div className="flex items-start justify-between gap-2">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className={clsx('text-xs px-2 py-0.5 rounded-full border font-medium', kindColor)}>
              {resource.kind}
            </span>
            {resource.apiVersion && (
              <span className="text-xs text-slate-700 font-mono">{resource.apiVersion}</span>
            )}
          </div>
          <p className="text-sm font-semibold text-white">{resource.name}</p>
          {resource.namespace && (
            <p className="text-xs text-slate-500">ns: {resource.namespace}</p>
          )}
        </div>
      </div>

      {/* Deployment/StatefulSet specifics */}
      {resource.replicas !== undefined && (
        <div className="flex items-center gap-2 text-xs">
          <Box size={11} className="text-slate-500" />
          <span className="text-slate-500">Replicas:</span>
          <span className="text-blue-400 font-bold">{resource.replicas}</span>
        </div>
      )}

      {resource.containers && resource.containers.length > 0 && (
        <div>
          <p className="text-xs text-slate-600 mb-1.5">Containers ({resource.containers.length})</p>
          {resource.containers.map((c) => (
            <div key={c.name} className="mb-1.5">
              <p className="text-xs font-mono text-slate-400">{c.name}</p>
              <p className="text-xs font-mono text-cyan-400/70">{c.image}</p>
              {c.ports && c.ports.length > 0 && (
                <div className="flex gap-1 mt-1">
                  {c.ports.map((p) => (
                    <span key={p} className="text-xs px-1.5 py-0.5 rounded bg-slate-800 font-mono text-slate-500">:{p}</span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Service specifics */}
      {resource.serviceType && (
        <div className="flex items-center gap-2 text-xs">
          <Globe size={11} className="text-slate-500" />
          <span className="text-slate-500">Type:</span>
          <span className="text-green-400 font-medium">{resource.serviceType}</span>
        </div>
      )}
      {resource.servicePorts && resource.servicePorts.length > 0 && (
        <div className="flex flex-wrap gap-1.5">
          {resource.servicePorts.map((p, i) => (
            <span key={i} className="text-xs font-mono px-2 py-0.5 rounded bg-green-500/10 border border-green-500/20 text-green-400">
              {p.port}{p.targetPort ? `:${p.targetPort}` : ''} {p.protocol || 'TCP'}
            </span>
          ))}
        </div>
      )}

      {/* Labels */}
      {resource.labels && Object.keys(resource.labels).length > 0 && (
        <div className="flex flex-wrap gap-1">
          {Object.entries(resource.labels).slice(0, 4).map(([k, v]) => (
            <span key={k} className="text-xs px-1.5 py-0.5 rounded bg-slate-800/80 text-slate-600 font-mono">
              {k}={v}
            </span>
          ))}
        </div>
      )}
    </div>
  );
}

export function K8sInspectorPage() {
  const [input, setInput] = useState(() => localStorage.getItem(STORAGE_KEY) || DEFAULT_MANIFEST);
  const [result, setResult] = useState(() => parseK8sManifest(localStorage.getItem(STORAGE_KEY) || DEFAULT_MANIFEST));
  const [_copied, _setCopied] = useState(false);

  useEffect(() => { localStorage.setItem(STORAGE_KEY, input); }, [input]);

  const handleInput = (val: string) => { setInput(val); setResult(parseK8sManifest(val)); };

  return (
    <div className="flex flex-col h-full">
      <div className="flex items-center gap-2 px-4 py-3 border-b border-slate-700/50 bg-slate-900/30">
        <button onClick={() => handleInput(DEFAULT_MANIFEST)} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 border border-slate-700/50 text-slate-400 text-xs font-medium hover:text-slate-200 hover:bg-slate-700 transition-colors">
          <Layers size={13} /> Load Example
        </button>
        <button onClick={() => { setInput(''); setResult(parseK8sManifest('')); }} className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-slate-700/60 border border-slate-700/50 text-slate-400 text-xs font-medium hover:text-slate-200 hover:bg-slate-700 transition-colors">
          <RotateCcw size={13} /> Clear
        </button>
        <div className="ml-auto flex items-center gap-2">
          {result.valid && result.stats && (
            <span className="text-xs text-slate-500">{result.stats.total} resource{result.stats.total !== 1 ? 's' : ''}</span>
          )}
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
        <div className="flex flex-col w-2/5 border-r border-slate-700/50">
          <div className="px-4 py-2 border-b border-slate-700/30 flex items-center justify-between">
            <span className="text-xs text-slate-500 font-medium">manifest.yaml</span>
            <span className="text-xs text-slate-600">{input.split('\n').length} lines</span>
          </div>
          <textarea
            value={input}
            onChange={(e) => handleInput(e.target.value)}
            spellCheck={false}
            className="flex-1 w-full bg-slate-950/50 text-slate-200 text-xs font-mono p-4 resize-none outline-none leading-relaxed"
            placeholder="Paste Kubernetes manifest YAML here (supports multiple --- separated resources)..."
          />
        </div>

        <div className="flex-1 overflow-auto">
          <AnimatePresence mode="wait">
            {result.valid && result.resources && (
              <motion.div key="valid" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-4 space-y-4">
                {/* Kind summary */}
                {result.stats && (
                  <div className="flex flex-wrap gap-2">
                    {Object.entries(result.stats.kinds).map(([kind, count]) => {
                      const colorClass = KIND_COLORS[kind] || 'text-slate-400 bg-slate-700/20 border-slate-700/40';
                      return (
                        <span key={kind} className={clsx('text-xs px-2.5 py-1 rounded-full border font-medium', colorClass)}>
                          {count}× {kind}
                        </span>
                      );
                    })}
                  </div>
                )}

                <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
                  {result.resources.map((resource, i) => (
                    <motion.div
                      key={`${resource.kind}-${resource.name}-${i}`}
                      initial={{ opacity: 0, y: 8 }}
                      animate={{ opacity: 1, y: 0 }}
                      transition={{ delay: i * 0.05 }}
                    >
                      <ResourceCard resource={resource} />
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
                  <Layers size={32} className="mx-auto text-slate-700 mb-3" />
                  <p className="text-sm text-slate-600">Paste Kubernetes manifests to inspect</p>
                  <p className="text-xs text-slate-700 mt-1">Supports multi-document YAML with --- separators</p>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </div>
  );
}
