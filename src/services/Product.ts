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
         MATCH (p)<-[:CONTAINS]-(o:Order)-[:CONTAINS]->(rec:Product) WHERE rec <> p
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

  async recommendedForUser(userId: number): Promise<Product[]> {
    const session = getSession();

    try {
      const result = await session.run(
        `
        MATCH (u1:User) WHERE ID(u1) = $userId
        MATCH (u1)-[r:RATES]->(p:Product)
        WITH u1, avg(r.value) AS u1_mean
        
        MATCH (u1)-[r1:RATES]->(p:Product)<-[r2:RATES]-(u2)
        WITH u1, u1_mean, u2, COLLECT({r1: r1, r2: r2}) AS ratings WHERE size(ratings) > 1
        
        MATCH (u2)-[r:RATES]->(p:Product)
        WITH u1, u1_mean, u2, avg(r.value) AS u2_mean, ratings
        
        UNWIND ratings AS r
        
        WITH sum( (r.r1.value-u1_mean) * (r.r2.value-u2_mean) ) AS nom,
             sqrt( sum( (r.r1.value - u1_mean)^2) * sum( (r.r2.value - u2_mean) ^2)) AS denom,
             u1, u2 WHERE denom <> 0
        
        WITH u1, u2, nom/denom AS pearson
        ORDER BY pearson DESC LIMIT 10
        
        MATCH (u2)-[r:RATES]->(p:Product) WHERE NOT EXISTS( (u1)-[:RATES]->(p) )
        
        RETURN ID(p) as id, p.name as name, p.price as price, p.elements as elements, p.minifigures as minifigures, p.category as category, p.imageUrl as imageUrl, SUM( pearson * r.value) AS score
        ORDER BY score DESC LIMIT 5`,
         { userId }
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
