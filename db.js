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
    console.error("Error connecting to the database:", err.message);
    process.exit(1);
  }
  console.log("Connected to the database.");
});

export default db;