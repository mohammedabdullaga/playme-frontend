const express = require('express');
const { db } = require('../db/connection');
const { requireRole } = require('./auth');
const { publicDomain } = require('../services/domains');

const router = express.Router();
router.use(requireRole('admin'));

function normalizeDomain(value) {
  return String(value || '').trim().toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
}

router.get('/', (_req, res) => {
  const domains = db.prepare('SELECT * FROM proxy_domains ORDER BY is_default DESC, id ASC').all();
  return res.json(domains.map(publicDomain));
});

router.post('/', (req, res) => {
  const domain = normalizeDomain(req.body?.domain);
  const zoneId = String(req.body?.zone_id || '').trim();
  const apiToken = String(req.body?.api_token || '').trim();
  const apiKey = String(req.body?.api_key || '').trim();
  const apiEmail = String(req.body?.api_email || '').trim();

  if (!domain || !/^[a-z0-9.-]+\.[a-z]{2,}$/i.test(domain)) {
    return res.status(400).json({ error: 'A valid domain is required' });
  }
  if (!zoneId || (!apiToken && !(apiKey && apiEmail))) {
    return res.status(400).json({ error: 'zone_id and either api_token or api_key with api_email are required' });
  }
  if (db.prepare('SELECT id FROM proxy_domains WHERE domain = ?').get(domain)) {
    return res.status(409).json({ error: 'Domain already exists' });
  }

  const hasDefault = db.prepare('SELECT id FROM proxy_domains WHERE is_default = 1 LIMIT 1').get();
  const result = db.prepare(`
    INSERT INTO proxy_domains (domain, zone_id, api_token, api_key, api_email, is_default)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(domain, zoneId, apiToken || null, apiKey || null, apiEmail || null, hasDefault ? 0 : 1);

  return res.status(201).json(publicDomain(db.prepare('SELECT * FROM proxy_domains WHERE id = ?').get(result.lastInsertRowid)));
});

router.post('/:id/default', (req, res) => {
  const domain = db.prepare('SELECT * FROM proxy_domains WHERE id = ?').get(req.params.id);
  if (!domain) return res.status(404).json({ error: 'Domain not found' });

  db.exec('BEGIN IMMEDIATE');
  try {
    db.prepare('UPDATE proxy_domains SET is_default = 0').run();
    db.prepare('UPDATE proxy_domains SET is_default = 1 WHERE id = ?').run(domain.id);
    db.exec('COMMIT');
  } catch (error) {
    db.exec('ROLLBACK');
    throw error;
  }

  return res.json(publicDomain(db.prepare('SELECT * FROM proxy_domains WHERE id = ?').get(domain.id)));
});

module.exports = router;