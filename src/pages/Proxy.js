import { useState } from "react";
import API from "../api/api";

export default function Proxy() {
  const [mode, setMode] = useState("direct");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [result, setResult] = useState(null);

  const save = async () => {
    const payload =
      mode === "socks5"
        ? { mode, socks: { host, port: Number(port), user, pass } }
        : { mode };

    const res = await API.post("/admin/proxy", payload);
    setResult(res.data);
  };

  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-slate-900">Proxy Control</h2>
      <div className="mt-6 space-y-6">
        <div className="grid gap-6">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Mode</label>
            <select
              value={mode}
              onChange={(e) => setMode(e.target.value)}
              className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            >
              <option value="direct">Direct (No Proxy)</option>
              <option value="socks5">SOCKS5</option>
            </select>
          </div>

          {mode === "socks5" && (
            <div className="grid gap-6 md:grid-cols-2">
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Host</label>
                <input
                  placeholder="1.2.3.4"
                  value={host}
                  onChange={(e) => setHost(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Port</label>
                <input
                  type="number"
                  placeholder="1080"
                  value={port}
                  onChange={(e) => setPort(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Username</label>
                <input
                  placeholder="(optional)"
                  value={user}
                  onChange={(e) => setUser(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
              <div className="space-y-2">
                <label className="block text-sm font-semibold text-slate-700">Password</label>
                <input
                  type="password"
                  placeholder="(optional)"
                  value={pass}
                  onChange={(e) => setPass(e.target.value)}
                  className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                />
              </div>
            </div>
          )}
        </div>

        <button className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700" onClick={save}>
          Apply Proxy Configuration
        </button>
      </div>

      {result && (
        <div className="mt-8 rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
          <h3 className="text-xl font-semibold text-slate-900">Configuration Result</h3>
          <pre className="mt-4 rounded-2xl bg-slate-900 p-4 text-sm text-slate-100 overflow-x-auto">{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
