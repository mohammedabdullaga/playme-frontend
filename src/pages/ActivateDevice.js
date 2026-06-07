import { useState } from "react";
import { useSearchParams } from "react-router-dom";
import API, { adminCreateTokens } from "../api/api";

export default function ActivateDevice() {
  const [searchParams] = useSearchParams();
  const [days, setDays] = useState(30);
  const [count, setCount] = useState(1);
  const [tokens, setTokens] = useState([]);
  const [selectToken, setSelectToken] = useState("");
  const [mac, setMac] = useState(searchParams.get("mac") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const createTokens = async () => {
    try {
      setError(null);
      const res = await adminCreateTokens(days, count);
      setTokens(res.data.tokens || []);
    } catch (e) {
      setError("Failed to create tokens: " + (e.response?.data?.detail || e.message));
    }
  };

  const activateDevice = async () => {
    try {
      setError(null);
      const token = selectToken || tokens[0];
      if (!token || !mac || !email) {
        setError("Token, MAC, and email are required");
        return;
      }
      const res = await API.post("/app/activate", { mac_address: mac, email, token });
      setResult(res.data);
      setMac("");
      setEmail("");
      setSelectToken("");
    } catch (e) {
      setError("Activation failed: " + (e.response?.data?.detail || e.message));
    }
  };

  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
      <h2 className="text-2xl font-semibold text-slate-900">Activate Device</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {result && <div className="alert alert-success">Device activated! Expires at: {result.expires_at}</div>}

      <div className="mt-6 space-y-8">
        <section className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
          <h3 className="text-xl font-semibold text-slate-900">Step 1: Create Token(s)</h3>
          <div className="mt-4 grid gap-6 md:grid-cols-2">
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Token Duration (days)</label>
              <input
                type="number"
                value={days}
                onChange={(e) => setDays(Number(e.target.value))}
                min="1"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
            <div className="space-y-2">
              <label className="block text-sm font-semibold text-slate-700">Number of Tokens to Create</label>
              <input
                type="number"
                value={count}
                onChange={(e) => setCount(Number(e.target.value))}
                min="1"
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
          </div>
          <button className="mt-6 inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700" onClick={createTokens}>
            Create Tokens
          </button>
        </section>

        {tokens.length > 0 && (
          <section className="rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
            <h3 className="text-xl font-semibold text-slate-900">Step 2: Activate Device</h3>
            <div className="mt-4 space-y-6">
              <div className="rounded-3xl bg-white p-4 ring-1 ring-slate-200">
                <p className="text-sm font-semibold text-slate-700">Available Tokens</p>
                <div className="mt-3 flex flex-wrap gap-2">
                  {tokens.map((t) => (
                    <button
                      key={t}
                      className={`token-badge ${selectToken === t ? "active" : ""}`}
                      onClick={() => setSelectToken(t)}
                      type="button"
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="grid gap-6 md:grid-cols-2">
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">MAC Address</label>
                  <input
                    type="text"
                    value={mac}
                    onChange={(e) => setMac(e.target.value)}
                    placeholder="00:11:22:33:44:55"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>
                <div className="space-y-2">
                  <label className="block text-sm font-semibold text-slate-700">Email</label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
                  />
                </div>
              </div>

              <div className="flex flex-col gap-3 sm:flex-row">
                <button className="inline-flex items-center justify-center rounded-2xl bg-emerald-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-emerald-700" onClick={activateDevice}>
                  Activate Device
                </button>
                <button className="inline-flex items-center justify-center rounded-2xl bg-slate-200 px-5 py-3 text-sm font-semibold text-slate-800 transition hover:bg-slate-300" onClick={() => { setTokens([]); setSelectToken(""); }}>
                  Create More Tokens
                </button>
              </div>
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
