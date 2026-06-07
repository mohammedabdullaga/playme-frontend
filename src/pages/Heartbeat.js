import { useEffect, useMemo, useState } from "react";
import API from "../api/api";

export default function Heartbeat() {
  const [heartbeats, setHeartbeats] = useState([]);
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState("last_seen_desc");

  useEffect(() => {
    loadHeartbeats();
  }, []);

  const loadHeartbeats = async () => {
    try {
      const res = await API.get("/admin/heartbeats");
      setHeartbeats(res.data.heartbeats || []);
    } catch (e) {
      console.error("Failed to load heartbeats:", e);
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  const getTimeAgo = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    const now = new Date();
    const diff = now - d;
    const minutes = Math.floor(diff / 60000);
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(diff / 86400000);

    if (minutes < 1) return "just now";
    if (minutes < 60) return `${minutes}m ago`;
    if (hours < 24) return `${hours}h ago`;
    return `${days}d ago`;
  };

  const filtered = useMemo(() => {
    let arr = (heartbeats || []).slice();
    if (query) {
      const q = query.toLowerCase();
      arr = arr.filter((d) => (d.mac || "").toLowerCase().includes(q));
    }

    if (sort === "last_seen_desc") arr.sort((a, b) => new Date(b.last_seen) - new Date(a.last_seen));
    if (sort === "last_seen_asc") arr.sort((a, b) => new Date(a.last_seen) - new Date(b.last_seen));
    if (sort === "first_seen_desc") arr.sort((a, b) => new Date(b.first_seen) - new Date(a.first_seen));
    if (sort === "first_seen_asc") arr.sort((a, b) => new Date(a.first_seen) - new Date(b.first_seen));

    return arr;
  }, [heartbeats, query, sort]);

  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
      <h2 className="text-2xl font-semibold text-slate-900">Device Heartbeat</h2>

      <div className="filters mt-6">
        <input
          placeholder="Search by MAC"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        />
        <select
          value={sort}
          onChange={(e) => setSort(e.target.value)}
          className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
        >
          <option value="last_seen_desc">Last Seen ↓</option>
          <option value="last_seen_asc">Last Seen ↑</option>
          <option value="first_seen_desc">First Seen ↓</option>
          <option value="first_seen_asc">First Seen ↑</option>
        </select>
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-500 uppercase tracking-[0.15em] text-[11px]">
              <th className="px-4 py-3">MAC</th>
              <th className="px-4 py-3">First Seen</th>
              <th className="px-4 py-3">Last Seen</th>
              <th className="px-4 py-3">Time Ago</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="4" className="px-4 py-8 text-center text-slate-500">
                  No devices found
                </td>
              </tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.mac}>
                  <td className="px-4 py-4 font-mono text-slate-700">{d.mac}</td>
                  <td className="px-4 py-4 text-slate-700">{formatTime(d.first_seen)}</td>
                  <td className="px-4 py-4 text-slate-700">{formatTime(d.last_seen)}</td>
                  <td className="px-4 py-4 text-slate-700"><span className="font-semibold">{getTimeAgo(d.last_seen)}</span></td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div className="mt-6 rounded-2xl bg-sky-50 border border-sky-200 p-4 text-sm text-slate-700">
        <strong>Total Devices:</strong> {filtered.length}
      </div>
    </div>
  );
}
