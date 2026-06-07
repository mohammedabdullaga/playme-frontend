import { useState } from "react";
import API from "../api/api";

export default function Tokens() {
  const [days, setDays] = useState(30);
  const [count, setCount] = useState(1);
  const [tokens, setTokens] = useState([]);

  const create = async () => {
    const res = await API.post(`/admin/tokens?days=${days}&count=${count}`);
    setTokens(res.data.tokens);
  };

  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-slate-900">Create Tokens</h2>
      <div className="mt-6 space-y-6">
        <div className="grid gap-6 md:grid-cols-2">
          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Token Duration (days)</label>
            <input
              type="number"
              value={days}
              onChange={(e) => setDays(e.target.value)}
              min="1"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>

          <div className="space-y-2">
            <label className="block text-sm font-semibold text-slate-700">Number of Tokens to Create</label>
            <input
              type="number"
              value={count}
              onChange={(e) => setCount(e.target.value)}
              min="1"
              className="w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-slate-900 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
            />
          </div>
        </div>

        <button className="inline-flex items-center justify-center rounded-2xl bg-sky-600 px-5 py-3 text-sm font-semibold text-white shadow-sm transition hover:bg-sky-700" onClick={create}>
          Generate Tokens
        </button>
      </div>

      {tokens.length > 0 && (
        <div className="mt-10 rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
          <h3 className="text-xl font-semibold text-slate-900">Generated Tokens ({tokens.length})</h3>
          <div className="mt-4 flex flex-wrap gap-3">
            {tokens.map((t) => (
              <button
                key={t}
                className="token-badge"
                onClick={() => navigator.clipboard.writeText(t)}
                title="Click to copy"
              >
                {t}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
