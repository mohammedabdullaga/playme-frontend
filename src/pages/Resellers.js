import { useEffect, useState } from "react";
import {
  adminCreateReseller,
  adminDeleteReseller,
  adminGetResellerPricing,
  adminGetResellers,
  adminTopUpReseller,
  adminUpdateReseller,
  adminUpdateResellerPricing,
} from "../api/api";

const DEFAULT_TOKEN_COSTS = { 30: 3, 90: 8, 180: 15, 365: 26 };
const DEFAULT_PROXY_COSTS = { 1: 5, 3: 13, 6: 24, 12: 38 };

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
  const [message, setMessage] = useState("");

  const loadResellers = async () => {
    try {
      const res = await adminGetResellers();
      setResellers(res.data || []);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to load resellers");
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
      setMessage(err.response?.data?.detail || "Failed to load pricing");
    }
  };

  useEffect(() => {
    loadResellers();
    loadPricing();
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
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to update pricing");
    }
  };

  const handleCreate = async (e) => {
    e.preventDefault();
    try {
      await adminCreateReseller({ ...form, points_balance: Number(form.points_balance) });
      setMessage("Reseller created");
      setForm({ email: "", password: "", points_balance: 0, is_active: true });
      await loadResellers();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Create failed");
    }
  };

  const handleTopUp = async (resellerId) => {
    const amount = window.prompt("Points amount");
    if (!amount) return;
    try {
      await adminTopUpReseller({ reseller_id: resellerId, amount: Number(amount), reason: "admin_top_up" });
      setMessage("Points updated");
      await loadResellers();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Top-up failed");
    }
  };

  const toggleActive = async (reseller) => {
    try {
      await adminUpdateReseller(reseller.id, { is_active: !reseller.is_active });
      await loadResellers();
    } catch (err) {
      setMessage(err.response?.data?.detail || "Update failed");
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
    } catch (err) {
      setMessage(err.response?.data?.detail || "Delete failed");
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
    } catch (err) {
      setMessage(err.response?.data?.detail || "Update failed");
    }
  };

  const handleCancelEdit = () => {
    setSelectedReseller(null);
    setForm({ email: "", password: "", points_balance: 0, is_active: true });
  };

  return (
    <div>
      <h2>Resellers</h2>
      {message ? <div style={{ marginBottom: 12 }}>{message}</div> : null}
      <form onSubmit={selectedReseller ? handleSave : handleCreate} style={{ background: "white", padding: 16, borderRadius: 8, marginBottom: 20 }}>
        <h3>{selectedReseller ? "Edit reseller" : "Create reseller"}</h3>
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" style={inputStyle} />
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder={selectedReseller ? "New password (leave blank to keep current)" : "Password"} style={inputStyle} />
        <input type="number" value={form.points_balance} onChange={(e) => setForm({ ...form, points_balance: e.target.value })} placeholder="Points balance" style={inputStyle} />
        <label style={{ display: "block", marginBottom: 10 }}>
          <input type="checkbox" checked={form.is_active} onChange={(e) => setForm({ ...form, is_active: e.target.checked })} /> Active
        </label>
        <button type="submit">{selectedReseller ? "Save" : "Create"}</button>
        {selectedReseller && <button type="button" onClick={handleCancelEdit} style={{ marginLeft: 10 }}>Cancel</button>}
      </form>

      <div style={{ background: "white", padding: 16, borderRadius: 8 }}>
        <h3>Reseller pricing</h3>
        <form onSubmit={handleSavePricing} style={{ display: "grid", gap: 10, marginBottom: 20 }}>
          <div style={{ fontWeight: 600 }}>Token costs</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            <input type="number" min="0" value={pricingForm.token_30} onChange={(e) => setPricingForm({ ...pricingForm, token_30: e.target.value })} placeholder="30 days" style={inputStyle} />
            <input type="number" min="0" value={pricingForm.token_90} onChange={(e) => setPricingForm({ ...pricingForm, token_90: e.target.value })} placeholder="90 days" style={inputStyle} />
            <input type="number" min="0" value={pricingForm.token_180} onChange={(e) => setPricingForm({ ...pricingForm, token_180: e.target.value })} placeholder="180 days" style={inputStyle} />
            <input type="number" min="0" value={pricingForm.token_365} onChange={(e) => setPricingForm({ ...pricingForm, token_365: e.target.value })} placeholder="365 days" style={inputStyle} />
          </div>
          <div style={{ fontWeight: 600, marginTop: 6 }}>Proxy costs</div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(160px, 1fr))", gap: 10 }}>
            <input type="number" min="0" value={pricingForm.proxy_1} onChange={(e) => setPricingForm({ ...pricingForm, proxy_1: e.target.value })} placeholder="1 month" style={inputStyle} />
            <input type="number" min="0" value={pricingForm.proxy_3} onChange={(e) => setPricingForm({ ...pricingForm, proxy_3: e.target.value })} placeholder="3 months" style={inputStyle} />
            <input type="number" min="0" value={pricingForm.proxy_6} onChange={(e) => setPricingForm({ ...pricingForm, proxy_6: e.target.value })} placeholder="6 months" style={inputStyle} />
            <input type="number" min="0" value={pricingForm.proxy_12} onChange={(e) => setPricingForm({ ...pricingForm, proxy_12: e.target.value })} placeholder="12 months" style={inputStyle} />
          </div>
          <div>
            <button type="submit">Save pricing</button>
          </div>
        </form>

        <h3>Existing resellers</h3>
        {resellers.map((reseller) => (
          <div key={reseller.id} style={{ borderBottom: "1px solid #e2e8f0", padding: "10px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>{reseller.email}</strong><br />
              <span>Points: {reseller.points_balance} • {reseller.is_active ? "Active" : "Disabled"}</span>
            </div>
            <div>
              <button onClick={() => handleEdit(reseller)} style={{ marginRight: 8 }}>Edit</button>
              <button onClick={() => handleTopUp(reseller.id)} style={{ marginRight: 8 }}>Top up</button>
              <button onClick={() => toggleActive(reseller)} style={{ marginRight: 8 }}>{reseller.is_active ? "Disable" : "Enable"}</button>
              <button onClick={() => handleDelete(reseller.id)} style={{ color: "red" }}>Delete</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "10px 12px", marginBottom: 10, border: "1px solid #cbd5e1", borderRadius: 8 };
