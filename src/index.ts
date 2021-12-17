import App from './core/App';

import 'dotenv/config';
import './db';

import CategoryController from './controllers/Category';
import ProductController from './controllers/Product';
import UserController from './controllers/User';
import OrderController from './controllers/Order';

const port = parseInt(process.env.PORT as string) || 8000;

const controllers = [
  new UserController(),
  new CategoryController(),
  new ProductController(),
  new OrderController(),
]

const app = new App(controllers, port);
app.listen();
