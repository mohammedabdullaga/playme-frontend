import { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

export default function LoginPage() {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const { token, signIn, loading, error } = useAuth();

  if (token) {
    return <Navigate to="/" replace />;
  }

  async function handleSubmit(e) {
    e.preventDefault();
    await signIn(username, password);
  }

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <div className="w-full max-w-md rounded-2xl border border-slate-800 bg-slate-900/80 p-8 shadow-2xl">
        <h1 className="text-2xl font-semibold">Proxy Admin</h1>
        <p className="mt-2 text-sm text-slate-400">Sign in to manage proxies and users.</p>
        <form className="mt-6 space-y-4" onSubmit={handleSubmit}>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Username</label>
            <input className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none" value={username} onChange={(e) => setUsername(e.target.value)} />
          </div>
          <div>
            <label className="mb-1 block text-sm text-slate-300">Password</label>
            <input type="password" className="w-full rounded-lg border border-slate-700 bg-slate-950 px-3 py-2 outline-none" value={password} onChange={(e) => setPassword(e.target.value)} />
          </div>
          {error ? <p className="text-sm text-rose-400">{error}</p> : null}
          <button className="w-full rounded-lg bg-cyan-500 px-4 py-2 font-medium text-slate-950" disabled={loading}>{loading ? 'Signing in...' : 'Login'}</button>
        </form>
      </div>
    </div>
  );
}
