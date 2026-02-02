const path = require('path');
const dotenv = require('dotenv');

console.log('--- Environment Test ---');
console.log('Current directory:', __dirname);
const envPath = path.join(__dirname, '.env');
console.log('Target .env path:', envPath);

const result = dotenv.config({ path: envPath });

if (result.error) {
    console.error('Error loading .env:', result.error.message);
} else {
    console.log('.env loaded successfully');
    console.log('JWT_SECRET:', process.env.JWT_SECRET ? 'Exists (starts with ' + process.env.JWT_SECRET.substring(0, 5) + '...)' : 'MISSING');
    console.log('PAYSTACK_SECRET_KEY:', process.env.PAYSTACK_SECRET_KEY ? 'Exists' : 'MISSING');
}
