const express = require('express');
const http = require('http');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);

app.use(cors());
app.use(express.json());

// Routes
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');
app.use('/webhooks', webhookRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/dashboard', dashboardRoutes);

// Health Check
app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'DataSwap Backend is running' });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
