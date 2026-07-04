import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';

const POINT_COSTS = {
  30: 3,
  90: 8,
  180: 15,
  365: 26,
};

export default function Dashboard() {
  const navigate = useNavigate();
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
      setMessage(`Created ${res.data.length} token(s)`);
      await loadData();
    } catch (err) {
      setMessage(err.response?.data?.detail || 'Failed to create tokens');
    }
  };

  const pointCost = POINT_COSTS[duration] || 0;
  const totalCost = pointCost * Number(count);

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 24 }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <h1>Reseller Dashboard</h1>
        <p>Points balance: <strong>{points}</strong></p>
        <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
          <form onSubmit={generateTokens} style={{ background: 'white', padding: 20, borderRadius: 12 }}>
            <h3>Create Tokens</h3>
            <label>Duration (days)</label>
            <select value={duration} onChange={(e) => setDuration(Number(e.target.value))} style={inputStyle}>
              <option value={30}>30 days</option>
              <option value={90}>90 days</option>
              <option value={180}>180 days</option>
              <option value={365}>365 days</option>
            </select>
            <label>Quantity</label>
            <input type="number" min="1" value={count} onChange={(e) => setCount(e.target.value)} style={inputStyle} />
            <div style={{ marginBottom: 12 }}>
              <strong>Cost per token:</strong> {pointCost} points
            </div>
            <div style={{ marginBottom: 12 }}>
              <strong>Total cost:</strong> {totalCost} points
            </div>
            <button type="submit" style={{ background: '#2563eb', color: 'white', border: 'none', padding: '10px 14px', borderRadius: 8, cursor: 'pointer' }}>Generate</button>
            {message ? <p style={{ marginTop: 12 }}>{message}</p> : null}
          </form>

          <div style={{ background: 'white', padding: 20, borderRadius: 12 }}>
            <h3>Recent History</h3>
            {history.length === 0 ? <p>No recent token issues.</p> : history.slice(0, 10).map((item, idx) => (
              <div key={idx} style={{ borderBottom: '1px solid #e2e8f0', padding: '8px 0' }}>
                <div><strong>{item.token}</strong></div>
                <div>{item.duration_days} days • {item.points_cost} pts</div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '10px 12px', marginBottom: 12, border: '1px solid #cbd5e1', borderRadius: 8 };
