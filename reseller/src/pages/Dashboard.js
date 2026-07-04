import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import { getSavedLang, getStrings, saveLang } from '../i18n';

const POINT_COSTS = {
  30: 3,
  90: 8,
  180: 15,
  365: 26,
};

export default function Dashboard() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(getSavedLang());
  const strings = getStrings(lang);
  const [points, setPoints] = useState(Number(localStorage.getItem('reseller_points') || 0));
  const [duration, setDuration] = useState(30);
  const [count, setCount] = useState(1);
  const [message, setMessage] = useState('');
  const [history, setHistory] = useState([]);

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

  const loadData = async () => {
    try {
      const me = await API.get('/app/reseller/me');
      setPoints(me.data.points_balance || 0);
      const hist = await API.get('/app/reseller/tokens/history');
      setHistory(hist.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  const generateTokens = async (e) => {
    e.preventDefault();
    try {
      const res = await API.post('/app/reseller/tokens', { duration_days: Number(duration), count: Number(count) });
      setMessage(strings.statusCreated(res.data.length));
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.detail || strings.failedCreate);
    }
  };

  const pointCost = POINT_COSTS[duration] || 0;
  const totalCost = pointCost * Number(count);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 16, direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 12, marginBottom: 18 }}>
          <div>
            <h1 style={{ margin: 0 }}>{strings.panelTitle}</h1>
            <p style={{ margin: '8px 0 0', color: '#475569' }}>{strings.pointsBalance}: <strong>{points}</strong></p>
          </div>
          <button onClick={toggleLanguage} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' }}>
            {strings.switchLanguage}
          </button>
        </div>

        <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>
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
          </form>

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
        </div>
      </div>
    </div>
  );
}

const labelStyle = { display: 'block', marginBottom: 8, color: '#334155', fontWeight: 600 };

const inputStyle = { width: '100%', padding: '12px 14px', marginBottom: 16, border: '1px solid #cbd5e1', borderRadius: 10, fontSize: 16 };

const inputStyle = { width: '100%', padding: '10px 12px', marginBottom: 12, border: '1px solid #cbd5e1', borderRadius: 8 };
