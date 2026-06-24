import { useEffect, useState } from "react";
import { getProxyList, adminSetProxy } from "../api/api";

const emptyProxy = { name: "", host: "", port: "", username: "", password: "" };

export default function Proxy() {
  const [proxies, setProxies] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("success");

  useEffect(() => {
    fetchProxyList();
  }, []);

  const fetchProxyList = async () => {
    try {
      setLoading(true);
      const res = await getProxyList();
      setProxies(res.data.proxies || []);
    } catch (error) {
      setMessage("Failed to load proxy list.");
      setMessageType("error");
      setProxies([]);
    } finally {
      setLoading(false);
    }
  };

  const updateProxy = (index, key, value) => {
    setProxies((current) => {
      const next = [...current];
      next[index] = { ...next[index], [key]: value };
      return next;
    });
  };

  const addProxy = () => {
    setProxies((current) => [...current, { ...emptyProxy }]);
  };

  const removeProxy = (index) => {
    setProxies((current) => current.filter((_, idx) => idx !== index));
  };

  const save = async () => {
    try {
      setSaving(true);
      setMessage("");
      const payload = {
        proxies: proxies.map((proxy) => ({
          name: proxy.name || null,
          host: proxy.host,
          port: Number(proxy.port),
          username: proxy.username || null,
          password: proxy.password || null,
        })),
      };
      const res = await adminSetProxy(payload);
      setProxies(res.data.proxies || []);
      setMessage("Proxy list saved successfully.");
      setMessageType("success");
    } catch (error) {
      setMessage(error.response?.data?.detail || "Failed to save proxy list.");
      setMessageType("error");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200 max-w-6xl mx-auto">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <div>
          <h2 className="text-2xl font-semibold text-slate-900">Proxy Configuration</h2>
          <p className="text-sm text-slate-500">Load, edit, and save the proxy list used by your Android app.</p>
        </div>
        <button
          className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700"
          onClick={addProxy}
          type="button"
        >
          Add Proxy
        </button>
      </div>

      {message && (
        <div className={`mt-6 rounded-2xl p-4 ${messageType === "error" ? "bg-red-50 text-red-700" : "bg-emerald-50 text-emerald-700"}`}>
          {message}
        </div>
      )}

      {loading ? (
        <p className="mt-6 text-slate-500">Loading proxy list...</p>
      ) : (
        <div className="mt-6 space-y-4">
          {proxies.length === 0 ? (
            <div className="rounded-3xl bg-slate-50 p-6 text-slate-600 ring-1 ring-slate-200">No proxies saved. Add one to configure.</div>
          ) : (
            <div className="overflow-x-auto rounded-3xl bg-slate-50 p-4 ring-1 ring-slate-200">
              <div className="grid gap-4">
                {proxies.map((proxy, index) => (
                  <div key={`${proxy.name || proxy.host}-${index}`} className="grid gap-4 rounded-3xl bg-white p-4 shadow-sm ring-1 ring-slate-200 md:grid-cols-6 md:items-end">
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Name</label>
                      <input
                        value={proxy.name || ""}
                        onChange={(e) => updateProxy(index, "name", e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        placeholder="proxy-1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Host</label>
                      <input
                        value={proxy.host}
                        onChange={(e) => updateProxy(index, "host", e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        placeholder="127.0.0.1"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Port</label>
                      <input
                        type="number"
                        value={proxy.port}
                        onChange={(e) => updateProxy(index, "port", e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        placeholder="1080"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Username</label>
                      <input
                        value={proxy.username || ""}
                        onChange={(e) => updateProxy(index, "username", e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        placeholder="optional"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-semibold text-slate-700">Password</label>
                      <input
                        type="password"
                        value={proxy.password || ""}
                        onChange={(e) => updateProxy(index, "password", e.target.value)}
                        className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                        placeholder="optional"
                      />
                    </div>
                    <button
                      type="button"
                      className="inline-flex items-center justify-center rounded-2xl bg-rose-600 px-4 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-rose-700"
                      onClick={() => removeProxy(index)}
                    >
                      Remove
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-3 md:flex-row md:items-center md:justify-between">
            <p className="text-sm text-slate-500">This list is returned by <code className="rounded bg-slate-100 px-1 py-0.5">GET /app/proxy</code>.</p>
            <button
              className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700 disabled:cursor-not-allowed disabled:opacity-50"
              onClick={save}
              disabled={saving}
              type="button"
            >
              {saving ? "Saving..." : "Save Proxy List"}
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
