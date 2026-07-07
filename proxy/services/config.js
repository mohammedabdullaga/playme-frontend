require('dotenv').config();

function getEnv(name, fallback = '') {
  return process.env[name] || fallback;
}

module.exports = {
  port: Number(getEnv('PORT', '3000')),
  jwtSecret: getEnv('JWT_SECRET', 'change-me'),
  adminUser: getEnv('ADMIN_USER', 'admin'),
  adminPass: getEnv('ADMIN_PASS', 'changeme'),
  cfApiToken: getEnv('CF_API_TOKEN', ''),
  cfApiKey: getEnv('CF_API_KEY', ''),
  cfApiEmail: getEnv('CF_API_EMAIL', ''),
  cfZoneId: getEnv('CF_ZONE_ID', ''),
  baseDomain: getEnv('BASE_DOMAIN', 'example.com'),
};
