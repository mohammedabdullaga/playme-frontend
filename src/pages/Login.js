import { useState } from "react";
import { adminGetDevices } from "../api/api";

export default function Login() {
  const [key, setKey] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!key.trim()) {
      setError("Please enter your admin API key.");
      return;
    }

    setLoading(true);
    setError("");
    localStorage.setItem("admin_key", key.trim());

    try {
      await adminGetDevices();
      window.location.href = "/dashboard";
    } catch (err) {
      localStorage.removeItem("admin_key");
      setError("Invalid admin API key or unable to validate. Please try again.");
    } finally {
      setLoading(false);
    }
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

        {error && <div className="alert alert-error">{error}</div>}

        <button
          className="w-full rounded-2xl bg-sky-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
          onClick={submit}
          disabled={loading}
        >
          {loading ? "Validating..." : "Login"}
        </button>
      </div>
    </div>
  );
}
