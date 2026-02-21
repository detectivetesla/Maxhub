const express = require('express');
const http = require('http');
const cors = require('cors');
const path = require('path');

// Load environment variables early
require('dotenv').config({ path: path.join(__dirname, '.env') });
// Global fallback for JWT_SECRET
process.env.JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

const app = express();
const server = http.createServer(app);

// Middleware
const checkMaintenanceMode = require('./middleware/maintenance');

// CORS Configuration
const corsOptions = {
    origin: process.env.NODE_ENV === 'production'
        ? [process.env.FRONTEND_URL, 'https://maxhub.vercel.app']
        : ['http://localhost:5173', 'http://127.0.0.1:5173'],
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization']
};

app.use(cors(corsOptions));
app.use(express.json({
    verify: (req, res, buf) => {
        req.rawBody = buf;
    }
}));

// Apply maintenance check early
app.use(checkMaintenanceMode);

// Routes
const authRoutes = require('./routes/auth.routes');
const adminRoutes = require('./routes/admin.routes');
const dashboardRoutes = require('./routes/dashboard.routes');
const walletRoutes = require('./routes/wallet.routes');
const orderRoutes = require('./routes/order.routes');
const messageRoutes = require('./routes/message.routes');
const notificationRoutes = require('./routes/notification.routes');
const portal02Routes = require('./routes/portal02.routes');
const webhookRoutes = require('./routes/webhooks'); // Keep for Paystack verify legacy or refactor later

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'MaxHub Backend is running' });
});

// API Routes
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/wallet', walletRoutes);
apiRouter.use('/orders', orderRoutes);
apiRouter.use('/messages', messageRoutes);
apiRouter.use('/notifications', notificationRoutes);
apiRouter.use('/portal02', portal02Routes);
apiRouter.use('/webhooks', webhookRoutes);

// Support both /api prefix and direct access
app.use('/api', apiRouter);
app.use('/', apiRouter);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);

        // Start background services
        const { startBackgroundJobs } = require('./services/backgroundJobs');
        startBackgroundJobs();
    });
} else {
    // In production (Vercel), we might need a different strategy for background jobs
    // but we'll initialize them here for standard node environments
    const { startBackgroundJobs } = require('./services/backgroundJobs');
    startBackgroundJobs();
}

module.exports = app;
