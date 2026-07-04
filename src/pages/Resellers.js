import { useEffect, useState } from "react";
import { adminCreateReseller, adminGetResellers, adminTopUpReseller, adminUpdateReseller, adminDeleteReseller } from "../api/api";

export default function Resellers() {
  const [resellers, setResellers] = useState([]);
  const [selectedReseller, setSelectedReseller] = useState(null);
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
