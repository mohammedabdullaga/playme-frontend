import { useState } from "react";
import API from "../api/api";

export default function Tokens() {
  const [days, setDays] = useState(30);
  const [count, setCount] = useState(1);
  const [tokens, setTokens] = useState([]);

  const create = async () => {
    const res = await API.post(`/admin/tokens?days=${days}&count=${count}`);
    setTokens(res.data.tokens);
  };

  return (
    <div className="panel">
      <h2>Create Tokens</h2>
      <div className="form-section">
        <div className="form-group">
          <label>Token Duration (days)</label>
          <input type="number" value={days} onChange={e => setDays(e.target.value)} min="1" />
        </div>
        <div className="form-group">
          <label>Number of Tokens to Create</label>
          <input type="number" value={count} onChange={e => setCount(e.target.value)} min="1" />
        </div>
        <button className="btn-primary" onClick={create}>Generate Tokens</button>
      </div>

      {tokens.length > 0 && (
        <div className="form-section">
          <h3>Generated Tokens ({tokens.length})</h3>
          <div className="token-grid">
            {tokens.map(t => (
              <div key={t} className="token-badge" onClick={() => navigator.clipboard.writeText(t)} style={{ cursor: 'pointer', userSelect: 'none' }} title="Click to copy">
                {t}
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
