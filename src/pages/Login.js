import { useState } from "react";

export default function Login() {
  const [key, setKey] = useState("");

  const submit = () => {
    localStorage.setItem("admin_key", key);
    window.location.href = "/dashboard";
  };

  return (
    <div className="panel" style={{ maxWidth: '400px', margin: '120px auto' }}>
      <h2 style={{ textAlign: 'center' }}>Playme Admin Login</h2>
      <div className="form-section">
        <div className="form-group">
          <label>Admin API Key</label>
          <input
            type="password"
            placeholder="Enter your admin API key"
            value={key}
            onChange={(e) => setKey(e.target.value)}
            onKeyPress={(e) => e.key === 'Enter' && submit()}
          />
        </div>
        <button className="btn-primary" onClick={submit} style={{ width: '100%', marginTop: '12px' }}>Login</button>
      </div>
    </div>
  );
}
