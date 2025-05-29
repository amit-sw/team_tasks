import dotenv from 'dotenv';
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';

// Get the directory name of the current module
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
dotenv.config({ path: join(__dirname, '.env') });

// Debug log environment variables
console.log('Environment loaded, JWT_SECRET:', process.env.JWT_SECRET ? 'Set' : 'Not set');
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import authRoutes from './routes/auth.js';
import tasksRoutes from './routes/tasks.js';
import adminRoutes from './routes/admin.js';
import aiChatsRoutes from './routes/ai_chats.js';
import http from 'http';
import { initializeWebSocket } from './websocket.js';

const app = express();
const PORT = process.env.PORT || 3001;

// Enable trust proxy - required for rate limiting behind reverse proxy
app.set('trust proxy', 1);

// Check for required environment variables
if (!process.env.JWT_SECRET) {
  console.error('ERROR: JWT_SECRET environment variable is not set. Please check your .env file.');
  console.error('Setting a temporary JWT_SECRET for development only');
  process.env.JWT_SECRET = 'temporary-dev-secret-do-not-use-in-production';
}

// Security middleware
app.use(helmet());
//app.use(cors({
//  origin: 'http://localhost:3000',
//  credentials: true,
//  allowedHeaders: ['Content-Type', 'Authorization'],
//  exposedHeaders: ['X-New-Token']
//}));
app.use(cors({
  origin: ['http://localhost:3000', 'https://team-tasks-client.onrender.com'],
  credentials: true,
  allowedHeaders: ['Content-Type', 'Authorization'],
  exposedHeaders: ['X-New-Token']
}));
app.use(express.json());

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100 // limit each IP to 100 requests per windowMs
});
app.use(limiter);

// Routes
app.use('/api/auth', authRoutes);
// Debug: log headers and token for all /api/tasks requests
app.use('/api/tasks', (req, res, next) => {
  console.log('--- Incoming /api/tasks request ---');
  console.log('Headers:', req.headers);
  const authHeader = req.headers['authorization'];
  if (authHeader) {
    const token = authHeader.split(' ')[1];
    console.log('Extracted token:', token);
  } else {
    console.log('No Authorization header received');
  }
  next();
}, tasksRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/ai-chats', aiChatsRoutes);

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Health check endpoint
app.get('/health', (req, res) => {
  res.status(200).json({ status: 'OK' });
});

const server = http.createServer(app);

// Initialize WebSocket server
initializeWebSocket(server);

server.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
