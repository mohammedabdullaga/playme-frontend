import { useState } from "react";

export default function Login() {
  const [key, setKey] = useState("");

  const submit = () => {
    localStorage.setItem("admin_key", key);
    window.location.href = "/dashboard";
  };

  return (
    <div className="mx-auto mt-28 max-w-md rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
      <h2 className="text-3xl font-semibold text-slate-900">Playme Admin Login</h2>
      <p className="mt-2 text-sm text-slate-500">Sign in with your admin API key to manage devices, subscriptions, and server status.</p>

      <div className="mt-8 space-y-6">
        <div className="space-y-3">
          <label className="block text-sm font-semibold text-slate-700">Admin API Key</label>
          <input
            type="password"
            placeholder="Enter your admin API key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && submit()}
            className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
          />
        </div>

        <button
          className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
          onClick={submit}
        >
          Login
        </button>
      </div>
    </div>
  );
}
