import getSession from '../db';

export interface Product {
  id: number;
  name: string;
  price: number;
  category: string;
  elements: number;
  minifigures: number;
  imageUrl: string;
}

export interface CreateProduct {
  name: string;
  price: number;
  categoryId: number;
  elements: number;
  minifigures: number;
  imageUrl: string;
}

export interface ProductRate {
  id: number;
  value: number;
}

class ProductService {
  private static instance: ProductService | undefined;

  private constructor() {}

  public static getInstance(): ProductService {
    if (!ProductService.instance) {
      ProductService.instance = new ProductService();
    }

    return ProductService.instance;
  }

  async createProduct(productData: CreateProduct): Promise<Product> {
    const session = getSession();

    try {
      const result = await session.run(
        `MATCH (c:Category) 
         WHERE ID(c) = $categoryId 
         CREATE (c) <-[r:BELONGS_TO]- (p:Product {name: $name, price: $price, elements: $elements,   minifigures: $minifigures, imageUrl: $imageUrl})
         RETURN ID(p) as id, c.name as category`, 
        { ...productData },
      );
  
      const products = result.records.map(record => {
        return {
          ...productData,
          id: record.get('id').toNumber(),
          category: record.get('category'),
        };
      })
  
      return products[0];
    } catch (_) {
      throw new Error('Failed to query db');
    } finally {
      session.close();
    }
  }

  async getOne(productId: number): Promise<Product> {
    const session = getSession();

    try {
      const result = await session.run(
        `MATCH (p:Product) WHERE ID(p) = $productId
         MATCH (p)--(c:Category) 
         RETURN ID(p) as id, p.name as name, p.price as price, p.minifigures as minifigures, p.elements as elements, p.imageUrl as imageUrl, c.name as category`,
         { productId }
      );
  
      const products: Product[] = result.records.map(record => {
        return {
          id: record.get('id').toNumber(),
          name: record.get('name'),
          price: record.get('price'),
          elements: record.get('elements'),
          minifigures: record.get('minifigures'),
          category: record.get('category'),
          imageUrl: record.get('imageUrl'),
        }
      });
  
      return products[0];
    } catch (_) {
      throw new Error('Failed to query db');
    } finally {
      session.close();
    }
  }

  async getAllProducts(): Promise<Product[]> {
    const session = getSession();

    try {
      const result = await session.run(
        `MATCH (p:Product)--(c:Category) 
         RETURN ID(p) as id, p.name as name, p.price as price, p.minifigures as minifigures, p.elements as elements, p.imageUrl as imageUrl, c.name as category`
      );
  
      const products: Product[] = result.records.map(record => {
        return {
          id: record.get('id').toNumber(),
          name: record.get('name'),
          price: record.get('price'),
          elements: record.get('elements'),
          minifigures: record.get('minifigures'),
          category: record.get('category'),
          imageUrl: record.get('imageUrl'),
        }
      });
  
      return products;
    } catch (_) {
      throw new Error('Failed to query db');
    } finally {
      session.close();
    }
  }

  async rateProduct(productId: number, userId: number, value: number): Promise<ProductRate> {
    const session = getSession();

    try {
      const result = await session.run(
        `MATCH (p:Product) WHERE ID(p) = $productId
         MATCH (u:User) WHERE ID(u) = $userId
         MERGE (u)-[r:RATES]->(p)
         SET r.value = $value
         RETURN ID(r) as id`,
         { productId, userId, value}
      );
  
      const rates: ProductRate[] = result.records.map(record => {
        return {
          id: record.get('id').toNumber(),
          value,
        }
      });
  
      return rates[0];
    } catch (_) {
      throw new Error('Failed to query db');
    } finally {
      session.close();
    }
  }

  async mostRated(limit: number): Promise<Product[]> {
    const session = getSession();

    try {
      const result = await session.run(
        `MATCH (p:Product)<-[r:RATES]-(u:User)
         WITH p, AVG(r.value) as rating
         RETURN ID(p) as id, p.name as name, p.price as price, p.elements as elements, p.minifigures as minifigures, p.category as category, p.imageUrl as imageUrl, rating
         ORDER BY rating DESC LIMIT 5`,
         { limit }
      );
  
      const products: Product[] = result.records.map(record => {
        return {
          id: record.get('id').toNumber(),
          name: record.get('name'),
          price: record.get('price'),
          elements: record.get('elements'),
          minifigures: record.get('minifigures'),
          category: record.get('category'),
          imageUrl: record.get('imageUrl'),
        }
      });
  
      return products;
    } catch (_) {
      throw new Error('Failed to query db');
    } finally {
      session.close();
    }
  }

  async alsoBought(productId: number): Promise<Product[]> {
    const session = getSession();

    try {
      const result = await session.run(
        `MATCH (p:Product) WHERE ID(p) = $productId
         MATCH (p)<-[:CONTAINS]-(o:Order)-[:CONTAINS]->(rec:Product) 
         RETURN ID(rec) as id, rec.name as name, rec.price as price, rec.elements as elements, rec.minifigures as minifigures, rec.category as category, rec.imageUrl as imageUrl, COUNT(*) as numberOfOrders 
         ORDER BY numberOfOrders DESC LIMIT 5`,
         { productId }
      );
  
      const products: Product[] = result.records.map(record => {
        return {
          id: record.get('id').toNumber(),
          name: record.get('name'),
          price: record.get('price'),
          elements: record.get('elements'),
          minifigures: record.get('minifigures'),
          category: record.get('category'),
          imageUrl: record.get('imageUrl'),
        }
      });
  
      return products;
    } catch (_) {
      throw new Error('Failed to query db');
    } finally {
      session.close();
    }
  }
}

export default ProductService;



/**
 * Srednie ocen dla produktow:
 * MATCH (p:Product)<-[r:RATES]-(u:User)
 * WITH p, AVG(r.value) as rating
 * RETURN p.name as name, rating
 * ORDER BY rating DESC 
 * 
 * Liczba zamowien dla danego produktu
 * MATCH (p:Product)<-[:CONTAINS]-(o:Order) RETURN p.name as name, COUNT(*)
 * 
 * Inni w zamowieniach z tym produktem kupwoali rowniez:
 * MATCH (p:Product {name: 'Bookshop'})<-[:CONTAINS]-(o:Order)-[:CONTAINS]->(rec:Product) RETURN rec.name, COUNT(*) as numberOfOrders * ORDER BY numberOfOrders DESC LIMIT 5
 */