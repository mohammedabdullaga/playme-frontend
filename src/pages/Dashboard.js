import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { adminGetDevices, adminGetHeartbeats } from "../api/api";

export default function Dashboard() {
  const [devices, setDevices] = useState([]);
  const [heartbeats, setHeartbeats] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const loadStats = async () => {
      setLoading(true);
      setError(null);

      try {
        const [devicesRes, heartbeatsRes] = await Promise.all([
          adminGetDevices(),
          adminGetHeartbeats(),
        ]);

        setDevices(devicesRes.data || []);
        setHeartbeats(heartbeatsRes.data.heartbeats || []);
      } catch (err) {
        setError(
          err.response?.data?.detail || err.message || "Failed to load dashboard data"
        );
      } finally {
        setLoading(false);
      }
    };

    loadStats();
  }, []);

  const activeSessions = heartbeats.length;
  const pendingActivations = devices.filter((device) => !device.active).length;

  return (
    <div className="panel-card">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Manage devices, tokens, subscriptions, and runtime settings from one panel.</p>
        </div>
        <span className="status-pill status-pill-success">Online</span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}

      <div className="card-grid">
        <div className="metric-card">
          <p className="metric-label">Active Sessions</p>
          <p className="metric-value">{loading ? "..." : activeSessions}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Devices</p>
          <p className="metric-value">{loading ? "..." : devices.length}</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Pending Activations</p>
          <p className="metric-value">{loading ? "..." : pendingActivations}</p>
        </div>
      </div>

      <div className="action-panel">
        <div>
          <h3 className="token-panel-title">Quick Actions</h3>
          <p className="token-panel-subtitle">Jump directly to the pages you use most often.</p>
        </div>
        <div className="action-grid">
          <Link className="button button-secondary" to="/subscriptions">Subscriptions</Link>
          <Link className="button button-secondary" to="/activate">Activate Device</Link>
          <Link className="button button-secondary" to="/proxy">Proxy Settings</Link>
        </div>
      </div>
    </div>
  );
}
