import express from 'express';

export default abstract class Controller {
  protected path: string;
  protected router = express.Router();

  constructor(path: string) {
    this.path = path;
  }

  public getPath(): string {
    return this.path;
  }

  public getRouter(): express.Router {
    return this.router;
  }

  protected abstract initializeRoutes(): void;
}
