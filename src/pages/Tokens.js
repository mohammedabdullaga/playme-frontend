import { useState } from "react";
import { adminCreateTokensV1, adminCreateTokensV2 } from "../api/api";

export default function Tokens() {
  const [version, setVersion] = useState("v2");
  const [days, setDays] = useState(30);
  const [count, setCount] = useState(1);
  const [tokens, setTokens] = useState([]);
  const [tokenVersion, setTokenVersion] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [copiedToken, setCopiedToken] = useState("");

  const create = async () => {
    try {
      let res;
      if (version === "v1") {
        res = await adminCreateTokensV1(Number(days), Number(count));
      } else {
        res = await adminCreateTokensV2(Number(days), Number(count));
      }
      setTokens(res.data.tokens || []);
      setTokenVersion(res.data.version || "");
      setCopiedToken("");
      setCopyMessage("");
    } catch (error) {
      setCopyMessage(`Error: ${error.response?.data?.detail || error.message}`);
    }
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

      <div className="form-section grid gap-6 md:grid-cols-3">
        <div>
          <label className="form-label">Token Version</label>
          <select
            value={version}
            onChange={(e) => setVersion(e.target.value)}
            className="form-input"
          >
            <option value="v1">V1 - Old App</option>
            <option value="v2">V2 - New App ⭐</option>
          </select>
        </div>

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
              <h3 className="token-panel-title">
                Generated Tokens {tokenVersion && <span className="badge badge-success">v{tokenVersion}</span>}
              </h3>
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
