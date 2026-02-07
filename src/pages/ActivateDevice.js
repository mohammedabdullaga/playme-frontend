import { useState, useEffect } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import API, { adminCreateTokens } from "../api/api";

export default function ActivateDevice() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [step, setStep] = useState(1); // 1: create token, 2: activate device
  const [days, setDays] = useState(30);
  const [count, setCount] = useState(1);
  const [tokens, setTokens] = useState([]);
  const [selectToken, setSelectToken] = useState("");
  const [mac, setMac] = useState(searchParams.get("mac") || "");
  const [email, setEmail] = useState(searchParams.get("email") || "");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

  const createTokens = async () => {
    try {
      setError(null);
      const res = await adminCreateTokens(days, count);
      setTokens(res.data.tokens || []);
      setStep(2);
    } catch (e) {
      setError("Failed to create tokens: " + (e.response?.data?.detail || e.message));
    }
  };

  const activateDevice = async () => {
    try {
      setError(null);
      const token = selectToken || tokens[0];
      if (!token || !mac || !email) {
        setError("Token, MAC, and email are required");
        return;
      }
      const res = await API.post("/app/activate", { mac_address: mac, email, token });
      setResult(res.data);
      setMac("");
      setEmail("");
      setSelectToken("");
    } catch (e) {
      setError("Activation failed: " + (e.response?.data?.detail || e.message));
    }
  };

  return (
    <div className="panel">
      <h2>Activate Device</h2>

      {error && <div className="alert alert-error">{error}</div>}
      {result && <div className="alert alert-success">Device activated! Expires at: {result.expires_at}</div>}

      <div className="form-section">
        <h3>Step 1: Create Token(s)</h3>
        <div className="form-group">
          <label>Token Duration (days)</label>
          <input type="number" value={days} onChange={(e) => setDays(Number(e.target.value))} min="1" />
        </div>
        <div className="form-group">
          <label>Number of Tokens to Create</label>
          <input type="number" value={count} onChange={(e) => setCount(Number(e.target.value))} min="1" />
        </div>
        <button className="btn-primary" onClick={createTokens}>Create Tokens</button>
      </div>

      {tokens.length > 0 && (
        <div className="form-section">
          <h3>Step 2: Activate Device</h3>
          
          <div className="tokens-list">
            <p><strong>Available Tokens:</strong></p>
            <div className="token-grid">
              {tokens.map((t) => (
                <button
                  key={t}
                  className={`token-badge ${selectToken === t ? "active" : ""}`}
                  onClick={() => setSelectToken(t)}
                >
                  {t}
                </button>
              ))}
            </div>
          </div>

          <div className="form-group">
            <label>MAC Address</label>
            <input
              type="text"
              value={mac}
              onChange={(e) => setMac(e.target.value)}
              placeholder="00:11:22:33:44:55"
            />
          </div>

          <div className="form-group">
            <label>Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="user@example.com"
            />
          </div>

          <button className="btn-success" onClick={activateDevice}>Activate Device</button>
          <button className="btn-secondary" onClick={() => { setStep(1); setTokens([]); }}>Create More Tokens</button>
        </div>
      )}
    </div>
  );
}
