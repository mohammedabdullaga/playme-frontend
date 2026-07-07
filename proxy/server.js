const express = require('express');
const dotenv = require('dotenv');
const { initializeDatabase, closeConnection } = require('./db/connection');
const authRouter = require('./routes/auth');
const { authenticateToken } = require('./routes/auth');
const proxiesRouter = require('./routes/proxies');
const usersRouter = require('./routes/users');
const resellerRouter = require('./routes/reseller');
const auditRouter = require('./routes/audit');
const { startExpiryCron } = require('./services/cron');

dotenv.config();

const app = express();
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Headers', 'Origin, X-Requested-With, Content-Type, Accept, Authorization');
  res.header('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE, OPTIONS');
  if (req.method === 'OPTIONS') {
    return res.sendStatus(204);
  }
  return next();
});

app.get('/health', (_req, res) => {
  res.json({ ok: true });
});

app.use('/api', (req, res, next) => {
  if (req.path === '/auth/login') {
    return next();
  }
  return authenticateToken(req, res, next);
});

app.use('/api/auth', authRouter);
app.use('/api/proxies', proxiesRouter);
app.use('/api/users', usersRouter);
app.use('/api/reseller', resellerRouter);
app.use('/api/audit', auditRouter);

app.use((err, _req, res, _next) => {
  console.error(err);
  res.status(err.statusCode || 500).json({ error: err.message || 'Internal server error' });
});

initializeDatabase();
startExpiryCron();

const PORT = process.env.PORT || 3000;

if (require.main === module) {
  const server = app.listen(PORT, () => {
    console.log(`Server listening on port ${PORT}`);
  });

  process.on('SIGTERM', () => {
    server.close(() => {
      closeConnection();
      process.exit(0);
    });
  });
}

module.exports = app;
