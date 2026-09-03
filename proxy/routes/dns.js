const express = require('express');
const { db } = require('../db/connection');
const { requireRole } = require('./auth');
const { deleteRecord, listRecords } = require('../services/cloudflare');
const { getDomainById } = require('../services/domains');

const router = express.Router();
router.use(requireRole('admin'));

router.post('/cleanup-orphans', async (_req, res, next) => {
  try {
    const domains = db.prepare('SELECT * FROM proxy_domains ORDER BY id ASC').all();
    const knownNamesByDomain = new Map();
    const users = db.prepare(`
      SELECT u.subdomain, u.domain_id
      FROM users u
      WHERE u.subdomain IS NOT NULL AND u.domain_id IS NOT NULL
    `).all();

    for (const user of users) {
      if (!knownNamesByDomain.has(user.domain_id)) knownNamesByDomain.set(user.domain_id, new Set());
      knownNamesByDomain.get(user.domain_id).add(user.subdomain.toLowerCase());
    }

    const removed = [];
    const skipped = [];

    for (const domain of domains) {
      const records = await listRecords(domain);
      const knownNames = knownNamesByDomain.get(domain.id) || new Set();
      const managedLabel = new RegExp(`^[a-z][a-z0-9]{7}\\.${domain.domain.replace(/[.*+?^${}()|[\\]\\]/g, '\\$&')}$`, 'i');

      for (const record of records) {
        const recordName = String(record.name || '').toLowerCase();
        const label = recordName.slice(0, -(domain.domain.length + 1));
        if (!managedLabel.test(recordName) || knownNames.has(label)) continue;

        try {
          await deleteRecord(record.id, domain);
          removed.push({ domain: domain.domain, name: record.name, id: record.id });
        } catch (error) {
          skipped.push({ domain: domain.domain, name: record.name, reason: error.message });
        }
      }
    }

    return res.json({ success: true, removed_count: removed.length, skipped_count: skipped.length, removed, skipped });
  } catch (error) {
    return next(error);
  }
});

module.exports = router;