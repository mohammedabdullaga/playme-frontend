const cron = require('node-cron');
const { db } = require('../db/connection');
const { deleteRecord } = require('./cloudflare');

function startExpiryCron() {
  cron.schedule('0 * * * *', async () => {
    const expiredUsers = db.prepare('SELECT * FROM users WHERE status = ? AND expires_at < ?').all('active', new Date().toISOString());
    for (const user of expiredUsers) {
      try {
        if (user.cf_record_id) {
          await deleteRecord(user.cf_record_id);
        }
        db.prepare('UPDATE users SET cf_record_id = NULL, status = ? WHERE id = ?').run('expired', user.id);
      } catch (error) {
        console.error('Failed to expire user', user.id, error.message);
      }
    }
  });
}

module.exports = { startExpiryCron };
