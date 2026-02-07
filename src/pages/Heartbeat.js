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
    <div className="panel">
      <h2>Device Heartbeat</h2>

      <div className="filters">
        <input
          placeholder="Search by MAC"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
        />
        <select value={sort} onChange={(e) => setSort(e.target.value)}>
          <option value="last_seen_desc">Last Seen ↓</option>
          <option value="last_seen_asc">Last Seen ↑</option>
          <option value="first_seen_desc">First Seen ↓</option>
          <option value="first_seen_asc">First Seen ↑</option>
        </select>
      </div>

      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>MAC</th>
              <th>First Seen</th>
              <th>Last Seen</th>
              <th>Time Ago</th>
            </tr>
          </thead>
          <tbody>
            {filtered.length === 0 ? (
              <tr>
                <td colSpan="4" style={{ textAlign: "center", color: "#9ca3af" }}>
                  No devices found
                </td>
              </tr>
            ) : (
              filtered.map((d) => (
                <tr key={d.mac}>
                  <td className="mono">{d.mac}</td>
                  <td>{formatTime(d.first_seen)}</td>
                  <td>{formatTime(d.last_seen)}</td>
                  <td>
                    <span style={{ fontWeight: 600, color: "#374151" }}>
                      {getTimeAgo(d.last_seen)}
                    </span>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      <div style={{ marginTop: "16px", padding: "12px", background: "#f0f9ff", border: "1px solid #bfdbfe", borderRadius: "6px" }}>
        <p style={{ margin: "0", fontSize: "12px", color: "#1e40af" }}>
          <strong>Total Devices:</strong> {filtered.length}
        </p>
      </div>
    </div>
  );
}
