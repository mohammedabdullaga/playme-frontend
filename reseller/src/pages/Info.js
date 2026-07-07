import { Link, useNavigate } from 'react-router-dom';
import { getSavedLang, getStrings, saveLang } from '../i18n';
import { useEffect, useState } from 'react';

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

const cardStyle = {
  background: 'white',
  borderRadius: 16,
  boxShadow: '0 12px 30px rgba(15,23,42,0.08)',
  padding: 20,
  border: '1px solid #e2e8f0',
};

export default function Info() {
  const navigate = useNavigate();
  const [lang, setLang] = useState(getSavedLang());
  const strings = getStrings(lang);

  useEffect(() => {
    const resellerId = localStorage.getItem('reseller_id');
    if (!resellerId) {
      navigate('/');
    }
  }, [navigate]);

  const toggleLanguage = () => {
    const nextLang = lang === 'ar' ? 'en' : 'ar';
    setLang(nextLang);
    saveLang(nextLang);
  };

  return (
    <div style={{ minHeight: '100vh', background: '#f8fafc', padding: 16, direction: lang === 'ar' ? 'rtl' : 'ltr' }}>
      <div style={{ maxWidth: 1000, margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: 12, flexWrap: 'wrap', marginBottom: 18 }}>
          <div style={{ display: 'flex', gap: 8, alignItems: 'center', flexWrap: 'wrap' }}>
            <Link to="/dashboard" style={navLinkStyle}>{strings.navDashboard}</Link>
            <Link to="/info" style={activeNavLinkStyle}>{strings.navInfo}</Link>
          </div>
          <button onClick={toggleLanguage} style={{ padding: '10px 16px', borderRadius: 10, border: 'none', background: '#2563eb', color: 'white', cursor: 'pointer' }}>
            {strings.switchLanguage}
          </button>
        </div>

        <div style={cardStyle}>
          <h1 style={{ marginTop: 0, marginBottom: 10 }}>{strings.infoTitle}</h1>
          <p style={{ marginTop: 0, color: '#475569' }}>{strings.infoSubtitle}</p>

          <div style={{ display: 'grid', gap: 14, marginTop: 14 }}>
            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Apple TV Proxy App</div>
              <div style={{ color: '#334155', marginBottom: 4 }}>App name: <strong>Happ</strong></div>
              <a href="https://apps.apple.com/us/app/happ-proxy-utility/id6504287215" target="_blank" rel="noreferrer" style={{ color: '#0f766e', wordBreak: 'break-all' }}>
                https://apps.apple.com/us/app/happ-proxy-utility/id6504287215
              </a>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Remote Activation Link</div>
              <a href="https://tv.happ.su" target="_blank" rel="noreferrer" style={{ color: '#0f766e', wordBreak: 'break-all' }}>
                tv.happ.su
              </a>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Android Playme App Downloader Code</div>
              <div style={{ fontSize: 24, fontWeight: 800, letterSpacing: 1, color: '#0f172a' }}>862586</div>
            </div>

            <div style={{ background: '#f8fafc', border: '1px solid #e2e8f0', borderRadius: 12, padding: 14 }}>
              <div style={{ fontWeight: 700, marginBottom: 6 }}>Android TOD by Playme</div>
              <div style={{ color: '#334155' }}>
                Use TOD by Playme to run the TOD TV app on any Android TV or Android TV Box.
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
