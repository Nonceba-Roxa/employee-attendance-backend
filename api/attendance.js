import db from "../config/db.js";

export default function handler(req, res) {
  if (req.method === "GET") {
    const sql = "SELECT * FROM Attendance ORDER BY date DESC, id DESC";
    db.query(sql, (err, results) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(200).json(results);
    });
  } else if (req.method === "POST") {
    const { employeeName, employeeID, date, status } = req.body;
    if (!employeeName || !employeeID || !date || !status)
      return res.status(400).json({ error: "All fields required" });

    const sql = "INSERT INTO Attendance (employeeName, employeeID, date, status) VALUES (?, ?, ?, ?)";
    db.query(sql, [employeeName, employeeID, date, status], (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({ message: "Attendance added", id: result.insertId });
    });
  } else {
    res.status(405).json({ message: "Method not allowed" });
  }
}
