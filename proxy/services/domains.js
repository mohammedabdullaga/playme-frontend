const { db } = require('../db/connection');

function getDefaultDomain() {
  return db.prepare('SELECT * FROM proxy_domains ORDER BY is_default DESC, id ASC LIMIT 1').get() || null;
}

function getDomainById(id) {
  return db.prepare('SELECT * FROM proxy_domains WHERE id = ?').get(id) || null;
}

function publicDomain(domain) {
  if (!domain) return null;
  return {
    id: domain.id,
    domain: domain.domain,
    zone_id: domain.zone_id,
    has_api_token: Boolean(domain.api_token),
    has_api_key: Boolean(domain.api_key),
    api_email: domain.api_email || null,
    is_default: Boolean(domain.is_default),
    created_at: domain.created_at,
  };
}

module.exports = { getDefaultDomain, getDomainById, publicDomain };