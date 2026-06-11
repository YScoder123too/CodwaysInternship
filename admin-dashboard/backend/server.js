require('dotenv').config({ path: __dirname + '/.env' });

const express = require('express');
const cors    = require('cors');

const authRouter  = require('./routes/auth');
const usersRouter = require('./routes/users');

const app  = express();
const PORT = process.env.PORT || 3000;

app.use(cors({
  origin(origin, cb) {
    if (!origin) return cb(null, true);
    if (/^http:\/\/(localhost|127\.0\.0\.1):\d+$/.test(origin)) return cb(null, true);
    cb(new Error(`CORS blocked: ${origin}`));
  },
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
  credentials: true,
}));

app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, _res, next) => {
  console.log(`[${new Date().toISOString().slice(11,19)}] ${req.method.padEnd(6)} ${req.path}`);
  next();
});

app.use('/api/auth',  authRouter);
app.use('/api/users', usersRouter);

app.get('/api/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.use((_req, res) => res.status(404).json({ error: 'Route not found.' }));

app.use((err, _req, res, _next) => {
  console.error('Error:', err.message);
  res.status(500).json({ error: 'Internal server error.' });
});

app.listen(PORT, () => {
  console.log(`\n🚀  AdminPro API  →  http://localhost:${PORT}`);
  console.log(`    JWT_SECRET loaded: ${!!process.env.JWT_SECRET}`);
  console.log(`    Demo: admin@demo.com / admin123\n`);
});