import { useState } from "react";
import { adminGetToken, adminDeleteToken } from "../api/api";

export default function ManageToken() {
  const [tokenSearch, setTokenSearch] = useState("");
  const [tokenDetails, setTokenDetails] = useState(null);
  const [searchMessage, setSearchMessage] = useState("");
  const [searching, setSearching] = useState(false);

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
          <h2 className="page-title">Manage Token</h2>
          <p className="page-subtitle">Find a token, check its linked accounts, or remove it from the database.</p>
        </div>
      </div>

      <section className="form-section">
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
    </div>
  );
}
