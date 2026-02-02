const express = require('express');
const router = express.Router();
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../db');
const authMiddleware = require('../middleware/auth');

// Ensure JWT_SECRET is available
const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

router.get('/me', authMiddleware, async (req, res) => {
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
});

router.post('/register', async (req, res) => {
    try {
        const { email, password, fullName, phoneNumber } = req.body;

        // Basic email validation
        const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
        if (!email || !emailRegex.test(email)) {
            return res.status(400).json({ message: 'Please provide a valid email address' });
        }

        // Check if user exists
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
    } catch (error) {
        res.status(500).json({ message: 'Registration failed', error: error.message });
    }
});

router.post('/login', async (req, res) => {
    try {
        const { email, password } = req.body;
        const result = await db.query('SELECT * FROM users WHERE email = $1', [email]);
        const user = result.rows[0];

        if (!user || !(await bcrypt.compare(password, user.password_hash))) {
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
    } catch (error) {
        res.status(500).json({ message: 'Login failed', error: error.message });
    }
});

module.exports = router;
