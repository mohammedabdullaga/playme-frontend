import { Link } from "react-router-dom";

export default function Navbar() {
  const logout = () => {
    localStorage.removeItem("admin_key");
    window.location.href = "/";
  };

  if (!localStorage.getItem("admin_key")) return null;

  return (
    <aside className="sidebar">
      <div className="sidebar-brand">
        <div className="brand-mark">▶</div>
        <div>
          <h1>Playme Admin</h1>
          <p>Control panel</p>
        </div>
      </div>

      <div className="sidebar-group">
        <div className="sidebar-group-title">Overview</div>
        <Link className="sidebar-link" to="/dashboard">Dashboard</Link>
      </div>

      <div className="sidebar-group">
        <div className="sidebar-group-title">Management</div>
        <Link className="sidebar-link" to="/subscriptions">Subscriptions</Link>
        <Link className="sidebar-link" to="/devices">Devices</Link>
        <Link className="sidebar-link" to="/tokens">Tokens</Link>
        <Link className="sidebar-link" to="/activate">Activate Device</Link>
        <Link className="sidebar-link" to="/proxy">Proxy</Link>
      </div>

      <div className="sidebar-group">
        <div className="sidebar-group-title">Monitoring</div>
        <Link className="sidebar-link" to="/heartbeat">Heartbeat</Link>
        <Link className="sidebar-link" to="/status">App Status</Link>
        <Link className="sidebar-link" to="/messages">Messages</Link>
      </div>

      <div className="sidebar-footer">
        <button className="btn-ghost" onClick={logout}>Logout</button>
      </div>
    </aside>
  );
}
