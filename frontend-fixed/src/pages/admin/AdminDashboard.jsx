import React, { useEffect, useState } from "react";
import { getFarmers, verifyAllFarmers } from "../../lib/api.js";

export default function AdminDashboard() {
  const [farmers, setFarmers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");

  const load = async () => {
    setLoading(true);
    try {
      const data = await getFarmers();
      setFarmers(Array.isArray(data) ? data : data.items || []);
    } catch (e) {
      setMsg(e.message || "Failed to load farmers");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const runVerifyAll = async () => {
    setMsg("Running verify-all...");
    try {
      const res = await verifyAllFarmers();
      setMsg(JSON.stringify(res));
    } catch (e) {
      setMsg(e?.response?.data?.error || "verify-all failed");
    }
  };

  return (
    <div className="space-y-4">
      <div className="card">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold">Admin Dashboard</h2>
            <p className="text-sm text-gray-500">System overview</p>
          </div>
          <button className="btn btn-primary" onClick={runVerifyAll}>Verify All</button>
        </div>
      </div>

      <div className="card">
        <div className="mb-3 font-medium">Farmers ({farmers.length})</div>
        <div className="overflow-auto border rounded-xl">
          <table className="table">
            <thead>
              <tr>
                <th className="th">Name</th>
                <th className="th">Email</th>
                <th className="th">ID</th>
              </tr>
            </thead>
            <tbody>
              {farmers.map((f) => (
                <tr key={f._id} className="border-t">
                  <td className="td">{f.name}</td>
                  <td className="td">{f.email}</td>
                  <td className="td font-mono text-xs">{f._id}</td>
                </tr>
              ))}
              {!farmers.length && (
                <tr>
                  <td className="td" colSpan={3}>
                    {loading ? "Loading…" : "No farmers"}
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {msg && <div className="text-xs text-gray-600 mt-2 break-all">{msg}</div>}
      </div>
    </div>
  );
}
