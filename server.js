// Dependencies & Declarations
const express = require("express");
const dotenv = require("dotenv");
const mongoose = require("mongoose");
const routes = require("./routes/index");

dotenv.config();

const app = express();

app.use((req, res, next) => {
  const allowedOrigins = [
    "http://localhost:5173",
    "http://localhost:3000",
    process.env.FRONTEND_URL,
    /\.vercel\.app$/
  ];

  const origin = req.headers.origin;
  if (
    origin &&
    allowedOrigins.some(o =>
      o instanceof RegExp ? o.test(origin) : o === origin
    )
  ) {
    res.setHeader("Access-Control-Allow-Origin", origin);
  }

  res.setHeader("Access-Control-Allow-Credentials", "true");
  res.setHeader("Access-Control-Allow-Methods", "GET, POST, PUT, DELETE, OPTIONS");
  res.setHeader("Access-Control-Allow-Headers", "Content-Type, Authorization");

  if (req.method === "OPTIONS") {
    return res.sendStatus(200);
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
    timestamp: new Date().toISOString()
  });
});

// Routes
app.use("/", routes);

let isConnected = false;
const connectDB = async () => {
  if (isConnected) return;
  try {
    await mongoose.connect(process.env.MONGO_URI);
    isConnected = true;
    console.log("✅ Connected to MongoDB");
  } catch (err) {
    console.error("❌ MongoDB connection error:", err.message);
  }
};

// Ensure DB connection before handling requests
app.use(async (req, res, next) => {
  await connectDB();
  next();
});

module.exports = app;
