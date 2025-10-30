const mysql = require('mysql2');
require('dotenv').config();

// Use connection pooling instead of single connection
const pool = mysql.createPool({
  host: process.env.DB_HOST || 'localhost',
  user: process.env.DB_USER || 'root',
  password: process.env.DB_PASSWORD || '',
  database: process.env.DB_NAME || 'attendance_db',
  port: process.env.DB_PORT || 3306,
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0,
  acquireTimeout: 60000,
  timeout: 60000,
  reconnect: true
});

// Test the connection
pool.getConnection((err, connection) => {
  if (err) {
    console.error('❌ Database connection failed:');
    console.error('Error code:', err.code);
    console.error('Error message:', err.message);
    
    if (err.code === 'ECONNREFUSED') {
      console.log('\n💡 MySQL server is not running or wrong credentials');
    } else if (err.code === 'ER_BAD_DB_ERROR') {
      console.log('\n💡 Database does not exist. Please create it first.');
    } else if (err.code === 'ER_ACCESS_DENIED_ERROR') {
      console.log('\n💡 Wrong username or password');
    }
  } else {
    console.log('✅ Connected to MySQL database successfully!');
    connection.release(); // release the connection back to the pool
  }
});

// Handle pool errors
pool.on('error', (err) => {
  console.error('Database pool error:', err);
  if (err.code === 'PROTOCOL_CONNECTION_LOST') {
    console.log('Database connection was closed.');
  }
  if (err.code === 'ER_CON_COUNT_ERROR') {
    console.log('Database has too many connections.');
  }
  if (err.code === 'ECONNREFUSED') {
    console.log('Database connection was refused.');
  }
});

module.exports = pool;