import { useEffect, useMemo, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { createProxy, createResellerUser, deleteProxy, getAuditLogs, getProxies, getResellerUserConfig, getResellerUsers, updateProxy } from '../api/client';

export default function DashboardPage() {
  const { token, user, signOut } = useAuth();
  const isReseller = user?.role === 'reseller';
  const [proxies, setProxies] = useState([]);
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

  useEffect(() => {
    if (!token) return;

    if (isReseller) {
      loadResellerUsers();
      return;
    }

    loadProxies();
    loadAuditLogs();
  }, [token, isReseller]);

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

  const capacityLabel = useMemo(() => (proxy) => `${proxy.active_user_count ?? 0}/${proxy.max_users ?? 3}`, []);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-7xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <p className="text-sm uppercase tracking-[0.3em] text-cyan-400">{isReseller ? 'Reseller Portal' : 'Proxy Management'}</p>
            <h1 className="text-3xl font-semibold">{isReseller ? 'Proxy Reselling' : 'Proxies'}</h1>
          </div>
          <div className="flex gap-2">
            {!isReseller ? (
              <button className="rounded-lg border border-slate-700 px-4 py-2" onClick={() => { setEditingProxy(null); setForm({ label: '', ip: '', port: '', protocol: 'http', username: '', password: '', region: '', max_users: '3', status: 'active' }); setShowModal(true); }}>Add Proxy</button>
            ) : null}
            <button className="rounded-lg bg-rose-500 px-4 py-2" onClick={signOut}>Logout</button>
          </div>
        </div>

        {error ? <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/40 p-3 text-sm text-rose-300">{error}</div> : null}

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
            {loading ? <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-400">Loading proxies…</div> : (
              <>
                <div className="mb-6 grid gap-4 md:grid-cols-2 xl:grid-cols-3">
                  {proxies.map((proxy) => {
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
