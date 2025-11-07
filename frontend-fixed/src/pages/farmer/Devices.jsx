import React, { useEffect, useState } from 'react';
import { addDevice, deleteDevice, getDevices } from '../../lib/api.js';
import { useAuth } from '../../state/AuthContext.jsx';

export default function Devices() {
  const { user } = useAuth();
  const farmerId = user?.farmerId || user?.id; // backend may return either "farmerId" or "_id"
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({ deviceId: '', name: '', location: '' });
  const [msg, setMsg] = useState('');

  const load = async () => {
    setLoading(true);
    try {
      const data = await getDevices(farmerId);
      const arr = Array.isArray(data) ? data : (data.items || []);
      setList(arr);
    } catch (e) {
      setMsg(e.message || 'Failed to fetch devices');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (farmerId) load();
  }, [farmerId]);

  const submit = async (e) => {
    e.preventDefault();
    setMsg('');
    try {
      await addDevice({ ...form, farmerId });
      setForm({ deviceId: '', name: '', location: '' });
      await load();
      setMsg('Device added successfully');
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Add failed');
    }
  };

  const del = async (id) => {
    if (!confirm('Delete this device?')) return;
    try {
      await deleteDevice(id);
      await load();
    } catch (e) {
      setMsg(e?.response?.data?.error || 'Delete failed');
    }
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <h2 className="text-xl font-semibold mb-2">Add Device</h2>

        <form onSubmit={submit} className="grid grid-cols-1 md:grid-cols-4 gap-3">
          <input
            className="input"
            placeholder="Device ID"
            value={form.deviceId}
            onChange={(e) => setForm({ ...form, deviceId: e.target.value })}
            required
          />
          <input
            className="input"
            placeholder="Name"
            value={form.name}
            onChange={(e) => setForm({ ...form, name: e.target.value })}
          />
          <input
            className="input"
            placeholder="Location"
            value={form.location}
            onChange={(e) => setForm({ ...form, location: e.target.value })}
          />
          <button className="btn btn-primary">Add</button>
        </form>

        {msg && <div className="text-xs text-gray-600 mt-2 break-all">{msg}</div>}
      </div>

      <div className="card">
        <div className="mb-3 font-medium">Your Devices ({list.length})</div>

        <div className="overflow-auto border rounded-xl">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Device ID</th>
                <th className="th">Name</th>
                <th className="th">Location</th>
                <th className="th">Actions</th>
              </tr>
            </thead>
            <tbody>
              {list.map((d) => (
                <tr key={d._id} className="border-t">
                  <td className="td font-mono text-xs">{d.deviceId}</td>
                  <td className="td">{d.name || '-'}</td>
                  <td className="td">{d.location || '-'}</td>
                  <td className="td">
                    <button className="btn btn-ghost text-sm" onClick={() => del(d._id)}>
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
              {!list.length && (
                <tr>
                  <td className="td" colSpan={4}>
                    {loading ? 'Loading…' : 'No devices yet'}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
