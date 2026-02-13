const express = require('express');
const axios = require('axios');
const cors = require('cors');
const crypto = require('crypto'); // এটি Node.js এ ডিফল্ট থাকে
const app = express();

const SECRET_KEY = "swapneel_super_secret_key_2026"; // এটি আপনার সিক্রেট

const allowedOrigins = [
    'https://swapneel.bro.bd',
    'https://www.swapneel.bro.bd'
];

app.use(cors({
    origin: function (origin, callback) {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('CORS Policy: Access Denied!'));
        }
    }
}));

app.use(express.json());

// ১. নতুন ক্যাপচা জেনারেট করার এন্ডপয়েন্ট
app.get('/get-captcha', (req, res) => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    const sum = num1 + num2;

    // উত্তরটিকে এনক্রিপ্ট করে একটি টোকেন তৈরি করা হচ্ছে
    const token = crypto.createHmac('sha256', SECRET_KEY)
                        .update(sum.toString())
                        .digest('hex');

    res.json({ 
        question: `Solve: ${num1} + ${num2} = ?`,
        token: token // এই টোকেনটি ফ্রন্টএন্ডে সেভ থাকবে
    });
});

const GOOGLE_SCRIPT_URL = process.env.SCRIPT_URL;

// ২. মেসেজ পাঠানোর সময় ক্যাপচা যাচাই
app.post('/send-message', async (req, res) => {
    try {
        const { message, captchaAnswer, token } = req.body;

        if (!captchaAnswer || !token) {
            return res.status(400).json({ error: "Missing data!" });
        }

        // ফ্রন্টএন্ড থেকে আসা উত্তরটি দিয়ে পুনরায় টোকেন তৈরি করে দেখা
        const expectedToken = crypto.createHmac('sha256', SECRET_KEY)
                                    .update(captchaAnswer.toString())
                                    .digest('hex');

        if (token !== expectedToken) {
            return res.status(400).json({ error: "ভুল উত্তর! আবার চেষ্টা করুন।" });
        }

        // উত্তর সঠিক হলে গুগল স্ক্রিপ্টে পাঠানো
        await axios.post(GOOGLE_SCRIPT_URL, { message: message });
        res.status(200).json({ status: "Success" });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ error: "Server Error" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Stateless Secure Server Active`));
