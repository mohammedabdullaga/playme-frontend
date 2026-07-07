const express = require('express');
const { db } = require('../db/connection');
const { createRecord } = require('../services/cloudflare');
const { baseDomain } = require('../services/config');
const { requireRole } = require('./auth');

const router = express.Router();
router.use(requireRole('reseller'));

function buildResellerConfig(user, proxy) {
  const server = `${user.subdomain}.${baseDomain}`;
  const payload = {
    protocol: proxy.protocol,
    server,
    port: proxy.port,
    username: proxy.username,
    password: proxy.password,
  };

  const payloadJson = JSON.stringify(payload);
  const base64Payload = Buffer.from(payloadJson, 'utf8').toString('base64');

  return {
    whatsapp: user.whatsapp,
    subdomain: user.subdomain,
    expires_at: user.expires_at,
    status: user.status,
    config: {
      appletv_base64: `socks://${base64Payload}`,
      iphone_plain: {
        protocol: proxy.protocol,
        server,
        port: proxy.port,
        username: proxy.username,
        password: proxy.password,
      },
    },
  };
}

function sanitizeResellerUser(user) {
  return {
    id: user.id,
    whatsapp: user.whatsapp,
    subdomain: user.subdomain,
    expires_at: user.expires_at,
    status: user.status,
  };
}

router.post('/users', async (req, res, next) => {
  try {
    const resellerId = req.user.id;
    const { whatsapp, expires_at } = req.body || {};
    if (!whatsapp || !expires_at) {
      return res.status(400).json({ error: 'whatsapp and expires_at are required' });
    }

    const proxy = db.prepare(`
      SELECT p.*
      FROM proxies p
      LEFT JOIN proxy_active_user_counts c ON c.proxy_id = p.id
      WHERE p.status = 'active'
      AND COALESCE(c.active_user_count, 0) < p.max_users
      ORDER BY COALESCE(c.active_user_count, 0), p.id
      LIMIT 1
    `).get();

    if (!proxy) {
      return res.status(409).json({ error: 'No available proxy slot' });
    }

    let subdomain = generateSubdomain();
    let attempts = 0;
    while (db.prepare('SELECT id FROM users WHERE subdomain = ?').get(subdomain) && attempts < 20) {
      subdomain = generateSubdomain();
      attempts += 1;
    }

    const recordId = await createRecord(subdomain, proxy.ip);
    const result = db.prepare(`
      INSERT INTO users (proxy_id, reseller_id, whatsapp, subdomain, cf_record_id, expires_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(proxy.id, resellerId, whatsapp, subdomain, recordId, expires_at, 'active');

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    db.prepare('INSERT INTO audit_logs (reseller_id, user_id, proxy_id, action) VALUES (?, ?, ?, ?)').run(resellerId, user.id, proxy.id, 'create');

    const responsePayload = buildResellerConfig(user, proxy);
    return res.status(201).json(responsePayload);
  } catch (error) {
    next(error);
  }
});

router.get('/users', (req, res, next) => {
  try {
    const resellerId = req.user.id;
    const { search } = req.query || {};

    let query = `
      SELECT u.id, u.whatsapp, u.subdomain, u.expires_at, u.status
      FROM users u
      WHERE u.reseller_id = ?
    `;
    const params = [resellerId];

    if (search) {
      query += ` AND (u.whatsapp LIKE ? OR u.subdomain LIKE ?)`;
      params.push(`%${search}%`, `%${search}%`);
    }

    query += ' ORDER BY u.id DESC';
    const users = db.prepare(query).all(...params);
    return res.json(users);
  } catch (error) {
    next(error);
  }
});

router.get('/users/:id/config', (req, res, next) => {
  try {
    const resellerId = req.user.id;
    const user = db.prepare('SELECT * FROM users WHERE id = ? AND reseller_id = ?').get(req.params.id, resellerId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const proxy = db.prepare('SELECT * FROM proxies WHERE id = ?').get(user.proxy_id);
    if (!proxy) {
      return res.status(404).json({ error: 'Proxy not found' });
    }

    const responsePayload = buildResellerConfig(user, proxy);
    return res.json(responsePayload);
  } catch (error) {
    next(error);
  }
});

function generateSubdomain() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let subdomain = '';
  do {
    subdomain = Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  } while (!/^[a-z]/.test(subdomain));
  return subdomain;
}

module.exports = router;
