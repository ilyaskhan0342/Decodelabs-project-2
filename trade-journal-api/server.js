"use strict";

const express = require("express");
const tradesRouter = require("./routes/trades");

const app = express();
const PORT = process.env.PORT || 3000;

// ---- Core middleware ----
app.use(express.json({ limit: "50kb" }));

// Guard against malformed JSON bodies (express.json throws a SyntaxError)
app.use((err, req, res, next) => {
  if (err.type === "entity.parse.failed") {
    return res.status(400).json({ error: "Request body must be valid JSON." });
  }
  next(err);
});

// Lightweight request log — useful while developing locally.
app.use((req, res, next) => {
  const start = Date.now();
  res.on("finish", () => {
    console.log(`${req.method} ${req.originalUrl} -> ${res.statusCode} (${Date.now() - start}ms)`);
  });
  next();
});

// ---- Routes ----
app.get("/api/health", (req, res) => {
  res.status(200).json({ status: "ok", uptime: process.uptime() });
});

app.use("/api/trades", tradesRouter);

// ---- 404 handler for unknown routes ----
app.use((req, res) => {
  res.status(404).json({ error: `Cannot ${req.method} ${req.originalUrl}.` });
});

// ---- Central error handler (never leak internals to the client) ----
// eslint-disable-next-line no-unused-vars
app.use((err, req, res, next) => {
  console.error(err);
  res.status(500).json({ error: "Something went wrong on the server." });
});

app.listen(PORT, () => {
  console.log(`Trade Journal API listening on http://localhost:${PORT}`);
});

module.exports = app;
