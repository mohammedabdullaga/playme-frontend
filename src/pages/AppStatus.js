import { useEffect, useState } from "react";
import API from "../api/api";

export default function AppStatus() {
  const [allowed, setAllowed] = useState(false);
  const [expiresAt, setExpiresAt] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);

  useEffect(() => {
    loadStatus();
  }, []);

  const loadStatus = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await API.get("/app/status");
      setAllowed(res.data.allowed ?? false);
      setExpiresAt(res.data.expires_at || "");
    } catch (e) {
      setError("Failed to load status: " + (e.response?.data?.detail || e.message));
    } finally {
      setLoading(false);
    }
  };

  const updateStatus = async (newAllowed) => {
    try {
      setError(null);
      setSuccess(null);
      const res = await API.put("/admin/app/status", {
        allowed: newAllowed,
        expires_at: expiresAt,
      });
      setAllowed(res.data.allowed ?? newAllowed);
      setExpiresAt(res.data.expires_at || "");
      setSuccess(`App status set to ${newAllowed ? "ALLOWED" : "DENIED"}`);
    } catch (e) {
      setError("Failed to update status: " + (e.response?.data?.detail || e.message));
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200 max-w-3xl mx-auto">
      <h2 className="text-2xl font-semibold text-slate-900">App Status Control</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="mt-6 space-y-6 rounded-3xl bg-slate-50 p-6 ring-1 ring-slate-200">
        <div>
          <h3 className="text-lg font-semibold text-slate-900">Application Access</h3>
          <p className="mt-2 text-sm text-slate-600">Control whether devices can access the Playme service globally with optional expiration.</p>
        </div>

        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <>
            <div className={`rounded-3xl p-6 text-center ${allowed ? "bg-emerald-50 border border-emerald-200" : "bg-red-50 border border-red-200"}`}>
              <h3 className={`text-xl font-semibold ${allowed ? "text-emerald-700" : "text-red-700"}`}>
                {allowed ? "🟢 ALLOWED" : "🔴 DENIED"}
              </h3>
              <p className={`mt-2 text-sm ${allowed ? "text-emerald-700" : "text-red-700"}`}>
                {allowed ? "Devices can access the app" : "Devices cannot access the app"}
              </p>
            </div>

            {expiresAt && (
              <div className="rounded-2xl bg-amber-50 border border-amber-200 p-4 text-sm text-amber-800">
                <strong>Expires at:</strong> {formatTime(expiresAt)}
              </div>
            )}

            <div className="space-y-3">
              <label className="block text-sm font-semibold text-slate-700">Expiration Date/Time (optional)</label>
              <input
                type="datetime-local"
                value={expiresAt ? new Date(expiresAt).toISOString().slice(0, 16) : ""}
                onChange={(e) => {
                  if (e.target.value) {
                    setExpiresAt(new Date(e.target.value).toISOString());
                  } else {
                    setExpiresAt("");
                  }
                }}
                className="w-full rounded-2xl border border-slate-300 bg-white px-4 py-3 text-slate-700 shadow-sm focus:border-sky-500 focus:outline-none focus:ring-2 focus:ring-sky-200"
              />
            </div>
          </>
        )}

        <div className="flex flex-col gap-3 sm:flex-row">
          <button
            className={allowed ? "btn-secondary w-full" : "btn-success w-full"}
            onClick={() => updateStatus(true)}
            disabled={loading}
          >
            ✓ Allow Access
          </button>
          <button
            className={allowed ? "btn-danger w-full" : "btn-secondary w-full"}
            onClick={() => updateStatus(false)}
            disabled={loading}
          >
            ✕ Deny Access
          </button>
        </div>

        <div className="rounded-2xl bg-sky-50 border border-sky-200 p-4 text-sm text-slate-700">
          <strong>Note:</strong> This setting controls global app access for all devices. When set to DENIED, all devices will receive access denied responses. You can optionally set an expiration time for the access status.
        </div>
      </div>
    </div>
  );
}
