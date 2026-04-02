import express from 'express';
import pool from '../db_promise.js';

const router = express.Router();

router.get('/', async (req, res) => {
    // รับค่าวันที่จาก Frontend
    const selectedDate = req.query.date;

    try {
        let dateCondition = "";
        let params = [];

        // ถ้ามีการส่งวันที่มา ให้เติมเงื่อนไข WHERE DATE(...) = ?
        if (selectedDate) {
            dateCondition = "WHERE DATE(o.order_time) = ?";
            params.push(selectedDate);
        }

        // 1. สรุปยอดขายรวม และจำนวนบิล
        const [summaryResult] = await pool.query(
            `SELECT IFNULL(SUM(total_price), 0) as total_sales, COUNT(order_id) as total_orders 
             FROM orders o ${dateCondition}`, params
        );

        // 2. เมนูขายดีอันดับ 1
        const [top1Result] = await pool.query(
            `SELECT m.menu_name FROM order_item oi
             JOIN orders o ON oi.order_id = o.order_id
             JOIN menu m ON oi.menu_id = m.menu_id
             ${dateCondition}
             GROUP BY oi.menu_id ORDER BY COUNT(oi.menu_id) DESC LIMIT 1`, params
        );

        // 3. สัดส่วนยอดขายตามหมวดหมู่ (สำหรับกราฟโดนัท)
        const [categoryResult] = await pool.query(
            `SELECT m.category, SUM(oi.price) as total_sales FROM order_item oi
             JOIN orders o ON oi.order_id = o.order_id
             JOIN menu m ON oi.menu_id = m.menu_id
             ${dateCondition}
             GROUP BY m.category`, params
        );

        // 4. 5 อันดับเมนูขายดี (สำหรับกราฟแท่ง)
        const [top5Result] = await pool.query(
            `SELECT m.menu_name, COUNT(oi.menu_id) as qty FROM order_item oi
             JOIN orders o ON oi.order_id = o.order_id
             JOIN menu m ON oi.menu_id = m.menu_id
             ${dateCondition}
             GROUP BY oi.menu_id ORDER BY qty DESC LIMIT 5`, params
        );

        const [dailyTableResult] = await pool.query(
            `SELECT o.order_id, DATE_FORMAT(o.order_time, '%d/%m/%Y %H:%i') as datetime, c.name as customer_name, c.phone as customer_phone, o.total_price
             FROM orders o
             LEFT JOIN customer c ON o.customer_id = c.customer_id
             ${dateCondition}
             ORDER BY o.order_time DESC`, params
        );

        res.json({
            status: 'success',
            summary: summaryResult[0],
            top1: top1Result.length > 0 ? top1Result[0].menu_name : '-',
            categories: categoryResult,
            top5: top5Result,
            tableData: dailyTableResult
        });

    } catch (error) {
        console.error(error);
        res.status(500).json({ status: 'error', message: error.message });
    }
});

export default router;