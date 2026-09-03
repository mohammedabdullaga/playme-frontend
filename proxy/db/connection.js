const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const { adminUser, adminPass, cfApiToken, cfApiKey, cfApiEmail, cfZoneId, baseDomain } = require('../services/config');

const dbPath = path.join(__dirname, '..', 'proxy.db');
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON');

function initializeDatabase() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);

  const adminColumns = db.prepare('PRAGMA table_info(admins)').all();
  const hasPointsBalance = adminColumns.some((column) => column.name === 'points_balance');
  if (!hasPointsBalance) {
    db.exec('ALTER TABLE admins ADD COLUMN points_balance INTEGER NOT NULL DEFAULT 0');
  }

  const userColumns = db.prepare('PRAGMA table_info(users)').all();
  const hasDomainId = userColumns.some((column) => column.name === 'domain_id');
  if (!hasDomainId) {
    db.exec('ALTER TABLE users ADD COLUMN domain_id INTEGER REFERENCES proxy_domains(id)');
  }
  db.exec('CREATE INDEX IF NOT EXISTS idx_users_domain_id ON users(domain_id)');

  if (baseDomain && cfZoneId) {
    let legacyDomain = db.prepare('SELECT * FROM proxy_domains WHERE domain = ?').get(baseDomain);
    if (!legacyDomain) {
      const hasAnyDefault = db.prepare('SELECT id FROM proxy_domains WHERE is_default = 1 LIMIT 1').get();
      const result = db.prepare(`
        INSERT INTO proxy_domains (domain, zone_id, api_token, api_key, api_email, is_default)
        VALUES (?, ?, ?, ?, ?, ?)
      `).run(baseDomain, cfZoneId, cfApiToken || null, cfApiKey || null, cfApiEmail || null, hasAnyDefault ? 0 : 1);
      legacyDomain = db.prepare('SELECT * FROM proxy_domains WHERE id = ?').get(result.lastInsertRowid);
    }
    db.prepare('UPDATE users SET domain_id = ? WHERE domain_id IS NULL').run(legacyDomain.id);
  }

  const existingAdmin = db.prepare('SELECT * FROM admins WHERE username = ?').get(adminUser);
  if (!existingAdmin) {
    const passwordHash = bcrypt.hashSync(adminPass, 10);
    db.prepare('INSERT INTO admins (username, password_hash, role) VALUES (?, ?, ?)').run(
      adminUser,
      passwordHash,
      'admin'
    );
  } else {
    const passwordHash = bcrypt.hashSync(adminPass, 10);
    const needsPasswordRefresh = !bcrypt.compareSync(adminPass, existingAdmin.password_hash);
    if (needsPasswordRefresh) {
      db.prepare('UPDATE admins SET password_hash = ?, role = ? WHERE id = ?').run(passwordHash, 'admin', existingAdmin.id);
    }
  }

  return db;
}

function closeConnection() {
  db.close();
}

module.exports = {
  db,
  initializeDatabase,
  closeConnection,
};
