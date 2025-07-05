const express = require('express');
const path = require('path');
const connectDB = require('./config/db');
require('dotenv').config({ path: '.env' });

const app = express();
app.use(express.json());
app.use(express.static(path.join(__dirname, '../client/dist')));

// Import routers
const authRouter = require('./routes/auth');
const leaguesRouter = require('./routes/leagues');
const teamsRouter = require('./routes/teams');
const playersRouter = require('./routes/players');
const gamesRouter = require('./routes/games');

// Mount routers
app.use('/auth', authRouter);
app.use('/api/leagues', leaguesRouter);
app.use('/api/teams', teamsRouter);
app.use('/api/players', playersRouter);
app.use('/api/games', gamesRouter);

// Root route
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the MERN backend!' });
});

// Handle all other routes for React client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
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