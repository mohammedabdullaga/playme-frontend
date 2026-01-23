import { Link } from "react-router-dom";

export default function Navbar() {
  const logout = () => {
    localStorage.removeItem("admin_key");
    window.location.href = "/";
  };

  if (!localStorage.getItem("admin_key")) return null;

  return (
    <nav>
      <Link to="/dashboard">Dashboard</Link>
      <Link to="/tokens">Tokens</Link>
      <Link to="/devices">Devices</Link>
      <Link to="/proxy">Proxy</Link>
      <button onClick={logout}>Logout</button>
    </nav>
  );
}
