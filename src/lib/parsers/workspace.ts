// Parses Postman Collection v2.0/v2.1 and Insomnia Export v4 into a flat
// list of WorkspaceTab objects that the API Tester can consume.

export type HttpMethod = 'GET' | 'POST' | 'PUT' | 'PATCH' | 'DELETE' | 'HEAD' | 'OPTIONS';
export type BodyType   = 'json' | 'text' | 'form';
export type AuthType   = 'none' | 'bearer' | 'basic';

const VALID_METHODS = new Set<string>(['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'HEAD', 'OPTIONS']);

function uid(): string {
  return Math.random().toString(36).slice(2, 9);
}

function safeMethod(raw: string): HttpMethod {
  const upper = raw.toUpperCase();
  return VALID_METHODS.has(upper) ? (upper as HttpMethod) : 'GET';
}

function tryPrettyJson(s: string): string {
  try { return JSON.stringify(JSON.parse(s), null, 2); } catch { return s; }
}

export interface KVRow {
  id: string;
  enabled: boolean;
  key: string;
  value: string;
}

export interface AuthConfig {
  type: AuthType;
  token: string;
  username: string;
  password: string;
}

export interface WorkspaceTab {
  id: string;
  name: string;
  url: string;
  method: HttpMethod;
  params: KVRow[];
  headers: KVRow[];
  body: string;
  bodyType: BodyType;
  auth: AuthConfig;
}

export interface WorkspaceMeta {
  name: string;
  source: 'postman' | 'insomnia' | 'unknown';
  total: number;
}

export interface ParsedWorkspace {
  tabs: WorkspaceTab[];
  meta: WorkspaceMeta;
}

// ─── URL helpers ─────────────────────────────────────────────────────────────

function resolvePostmanUrl(raw: unknown): string {
  if (typeof raw === 'string') return raw;
  if (raw && typeof raw === 'object') {
    const u = raw as Record<string, unknown>;
    if (typeof u.raw === 'string') return u.raw;
    // Reconstruct from parts
    const protocol = typeof u.protocol === 'string' ? u.protocol : 'https';
    const host = Array.isArray(u.host) ? (u.host as string[]).join('.') : '';
    const path = Array.isArray(u.path) ? (u.path as string[]).join('/') : '';
    return host ? `${protocol}://${host}/${path}` : '';
  }
  return '';
}

function resolvePostmanParams(raw: unknown): KVRow[] {
  // Query params embedded in the URL object
  if (!raw || typeof raw !== 'object') return [];
  const u = raw as Record<string, unknown>;
  if (!Array.isArray(u.query)) return [];
  return (u.query as Array<Record<string, unknown>>)
    .filter(q => !q.disabled)
    .map(q => ({ id: uid(), enabled: true, key: String(q.key ?? ''), value: String(q.value ?? '') }));
}

// ─── Postman ─────────────────────────────────────────────────────────────────

function postmanAuth(raw: unknown): AuthConfig {
  const none: AuthConfig = { type: 'none', token: '', username: '', password: '' };
  if (!raw || typeof raw !== 'object') return none;
  const a = raw as Record<string, unknown>;
  if (a.type === 'bearer' && Array.isArray(a.bearer)) {
    const token = String((a.bearer as Array<Record<string, unknown>>)
      .find(b => b.key === 'token')?.value ?? '');
    return { type: 'bearer', token, username: '', password: '' };
  }
  if (a.type === 'basic' && Array.isArray(a.basic)) {
    const list = a.basic as Array<Record<string, unknown>>;
    return {
      type: 'basic',
      token: '',
      username: String(list.find(b => b.key === 'username')?.value ?? ''),
      password: String(list.find(b => b.key === 'password')?.value ?? ''),
    };
  }
  return none;
}

function postmanItemToTab(item: Record<string, unknown>): WorkspaceTab | null {
  const req = item.request as Record<string, unknown> | undefined;
  if (!req) return null;

  const method  = safeMethod(String(req.method ?? 'GET'));
  const url     = resolvePostmanUrl(req.url);
  const params  = resolvePostmanParams(req.url);

  const rawHeaders = Array.isArray(req.header) ? req.header as Array<Record<string, unknown>> : [];
  const headers: KVRow[] = rawHeaders
    .filter(h => !h.disabled)
    .map(h => ({ id: uid(), enabled: true, key: String(h.key ?? ''), value: String(h.value ?? '') }));

  let body     = '{\n  \n}';
  let bodyType: BodyType = 'json';

  if (req.body && typeof req.body === 'object') {
    const b = req.body as Record<string, unknown>;
    if (b.mode === 'raw' && typeof b.raw === 'string') {
      body = tryPrettyJson(b.raw);
      const ct = headers.find(h => h.key.toLowerCase() === 'content-type')?.value ?? '';
      bodyType = ct.includes('text/plain') ? 'text' : 'json';
    } else if (b.mode === 'urlencoded' && Array.isArray(b.urlencoded)) {
      body = (b.urlencoded as Array<Record<string, unknown>>)
        .filter(p => !p.disabled)
        .map(p => `${p.key}=${p.value}`)
        .join('\n');
      bodyType = 'form';
    } else if (b.mode === 'formdata' && Array.isArray(b.formdata)) {
      body = (b.formdata as Array<Record<string, unknown>>)
        .filter(p => !p.disabled)
        .map(p => `${p.key}=${p.value}`)
        .join('\n');
      bodyType = 'form';
    }
  }

  return {
    id: uid(),
    name: String(item.name ?? 'Request'),
    url, method, params,
    headers: headers.length ? headers : [
      { id: uid(), enabled: true, key: 'Content-Type', value: 'application/json' },
      { id: uid(), enabled: true, key: 'Accept',       value: 'application/json' },
    ],
    body, bodyType,
    auth: postmanAuth(req.auth),
  };
}

function flattenPostmanItems(items: unknown[], cap: number, collected: WorkspaceTab[] = []): WorkspaceTab[] {
  for (const raw of items) {
    if (collected.length >= cap) break;
    const item = raw as Record<string, unknown>;
    if (Array.isArray(item.item)) {
      // Folder — recurse
      flattenPostmanItems(item.item, cap, collected);
    } else {
      const tab = postmanItemToTab(item);
      if (tab) collected.push(tab);
    }
  }
  return collected;
}

// ─── Insomnia ─────────────────────────────────────────────────────────────────

function insomniaAuth(raw: unknown): AuthConfig {
  const none: AuthConfig = { type: 'none', token: '', username: '', password: '' };
  if (!raw || typeof raw !== 'object') return none;
  const a = raw as Record<string, unknown>;
  if (a.type === 'bearer')
    return { type: 'bearer', token: String(a.token ?? ''), username: '', password: '' };
  if (a.type === 'basic')
    return { type: 'basic', token: '', username: String(a.username ?? ''), password: String(a.password ?? '') };
  return none;
}

function insomniaRequestToTab(r: Record<string, unknown>): WorkspaceTab {
  const method = safeMethod(String(r.method ?? 'GET'));
  const url    = String(r.url ?? '');

  const rawHeaders = Array.isArray(r.headers) ? r.headers as Array<Record<string, unknown>> : [];
  const headers: KVRow[] = rawHeaders.map(h => ({
    id: uid(), enabled: !h.disabled, key: String(h.name ?? ''), value: String(h.value ?? ''),
  }));

  let body: string   = '{\n  \n}';
  let bodyType: BodyType = 'json';
  if (r.body && typeof r.body === 'object') {
    const b = r.body as Record<string, unknown>;
    if (typeof b.text === 'string') {
      body     = tryPrettyJson(b.text);
      bodyType = String(b.mimeType ?? '').includes('text/plain') ? 'text' : 'json';
    } else if (Array.isArray(b.params)) {
      body     = (b.params as Array<Record<string, unknown>>).map(p => `${p.name}=${p.value}`).join('\n');
      bodyType = 'form';
    }
  }

  const rawParams = Array.isArray(r.parameters) ? r.parameters as Array<Record<string, unknown>> : [];
  const params: KVRow[] = rawParams.map(p => ({
    id: uid(), enabled: !p.disabled, key: String(p.name ?? ''), value: String(p.value ?? ''),
  }));

  return {
    id: uid(),
    name: String(r.name ?? 'Request'),
    url, method, params,
    headers: headers.length ? headers : [
      { id: uid(), enabled: true, key: 'Content-Type', value: 'application/json' },
      { id: uid(), enabled: true, key: 'Accept',       value: 'application/json' },
    ],
    body, bodyType,
    auth: insomniaAuth(r.authentication),
  };
}

// ─── Public API ───────────────────────────────────────────────────────────────

const MAX_TABS = 120;

export function parseWorkspace(json: unknown): ParsedWorkspace {
  const j = json as Record<string, unknown>;

  // Postman Collection v2.0 / v2.1
  if (j.info && Array.isArray(j.item)) {
    const info = j.info as Record<string, string>;
    const tabs = flattenPostmanItems(j.item, MAX_TABS);
    return {
      tabs,
      meta: { name: info.name || 'Postman Collection', source: 'postman', total: tabs.length },
    };
  }

  // Insomnia Export v4
  if (Number(j.__export_format) === 4 && Array.isArray(j.resources)) {
    const requests = (j.resources as Array<Record<string, unknown>>).filter(r => r._type === 'request');
    const tabs = requests.slice(0, MAX_TABS).map(insomniaRequestToTab);
    return {
      tabs,
      meta: { name: 'Insomnia Workspace', source: 'insomnia', total: tabs.length },
    };
  }

  throw new Error('Unsupported format. Import a Postman Collection (v2.0/v2.1) or Insomnia Export (v4) JSON file.');
}
