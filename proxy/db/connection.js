const fs = require('fs');
const path = require('path');
const { DatabaseSync } = require('node:sqlite');
const bcrypt = require('bcryptjs');
const { adminUser, adminPass } = require('../services/config');

const dbPath = path.join(__dirname, '..', 'proxy.db');
const db = new DatabaseSync(dbPath);
db.exec('PRAGMA foreign_keys = ON');

function initializeDatabase() {
  const schema = fs.readFileSync(path.join(__dirname, 'schema.sql'), 'utf8');
  db.exec(schema);

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
