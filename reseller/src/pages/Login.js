import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import API from '../api/api';
import { getSavedLang, getStrings } from '../i18n';

export default function Login() {
  const lang = getSavedLang();
  const strings = getStrings(lang);
  const navigate = useNavigate();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    try {
      const res = await API.post('/app/reseller/login', { email, password });
      localStorage.setItem('reseller_id', res.data.reseller_id);
      localStorage.setItem('reseller_email', res.data.email);
      localStorage.setItem('reseller_points', res.data.points_balance);
      navigate('/dashboard');
    } catch (err) {
      setError(err.response?.data?.detail || 'Login failed');
    }
  };

  return (
    <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#0f172a', padding: 16 }}>
      <form onSubmit={handleSubmit} style={{ background: 'white', padding: 24, borderRadius: 12, width: '100%', maxWidth: 420, boxShadow: '0 10px 30px rgba(0,0,0,0.2)' }}>
        <h2 style={{ marginBottom: 8 }}>{strings.signInTitle}</h2>
        <p style={{ marginTop: 0, marginBottom: 20, color: '#64748b' }}>{strings.signInSubtitle}</p>
        {error ? <div style={{ color: 'crimson', marginBottom: 12 }}>{error}</div> : null}
        <input value={email} onChange={(e) => setEmail(e.target.value)} placeholder={strings.email} style={inputStyle} />
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder={strings.password} style={inputStyle} />
        <button type="submit" style={{ width: '100%', padding: 12, borderRadius: 8, border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' }}>{strings.login}</button>
      </form>
    </div>
  );
}

const inputStyle = { width: '100%', padding: '10px 12px', marginBottom: 12, border: '1px solid #cbd5e1', borderRadius: 8 };
