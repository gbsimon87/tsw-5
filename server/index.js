const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
const crypto = require('crypto');
const fs = require('fs');
const { logger } = require('./middleware');

const envFile = process.env.NODE_ENV === 'production' ? '.env.production' : '.env.development';
const envPath = path.resolve(__dirname, envFile);

try {
  require('dotenv').config({ path: envPath });
} catch (err) {
  console.error('Failed to load .env file:', err);
}

const app = express();

// Add CORS middleware before routes
app.use(cors({
  origin: ['https://thesportyway.com'],
  credentials: true,
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// Content Security Policy with nonce
app.use((req, res, next) => {
  const nonce = crypto.randomBytes(16).toString('base64');
  res.locals.nonce = nonce;
  res.setHeader(
    'Content-Security-Policy',
    `default-src 'self'; script-src 'self' https://www.googletagmanager.com https://accounts.google.com 'nonce-${nonce}'; connect-src 'self' https://www.google-analytics.com https://*.google-analytics.com; img-src 'self' data: https://lh3.googleusercontent.com https://placehold.co; style-src 'self' https://accounts.google.com 'unsafe-inline'; frame-src https://accounts.google.com;`
  );
  next();
});

// Import routers
const authRouter = require('./routes/auth');
const leaguesRouter = require('./routes/leagues');
const teamsRouter = require('./routes/teams');
const playersRouter = require('./routes/players');
const gamesRouter = require('./routes/games');

// Mount API routers
app.use('/auth', authRouter);
app.use('/api/leagues', leaguesRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/players', playersRouter);
app.use('/api/games', gamesRouter);

// Root API route
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the MERN backend!' });
});

// Middleware to inject nonce into index.html for client routes
app.get('*', (req, res) => {
  const indexPath = path.join(__dirname, '../client/dist', 'index.html');
  fs.readFile(indexPath, 'utf8', (err, data) => {
    if (err) {
      logger.error('Failed to read index.html', { error: err.message });
      return res.status(500).send('Server error');
    }
    const html = data.replace(/%NONCE%/g, res.locals.nonce);
    res.setHeader('Content-Type', 'text/html');
    res.send(html);
  });
});

// Initialize MongoDB connection and start server
const PORT = process.env.PORT || 5000;

connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
  });
}).catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});