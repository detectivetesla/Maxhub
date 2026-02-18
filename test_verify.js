const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

const reference = 'szx857fhjw'; // The latest transaction reference

async function testVerify() {
    try {
        const client = await pool.connect();
        console.log(`Testing verification for ref: ${reference}`);

        const txResult = await client.query('SELECT * FROM transactions WHERE reference = $1', [reference]);
        if (txResult.rows.length === 0) {
            console.error('Transaction not found');
            return;
        }

        const transaction = txResult.rows[0];
        console.log('Transaction state in DB:', transaction);

        // Simulate the logic in dashboard.js
        console.log('Step 1: Updating balance...');
        await client.query('BEGIN');

        const updateResult = await client.query(
            'UPDATE users SET wallet_balance = wallet_balance + $1 WHERE id = $2 RETURNING wallet_balance',
            [transaction.amount, transaction.user_id]
        );

        console.log('Update result:', updateResult.rows);

        await client.query(
            'UPDATE transactions SET status = $1 WHERE reference = $2',
            ['success', reference]
        );

        await client.query('COMMIT');
        console.log('Committed successfully.');

        client.release();
    } catch (err) {
        console.error('Error during testVerify:', err);
    } finally {
        await pool.end();
    }
}

testVerify();
