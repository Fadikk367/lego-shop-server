import App from './core/App';

import 'dotenv/config';
import './db';

import CategoryController from './controllers/Category';

const port = parseInt(process.env.PORT as string) || 8000;

const controllers = [
  new CategoryController(),
]

const app = new App(controllers, port);
app.listen();
