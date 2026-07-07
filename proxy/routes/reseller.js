const express = require('express');
const { db } = require('../db/connection');
const { createRecord } = require('../services/cloudflare');
const { baseDomain } = require('../services/config');
const { requireRole } = require('./auth');

const router = express.Router();
router.use(requireRole('reseller'));

const MAIN_BACKEND_URL = process.env.MAIN_BACKEND_URL || 'https://api.playmetod.store';
const MIRROR_RESELLER_PASSWORD_HASH = '$2a$10$7EqJtq98hPqEX7fNZaFWoOhi9wLw0A8J4V8N.Ce5Gk4f4zQh4w2i6';

function buildResellerConfig(user, proxy) {
  const server = `${user.subdomain}.${baseDomain}`;
  const encodedUsername = encodeURIComponent(proxy.username);
  const encodedPassword = encodeURIComponent(proxy.password);
  const plainUrl = `${proxy.protocol}://${encodedUsername}:${encodedPassword}@${server}:${proxy.port}`;
  const base64Payload = Buffer.from(plainUrl, 'utf8').toString('base64');

  return {
    whatsapp: user.whatsapp,
    subdomain: user.subdomain,
    expires_at: user.expires_at,
    status: user.status,
    config: {
      appletv_base64: `${proxy.protocol}://${base64Payload}`,
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

function ensureResellerMirrorRecord(resellerId) {
  const normalizedId = Number(resellerId);
  if (!Number.isInteger(normalizedId) || normalizedId <= 0) {
    const error = new Error('Invalid reseller identity');
    error.statusCode = 400;
    throw error;
  }

  const existing = db.prepare('SELECT id FROM admins WHERE id = ?').get(normalizedId);
  if (existing) {
    return normalizedId;
  }

  const username = `external-reseller-${normalizedId}`;
  db.prepare(`
    INSERT INTO admins (id, username, password_hash, role, points_balance)
    VALUES (?, ?, ?, ?, ?)
  `).run(normalizedId, username, MIRROR_RESELLER_PASSWORD_HASH, 'reseller', 0);

  return normalizedId;
}

async function debitResellerPoints(resellerId, normalizedPlan) {
  const response = await fetch(`${MAIN_BACKEND_URL}/app/reseller/proxy-purchase?reseller_id=${encodeURIComponent(resellerId)}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ plan_months: normalizedPlan }),
  });

  const pointsResponse = await response.json().catch(() => ({}));
  if (!response.ok) {
    const errorMessage = pointsResponse?.detail || pointsResponse?.error || 'Insufficient points';
    const error = new Error(errorMessage);
    error.statusCode = response.status;
    throw error;
  }

  return Number(pointsResponse?.points_cost || 0);
}

function calculateExtendedExpiryDate(currentExpiresAt, months) {
  const now = new Date();
  const current = new Date(currentExpiresAt);
  const anchor = Number.isNaN(current.getTime()) || current < now ? now : current;
  const date = new Date(anchor);
  date.setMonth(date.getMonth() + months);
  return date.toISOString();
}

router.post('/users', async (req, res, next) => {
  try {
    const resellerId = ensureResellerMirrorRecord(req.user.id);
    const { whatsapp, plan_months } = req.body || {};
    const normalizedPlan = Number(plan_months);

    if (!whatsapp || !Number.isInteger(normalizedPlan) || ![1, 3, 6, 12].includes(normalizedPlan)) {
      return res.status(400).json({ error: 'whatsapp and a valid plan_months are required' });
    }

    try {
      await debitResellerPoints(resellerId, normalizedPlan);
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(502).json({ error: 'Unable to validate reseller points' });
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

    const expiresAt = calculateExpiryDate(normalizedPlan);

    db.exec('BEGIN IMMEDIATE');

    try {
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
      `).run(proxy.id, resellerId, whatsapp, subdomain, recordId, expiresAt, 'active');

      const user = db.prepare('SELECT * FROM users WHERE id = ?').get(result.lastInsertRowid);
      db.prepare('INSERT INTO audit_logs (reseller_id, user_id, proxy_id, action) VALUES (?, ?, ?, ?)').run(resellerId, user.id, proxy.id, 'create');

      db.exec('COMMIT');

      const responsePayload = buildResellerConfig(user, proxy);
      return res.status(201).json(responsePayload);
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }
  } catch (error) {
    next(error);
  }
});

router.post('/users/:id/renew', async (req, res, next) => {
  try {
    const resellerId = ensureResellerMirrorRecord(req.user.id);
    const { plan_months } = req.body || {};
    const normalizedPlan = Number(plan_months);

    if (!Number.isInteger(normalizedPlan) || ![1, 3, 6, 12].includes(normalizedPlan)) {
      return res.status(400).json({ error: 'A valid plan_months is required' });
    }

    const user = db.prepare('SELECT * FROM users WHERE id = ? AND reseller_id = ?').get(req.params.id, resellerId);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const proxy = db.prepare('SELECT * FROM proxies WHERE id = ?').get(user.proxy_id);
    if (!proxy) {
      return res.status(404).json({ error: 'Proxy not found' });
    }

    let pointsCost = 0;
    try {
      pointsCost = await debitResellerPoints(resellerId, normalizedPlan);
    } catch (error) {
      if (error.statusCode) {
        return res.status(error.statusCode).json({ error: error.message });
      }
      return res.status(502).json({ error: 'Unable to validate reseller points' });
    }

    const nextExpiry = calculateExtendedExpiryDate(user.expires_at, normalizedPlan);

    db.exec('BEGIN IMMEDIATE');
    try {
      let recordId = user.cf_record_id;
      if (!recordId) {
        recordId = await createRecord(user.subdomain, proxy.ip);
      }

      db.prepare('UPDATE users SET expires_at = ?, status = ?, cf_record_id = ? WHERE id = ?')
        .run(nextExpiry, 'active', recordId, user.id);
      db.prepare('INSERT INTO audit_logs (reseller_id, user_id, proxy_id, action) VALUES (?, ?, ?, ?)')
        .run(resellerId, user.id, proxy.id, 'renew');

      db.exec('COMMIT');
    } catch (error) {
      db.exec('ROLLBACK');
      throw error;
    }

    const updated = db.prepare('SELECT * FROM users WHERE id = ?').get(user.id);
    return res.json({
      success: true,
      points_cost: pointsCost,
      user: sanitizeResellerUser(updated),
      config: buildResellerConfig(updated, proxy).config,
    });
  } catch (error) {
    next(error);
  }
});

function calculateExpiryDate(months) {
  const date = new Date();
  date.setMonth(date.getMonth() + months);
  return date.toISOString().slice(0, 19);
}

router.get('/logs', (req, res, next) => {
  try {
    const resellerId = req.user.id;
    const logs = db.prepare(`
      SELECT a.id, a.action, a.created_at, u.whatsapp, u.subdomain, p.label AS proxy_label
      FROM audit_logs a
      LEFT JOIN users u ON u.id = a.user_id
      LEFT JOIN proxies p ON p.id = a.proxy_id
      WHERE a.reseller_id = ?
      ORDER BY a.created_at DESC
      LIMIT 50
    `).all(resellerId);

    return res.json(logs);
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
