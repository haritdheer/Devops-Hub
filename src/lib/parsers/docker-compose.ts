import * as yaml from 'js-yaml';

export interface DockerService {
  name: string;
  image?: string;
  build?: string | { context?: string; dockerfile?: string };
  ports?: string[];
  volumes?: string[];
  environment?: Record<string, string> | string[];
  depends_on?: string[];
  networks?: string[];
  command?: string;
  restart?: string;
}

export interface DockerComposeResult {
  valid: boolean;
  version?: string;
  services?: DockerService[];
  volumes?: string[];
  networks?: string[];
  error?: string;
  stats?: {
    serviceCount: number;
    portCount: number;
    volumeCount: number;
    networkCount: number;
  };
}

export function parseDockerCompose(input: string): DockerComposeResult {
  if (!input.trim()) return { valid: false, error: 'Input is empty' };
  try {
    const parsed = yaml.load(input) as Record<string, unknown>;
    if (!parsed || typeof parsed !== 'object') return { valid: false, error: 'Invalid Docker Compose format' };

    const rawServices = (parsed.services as Record<string, unknown>) || {};
    const services: DockerService[] = Object.entries(rawServices).map(([name, svc]) => {
      const s = (svc as Record<string, unknown>) || {};
      const env = s.environment;
      let environment: Record<string, string> | string[] | undefined;
      if (Array.isArray(env)) {
        environment = env as string[];
      } else if (env && typeof env === 'object') {
        environment = Object.fromEntries(
          Object.entries(env as Record<string, unknown>).map(([k, v]) => [k, String(v)])
        );
      }
      return {
        name,
        image: s.image as string | undefined,
        build: s.build as string | { context?: string; dockerfile?: string } | undefined,
        ports: (s.ports as string[] | undefined) || [],
        volumes: (s.volumes as string[] | undefined) || [],
        environment,
        depends_on: Array.isArray(s.depends_on) ? (s.depends_on as string[]) : s.depends_on ? Object.keys(s.depends_on as object) : [],
        networks: (s.networks as string[] | undefined) || [],
        command: s.command as string | undefined,
        restart: s.restart as string | undefined,
      };
    });

    const volumes = Object.keys((parsed.volumes as Record<string, unknown>) || {});
    const networks = Object.keys((parsed.networks as Record<string, unknown>) || {});
    const portCount = services.reduce((acc, s) => acc + (s.ports?.length || 0), 0);

    return {
      valid: true,
      version: parsed.version as string | undefined,
      services,
      volumes,
      networks,
      stats: { serviceCount: services.length, portCount, volumeCount: volumes.length, networkCount: networks.length },
    };
  } catch (e: unknown) {
    return { valid: false, error: (e as Error).message };
  }
}
