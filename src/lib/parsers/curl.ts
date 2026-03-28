export interface CurlParseResult {
  valid: boolean;
  method?: string;
  url?: string;
  headers?: Record<string, string>;
  body?: string;
  error?: string;
}

export interface ConvertedOutput {
  fetch: string;
  axios: string;
}

export function parseCurl(input: string): CurlParseResult {
  const trimmed = input.trim();
  if (!trimmed) return { valid: false, error: 'Input is empty' };
  if (!trimmed.toLowerCase().startsWith('curl')) return { valid: false, error: 'Must start with "curl"' };

  try {
    // Normalize line continuations
    const normalized = trimmed.replace(/\\\n\s*/g, ' ').replace(/\s+/g, ' ');

    // Extract URL (first bare arg after curl, or -X METHOD url pattern)
    const urlMatch = normalized.match(/curl\s+(?:-X\s+\w+\s+)?['"]?([^'"\\s-][^\s'"]*|'[^']*'|"[^"]*")['"]?/);
    let url = urlMatch?.[1]?.replace(/^['"]|['"]$/g, '') || '';

    // Also try extracting URL more broadly
    const urlMatch2 = normalized.match(/(?:curl\s+.*?)\s+['"]?(https?:\/\/[^\s'"]+)['"]?/);
    if (!url.startsWith('http') && urlMatch2?.[1]) url = urlMatch2[1];

    if (!url) return { valid: false, error: 'Could not extract URL from cURL command' };

    // Method
    const methodMatch = normalized.match(/-X\s+([A-Z]+)/i);
    let method = methodMatch?.[1]?.toUpperCase() || 'GET';

    // Headers
    const headers: Record<string, string> = {};
    const headerMatches = normalized.matchAll(/-H\s+['"]([^'"]+)['"]/g);
    for (const m of headerMatches) {
      const [k, ...vParts] = m[1].split(':');
      if (k && vParts.length) headers[k.trim()] = vParts.join(':').trim();
    }

    // Body
    const bodyMatch = normalized.match(/(?:--data-raw|--data|-d)\s+['"](.+?)['"](?:\s|$)/);
    const body = bodyMatch?.[1];

    if (body && method === 'GET') method = 'POST';

    return { valid: true, method, url, headers, body };
  } catch (e: unknown) {
    return { valid: false, error: (e as Error).message };
  }
}

export function convertToFetch(parsed: CurlParseResult): string {
  if (!parsed.valid || !parsed.url) return '';
  const { method, url, headers, body } = parsed;
  const opts: string[] = [`  method: '${method}'`];
  if (headers && Object.keys(headers).length > 0) {
    const headerStr = Object.entries(headers)
      .map(([k, v]) => `    '${k}': '${v}'`)
      .join(',\n');
    opts.push(`  headers: {\n${headerStr}\n  }`);
  }
  if (body) opts.push(`  body: ${JSON.stringify(body)}`);
  const optsStr = opts.length > 0 ? `, {\n${opts.join(',\n')}\n}` : '';
  return `const response = await fetch('${url}'${optsStr});\nconst data = await response.json();\nconsole.log(data);`;
}

export function convertToAxios(parsed: CurlParseResult): string {
  if (!parsed.valid || !parsed.url) return '';
  const { method, url, headers, body } = parsed;
  const config: string[] = [];
  if (headers && Object.keys(headers).length > 0) {
    const headerStr = Object.entries(headers)
      .map(([k, v]) => `    '${k}': '${v}'`)
      .join(',\n');
    config.push(`  headers: {\n${headerStr}\n  }`);
  }
  const methodLower = (method || 'get').toLowerCase();
  if (body) {
    const configStr = config.length > 0 ? `, {\n${config.join(',\n')}\n}` : '';
    return `const { data } = await axios.${methodLower}(\n  '${url}',\n  ${JSON.stringify(body)}${configStr}\n);\nconsole.log(data);`;
  }
  const configStr = config.length > 0 ? `, {\n${config.join(',\n')}\n}` : '';
  return `const { data } = await axios.${methodLower}('${url}'${configStr});\nconsole.log(data);`;
}
