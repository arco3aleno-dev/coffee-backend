import express from "express";
import db from "../db.js";

const router = express.Router();

router.put("/:id", (req, res) => {
    const { id } = req.params;
    const { menu_name, price, category } = req.body;

    if (menu_name === undefined || price === undefined || category === undefined) {
        return res.status(400).json({
            status: "error",
            message: "กรุณาระบุข้อมูลให้ครบถ้วน : menu_name, price, category",
        });
    }

    const sql = `UPDATE Menu SET menu_name = ?, price = ?, category = ? WHERE menu_id = ?`;
                 
    db.query(sql, [menu_name, price, category, id], (err, result) => {
        if (err) {
            console.error("เกิดข้อผิดพลาด : ", err.message);
            return res.status(500).json({ status: "error", message: "เกิดข้อผิดพลาดในการแก้ไขข้อมูลเมนู" });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ status: "error", message: `ไม่พบเมนูหมายเลข ${id}` });
        }
        res.json({ status: "success", message: `แก้ไขข้อมูลเมนูหมายเลข ${id} สำเร็จ` });
    });
});

export default router;