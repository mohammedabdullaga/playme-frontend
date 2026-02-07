import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API from "../api/api";

export default function Devices() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);

  useEffect(() => {
    API.get("/admin/devices").then(res => setDevices(res.data));
  }, []);

  const deactivate = async (mac) => {
    await API.post(`/admin/devices/${mac}/deactivate`);
    setDevices(devices.map(d => d.mac_address === mac ? { ...d, active: false } : d));
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
    <div className="panel">
      <h2>Devices ({devices.length})</h2>
      <div className="table-wrapper">
        <table>
          <thead>
            <tr>
              <th>MAC</th>
              <th>Email</th>
              <th>Type</th>
              <th>Expires</th>
              <th>Active</th>
              <th>Action</th>
            </tr>
          </thead>
          <tbody>
            {devices.map(d => {
              const expired = isExpired(d.expires_at);
              return (
                <tr key={d.mac_address} className={expired ? "inactive-row" : d.active ? "active-row" : "inactive-row"}>
                  <td className="mono">{d.mac_address}</td>
                  <td>{d.email}</td>
                  <td>
                    <span className={`badge ${d.is_trial ? "badge-trial" : "badge-paid"}`}>
                      {d.is_trial ? "Trial" : "Paid"}
                    </span>
                    {expired && <span className="badge badge-expired" style={{ marginLeft: "4px" }}>Expired</span>}
                  </td>
                  <td>
                    {formatTime(d.expires_at)}
                    {expired && <span style={{ color: "#dc2626", fontWeight: 600, marginLeft: "4px" }}>✕</span>}
                  </td>
                  <td><span className={`status ${d.active ? "status-active" : "status-inactive"}`}>{d.active ? "✓" : "✗"}</span></td>
                  <td>
                    {d.active && (
                      <button className="btn-danger btn-sm" onClick={() => deactivate(d.mac_address)}>
                        Deactivate
                      </button>
                    )}
                    {d.is_trial && d.active && !expired && (
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
              );
            })}
          </tbody>
        </table>
      </div>
    </div>
  );
}
