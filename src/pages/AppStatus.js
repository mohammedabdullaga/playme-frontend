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
        expires_at: expiresAt
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
    <div className="panel">
      <h2>App Status Control</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {success && <div className="alert alert-success">{success}</div>}

      <div style={{ maxWidth: "600px" }}>
        <div className="form-section">
          <h3>Application Access</h3>
          <p style={{ margin: "12px 0", color: "#6b7280", fontSize: "14px" }}>
            Control whether devices can access the Playme service globally with optional expiration.
          </p>

          {loading ? (
            <p style={{ color: "#9ca3af" }}>Loading...</p>
          ) : (
            <>
              <div style={{ display: "flex", gap: "12px", alignItems: "center", marginTop: "20px" }}>
                <div style={{
                  flex: 1,
                  padding: "20px",
                  background: allowed ? "#f0fdf4" : "#fef2f2",
                  border: `2px solid ${allowed ? "#22c55e" : "#ef4444"}`,
                  borderRadius: "8px",
                  textAlign: "center"
                }}>
                  <h3 style={{ margin: "0 0 8px 0", fontSize: "18px", color: allowed ? "#16a34a" : "#dc2626" }}>
                    {allowed ? "🟢 ALLOWED" : "🔴 DENIED"}
                  </h3>
                  <p style={{ margin: "0", fontSize: "13px", color: allowed ? "#166534" : "#991b1b" }}>
                    {allowed ? "Devices can access the app" : "Devices cannot access the app"}
                  </p>
                </div>
              </div>

              {expiresAt && (
                <div style={{ marginTop: "16px", padding: "12px", background: "#fef3c7", border: "1px solid #fcd34d", borderRadius: "6px" }}>
                  <p style={{ margin: "0", fontSize: "13px", color: "#92400e" }}>
                    <strong>Expires at:</strong> {formatTime(expiresAt)}
                  </p>
                </div>
              )}

              <div className="form-group" style={{ marginTop: "20px" }}>
                <label>Expiration Date/Time (optional)</label>
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
                />
              </div>
            </>
          )}

          <div style={{ display: "flex", gap: "10px", marginTop: "24px" }}>
            <button
              className={allowed ? "btn-secondary" : "btn-success"}
              onClick={() => updateStatus(true)}
              disabled={loading}
            >
              ✓ Allow Access
            </button>
            <button
              className={allowed ? "btn-danger" : "btn-secondary"}
              onClick={() => updateStatus(false)}
              disabled={loading}
            >
              ✕ Deny Access
            </button>
          </div>

          <div style={{ marginTop: "20px", padding: "12px", background: "#eff6ff", border: "1px solid #93c5fd", borderRadius: "6px" }}>
            <p style={{ margin: "0", fontSize: "12px", color: "#1e40af" }}>
              <strong>Note:</strong> This setting controls global app access for all devices. When set to DENIED, all devices will receive access denied responses. You can optionally set an expiration time for the access status.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
