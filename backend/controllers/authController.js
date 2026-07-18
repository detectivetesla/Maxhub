const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const axios = require('axios');
const db = require('../db');
const { logActivity } = require('../services/logger');
const notificationService = require('../services/notificationService');

const JWT_SECRET = process.env.JWT_SECRET || 'your_super_secret_jwt_key';

const authController = {
    // Get public system config
    getPublicConfig: async (req, res) => {
        try {
            const settingsResult = await db.query(
                "SELECT key, value FROM settings WHERE key IN ('public_registration', 'maintenance_mode')"
            );
            const config = settingsResult.rows.reduce((acc, row) => {
                acc[row.key] = row.value === 'true';
                return acc;
            }, {});
            res.json(config);
        } catch (error) {
            res.status(500).json({ message: 'Failed to fetch config' });
        }
    },

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

            // Check if public registration is enabled
            const settingsResult = await db.query("SELECT value FROM settings WHERE key = 'public_registration'");
            if (settingsResult.rows.length > 0 && settingsResult.rows[0].value === 'false') {
                return res.status(403).json({ message: 'Public registration is currently disabled.' });
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
    },

    // Google OAuth login/signup controller
    googleLogin: async (req, res) => {
        try {
            const { accessToken } = req.body;

            if (!accessToken) {
                return res.status(400).json({ message: 'Access token is required' });
            }

            // Verify access token with Supabase Auth API
            const supabaseUrl = process.env.SUPABASE_URL || process.env.VITE_SUPABASE_URL || 'https://jcqihbdwzgwzmgqpqlcc.supabase.co';
            const supabaseAnonKey = process.env.SUPABASE_ANON_KEY || process.env.VITE_SUPABASE_ANON_KEY;

            if (!supabaseAnonKey) {
                console.error('Supabase Anon Key is missing in backend env');
            }

            // Fetch the user information from Supabase auth endpoint
            const response = await axios.get(`${supabaseUrl}/auth/v1/user`, {
                headers: {
                    'Authorization': `Bearer ${accessToken}`,
                    'apikey': supabaseAnonKey
                }
            });

            const supabaseUser = response.data;
            if (!supabaseUser || !supabaseUser.email) {
                return res.status(401).json({ message: 'Invalid or expired Google session' });
            }

            const email = supabaseUser.email;
            // Get full name from user metadata
            const fullName = supabaseUser.user_metadata?.full_name || supabaseUser.user_metadata?.name || email.split('@')[0];
            const avatarUrl = supabaseUser.user_metadata?.avatar_url || '';

            // Check if user exists in public.users table
            let userResult = await db.query('SELECT * FROM users WHERE email = $1', [email]);
            let user = userResult.rows[0];

            if (!user) {
                // Check if public registration is enabled
                const settingsResult = await db.query("SELECT value FROM settings WHERE key = 'public_registration'");
                if (settingsResult.rows.length > 0 && settingsResult.rows[0].value === 'false') {
                    return res.status(403).json({ message: 'Public registration is currently disabled.' });
                }

                // If user doesn't exist, create a new record
                const placeholderPassword = 'google_auth_placeholder_' + Math.random().toString(36).substring(2);
                const hashedPassword = await bcrypt.hash(placeholderPassword, 10);
                
                const insertResult = await db.query(
                    'INSERT INTO users (email, password_hash, full_name) VALUES ($1, $2, $3) RETURNING id, email, full_name, role, wallet_balance, phone_number',
                    [email, hashedPassword, fullName]
                );
                user = insertResult.rows[0];

                // Create profile with avatar
                await db.query(
                    'INSERT INTO profiles (id, avatar_url, is_verified, last_login) VALUES ($1, $2, $3, NOW()) ON CONFLICT (id) DO UPDATE SET last_login = NOW(), avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url)',
                    [user.id, avatarUrl, true]
                );

                logActivity({
                    userId: user.id,
                    type: 'auth',
                    level: 'success',
                    action: 'User Google Registration',
                    message: `New user registered via Google: ${email}`,
                    req
                });

                await notificationService.createMessage({
                    userId: user.id,
                    title: 'Welcome to MaxHub!',
                    content: 'We are thrilled to have you here. You can now start buying data at the best rates in Ghana.',
                    sender: 'System Admin'
                });

                await notificationService.createNotification({
                    userId: user.id,
                    title: 'Account Created',
                    message: 'Your account has been successfully created via Google. Welcome aboard!',
                    type: 'success'
                });
            } else {
                // If user is blocked, deny login
                if (user.is_blocked) {
                    return res.status(403).json({ message: 'Your account has been blocked. Please contact support.' });
                }

                // Update profiles last_login
                await db.query(
                    'INSERT INTO profiles (id, avatar_url, last_login) VALUES ($1, $2, NOW()) ON CONFLICT (id) DO UPDATE SET last_login = NOW(), avatar_url = COALESCE(profiles.avatar_url, EXCLUDED.avatar_url)',
                    [user.id, avatarUrl]
                );

                logActivity({
                    userId: user.id,
                    type: 'auth',
                    level: 'success',
                    action: 'User Google Login',
                    message: `User logged in via Google: ${email}`,
                    req
                });
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
                    walletBalance: Number(user.wallet_balance),
                    role: user.role,
                    phoneNumber: user.phone_number
                }
            });
        } catch (error) {
            console.error('Google login error:', error);
            res.status(500).json({ message: 'Google login failed', error: error.message });
        }
    }
};

module.exports = authController;
