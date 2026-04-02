import express from "express";
import db from "../db.js";

const router = express.Router();

router.get("/", (req, res) => {
    db.query(`SELECT * FROM topping ORDER BY topping_id ASC`, (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        res.json({ data: results });
    });
});

export default router;