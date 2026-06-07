import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="panel-card">
      <div className="page-header">
        <div>
          <h2 className="page-title">Dashboard</h2>
          <p className="page-subtitle">Manage devices, tokens, subscriptions, and runtime settings from one panel.</p>
        </div>
        <span className="status-pill status-pill-success">Online</span>
      </div>

      <div className="card-grid">
        <div className="metric-card">
          <p className="metric-label">Active Sessions</p>
          <p className="metric-value">128</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Devices</p>
          <p className="metric-value">42</p>
        </div>
        <div className="metric-card">
          <p className="metric-label">Pending Activations</p>
          <p className="metric-value">7</p>
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
