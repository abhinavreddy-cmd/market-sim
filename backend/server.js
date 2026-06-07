import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { connectDB } from './config/database.js';
import { User } from './models/index.js';
import authRoutes from './routes/auth.js';
import adminRoutes from './routes/admin.js';
import studentRoutes from './routes/student.js';

dotenv.config();

const app = express();

// Get __dirname equivalent in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Middleware
app.use(cors());
app.use(express.json());

// Connect to database and seed admin
async function initialize() {
  await connectDB();
  await seedAdmin();
}

async function seedAdmin() {
  try {
    const adminUsername = process.env.ADMIN_USERNAME;
    const adminPassword = process.env.ADMIN_PASSWORD;

    if (!adminUsername || !adminPassword) {
      console.log('⚠️  ADMIN_USERNAME or ADMIN_PASSWORD not set in env. Skipping admin seed.');
      return;
    }

    const existingAdmin = await User.findOne({ username: adminUsername, role: 'ADMIN' });
    if (existingAdmin) {
      console.log('✅ Admin account already exists.');
      return;
    }

    await User.create({
      username: adminUsername,
      password: adminPassword,
      team_id: 'ADMIN',
      game_id: 'ADMIN',
      role: 'ADMIN',
    });

    console.log(`✅ Admin account seeded: ${adminUsername}`);
  } catch (error) {
    console.error('❌ Failed to seed admin:', error.message);
  }
}

initialize();

// ============================================
// 1. HEALTH CHECK (FIRST)
app.get('/health', (req, res) => {
  res.json({ 
    status: 'OK', 
    message: 'Server is running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'development'
  });
});

// ============================================
// 2. API ROUTES (SECOND)
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/student', studentRoutes);

// ============================================
// 3. PRODUCTION STATIC FILES (THIRD) - FIXED ✅
if (process.env.NODE_ENV === 'production') {
  console.log('🎨 Serving static files from:', path.join(__dirname, 'public'));
  
  // Serve Vite assets FIRST (CRITICAL)
  app.use('/assets', express.static(path.join(__dirname, 'public/assets')));
  
  // Serve all static files SECOND
  app.use(express.static(path.join(__dirname, 'public')));
  
  console.log('✅ Static middleware order: assets → public → SPA fallback');
  
  // SPA fallback LAST (ONLY non-API routes)
  app.get('*', (req, res) => {
    // Don't serve index.html for API routes
    if (req.originalUrl.startsWith('/api')) {
      return res.status(404).json({ error: 'API route not found' });
    }
    res.sendFile(path.join(__dirname, 'public/index.html'));
  });
} else {
  // Development mode - API only
  app.get('/', (req, res) => {
    res.json({ 
      message: 'API Server Running',
      endpoints: {
        health: '/health',
        auth: '/api/auth',
        admin: '/api/admin',
        student: '/api/student'
      }
    });
  });
}

// ============================================
// 4. ERROR HANDLERS (LAST)
app.use((err, req, res, next) => {
  console.error('Error:', err.stack);
  res.status(err.status || 500).json({ 
    success: false, 
    message: err.message || 'Something went wrong!',
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
});

// 404 for unmatched API routes (AFTER all routes)
app.use('/api/*', (req, res) => {
  res.status(404).json({ 
    success: false, 
    message: 'API endpoint not found' 
  });
});

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`🚀 Server running on port ${PORT}`);
  console.log(`📦 Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`🔗 Health check: http://localhost:${PORT}/health`);
  if (process.env.NODE_ENV === 'production') {
    console.log(`🌐 Frontend served at: http://localhost:${PORT}`);
  }
});

// Graceful shutdown
process.on('SIGTERM', () => {
  console.log('SIGTERM signal received: closing HTTP server');
  process.exit(0);
});

process.on('SIGINT', () => {
  console.log('SIGINT signal received: closing HTTP server');
  process.exit(0);
});
