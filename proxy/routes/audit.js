const express = require('express');
const { db } = require('../db/connection');
const { requireRole } = require('./auth');

const router = express.Router();

router.use(requireRole('admin'));

router.get('/logs', (req, res) => {
  const logs = db.prepare(`
    SELECT a.*, r.username AS reseller_username, u.whatsapp AS customer_whatsapp, p.label AS proxy_label
    FROM audit_logs a
    LEFT JOIN admins r ON r.id = a.reseller_id
    LEFT JOIN users u ON u.id = a.user_id
    LEFT JOIN proxies p ON p.id = a.proxy_id
    ORDER BY a.created_at DESC
  `).all();

  return res.json(logs);
});

module.exports = router;
