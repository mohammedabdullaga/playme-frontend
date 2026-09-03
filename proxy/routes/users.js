const express = require('express');
const { db } = require('../db/connection');
const { authenticateToken, requireRole } = require('./auth');
const { createRecord, deleteRecord } = require('../services/cloudflare');
const { baseDomain } = require('../services/config');
const { getDefaultDomain, getDomainById } = require('../services/domains');

const router = express.Router();
router.use(authenticateToken);
router.use(requireRole('admin'));

async function buildConfig(user, proxy) {
  const domain = user.domain_id ? getDomainById(user.domain_id) : null;
  const server = `${user.subdomain}.${domain?.domain || baseDomain}`;
  const appletvBase64 = `socks://${proxy.username}:${proxy.password}@${server}:${proxy.port}`;

  return {
    user,
    config: {
      appletv_base64: appletvBase64,
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

function generateSubdomain() {
  const alphabet = 'abcdefghijklmnopqrstuvwxyz0123456789';
  let subdomain = '';
  do {
    subdomain = Array.from({ length: 8 }, () => alphabet[Math.floor(Math.random() * alphabet.length)]).join('');
  } while (!/^[a-z]/.test(subdomain));
  return subdomain;
}

router.get('/', (req, res) => {
  const search = String(req.query.search || '').trim();
  let query = `
    SELECT u.*, d.domain AS assigned_domain, r.username AS reseller_username, p.label AS proxy_label, p.ip AS proxy_ip, p.port AS proxy_port, p.protocol AS proxy_protocol
    FROM users u
    LEFT JOIN proxy_domains d ON d.id = u.domain_id
    LEFT JOIN admins r ON r.id = u.reseller_id
    LEFT JOIN proxies p ON p.id = u.proxy_id
  `;
  const params = [];
  if (search) {
    query += ' WHERE u.subdomain LIKE ? OR u.whatsapp LIKE ?';
    params.push(`%${search}%`, `%${search}%`);
  }
  query += ' ORDER BY u.id DESC';
  const users = db.prepare(query).all(...params);
  return res.json(users);
});

router.post('/repair-dns', async (req, res, next) => {
  try {
    const activeUsers = db.prepare(`
      SELECT u.id, u.subdomain, u.proxy_id, u.domain_id, p.ip AS proxy_ip
      FROM users u
      LEFT JOIN proxies p ON p.id = u.proxy_id
      WHERE u.status = ?
      ORDER BY u.id ASC
    `).all('active');

    const repaired = [];
    const skipped = [];

    for (const user of activeUsers) {
      if (!user.proxy_ip) {
        skipped.push({ id: user.id, reason: 'Proxy not found' });
        continue;
      }

      const recordId = await createRecord(user.subdomain, user.proxy_ip, getDomainById(user.domain_id));
      db.prepare('UPDATE users SET cf_record_id = ? WHERE id = ?').run(recordId, user.id);
      repaired.push({ id: user.id, subdomain: user.subdomain, record_id: recordId });
    }

    return res.json({
      success: true,
      active_count: activeUsers.length,
      repaired_count: repaired.length,
      skipped_count: skipped.length,
      repaired,
      skipped,
    });
  } catch (error) {
    next(error);
  }
});

router.post('/', async (req, res, next) => {
  try {
    const { proxy_id, whatsapp, expires_at } = req.body || {};

    if (!proxy_id || !whatsapp || !expires_at) {
      return res.status(400).json({ error: 'proxy_id, whatsapp, and expires_at are required' });
    }

    const proxy = db.prepare('SELECT * FROM proxies WHERE id = ?').get(proxy_id);
    if (!proxy) {
      return res.status(404).json({ error: 'Proxy not found' });
    }

    const activeCount = db.prepare('SELECT COUNT(*) AS count FROM users WHERE proxy_id = ? AND status = ?').get(proxy_id, 'active').count;
    if (activeCount >= proxy.max_users) {
      return res.status(409).json({ error: `Proxy is full (${activeCount}/${proxy.max_users})` });
    }

    let subdomain = generateSubdomain();
    let attempts = 0;
    while (db.prepare('SELECT id FROM users WHERE subdomain = ?').get(subdomain) && attempts < 10) {
      subdomain = generateSubdomain();
      attempts += 1;
    }

    const domain = getDefaultDomain();
    const recordId = await createRecord(subdomain, proxy.ip, domain);
    const result = db.prepare(`
      INSERT INTO users (proxy_id, whatsapp, subdomain, domain_id, cf_record_id, expires_at, status)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(proxy_id, whatsapp, subdomain, domain?.id || null, recordId, expires_at, 'active');

    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
    const responsePayload = await buildConfig(user, proxy);
    return res.status(201).json(responsePayload);
  } catch (error) {
    next(error);
  }
});

router.put('/:id', async (req, res, next) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) return res.status(404).json({ error: 'User not found' });

    const whatsapp = req.body?.whatsapp !== undefined ? String(req.body.whatsapp).trim() : user.whatsapp;
    const expiresAt = req.body?.expires_at !== undefined ? String(req.body.expires_at).trim() : user.expires_at;
    if (!whatsapp || !expiresAt) {
      return res.status(400).json({ error: 'whatsapp and expires_at are required' });
    }

    db.prepare('UPDATE users SET whatsapp = ?, expires_at = ? WHERE id = ?').run(whatsapp, expiresAt, user.id);
    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    return res.json(updated);
  } catch (error) {
    return next(error);
  }
});

router.get('/:id/config', async (req, res, next) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const proxy = db.prepare('SELECT * FROM proxies WHERE id = ?').get(user.proxy_id);
    if (!proxy) {
      return res.status(404).json({ error: 'Proxy not found' });
    }

    const responsePayload = await buildConfig(user, proxy);
    return res.json(responsePayload);
  } catch (error) {
    next(error);
  }
});

router.post('/:id/disable', async (req, res, next) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.cf_record_id) {
      await deleteRecord(user.cf_record_id, getDomainById(user.domain_id));
    }

    db.prepare('UPDATE users SET cf_record_id = NULL, status = ? WHERE id = ?').run('disabled', user.id);
    return res.json({ success: true, id: user.id, status: 'disabled' });
  } catch (error) {
    next(error);
  }
});

router.delete('/:id', async (req, res, next) => {
  try {
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    if (user.cf_record_id) {
      await deleteRecord(user.cf_record_id, getDomainById(user.domain_id));
    }

    db.prepare('DELETE FROM audit_logs WHERE user_id = ?').run(user.id);
    db.prepare('DELETE FROM users WHERE id = ?').run(user.id);

    return res.json({ success: true, id: user.id });
  } catch (error) {
    next(error);
  }
});

router.post('/:id/reactivate', async (req, res, next) => {
  try {
    const { expires_at } = req.body || {};
    const user = db.prepare('SELECT * FROM users WHERE id = ?').get(req.params.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const proxy = db.prepare('SELECT * FROM proxies WHERE id = ?').get(user.proxy_id);
    if (!proxy) {
      return res.status(404).json({ error: 'Proxy not found' });
    }

    const recordId = await createRecord(user.subdomain, proxy.ip, getDomainById(user.domain_id));
    db.prepare('UPDATE users SET cf_record_id = ?, expires_at = ?, status = ? WHERE id = ?').run(recordId, expires_at, 'active', user.id);

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    return res.json({ success: true, user: updated });
  } catch (error) {
    next(error);
  }
});

module.exports = router;
