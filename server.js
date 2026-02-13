const express = require('express');
const axios = require('axios');
const cors = require('cors');
const session = require('express-session');
const app = express();

// শুধুমাত্র আপনার ডোমেইন লিস্ট
const allowedOrigins = [
    'https://swapneel.bro.bd',
    'https://www.swapneel.bro.bd'
];

// Render বা প্রক্সি সার্ভারের মাধ্যমে সেশন কুকি পাঠানোর জন্য এটি প্রয়োজন
app.set('trust proxy', 1);

// CORS কনফিগারেশন
app.use(cors({
    origin: function (origin, callback) {
        // রিকোয়েস্ট যদি এলাউড লিস্টে থাকে অথবা অরিজিন না থাকে (সার্ভার টু সার্ভার)
        if (allowedOrigins.includes(origin) || !origin) {
            callback(null, true);
        } else {
            callback(new Error('CORS Policy: Access Denied!'));
        }
    },
    credentials: true // সেশন কুকি আদান-প্রদানের জন্য এটি বাধ্যতামূলক
}));

app.use(express.json());

// সেশন কনফিগারেশন (ক্রস-ডোমেইন সাপোর্ট সহ)
app.use(session({
    secret: 'secure_key_for_swapneel_2026', // আপনার পছন্দমতো পরিবর্তন করতে পারেন
    resave: false,
    saveUninitialized: false,
    cookie: { 
        secure: true,      // HTTPS এ ব্যবহারের জন্য (Render-এ এটি কাজ করবে)
        sameSite: 'none',  // ফ্রন্টএন্ড এবং ব্যাকএন্ড আলাদা ডোমেইন হলে এটি লাগবেই
        maxAge: 300000     // ৫ মিনিট স্থায়িত্ব
    }
}));

// সিকিউরিটি লেয়ার: অরিজিন এবং রেফারার চেক
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const referer = req.headers.referer;

    const isAllowedOrigin = allowedOrigins.includes(origin);
    const isAllowedReferer = referer && referer.startsWith('https://swapneel.bro.bd');

    // লোকাল টেস্টের জন্য এই চেক সাময়িকভাবে বন্ধ রাখা যায়, কিন্তু প্রোডাকশনে এটি থাকা ভালো
    if (!origin && !isAllowedReferer) {
        return res.status(403).json({ error: "Access Denied." });
    }
    next();
});

// ১. নতুন ম্যাথ ক্যাপচা জেনারেট করার এন্ডপয়েন্ট
app.get('/get-captcha', (req, res) => {
    const num1 = Math.floor(Math.random() * 10) + 1;
    const num2 = Math.floor(Math.random() * 10) + 1;
    
    // উত্তরটি সার্ভার সেশনে সেভ করা হচ্ছে
    req.session.captchaResult = num1 + num2;
    
    // সেশন সেভ হয়েছে কি না নিশ্চিত হয়ে রেসপন্স পাঠানো
    req.session.save((err) => {
        if (err) {
            return res.status(500).json({ error: "Session Error" });
        }
        res.json({ question: `Solve: ${num1} + ${num2} = ?` });
    });
});

const GOOGLE_SCRIPT_URL = process.env.SCRIPT_URL;

// ২. মেসেজ পাঠানোর সময় ক্যাপচা যাচাই
app.post('/send-message', async (req, res) => {
    try {
        const { message, captchaAnswer } = req.body;
        const serverCorrectAnswer = req.session.captchaResult;

        // ক্যাপচা চেক (সেশন থেকে উত্তর নিয়ে তুলনা)
        if (serverCorrectAnswer === undefined || parseInt(captchaAnswer) !== serverCorrectAnswer) {
            return res.status(400).json({ error: "ভুল উত্তর! আবার চেষ্টা করুন।" });
        }

        // গুগল স্ক্রিপ্টে ডাটা পাঠানো
        await axios.post(GOOGLE_SCRIPT_URL, { message: message });
        
        // একবার সফল হলে সেশন ক্লিয়ার করে দেওয়া
        req.session.captchaResult = null;
        
        res.status(200).json({ status: "Success" });
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).json({ error: "সার্ভারে সমস্যা হচ্ছে।" });
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Secure Server Active on Port ${PORT}`));
