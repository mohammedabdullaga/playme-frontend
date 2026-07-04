import { useEffect, useState } from "react";
import { adminCreateReseller, adminGetResellers, adminTopUpReseller, adminUpdateReseller } from "../api/api";

export default function Resellers() {
  const [resellers, setResellers] = useState([]);
  const [form, setForm] = useState({ email: "", password: "", points_balance: 0, is_active: true });
  const [message, setMessage] = useState("");

  const loadResellers = async () => {
    try {
      const res = await adminGetResellers();
      setResellers(res.data || []);
    } catch (err) {
      setMessage(err.response?.data?.detail || "Failed to load resellers");
    }
  };

  useEffect(() => {
    loadResellers();
  }, []);

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

  return (
    <div>
      <h2>Resellers</h2>
      {message ? <div style={{ marginBottom: 12 }}>{message}</div> : null}
      <form onSubmit={handleCreate} style={{ background: "white", padding: 16, borderRadius: 8, marginBottom: 20 }}>
        <h3>Create reseller</h3>
        <input value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} placeholder="Email" style={inputStyle} />
        <input type="password" value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} placeholder="Password" style={inputStyle} />
        <input type="number" value={form.points_balance} onChange={(e) => setForm({ ...form, points_balance: e.target.value })} placeholder="Initial points" style={inputStyle} />
        <button type="submit">Create</button>
      </form>

      <div style={{ background: "white", padding: 16, borderRadius: 8 }}>
        <h3>Existing resellers</h3>
        {resellers.map((reseller) => (
          <div key={reseller.id} style={{ borderBottom: "1px solid #e2e8f0", padding: "10px 0", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
            <div>
              <strong>{reseller.email}</strong><br />
              <span>Points: {reseller.points_balance} • {reseller.is_active ? "Active" : "Disabled"}</span>
            </div>
            <div>
              <button onClick={() => handleTopUp(reseller.id)} style={{ marginRight: 8 }}>Top up</button>
              <button onClick={() => toggleActive(reseller)}>Toggle Active</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

const inputStyle = { width: "100%", padding: "10px 12px", marginBottom: 10, border: "1px solid #cbd5e1", borderRadius: 8 };
