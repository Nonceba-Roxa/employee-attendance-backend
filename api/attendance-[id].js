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
  res.setHeader('Access-Control-Allow-Methods', 'DELETE,OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

  if (req.method === 'OPTIONS') {
    return res.status(200).end();
  }

  if (req.method === 'DELETE') {
    try {
      // Extract ID from the URL path
      const id = req.query.id || req.url.split('/').pop();
      const recordId = parseInt(id);
      
      if (isNaN(recordId)) {
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid ID format' 
        });
      }

      const connection = await mysql.createConnection(dbConfig);
      const [result] = await connection.execute(
        'DELETE FROM Attendance WHERE id = ?',
        [recordId]
      );
      await connection.end();

      if (result.affectedRows === 0) {
        return res.status(404).json({ 
          success: false, 
          message: 'Record not found' 
        });
      }

      res.status(200).json({ 
        success: true, 
        message: 'Record deleted successfully',
        deletedId: recordId
      });
      
    } catch (error) {
      console.error('Delete error:', error);
      res.status(500).json({ 
        success: false, 
        message: 'Database delete error', 
        error: error.message 
      });
    }
  } else {
    res.status(405).json({ error: 'Method not allowed' });
  }
};