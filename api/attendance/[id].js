import db from "../../config/db.js";

export default function handler(req, res) {
  if (req.method !== "DELETE") return res.status(405).json({ message: "Method not allowed" });

  const { id } = req.query;
  const recordId = parseInt(id);
  if (isNaN(recordId)) return res.status(400).json({ message: "Invalid ID" });

  const sql = "DELETE FROM Attendance WHERE id = ?";
  db.query(sql, [recordId], (err, result) => {
    if (err) return res.status(500).json({ message: "Database delete error", error: err.message });
    if (result.affectedRows === 0) return res.status(404).json({ message: "Record not found" });

    res.status(200).json({ message: `Record ${recordId} deleted` });
  });
}
