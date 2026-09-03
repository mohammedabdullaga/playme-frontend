const cron = require('node-cron');
const { db } = require('../db/connection');
const { deleteRecord, findRecordId } = require('./cloudflare');
const { getDomainById } = require('./domains');

async function expireUsers() {
  const expiredUsers = db.prepare('SELECT * FROM users WHERE status = ? AND expires_at <= ?').all('active', new Date().toISOString());
  for (const user of expiredUsers) {
    try {
      const domain = getDomainById(user.domain_id);
      const recordId = user.cf_record_id || await findRecordId(user.subdomain, domain);
      if (recordId) {
        await deleteRecord(recordId, domain);
      }
      db.prepare('UPDATE users SET cf_record_id = NULL, status = ? WHERE id = ? AND status = ?').run('expired', user.id, 'active');
    } catch (error) {
      console.error('Failed to expire user', user.id, error.message);
    }
  }
}

function startExpiryCron() {
  expireUsers().catch((error) => console.error('Failed to run expiry cleanup', error.message));
  cron.schedule('*/5 * * * *', () => {
    expireUsers().catch((error) => console.error('Failed to run expiry cleanup', error.message));
  });
}

module.exports = { startExpiryCron };
