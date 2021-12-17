import { Request, Response, NextFunction } from 'express';

import Controller from "../core/Controller";
import ProductService from '../services/Product';

class ProductController extends Controller {
  private productService = ProductService.getInstance();

  constructor() {
    super('products');

    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    this.router.get('/', this.getProducts);
    this.router.get('/most-rated', this.mostRated);
    this.router.get('/:id', this.getOne);
    this.router.post('/', this.createProduct);
    this.router.post('/:id/rate', this.rateProduct);
    this.router.get('/:id/also-bought', this.alsoBought);
  }

  private createProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const productData = req.body;
  
    try {
      const result = await this.productService.createProduct(productData);
      res.status(201).json(result);
    } catch(err) {
      next(err);
    }
  }

  private getOne = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const productId = parseInt(req.params.id);
    try {
      const result = await this.productService.getOne(productId);
      res.json(result);
    } catch(err) {
      next(err);
    }
  }

  private getProducts = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.productService.getAllProducts();
      res.json(result);
    } catch(err) {
      next(err);
    }
  }

  private rateProduct = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const productId = parseInt(req.params.id);
    const {userId, value} = req.body;

    try {
      const result = await this.productService.rateProduct(productId, userId, value);
      res.json(result);
    } catch(err) {
      next(err);
    }
  }

  private mostRated = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
      const result = await this.productService.mostRated(5);
      res.json(result);
    } catch(err) {
      next(err);
    }
  }

  private alsoBought = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const productId = parseInt(req.params.id);

    try {
      const result = await this.productService.alsoBought(productId);
      res.json(result);
    } catch(err) {
      next(err);
    }
  }
}


export default ProductController;