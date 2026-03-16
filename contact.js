const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

// Middleware
app.use(cors());
app.use(express.json());

/*
EMAIL TRANSPORTER
*/
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USER,
    pass: process.env.EMAIL_PASS
  }
});

/*
CONTACT FORM API
*/
app.post("/backend/contact", async (req, res) => {

  const { name, email, subject, message } = req.body;

  if (!name || !email || !subject || !message) {
    return res.status(400).json({
      message: "All fields are required"
    });
  }

  try {

    const mailOptions = {
      from: `"${name}" <${email}>`,
      to: process.env.EMAIL_USER,
      subject: `Nexora Contact: ${subject}`,
      html: `
        <h2>New Contact Message - Nexora Website</h2>
        <p><b>Name:</b> ${name}</p>
        <p><b>Email:</b> ${email}</p>
        <p><b>Subject:</b> ${subject}</p>
        <p><b>Message:</b></p>
        <p>${message}</p>
        <br/>
        <hr/>
        <p>This message was sent from Nexora Contact Form.</p>
      `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "Message sent successfully!"
    });

  } catch (error) {

    console.error(error);

    res.status(500).json({
      message: "Failed to send message"
    });

  }

});

/*
SERVER
*/
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});