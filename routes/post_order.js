import express from "express";
import db from "../db_promise.js";

const router = express.Router();

router.post("/", async (req, res) => {
    // 1. เพิ่มการรับตัวแปร total_price มาจาก req.body (ยอดที่หักส่วนลดแล้วจากหน้าเว็บ)
    const { customer_id, items, total_price } = req.body;
    
    if (!items || items.length === 0) return res.status(400).json({ error: "ตะกร้าว่างเปล่า" });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction(); 

        // 2. บันทึกยอด total_price (ยอดสุทธิ) ลงในคำสั่ง INSERT ตั้งแต่สร้างบิลเลย
        const [orderResult] = await connection.execute(
            `INSERT INTO orders (customer_id, order_time, total_price) VALUES (?, NOW(), ?)`, 
            [customer_id || null, total_price]
        );
        const orderId = orderResult.insertId;

        // ไม่ต้องมีตัวแปร let totalPrice = 0; แล้ว เพราะเราใช้ยอดที่ส่งมา

        for (const item of items) {
            const [itemResult] = await connection.execute(`INSERT INTO order_item (order_id, menu_id, size, price) VALUES (?, ?, ?, ?)`, [orderId, item.menu_id, item.size, item.price]);
            const itemId = itemResult.insertId;
            
            // ลบโค้ด totalPrice += Number(item.price); ออกไป

            if (item.toppings) {
                for (const topId of item.toppings) {
                    await connection.execute(`INSERT INTO order_item_topping (item_id, topping_id) VALUES (?, ?)`, [itemId, topId]);
                }
            }
        }

        // ลบคำสั่ง UPDATE orders SET total_price = ? ออกไป เพราะเราบันทึกไปตั้งแต่ตอน INSERT ด้านบนแล้ว

        await connection.commit(); 
        res.status(201).json({ message: "ชำระเงินและบันทึกข้อมูลสำเร็จ" });

    } catch (err) {
        await connection.rollback(); 
        res.status(500).json({ error: err.message });
    } finally { 
        connection.release(); 
    }
});

export default router;