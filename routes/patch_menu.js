import express from "express";
import db from "../db.js";

const router = express.Router();

router.patch("/:id", (req, res) => {
  const { id } = req.params;
  const { menu_name, price, category } = req.body;

  let fields = []; 
  let values = []; 

  if (menu_name) { fields.push("menu_name = ?"); values.push(menu_name); }
  if (price) { fields.push("price = ?"); values.push(price); }
  if (category) { fields.push("category = ?"); values.push(category); }

  if (fields.length === 0) {
    return res.status(400).json({ error: "กรุณาระบุข้อมูลที่ต้องการแก้ไขอย่างน้อย 1 อย่าง" });
  }

  values.push(id); 
  
  const sql = `UPDATE Menu SET ${fields.join(", ")} WHERE menu_id = ?`;

  db.query(sql, values, (err, result) => {
    if (err) {
        console.error("[PATCH] Error:", err.message);
        return res.status(500).json({ error: "เกิดข้อผิดพลาดในการอัปเดตข้อมูลเมนู" });
    }
    if (result.affectedRows === 0) {
        return res.status(404).json({ error: `ไม่พบเมนูหมายเลข ${id}` });
    }
    res.json({ message: `อัปเดตข้อมูลเมนูหมายเลข ${id} สำเร็จ` });
  });
});

export default router;