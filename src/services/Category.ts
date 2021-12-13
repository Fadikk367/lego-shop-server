import session from '../db';

export interface Category {
  id: number;
  name: string;
}


class CategoryService {
  private static instance: CategoryService | undefined;

  private constructor() {}

  public static getInstance(): CategoryService {
    if (!CategoryService.instance) {
      CategoryService.instance = new CategoryService();
    }

    return CategoryService.instance;
  }

  async createCategory(name: string): Promise<Category> {
    const result = await session.run(
      'CREATE (category:Category {name: $categoryName}) RETURN ID(category) as id, category.name as name', 
      { categoryName: name },
    );

    const records = result.records.map(record => {
      return {
        id: record.get('id').toNumber(),
        name: record.get('name'),
      };
    })

    return records[0];
  }

  async getAllCategories(): Promise<Category[]> {
    const result = await session.run('MATCH (category:Category) RETURN ID(category) as id, category.name as name');

    const categories: Category[] = result.records.map(record => {
      return {
        id: record.get('id').toNumber(),
        name: record.get('name'),
      }
    });

    return categories;
  }
}

export default CategoryService;
