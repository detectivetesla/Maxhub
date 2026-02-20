const db = require('../db');

const jwt = require('jsonwebtoken');

const checkMaintenanceMode = async (req, res, next) => {
    try {
        // Normalize path to handle /api prefix
        const path = req.path.replace(/^\/api/, '');

        // ALWAYS allow authentication routes and admin login attempts
        // We check for 'login' in the path to catch dynamic admin login paths (e.g., /Emm@1207/login)
        if (path.startsWith('/auth') || path.startsWith('/admin') || path.includes('/login')) {
            return next();
        }

        const result = await db.query('SELECT value FROM settings WHERE key = $1', ['maintenance_mode']);

        if (result.rows.length > 0 && result.rows[0].value === 'true') {
            // Check if user is admin via token
            const authHeader = req.headers.authorization;
            if (authHeader) {
                const token = authHeader.split(' ')[1];
                if (token) {
                    try {
                        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'your_super_secret_jwt_key');
                        if (decoded.role === 'admin') {
                            return next();
                        }
                    } catch (err) {
                        // Token invalid/expired, treat as normal user
                    }
                }
            }

            return res.status(503).json({
                message: 'System is currently under maintenance. Please try again later.',
                maintenance: true
            });
        }

        next();
    } catch (error) {
        console.error('Maintenance Check Error:', error);
        next(); // Proceed on error to avoid blocking completely if DB fails
    }
};

module.exports = checkMaintenanceMode;
