const express = require('express');
const { db } = require('../db/connection');
const { authenticateToken } = require('./auth');

const router = express.Router();
router.use(authenticateToken);

router.get('/', (req, res) => {
  const proxies = db.prepare(`
    SELECT p.*, COALESCE(c.active_user_count, 0) AS active_user_count
    FROM proxies p
    LEFT JOIN proxy_active_user_counts c ON c.proxy_id = p.id
    WHERE p.status = 'active'
    ORDER BY p.id DESC
  `).all();
  return res.json(proxies);
});

router.post('/', (req, res) => {
  const { label, ip, port, protocol, username, password, region, max_users, status } = req.body || {};

  if (!label || !ip || !port || !protocol || !username || !password) {
    return res.status(400).json({ error: 'label, ip, port, protocol, username, and password are required' });
  }

  const insert = db.prepare(`
    INSERT INTO proxies (label, ip, port, protocol, username, password, region, max_users, status)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const result = insert.run(label, ip, port, protocol, username, password, region || null, max_users || 3, status || 'active');

  const created = db.prepare(`
    SELECT p.*, COALESCE(c.active_user_count, 0) AS active_user_count
    FROM proxies p
    LEFT JOIN proxy_active_user_counts c ON c.proxy_id = p.id
    WHERE p.id = ?
  `).get(result.lastInsertRowid);

  return res.status(201).json(created);
});

router.put('/:id', (req, res) => {
  const { id } = req.params;
  const { label, ip, port, protocol, username, password, region, max_users, status } = req.body || {};

  const existing = db.prepare('SELECT * FROM proxies WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Proxy not found' });
  }

  db.prepare(`
    UPDATE proxies
    SET label = COALESCE(?, label), ip = COALESCE(?, ip), port = COALESCE(?, port), protocol = COALESCE(?, protocol),
        username = COALESCE(?, username), password = COALESCE(?, password), region = COALESCE(?, region),
        max_users = COALESCE(?, max_users), status = COALESCE(?, status)
    WHERE id = ?
  `).run(label, ip, port, protocol, username, password, region, max_users, status, id);

  const updated = db.prepare(`
    SELECT p.*, COALESCE(c.active_user_count, 0) AS active_user_count
    FROM proxies p
    LEFT JOIN proxy_active_user_counts c ON c.proxy_id = p.id
    WHERE p.id = ?
  `).get(id);

  return res.json(updated);
});

router.delete('/:id', (req, res) => {
  const { id } = req.params;
  const existing = db.prepare('SELECT * FROM proxies WHERE id = ?').get(id);
  if (!existing) {
    return res.status(404).json({ error: 'Proxy not found' });
  }

  db.prepare('DELETE FROM users WHERE proxy_id = ?').run(id);
  db.prepare('DELETE FROM proxies WHERE id = ?').run(id);

  return res.json({ deleted: true, id: Number(id) });
});

module.exports = router;
