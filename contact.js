const express = require("express");
const cors = require("cors");
const nodemailer = require("nodemailer");
require("dotenv").config();

const app = express();

const fs = require("fs");
const path = require("path");

const waitlistFile = path.join(__dirname, "waitlist.json");

const cron = require("node-cron");

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

app.get("/test", (req, res) => {
  res.send("Backend is working");
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
      from: `"${name}" <${process.env.EMAIL_USER}>`, // Sent by your bot
      replyTo: email,                               // Replies go directly to the user
      to: process.env.RECEIVER_EMAIL,               // The inbox receiving the message
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
        <p>This message was sent from the Nexora Contact Form.</p>
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
========================================
📩 WAITLIST API (ADD THIS)
========================================
*/
app.post("/backend/waitlist", async (req, res) => {
  console.log("Received waitlist request");
  const { name, email } = req.body;

  if (!name || !email) {
    return res.status(400).json({
      message: "Name and Email are required"
    });
  }

  try {
    // const mailOptions = {
    //   from: `"Nexora Team" <${process.env.EMAIL_USER}>`,
    //   to: email,
    //   subject: "You're on the Nexora Waitlist",
    //   html: `<h2>Welcome ${name}</h2><p>You are added to waitlist.</p>`
    // };

    // 📌 SAVE USER TO waitlist.json
    let users = [];

    try {
      users = JSON.parse(fs.readFileSync(waitlistFile, "utf-8"));
    } catch {
      users = [];
    }

    // جلوگیری duplicates (avoid duplicate emails)
    const exists = users.find(user => user.email === email);

    if (!exists) {
      users.push({ name, email });
      fs.writeFileSync(waitlistFile, JSON.stringify(users, null, 2));
    }

    const mailOptions = {
      from: `"Nexora Team" <${process.env.EMAIL_USER}>`,
      to: email,
      subject: "You're on the Nexora Waitlist",
      html: `
    <div style="font-family: Arial, sans-serif; padding: 20px; color: #333; line-height: 1.6;">
      
      <h2 style="color:#f97316;">Welcome to Nexora 2026, ${name}!</h2>

      <p>
        Thank you for showing interest in <strong>Nexora 2026</strong>.
        You have been successfully added to our waitlist.
      </p>

      <p>
        <strong>Great news!</strong> You’ll be among the first to know when registrations officially open.
      </p>

      <p>
        We will notify you as soon as registrations go live on:
      </p>

      <p style="font-size:18px; font-weight:bold; color:#f97316;">
        1st April 2026
      </p>

      <p>
        Get ready to showcase your innovation, collaborate with brilliant minds, 
        and be part of an exciting hackathon experience.
      </p>

      <!-- Buttons Section -->
      <div style="margin: 30px 0; display: flex; gap: 15px; flex-wrap: wrap;">
        
        <a href="https://nexora-2026.vercel.app/themes"
           style="
             background:#f97316;
             color:#000;
             padding:12px 20px;
             text-decoration:none;
             border-radius:6px;
             font-weight:bold;
             display:inline-block;
           ">
           Explore Themes
        </a>

      </div>

      <p>
        Stay tuned — something exciting is on the way.
      </p>

      <hr style="margin-top:30px"/>

      <p style="font-size:12px; color:gray;">
        Nexora Team <br/>
        This is an automated message. Please do not reply.
      </p>

    </div>
  `
    };

    await transporter.sendMail(mailOptions);

    res.status(200).json({
      message: "User added and email sent successfully"
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Failed to send email"
    });
  }
});


// ========================================
// 🚀 SCHEDULED EMAIL (APRIL 1)
// ========================================
cron.schedule("0 8 1 4 *", async () => {
  console.log("Sending registration open emails...");

  try {
    const users = JSON.parse(fs.readFileSync(waitlistFile, "utf-8"));

    for (const user of users) {
      const mailOptions = {
        from: `"Nexora Team" <${process.env.EMAIL_USER}>`,
        to: user.email,
        subject: "Nexora Registration is NOW OPEN!",
        html: `
          <div style="font-family: Arial; padding:20px;">
            <h2 style="color:#f97316;">Hey ${user.name}, Registration is LIVE!</h2>

            <p>
              The wait is over. Nexora 2026 registrations are now open.
            </p>

            <p>Click below to register:</p>

            <div style="margin: 20px 0;">
              <a href="https://nexora-2026.vercel.app"
                 style="
                   background:#f97316;
                   padding:12px 20px;
                   color:#000;
                   text-decoration:none;
                   border-radius:6px;
                   font-weight:bold;
                 ">
                 Register Now!
              </a>
            </div>

            <p>We look forward to your participation.</p>

            <hr/>
            <p style="font-size:12px; color:gray;">
              Nexora Team <br/>
              This is an automated message. Please do not reply.
            </p>
          </div>
        `
      };

      await transporter.sendMail(mailOptions);
    }

    console.log("✅ All waitlist emails sent!");

  } catch (error) {
    console.error("❌ Scheduler error:", error);
  }

}, {
  timezone: "Asia/Kolkata"
});

/*
SERVER
*/
const PORT = 5000;

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
});