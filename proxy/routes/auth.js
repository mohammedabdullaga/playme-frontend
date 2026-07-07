const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const { db } = require('../db/connection');
const { jwtSecret } = require('../services/config');

const router = express.Router();

function getResellerIdentity(req, resellerId) {
  const normalizedId = Number(resellerId);
  return {
    id: Number.isFinite(normalizedId) ? normalizedId : 0,
    username: `reseller-${normalizedId}`,
    role: 'reseller',
  };
}

function authenticateToken(req, res, next) {
  const authHeader = req.headers.authorization || '';
  const token = authHeader.startsWith('Bearer ') ? authHeader.slice(7) : null;

  if (token) {
    try {
      const decoded = jwt.verify(token, jwtSecret);
      req.user = decoded;
      return next();
    } catch (_error) {
      return res.status(401).json({ error: 'Invalid or expired token' });
    }
  }

  const resellerId = req.query.reseller_id || req.headers['x-reseller-id'];
  if (resellerId) {
    const reseller = getResellerIdentity(req, resellerId);
    req.user = reseller;
    return next();
  }

  return res.status(401).json({ error: 'Authentication token is required' });
}

function requireRole(role) {
  return (req, res, next) => {
    if (!req.user || req.user.role !== role) {
      return res.status(403).json({ error: 'Forbidden' });
    }
    return next();
  };
}

router.post('/login', (req, res) => {
  const username = req.body?.username || req.body?.email || '';
  const password = req.body?.password || '';

  if (!username || !password) {
    return res.status(400).json({ error: 'username and password are required' });
  }

  const admin = db.prepare('SELECT * FROM admins WHERE username = ?').get(username);
  if (!admin) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const isValid = bcrypt.compareSync(password, admin.password_hash);
  if (!isValid) {
    return res.status(401).json({ error: 'Invalid credentials' });
  }

  const token = jwt.sign({ id: admin.id, username: admin.username, role: admin.role }, jwtSecret, { expiresIn: '8h' });

  return res.json({
    token,
    user: { id: admin.id, username: admin.username, role: admin.role },
  });
});

module.exports = router;
module.exports.authenticateToken = authenticateToken;
module.exports.requireRole = requireRole;
