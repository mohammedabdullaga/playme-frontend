import { useState } from "react";
import API from "../api/api";

export default function Tokens() {
  const [days, setDays] = useState(30);
  const [count, setCount] = useState(1);
  const [tokens, setTokens] = useState([]);
  const [copyMessage, setCopyMessage] = useState("");
  const [copiedToken, setCopiedToken] = useState("");

  const create = async () => {
    const res = await API.post(`/admin/tokens?days=${Number(days)}&count=${Number(count)}`);
    setTokens(res.data.tokens || []);
    setCopiedToken("");
    setCopyMessage("");
  };

  const showCopyMessage = (message) => {
    setCopyMessage(message);
    window.clearTimeout(window.copyMessageTimeout);
    window.copyMessageTimeout = window.setTimeout(() => setCopyMessage(""), 2200);
  };

  const copyToken = async (token) => {
    await navigator.clipboard.writeText(token);
    setCopiedToken(token);
    showCopyMessage("Token copied to clipboard");
  };

  const copyAll = async () => {
    const bulk = tokens.join("\n");
    await navigator.clipboard.writeText(bulk);
    setCopiedToken("all");
    showCopyMessage(`Copied all ${tokens.length} tokens`);
  };

  return (
    <div className="panel-card max-w-4xl mx-auto">
      <div className="page-header">
        <div>
          <h2 className="page-title">Token Management</h2>
          <p className="page-subtitle">Create and copy access tokens for your admin users.</p>
        </div>
        <button className="button button-secondary" onClick={create}>
          Generate Tokens
        </button>
      </div>

      <div className="form-section grid gap-6 md:grid-cols-2">
        <div>
          <label className="form-label">Token Duration (days)</label>
          <input
            type="number"
            value={days}
            onChange={(e) => setDays(Math.max(1, Number(e.target.value) || 1))}
            min="1"
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">Number of Tokens to Create</label>
          <input
            type="number"
            value={count}
            onChange={(e) => setCount(Math.max(1, Number(e.target.value) || 1))}
            min="1"
            className="form-input"
          />
        </div>
      </div>

      {tokens.length > 0 && (
        <section className="token-panel">
          <div className="token-panel-header">
            <div>
              <h3 className="token-panel-title">Generated Tokens</h3>
              <p className="token-panel-subtitle">Click any token to copy it, or copy them all at once.</p>
            </div>
            <button className="button button-primary" onClick={copyAll}>
              Copy all ({tokens.length})
            </button>
          </div>

          {copyMessage && (
            <div className="copy-status">{copyMessage}</div>
          )}

          <div className="token-grid">
            {tokens.map((t) => (
              <button
                key={t}
                className={`token-badge${copiedToken === t ? " active" : ""}`}
                onClick={() => copyToken(t)}
                title="Click to copy"
              >
                <span className="token-text">{t}</span>
                <span className="token-action">Copy</span>
              </button>
            ))}
          </div>
        </section>
      )}
    </div>
  );
}
