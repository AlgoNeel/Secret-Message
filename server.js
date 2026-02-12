const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

// শুধুমাত্র আপনার ডোমেইনগুলোকে অনুমতি দেওয়া হচ্ছে
const allowedOrigins = [
    'https://swapneel.bro.bd',
    'https://www.swapneel.bro.bd',
    'https://algoneel.github.io' // আপনার গিটহাব ইউজারনেম অনুযায়ী এটি রাখা নিরাপদ
];

const corsOptions = {
    origin: function (origin, callback) {
        // যদি রিকোয়েস্ট আসা ডোমেইনটি তালিকায় থাকে অথবা রিকোয়েস্টটি নিজস্ব সার্ভার থেকে হয়
        if (!origin || allowedOrigins.indexOf(origin) !== -1) {
            callback(null, true);
        } else {
            console.log("CORS Blocked for origin:", origin);
            callback(new Error('CORS Policy: This origin is not allowed!'));
        }
    },
    optionsSuccessStatus: 200
};

app.use(cors(corsOptions));
app.use(express.json());

// Render Environment Variable থেকে লিঙ্কটি নেবে
const GOOGLE_SCRIPT_URL = process.env.SCRIPT_URL;

app.post('/send-message', async (req, res) => {
    try {
        const { message } = req.body;
        
        if (!message) {
            return res.status(400).send("Message empty");
        }

        await axios.post(GOOGLE_SCRIPT_URL, {
            message: message
        });

        res.status(200).send("Success");
    } catch (error) {
        console.error("Error:", error.message);
        res.status(500).send("Failed to send message");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => console.log(`Server running on port ${PORT}`));
