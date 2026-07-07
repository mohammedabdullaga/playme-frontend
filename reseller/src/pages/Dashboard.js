import { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import API, { ProxyAPI } from '../api/api';
import { getSavedLang, getStrings, saveLang } from '../i18n';

const POINT_COSTS = {
  30: 3,
  90: 8,
  180: 15,
  365: 26,
};

const PROXY_PLAN_COSTS = {
  1: 5,
  3: 13,
  6: 24,
  12: 38,
};

const labelStyle = {
  display: 'block',
  marginBottom: 6,
  fontWeight: 600,
  color: '#334155',
};

const inputStyle = {
  width: '100%',
  padding: '12px 14px',
  borderRadius: 10,
  border: '1px solid #cbd5e1',
  marginBottom: 14,
  fontSize: 14,
};

const navLinkStyle = {
  padding: '9px 14px',
  borderRadius: 10,
  textDecoration: 'none',
  border: '1px solid #cbd5e1',
  color: '#0f172a',
  background: 'white',
  fontWeight: 600,
};

const activeNavLinkStyle = {
  ...navLinkStyle,
  background: '#0f766e',
  color: 'white',
  border: '1px solid #0f766e',
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(getSavedLang());
  const strings = getStrings(lang);
  const [points, setPoints] = useState(Number(localStorage.getItem('reseller_points') || 0));
  const [duration, setDuration] = useState(30);
  const [count, setCount] = useState(1);
  const [message, setMessage] = useState('');
  const [newTokens, setNewTokens] = useState([]);
  const [history, setHistory] = useState([]);
  const [proxyForm, setProxyForm] = useState({ whatsapp: '', plan_months: 1 });
  const [proxyMessage, setProxyMessage] = useState('');
  const [proxyConfig, setProxyConfig] = useState(null);
  const [proxyUsers, setProxyUsers] = useState([]);
  const [proxyLogs, setProxyLogs] = useState([]);
  const [proxyLoading, setProxyLoading] = useState(false);
  const [proxyLogsLoading, setProxyLogsLoading] = useState(false);
  const [proxyUserSearch, setProxyUserSearch] = useState('');
  const [selectedProxyUser, setSelectedProxyUser] = useState(null);
  const [selectedProxyConfig, setSelectedProxyConfig] = useState(null);
  const [selectedProxyError, setSelectedProxyError] = useState('');
  const [selectedProxyLoading, setSelectedProxyLoading] = useState(false);
  const [renewPlans, setRenewPlans] = useState({});
  const [renewingUserId, setRenewingUserId] = useState(null);

  useEffect(() => {
    const resellerId = localStorage.getItem('reseller_id');
    if (!resellerId) {
      navigate('/');
      return;
    }
    loadData();
  }, [navigate]);

  const toggleLanguage = () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    saveLang(nextLang);
  };

  const handleSignOut = () => {
    localStorage.removeItem('reseller_id');
    localStorage.removeItem('reseller_email');
    localStorage.removeItem('reseller_points');
    localStorage.removeItem('reseller_proxy_token');
    navigate('/');
  };

  const loadData = async () => {
    try {
      const me = await API.get('/app/reseller/me');
      const nextPoints = Number(me.data.points_balance || 0);
      setPoints(nextPoints);
      localStorage.setItem('reseller_points', String(nextPoints));
      const hist = await API.get('/app/reseller/tokens/history');
      setHistory(hist.data || []);
      await loadProxyUsers();
      await loadProxyLogs();
    } catch (err) {
      console.error(err);
    }
  };

  const refreshPoints = async () => {
    try {
      const me = await API.get('/app/reseller/me');
      const nextPoints = Number(me.data.points_balance || 0);
      setPoints(nextPoints);
      localStorage.setItem('reseller_points', String(nextPoints));
      return nextPoints;
    } catch (err) {
      console.error(err);
      return points;
    }
  };

  const loadProxyUsers = async (search = '') => {
    try {
      setProxyLoading(true);
      const res = await ProxyAPI.get('/api/reseller/users', { params: { search } });
      setProxyUsers(res.data || []);
    } catch (err) {
      console.error(err);
      setProxyUsers([]);
    } finally {
      setProxyLoading(false);
    }
  };

  const loadProxyLogs = async () => {
    try {
      setProxyLogsLoading(true);
      const res = await ProxyAPI.get('/api/reseller/logs');
      setProxyLogs(res.data || []);
    } catch (err) {
      console.error(err);
      setProxyLogs([]);
    } finally {
      setProxyLogsLoading(false);
    }
  };

  const generateTokens = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/app/reseller/tokens', { duration_days: Number(duration), count: Number(count) });
      setMessage(strings.statusCreated(res.data.length));
      setNewTokens(res.data.map(item => item.token));
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.detail || strings.failedCreate);
      setNewTokens([]);
    }
  };

  const createProxyUser = async (e) => {
    e.preventDefault();
    try {
      const res = await ProxyAPI.post('/api/reseller/users', {
        whatsapp: proxyForm.whatsapp,
        plan_months: Number(proxyForm.plan_months),
      });
      setProxyConfig(res.data);
      setProxyMessage(strings.proxyCreated);
      setProxyForm({ whatsapp: '', plan_months: 1 });
      await refreshPoints();
      await loadData();
    } catch (err) {
      setProxyConfig(null);
      const backendMessage = err.response?.data?.detail || err.response?.data?.error || err.response?.data?.message || err.message;
      setProxyMessage(backendMessage || strings.proxyCreateFailed);
    }
  };

  const handleRenewProxyUser = async (user) => {
    const selectedPlan = Number(renewPlans[user.id] || 1);

    try {
      setRenewingUserId(user.id);
      setProxyMessage('');
      setSelectedProxyError('');

      const res = await ProxyAPI.post(`/api/reseller/users/${user.id}/renew`, {
        plan_months: selectedPlan,
      });

      const pointsCost = Number(res?.data?.points_cost || PROXY_PLAN_COSTS[selectedPlan] || 0);
      setProxyMessage(strings.proxyRenewed(selectedPlan, pointsCost));
      await refreshPoints();
      await loadProxyUsers(proxyUserSearch);
      await loadProxyLogs();

      if (selectedProxyUser?.id === user.id) {
        await handleViewProxyDetails(user);
      }
    } catch (err) {
      const backendMessage = err.response?.data?.detail || err.response?.data?.error || err.response?.data?.message || err.message;
      setSelectedProxyError(backendMessage || strings.proxyRenewFailed);
    } finally {
      setRenewingUserId(null);
    }
  };

  const handleSearchProxyUsers = async (e) => {
    e.preventDefault();
    await loadProxyUsers(proxyUserSearch);
  };

  const handleViewProxyDetails = async (user) => {
    setSelectedProxyUser(user);
    setSelectedProxyError('');
    setSelectedProxyConfig(null);
    setSelectedProxyLoading(true);

    try {
      const res = await ProxyAPI.get(`/api/reseller/users/${user.id}/config`);
      setSelectedProxyConfig(res.data || null);
    } catch (err) {
      setSelectedProxyError(err.response?.data?.error || strings.proxyCreateFailed);
    } finally {
      setSelectedProxyLoading(false);
    }
  };

  const pointCost = POINT_COSTS[duration] || 0;
  const totalCost = pointCost * Number(count);
  const proxyCost = PROXY_PLAN_COSTS[Number(proxyForm.plan_months)] || 0;
  const canAffordProxy = points >= proxyCost;

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 16, direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div style={{ display: 'grid', gap: 8 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
              <Link to="/dashboard" style={activeNavLinkStyle}>{strings.navDashboard}</Link>
              <Link to="/info" style={navLinkStyle}>{strings.navInfo}</Link>
            </div>
            <h1 style={{ margin: 0 }}>{strings.panelTitle}</h1>
            <p style={{ margin: '8px 0 0', color: '#475569' }}>{strings.pointsBalance}: <strong>{points}</strong></p>
          </div>
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <button onClick={toggleLanguage} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' }}>
              {strings.switchLanguage}
            </button>
            <button onClick={handleSignOut} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer' }}>
              {strings.signOut}
            </button>
          </div>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
          <div style={{ display: 'grid', gap: 20, gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))' }}>
            <form onSubmit={generateTokens} style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 12px 30px rgba(15,23,42,0.08)' }}>
              <h3 style={{ marginTop: 0 }}>{strings.createTokens}</h3>
              <label style={labelStyle}>{strings.duration}</label>
              <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={inputStyle}>
                <option value={30}>30 {strings.tokenDays}</option>
                <option value={90}>90 {strings.tokenDays}</option>
                <option value={180}>180 {strings.tokenDays}</option>
                <option value={365}>365 {strings.tokenDays}</option>
              </select>
              <label style={labelStyle}>{strings.quantity}</label>
              <input type="number" min="1" value={count} onChange={(e) => setCount(e.target.value)} style={inputStyle} />
              <div style={{ display: 'grid', gap: 10, marginBottom: 16, color: '#334155' }}>
                <div><strong>{strings.costPerToken}:</strong> {pointCost} {strings.points}</div>
                <div><strong>{strings.totalCost}:</strong> {totalCost} {strings.points}</div>
              </div>
              <button type="submit" style={{ width: '100%', background: '#2563eb', color: 'white', border: 'none', padding: 14, borderRadius: 10, cursor: 'pointer' }}>{strings.generate}</button>
              {message ? <p style={{ marginTop: 14, color: '#1d4ed8' }}>{message}</p> : null}
              {newTokens.length > 0 ? (
                <div style={{ marginTop: 20, background: '#f8fafc', padding: 16, borderRadius: 12 }}>
                  <h4 style={{ marginTop: 0 }}>{strings.newTokensTitle}</h4>
                  {newTokens.map((token, idx) => (
                    <div key={idx} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 8, padding: '10px 12px', borderRadius: 10, border: '1px solid #e2e8f0' }}>
                      <span style={{ wordBreak: 'break-all' }}>{token}</span>
                      <button type="button" onClick={() => navigator.clipboard.writeText(token)} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', cursor: 'pointer' }}>
                        {strings.copy}
                      </button>
                    </div>
                  ))}
                </div>
              ) : null}
            </form>

            <form onSubmit={createProxyUser} style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 12px 30px rgba(15,23,42,0.08)' }}>
              <h3 style={{ marginTop: 0 }}>{strings.proxySectionTitle}</h3>
              <p style={{ marginTop: -6, color: '#475569' }}>{strings.proxySectionSubtitle}</p>
              <label style={labelStyle}>{strings.whatsapp}</label>
              <input type="text" value={proxyForm.whatsapp} onChange={(e) => setProxyForm({ ...proxyForm, whatsapp: e.target.value })} style={inputStyle} required />
              <label style={labelStyle}>{strings.proxyPlan}</label>
              <select value={proxyForm.plan_months} onChange={(e) => setProxyForm({ ...proxyForm, plan_months: Number(e.target.value) })} style={inputStyle}>
                <option value={1}>{strings.proxyPlan1Month}</option>
                <option value={3}>{strings.proxyPlan3Months}</option>
                <option value={6}>{strings.proxyPlan6Months}</option>
                <option value={12}>{strings.proxyPlan1Year}</option>
              </select>
              <div style={{ marginBottom: 16, color: '#334155' }}><strong>{strings.proxyCost}:</strong> {proxyCost} {strings.points}</div>
              <div style={{ marginBottom: 16, color: canAffordProxy ? '#166534' : '#b91c1c' }}><strong>{strings.pointsBalance}:</strong> {points} {strings.points}</div>
              <button type="submit" disabled={!canAffordProxy} style={{ width: '100%', background: canAffordProxy ? '#0f766e' : '#94a3b8', color: 'white', border: 'none', padding: 14, borderRadius: 10, cursor: canAffordProxy ? 'pointer' : 'not-allowed' }}>{strings.proxyCreate}</button>
              {proxyMessage ? <p style={{ marginTop: 14, color: proxyConfig ? '#0f766e' : '#b91c1c' }}>{proxyMessage}</p> : null}
              {proxyConfig ? (
                <div style={{ marginTop: 16, background: '#f8fafc', padding: 14, borderRadius: 12 }}>
                  <h4 style={{ marginTop: 0 }}>{strings.proxyConfigTitle}</h4>
                  <div style={{ fontSize: 13, color: '#334155', wordBreak: 'break-all' }}>
                    <div><strong>{strings.proxySubdomain}:</strong> {proxyConfig.subdomain}</div>
                    <div><strong>{strings.proxyServer}:</strong> {proxyConfig.config?.iphone_plain?.server}</div>
                    <div><strong>{strings.proxyPort}:</strong> {proxyConfig.config?.iphone_plain?.port}</div>
                    <div><strong>{strings.proxyUsername}:</strong> {proxyConfig.config?.iphone_plain?.username}</div>
                    <div><strong>{strings.proxyPassword}:</strong> {proxyConfig.config?.iphone_plain?.password}</div>
                  </div>
                </div>
              ) : null}
            </form>
          </div>

          <div style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 12px 30px rgba(15,23,42,0.08)' }}>
            <h3 style={{ marginTop: 0 }}>{strings.recentHistory}</h3>
            <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
              {history.length === 0 ? (
                <p>{strings.noHistory}</p>
              ) : history.slice(0, 10).map((item, idx) => (
                <div key={idx} style={{ borderRadius: 14, border: '1px solid #e2e8f0', padding: 14, display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ fontWeight: 600, wordBreak: 'break-all' }}>{item.token}</div>
                    <div style={{ color: '#475569', marginTop: 6 }}>{item.duration_days} {strings.tokenDays} • {item.points_cost} {strings.points}</div>
                  </div>
                  <button type="button" onClick={() => navigator.clipboard.writeText(item.token)} style={{ padding: '8px 14px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc', color: '#0f172a', cursor: 'pointer' }}>
                    {strings.copy}
                  </button>
                </div>
              ))}
            </div>
          </div>

          <div style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 12px 30px rgba(15,23,42,0.08)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap' }}>
              <h3 style={{ margin: 0 }}>{strings.proxyUsersTitle}</h3>
              <form onSubmit={handleSearchProxyUsers} style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                <input
                  type="text"
                  value={proxyUserSearch}
                  onChange={(e) => setProxyUserSearch(e.target.value)}
                  placeholder={strings.proxySearchPlaceholder}
                  style={{ minWidth: 220, padding: '10px 12px', borderRadius: 10, border: '1px solid #cbd5e1' }}
                />
                <button type="submit" style={{ padding: '10px 14px', borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' }}>{strings.search}</button>
              </form>
            </div>
            {proxyLoading ? <p>{strings.loading}</p> : (
              <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                {proxyUsers.length === 0 ? (
                  <p>{strings.noProxyUsers}</p>
                ) : proxyUsers.map((user) => (
                  <div key={user.id} style={{ borderRadius: 14, border: '1px solid #e2e8f0', padding: 14 }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12, flexWrap: 'wrap' }}>
                      <div>
                        <div style={{ fontWeight: 600 }}>{user.whatsapp}</div>
                        <div style={{ color: '#475569', marginTop: 6 }}>{user.subdomain}</div>
                        <div style={{ color: '#64748b', marginTop: 6 }}>{user.status} • {user.expires_at}</div>
                      </div>
                      <div style={{ display: 'grid', gap: 8, minWidth: 210 }}>
                        <button type="button" onClick={() => handleViewProxyDetails(user)} style={{ padding: '8px 12px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#f8fafc', cursor: 'pointer' }}>{strings.viewDetails}</button>
                        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
                          <select
                            value={renewPlans[user.id] || 1}
                            onChange={(e) => setRenewPlans((prev) => ({ ...prev, [user.id]: Number(e.target.value) }))}
                            style={{ padding: '8px 10px', borderRadius: 10, border: '1px solid #cbd5e1', background: '#fff', minWidth: 120 }}
                          >
                            <option value={1}>{strings.proxyPlan1Month}</option>
                            <option value={3}>{strings.proxyPlan3Months}</option>
                            <option value={6}>{strings.proxyPlan6Months}</option>
                            <option value={12}>{strings.proxyPlan1Year}</option>
                          </select>
                          <button
                            type="button"
                            onClick={() => handleRenewProxyUser(user)}
                            disabled={renewingUserId === user.id || points < (PROXY_PLAN_COSTS[Number(renewPlans[user.id] || 1)] || 0)}
                            style={{
                              padding: '8px 12px',
                              borderRadius: 10,
                              border: 'none',
                              background: renewingUserId === user.id ? '#94a3b8' : '#0f766e',
                              color: 'white',
                              cursor: renewingUserId === user.id ? 'not-allowed' : 'pointer',
                            }}
                          >
                            {renewingUserId === user.id ? strings.loading : strings.proxyRenew}
                          </button>
                        </div>
                        <div style={{ fontSize: 12, color: '#475569' }}>
                          {strings.proxyRenewCostLabel}: {PROXY_PLAN_COSTS[Number(renewPlans[user.id] || 1)] || 0} {strings.points}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
            {selectedProxyLoading ? <p style={{ marginTop: 12 }}>{strings.loading}</p> : null}
            {selectedProxyError ? <p style={{ marginTop: 12, color: '#b91c1c' }}>{selectedProxyError}</p> : null}
            {selectedProxyConfig ? (
              <div style={{ marginTop: 16, background: '#f8fafc', padding: 14, borderRadius: 12 }}>
                <h4 style={{ marginTop: 0 }}>{selectedProxyUser?.whatsapp || strings.proxyConfigTitle}</h4>
                <div style={{ fontSize: 13, color: '#334155', wordBreak: 'break-all' }}>
                  <div><strong>{strings.proxySubdomain}:</strong> {selectedProxyConfig.subdomain}</div>
                  <div><strong>{strings.proxyServer}:</strong> {selectedProxyConfig.config?.iphone_plain?.server}</div>
                  <div><strong>{strings.proxyPort}:</strong> {selectedProxyConfig.config?.iphone_plain?.port}</div>
                  <div><strong>{strings.proxyUsername}:</strong> {selectedProxyConfig.config?.iphone_plain?.username}</div>
                  <div><strong>{strings.proxyPassword}:</strong> {selectedProxyConfig.config?.iphone_plain?.password}</div>
                </div>
              </div>
            ) : null}
          </div>

          <div style={{ background: 'white', padding: 20, borderRadius: 16, boxShadow: '0 12px 30px rgba(15,23,42,0.08)' }}>
            <h3 style={{ marginTop: 0 }}>{strings.proxyLogsTitle}</h3>
            {proxyLogsLoading ? <p>{strings.loading}</p> : (
              <div style={{ display: 'grid', gap: 12, marginTop: 12 }}>
                {proxyLogs.length === 0 ? (
                  <p>{strings.noProxyLogs}</p>
                ) : proxyLogs.map((log) => (
                  <div key={log.id} style={{ borderRadius: 14, border: '1px solid #e2e8f0', padding: 14 }}>
                    <div style={{ fontWeight: 600 }}>{log.action}</div>
                    <div style={{ color: '#475569', marginTop: 6 }}>{log.whatsapp || log.subdomain || log.proxy_label || 'Proxy activity'}</div>
                    <div style={{ color: '#64748b', marginTop: 6 }}>{log.created_at}</div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

