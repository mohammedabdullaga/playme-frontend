import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function Devices() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    API.get("/admin/devices").then((res) => setDevices(res.data));
  }, []);

  const deactivate = async (mac) => {
    await API.post(`/admin/devices/${mac}/deactivate`);
    setDevices(devices.map((d) => (d.mac_address === mac ? { ...d, active: false } : d)));
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Devices ({devices.length})</h2>
        <p className="text-sm text-slate-500">Review active devices, trial status, and activation controls.</p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-500 uppercase tracking-[0.15em] text-[11px]">
              <th className="px-4 py-3">MAC</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => {
              const expired = isExpired(d.expires_at);
              return (
                <tr key={d.mac_address} className={expired ? "inactive-row" : d.active ? "active-row" : "inactive-row"}>
                  <td className="px-4 py-4 font-mono text-slate-700">{d.mac_address}</td>
                  <td className="px-4 py-4 text-slate-700">{d.email}</td>
                  <td className="px-4 py-4">
                    <span className={`badge ${d.is_trial ? "badge-trial" : "badge-paid"}`}>{d.is_trial ? "Trial" : "Paid"}</span>
                    {expired && <span className="badge badge-expired" style={{ marginLeft: 6 }}>Expired</span>}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {formatTime(d.expires_at)}
                    {expired && <span className="text-red-600 font-semibold" style={{ marginLeft: 6 }}>✕</span>}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`status ${d.active ? "status-active" : "status-inactive"}`}>{d.active ? "✓" : "✗"}</span>
                  </td>
                  <td className="px-4 py-4 space-x-2">
                    {d.active && (
                      <button className="btn-danger btn-sm" onClick={() => deactivate(d.mac_address)}>
                        Deactivate
                      </button>
                    )}
                    {d.is_trial && d.active && !expired && (
                      <button
                        className="btn-success btn-sm"
                        onClick={() => navigate(`/activate?mac=${d.mac_address}&email=${encodeURIComponent(d.email)}`)}
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
