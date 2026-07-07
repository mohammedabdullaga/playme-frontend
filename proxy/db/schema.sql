CREATE TABLE IF NOT EXISTS admins (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  username TEXT NOT NULL UNIQUE,
  password_hash TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'reseller')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS proxies (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  label TEXT NOT NULL,
  ip TEXT NOT NULL,
  port INTEGER NOT NULL,
  protocol TEXT NOT NULL CHECK (protocol IN ('http', 'socks5')),
  username TEXT NOT NULL,
  password TEXT NOT NULL,
  region TEXT,
  max_users INTEGER NOT NULL DEFAULT 3 CHECK (max_users > 0),
  status TEXT NOT NULL DEFAULT 'active' CHECK (status IN ('active', 'disabled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS users (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  proxy_id INTEGER NOT NULL REFERENCES proxies(id),
  reseller_id INTEGER REFERENCES admins(id),
  whatsapp TEXT NOT NULL,
  subdomain TEXT NOT NULL UNIQUE,
  cf_record_id TEXT,
  expires_at TEXT NOT NULL,
  status TEXT NOT NULL CHECK (status IN ('active', 'expired', 'disabled')),
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE VIEW IF NOT EXISTS proxy_active_user_counts AS
SELECT proxy_id, COUNT(*) AS active_user_count
FROM users
WHERE status = 'active'
GROUP BY proxy_id;

CREATE TABLE IF NOT EXISTS audit_logs (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  reseller_id INTEGER REFERENCES admins(id),
  user_id INTEGER REFERENCES users(id),
  proxy_id INTEGER REFERENCES proxies(id),
  action TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT CURRENT_TIMESTAMP
);

CREATE INDEX IF NOT EXISTS idx_audit_logs_reseller_id ON audit_logs(reseller_id);
CREATE INDEX IF NOT EXISTS idx_audit_logs_user_id ON audit_logs(user_id);

CREATE INDEX IF NOT EXISTS idx_users_proxy_status ON users(proxy_id, status);
