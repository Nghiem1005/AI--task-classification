// Main Express application file
const express = require('express');
const app = express();

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Routes
// app.use('/api', require('./routes'));
const bowRoutes = require('./routes/bowRoutes');
// const aiRoutes = require('./routes/aiRoutes');
app.use('/api/bow', bowRoutes);
// app.use('/api/ai', aiRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: 'Internal Server Error' });
});

module.exports = app;
