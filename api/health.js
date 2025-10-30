import db from "../config/db.js";

export default function handler(req, res) {
  if (req.method !== "GET")
    return res.status(405).json({ message: "Method not allowed" });

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
}
