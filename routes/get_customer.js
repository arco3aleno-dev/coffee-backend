import express from "express";
import db from "../db.js";

const router = express.Router();

// จุดที่ 1: เปลี่ยนจาก "/:phone" เป็น "/" เฉยๆ เพื่อรับค่าจาก Query String
router.get("/", (req, res) => {
  
  // จุดที่ 2: เปลี่ยนจาก req.params เป็น req.query
  const { phone } = req.query;

  const sql = "SELECT * FROM customer WHERE phone = ?";

  db.query(sql, [phone], (err, results) => {
    if (err) {
      console.error("เกิดข้อผิดพลาด : ", err.message);
      return res.status(500).json({ status: "error", message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
    }

    if (results.length > 0) {
      return res.json({
        status: "success",
        // จุดที่ 3: เปลี่ยนจาก results[0] เป็น results (ส่งไปเป็น Array เพื่อให้หน้าเว็บนับ length ได้)
        data: results
      });
    }

    return res.status(404).json({
      status: "not_found",
      message: "ไม่พบข้อมูล กรุณาตรวจสอบเบอร์โทรศัพท์"
    });
  });
});

export default router;