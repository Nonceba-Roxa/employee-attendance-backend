// server.js
const express = require('express');
const cors = require('cors');
const db = require('./config/db');

const app = express();
const PORT = process.env.PORT || 5000;

// ============================
// Middleware
// ============================
app.use(cors({
  origin: [/http:\/\/localhost:\d+$/, /http:\/\/127\.0\.0\.1:\d+$/],
  credentials: true
}));
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ============================
// Routes
// ============================

// Health check
app.get('/api/health', (req, res) => {
  db.getConnection((err, connection) => {
    if (err) return res.status(500).json({ status: 'error', message: 'Database connection failed', error: err.message });
    connection.query('SELECT 1 as test', (qErr, results) => {
      connection.release();
      if (qErr) return res.status(500).json({ status: 'error', message: 'Database query failed', error: qErr.message });
      res.json({ status: 'ok', message: 'Backend and database connected', time: new Date().toISOString() });
    });
  });
});

// Get all attendance
app.get('/api/attendance', (req, res) => {
  console.log('📋 Fetching attendance records...');
  const sql = 'SELECT * FROM Attendance ORDER BY date DESC, id DESC';
  db.query(sql, (err, results) => {
    if (err) return res.status(500).json({ error: 'Failed to fetch attendance', details: err.message });
    console.log(`✅ Found ${results.length} records`);
    res.json(results);
  });
});

// Add new attendance
app.post('/api/attendance', (req, res) => {
  const { employeeName, employeeID, date, status } = req.body;
  if (!employeeName || !employeeID || !date || !status)
    return res.status(400).json({ error: 'All fields required' });
  if (!['Present', 'Absent'].includes(status))
    return res.status(400).json({ error: 'Invalid status value' });

  const sql = 'INSERT INTO Attendance (employeeName, employeeID, date, status) VALUES (?, ?, ?, ?)';
  db.query(sql, [employeeName, employeeID, date, status], (err, result) => {
    if (err) return res.status(500).json({ error: 'Insert failed', details: err.message });
    res.status(201).json({ message: 'Attendance added', id: result.insertId });
  });
});

// ✅ DELETE attendance record
app.delete('/api/attendance/:id', (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ DELETE request for ID: ${id}`);

  const recordId = parseInt(id);
  if (isNaN(recordId)) {
    return res.status(400).json({ success: false, message: 'Invalid ID' });
  }

  const sql = 'DELETE FROM Attendance WHERE id = ?';
  db.query(sql, [recordId], (err, result) => {
    if (err) {
      console.error('❌ Delete error:', err);
      return res.status(500).json({ success: false, message: 'Database delete error', error: err.message });
    }

    if (result.affectedRows === 0) {
      console.log(`⚠️ No record found with ID ${recordId}`);
      return res.status(404).json({ success: false, message: 'Record not found' });
    }

    console.log(`✅ Record ${recordId} deleted successfully`);
    res.json({ success: true, message: `Record ${recordId} deleted` });
  });
});

// ============================
// Start Server
// ============================
app.listen(PORT, () => {
  console.log(`🚀 Server running on http://localhost:${PORT}`);
});
