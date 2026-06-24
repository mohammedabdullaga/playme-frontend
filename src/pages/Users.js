import { useEffect, useState } from "react";
import { adminGetAccounts, adminGetAccount, adminUpdateAccount, adminDeleteAccount } from "../api/api";

export default function Users() {
  const [accounts, setAccounts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [selectedAccount, setSelectedAccount] = useState(null);
  const [showDetails, setShowDetails] = useState(false);
  const [editMode, setEditMode] = useState(false);
  const [editEmail, setEditEmail] = useState("");
  const [editExtenDays, setEditExtenDays] = useState("");
  const [editExpiresAt, setEditExpiresAt] = useState("");
  const [editActive, setEditActive] = useState(true);
  const [editMessage, setEditMessage] = useState("");
  const [editMessageType, setEditMessageType] = useState("");
  const [accountDetails, setAccountDetails] = useState(null);
  const [detailsLoading, setDetailsLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [effectiveQuery, setEffectiveQuery] = useState("");
  const [filteredAccounts, setFilteredAccounts] = useState([]);
  const [detailsCache, setDetailsCache] = useState({});
  const [searching, setSearching] = useState(false);

  useEffect(() => {
    fetchAccounts();
  }, []);

  const fetchAccounts = async () => {
    try {
      setLoading(true);
      const res = await adminGetAccounts();
      const list = res.data.accounts || [];
      setAccounts(list);
      setFilteredAccounts(list);
    } catch (error) {
      setEditMessage("Failed to load accounts");
      setEditMessageType("error");
    } finally {
      setLoading(false);
    }
  };

  const openDetails = async (account) => {
    try {
      setDetailsLoading(true);
      const cached = detailsCache[account.email];
      if (cached) {
        setAccountDetails(cached);
      } else {
        const res = await adminGetAccount(account.email);
        setAccountDetails(res.data);
        setDetailsCache((c) => ({ ...c, [account.email]: res.data }));
      }
      setSelectedAccount(account);
      setShowDetails(true);
      setEditMode(false);
      setEditMessage("");
    } catch (error) {
      setEditMessage("Failed to load account details");
      setEditMessageType("error");
    } finally {
      setDetailsLoading(false);
    }
  };

  const startEdit = () => {
    setEditEmail(selectedAccount?.email || "");
    setEditExtenDays("");
    // prefill expiry from first device if available
    const pref = accountDetails?.devices && accountDetails.devices.length > 0 ? accountDetails.devices[0].expires_at : "";
    if (pref) {
      const d = new Date(pref);
      const local = new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0,16);
      setEditExpiresAt(local);
    } else {
      setEditExpiresAt("");
    }
    setEditActive(true);
    setEditMode(true);
    setEditMessage("");
  };

  const cancelEdit = () => {
    setEditMode(false);
    setEditMessage("");
  };

  const saveEdit = async () => {
    if (!selectedAccount) return;
    try {
      const payload = {};
      if (editEmail && editEmail !== selectedAccount.email) {
        payload.new_email = editEmail;
      }
      if (editExtenDays) {
        payload.extend_days = Number(editExtenDays);
      }
      if (editExpiresAt) {
        // editExpiresAt is in local datetime-local format; convert to ISO
        const iso = new Date(editExpiresAt).toISOString();
        payload.expires_at = iso;
      }
      payload.active = editActive;

      await adminUpdateAccount(selectedAccount.email, payload);
      setEditMessage("Account updated successfully");
      setEditMessageType("success");
      setEditMode(false);
      
      // Refresh the account details
      setTimeout(() => {
        openDetails(selectedAccount);
        fetchAccounts();
      }, 1000);
    } catch (error) {
      setEditMessage(error.response?.data?.detail || "Failed to update account");
      setEditMessageType("error");
    }
  };

  const deleteAccount = async () => {
    if (!selectedAccount) return;
    if (!window.confirm(`Are you sure you want to delete all devices for ${selectedAccount.email}?`)) {
      return;
    }
    try {
      await adminDeleteAccount(selectedAccount.email);
      setEditMessage("Account deleted successfully");
      setEditMessageType("success");
      setShowDetails(false);
      setSelectedAccount(null);
      setDetailsCache((c) => {
        const copy = { ...c };
        delete copy[selectedAccount.email];
        return copy;
      });
      fetchAccounts();
    } catch (error) {
      setEditMessage(error.response?.data?.detail || "Failed to delete account");
      setEditMessageType("error");
    }
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleString();
  };

  const isExpired = (expiresAt) => {
    if (!expiresAt) return false;
    return new Date(expiresAt) < new Date();
  };

  // Search logic: filter by email first; if none match, fetch account details and search tokens/devices
  useEffect(() => {
    let active = true;
    const q = (effectiveQuery || "").trim().toLowerCase();
    if (!q) {
      setFilteredAccounts(accounts);
      setSearching(false);
      return;
    }

    // quick email match
    const emailMatches = accounts.filter((a) => (a.email || "").toLowerCase().includes(q));
    if (emailMatches.length > 0) {
      setFilteredAccounts(emailMatches);
      setSearching(false);
      return;
    }

    // otherwise search tokens/devices by fetching details (cached when possible)
    (async () => {
      setSearching(true);
      try {
        const promises = accounts.map(async (a) => {
          if (detailsCache[a.email]) return { email: a.email, details: detailsCache[a.email] };
          try {
            const res = await adminGetAccount(a.email);
            return { email: a.email, details: res.data };
          } catch (e) {
            return { email: a.email, details: null };
          }
        });

        const detailed = await Promise.all(promises);
        if (!active) return;

        const matches = [];
        const newCache = { ...detailsCache };

        detailed.forEach((item) => {
          const d = item.details;
          if (!d) return;
          newCache[item.email] = d;
          const tokenMatch = (d.tokens || []).some((t) => (t || "").toLowerCase().includes(q));
          const deviceMatch = (d.devices || []).some((dv) => (dv.mac_address || "").toLowerCase().includes(q));
          if (tokenMatch || deviceMatch) {
            const acct = accounts.find((x) => x.email === item.email);
            if (acct) matches.push(acct);
          }
        });

        setDetailsCache(newCache);
        setFilteredAccounts(matches);
      } catch (err) {
        console.error("Search error", err);
      } finally {
        if (active) setSearching(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [effectiveQuery, accounts, detailsCache]);

  // Debounce user typing to avoid excessive detail fetches
  useEffect(() => {
    const id = setTimeout(() => {
      setEffectiveQuery(searchQuery);
    }, 350);
    return () => clearTimeout(id);
  }, [searchQuery]);

  return (
    <div className="panel">
      <div className="flex flex-col gap-4 md:flex-row md:items-center md:justify-between">
        <h2 className="text-2xl font-semibold text-slate-900">User Accounts ({accounts.length})</h2>
        <p className="text-sm text-slate-500">View and manage user accounts, their devices, and associated tokens.</p>
      </div>

      {!showDetails ? (
        <div>
          {loading ? (
            <p className="text-center text-slate-500 py-8">Loading accounts...</p>
          ) : (
            <>
              <div className="mt-6 flex items-center gap-4">
                <input
                  placeholder="Search by email, token or MAC"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="form-input"
                />
                <div className="text-sm text-slate-500">{searching ? 'Searching...' : `${filteredAccounts.length} results`}</div>
              </div>

              {filteredAccounts.length === 0 ? (
                <p className="text-center text-slate-500 py-8">No accounts found</p>
              ) : (
                <div className="mt-4 overflow-x-auto rounded-lg border border-slate-200 bg-slate-50 shadow-sm">
                  <table className="min-w-full border-collapse text-sm">
                    <thead>
                      <tr className="bg-slate-100 text-left text-slate-500 uppercase tracking-[0.15em] text-[11px]">
                        <th className="px-4 py-3">Email</th>
                        <th className="px-4 py-3">Devices</th>
                        <th className="px-4 py-3">Active</th>
                        <th className="px-4 py-3">Tokens</th>
                        <th className="px-4 py-3">Versions</th>
                        <th className="px-4 py-3">Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {filteredAccounts.map((account) => (
                        <tr key={account.email} className={account.active_device_count > 0 ? "active-row" : "inactive-row"}>
                          <td className="px-4 py-4 font-mono text-slate-700">{account.email}</td>
                          <td className="px-4 py-4 text-slate-700">{account.device_count}</td>
                          <td className="px-4 py-4 text-slate-700">{account.active_device_count}</td>
                          <td className="px-4 py-4 text-slate-700">{account.token_count}</td>
                          <td className="px-4 py-4 text-slate-700">
                            <div className="flex gap-1">
                              {account.v1_token_count > 0 && (
                                <span className="text-xs px-2 py-1 rounded font-semibold bg-gray-100 text-gray-700">
                                  V1: {account.v1_token_count}
                                </span>
                              )}
                              {account.v2_token_count > 0 && (
                                <span className="text-xs px-2 py-1 rounded font-semibold bg-blue-100 text-blue-700">
                                  V2: {account.v2_token_count}
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-4 py-4">
                            <button
                              className="btn-primary btn-sm"
                              onClick={() => openDetails(account)}
                            >
                              View Details
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      ) : (
        <div className="mt-6">
          <div className="flex items-center gap-2 mb-4">
            <button
              className="btn-secondary btn-sm"
              onClick={() => setShowDetails(false)}
            >
              ← Back to List
            </button>
          </div>

          {editMessage && (
            <div className={`alert ${editMessageType === "error" ? "alert-error" : "alert-success"}`}>
              {editMessage}
            </div>
          )}

          {detailsLoading ? (
            <p className="text-center text-slate-500 py-8">Loading details...</p>
          ) : accountDetails ? (
            <div className="space-y-6">
              {/* Account Summary */}
              <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                <h3 className="text-lg font-semibold text-slate-900 mb-4">Account Summary</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label className="text-sm font-medium text-slate-600">Email</label>
                    <p className="text-slate-900 font-mono">{accountDetails.email}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Total Devices</label>
                    <p className="text-slate-900">{accountDetails.device_count}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Active Devices</label>
                    <p className="text-slate-900">{accountDetails.active_device_count}</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-slate-600">Associated Tokens</label>
                    <p className="text-slate-900">{accountDetails.tokens?.length || 0}</p>
                  </div>
                  {accountDetails.v1_token_count > 0 && (
                    <div>
                      <label className="text-sm font-medium text-slate-600">V1 Tokens (Old App)</label>
                      <p className="text-slate-900 font-semibold text-gray-700">{accountDetails.v1_token_count}</p>
                    </div>
                  )}
                  {accountDetails.v2_token_count > 0 && (
                    <div>
                      <label className="text-sm font-medium text-slate-600">V2 Tokens (New App)</label>
                      <p className="text-slate-900 font-semibold text-blue-700">{accountDetails.v2_token_count}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Tokens Section */}
              {accountDetails.tokens && accountDetails.tokens.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Associated Tokens</h3>
                  <div className="space-y-2">
                    {Array.isArray(accountDetails.tokens) ? (
                      // Handle both string tokens and token objects
                      accountDetails.tokens.map((token, idx) => {
                        const isObject = typeof token === 'object' && token !== null;
                        const tokenValue = isObject ? token.token : token;
                        const tokenVersion = isObject ? token.version : null;
                        return (
                          <div
                            key={idx}
                            className="flex items-center gap-3 p-3 bg-white rounded border border-slate-200 hover:border-slate-300 cursor-pointer"
                            onClick={() => navigator.clipboard.writeText(tokenValue)}
                            title="Click to copy"
                          >
                            <code className="font-mono text-sm flex-1 text-slate-700">{tokenValue}</code>
                            {tokenVersion && (
                              <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                tokenVersion === 'v2' 
                                  ? 'bg-blue-100 text-blue-700' 
                                  : 'bg-gray-100 text-gray-700'
                              }`}>
                                {tokenVersion.toUpperCase()}
                              </span>
                            )}
                          </div>
                        );
                      })
                    ) : (
                      <div className="token-grid">
                        {accountDetails.tokens.map((token) => (
                          <div
                            key={token}
                            className="token-badge"
                            onClick={() => navigator.clipboard.writeText(token)}
                            title="Click to copy"
                          >
                            {token}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Devices Section */}
              {accountDetails.devices && accountDetails.devices.length > 0 && (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Registered Devices</h3>
                  <div className="overflow-x-auto rounded-lg border border-slate-200">
                    <table className="min-w-full border-collapse text-sm">
                      <thead>
                        <tr className="bg-slate-100 text-left text-slate-500 uppercase tracking-[0.15em] text-[11px]">
                          <th className="px-4 py-3">MAC Address</th>
                          <th className="px-4 py-3">Token</th>
                          <th className="px-4 py-3">Version</th>
                          <th className="px-4 py-3">Type</th>
                          <th className="px-4 py-3">Active</th>
                          <th className="px-4 py-3">Expires</th>
                        </tr>
                      </thead>
                      <tbody>
                        {accountDetails.devices.map((device) => (
                          <tr
                            key={device.mac_address}
                            className={isExpired(device.expires_at) ? "inactive-row" : device.active ? "active-row" : "inactive-row"}
                          >
                            <td className="px-4 py-4 font-mono text-slate-700">{device.mac_address}</td>
                            <td className="px-4 py-4 font-mono text-slate-700">{device.token_id || "-"}</td>
                            <td className="px-4 py-4">
                              {device.token_version && (
                                <span className={`text-xs px-2 py-1 rounded font-semibold ${
                                  device.token_version === 'v2' 
                                    ? 'bg-blue-100 text-blue-700' 
                                    : 'bg-gray-100 text-gray-700'
                                }`}>
                                  {device.token_version.toUpperCase()}
                                </span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`badge ${device.is_trial ? "badge-trial" : "badge-paid"}`}>
                                {device.is_trial ? "Trial" : "Paid"}
                              </span>
                              {isExpired(device.expires_at) && (
                                <span className="badge badge-expired ml-2">Expired</span>
                              )}
                            </td>
                            <td className="px-4 py-4">
                              <span className={`status ${device.active ? "status-active" : "status-inactive"}`}>
                                {device.active ? "✓" : "✗"}
                              </span>
                            </td>
                            <td className="px-4 py-4 text-slate-700">
                              {formatDate(device.expires_at)}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* Edit Section */}
              {!editMode ? (
                <div className="flex gap-2">
                  <button className="btn-primary" onClick={startEdit}>
                    Edit Account
                  </button>
                  <button className="btn-danger" onClick={deleteAccount}>
                    Delete Account
                  </button>
                </div>
              ) : (
                <div className="bg-slate-50 p-4 rounded-lg border border-slate-200">
                  <h3 className="text-lg font-semibold text-slate-900 mb-4">Edit Account</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                    <div>
                      <label className="form-label">Email</label>
                      <input
                        type="email"
                        value={editEmail}
                        onChange={(e) => setEditEmail(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Extend Expiration (days)</label>
                      <input
                        type="number"
                        value={editExtenDays}
                        onChange={(e) => setEditExtenDays(e.target.value)}
                        placeholder="Optional"
                        className="form-input"
                      />
                    </div>
                    <div>
                      <label className="form-label">Set Expiry (device)</label>
                      <input
                        type="datetime-local"
                        value={editExpiresAt}
                        onChange={(e) => setEditExpiresAt(e.target.value)}
                        className="form-input"
                      />
                    </div>
                    <div className="md:col-span-2">
                      <label className="flex items-center gap-2">
                        <input
                          type="checkbox"
                          checked={editActive}
                          onChange={(e) => setEditActive(e.target.checked)}
                        />
                        <span className="form-label mb-0">Activate all devices</span>
                      </label>
                    </div>
                  </div>
                  <div className="flex gap-2">
                    <button className="btn-success" onClick={saveEdit}>
                      Save Changes
                    </button>
                    <button className="btn-secondary" onClick={cancelEdit}>
                      Cancel
                    </button>
                  </div>
                </div>
              )}
            </div>
          ) : (
            <p className="text-center text-slate-500 py-8">Failed to load account details</p>
          )}
        </div>
      )}
    </div>
  );
}
