import { NavLink } from "react-router-dom";

export default function Navbar() {
  const logout = () => {
    localStorage.removeItem("admin_key");
    window.location.href = "/";
  };

  if (!localStorage.getItem("admin_key")) return null;

  const getLinkClass = ({ isActive }) =>
    `nav-item${isActive ? " active" : ""}`;

  return (
    <aside className="sidebar sidebar-width">
      <div className="sidebar-brand">
        <div className="brand-icon">P</div>
        <div>
          <h1 className="brand-title">Playme Admin</h1>
          <p className="brand-subtitle">Control panel</p>
        </div>
      </div>

      <div className="sidebar-menu">
        <div className="nav-section">
          <p className="nav-title">Overview</p>
          <NavLink className={getLinkClass} to="/dashboard">Dashboard</NavLink>
        </div>

        <div className="nav-section">
          <p className="nav-title">Management</p>
          <NavLink className={getLinkClass} to="/subscriptions">Subscriptions</NavLink>
          <NavLink className={getLinkClass} to="/devices">Devices</NavLink>
          <NavLink className={getLinkClass} to="/tokens">Tokens</NavLink>
          <NavLink className={getLinkClass} to="/activate">Activate Device</NavLink>
          <NavLink className={getLinkClass} to="/proxy">Proxy</NavLink>
        </div>

        <div className="nav-section">
          <p className="nav-title">Monitoring</p>
          <NavLink className={getLinkClass} to="/heartbeat">Heartbeat</NavLink>
          <NavLink className={getLinkClass} to="/status">App Status</NavLink>
          <NavLink className={getLinkClass} to="/messages">Messages</NavLink>
        </div>
      </div>

      <div className="sidebar-footer">
        <button className="logout-button" onClick={logout}>Logout</button>
      </div>
    </aside>
  );
}
