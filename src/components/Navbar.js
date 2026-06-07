import { Link } from "react-router-dom";

export default function Navbar() {
  const logout = () => {
    localStorage.removeItem("admin_key");
    window.location.href = "/";
  };

  if (!localStorage.getItem("admin_key")) return null;

  return (
    <aside className="sidebar flex w-full flex-col min-h-screen sidebar-width bg-slate-950 text-slate-100 p-6 space-y-8">
      <div className="space-y-3">
        <div className="flex items-center gap-3">
          <div className="h-12 w-12 rounded-2xl bg-sky-500 grid place-items-center text-lg font-bold text-white">P</div>
          <div>
            <h1 className="text-lg font-semibold tracking-tight">Playme Admin</h1>
            <p className="text-sm text-slate-400">Control panel</p>
          </div>
        </div>
      </div>

      <div className="space-y-6 flex-1">
        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Overview</p>
          <Link className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800 transition" to="/dashboard">Dashboard</Link>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Management</p>
          <Link className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800 transition" to="/subscriptions">Subscriptions</Link>
          <Link className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800 transition" to="/devices">Devices</Link>
          <Link className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800 transition" to="/tokens">Tokens</Link>
          <Link className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800 transition" to="/activate">Activate Device</Link>
          <Link className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800 transition" to="/proxy">Proxy</Link>
        </div>

        <div className="space-y-2">
          <p className="text-[11px] uppercase tracking-[0.22em] text-slate-500">Monitoring</p>
          <Link className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800 transition" to="/heartbeat">Heartbeat</Link>
          <Link className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800 transition" to="/status">App Status</Link>
          <Link className="block rounded-2xl px-4 py-3 text-sm font-medium text-slate-100 hover:bg-slate-800 transition" to="/messages">Messages</Link>
        </div>
      </div>

      <div className="pt-4">
        <button className="w-full rounded-2xl bg-red-500 px-4 py-3 text-sm font-semibold text-white transition hover:bg-red-600" onClick={logout}>Logout</button>
      </div>
    </aside>
  );
}
