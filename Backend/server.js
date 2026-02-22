require("dotenv").config();
const express = require("express");
const axios = require("axios");
const cors = require("cors");
const nodemailer = require("nodemailer");

const app = express();

app.use(cors());
app.use(express.json());

// --- CONFIGURE NODEMAILER TRANSPORTER ---
const transporter = nodemailer.createTransport({
  service: "gmail",
  host: "smtp.gmail.com",
  port: 465,
  secure: true,
  auth: {
    user: process.env.EMAIL_USER, 
    pass: process.env.EMAIL_PASS,
  },
  connectionTimeout: 10000,
  greetingTimeout: 5000,
  socketTimeout: 15000,
});

// --- CREATE THE LOCATION EMAIL ROUTE ---
app.post("/send-location-email", async (req, res) => {
  const { latitude, longitude, recipientEmail } = req.body;

  if (!latitude || !longitude || !recipientEmail) {
    return res.status(400).json({ error: "Missing location or email data" });
  }

  const mapUrl = `http://googleusercontent.com/maps.google.com/?q=${latitude},${longitude}`;

  const mailOptions = {
    from: `"Raksha Safety" <${process.env.EMAIL_USER}>`,
    to: recipientEmail,
    subject: "🚨 Live Location Update",
    html: `
      <h3>Emergency Location Update</h3>
      <p>My current live location is visible on the map below:</p>
      <a href="${mapUrl}" style="padding: 10px; background: #e63946; color: white; text-decoration: none; border-radius: 5px;">
        View on Google Maps
      </a>
      <p>Coordinates: ${latitude}, ${longitude}</p>
    `,
  };

  try {
    await transporter.sendMail(mailOptions);
    res.json({ success: true, message: "Location email sent!" });
  } catch (error) {
    console.error("Email Error:", error);
    res.status(500).json({ error: "Failed to send email" });
  }
});

app.post("/analyze-risk", async (req, res) => {
  const { message } = req.body;

  if (!message) {
    return res.status(400).json({ error: "Message is required" });
  }

  try {
    const response = await axios.post(
      "https://openrouter.ai/api/v1/chat/completions",
      {
        model: "google/gemma-3n-e4b-it",
        messages: [
          {
            role: "user",
            content:
              "Classify the following message for women's safety risk. " +
              "The message may be in English or Hindi. " +
              "When uncertain, choose a higher risk level to prioritize safety. " +
              "risk_score MUST be an integer between 1 and 10 only. " +
              'Return ONLY valid JSON: { "risk_level": "Safe | Medium | High", "risk_score": number }. ' +
              "Message: " +
              message,
          },
        ],
        temperature: 0,
        max_tokens: 120,
      },
      {
        headers: {
          Authorization: `Bearer ${process.env.OPENROUTER_API_KEY}`,
          "Content-Type": "application/json",
          "HTTP-Referer": "http://localhost:5000",
          "X-Title": "RakshaSafetyApp",
        },
      },
    );

    const aiReply = response.data.choices?.[0]?.message?.content;

    if (!aiReply) {
      return res.status(500).json({ error: "Empty AI response" });
    }

    // Try parsing to ensure valid JSON
    let parsed;

    try {
      // Extract JSON object from text
      const match = aiReply.match(/\{[\s\S]*\}/);

      if (!match) {
        return res.status(500).json({ error: "No JSON found in AI response" });
      }

      parsed = JSON.parse(match[0]);
    } catch (err) {
      console.error("Parsing error:", aiReply);
      return res.status(500).json({ error: "Invalid JSON from AI" });
    }

    res.json({ result: parsed });
  } catch (error) {
    console.error(error.response?.data || error.message);
    res.status(500).json({ error: "AI request failed" });
  }
});

const PORT = process.env.PORT || 5000;

app.get("/", (req, res) => {
  res.send("Raksha Safety Backend is running");
});
app.get("/analyze-risk", (req, res) => {
  res.send("Raksha Safety GenAI is running");
});
app.get("/send-location-email", (req, res) => {
  res.send("Raksha Safety email is running");
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});
