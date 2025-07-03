const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const cookieParser = require('cookie-parser');

const path = require('path'); // Add this for serving static files
require('dotenv').config({ path: '.env.local' }); // Specify .env.local explicitly

const app = express();
app.use(cors());
app.use(express.json());
app.use(cookieParser());

// Serve static files from the Vite build output
app.use(express.static(path.join(__dirname, '../client/dist')));

// API route
app.get('/api', (req, res) => {
  res.json({ message: 'Hello from the MERN backend!' });
});

// Handle all other routes for React client-side routing
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/dist', 'index.html'));
});

// MongoDB connection
const PORT = process.env.PORT || 5000;
const MONGODB_URI = process.env.MONGODB_URI;

mongoose.connect(MONGODB_URI)
  .then(() => console.log('Connected to MongoDB'))
  .catch(err => console.error('MongoDB connection error:', err));

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});