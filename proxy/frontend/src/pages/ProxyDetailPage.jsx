import { useEffect, useMemo, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import { createUser, deleteUser, disableUser, getUserConfig, getUsers, reactivateUser } from '../api/client';
import { useAuth } from '../context/AuthContext';

function toDateTimeLocalValue(value) {
  if (!value) return '';
  const parsed = new Date(value);
  if (Number.isNaN(parsed.getTime())) return '';

  const pad = (num) => String(num).padStart(2, '0');
  const year = parsed.getFullYear();
  const month = pad(parsed.getMonth() + 1);
  const day = pad(parsed.getDate());
  const hour = pad(parsed.getHours());
  const minute = pad(parsed.getMinutes());

  return `${year}-${month}-${day}T${hour}:${minute}`;
}

export default function ProxyDetailPage() {
  const { id } = useParams();
  const { token } = useAuth();
  const [users, setUsers] = useState([]);
  const [selectedProxy, setSelectedProxy] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [showForm, setShowForm] = useState(false);
  const [showConfig, setShowConfig] = useState(false);
  const [configData, setConfigData] = useState(null);
  const [form, setForm] = useState({ whatsapp: '', expires_at: '' });
  const [reactivatingId, setReactivatingId] = useState(null);
  const [reactivateForm, setReactivateForm] = useState({ userId: null, expiresAt: '' });

  async function loadUsers() {
    try {
      setLoading(true);
      const data = await getUsers(token);
      const proxyUsers = data.filter((user) => String(user.proxy_id) === String(id));
      setUsers(proxyUsers);
      const proxy = proxyUsers[0] ? { id } : null;
      setSelectedProxy(proxy);
    } catch (err) {
      setError(err.message || 'Failed to load users');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    loadUsers();
  }, [token, id]);

  async function handleAddUser(e) {
    e.preventDefault();
    try {
      const data = await createUser({ proxy_id: Number(id), whatsapp: form.whatsapp, expires_at: form.expires_at }, token);
      setShowForm(false);
      setForm({ whatsapp: '', expires_at: '' });
      setConfigData(data);
      setShowConfig(true);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to add user');
    }
  }

  async function handleDisable(userId) {
    try {
      await disableUser(userId, token);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to disable user');
    }
  }

  function openReactivateForm(user) {
    setReactivateForm({ userId: user.id, expiresAt: toDateTimeLocalValue(user.expires_at) });
  }

  function closeReactivateForm() {
    setReactivateForm({ userId: null, expiresAt: '' });
  }

  async function handleReactivate(userId) {
    if (!reactivateForm.expiresAt) {
      setError('Please choose a new expiry date before reactivating');
      return;
    }

    const expiresAtIso = new Date(reactivateForm.expiresAt).toISOString();

    try {
      setReactivatingId(userId);
      await reactivateUser(userId, expiresAtIso, token);
      closeReactivateForm();
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to reactivate user');
    } finally {
      setReactivatingId(null);
    }
  }

  async function handleDelete(userId) {
    if (!window.confirm('Delete this user permanently?')) return;
    try {
      await deleteUser(userId, token);
      await loadUsers();
    } catch (err) {
      setError(err.message || 'Failed to delete user');
    }
  }

  async function handleViewConfig(userId) {
    try {
      const data = await getUserConfig(userId, token);
      setConfigData(data);
      setShowConfig(true);
    } catch (err) {
      setError(err.message || 'Failed to load config');
    }
  }

  const proxyLabel = useMemo(() => selectedProxy?.label || 'Proxy', [selectedProxy]);

  return (
    <div className="min-h-screen bg-slate-950 p-6 text-slate-100">
      <div className="mx-auto max-w-6xl">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <Link to="/" className="text-sm text-cyan-400">← Back to proxies</Link>
            <h1 className="text-3xl font-semibold">{proxyLabel}</h1>
          </div>
          <button className="rounded-lg border border-slate-700 px-4 py-2" onClick={() => setShowForm(true)}>Add User</button>
        </div>

        {error ? <div className="mb-4 rounded-lg border border-rose-500/30 bg-rose-950/40 p-3 text-sm text-rose-300">{error}</div> : null}

        {loading ? <div className="rounded-2xl border border-slate-800 bg-slate-900/70 p-8 text-center text-slate-400">Loading users…</div> : (
          <div className="space-y-3">
            {users.map((user) => (
              <div key={user.id} className="rounded-2xl border border-slate-800 bg-slate-900/80 p-4">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{user.whatsapp}</p>
                    <p className="text-sm text-slate-400">{user.subdomain}</p>
                  </div>
                  <span className={`rounded-full px-3 py-1 text-xs font-medium ${user.status === 'active' ? 'bg-emerald-500/15 text-emerald-300' : user.status === 'expired' ? 'bg-amber-500/15 text-amber-300' : 'bg-slate-700/70 text-slate-300'}`}>{user.status}</span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2 text-sm">
                  <button className="rounded-lg border border-slate-700 px-3 py-2" onClick={() => handleViewConfig(user.id)}>View Config</button>
                  <button className="rounded-lg border border-slate-700 px-3 py-2" onClick={() => handleDisable(user.id)} disabled={user.status !== 'active'}>Disable</button>
                  <button className="rounded-lg border border-slate-700 px-3 py-2" onClick={() => handleDelete(user.id)}>Delete</button>
                  <button className="rounded-lg border border-slate-700 px-3 py-2" onClick={() => openReactivateForm(user)} disabled={reactivatingId === user.id}>Reactivate</button>
                </div>
                {reactivateForm.userId === user.id ? (
                  <div className="mt-3 flex flex-wrap items-center gap-2 text-sm">
                    <input
                      className="rounded-lg border border-slate-700 bg-slate-950 px-3 py-2"
                      type="datetime-local"
                      value={reactivateForm.expiresAt}
                      onChange={(e) => setReactivateForm({ userId: user.id, expiresAt: e.target.value })}
                      required
                    />
                    <button
                      className="rounded-lg bg-cyan-500 px-3 py-2 font-medium text-slate-950"
                      onClick={() => handleReactivate(user.id)}
                      disabled={reactivatingId === user.id}
                    >
                      {reactivatingId === user.id ? 'Reactivating...' : 'Confirm'}
                    </button>
                    <button className="rounded-lg border border-slate-700 px-3 py-2" onClick={closeReactivateForm}>Cancel</button>
                  </div>
                ) : null}
              </div>
            ))}
          </div>
        )}
      </div>

      {showForm ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Add User</h3>
              <button onClick={() => setShowForm(false)}>×</button>
            </div>
            <form className="space-y-3" onSubmit={handleAddUser}>
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" placeholder="WhatsApp" value={form.whatsapp} onChange={(e) => setForm({ ...form, whatsapp: e.target.value })} required />
              <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2" type="datetime-local" value={form.expires_at} onChange={(e) => setForm({ ...form, expires_at: e.target.value })} required />
              <div className="flex justify-end gap-2">
                <button type="button" className="rounded-lg border border-slate-700 px-4 py-2" onClick={() => setShowForm(false)}>Cancel</button>
                <button type="submit" className="rounded-lg bg-cyan-500 px-4 py-2 text-slate-950">Create</button>
              </div>
            </form>
          </div>
        </div>
      ) : null}

      {showConfig && configData ? (
        <div className="fixed inset-0 z-20 flex items-center justify-center bg-slate-950/70 p-4">
          <div className="w-full max-w-2xl rounded-2xl border border-slate-800 bg-slate-900 p-6">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-xl font-semibold">Connection Config</h3>
              <button onClick={() => setShowConfig(false)}>×</button>
            </div>
            <div className="space-y-4">
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <h4 className="font-semibold text-cyan-300">Apple TV (Happ)</h4>
                <p className="mt-2 break-all text-sm text-slate-300">{configData.config.appletv_base64 || 'Not available'}</p>
              </div>
              <div className="rounded-xl border border-slate-800 bg-slate-950/70 p-4">
                <h4 className="font-semibold text-cyan-300">iPhone (manual)</h4>
                <div className="mt-3 grid gap-2 text-sm text-slate-300 md:grid-cols-2">
                  <div>Server: <span className="font-medium text-white">{configData.config.iphone_plain.server}</span></div>
                  <div>Port: <span className="font-medium text-white">{configData.config.iphone_plain.port}</span></div>
                  <div>Username: <span className="font-medium text-white">{configData.config.iphone_plain.username}</span></div>
                  <div>Password: <span className="font-medium text-white">{configData.config.iphone_plain.password}</span></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      ) : null}
    </div>
  );
}
