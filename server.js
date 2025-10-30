const express = require("express");
const mysql = require("mysql2");

const app = express();

// Middleware
app.use(express.json());
app.use((req, res, next) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  next();
});

// Database configuration
const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false
};

console.log('Database config:', {
  host: dbConfig.host,
  user: dbConfig.user,
  database: dbConfig.database,
  port: dbConfig.port
});

// Create connection
const pool = mysql.createPool(dbConfig);

// Test connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:', err.message);
  } else {
    console.log('✅ Database connected successfully');
    connection.release();
  }
});

// Routes
app.get("/", (req, res) => {
  res.json({ 
    message: "Employee Attendance API is running",
    timestamp: new Date().toISOString()
  });
});

app.get("/api/health", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Health check - DB connection failed:', err);
      return res.status(500).json({ 
        status: "error", 
        message: "Database connection failed",
        error: err.message 
      });
    }

    connection.query("SELECT 1 as test", (qErr, results) => {
      connection.release();
      if (qErr) {
        console.error('Health check - Query failed:', qErr);
        return res.status(500).json({ 
          status: "error", 
          message: "Database query failed",
          error: qErr.message 
        });
      }
      
      res.json({ 
        status: "ok", 
        message: "API and database are working",
        timestamp: new Date().toISOString()
      });
    });
  });
});

// Get all attendance
app.get("/api/attendance", (req, res) => {
  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Get attendance - DB connection failed:', err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query("SELECT * FROM Attendance ORDER BY date DESC, id DESC", (qErr, results) => {
      connection.release();
      if (qErr) {
        console.error('Get attendance - Query failed:', qErr);
        return res.status(500).json({ error: "Failed to fetch attendance" });
      }
      
      res.json(results);
    });
  });
});

// Add attendance
app.post("/api/attendance", (req, res) => {
  const { employeeName, employeeID, date, status } = req.body;
  
  if (!employeeName || !employeeID || !date || !status) {
    return res.status(400).json({ error: "All fields are required" });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Post attendance - DB connection failed:', err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    const sql = "INSERT INTO Attendance (employeeName, employeeID, date, status) VALUES (?, ?, ?, ?)";
    connection.query(sql, [employeeName, employeeID, date, status], (qErr, result) => {
      connection.release();
      if (qErr) {
        console.error('Post attendance - Insert failed:', qErr);
        return res.status(500).json({ error: "Failed to add attendance" });
      }
      
      res.status(201).json({ 
        message: "Attendance recorded successfully", 
        id: result.insertId 
      });
    });
  });
});

// Delete attendance
app.delete("/api/attendance/:id", (req, res) => {
  const id = parseInt(req.params.id);
  
  if (isNaN(id)) {
    return res.status(400).json({ error: "Invalid ID" });
  }

  pool.getConnection((err, connection) => {
    if (err) {
      console.error('Delete attendance - DB connection failed:', err);
      return res.status(500).json({ error: "Database connection failed" });
    }

    connection.query("DELETE FROM Attendance WHERE id = ?", [id], (qErr, result) => {
      connection.release();
      if (qErr) {
        console.error('Delete attendance - Query failed:', qErr);
        return res.status(500).json({ error: "Failed to delete record" });
      }
      
      if (result.affectedRows === 0) {
        return res.status(404).json({ error: "Record not found" });
      }
      
      res.json({ message: "Record deleted successfully" });
    });
  });
});

// Handle preflight requests
app.options('*', (req, res) => {
  res.header('Access-Control-Allow-Origin', '*');
  res.header('Access-Control-Allow-Methods', 'GET, POST, DELETE, OPTIONS');
  res.header('Access-Control-Allow-Headers', 'Content-Type');
  res.sendStatus(200);
});

module.exports = app;