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
    <div className="panel-card max-w-4xl mx-auto">
      <div className="page-header">
        <div>
          <h2 className="page-title">App Status</h2>
          <p className="page-subtitle">Control global access and expiration for the Playme service.</p>
        </div>
        <span className={`status-pill ${allowed ? "status-pill-success" : "status-pill-danger"}`}>
          {allowed ? "Allowed" : "Denied"}
        </span>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div className="status-panel">
        {loading ? (
          <p className="text-sm text-slate-500">Loading...</p>
        ) : (
          <>
            <div className={`status-card ${allowed ? "status-card-success" : "status-card-danger"}`}>
              <h3 className="token-panel-title">{allowed ? "Global access is enabled" : "Global access is disabled"}</h3>
              <p className="token-panel-subtitle">
                {allowed ? "Devices can connect to the Playme service." : "Devices are currently blocked from accessing the Playme service."}
              </p>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="info-panel">
                <p className="text-sm font-semibold text-slate-700">Expiration</p>
                <p className="mt-2 text-base text-slate-900">{expiresAt ? formatTime(expiresAt) : "No expiration set"}</p>
              </div>
              <div className="form-group">
                <label className="form-label">Expiration Date / Time (optional)</label>
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
                  className="form-input"
                />
              </div>
            </div>

            <div className="button-grid">
              <button
                className="button button-success w-full"
                onClick={() => updateStatus(true)}
                disabled={loading}
              >
                ✓ Allow Access
              </button>
              <button
                className="button button-danger w-full"
                onClick={() => updateStatus(false)}
                disabled={loading}
              >
                ✕ Deny Access
              </button>
            </div>

            <div className="info-panel info-panel-muted">
              <strong>Note:</strong> This setting controls global access for all devices. When set to Denied, all devices will receive an access denied response. Optionally set an expiration for the status change.
            </div>
          </>
        )}
      </div>
    </div>
  );
}
