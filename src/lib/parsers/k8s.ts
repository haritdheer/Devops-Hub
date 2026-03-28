import * as yaml from 'js-yaml';

export interface K8sResource {
  apiVersion: string;
  kind: string;
  name: string;
  namespace?: string;
  labels?: Record<string, string>;
  annotations?: Record<string, string>;
  replicas?: number;
  containers?: { name: string; image: string; ports?: number[] }[];
  serviceType?: string;
  servicePorts?: { port: number; targetPort?: number; protocol?: string }[];
  raw: Record<string, unknown>;
}

export interface K8sParseResult {
  valid: boolean;
  resources?: K8sResource[];
  error?: string;
  stats?: {
    total: number;
    kinds: Record<string, number>;
  };
}

function extractContainers(spec: Record<string, unknown>) {
  const containers = (spec.containers as Array<Record<string, unknown>>) || [];
  return containers.map((c) => ({
    name: c.name as string,
    image: c.image as string,
    ports: ((c.ports as Array<{ containerPort: number }>) || []).map((p) => p.containerPort),
  }));
}

export function parseK8sManifest(input: string): K8sParseResult {
  if (!input.trim()) return { valid: false, error: 'Input is empty' };
  try {
    const docs: K8sResource[] = [];
    yaml.loadAll(input, (doc) => {
      const d = doc as Record<string, unknown>;
      if (!d || !d.kind) return;
      const metadata = (d.metadata as Record<string, unknown>) || {};
      const spec = (d.spec as Record<string, unknown>) || {};
      const resource: K8sResource = {
        apiVersion: d.apiVersion as string,
        kind: d.kind as string,
        name: metadata.name as string,
        namespace: metadata.namespace as string | undefined,
        labels: metadata.labels as Record<string, string> | undefined,
        annotations: metadata.annotations as Record<string, string> | undefined,
        raw: d,
      };

      if (d.kind === 'Deployment' || d.kind === 'StatefulSet' || d.kind === 'DaemonSet') {
        resource.replicas = spec.replicas as number | undefined;
        const template = (spec.template as Record<string, unknown>) || {};
        const templateSpec = (template.spec as Record<string, unknown>) || {};
        resource.containers = extractContainers(templateSpec);
      }

      if (d.kind === 'Pod') {
        resource.containers = extractContainers(spec);
      }

      if (d.kind === 'Service') {
        resource.serviceType = spec.type as string | undefined;
        resource.servicePorts = ((spec.ports as Array<Record<string, unknown>>) || []).map((p) => ({
          port: p.port as number,
          targetPort: p.targetPort as number | undefined,
          protocol: p.protocol as string | undefined,
        }));
      }

      docs.push(resource);
    });

    if (docs.length === 0) return { valid: false, error: 'No valid Kubernetes resources found' };

    const kinds: Record<string, number> = {};
    for (const r of docs) {
      kinds[r.kind] = (kinds[r.kind] || 0) + 1;
    }

    return { valid: true, resources: docs, stats: { total: docs.length, kinds } };
  } catch (e: unknown) {
    return { valid: false, error: (e as Error).message };
  }
}
