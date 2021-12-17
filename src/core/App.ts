import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import Controller from './Controller';

export default class App {
  public app: express.Application;
  public port: number;

  constructor(controllers: Controller[], port: number) {
    this.app = express();
    this.port = port;

    this.initializeMiddlewares();
    this.app.get('/', (_, res) => { res.json({ message: 'Welcome to LEGO recommendation api'}) });
    this.initializeControllers(controllers);
  }

  public listen(): void {
    this.app.listen(this.port, () => {
      console.log(`Server is listening on port ${this.port}`);
    });
  }

  private initializeMiddlewares(): void {
    this.app.use(morgan('common'));
    this.app.use(cors());
    this.app.use(express.json());
  }

  private initializeControllers(controllers: Controller[]): void {
    for (const controller of controllers) {
      this.app.use(`/${controller.getPath()}`, controller.getRouter());
    }
  }
}
