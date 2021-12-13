import App from './core/App';

import 'dotenv/config';
import './db';

const port = parseInt(process.env.PORT as string) || 8000;

const app = new App([], port);
app.listen();
