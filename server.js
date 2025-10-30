// server.js (local testing only)
import express from "express";
import cors from "cors";
import db from "./config/db.js";

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

// Health check
app.get("/api/health", (req, res) => {
  db.getConnection((err, connection) => {
    if (err)
      return res.status(500).json({
        status: "error",
        message: "Database connection failed",
        error: err.message,
      });
    connection.query("SELECT 1 as test", (qErr, results) => {
      connection.release();
      if (qErr)
        return res.status(500).json({
          status: "error",
          message: "Database query failed",
          error: qErr.message,
        });
      res.json({
        status: "ok",
        message: "Backend and database connected",
        time: new Date().toISOString(),
      });
    });
  });
});

// Attendance routes
app.get("/api/attendance", (req, res) => {
  const sql = "SELECT * FROM Attendance ORDER BY date DESC, id DESC";
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: err.message });
    res.json(results);
  });
});

app.post("/api/attendance", (req, res) => {
  const { employeeName, employeeID, date, status } = req.body;
  if (!employeeName || !employeeID || !date || !status)
    return res.status(400).json({ error: "All fields required" });
  const sql =
    "INSERT INTO Attendance (employeeName, employeeID, date, status) VALUES (?, ?, ?, ?)";
  db.query(sql, [employeeName, employeeID, date, status], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    res.status(201).json({ message: "Attendance added", id: result.insertId });
  });
});

app.delete("/api/attendance/:id", (req, res) => {
  const { id } = req.params;
  const recordId = parseInt(id);
  if (isNaN(recordId)) return res.status(400).json({ error: "Invalid ID" });

  const sql = "DELETE FROM Attendance WHERE id = ?";
  db.query(sql, [recordId], (err, result) => {
    if (err) return res.status(500).json({ error: err.message });
    if (result.affectedRows === 0)
      return res.status(404).json({ message: "Record not found" });
    res.json({ message: `Record ${recordId} deleted` });
  });
});

// Start server locally
app.listen(PORT, () => {
  console.log(`🚀 Server running locally on http://localhost:${PORT}`);
});
