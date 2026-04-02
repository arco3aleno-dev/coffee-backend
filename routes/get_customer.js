import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/:phone", (req, res) => {
  const { phone } = req.params;

  const sql = "SELECT * FROM customer WHERE phone = ?";

  db.query(sql, [phone], (err, results) => {
    if (err) {
      console.error("เกิดข้อผิดพลาด : ", err.message);
      return res.status(500).json({ status: "error", message: "เกิดข้อผิดพลาดที่เซิร์ฟเวอร์" });
    }

    if (results.length > 0) {
      return res.json({
        status: "success",
        data: results[0]
      });
    }

    return res.status(404).json({
      status: "not_found",
      message: "ไม่พบข้อมูล กรุณาตรวจสอบเบอร์โทรศัพท์"
    });
  });
});

export default router;