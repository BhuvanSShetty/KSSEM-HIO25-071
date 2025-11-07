const BASE = import.meta.env.VITE_API_BASE || 'http://localhost:5000';

export async function fetchStatus() {
  const r = await fetch(`${BASE}/api/status/30days`);
  if (!r.ok) throw new Error('failed');
  return r.json();
}

export async function ingestSample(sample) {
  const r = await fetch(`${BASE}/api/ingest`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ payload: sample })
  });
  return r.json();
}
