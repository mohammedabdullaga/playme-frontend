import { useState } from "react";
import API from "../api/api";

export default function Proxy() {
  const [mode, setMode] = useState("direct");
  const [host, setHost] = useState("");
  const [port, setPort] = useState("");
  const [user, setUser] = useState("");
  const [pass, setPass] = useState("");
  const [result, setResult] = useState(null);

  const save = async () => {
    const payload =
      mode === "socks5"
        ? { mode, socks: { host, port: Number(port), user, pass } }
        : { mode };

    const res = await API.post("/admin/proxy", payload);
    setResult(res.data);
  };

  return (
    <div className="panel">
      <h2>Proxy Control</h2>

      <div className="form-section">
        <div className="form-group">
          <label>Mode</label>
          <select value={mode} onChange={e => setMode(e.target.value)}>
            <option value="direct">Direct (No Proxy)</option>
            <option value="socks5">SOCKS5</option>
          </select>
        </div>

        {mode === "socks5" && (
          <>
            <div className="form-group">
              <label>Host</label>
              <input placeholder="1.2.3.4" onChange={e => setHost(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Port</label>
              <input type="number" placeholder="1080" onChange={e => setPort(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Username</label>
              <input placeholder="(optional)" onChange={e => setUser(e.target.value)} />
            </div>
            <div className="form-group">
              <label>Password</label>
              <input type="password" placeholder="(optional)" onChange={e => setPass(e.target.value)} />
            </div>
          </>
        )}

        <button className="btn-primary" onClick={save}>Apply Proxy Configuration</button>
      </div>

      {result && (
        <div style={{ marginTop: '20px' }}>
          <h3>Configuration Result</h3>
          <pre>{JSON.stringify(result, null, 2)}</pre>
        </div>
      )}
    </div>
  );
}
