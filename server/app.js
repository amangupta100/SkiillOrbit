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

// Middleware
app.use(
  cors({
    origin: process.env.CLIENT_URL,
    credentials: true,
    methods: ["GET", "POST", "PUT", "DELETE"],
    allowedHeaders: [
      "Content-Type",
      "Authorization",
      "Cache-Control",
      "Expires",
      "Pragma",
    ],
  })
);

app.use(cookieParser());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Routes
app.get("/", (req, res) => res.send("Hello Backend"));

app.use("/api/auth", require("./src/routes/user/authRoutes"));
app.use("/api/sendMail", require("./src/routes/user/sendEmailRoute"));
app.use("/api", require("./src/routes/common/SendotpRoute"));
app.use("/api/recruiter/", require("./src/routes/recruiter/authRoute"));
app.use("/api/job-seeker", require("./src/routes/user/JobSkillDataRoute"));
app.use(
  "/api/recruiter/managePosting",
  require("./src/routes/recruiter/managePostingRoute")
);
app.use("/api/job-seeker/opportunity", require("./src/routes/user/jobRoutes"));
app.use("/api/common", require("./src/routes/common/getOpporDetail"));
app.use("/api/job-seeker/tests", require("./src/routes/user/testRoute"));
app.use("/api/job-seeker/profile", require("./src/routes/user/profileRoute"));
app.use("/api/job-seeker", require("./src/routes/user/streakRoutes"));
app.use(
  "/api/recruiter/profile",
  require("./src/routes/recruiter/profileRoute")
);
app.use(
  "/api/common/getPersonDet",
  require("./src/routes/common/getPersonDet")
);

// ----------------- SOCKET SETUP -----------------

const { Server } = require("socket.io");

// Create single Socket.IO instance
const io = new Server(server, {
  cors: {
    origin: process.env.CLIENT_URL,
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
  console.log(`Backend running at http://localhost:${PORT}`);
});
