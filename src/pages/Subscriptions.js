import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { adminGetDevices, adminDeactivateDevice } from "../api/api";

export default function Subscriptions() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [query, setQuery] = useState("");
  const [status, setStatus] = useState("all");
  const [sort, setSort] = useState("expires_asc");

  useEffect(() => {
    let mounted = true;
    adminGetDevices()
      .then((res) => {
        if (mounted) setDevices(res.data || []);
      })
      .catch(() => {});
    return () => (mounted = false);
  }, []);

  const filtered = useMemo(() => {
    let arr = (devices || []).slice();
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter(
        (d) => (d.mac_address || "").toLowerCase().includes(q) || (d.email || "").toLowerCase().includes(q)
      );
    }
    if (status === "active") arr = arr.filter((d) => d.active);
    if (status === "expired") arr = arr.filter((d) => !d.active);
    if (status === "trial") arr = arr.filter((d) => d.is_trial);
    if (sort === "expires_asc") arr.sort((a, b) => new Date(a.expires_at) - new Date(b.expires_at));
    if (sort === "expires_desc") arr.sort((a, b) => new Date(b.expires_at) - new Date(a.expires_at));
    return arr;
  }, [devices, query, status, sort]);

  const users = useMemo(() => {
    const map = {};
    (devices || []).forEach((d) => {
      const e = d.email || "(no email)";
      if (!map[e]) map[e] = { email: e, count: 0, active: 0 };
      map[e].count += 1;
      if (d.active) map[e].active += 1;
    });
    return Object.values(map);
  }, [devices]);

  const deactivate = async (mac) => {
    try {
      await adminDeactivateDevice(mac);
      setDevices((ds) => ds.map((d) => (d.mac_address === mac ? { ...d, active: false } : d)));
    } catch (e) {
      console.error(e);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Subscriptions</h2>
        <p className="text-sm text-slate-500">Filter and manage subscription devices with quick action controls.</p>
      </div>

      <div className="filters mt-6">
        <input
          placeholder="Search by MAC or email"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={status} onChange={(e) => setStatus(e.target.value)}>
          <option value="all">All</option>
          <option value="active">Active</option>
          <option value="expired">Expired</option>
          <option value="trial">Trial</option>
        </select>
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="expires_asc">Expires ↑</option>
          <option value="expires_desc">Expires ↓</option>
        </select>
      </div>

      <div className="mt-6 subscriptions-layout grid gap-6">
        <section className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
          <div className="mb-4 flex items-center justify-between">
            <h3 className="text-lg font-semibold text-slate-900">Devices ({filtered.length})</h3>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-left text-slate-500 uppercase tracking-[0.15em] text-[11px]">
                  <th className="px-4 py-3">MAC</th>
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Type</th>
                  <th className="px-4 py-3">First Seen</th>
                  <th className="px-4 py-3">Expires</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.mac_address} className={d.active ? "active-row" : "inactive-row"}>
                    <td className="px-4 py-4 font-mono text-slate-700">{d.mac_address}</td>
                    <td className="px-4 py-4 text-slate-700">{d.email}</td>
                    <td className="px-4 py-4"><span className={`badge ${d.is_trial ? "badge-trial" : "badge-paid"}`}>{d.is_trial ? "Trial" : "Paid"}</span></td>
                    <td className="px-4 py-4 text-slate-700">{formatTime(d.created_at)}</td>
                    <td className="px-4 py-4 text-slate-700">{formatTime(d.expires_at)}</td>
                    <td className="px-4 py-4"><span className={`status ${d.active ? "status-active" : "status-inactive"}`}>{d.active ? "✓" : "✗"}</span></td>
                    <td className="px-4 py-4 space-x-2">
                      {d.active && (
                        <button className="btn-danger btn-sm" onClick={() => deactivate(d.mac_address)}>
                          Deactivate
                        </button>
                      )}
                      {d.is_trial && d.active && (
                        <button
                          className="btn-success btn-sm"
                          onClick={() => navigate(`/activate?mac=${d.mac_address}&email=${encodeURIComponent(d.email)}`)}
                        >
                          Activate
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
          <div className="mb-4">
            <h3 className="text-lg font-semibold text-slate-900">Users ({users.length})</h3>
          </div>
          <div className="overflow-x-auto rounded-3xl border border-slate-200 bg-white shadow-sm">
            <table className="min-w-full border-collapse text-sm">
              <thead>
                <tr className="bg-slate-100 text-left text-slate-500 uppercase tracking-[0.15em] text-[11px]">
                  <th className="px-4 py-3">Email</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Active</th>
                  <th className="px-4 py-3">Inactive</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email}>
                    <td className="px-4 py-4 text-slate-700">{u.email}</td>
                    <td className="px-4 py-4 text-slate-700">{u.count}</td>
                    <td className="px-4 py-4"><span className="status-badge active">{u.active}</span></td>
                    <td className="px-4 py-4"><span className="status-badge inactive">{u.count - u.active}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </div>
    </div>
  );
}
