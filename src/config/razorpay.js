const Razorpay = require('razorpay');
require('dotenv').config();

const key_id = process.env.RAZORPAY_KEY_ID;
const key_secret = process.env.RAZORPAY_KEY_SECRET;

if (!key_id || !key_secret) {
    console.warn("⚠️  Razorpay credentials missing in .env. Payment module will not work.");
    console.warn("Please add RAZORPAY_KEY_ID and RAZORPAY_KEY_SECRET to your .env file.");
}

const razorpayInstance = (key_id && key_secret) ? new Razorpay({
    key_id: key_id,
    key_secret: key_secret,
}) : null;

module.exports = razorpayInstance;
