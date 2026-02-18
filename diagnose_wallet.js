const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function diagnose() {
    try {
        const client = await pool.connect();

        console.log('--- Recent Transactions ---');
        const transactions = await client.query('SELECT id, user_id, amount, status, reference, created_at FROM transactions ORDER BY created_at DESC LIMIT 10');
        console.table(transactions.rows);

        console.log('\n--- Recent Activity Logs (Webhooks/Errors) ---');
        const logs = await client.query("SELECT * FROM activity_logs WHERE action LIKE '%webhook%' OR action LIKE '%error%' ORDER BY created_at DESC LIMIT 10");
        console.table(logs.rows);

        client.release();
    } catch (err) {
        console.error('Error:', err.message);
    } finally {
        await pool.end();
    }
}

diagnose();
