require("dotenv").config();

// Fail fast with clear messages if required env vars are missing
if (!process.env.MONGO_URI) {
  console.error("\nERROR: MONGO_URI is not set.");
  console.error("  → Copy backend/.env.example to backend/.env and fill in your MongoDB connection string.\n");
  process.exit(1);
}
if (!process.env.JWT_SECRET) {
  console.error("\nERROR: JWT_SECRET is not set.");
  console.error("  → Copy backend/.env.example to backend/.env and add a long random secret string.\n");
  process.exit(1);
}

const express = require("express");
const http = require("http");
const cors = require("cors");
const { Server } = require("socket.io");

const connectDB = require("./config/db");
const { initSocket } = require("./socket/socketHandler");

const authRoutes = require("./routes/auth");
const userRoutes = require("./routes/users");
const conversationRoutes = require("./routes/conversations");
const messageRoutes = require("./routes/messages");

const app = express();
const server = http.createServer(app);

const clientUrl = process.env.CLIENT_URL || "http://localhost:5173";

const io = new Server(server, {
  cors: {
    origin: clientUrl,
    credentials: true,
  },
});

app.use(cors({ origin: clientUrl, credentials: true }));
app.use(express.json());

app.get("/", (req, res) => {
  res.json({ 
    message: "Realtime Chat API", 
    version: "1.0.0",
    status: "running",
    endpoints: {
      health: "/api/health",
      auth: "/api/auth",
      users: "/api/users",
      conversations: "/api/conversations",
      messages: "/api/messages"
    }
  });
});

app.get("/api/health", (req, res) => {
  res.json({ status: "ok", message: "Realtime chat API is running" });
});

app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/conversations", conversationRoutes);
app.use("/api/messages", messageRoutes);

// Fallback 404 handler for unknown API routes
app.use("/api", (req, res) => {
  res.status(404).json({ message: "API route not found" });
});

// Generic error handler
app.use((err, req, res, next) => {
  console.error("Unhandled error:", err.stack);
  res.status(500).json({ message: "Internal server error" });
});

initSocket(io);

const PORT = process.env.PORT || 5000;

const start = async () => {
  await connectDB();
  server.listen(PORT, () => {
    console.log(`\n✓ Server running on http://localhost:${PORT}`);
    console.log(`✓ CORS allowed for: ${clientUrl}\n`);
  });
};

start();

module.exports = { app, server };
