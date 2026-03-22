import express from 'express';
import cors from 'cors';

import getMenuRoute from './routes/get_menu.js';
import postMenuRoute from './routes/post_menu.js';
import putMenuRoute from "./routes/put_menu.js";
import patchMenuRoute from './routes/patch_menu.js';
import deleteMenuRoute from './routes/delete_menu.js';

const app = express();
app.use(cors());
app.use(express.json());

const port = 3000;

app.use("/api/routes/menus", [
  getMenuRoute, 
  postMenuRoute, 
  putMenuRoute, 
  patchMenuRoute, 
  deleteMenuRoute
]);

app.listen(port, () => {
  console.log(`🟢 [SERVER] is running on http://localhost:${port}`);
});