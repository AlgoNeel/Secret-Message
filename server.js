const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// শুধুমাত্র আপনার ডোমেইন লিস্ট
const allowedOrigins = [
    'https://swapneel.bro.bd',
    'https://www.swapneel.bro.bd'
];

// CORS কনফিগারেশন
app.use(cors({
    origin: function (origin, callback) {
        // এখানে আমরা খুব কঠোর: যদি অরিজিন লিস্টে না থাকে, তবে সোজা ব্লক
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            // যদি কেউ ডাউনলোড করে চালায়, তার অরিজিন হবে null বা অন্য কিছু, যা এখানে ব্লক হবে
            callback(new Error('CORS Policy: Access Denied!'));
        }
    }
}));

app.use(express.json());

// সব ধরণের রিকোয়েস্টের জন্য এক্সট্রা সিকিউরিটি লেয়ার
app.use((req, res, next) => {
    const origin = req.headers.origin;
    const referer = req.headers.referer;

    // যদি অরিজিন বা রেফারার আপনার ডোমেইন না হয়, তবে সার্ভার সাড়া দেবে না
    const isAllowedOrigin = allowedOrigins.includes(origin);
    const isAllowedReferer = referer && referer.startsWith('https://swapneel.bro.bd');

    if (!isAllowedOrigin && !isAllowedReferer) {
        console.log("প্রবেশাধিকার নিষিদ্ধ! উৎস:", origin || "Unknown");
        return res.status(403).json({ error: "Unauthorized access. This API only works on swapneel.bro.bd" });
    }
    next();
});

const GOOGLE_SCRIPT_URL = process.env.SCRIPT_URL;

app.post('/send-message', async (req, res) => {
    try {
        const { message } = req.body;
        
        // গুগল স্ক্রিপ্টে ডাটা পাঠানো
        await axios.post(GOOGLE_SCRIPT_URL, { message: message });
        res.status(200).send("Success");
    } catch (error) {
        res.status(500).send("Server Error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Secure Server Active`));
