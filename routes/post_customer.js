import express from "express";
import db from "../db.js";

const router = express.Router();

router.post("/", (req, res) => {
  const { name, phone } = req.body;
  db.query(
    `INSERT INTO customer (name, phone) VALUES (?, ?)`,
    [name, phone],
    (err, result) => {
      if (err) return res.status(500).json({ error: err.message });
      res.status(201).json({
        message: "สมัครสำเร็จ",
        customer_id: result.insertId,
        name,
        phone,
      });
    },
  );
});

export default router;