const db = require('../db');

/**
 * Logs an activity to the activity_logs table.
 * 
 * @param {Object} params
 * @param {string} params.userId - UUID of the user involved (optional)
 * @param {string} params.type - Category: 'auth', 'system', 'bundle', 'order', 'user'
 * @param {string} params.level - Severity: 'success', 'info', 'warning', 'error'
 * @param {string} params.action - High-level action name (e.g., 'User Login')
 * @param {string} params.message - Detailed description of the event
 * @param {Object} params.req - Express request object to capture IP and User Agent (optional)
 */
const logActivity = async ({ userId = null, type = 'system', level = 'info', action, message, req = null }) => {
    try {
        const ip_address = req ? (req.headers['x-forwarded-for'] || req.socket.remoteAddress) : null;
        const user_agent = req ? req.headers['user-agent'] : null;

        await db.query(
            `INSERT INTO activity_logs (user_id, type, level, action, message, ip_address, user_agent)
             VALUES ($1, $2, $3, $4, $5, $6, $7)`,
            [userId, type, level, action, message, ip_address, user_agent]
        );

        console.log(`[LOG] ${type.toUpperCase()} | ${level.toUpperCase()} | ${action}: ${message}`);
    } catch (error) {
        console.error('CRITICAL: Failed to write activity log:', error);
    }
};

module.exports = { logActivity };
