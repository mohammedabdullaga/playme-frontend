import { useEffect, useState } from "react";
import {
  adminCreateReseller,
  adminDeleteReseller,
  adminGetResellerActivity,
  adminGetResellerPricing,
  adminGetResellers,
  adminTopUpReseller,
  adminUpdateReseller,
  adminUpdateResellerPricing,
} from "../api/api";

const DEFAULT_TOKEN_COSTS = { 30: 3, 90: 8, 180: 15, 365: 26 };
const DEFAULT_PROXY_COSTS = { 1: 5, 3: 13, 6: 24, 12: 38 };

function formatApiError(err, fallback) {
  const detail = err?.response?.data?.detail;

  if (typeof detail === "string" && detail.trim()) {
    return detail;
  }

  if (Array.isArray(detail) && detail.length > 0) {
    return detail
      .map((item) => {
        if (typeof item === "string") {
          return item;
        }

        if (item && typeof item === "object") {
          const location = Array.isArray(item.loc) ? item.loc.join(".") : item.loc;
          const message = item.msg || item.message || "Validation error";
          return location ? `${location}: ${message}` : message;
        }

        return String(item);
      })
      .join("; ");
  }

  if (detail && typeof detail === "object") {
    return detail.msg || detail.message || fallback;
  }

  return err?.response?.data?.error || err?.message || fallback;
}

