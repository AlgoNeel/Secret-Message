const express = require('express');
const axios = require('axios');
const cors = require('cors');
const app = express();

app.use(cors());
app.use(express.json());

// Render-এর 'Environment Variables' থেকে লিঙ্কটি অটোমেটিক নিয়ে নেবে
const GOOGLE_SCRIPT_URL = process.env.SCRIPT_URL;

app.post('/send-message', async (req, res) => {
    try {
        const { message } = req.body;

        if (!message) {
            return res.status(400).send("Message is required");
        }

        // আপনার গোপন Google Apps Script লিঙ্কে রিকোয়েস্ট পাঠানো হচ্ছে
        await axios.post(GOOGLE_SCRIPT_URL, {
            message: message
        });

        res.status(200).send("Message sent successfully to Google Doc!");
    } catch (error) {
        console.error("Error sending to Google:", error.message);
        res.status(500).send("Failed to send message");
    }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
