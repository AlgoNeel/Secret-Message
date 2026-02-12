const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// শুধুমাত্র আপনার ডোমেইন লিস্ট
const allowedOrigins = [
    'https://swapneel.bro.bd',
    'https://www.swapneel.bro.bd'
];

const corsOptions = {
    origin: function (origin, callback) {
        // যদি origin আমাদের লিস্টে থাকে, তবেই অনুমতি দাও
        if (allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            // অন্য সব ক্ষেত্রে ব্লক করো
            callback(new Error('CORS Policy: Access Denied!'));
        }
    },
    methods: "POST", // শুধুমাত্র POST রিকোয়েস্ট এলাউড
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// সিকিউরিটি লেয়ার: Referer চেক করা
app.use((req, res, next) => {
    const referer = req.headers.referer;
    // যদি রিকোয়েস্ট আপনার ডোমেইন থেকে না আসে, তবে সরাসরি রিজেক্ট করো
    if (!referer || !referer.startsWith('https://swapneel.bro.bd')) {
        return res.status(403).send("Unauthorized Access: Your domain is not allowed.");
    }
    next();
});

const GOOGLE_SCRIPT_URL = process.env.SCRIPT_URL;

app.post('/send-message', async (req, res) => {
    try {
        const { message } = req.body;
        if (!message || message.length > 500) { // মেসেজ সাইজ লিমিট করে দেওয়া হলো
            return res.status(400).send("Invalid Message");
        }

        await axios.post(GOOGLE_SCRIPT_URL, { message: message });
        res.status(200).send("Success");
    } catch (error) {
        res.status(500).send("Server Error");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Secure server running`));
