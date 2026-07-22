require('dotenv').config();
require('express-async-errors');
const express = require('express');
const cors = require('cors');
const path = require('path');

const authRoutes = require('./routes/auth.routes');
const userRoutes = require('./routes/user.routes');

const app = express();

app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps or curl requests)
    if (!origin) return callback(null, true);
    callback(null, true); // Echo the origin
  },
  credentials: true
}));
app.use(express.json());

// Serve static frontend
app.use(express.static(path.join(__dirname, '../../frontend'), { extensions: ['html'] }));
// Serve uploaded avatars — backend/public/uploads is where multer saves them
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));
// Also serve frontend uploads if any exist there
app.use('/uploads', express.static(path.join(__dirname, '../../frontend/uploads')));

const foodRoutes = require('./routes/food.routes');
const exerciseRoutes = require('./routes/exercise.routes');
const progressRoutes = require('./routes/progress.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const waterRoutes = require('./routes/water.routes');

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/users', userRoutes);
app.use('/users', userRoutes); // keep for backwards compatibility if needed
app.use('/api/foods', foodRoutes);
app.use('/api/exercises', exerciseRoutes);
app.use('/api/progress', progressRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/water', waterRoutes);

// Error Handling Middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).json({ error: true, message: 'Internal Server Error', statusCode: 500 });
});

module.exports = app;
