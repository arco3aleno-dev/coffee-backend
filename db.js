import { createConnection } from "mysql2";
const db = createConnection({
  host: "localhost",
  port: 3306,
  user: "root",
  password: "",
  database: "coffee_shop_db",
});

db.connect((err) => {
  if (err) {
    console.error("เกิดข้อผิดพลาดในการเชื่อมต่อฐานข้อมูล : ", err.message);
    process.exit(1);
  }
  console.log("เชื่อมต่อฐานข้อมูลสำเร็จ");
});

export default db;