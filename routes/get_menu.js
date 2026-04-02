import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/", (req, res) => {
  console.log("มีคนเรียกดูข้อมูลเมนูทั้งหมด");
  const sql = "SELECT * FROM menu";

  db.query(sql, (err, results) => {
    if (err) {
      console.error("เกิดข้อผิดพลาด : ", err.message);
      return res.status(500).json({ status: "error", message: "เกิดข้อผิดพลาดในการดึงข้อมูลเมนู" });
    }

    res.json({ 
      status: "success", 
      data: results 
    });
  });
});

export default router;