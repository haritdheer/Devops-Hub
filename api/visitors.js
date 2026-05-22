const KEY = 'dvh:visitors';

export default async function handler(req, res) {
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
  if (req.method === 'OPTIONS') return res.status(200).end();

  const { UPSTASH_REDIS_REST_URL, UPSTASH_REDIS_REST_TOKEN } = process.env;
  if (!UPSTASH_REDIS_REST_URL || !UPSTASH_REDIS_REST_TOKEN) {
    return res.status(503).json({ error: 'Visitor counter not configured' });
  }

  const headers = { Authorization: `Bearer ${UPSTASH_REDIS_REST_TOKEN}` };

  try {
    if (req.method === 'POST') {
      // New visitor — increment the counter
      const r = await fetch(`${UPSTASH_REDIS_REST_URL}/incr/${KEY}`, { method: 'POST', headers });
      const { result } = await r.json();
      return res.json({ count: Number(result) || 0 });
    }

    // Returning visitor — just read the counter
    const r = await fetch(`${UPSTASH_REDIS_REST_URL}/get/${KEY}`, { headers });
    const { result } = await r.json();
    return res.json({ count: Number(result) || 0 });
  } catch {
    return res.status(500).json({ error: 'Redis unavailable' });
  }
}
