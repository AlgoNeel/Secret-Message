const express = require('express');
const axios = require('axios');
const cors = require('cors');
const session = require('express-session'); // নতুন যোগ করা হয়েছে
const app = express();

const allowedOrigins = [
    'https://swapneel.bro.bd',
    'https://www.swapneel.bro.bd'
];

// CORS কনফিগারেশন (Credentials সহ)
app.use(cors({
    origin: function (origin, callback) {
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('CORS Policy: Access Denied!'));
        }
    },
    credentials: true // সেশন কুকি আদান-প্রদানের জন্য এটি প্রয়োজন
}));

app.use(express.json());

// সেশন কনফিগারেশন
app.use(session({
    secret: 'secret-key-for-swapneel', // এটি পরিবর্তন করতে পারেন
    resave: false,
    saveUninitialized: true,
    cookie: { 
        secure: true, // HTTPS হলে true থাকবে
        sameSite: 'none',
        maxAge: 300000 // ৫ মিনিট পর ক্যাপচা এক্সপায়ার হবে
    }
}));

// সিকিউরিটি লেয়ার (অরিজিন এবং রেফারার চেক)
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const referer = req.headers.referer;
    const isAllowedOrigin = allowedOrigins.includes(origin);
    const isAllowedReferer = referer && referer.startsWith('https://swapneel.bro.bd');

    if (!isAllowedOrigin && !isAllowedReferer) {
        return res.status(403).json({ error: "Unauthorized access." });
    }
    next();
});

// ১. নতুন ক্যাপচা জেনারেট করার এন্ডপয়েন্ট
app.get('/get-captcha', (req, res) => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    
    // উত্তরটি সার্ভার সেশনে সেভ করে রাখা হচ্ছে
    req.session.captchaResult = num1 + num2;
    
    res.json({ question: `What is ${num1} + ${num2}?` });
});

const GOOGLE_SCRIPT_URL = process.env.SCRIPT_URL;

// ২. মেসেজ পাঠানোর সময় ক্যাপচা যাচাই
app.post('/send-message', async (req, res) => {
    try {
        const { message, captchaAnswer } = req.body;
        const serverCorrectAnswer = req.session.captchaResult;

        // ক্যাপচা চেক
        if (serverCorrectAnswer === undefined || parseInt(captchaAnswer) !== serverCorrectAnswer) {
            return res.status(400).json({ error: "Wrong Captcha! Please try again." });
        }

        // ক্যাপচা সঠিক হলে গুগল স্ক্রিপ্টে পাঠানো
        await axios.post(GOOGLE_SCRIPT_URL, { message: message });
        
        // একবার সফল হলে সেশন ক্লিয়ার করে দেওয়া (সিকিউরিটি)
        req.session.captchaResult = null;
        
        res.status(200).send("Success");
    } catch (error) {
        console.error(error);
        res.status(500).send("Server Error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Secure Captcha Server Active`));
