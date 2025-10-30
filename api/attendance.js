const mysql = require('mysql2/promise');

const dbConfig = {
  host: process.env.DB_HOST,
  user: process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: process.env.DB_PORT || 3306,
  ssl: process.env.DB_SSL ? { rejectUnauthorized: false } : false,
};

module.exports = async (req, res) => {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  try {
    const connection = await mysql.createConnection(dbConfig);

    if (req.method === 'GET') {
      // Get all attendance records
      const [results] = await connection.execute(
        'SELECT * FROM Attendance ORDER BY date DESC, id DESC'
      );
      await connection.end();
      
      res.status(200).json(results);
      
    } else if (req.method === 'POST') {
      // Add new attendance record
      const { employeeName, employeeID, date, status } = req.body;
      
      if (!employeeName || !employeeID || !date || !status) {
        await connection.end();
        return res.status(400).json({ error: 'All fields required' });
      }
      
      if (!['Present', 'Absent'].includes(status)) {
        await connection.end();
        return res.status(400).json({ error: 'Invalid status value' });
      }

      const [result] = await connection.execute(
        'INSERT INTO Attendance (employeeName, employeeID, date, status) VALUES (?, ?, ?, ?)',
        [employeeName, employeeID, date, status]
      );
      await connection.end();
      
      res.status(201).json({ 
        message: 'Attendance added successfully', 
        id: result.insertId 
      });
      
    } else {
      await connection.end();
      res.status(405).json({ error: 'Method not allowed' });
    }
  } catch (error) {
    console.error('Database error:', error);
    res.status(500).json({ 
      error: 'Database operation failed', 
      details: error.message 
    });
  }
};