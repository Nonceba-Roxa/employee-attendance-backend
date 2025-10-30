// api/server.js
const express = require('express');
const cors = require('cors');
const mysql = require('mysql2');

const app = express();

// ============================
// Middleware
// ============================
app.use(cors());
app.use(express.json());

// Request logger
app.use((req, res, next) => {
  console.log(`[${new Date().toISOString()}] ${req.method} ${req.url}`);
  next();
});

// ============================
// Database Configuration
// ============================
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
  connectTimeout: 60000,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
};

// Create connection pool
const pool = mysql.createPool(dbConfig);

// Test database connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Connected to MySQL database');
    connection.release();
  }
});

// ============================
// Routes
// ============================

// Root endpoint - IMPORTANT: This handles the base API route
app.get('/api', (req, res) => {
  res.json({ 
    message: 'Employee Attendance Tracker API',
    status: 'running',
    timestamp: new Date().toISOString(),
    environment: process.env.NODE_ENV || 'production'
  });
});

// Health check
app.get('/api/health', (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      return res.status(500).json({ 
        status: 'error', 
        message: 'Database connection failed', 
        error: err.message 
      });
    }
    
    connection.query('SELECT 1 as test', (qErr, results) => {
      connection.release();
      if (qErr) {
        return res.status(500).json({ 
          status: 'error', 
          message: 'Database query failed', 
          error: qErr.message 
        });
      }
      
      res.json({ 
        status: 'ok', 
        message: 'Backend and database connected', 
        time: new Date().toISOString()
      });
    });
  });
});

// Get all attendance
app.get('/api/attendance', (req, res) => {
  console.log('📋 Fetching attendance records...');
  const sql = 'SELECT * FROM Attendance ORDER BY date DESC, id DESC';
  
  pool.query(sql, (err, results) => {
    if (err) {
      console.error('❌ Database error:', err);
      return res.status(500).json({ 
        error: 'Failed to fetch attendance', 
        details: err.message 
      });
    }
    
    console.log(`✅ Found ${results.length} records`);
    res.json(results);
  });
});

// Add new attendance
app.post('/api/attendance', (req, res) => {
  const { employeeName, employeeID, date, status } = req.body;
  
  console.log('📝 Received attendance data:', req.body);
  
  // Validation
  if (!employeeName || !employeeID || !date || !status) {
    return res.status(400).json({ 
      error: 'All fields required',
      received: req.body 
    });
  }
  
  if (!['Present', 'Absent'].includes(status)) {
    return res.status(400).json({ 
      error: 'Invalid status value. Must be "Present" or "Absent"' 
    });
  }

  const sql = 'INSERT INTO Attendance (employeeName, employeeID, date, status) VALUES (?, ?, ?, ?)';
  
  pool.query(sql, [employeeName, employeeID, date, status], (err, result) => {
    if (err) {
      console.error('❌ Insert failed:', err);
      return res.status(500).json({ 
        error: 'Insert failed', 
        details: err.message 
      });
    }
    
    console.log(`✅ Attendance added with ID: ${result.insertId}`);
    res.status(201).json({ 
      message: 'Attendance added successfully', 
      id: result.insertId 
    });
  });
});

// DELETE attendance record
app.delete('/api/attendance/:id', (req, res) => {
  const { id } = req.params;
  console.log(`🗑️ DELETE request for ID: ${id}`);

  const recordId = parseInt(id);
  if (isNaN(recordId)) {
    return res.status(400).json({ 
      success: false, 
      message: 'Invalid ID format' 
    });
  }

  const sql = 'DELETE FROM Attendance WHERE id = ?';
  
  pool.query(sql, [recordId], (err, result) => {
    if (err) {
      console.error('❌ Delete error:', err);
      return res.status(500).json({ 
        success: false, 
        message: 'Database delete error', 
        error: err.message 
      });
    }

    if (result.affectedRows === 0) {
      console.log(`⚠️ No record found with ID ${recordId}`);
      return res.status(404).json({ 
        success: false, 
        message: 'Record not found' 
      });
    }

    console.log(`✅ Record ${recordId} deleted successfully`);
    res.json({ 
      success: true, 
      message: `Record deleted successfully`,
      deletedId: recordId,
      affectedRows: result.affectedRows
    });
  });
});

// 404 handler for undefined API routes
app.use('/api/*', (req, res) => {
  res.status(404).json({
    error: 'API route not found',
    path: req.originalUrl,
    method: req.method,
    availableRoutes: [
      'GET /api',
      'GET /api/health',
      'GET /api/attendance',
      'POST /api/attendance',
      'DELETE /api/attendance/:id'
    ]
  });
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error('🚨 Unhandled error:', err);
  res.status(500).json({
    error: 'Internal server error',
    message: err.message
  });
});

// ============================
// Export for Vercel
// ============================
module.exports = app;