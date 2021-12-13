import { Request, Response, NextFunction } from 'express';

import Controller from "../core/Controller";
import CategoryService, { Category } from '../services/Category';

class CategoryController extends Controller {
  private categoryService = CategoryService.getInstance();

  constructor() {
    super('categories');

    this.initializeRoutes();
  }

  protected initializeRoutes(): void {
    this.router.get('/', this.getCategories);
    this.router.post('/', this.createCategory);
  }

  private createCategory = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    const categoryName = req.body.name;
  
    try {
      const result = await this.categoryService.createCategory(categoryName);
      res.status(201).json(result);
    } catch(err) {
      next(err);
    }
  }

  private getCategories = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    console.log({body: req.body});

    try {
      const result = await this.categoryService.getAllCategories();
      res.json(result);
    } catch(err) {
      next(err);
    }
  }
}


export default CategoryController;