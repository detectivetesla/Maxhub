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

app.use(cors());
app.use(express.json());

// Routes
const authRoutes = require('./routes/auth');
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');
const webhookRoutes = require('./routes/webhooks');

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'DataSwap Backend is running' });
});

// API Routes
const apiRouter = express.Router();
apiRouter.use('/auth', authRoutes);
apiRouter.use('/admin', adminRoutes);
apiRouter.use('/dashboard', dashboardRoutes);
apiRouter.use('/webhooks', webhookRoutes);

// Support both /api prefix and direct access
app.use('/api', apiRouter);
app.use('/', apiRouter);

const PORT = process.env.PORT || 5000;
if (process.env.NODE_ENV !== 'production') {
    server.listen(PORT, () => {
        console.log(`Server running on port ${PORT}`);
    });
}

module.exports = app;
