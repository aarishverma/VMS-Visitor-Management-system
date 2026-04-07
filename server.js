// ============================================
// Visitor Management System - Backend Server
// Built with Node.js + Express
// ============================================

const express = require("express");
const cors = require("cors");
const fs = require("fs");
const path = require("path");

const app = express();
const PORT = 3000;
const DATA_FILE = path.join(__dirname, "data.json");

// --- Middleware ---
app.use(cors()); // Allow frontend to call backend from different origin
app.use(express.json()); // Parse incoming JSON request bodies

// --- Helper: Read visitors from JSON file ---
function readVisitors() {
  if (!fs.existsSync(DATA_FILE)) {
    fs.writeFileSync(DATA_FILE, "[]", "utf-8");
  }
  const raw = fs.readFileSync(DATA_FILE, "utf-8");
  return JSON.parse(raw);
}

// --- Helper: Write visitors to JSON file ---
function writeVisitors(visitors) {
  fs.writeFileSync(DATA_FILE, JSON.stringify(visitors, null, 2), "utf-8");
}

// --- Helper: Generate a simple unique ID ---
function generateId() {
  return "VIS-" + Date.now() + "-" + Math.floor(Math.random() * 1000);
}

// ============================================
// API ROUTES
// ============================================

// GET /visitors — Return all visitors
app.get("/visitors", (req, res) => {
  const visitors = readVisitors();
  res.json(visitors);
});

// POST /checkin — Add a new visitor
app.post("/checkin", (req, res) => {
  const { name, phone, purpose, host } = req.body;

  // Basic validation
  if (!name || !phone || !purpose || !host) {
    return res.status(400).json({ error: "All fields are required." });
  }

  const now = new Date();
  const visitor = {
    id: generateId(),
    name,
    phone,
    purpose,
    host,
    checkInTime: now.toLocaleString(),
    checkInDate: now.toISOString(), // ISO date for filtering
    checkOutTime: null,
    checkOutDate: null,
    status: "IN",
  };

  const visitors = readVisitors();
  visitors.push(visitor);
  writeVisitors(visitors);

  res.status(201).json({ message: "Visitor checked in successfully.", visitor });
});

// POST /checkout/:id — Mark a visitor as checked out
app.post("/checkout/:id", (req, res) => {
  const visitors = readVisitors();
  const visitor = visitors.find((v) => v.id === req.params.id);

  if (!visitor) {
    return res.status(404).json({ error: "Visitor not found." });
  }

  if (visitor.status === "OUT") {
    return res.status(400).json({ error: "Visitor already checked out." });
  }

  const now = new Date();
  visitor.status = "OUT";
  visitor.checkOutTime = now.toLocaleString();
  visitor.checkOutDate = now.toISOString();
  writeVisitors(visitors);

  res.json({ message: "Visitor checked out successfully.", visitor });
});

// POST /clear — Clear all visitor data (password protected)
app.post("/clear", (req, res) => {
  const { password } = req.body;

  // Admin password — change this to your own
  const ADMIN_PASSWORD = "admin123";

  if (password !== ADMIN_PASSWORD) {
    return res.status(401).json({ error: "Incorrect password." });
  }

  writeVisitors([]);
  res.json({ message: "All visitor data has been cleared." });
});

// --- Start the server ---
app.listen(PORT, () => {
  console.log(`Server running at http://localhost:${PORT}`);
});
