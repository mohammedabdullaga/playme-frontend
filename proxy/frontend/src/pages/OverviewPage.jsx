import { useEffect, useMemo, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { getAuditLogs, getProxies, getUsers } from '../api/client';

const SOON_EXPIRY_DAYS = 7;

function isExpiringSoon(expiresAt) {
  const expiry = new Date(expiresAt).getTime();
  return !Number.isNaN(expiry) && expiry >= Date.now() && expiry <= Date.now() + SOON_EXPIRY_DAYS * 24 * 60 * 60 * 1000;
}

function isExpired(expiresAt) {
  const expiry = new Date(expiresAt).getTime();
  return !Number.isNaN(expiry) && expiry < Date.now();
}

export default function OverviewPage() {
  const { token, user, signOut } = useAuth();
  const navigate = useNavigate();
  const [proxies, setProxies] = useState([]);
  const [users, setUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [search, setSearch] = useState('');
  const [accountFilter, setAccountFilter] = useState('all');
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function loadDashboard() {
      try {
        setLoading(true);
        const [proxyData, userData, auditData] = await Promise.all([
          getProxies(token),
          getUsers(token),
          getAuditLogs(token),
        ]);
        setProxies(proxyData || []);
        setUsers(userData || []);
        setAuditLogs(auditData || []);
      } catch (err) {
        setError(err.message || 'Failed to load dashboard data');
      } finally {
        setLoading(false);
      }
    }

    if (token) loadDashboard();
  }, [token]);

  function handleSignOut() {
    signOut();
    navigate('/login');
  }

  const activeUsers = useMemo(() => users.filter((account) => account.status === 'active'), [users]);
  const filteredUsers = useMemo(() => users.filter((account) => {
    const searchValue = search.trim().toLowerCase();
    const matchesSearch = !searchValue || account.whatsapp?.toLowerCase().includes(searchValue) || account.subdomain?.toLowerCase().includes(searchValue);
    if (!matchesSearch) return false;
    if (accountFilter === 'soon') return account.status === 'active' && isExpiringSoon(account.expires_at);
    if (accountFilter === 'far') return account.status === 'active' && !isExpiringSoon(account.expires_at) && !isExpired(account.expires_at);
    return true;
  }), [accountFilter, search, users]);
  const stats = useMemo(() => ({
    activeProxies: proxies.length,
    activeAccounts: activeUsers.length,
    expiringAccounts: activeUsers.filter((account) => isExpiringSoon(account.expires_at)).length,
    availableSeats: proxies.reduce((total, proxy) => total + Math.max((proxy.max_users || 3) - (proxy.active_user_count || 0), 0), 0),
    sales: auditLogs.filter((entry) => entry.action === 'create' || entry.action === 'renew').length,
  }), [activeUsers, auditLogs, proxies]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-5xl">
        <header className="mb-8 flex flex-wrap items-center justify-between gap-4">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">Admin workspace</p>
            <h1 className="mt-2 text-4xl font-semibold">Dashboard</h1>
            <p className="mt-2 text-slate-400">A live view of proxy capacity, account health, and sales activity.</p>
          </div>
          <div className="flex flex-wrap gap-2">
            <Link to="/proxies" className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950">Proxy Management</Link>
            <button className="rounded-lg bg-rose-500 px-4 py-2 font-medium text-white" onClick={handleSignOut}>Logout</button>
          </div>
        </header>

        {error ? <div className="mb-5 rounded-xl border border-rose-500/30 bg-rose-950/40 p-4 text-rose-300">{error}</div> : null}
        <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Active proxies</p><p className="mt-2 text-3xl font-semibold">{loading ? '...' : stats.activeProxies}</p></div>
          <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Active accounts</p><p className="mt-2 text-3xl font-semibold">{loading ? '...' : stats.activeAccounts}</p></div>
          <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4"><p className="text-xs uppercase tracking-wider text-amber-300">Expiring in 7 days</p><p className="mt-2 text-3xl font-semibold text-amber-200">{loading ? '...' : stats.expiringAccounts}</p></div>
          <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4"><p className="text-xs uppercase tracking-wider text-emerald-300">Available seats</p><p className="mt-2 text-3xl font-semibold text-emerald-200">{loading ? '...' : stats.availableSeats}</p></div>
          <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-4"><p className="text-xs uppercase tracking-wider text-cyan-300">Sales activity</p><p className="mt-2 text-3xl font-semibold text-cyan-200">{loading ? '...' : stats.sales}</p></div>
        </div>

        <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
          <div className="mb-4 flex flex-wrap items-end justify-between gap-4">
            <div><h2 className="text-2xl font-semibold">Account overview</h2><p className="mt-1 text-sm text-slate-400">Find any account by WhatsApp or subdomain and prioritize renewals.</p></div>
            <Link to="/proxies" className="text-sm font-medium text-cyan-300">Manage accounts &rarr;</Link>
          </div>
          <div className="mb-5 flex flex-wrap gap-3">
            <input className="min-w-[260px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search WhatsApp or subdomain" />
            <select className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
              <option value="all">All accounts</option>
              <option value="soon">Expiring within 7 days</option>
              <option value="far">Far from expiry</option>
            </select>
          </div>
          <div className="space-y-3">
            {filteredUsers.slice(0, 50).map((account) => {
              const proxy = proxies.find((item) => String(item.id) === String(account.proxy_id));
              const soon = account.status === 'active' && isExpiringSoon(account.expires_at);
              return <div key={account.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3"><div><p className="font-medium text-white">{account.whatsapp}</p><p className="text-sm text-slate-400">{account.subdomain} • {proxy?.label || 'Unknown proxy'}</p></div><div className="flex items-center gap-2"><span className={`rounded-full px-3 py-1 text-xs ${account.status !== 'active' ? 'bg-slate-700/70 text-slate-300' : soon ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>{account.status !== 'active' ? account.status : soon ? 'Soon to expire' : account.expires_at}</span><Link to={`/user/${account.id}`} className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-cyan-300">Manage</Link></div></div>;
            })}
            {!loading && filteredUsers.length === 0 ? <p className="text-sm text-slate-400">No accounts match your search.</p> : null}
          </div>
        </div>
      </div>
    </div>
  );
}
