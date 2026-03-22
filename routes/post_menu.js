import express from "express";
import db from "../db.js";

const router = express.Router();

router.post("/", (req, res) => {
  const { menu_name, price, category } = req.body;
  
  if (!menu_name || !price || !category) {
    return res.status(400).json({
      error: "กรุณาระบุข้อมูลให้ครบถ้วน : menu_name, price, category",
    });
  }

  const sql = 'INSERT INTO Menu (menu_name, price, category) VALUES (?, ?, ?)';
  
  db.query(sql, [menu_name, price, category], (err, result) => {
    if (err) {
      console.error("เกิดข้อผิดพลาด : ", err.message);
      return res.status(500).json({ error: "เกิดข้อผิดพลาดในการเพิ่มข้อมูลเมนู" });
    }
    
    res.status(201).json({
      message: "เพิ่มข้อมูลเมนูสำเร็จ",
      new_id: result.insertId,
    });
  });
});

export default router;