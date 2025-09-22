// app.js
require("dotenv").config();
const express = require("express");
const http = require("http");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const mongodb = require("./src/config/db");

// Socket modules
const { setupSocket } = require("./src/config/socket");
const { interview_Socket } = require("./src/config/interview_socket");

// Initialize Express
const app = express();
const server = http.createServer(app);

// Connect to MongoDB
mongodb();

// ----------------- MIDDLEWARE -----------------
app.use(cookieParser()); // cookies parse karne ke liye pehle
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// CORS setup (always after parsers)
app.use(
  cors({
    origin: process.env.CLIENT_URL?.replace(/\/$/, ""), // remove trailing slash if any
    credentials: true,
  })
);

// ----------------- ROUTES -----------------
app.get("/", (req, res) => res.send("Hello Backend"));

// Auth
app.use("/api/auth", require("./src/routes/user/authRoutes"));
app.use("/api/sendMail", require("./src/routes/user/sendEmailRoute"));
app.use("/api", require("./src/routes/common/SendotpRoute"));

// Recruiter
app.use("/api/recruiter/auth", require("./src/routes/recruiter/authRoute"));
app.use(
  "/api/recruiter/managePosting",
  require("./src/routes/recruiter/managePostingRoute")
);
app.use(
  "/api/recruiter/profile",
  require("./src/routes/recruiter/profileRoute")
);

// Job Seeker (grouped properly to avoid conflicts)
app.use(
  "/api/job-seeker/skills",
  require("./src/routes/user/JobSkillDataRoute")
);
app.use("/api/job-seeker/", require("./src/routes/user/streakRoutes"));
app.use("/api/job-seeker/opportunity", require("./src/routes/user/jobRoutes"));
app.use("/api/job-seeker/tests", require("./src/routes/user/testRoute"));
app.use("/api/job-seeker/profile", require("./src/routes/user/profileRoute"));
app.use("/api/job-seeker/streaks", require("./src/routes/user/streakRoutes"));

// Common
app.use(
  "/api/common/opportunity",
  require("./src/routes/common/getOpporDetail")
);
app.use("/api/common/person", require("./src/routes/common/getPersonDet"));

// ----------------- SOCKET SETUP -----------------
const { Server } = require("socket.io");
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL?.replace(/\/$/, ""),
    credentials: true,
  },
});

// Setup status (online/offline) namespace
setupSocket(io);

// Setup interview rooms namespace
interview_Socket(io);

// ----------------- START SERVER -----------------
const PORT = process.env.PORT || 5000;
server.listen(PORT, () => {
  console.log(`✅ Backend running on port ${PORT}`);
  console.log(`🌍 Allowed origin: ${process.env.CLIENT_URL}`);
});
