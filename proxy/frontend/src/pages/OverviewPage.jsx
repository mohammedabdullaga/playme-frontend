import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function OverviewPage() {
  const { user, signOut } = useAuth();
  const navigate = useNavigate();

  function handleSignOut() {
    signOut();
    navigate('/login');
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-10 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Admin workspace</p>
            <h1 className="mt-2 text-4xl font-semibold">Dashboard</h1>
            <p className="mt-2 text-slate-400">Manage your proxy network from one focused workspace.</p>
          </div>
          <button className="rounded-lg bg-rose-500 px-4 py-2 font-medium text-white" onClick={handleSignOut}>Logout</button>
        </header>

        <div className="grid gap-5 md:grid-cols-2">
          <Link to="/proxies" className="group rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-6 transition hover:border-cyan-300 hover:bg-cyan-950/50">
            <p className="text-sm uppercase tracking-wider text-cyan-300">Operations</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">Proxy Management</h2>
            <p className="mt-2 text-slate-300">Add proxies, manage active accounts, repair DNS, and review capacity and expiry statistics.</p>
            <span className="mt-6 inline-block font-medium text-cyan-300 group-hover:text-cyan-200">Open proxy workspace &rarr;</span>
          </Link>

          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6">
            <p className="text-sm uppercase tracking-wider text-slate-400">Signed in as</p>
            <h2 className="mt-3 text-2xl font-semibold text-white">{user?.username || 'Administrator'}</h2>
            <p className="mt-2 text-slate-400">Use the proxy workspace for day-to-day account and DNS operations.</p>
          </div>
        </div>
      </div>
    </div>
  );
}
