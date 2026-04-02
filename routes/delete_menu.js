import express from "express";
import db from "../db.js";

const router = express.Router();

router.delete("/:id", (req, res) => {
  const { id } = req.params;

  const sql = "DELETE FROM Menu WHERE menu_id = ?";
  
  db.query(sql, [id], (err, result) => {
    if (err) {
        console.error("เกิดข้อผิดพลาด : ", err.message);
        return res.status(500).json({ status: "error", message: "เกิดข้อผิดพลาดในการลบข้อมูลเมนู" });
    }
    if (result.affectedRows === 0) {
        return res.status(404).json({ status: "error", message: `ไม่พบเมนูหมายเลข ${id}` });
    }
    res.json({ status: "success", message: `ลบข้อมูลเมนูหมายเลข ${id} สำเร็จ` });
  });
});

export default router;