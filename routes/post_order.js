import express from "express";
import db from "../db_promise.js";

const router = express.Router();

router.post("/", async (req, res) => {
    const { customer_id, items } = req.body;
    if (!items || items.length === 0) return res.status(400).json({ error: "ตะกร้าว่างเปล่า" });

    const connection = await db.getConnection();
    try {
        await connection.beginTransaction(); 

        const [orderResult] = await connection.execute(`INSERT INTO orders (customer_id, order_time, total_price) VALUES (?, NOW(), 0)`, [customer_id || null]);
        const orderId = orderResult.insertId;
        let totalPrice = 0;

        for (const item of items) {
            const [itemResult] = await connection.execute(`INSERT INTO order_item (order_id, menu_id, size, price) VALUES (?, ?, ?, ?)`, [orderId, item.menu_id, item.size, item.price]);
            const itemId = itemResult.insertId;
            totalPrice += Number(item.price);

            if (item.toppings) {
                for (const topId of item.toppings) {
                    await connection.execute(`INSERT INTO order_item_topping (item_id, topping_id) VALUES (?, ?)`, [itemId, topId]);
                }
            }
        }

        await connection.execute("UPDATE orders SET total_price = ? WHERE order_id = ?", [totalPrice, orderId]);
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