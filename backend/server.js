const express = require('express');
const http = require('http');
const { Server } = require('socket.io');
const cors = require('cors');
require('dotenv').config();

const app = express();
const server = http.createServer(app);
const io = new Server(server, {
    cors: {
        origin: process.env.FRONTEND_URL || '*',
        methods: ['GET', 'POST']
    }
});

app.use(cors());
app.use(express.json());

// Routes
const adminRoutes = require('./routes/admin');
const dashboardRoutes = require('./routes/dashboard');
app.use('/webhooks', webhookRoutes);
app.use('/auth', authRoutes);
app.use('/admin', adminRoutes);
app.use('/dashboard', dashboardRoutes);

app.get('/health', (req, res) => {
    res.json({ status: 'ok', message: 'DataSwap Backend is running' });
});

// Socket.IO Connection
io.on('connection', (socket) => {
    console.log('User connected:', socket.id);

    socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
    });
});

const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
    console.log(`Server running on port ${PORT}`);
});
