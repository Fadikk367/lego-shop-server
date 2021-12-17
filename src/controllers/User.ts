import { Request, Response, NextFunction } from 'express';

import Controller from "../core/Controller";
import UserService from '../services/User';

class UserController extends Controller {
  private userService = UserService.getInstance();

  constructor() {
    super('users');

    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    this.router.post('/register', this.register);
    this.router.post('/login', this.login);
  }

  private register = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userData = req.body;
  
    try {
      const result = await this.userService.createUser(userData);
      res.status(201).json(result);
    } catch(err) {
      next(err);
    }
  }

  private login = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const credentials = req.body;
  
    try {
      const result = await this.userService.loginUser(credentials);
      res.json(result);
    } catch(err) {
      next(err);
    }
  }
}


export default UserController;