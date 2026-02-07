import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { adminGetDevices, adminDeactivateDevice } from "../api/api";

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
      if (!map[e]) map[e] = { email: e, count: 0, active: 0, devices: [] };
      map[e].count += 1;
      if (d.active) map[e].active += 1;
      map[e].devices.push(d);
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
    <div className="panel">
      <h2>Subscriptions</h2>

      <div className="filters">
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

      <div className="grid">
        <div className="grid-col">
          <h3>Devices ({filtered.length})</h3>
          <div className="table-wrapper">
            <table className="devices-table">
              <thead>
                <tr>
                  <th>MAC</th>
                  <th>Email</th>
                  <th>Token ID</th>
                  <th>Type</th>
                  <th>First Seen</th>
                  <th>Last Seen</th>
                  <th>Expires</th>
                  <th>Active</th>
                  <th>Action</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((d) => (
                  <tr key={d.mac_address} className={d.active ? "active-row" : "inactive-row"}>
                    <td className="mono">{d.mac_address}</td>
                    <td>{d.email}</td>
                    <td className="mono">{d.token_id || "-"}</td>
                    <td><span className={`badge ${d.is_trial ? "badge-trial" : "badge-paid"}`}>{d.is_trial ? "Trial" : "Paid"}</span></td>
                    <td>{formatTime(d.created_at)}</td>
                    <td>{formatTime(d.last_seen)}</td>
                    <td>{formatTime(d.expires_at)}</td>
                    <td><span className={`status ${d.active ? "status-active" : "status-inactive"}`}>{d.active ? "✓" : "✗"}</span></td>
                    <td>
                      {d.active && (
                        <button className="btn-danger btn-sm" onClick={() => deactivate(d.mac_address)}>
                          Deactivate
                        </button>
                      )}
                      {d.is_trial && d.active && (
                        <button
                          className="btn-success btn-sm"
                          onClick={() => navigate(`/activate?mac=${d.mac_address}&email=${encodeURIComponent(d.email)}`)}
                          style={{ marginLeft: "4px" }}
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
        </div>

        <div className="grid-col">
          <h3>Users ({users.length})</h3>
          <div className="table-wrapper">
            <table className="users-table">
              <thead>
                <tr>
                  <th>Email</th>
                  <th>Total</th>
                  <th>Active</th>
                  <th>Inactive</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr key={u.email}>
                    <td>{u.email}</td>
                    <td>{u.count}</td>
                    <td><span className="status-badge active">{u.active}</span></td>
                    <td><span className="status-badge inactive">{u.count - u.active}</span></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
}