export default function Resellers() {
  const [resellers, setResellers] = useState([]);
  const [selectedReseller, setSelectedReseller] = useState(null);
  const [form, setForm] = useState({ email: "", password: "", points_balance: 0, is_active: true });
  const [pricingForm, setPricingForm] = useState({
    token_30: DEFAULT_TOKEN_COSTS[30],
    token_90: DEFAULT_TOKEN_COSTS[90],
    token_180: DEFAULT_TOKEN_COSTS[180],
    token_365: DEFAULT_TOKEN_COSTS[365],
    proxy_1: DEFAULT_PROXY_COSTS[1],
    proxy_3: DEFAULT_PROXY_COSTS[3],
    proxy_6: DEFAULT_PROXY_COSTS[6],
    proxy_12: DEFAULT_PROXY_COSTS[12],
  });
  const [activityItems, setActivityItems] = useState([]);
  const [message, setMessage] = useState("");

  const loadResellers = async () => {
    try {
      const res = await adminGetResellers();
      setResellers(res.data || []);
    } catch (err) {
      setMessage(formatApiError(err, "Failed to load resellers"));
    }
  };

  const loadPricing = async () => {
    try {
      const res = await adminGetResellerPricing();
      const tokenCosts = res.data?.token_costs || DEFAULT_TOKEN_COSTS;
      const proxyCosts = res.data?.proxy_plan_costs || DEFAULT_PROXY_COSTS;
      setPricingForm({
        token_30: Number(tokenCosts[30] ?? DEFAULT_TOKEN_COSTS[30]),
        token_90: Number(tokenCosts[90] ?? DEFAULT_TOKEN_COSTS[90]),
        token_180: Number(tokenCosts[180] ?? DEFAULT_TOKEN_COSTS[180]),
        token_365: Number(tokenCosts[365] ?? DEFAULT_TOKEN_COSTS[365]),
        proxy_1: Number(proxyCosts[1] ?? DEFAULT_PROXY_COSTS[1]),
        proxy_3: Number(proxyCosts[3] ?? DEFAULT_PROXY_COSTS[3]),
        proxy_6: Number(proxyCosts[6] ?? DEFAULT_PROXY_COSTS[6]),
        proxy_12: Number(proxyCosts[12] ?? DEFAULT_PROXY_COSTS[12]),
      });
    } catch (err) {
      setMessage(formatApiError(err, "Failed to load pricing"));
    }
  };

  const loadActivity = async () => {
    try {
      const res = await adminGetResellerActivity();
      setActivityItems(res.data?.items || []);
    } catch (err) {
      setMessage(formatApiError(err, "Failed to load reseller activity"));
    }
  };

  useEffect(() => {
    loadResellers();
    loadPricing();
    loadActivity();
  }, []);

  const handleSavePricing = async (e) => {
    e.preventDefault();
    try {
      await adminUpdateResellerPricing({
        token_costs: {
          30: Number(pricingForm.token_30),
          90: Number(pricingForm.token_90),
          180: Number(pricingForm.token_180),
          365: Number(pricingForm.token_365),
        },
        proxy_plan_costs: {
          1: Number(pricingForm.proxy_1),
          3: Number(pricingForm.proxy_3),
          6: Number(pricingForm.proxy_6),
          12: Number(pricingForm.proxy_12),
        },
      });
      setMessage("Pricing updated");
      await loadPricing();
      await loadActivity();
    } catch (err) {
      setMessage(formatApiError(err, "Failed to update pricing"));
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminCreateReseller({ ...form, points_balance: Number(form.points_balance) });
      setMessage("Reseller created");
      setForm({ email: "", password: "", points_balance: 0, is_active: true });
      await loadResellers();
      await loadActivity();
    } catch (err) {
      setMessage(formatApiError(err, "Create failed"));
    }
  };

  const handleTopUp = async (resellerId) => {
    const amount = window.prompt("Points amount");
    if (!amount) return;
    try {
      await adminTopUpReseller({ reseller_id: resellerId, amount: Number(amount), reason: "admin_top_up" });
      setMessage("Points updated");
      await loadResellers();
      await loadActivity();
    } catch (err) {
      setMessage(formatApiError(err, "Top-up failed"));
    }
  };

  const toggleActive = async (reseller) => {
    try {
      await adminUpdateReseller(reseller.id, { is_active: !reseller.is_active });
      await loadResellers();
      await loadActivity();
    } catch (err) {
      setMessage(formatApiError(err, "Update failed"));
    }
  };

  const handleEdit = (reseller) => {
    setSelectedReseller(reseller);
    setForm({
      email: reseller.email,
      password: "",
      points_balance: reseller.points_balance,
      is_active: reseller.is_active,
    });
  };

  const handleDelete = async (resellerId) => {
    if (!window.confirm("Delete this reseller?")) return;
    try {
      await adminDeleteReseller(resellerId);
      setMessage("Reseller deleted");
      await loadResellers();
      await loadActivity();
    } catch (err) {
      setMessage(formatApiError(err, "Delete failed"));
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    if (!selectedReseller) return;

    try {
      await adminUpdateReseller(selectedReseller.id, {
        email: form.email,
        password: form.password || undefined,
        points_balance: Number(form.points_balance),
        is_active: form.is_active,
      });
      setMessage("Reseller updated");
      setSelectedReseller(null);
      setForm({ email: "", password: "", points_balance: 0, is_active: true });
      await loadResellers();
      await loadActivity();
    } catch (err) {
      setMessage(formatApiError(err, "Update failed"));
    }
  };

  const handleCancelEdit = () => {
    setSelectedReseller(null);
    setForm({ email: "", password: "", points_balance: 0, is_active: true });
  };

  return (
    <div style={pageStyle}>
      <div style={headerStyle}>
        <div>
          <h2 style={{ margin: 0 }}>Resellers</h2>
          <p style={subheadStyle}>Manage reseller accounts, points, activation status, and point pricing in one place.</p>
        </div>
      </div>

      {message ? <div style={alertStyle}>{message}</div> : null}

      <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>{selectedReseller ? "Edit reseller" : "Create reseller"}</h3>
        <form onSubmit={selectedReseller ? handleSave : handleCreate}>
          <div style={formGridStyle}>
            <input
              value={form.email}
              onChange={(e) => setForm({ ...form, email: e.target.value })}
              placeholder="Email"
              style={inputStyle}
            />
            <input
              type="password"
              value={form.password}
              onChange={(e) => setForm({ ...form, password: e.target.value })}
              placeholder={selectedReseller ? "New password (leave blank to keep current)" : "Password"}
              style={inputStyle}
            />
            <input
              type="number"
              value={form.points_balance}
              onChange={(e) => setForm({ ...form, points_balance: e.target.value })}
              placeholder="Points balance"
              style={inputStyle}
            />
          </div>

          <label style={{ display: "inline-flex", alignItems: "center", gap: 8, marginTop: 8, marginBottom: 14, fontWeight: 500 }}>
            <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} />
            Active
          </label>

          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="submit" style={primaryButtonStyle}>{selectedReseller ? "Save" : "Create"}</button>
            {selectedReseller ? (
              <button type="button" onClick={handleCancelEdit} style={mutedButtonStyle}>Cancel</button>
            ) : null}
          </div>
        </form>
      </div>

      <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>Reseller pricing</h3>
        <form onSubmit={handleSavePricing} style={{ display: "grid", gap: 12 }}>
          <div style={{ fontWeight: 600, color: "#0f172a" }}>Token costs (points)</div>
          <div style={formGridStyle}>
            <input type="number" min="0" value={pricingForm.token_30} onChange={(e) => setPricingForm({ ...pricingForm, token_30: e.target.value })} placeholder="30 days" style={inputStyle} />
            <input type="number" min="0" value={pricingForm.token_90} onChange={(e) => setPricingForm({ ...pricingForm, token_90: e.target.value })} placeholder="90 days" style={inputStyle} />
            <input type="number" min="0" value={pricingForm.token_180} onChange={(e) => setPricingForm({ ...pricingForm, token_180: e.target.value })} placeholder="180 days" style={inputStyle} />
            <input type="number" min="0" value={pricingForm.token_365} onChange={(e) => setPricingForm({ ...pricingForm, token_365: e.target.value })} placeholder="365 days" style={inputStyle} />
          </div>

          <div style={{ fontWeight: 600, color: "#0f172a", marginTop: 4 }}>Proxy costs (points)</div>
          <div style={formGridStyle}>
            <input type="number" min="0" value={pricingForm.proxy_1} onChange={(e) => setPricingForm({ ...pricingForm, proxy_1: e.target.value })} placeholder="1 month" style={inputStyle} />
            <input type="number" min="0" value={pricingForm.proxy_3} onChange={(e) => setPricingForm({ ...pricingForm, proxy_3: e.target.value })} placeholder="3 months" style={inputStyle} />
            <input type="number" min="0" value={pricingForm.proxy_6} onChange={(e) => setPricingForm({ ...pricingForm, proxy_6: e.target.value })} placeholder="6 months" style={inputStyle} />
            <input type="number" min="0" value={pricingForm.proxy_12} onChange={(e) => setPricingForm({ ...pricingForm, proxy_12: e.target.value })} placeholder="12 months" style={inputStyle} />
          </div>

          <div>
            <button type="submit" style={primaryButtonStyle}>Save pricing</button>
          </div>
        </form>
      </div>

      <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>Existing resellers</h3>
        <div style={{ display: "grid", gap: 10 }}>
          {resellers.map((reseller) => (
            <div key={reseller.id} style={resellerRowStyle}>
              <div>
                <div style={{ fontWeight: 700, fontSize: 22, color: "#0f172a" }}>{reseller.email}</div>
                <div style={{ color: "#475569", marginTop: 6 }}>
                  Points: <strong>{reseller.points_balance}</strong> • {reseller.is_active ? "Active" : "Disabled"}
                </div>
              </div>

              <div style={{ display: "flex", gap: 8, flexWrap: "wrap" }}>
                <button onClick={() => handleEdit(reseller)} style={mutedButtonStyle}>Edit</button>
                <button onClick={() => handleTopUp(reseller.id)} style={primaryButtonStyle}>Top up</button>
                <button onClick={() => toggleActive(reseller)} style={mutedButtonStyle}>{reseller.is_active ? "Disable" : "Enable"}</button>
                <button onClick={() => handleDelete(reseller.id)} style={dangerButtonStyle}>Delete</button>
              </div>
            </div>
          ))}
        </div>
      </div>

      <div style={cardStyle}>
        <h3 style={sectionTitleStyle}>Activity logs</h3>
        <div style={{ display: "grid", gap: 8 }}>
          {activityItems.length === 0 ? (
            <div style={{ color: "#64748b" }}>No activity yet.</div>
          ) : activityItems.map((item) => (
            <div key={item.id} style={{ padding: "12px 14px", borderRadius: 10, border: "1px solid #e2e8f0", background: "#f8fafc" }}>
              <div style={{ display: "flex", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
                <div>
                  <div style={{ fontWeight: 600, color: "#0f172a" }}>{item.reseller_email || `Reseller #${item.reseller_id}`}</div>
                  <div style={{ color: "#475569", marginTop: 4 }}>
                    {item.kind} • amount: {item.amount} • {item.reason}
                  </div>
                </div>
                <div style={{ color: "#64748b", fontSize: 13 }}>{new Date(item.created_at).toLocaleString()}</div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

const pageStyle = { display: "grid", gap: 18 };
const headerStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12 };
const subheadStyle = { color: "#64748b", marginTop: 6, marginBottom: 0 };
const alertStyle = { padding: "10px 12px", borderRadius: 10, background: "#ecfeff", border: "1px solid #a5f3fc", color: "#155e75" };
const cardStyle = { background: "white", borderRadius: 14, padding: 18, border: "1px solid #e2e8f0", boxShadow: "0 10px 24px rgba(15,23,42,0.06)" };
const sectionTitleStyle = { marginTop: 0, marginBottom: 14, color: "#0f172a" };
const formGridStyle = { display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 10 };
const resellerRowStyle = { display: "flex", justifyContent: "space-between", alignItems: "center", gap: 12, padding: 14, borderRadius: 12, border: "1px solid #e2e8f0", background: "#f8fafc", flexWrap: "wrap" };
const inputStyle = { width: "100%", padding: "10px 12px", border: "1px solid #cbd5e1", borderRadius: 10, fontSize: 14 };
const buttonBase = { border: "none", borderRadius: 10, padding: "9px 14px", cursor: "pointer", fontWeight: 600 };
const primaryButtonStyle = { ...buttonBase, background: "#2563eb", color: "white" };
const mutedButtonStyle = { ...buttonBase, background: "#e2e8f0", color: "#0f172a" };
const dangerButtonStyle = { ...buttonBase, background: "#fee2e2", color: "#b91c1c" };
