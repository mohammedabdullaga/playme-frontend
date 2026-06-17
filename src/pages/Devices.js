import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import API, { adminActivateDevice, adminUpdateDevice } from "../api/api";

export default function Devices() {
  const navigate = useNavigate();
  const [devices, setDevices] = useState([]);
  const [editDevice, setEditDevice] = useState(null);
  const [editEmail, setEditEmail] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [editActive, setEditActive] = useState(false);
  const [editIsTrial, setEditIsTrial] = useState(false);
  const [editMessage, setEditMessage] = useState("");

  useEffect(() => {
    API.get("/admin/devices").then((res) => setDevices(res.data));
  }, []);

  const deactivate = async (mac) => {
    await API.post(`/admin/devices/${mac}/deactivate`);
    setDevices(devices.map((d) => (d.mac_address === mac ? { ...d, active: false } : d)));
    if (editDevice?.mac_address === mac) setEditActive(false);
  };

  const activate = async (mac) => {
    await adminActivateDevice(mac);
    setDevices(devices.map((d) => (d.mac_address === mac ? { ...d, active: true } : d)));
    if (editDevice?.mac_address === mac) setEditActive(true);
  };

  const toInputDate = (dateStr) => {
    if (!dateStr) return "";
    const d = new Date(dateStr);
    if (Number.isNaN(d.getTime())) return "";
    return d.toISOString().slice(0, 16);
  };

  const startEditing = (device) => {
    setEditDevice(device);
    setEditEmail(device.email || "");
    setEditExpiresAt(toInputDate(device.expires_at));
    setEditActive(Boolean(device.active));
    setEditIsTrial(Boolean(device.is_trial));
    setEditMessage("");
  };

  const cancelEdit = () => {
    setEditDevice(null);
    setEditMessage("");
  };

  const saveEdit = async () => {
    if (!editDevice) return;
    try {
      const payload = {
        email: editEmail,
        active: editActive,
        is_trial: editIsTrial,
        expires_at: editExpiresAt ? new Date(editExpiresAt).toISOString() : undefined,
      };

      await adminUpdateDevice(editDevice.mac_address, payload);
      const updated = devices.map((d) => d.mac_address === editDevice.mac_address ? {
        ...d,
        email: editEmail,
        active: editActive,
        is_trial: editIsTrial,
        expires_at: payload.expires_at || d.expires_at,
      } : d);
      setDevices(updated);
      setEditMessage("Saved successfully.");
    } catch (error) {
      setEditMessage(error.response?.data?.detail || error.message || "Failed to save device.");
    }
  };

  const formatTime = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  return (
    <div className="rounded-3xl bg-white p-8 shadow-xl ring-1 ring-slate-200">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">Devices ({devices.length})</h2>
        <p className="text-sm text-slate-500">Review active devices, trial status, and activation controls.</p>
      </div>

      <div className="mt-6 overflow-x-auto rounded-3xl border border-slate-200 bg-slate-50 shadow-sm">
        <table className="min-w-full border-collapse text-sm">
          <thead>
            <tr className="bg-slate-100 text-left text-slate-500 uppercase tracking-[0.15em] text-[11px]">
              <th className="px-4 py-3">MAC</th>
              <th className="px-4 py-3">Email</th>
              <th className="px-4 py-3">Type</th>
              <th className="px-4 py-3">Expires</th>
              <th className="px-4 py-3">Active</th>
              <th className="px-4 py-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {devices.map((d) => {
              const expired = isExpired(d.expires_at);
              return (
                <tr key={d.mac_address} className={expired ? "inactive-row" : d.active ? "active-row" : "inactive-row"}>
                  <td className="px-4 py-4 font-mono text-slate-700">{d.mac_address}</td>
                  <td className="px-4 py-4 text-slate-700">{d.email}</td>
                  <td className="px-4 py-4">
                    <span className={`badge ${d.is_trial ? "badge-trial" : "badge-paid"}`}>{d.is_trial ? "Trial" : "Paid"}</span>
                    {expired && <span className="badge badge-expired" style={{ marginLeft: 6 }}>Expired</span>}
                  </td>
                  <td className="px-4 py-4 text-slate-700">
                    {formatTime(d.expires_at)}
                    {expired && <span className="text-red-600 font-semibold" style={{ marginLeft: 6 }}>✕</span>}
                  </td>
                  <td className="px-4 py-4">
                    <span className={`status ${d.active ? "status-active" : "status-inactive"}`}>{d.active ? "✓" : "✗"}</span>
                  </td>
                  <td className="px-4 py-4 space-x-2">
                    {d.active ? (
                      <button className="btn-danger btn-sm" onClick={() => deactivate(d.mac_address)}>
                        Deactivate
                      </button>
                    ) : (
                      <button className="btn-success btn-sm" onClick={() => activate(d.mac_address)}>
                        Activate
                      </button>
                    )}
                    <button className="btn-primary btn-sm" onClick={() => startEditing(d)}>
                      Edit
                    </button>
                    {d.is_trial && d.active && !expired && (
                      <button
                        className="btn-secondary btn-sm"
                        onClick={() => navigate(`/activate?mac=${d.mac_address}&email=${encodeURIComponent(d.email)}`)}
                      >
                        Activate
                      </button>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      {editDevice && (
        <div className="mt-8 rounded-3xl bg-white p-6 shadow-xl ring-1 ring-slate-200">
          <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
            <div>
              <h3 className="text-xl font-semibold text-slate-900">Edit device {editDevice.mac_address}</h3>
              <p className="text-sm text-slate-500">Modify expiration, active state, or trial status.</p>
            </div>
            <div className="flex gap-2">
              <button className="btn-secondary btn-sm" onClick={cancelEdit}>Cancel</button>
              <button className="btn-success btn-sm" onClick={saveEdit}>Save</button>
            </div>
          </div>

          <div className="mt-6 grid gap-4 md:grid-cols-2">
            <label className="block">
              <span className="text-sm font-medium text-slate-700">Email</span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900"
                value={editEmail}
                onChange={(e) => setEditEmail(e.target.value)}
                type="email"
              />
            </label>

            <label className="block">
              <span className="text-sm font-medium text-slate-700">Expires At</span>
              <input
                className="mt-2 w-full rounded-2xl border border-slate-300 bg-slate-50 px-4 py-3 text-sm text-slate-900"
                value={editExpiresAt}
                onChange={(e) => setEditExpiresAt(e.target.value)}
                type="datetime-local"
              />
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={editActive}
                onChange={(e) => setEditActive(e.target.checked)}
              />
              <span className="text-sm text-slate-700">Active</span>
            </label>

            <label className="flex items-center gap-3">
              <input
                type="checkbox"
                checked={editIsTrial}
                onChange={(e) => setEditIsTrial(e.target.checked)}
              />
              <span className="text-sm text-slate-700">Trial</span>
            </label>
          </div>

          {editMessage && (
            <div className="mt-4 rounded-2xl border border-slate-200 bg-slate-50 p-4 text-sm text-slate-700">
              {editMessage}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
