import { Request, Response, NextFunction } from 'express';

import Controller from "../core/Controller";
import OrderService from '../services/Order';

class OrderController extends Controller {
  private orderService = OrderService.getInstance();

  constructor() {
    super('orders');

    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    this.router.post('/', this.placeOrder);
    this.router.get('/history', this.getOrderHistory);
  }

  private placeOrder = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const order = req.body;
  
    try {
      const result = await this.orderService.placeOrder(order);
      res.status(201).json(result);
    } catch(err) {
      next(err);
    }
  }

  private getOrderHistory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const userId = req.query.user as string;
  
    try {
      const result = await this.orderService.orderHistory(parseInt(userId));
      res.status(201).json(result);
    } catch(err) {
      next(err);
    }
  }
}


export default OrderController;