import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/db.js';

import authRoutes from './routes/authRoutes.js';
import dailyItemRoutes from './routes/dailyItemRoutes.js';
import spendingRoutes from './routes/spendingRoutes.js';
import todayBillRoutes from './routes/todayBillRoutes.js';
import billRoutes from './routes/billRoutes.js';
import dashboardRoutes from './routes/dashboardRoutes.js';
import noteRoutes from './routes/noteRoutes.js';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT || 5001;

// Connect Database
connectDB();

// Middleware
app.use(cors({
  origin: '*', // Allow requests from any frontend port/origin
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
}));

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Serve uploaded images statically
app.use('/uploads', express.static(path.join(__dirname, 'uploads')));

// API Routes
app.use('/api', authRoutes);
app.use('/api/daily-items', dailyItemRoutes);
app.use('/api/spending', spendingRoutes);
app.use('/api/today-bill', todayBillRoutes);
app.use('/api/bills', billRoutes);
app.use('/api/dashboard', dashboardRoutes);
app.use('/api/notes', noteRoutes);

// Health check
app.get('/api/health', (req, res) => {
  res.json({
    status: 'online',
    system: 'Maaza Cafe Management API',
    timestamp: new Date().toISOString(),
  });
});

// 404 handler for unhandled api endpoints
app.use('/api/*', (req, res) => {
  res.status(404).json({
    success: false,
    message: `API endpoint not found: ${req.originalUrl}`,
  });
});

// Global error handler
app.use((err, req, res, next) => {
  console.error('Server error:', err);
  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal Server Error',
  });
});

app.listen(PORT, () => {
  console.log(`☕ Maaza Cafe Server running on http://localhost:${PORT}`);
  console.log(`📁 Uploads available at http://localhost:${PORT}/uploads`);
});
