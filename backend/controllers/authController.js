const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const { logActivity } = require('../services/logger');
const notificationService = require('../services/notificationService');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

const authController = {
    // Get current user info
    getMe: async (req, res) => {
        try {
            const result = await db.query(
                'SELECT id, email, full_name, wallet_balance, role, is_blocked, created_at FROM users WHERE id = $1',
                [req.user.id]
            );
            const user = result.rows[0];
            if (!user) return res.status(404).json({ message: 'User not found' });

            res.json({ user: { ...user, fullName: user.full_name, walletBalance: Number(user.wallet_balance) } });
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch user', error: error.message });
        }
    },

    // Register new user
    register: async (req, res) => {
        try {
            const { email, password, fullName, phoneNumber } = req.body;

            const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
            if (!email || !emailRegex.test(email)) {
                return res.status(400).json({ message: 'Please provide a valid email address' });
            }

            const userExists = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            if (userExists.rows.length > 0) {
                return res.status(400).json({ message: 'User already exists' });
            }

            const hashedPassword = await bcrypt.hash(password, 10);
            const result = await db.query(
                'INSERT INTO users (email, password_hash, full_name, phone_number) VALUES ($1, $2, $3, $4) RETURNING id, email, full_name, role',
                [email, hashedPassword, fullName, phoneNumber]
            );

            res.status(201).json({
                message: 'User registered successfully',
                user: result.rows[0]
            });

            logActivity({
                userId: result.rows[0].id,
                type: 'auth',
                level: 'success',
                action: 'User Registration',
                message: `New user registered: ${email}`,
                req
            });

            await notificationService.createMessage({
                userId: result.rows[0].id,
                title: 'Welcome to MaxHub!',
                content: 'We are thrilled to have you here. You can now start buying data at the best rates in Ghana.',
                sender: 'System Admin'
            });

            await notificationService.createNotification({
                userId: result.rows[0].id,
                title: 'Account Created',
                message: 'Your account has been successfully created. Welcome aboard!',
                type: 'success'
            });
        } catch (error) {
            res.status(500).json({ message: 'Registration failed', error: error.message });
        }
    },

    // Login user
    login: async (req, res) => {
        try {
            const { email, password } = req.body;
            const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            const user = result.rows[0];

            if (!user || !(await bcrypt.compare(password, user.password_hash))) {
                logActivity({
                    userId: user ? user.id : null,
                    type: 'auth',
                    level: 'error',
                    action: 'Failed Login Attempt',
                    message: `Invalid credentials for: ${email}`,
                    req
                });
                return res.status(401).json({ message: 'Invalid email or password' });
            }

            const token = jwt.sign(
                { id: user.id, email: user.email, role: user.role },
                JWT_SECRET,
                { expiresIn: '24h' }
            );

            res.json({
                token,
                user: {
                    id: user.id,
                    email: user.email,
                    fullName: user.full_name,
                    walletBalance: user.wallet_balance,
                    role: user.role
                }
            });

            logActivity({
                userId: user.id,
                type: 'auth',
                level: 'success',
                action: 'User Login',
                message: `User logged in: ${email}`,
                req
            });
        } catch (error) {
            res.status(500).json({ message: 'Login failed', error: error.message });
        }
    }
};

module.exports = authController;
