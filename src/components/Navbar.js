import { useEffect, useRef, useState } from "react";
import { NavLink, useLocation, useNavigate } from "react-router-dom";
import API from "../api/api";

export default function Navbar() {
  const location = useLocation();
  const navigate = useNavigate();
  const [valid, setValid] = useState(true);
  const [open, setOpen] = useState(false);
  const sidebarRef = useRef(null);
  const triggerRef = useRef(null);
  const key = localStorage.getItem("admin_key");

  useEffect(() => {
    if (!key) {
      setValid(false);
      return;
    }

    let mounted = true;
    API.get("/admin/devices")
      .then(() => {
        if (mounted) setValid(true);
      })
      .catch(() => {
        localStorage.removeItem("admin_key");
        if (mounted) {
          setValid(false);
          navigate("/");
        }
      });

    return () => {
      mounted = false;
    };
  }, [key, navigate]);

  useEffect(() => {
    if (!open) return;

    const handleClickOutside = (event) => {
      const sidebarNode = sidebarRef.current;
      const triggerNode = triggerRef.current;
      if (
        sidebarNode &&
        !sidebarNode.contains(event.target) &&
        triggerNode &&
        !triggerNode.contains(event.target)
      ) {
        setOpen(false);
      }
    };

    window.addEventListener("mousedown", handleClickOutside);

    return () => {
      window.removeEventListener("mousedown", handleClickOutside);
    };
  }, [open]);

  if (!key || !valid) return null;

  const getLinkClass = ({ isActive }) =>
    `nav-item${isActive ? " active" : ""}`;

  const logout = () => {
    localStorage.removeItem("admin_key");
    navigate("/");
  };

  return (
    <>
      <div className="mobile-nav-trigger" ref={triggerRef}>
        <button className="mobile-menu-button" onClick={() => setOpen((prev) => !prev)}>
          {open ? "Close menu" : "Open menu"}
        </button>
      </div>
      <aside ref={sidebarRef} className={`sidebar sidebar-width ${open ? "mobile-open" : ""}`}>
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
          <NavLink className={getLinkClass} to="/users">Users</NavLink>
          <NavLink className={getLinkClass} to="/tokens">Tokens</NavLink>
          <NavLink className={getLinkClass} to="/activate">Activate Device</NavLink>
          <NavLink className={getLinkClass} to="/proxy">Proxy</NavLink>
          <NavLink className={getLinkClass} to="/resellers">Resellers</NavLink>
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
  </>
);
}
