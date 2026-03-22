import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/", (req, res) => {
  console.log("👉 [GET] มีคนเรียกดูข้อมูลเมนูทั้งหมด");
  const sql = "SELECT * FROM menu";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("[GET] Error:", err.message);
      return res.status(500).json({ error: "เกิดข้อผิดพลาดในการดึงข้อมูลเมนู" });
    }

    res.json(results);
  });
});

export default router;