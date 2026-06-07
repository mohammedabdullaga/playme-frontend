import { Link } from "react-router-dom";

export default function Dashboard() {
  return (
    <div className="panel">
      <div className="dashboard-header">
        <div>
          <h2>Playme Admin Panel</h2>
          <p>Welcome to the Playme Admin Dashboard. Use the menu to manage device subscriptions, activation tokens, devices, and proxy configuration.</p>
        </div>
        <span className="status-badge active">Online</span>
      </div>

      <div className="card-grid">
        <div className="status-card">
          <p className="card-label">Active Sessions</p>
          <p className="card-value">128</p>
        </div>
        <div className="status-card">
          <p className="card-label">Devices</p>
          <p className="card-value">42</p>
        </div>
        <div className="status-card">
          <p className="card-label">Pending Activations</p>
          <p className="card-value">7</p>
        </div>
      </div>

      <div className="panel-section">
        <h3>Quick Actions</h3>
        <div className="quick-links">
          <Link className="quick-link" to="/subscriptions">View subscriptions</Link>
          <Link className="quick-link" to="/activate">Activate device</Link>
          <Link className="quick-link" to="/proxy">Edit proxy settings</Link>
        </div>
      </div>
    </div>
  );
}
