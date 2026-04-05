import express from 'express';
import multer from 'multer';
import pool from '../db_promise.js';
import path from 'path';
import fs from 'fs';

const router = express.Router();

// ตั้งค่า Multer สำหรับจัดการที่เก็บไฟล์อัปโหลดและการตั้งชื่อไฟล์รูปภาพ
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    cb(null, 'uploads/') 
  },
  filename: function (req, file, cb) {
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});
const upload = multer({ storage: storage });

// ==========================================
// [POST] สร้างโปรโมชันใหม่
// ==========================================
router.post('/', upload.single('promo_image'), async (req, res) => {
  try {
    let { promo_id, promo_name, discount_amount, applicable_categories, expiry_date } = req.body;
    const promo_image = req.file ? req.file.filename : null;
    
    expiry_date = (expiry_date === '' || expiry_date === 'undefined' || !expiry_date) ? null : expiry_date;

    const sql = `INSERT INTO promotions (promo_id, promo_name, discount_amount, promo_image, applicable_categories, expiry_date) VALUES (?, ?, ?, ?, ?, ?)`;
    await pool.query(sql, [promo_id, promo_name, discount_amount, promo_image, applicable_categories, expiry_date]);
    res.status(201).json({ status: 'success', message: 'สร้างโปรโมชั่นสำเร็จ!' });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==========================================
// [GET] ดึงข้อมูลโปรโมชันทั้งหมด
// ==========================================
router.get('/', async (req, res) => {
  try {
    const [rows] = await pool.query(`SELECT *, DATE_FORMAT(expiry_date, '%Y-%m-%d') as expiry_date FROM promotions ORDER BY promo_id DESC`);
    res.json({ status: 'success', data: rows });
  } catch (error) {
    res.status(500).json({ status: 'error', message: error.message });
  }
});

// ==========================================
// [PUT] แก้ไขข้อมูลโปรโมชัน
// ==========================================
router.put('/:id', upload.single('promo_image'), async (req, res) => {
  try {
    const promoId = req.params.id;
    let { promo_name, discount_amount, applicable_categories, expiry_date } = req.body;
    expiry_date = (!expiry_date || expiry_date === 'null') ? null : expiry_date;

    if (req.file) {
        const [oldData] = await pool.query(`SELECT promo_image FROM promotions WHERE promo_id = ?`, [promoId]);
        if (oldData[0]?.promo_image) {
            const oldPath = path.join('uploads', oldData[0].promo_image);
            if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
        }
        
        await pool.query(
            `UPDATE promotions SET promo_name=?, discount_amount=?, applicable_categories=?, expiry_date=?, promo_image=? WHERE promo_id=?`,
            [promo_name, discount_amount, applicable_categories, expiry_date, req.file.filename, promoId]
        );
    } else {
        await pool.query(
            `UPDATE promotions SET promo_name=?, discount_amount=?, applicable_categories=?, expiry_date=? WHERE promo_id=?`,
            [promo_name, discount_amount, applicable_categories, expiry_date, promoId]
        );
    }
    res.json({ status: 'success', message: 'แก้ไขสำเร็จ' });
  } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

// ==========================================
// [DELETE] ลบโปรโมชัน
// ==========================================
router.delete('/:id', async (req, res) => {
  try {
    const promoId = req.params.id;
    const [oldData] = await pool.query(`SELECT promo_image FROM promotions WHERE promo_id = ?`, [promoId]);
    
    if (oldData[0]?.promo_image) {
        const oldPath = path.join('uploads', oldData[0].promo_image);
        if (fs.existsSync(oldPath)) fs.unlinkSync(oldPath);
    }

    await pool.query(`DELETE FROM promotions WHERE promo_id = ?`, [promoId]);
    res.json({ status: 'success', message: 'ลบโปรโมชั่นและไฟล์ภาพสำเร็จ' });
  } catch (error) { res.status(500).json({ status: 'error', message: error.message }); }
});

export default router;