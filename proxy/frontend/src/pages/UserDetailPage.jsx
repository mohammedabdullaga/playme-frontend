import { useEffect, useState } from 'react';
import { Link, useNavigate, useParams } from 'react-router-dom';
import { deleteUser, disableUser, getUserConfig, getUsers, reactivateUser, updateUser } from '../api/client';
import { useAuth } from '../context/AuthContext';

export default function UserDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const navigate = useNavigate();
  const [user, setUser] = useState(null);
  const [config, setConfig] = useState(null);
  const [whatsapp, setWhatsapp] = useState('');
  const [expiresAt, setExpiresAt] = useState('');
  const [message, setMessage] = useState('');
  const [error, setError] = useState('');

  async function loadUser() {
    try {
      const users = await getUsers(token);
      const found = users.find((entry) => String(entry.id) === String(id));
      if (!found) {
        setError('Account not found');
        return;
      }
      setUser(found);
      setWhatsapp(found.whatsapp || '');
      setExpiresAt(found.expires_at || '');
      const configResponse = await getUserConfig(found.id, token);
      setConfig(configResponse);
    } catch (err) {
      setError(err.message || 'Failed to load account');
    }
  }

  useEffect(() => {
    if (token) loadUser();
  }, [id, token]);

  async function handleSave(event) {
    event.preventDefault();
    try {
      await updateUser(id, { whatsapp, expires_at: expiresAt }, token);
      setMessage('Account updated successfully.');
      setError('');
      await loadUser();
    } catch (err) {
      setError(err.message || 'Failed to update account');
    }
  }

  async function handleExtend() {
    const nextExpiry = window.prompt('New expiry date/time (ISO format)', expiresAt);
    if (nextExpiry === null) return;
    try {
      await reactivateUser(id, nextExpiry, token);
      setMessage('Account extended successfully.');
      setError('');
      await loadUser();
    } catch (err) {
      setError(err.message || 'Failed to extend account');
    }
  }

  async function handleDisable() {
    if (!window.confirm('Disable this account and remove its DNS record?')) return;
    try {
      await disableUser(id, token);
      setMessage('Account disabled.');
      setError('');
      await loadUser();
    } catch (err) {
      setError(err.message || 'Failed to disable account');
    }
  }

  async function handleDelete() {
    if (!window.confirm('Delete this account permanently?')) return;
    try {
      await deleteUser(id, token);
      navigate('/');
    } catch (err) {
      setError(err.message || 'Failed to delete account');
    }
  }

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-4xl">
        <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
          <div>
            <Link className="text-sm text-cyan-300" to="/">Dashboard</Link>
            <h1 className="mt-2 text-3xl font-semibold">Account Management</h1>
          </div>
          <Link className="rounded-lg border border-slate-700 px-4 py-2 text-sm" to="/proxies">Proxy Management</Link>
        </div>

        {error ? <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/40 p-3 text-rose-300">{error}</div> : null}
        {message ? <div className="mb-4 rounded-lg border border-emerald-500/30 bg-emerald-950/40 p-3 text-emerald-300">{message}</div> : null}

        {user ? (
          <div className="grid gap-5 lg:grid-cols-2">
            <form className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5" onSubmit={handleSave}>
              <div className="mb-5 flex items-center justify-between gap-3">
                <div><p className="text-xs uppercase tracking-wider text-slate-400">Account #{user.id}</p><h2 className="mt-1 text-xl font-semibold">{user.subdomain}</h2></div>
                <span className="rounded-full bg-cyan-500/10 px-3 py-1 text-xs text-cyan-300">{user.status}</span>
              </div>
              <label className="mb-2 block text-sm text-slate-300">WhatsApp / account name</label>
              <input className="mb-4 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={whatsapp} onChange={(event) => setWhatsapp(event.target.value)} required />
              <label className="mb-2 block text-sm text-slate-300">Expiry date/time</label>
              <input className="mb-5 w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" value={expiresAt} onChange={(event) => setExpiresAt(event.target.value)} required />
              <div className="mb-5 space-y-2 text-sm text-slate-400"><p>Proxy: <span className="text-slate-200">{user.proxy_label || 'Assigned proxy'}</span></p><p>Domain: <span className="text-slate-200">{user.assigned_domain || 'Assigned domain'}</span></p></div>
              <div className="flex flex-wrap gap-2"><button className="rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950" type="submit">Save changes</button><button className="rounded-lg border border-cyan-500/40 px-4 py-2 text-cyan-300" type="button" onClick={handleExtend}>Extend</button>{user.status === 'active' ? <button className="rounded-lg border border-amber-500/40 px-4 py-2 text-amber-300" type="button" onClick={handleDisable}>Disable</button> : null}<button className="rounded-lg border border-rose-500/40 px-4 py-2 text-rose-300" type="button" onClick={handleDelete}>Delete</button></div>
            </form>

            <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-5">
              <h2 className="mb-5 text-xl font-semibold">Connection details</h2>
              {config ? <div className="space-y-4 text-sm text-slate-300"><div><p className="text-slate-400">Apple TV URL</p><p className="mt-1 break-all text-cyan-300">{config.config?.appletv_base64 || 'Not available'}</p></div><div className="grid gap-2 sm:grid-cols-2"><p>Server: <span className="text-white">{config.config?.iphone_plain?.server}</span></p><p>Port: <span className="text-white">{config.config?.iphone_plain?.port}</span></p><p>Username: <span className="text-white">{config.config?.iphone_plain?.username}</span></p><p>Password: <span className="text-white">{config.config?.iphone_plain?.password}</span></p></div></div> : <p className="text-slate-400">Loading connection details...</p>}
            </div>
          </div>
        ) : <div className="rounded-2xl border border-slate-800 bg-slate-900/80 p-6 text-slate-400">Loading account...</div>}
      </div>
    </div>
  );
}
