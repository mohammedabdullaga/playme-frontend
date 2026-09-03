import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { cleanupOrphanDnsRecords, createDomain, createProxy, createResellerUser, deleteProxy, deleteUser, disableUser, getAuditLogs, getDomains, getProxies, getResellerUserConfig, getResellerUsers, getUsers, reactivateUser, repairActiveSubdomains, setDefaultDomain, updateProxy, updateUser } from '../api/client';

const SOON_EXPIRY_DAYS = 7;

function isExpiringSoon(expiresAt, days = SOON_EXPIRY_DAYS) {
  const expiry = new Date(expiresAt).getTime();
  if (Number.isNaN(expiry)) return false;
  const now = Date.now();
  return expiry >= now && expiry <= now + days * 24 * 60 * 60 * 1000;
}

function isExpired(expiresAt) {
  const expiry = new Date(expiresAt).getTime();
  return !Number.isNaN(expiry) && expiry < Date.now();
}

export default function DashboardPage() {
  const { token, user, signOut } = useAuth();
  const isReseller = user?.role === 'reseller';
  const [proxies, setProxies] = useState([]);
  const [users, setUsers] = useState([]);
  const [resellerUsers, setResellerUsers] = useState([]);
  const [auditLogs, setAuditLogs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resellerLoading, setResellerLoading] = useState(true);
  const [auditLoading, setAuditLoading] = useState(true);
  const [error, setError] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [showResellerConfig, setShowResellerConfig] = useState(false);
  const [editingProxy, setEditingProxy] = useState(null);
  const [form, setForm] = useState({ label: '', ip: '', port: '', protocol: 'http', username: '', password: '', region: '', max_users: '3', status: 'active' });
  const [resellerForm, setResellerForm] = useState({ whatsapp: '', expires_at: '' });
  const [resellerSearch, setResellerSearch] = useState('');
  const [resellerConfig, setResellerConfig] = useState(null);
  const [dnsRepairMessage, setDnsRepairMessage] = useState('');
  const [dnsCleanupMessage, setDnsCleanupMessage] = useState('');
  const [domains, setDomains] = useState([]);
  const [domainForm, setDomainForm] = useState({ domain: '', zone_id: '', api_token: '', api_key: '', api_email: '' });
  const [domainMessage, setDomainMessage] = useState('');
  const [proxyFilter, setProxyFilter] = useState('all');
  const [accountFilter, setAccountFilter] = useState('all');
  const [userSearch, setUserSearch] = useState('');

  async function loadProxies() {
    try {
      setLoading(true);
      const data = await getProxies(token);
      setProxies(data);
    } catch (err) {
      setError(err.message || 'Failed to load proxies');
    } finally {
      setLoading(false);
    }
  }

  async function loadResellerUsers(search = '') {
    try {
      setResellerLoading(true);
      const data = await getResellerUsers(token, search);
      setResellerUsers(data);
    } catch (err) {
      setError(err.message || 'Failed to load reseller users');
    } finally {
      setResellerLoading(false);
    }
  }

  async function loadAuditLogs() {
    try {
      setAuditLoading(true);
      const data = await getAuditLogs(token);
      setAuditLogs(data);
    } catch (err) {
      setError(err.message || 'Failed to load audit logs');
    } finally {
      setAuditLoading(false);
    }
  }

  async function loadUsers(search = userSearch) {
    try {
      setUsers(await getUsers(token, search));
    } catch (err) {
      setError(err.message || 'Failed to load accounts');
    }
  }

  async function loadDomains() {
    try {
      setDomains(await getDomains(token));
    } catch (err) {
      setError(err.message || 'Failed to load domains');
    }
  }

  useEffect(() => {
    if (!token) return;

    if (isReseller) {
      loadResellerUsers();
      return;
    }

    loadProxies();
    loadUsers();
    loadAuditLogs();
    loadDomains();
  }, [token, isReseller]);

  async function handleCreateDomain(e) {
    e.preventDefault();
    try {
      await createDomain(domainForm, token);
      setDomainForm({ domain: '', zone_id: '', api_token: '', api_key: '', api_email: '' });
      setDomainMessage('Domain added successfully.');
      await loadDomains();
    } catch (err) {
      setDomainMessage(err.message || 'Failed to add domain');
    }
  }

  async function handleSetDefaultDomain(id) {
    try {
      await setDefaultDomain(id, token);
      setDomainMessage('Default reseller domain updated.');
      await loadDomains();
    } catch (err) {
      setDomainMessage(err.message || 'Failed to update default domain');
    }
  }

  async function handleSubmit(e) {
    e.preventDefault();
    try {
      const payload = { ...form, port: Number(form.port), max_users: Number(form.max_users) };
      if (editingProxy) {
        await updateProxy(editingProxy.id, payload, token);
      } else {
        await createProxy(payload, token);
      }
      setShowModal(false);
      setEditingProxy(null);
      setForm({ label: '', ip: '', port: '', protocol: 'http', username: '', password: '', region: '', max_users: '3', status: 'active' });
      await loadProxies();
    } catch (err) {
      setError(err.message || 'Failed to save proxy');
    }
  }

  async function handleDelete(id) {
    if (!window.confirm('Delete this proxy and all linked users?')) return;
    try {
      await deleteProxy(id, token);
      await loadProxies();
    } catch (err) {
      setError(err.message || 'Failed to delete proxy');
    }
  }

  async function handleResellerSubmit(e) {
    e.preventDefault();
    try {
      const data = await createResellerUser({ whatsapp: resellerForm.whatsapp, expires_at: resellerForm.expires_at }, token);
      setResellerConfig(data);
      setShowResellerConfig(true);
      setResellerForm({ whatsapp: '', expires_at: '' });
      await loadResellerUsers(resellerSearch);
    } catch (err) {
      setError(err.message || 'Failed to create reseller user');
    }
  }

  async function handleResellerSearch(e) {
    e.preventDefault();
    await loadResellerUsers(resellerSearch);
  }

  async function handleViewResellerConfig(id) {
    try {
      const data = await getResellerUserConfig(id, token);
      setResellerConfig(data);
      setShowResellerConfig(true);
    } catch (err) {
      setError(err.message || 'Failed to load reseller config');
    }
  }

  async function handleRepairActiveSubdomains() {
    if (!window.confirm('Recreate DNS records for all active subdomains?')) return;

    try {
      setDnsRepairMessage('');
      const result = await repairActiveSubdomains(token);
      setDnsRepairMessage(`Recreated ${result.repaired_count || 0} active subdomains${result.skipped_count ? `, skipped ${result.skipped_count}` : ''}.`);
    } catch (err) {
      setError(err.message || 'Failed to recreate active subdomains');
    }
  }

  async function handleCleanupOrphanDns() {
    if (!window.confirm('Delete orphaned generated DNS records that no longer belong to an account?')) return;

    try {
      setDnsCleanupMessage('');
      const result = await cleanupOrphanDnsRecords(token);
      setDnsCleanupMessage(`Removed ${result.removed_count || 0} orphaned DNS records${result.skipped_count ? `, skipped ${result.skipped_count}` : ''}.`);
    } catch (err) {
      setError(err.message || 'Failed to clean orphaned DNS records');
    }
  }

  async function handleSearchUsers(e) {
    e.preventDefault();
    await loadUsers(userSearch);
  }

  async function handleEditUser(userEntry) {
    const whatsapp = window.prompt('WhatsApp / account name', userEntry.whatsapp);
    if (whatsapp === null) return;
    const expiresAt = window.prompt('Expiry date/time (ISO format)', userEntry.expires_at);
    if (expiresAt === null) return;

    try {
      await updateUser(userEntry.id, { whatsapp, expires_at: expiresAt }, token);
      await Promise.all([loadUsers(), loadProxies()]);
    } catch (err) {
      setError(err.message || 'Failed to update account');
    }
  }

  async function handleExtendUser(userEntry) {
    const expiresAt = window.prompt('New expiry date/time (ISO format)', userEntry.expires_at);
    if (expiresAt === null) return;

    try {
      await reactivateUser(userEntry.id, expiresAt, token);
      await Promise.all([loadUsers(), loadProxies()]);
    } catch (err) {
      setError(err.message || 'Failed to extend account');
    }
  }

  async function handleDisableUser(userEntry) {
    if (!window.confirm(`Disable ${userEntry.subdomain}?`)) return;
    try {
      await disableUser(userEntry.id, token);
      await Promise.all([loadUsers(), loadProxies()]);
    } catch (err) {
      setError(err.message || 'Failed to disable account');
    }
  }

  async function handleDeleteUser(userEntry) {
    if (!window.confirm(`Delete ${userEntry.subdomain} permanently?`)) return;
    try {
      await deleteUser(userEntry.id, token);
      await Promise.all([loadUsers(), loadProxies()]);
    } catch (err) {
      setError(err.message || 'Failed to delete account');
    }
  }

  const capacityLabel = useMemo(() => (proxy) => `${proxy.active_user_count ?? 0}/${proxy.max_users ?? 3}`, []);

  const activeUsers = useMemo(() => users.filter((userEntry) => userEntry.status === 'active'), [users]);
  const soonUsers = useMemo(() => activeUsers.filter((userEntry) => isExpiringSoon(userEntry.expires_at)), [activeUsers]);
  const filteredUsers = useMemo(() => users.filter((userEntry) => {
    if (accountFilter === 'soon') return userEntry.status === 'active' && isExpiringSoon(userEntry.expires_at);
    if (accountFilter === 'far') return userEntry.status === 'active' && !isExpiringSoon(userEntry.expires_at) && !isExpired(userEntry.expires_at);
    return true;
  }), [accountFilter, users]);
  const filteredProxies = useMemo(() => proxies.filter((proxy) => {
    const proxyUsers = activeUsers.filter((userEntry) => String(userEntry.proxy_id) === String(proxy.id));
    if (proxyFilter === 'soon') return proxyUsers.some((userEntry) => isExpiringSoon(userEntry.expires_at));
    if (proxyFilter === 'available') return (proxy.active_user_count ?? 0) < (proxy.max_users ?? 3);
    return true;
  }), [activeUsers, proxyFilter, proxies]);
  const stats = useMemo(() => ({
    activeProxies: proxies.length,
    activeAccounts: activeUsers.length,
    soonAccounts: soonUsers.length,
    availableSeats: proxies.reduce((total, proxy) => total + Math.max((proxy.max_users ?? 3) - (proxy.active_user_count ?? 0), 0), 0),
    sales: auditLogs.filter((entry) => entry.action === 'create' || entry.action === 'renew').length,
  }), [activeUsers, auditLogs, proxies, soonUsers]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <div className="mb-3 flex flex-wrap gap-2">
              <a className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950" href="/">Dashboard</a>
              <a className="rounded-lg border border-cyan-500/40 px-3 py-2 text-sm text-cyan-300" href="/proxies">Proxy Management</a>
            </div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">{isReseller ? 'Reseller Portal' : 'Proxy Management'}</p>
            <h1 className="text-3xl font-semibold">{isReseller ? 'Proxy Reselling' : 'Proxies'}</h1>
          </div>
          <div className="flex gap-2 flex-wrap justify-end">
            {!isReseller ? (
              <button className="rounded-lg border border-slate-700 px-4 py-2" onClick={handleRepairActiveSubdomains}>Recreate Active Subdomains</button>
            ) : null}
            {!isReseller ? (
              <button className="rounded-lg border border-rose-500/40 px-4 py-2 text-rose-300" onClick={handleCleanupOrphanDns}>Clean Orphaned DNS</button>
            ) : null}
            {!isReseller ? (
              <button className="rounded-lg border border-slate-700 px-4 py-2" onClick={() => { setEditingProxy(null); setForm({ label: '', ip: '', port: '', protocol: 'http', username: '', password: '', region: '', max_users: '3', status: 'active' }); setShowModal(true); }}>Add Proxy</button>
            ) : null}
            <button className="rounded-lg bg-rose-500 px-4 py-2" onClick={signOut}>Logout</button>
          </div>
        </div>

        {error ? <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/40 p-3 text-sm text-rose-300">{error}</div> : null}
        {dnsRepairMessage ? <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 text-sm text-emerald-300">{dnsRepairMessage}</div> : null}
        {dnsCleanupMessage ? <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 text-sm text-emerald-300">{dnsCleanupMessage}</div> : null}
        {!isReseller ? (
          <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
            <div className="mb-4">
              <h2 className="text-xl font-semibold">Proxy domains</h2>
              <p className="text-sm text-slate-400">Add a Cloudflare zone and choose the default domain for new reseller users.</p>
            </div>
            <form className="grid gap-3 md:grid-cols-2 xl:grid-cols-5" onSubmit={handleCreateDomain}>
              <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Domain (example.com)" value={domainForm.domain} onChange={(e) => setDomainForm({ ...domainForm, domain: e.target.value })} required />
              <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Cloudflare Zone ID" value={domainForm.zone_id} onChange={(e) => setDomainForm({ ...domainForm, zone_id: e.target.value })} required />
              <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="API Token" value={domainForm.api_token} onChange={(e) => setDomainForm({ ...domainForm, api_token: e.target.value })} />
              <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Legacy API Key" value={domainForm.api_key} onChange={(e) => setDomainForm({ ...domainForm, api_key: e.target.value })} />
              <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="API Email (for key)" value={domainForm.api_email} onChange={(e) => setDomainForm({ ...domainForm, api_email: e.target.value })} />
              <button className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950 md:col-span-2 xl:col-span-5" type="submit">Add Domain</button>
            </form>
            {domainMessage ? <p className="mt-3 text-sm text-cyan-300">{domainMessage}</p> : null}
            <div className="mt-4 grid gap-3">
              {domains.map((domain) => (
                <div key={domain.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-700 bg-slate-950/60 p-3">
                  <div>
                    <p className="font-semibold text-white">{domain.domain} {domain.is_default ? <span className="ml-2 rounded-full bg-emerald-500/15 px-2 py-1 text-xs text-emerald-300">Default</span> : null}</p>
                    <p className="text-xs text-slate-400">Zone: {domain.zone_id} • {domain.has_api_token ? 'API token saved' : 'API key saved'}</p>
                  </div>
                  {!domain.is_default ? <button className="rounded-lg border border-cyan-500/40 px-3 py-2 text-sm text-cyan-300" onClick={() => handleSetDefaultDomain(domain.id)}>Make default</button> : null}
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {isReseller ? (
          <div className="space-y-6">
            <div className="rounded-2xl border border-cyan-500/20 bg-cyan-950/20 p-5">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Sell proxy access to customers</h2>
                  <p className="mt-1 text-sm text-slate-400">Create a new reseller user and the panel will automatically assign the first available proxy slot for you.</p>
                </div>
              </div>
              <form className="mt-4 grid gap-3 md:grid-cols-[1fr_1fr_auto]" onSubmit={handleResellerSubmit}>
                <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="WhatsApp" value={resellerForm.whatsapp} onChange={(e) => setResellerForm({ ...resellerForm, whatsapp: e.target.value })} required />
                <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" type="datetime-local" value={resellerForm.expires_at} onChange={(e) => setResellerForm({ ...resellerForm, expires_at: e.target.value })} required />
                <button className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950" type="submit">Create User</button>
              </form>
            </div>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                <div>
                  <h2 className="text-xl font-semibold">Your users</h2>
                  <p className="text-sm text-slate-400">Search by WhatsApp number or subdomain.</p>
                </div>
                <form className="flex gap-2" onSubmit={handleResellerSearch}>
                  <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Search" value={resellerSearch} onChange={(e) => setResellerSearch(e.target.value)} />
                  <button className="rounded-lg border border-slate-700 px-3 py-2" type="submit">Search</button>
                </form>
              </div>

              {resellerLoading ? (
                <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-400">Loading reseller users…</div>
              ) : (
                <div className="space-y-3">
                  {resellerUsers.map((userEntry) => (
                    <div key={userEntry.id} className="rounded-2xl border border-slate-800 bg-slate-950/60 p-4">
                      <div className="flex flex-wrap items-center justify-between gap-3">
                        <div>
                          <p className="font-semibold">{userEntry.whatsapp}</p>
                          <p className="text-sm text-slate-400">{userEntry.subdomain}</p>
                        </div>
                        <span className={`rounded-full px-3 py-1 text-xs font-medium ${userEntry.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : userEntry.status === 'expired' ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-700/70 text-slate-300'}`}>{userEntry.status}</span>
                      </div>
                      <div className="mt-3 flex flex-wrap items-center justify-between gap-2 text-sm text-slate-400">
                        <span>Expiry: {userEntry.expires_at || '—'}</span>
                        <button className="rounded-lg border border-slate-700 px-3 py-2" onClick={() => handleViewResellerConfig(userEntry.id)}>View Config</button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        ) : (
          <>
            <div className="mb-6 grid gap-3 sm:grid-cols-2 xl:grid-cols-5">
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Active proxies</p><p className="mt-2 text-3xl font-semibold">{stats.activeProxies}</p></div>
              <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4"><p className="text-xs uppercase tracking-wider text-slate-400">Active accounts</p><p className="mt-2 text-3xl font-semibold">{stats.activeAccounts}</p></div>
              <div className="rounded-2xl border border-amber-500/30 bg-amber-950/30 p-4"><p className="text-xs uppercase tracking-wider text-amber-300">Expiring in 7 days</p><p className="mt-2 text-3xl font-semibold text-amber-200">{stats.soonAccounts}</p></div>
              <div className="rounded-2xl border border-emerald-500/30 bg-emerald-950/30 p-4"><p className="text-xs uppercase tracking-wider text-emerald-300">Available seats</p><p className="mt-2 text-3xl font-semibold text-emerald-200">{stats.availableSeats}</p></div>
              <div className="rounded-2xl border border-cyan-500/30 bg-cyan-950/30 p-4"><p className="text-xs uppercase tracking-wider text-cyan-300">Sales activity</p><p className="mt-2 text-3xl font-semibold text-cyan-200">{stats.sales}</p></div>
            </div>
            <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <div className="flex flex-wrap items-end gap-4">
                <label className="grid gap-2 text-sm text-slate-300">Proxy filter
                  <select className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={proxyFilter} onChange={(e) => setProxyFilter(e.target.value)}>
                    <option value="all">All proxies</option>
                    <option value="soon">Proxies with accounts expiring soon</option>
                    <option value="available">Proxies with available seats</option>
                  </select>
                </label>
                <label className="grid gap-2 text-sm text-slate-300">Account filter
                  <select className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={accountFilter} onChange={(e) => setAccountFilter(e.target.value)}>
                    <option value="all">All active accounts</option>
                    <option value="soon">Soon to expire (7 days)</option>
                    <option value="far">Far from expiry</option>
                  </select>
                </label>
                <p className="text-sm text-slate-400">Soon means an active account expiring within the next {SOON_EXPIRY_DAYS} days.</p>
              </div>
              <form className="mt-4 flex flex-wrap gap-2" onSubmit={handleSearchUsers}>
                <input className="min-w-[260px] flex-1 rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={userSearch} onChange={(e) => setUserSearch(e.target.value)} placeholder="Search WhatsApp or subdomain" />
                <button className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950" type="submit">Search accounts</button>
              </form>
            </div>
            {loading ? <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-400">Loading proxies…</div> : (
              <>
                <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {filteredProxies.map((proxy) => {
                    const used = proxy.active_user_count ?? 0;
                    const max = proxy.max_users ?? 3;
                    const full = used >= max;
                    return (
                      <div key={proxy.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5 shadow-lg">
                        <div className="flex items-start justify-between gap-4">
                          <div>
                            <h2 className="text-xl font-semibold">{proxy.label}</h2>
                            <p className="text-sm text-slate-400">{proxy.ip}:{proxy.port}</p>
                          </div>
                          <span className={`rounded-full px-3 py-1 text-xs font-medium ${proxy.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : 'bg-slate-700/70 text-slate-300'}`}>{proxy.status}</span>
                        </div>
                        <div className="mt-4 space-y-2 text-sm text-slate-300">
                          <div>Protocol: <span className="font-medium text-slate-100">{proxy.protocol}</span></div>
                          <div>Region: <span className="font-medium text-slate-100">{proxy.region || '—'}</span></div>
                        </div>
                        <div className={`mt-4 rounded-xl border px-3 py-2 text-sm ${full ? 'border-rose-500/30 bg-rose-950/40 text-rose-300' : 'border-emerald-500/30 bg-emerald-950/40 text-emerald-300'}`}>
                          Capacity: {used}/{max}
                        </div>
                        <div className="mt-5 flex flex-wrap gap-2">
                          <button className="rounded-lg border border-slate-700 px-3 py-2 text-sm" onClick={() => { setEditingProxy(proxy); setForm({ label: proxy.label, ip: proxy.ip, port: String(proxy.port), protocol: proxy.protocol, username: proxy.username, password: proxy.password, region: proxy.region || '', max_users: String(proxy.max_users ?? 3), status: proxy.status }); setShowModal(true); }}>Edit</button>
                          <button className="rounded-lg border border-slate-700 px-3 py-2 text-sm" onClick={() => handleDelete(proxy.id)}>Delete</button>
                          <a className="rounded-lg bg-cyan-500 px-3 py-2 text-sm font-medium text-slate-950" href={`/proxy/${proxy.id}`}>Manage Users</a>
                        </div>
                      </div>
                    );
                  })}
                </div>

                <div className="mb-6 rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                  <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                    <div><h2 className="text-xl font-semibold">Accounts by expiry</h2><p className="text-sm text-slate-400">Review active accounts and prioritize renewals.</p></div>
                    <span className="text-sm text-slate-400">Showing {filteredUsers.length}</span>
                  </div>
                  <div className="space-y-3">
                    {filteredUsers.map((userEntry) => {
                      const proxy = proxies.find((item) => String(item.id) === String(userEntry.proxy_id));
                      const soon = isExpiringSoon(userEntry.expires_at);
                      return <div key={userEntry.id} className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-slate-800 bg-slate-950/60 p-3">
                        <div><p className="font-medium text-white">{userEntry.whatsapp}</p><p className="text-sm text-slate-400">{userEntry.subdomain} • {proxy?.label || 'Unknown proxy'}</p></div>
                        <div className="flex flex-wrap items-center justify-end gap-2">
                          <span className={`rounded-full px-3 py-1 text-xs ${userEntry.status !== 'active' ? 'bg-slate-700/70 text-slate-300' : soon ? 'bg-amber-500/15 text-amber-300' : 'bg-emerald-500/15 text-emerald-300'}`}>{userEntry.status !== 'active' ? userEntry.status : soon ? 'Soon to expire' : `Expires ${userEntry.expires_at}`}</span>
                          <button className="rounded-lg border border-slate-700 px-3 py-2 text-xs text-slate-200" onClick={() => handleEditUser(userEntry)}>Edit</button>
                          <button className="rounded-lg border border-cyan-500/40 px-3 py-2 text-xs text-cyan-300" onClick={() => handleExtendUser(userEntry)}>Extend</button>
                          {userEntry.status === 'active' ? <button className="rounded-lg border border-amber-500/40 px-3 py-2 text-xs text-amber-300" onClick={() => handleDisableUser(userEntry)}>Disable</button> : null}
                          <button className="rounded-lg border border-rose-500/40 px-3 py-2 text-xs text-rose-300" onClick={() => handleDeleteUser(userEntry)}>Delete</button>
                        </div>
                      </div>;
                    })}
                    {filteredUsers.length === 0 ? <p className="text-sm text-slate-400">No accounts match this filter.</p> : null}
                  </div>
                </div>

                <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
                  <div className="mb-4 flex items-center justify-between">
                    <div>
                      <h2 className="text-xl font-semibold">Recent reseller activity</h2>
                      <p className="text-sm text-slate-400">The latest assignment and recovery actions from reseller accounts.</p>
                    </div>
                  </div>
                  {auditLoading ? (
                    <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-6 text-center text-slate-400">Loading audit logs…</div>
                  ) : (
                    <div className="space-y-3">
                      {auditLogs.map((entry) => (
                        <div key={entry.id} className="rounded-xl border border-slate-800 bg-slate-950/60 p-3 text-sm text-slate-300">
                          <div className="flex flex-wrap items-center justify-between gap-2">
                            <div>
                              <p className="font-medium text-white">{entry.reseller_username || 'Reseller'}</p>
                              <p className="text-slate-400">{entry.customer_whatsapp || 'Unknown user'} • {entry.proxy_label || 'Unknown proxy'}</p>
                            </div>
                            <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs font-medium text-cyan-300">{entry.action}</span>
                          </div>
                          <p className="mt-2 text-xs uppercase tracking-[0.25em] text-slate-500">{entry.created_at}</p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </>
            )}
          </>
        )}
      </div>

      {!isReseller && showModal ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">{editingProxy ? 'Edit Proxy' : 'Add Proxy'}</h3>
              <button onClick={() => setShowModal(false)}>×</button>
            </div>
            <form className="space-y-3" onSubmit={handleSubmit}>
              <div className="grid gap-3 md:grid-cols-2">
                <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Label" value={form.label} onChange={(e) => setForm({ ...form, label: e.target.value })} required />
                <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="IP" value={form.ip} onChange={(e) => setForm({ ...form, ip: e.target.value })} required />
                <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" type="number" placeholder="Port" value={form.port} onChange={(e) => setForm({ ...form, port: e.target.value })} required />
                <select className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={form.protocol} onChange={(e) => setForm({ ...form, protocol: e.target.value })}>
                  <option value="http">http</option>
                  <option value="socks5">socks5</option>
                </select>
                <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Username" value={form.username} onChange={(e) => setForm({ ...form, username: e.target.value })} required />
                <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
                <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="Region" value={form.region} onChange={(e) => setForm({ ...form, region: e.target.value })} />
                <input className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" type="number" placeholder="Max Users" value={form.max_users} onChange={(e) => setForm({ ...form, max_users: e.target.value })} />
              </div>
              <div className="flex justify-end gap-2">
                <button type="button" className="rounded-lg border border-slate-700 px-4 py-2" onClick={() => setShowModal(false)}>Cancel</button>
                <button type="submit" className="rounded-lg bg-cyan-500 px-4 py-2 text-slate-950">Save</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showResellerConfig && resellerConfig ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Connection Config</h3>
              <button onClick={() => setShowResellerConfig(false)}>×</button>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <h4 className="font-semibold text-cyan-300">Apple TV (Happ)</h4>
                <p className="mt-2 break-all text-sm text-slate-300">{resellerConfig.config?.appletv_base64 || 'Not available'}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <h4 className="font-semibold text-cyan-300">iPhone (manual)</h4>
                <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                  <div>Server: <span className="font-medium text-white">{resellerConfig.config?.iphone_plain?.server}</span></div>
                  <div>Port: <span className="font-medium text-white">{resellerConfig.config?.iphone_plain?.port}</span></div>
                  <div>Username: <span className="font-medium text-white">{resellerConfig.config?.iphone_plain?.username}</span></div>
                  <div>Password: <span className="font-medium text-white">{resellerConfig.config?.iphone_plain?.password}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
