export interface JwtHeader {
  alg: string;
  typ: string;
  [key: string]: unknown;
}

export interface JwtPayload {
  sub?: string;
  iss?: string;
  aud?: string | string[];
  exp?: number;
  iat?: number;
  nbf?: number;
  jti?: string;
  [key: string]: unknown;
}

export interface JwtParseResult {
  valid: boolean;
  header?: JwtHeader;
  payload?: JwtPayload;
  signature?: string;
  rawParts?: [string, string, string];
  error?: string;
  status?: 'active' | 'expired' | 'not-yet-valid' | 'no-expiry';
  expiresIn?: string;
  issuedAgo?: string;
}

function base64UrlDecode(str: string): string {
  const base64 = str.replace(/-/g, '+').replace(/_/g, '/');
  const padded = base64.padEnd(base64.length + (4 - (base64.length % 4)) % 4, '=');
  return atob(padded);
}

function formatRelativeTime(seconds: number): string {
  const abs = Math.abs(seconds);
  if (abs < 60) return `${abs}s`;
  if (abs < 3600) return `${Math.floor(abs / 60)}m`;
  if (abs < 86400) return `${Math.floor(abs / 3600)}h`;
  return `${Math.floor(abs / 86400)}d`;
}

export function parseJwt(token: string): JwtParseResult {
  const trimmed = token.trim();
  if (!trimmed) return { valid: false, error: 'Token is empty' };

  const parts = trimmed.split('.');
  if (parts.length !== 3) {
    return { valid: false, error: `JWT must have 3 parts separated by dots, got ${parts.length}` };
  }

  try {
    const header = JSON.parse(base64UrlDecode(parts[0])) as JwtHeader;
    const payload = JSON.parse(base64UrlDecode(parts[1])) as JwtPayload;
    const signature = parts[2];

    const now = Math.floor(Date.now() / 1000);
    let status: JwtParseResult['status'] = 'no-expiry';
    let expiresIn: string | undefined;
    let issuedAgo: string | undefined;

    if (payload.exp !== undefined) {
      const diff = payload.exp - now;
      if (diff < 0) {
        status = 'expired';
        expiresIn = `Expired ${formatRelativeTime(diff)} ago`;
      } else if (payload.nbf !== undefined && now < payload.nbf) {
        status = 'not-yet-valid';
        expiresIn = `Valid in ${formatRelativeTime(payload.nbf - now)}`;
      } else {
        status = 'active';
        expiresIn = `Expires in ${formatRelativeTime(diff)}`;
      }
    }

    if (payload.iat !== undefined) {
      const diff = now - payload.iat;
      issuedAgo = `Issued ${formatRelativeTime(diff)} ago`;
    }

    return {
      valid: true,
      header,
      payload,
      signature,
      rawParts: [parts[0], parts[1], parts[2]],
      status,
      expiresIn,
      issuedAgo,
    };
  } catch {
    return { valid: false, error: 'Failed to decode token — invalid Base64 or JSON' };
  }
}
