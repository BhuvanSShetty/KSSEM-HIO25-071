import { useEffect, useState } from 'react';
import { fetchStatus, ingestSample } from './api.js';
import './styles.css';

export default function App() {
  const [days, setDays] = useState([]);
  const [loading, setLoading] = useState(true);
  const [ingestMsg, setIngestMsg] = useState('');

  async function load() {
    setLoading(true);
    try {
      const data = await fetchStatus();
      setDays(data.days || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => { load(); }, []);

  async function addFake() {
    const sample = {
      deviceId: 'sensor-001',
      farmId: 'farm-abc',
      metric: 'soilMoisture',
      value: Math.round(30 + Math.random()*20),
      unit: '%',
      timestamp: new Date().toISOString()
    };
    const resp = await ingestSample(sample);
    setIngestMsg(JSON.stringify(resp));
    await load();
  }

  return (
    <div className="max-w-4xl mx-auto p-6">
      <h1 className="text-2xl font-bold mb-4">Data Integrity (Last 30 Days)</h1>

      <div className="mb-4">
        <button onClick={addFake} className="px-4 py-2 rounded bg-black text-white hover:opacity-90">
          Ingest Sample Reading
        </button>
        {ingestMsg && (
          <pre className="mt-2 p-3 bg-slate-100 rounded text-xs overflow-auto">{ingestMsg}</pre>
        )}
      </div>

      {loading ? (
        <div>Loading…</div>
      ) : (
        <div className="grid grid-cols-5 gap-3">
          {days.map((d) => (
            <div key={d.dayKey}
                 className={`p-3 rounded border ${
                   d.anchored
                     ? (d.quorumMet ? 'border-green-500 bg-green-50' : 'border-yellow-500 bg-yellow-50')
                     : 'border-slate-300 bg-white'
                 }`}>
              <div className="font-mono text-sm">{d.dayKey}</div>
              <div className="text-sm mt-1">
                {d.anchored ? (d.quorumMet ? 'Anchored ✅' : 'Anchored (no quorum) ⚠️') : 'Not anchored'}
              </div>
              {d.anchored && <div className="text-xs text-slate-600">Signatures: {d.signatures}</div>}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
