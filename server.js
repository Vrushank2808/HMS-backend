// Dependencies & Declarations
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const routes = require("./routes/index");

dotenv.config();

const app = express();

// CORS Configuration
app.use((req, res, next) => {
  const origin = req.headers.origin;

  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL
  ].filter(Boolean);

  const isVercel = origin && /\.vercel\.app$/i.test(origin);
  const isExplicitAllowed = origin && allowedOrigins.includes(origin);
  const isAllowed = isExplicitAllowed || isVercel;

  const allowOriginHeader = isAllowed ? origin : (process.env.NODE_ENV === 'production' ? "*" : (allowedOrigins[0] || "*"));

  res.setHeader("Access-Control-Allow-Origin", allowOriginHeader);
  res.setHeader("Vary", "Origin");
  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS, PATCH");
  res.setHeader("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept, Authorization, Cache-Control, Pragma");
  res.setHeader("Access-Control-Max-Age", "86400");

  if (req.method === "OPTIONS") {
    // Explicitly end preflight without touching other middleware (no redirects)
    return res.status(204).end();
  }

  next();
});

// Middleware
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

// Health check endpoint
app.get("/", (req, res) => {
  res.status(200).json({
    message: "Hostel Management System API is running!",
    status: "healthy",
    timestamp: new Date().toISOString(),
    cors: "enabled"
  });
});

// CORS test endpoint
app.get("/test-cors", (req, res) => {
  res.status(200).json({
    message: "CORS is working!",
    origin: req.headers.origin,
    timestamp: new Date().toISOString()
  });
});

// Database test endpoint
app.get("/test-db", async (req, res) => {
  try {
    const dbState = mongoose.connection.readyState;
    const states = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    res.status(200).json({
      message: "Database test endpoint",
      mongoState: states[dbState],
      isConnected: isConnected,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    res.status(500).json({
      message: "Database test failed",
      error: error.message
    });
  }
});

// Database connection
let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
    throw err;
  }
};

// Ensure DB connection before handling requests
app.use(async (req, res, next) => {
  try {
    await connectDB();
    next();
  } catch (error) {
    console.error("Database connection failed:", error);
    res.status(500).json({
      message: "Database connection failed",
      error: error.message
    });
  }
});

// Routes - Must be after database middleware
app.use("/", routes);

module.exports = app;
