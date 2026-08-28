import { useState } from "react";
import { adminCreateTokensV1, adminCreateTokensV2, adminGetToken, adminDeleteToken } from "../api/api";

export default function Tokens() {
  const [version, setVersion] = useState("v2");
  const [days, setDays] = useState(30);
  const [count, setCount] = useState(1);
  const [tokens, setTokens] = useState([]);
  const [tokenVersion, setTokenVersion] = useState("");
  const [copyMessage, setCopyMessage] = useState("");
  const [copiedToken, setCopiedToken] = useState("");
  const [tokenSearch, setTokenSearch] = useState("");
  const [tokenDetails, setTokenDetails] = useState(null);
  const [searchMessage, setSearchMessage] = useState("");
  const [searching, setSearching] = useState(false);

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

  const searchToken = async (event) => {
    event.preventDefault();
    const value = tokenSearch.trim();
    if (!value) return;

    setSearching(true);
    setSearchMessage("");
    setTokenDetails(null);
    try {
      const res = await adminGetToken(value);
      setTokenDetails(res.data);
    } catch (error) {
      setSearchMessage(error.response?.data?.detail || error.message || "Token not found.");
    } finally {
      setSearching(false);
    }
  };

  const removeToken = async () => {
    if (!tokenDetails || !window.confirm(`Delete token ${tokenDetails.token}? Linked devices will be unlinked.`)) return;

    try {
      await adminDeleteToken(tokenDetails.token);
      setTokenDetails(null);
      setTokenSearch("");
      setSearchMessage("Token deleted successfully.");
    } catch (error) {
      setSearchMessage(error.response?.data?.detail || error.message || "Failed to delete token.");
    }
  };

  const formatDate = (date) => date ? new Date(date).toLocaleString() : "-";

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
            onChange={(e) => {
              const num = Number(e.target.value);
              setDays(isNaN(num) ? 0 : num);
            }}
            onBlur={() => {
              setDays(Math.max(1, days));
            }}
            min="1"
            className="form-input"
          />
        </div>

        <div>
          <label className="form-label">Number of Tokens to Create</label>
          <input
            type="number"
            value={count}
            onChange={(e) => {
              const num = Number(e.target.value);
              setCount(isNaN(num) ? 0 : num);
            }}
            onBlur={() => {
              setCount(Math.max(1, count));
            }}
            min="1"
            className="form-input"
          />
        </div>
      </div>

      <section className="form-section">
        <div className="token-panel-header">
          <div>
            <h3 className="token-panel-title">Find a token</h3>
            <p className="token-panel-subtitle">Check activation and linked accounts before removing an invalid token.</p>
          </div>
        </div>
        <form className="flex flex-col gap-3 md:flex-row" onSubmit={searchToken}>
          <input
            className="form-input flex-1"
            value={tokenSearch}
            onChange={(e) => setTokenSearch(e.target.value)}
            placeholder="Enter token"
            aria-label="Token to search"
          />
          <button className="button button-primary" type="submit" disabled={searching || !tokenSearch.trim()}>
            {searching ? "Searching..." : "Search token"}
          </button>
        </form>

        {searchMessage && <div className="copy-status">{searchMessage}</div>}

        {tokenDetails && (
          <div className="mt-5 rounded-2xl border border-slate-200 bg-slate-50 p-5">
            <div className="flex flex-col gap-3 md:flex-row md:items-start md:justify-between">
              <div>
                <div className="font-mono text-lg font-semibold text-slate-900">{tokenDetails.token}</div>
                <div className="mt-2 flex flex-wrap gap-2">
                  <span className="badge">{tokenDetails.version}</span>
                  <span className={`badge ${tokenDetails.activated ? "badge-success" : "badge-expired"}`}>
                    {tokenDetails.activated ? (tokenDetails.active ? "Activated and active" : "Activated, inactive") : "Not activated"}
                  </span>
                  {tokenDetails.revoked && <span className="badge badge-expired">Revoked</span>}
                </div>
              </div>
              <button className="btn-danger btn-sm" type="button" onClick={removeToken}>Delete token</button>
            </div>
            <p className="mt-3 text-sm text-slate-600">Expires: {formatDate(tokenDetails.expires_at)}</p>

            <div className="mt-5">
              <h4 className="font-semibold text-slate-900">Linked accounts</h4>
              {tokenDetails.accounts.length === 0 ? (
                <p className="mt-2 text-sm text-slate-500">No accounts linked yet.</p>
              ) : (
                <div className="mt-3 space-y-3">
                  {tokenDetails.accounts.map((account) => (
                    <div key={account.email} className="rounded-xl border border-slate-200 bg-white p-3">
                      <div className="font-medium text-slate-800">{account.email}</div>
                      <div className="mt-2 space-y-1 text-sm text-slate-600">
                        {account.devices.map((device) => (
                          <div key={device.mac_address} className="flex flex-wrap gap-x-3 gap-y-1">
                            <span className="font-mono">{device.mac_address}</span>
                            <span>{device.active ? "Active" : "Inactive"}</span>
                            <span>Expires {formatDate(device.expires_at)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </section>

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
