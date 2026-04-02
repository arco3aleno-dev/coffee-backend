import express from 'express';
import cors from 'cors';

import getMenuRoute from './routes/get_menu.js';
import postMenuRoute from './routes/post_menu.js';
import putMenuRoute from "./routes/put_menu.js";
import patchMenuRoute from './routes/patch_menu.js';
import deleteMenuRoute from './routes/delete_menu.js';

import getCustomerRoute from './routes/get_customer.js';
import postCustomerRoute from './routes/post_customer.js';

import getToppingsRoute from './routes/get_topping.js';
import postOrderRoute from './routes/post_order.js';

const app = express();
app.use(cors());
app.use(express.json());

const port = 3000;

app.use("/api/menus", [
  getMenuRoute, 
  postMenuRoute, 
  putMenuRoute, 
  patchMenuRoute, 
  deleteMenuRoute
]);

app.use("/api/customers", [
  getCustomerRoute, 
  postCustomerRoute
]);

app.use("/api/toppings", getToppingsRoute);

app.use("/api/orders", postOrderRoute);

app.listen(port, () => {
  console.log(`เซิร์ฟเวอร์กำลังทำงานอยู่ที่ : http://localhost:${port}`);
});