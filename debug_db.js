const { Pool } = require('pg');
const path = require('path');
require('dotenv').config({ path: path.join(__dirname, 'backend/.env') });

const pool = new Pool({
    connectionString: process.env.DATABASE_URL,
    ssl: {
        rejectUnauthorized: false
    }
});

async function checkDatabase() {
    try {
        console.log('Connecting to database...');
        const client = await pool.connect();
        console.log('Connected successfully!');

        console.log('Checking for tables...');
        const tablesResult = await client.query(`
            SELECT table_name 
            FROM information_schema.tables 
            WHERE table_schema = 'public'
        `);
        console.log('Tables found:', tablesResult.rows.map(r => r.table_name).join(', '));

        if (tablesResult.rows.some(r => r.table_name === 'messages')) {
            console.log('Checking "messages" table structure...');
            const columnsResult = await client.query(`
                SELECT column_name, data_type 
                FROM information_schema.columns 
                WHERE table_name = 'messages'
            `);
            console.log('Columns in "messages":', columnsResult.rows.map(r => `${r.column_name} (${r.data_type})`).join(', '));
        } else {
            console.warn('Table "messages" NOT FOUND!');
        }

        client.release();
    } catch (err) {
        console.error('Database connection error:', err.message);
    } finally {
        await pool.end();
    }
}

checkDatabase();
