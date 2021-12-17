import { query } from 'express';
import { Node } from 'neo4j-driver';
import getSession from '../db';
import { Product } from './Product';

export interface PlacedOrder {
  id: number;
  time: number;
  products: Product[];
}

export interface Order {
  userId: number;
  products: Product[];
}


class OrderService {
  private static instance: OrderService | undefined;

  private constructor() {}

  public static getInstance(): OrderService {
    if (!OrderService.instance) {
      OrderService.instance = new OrderService();
    }

    return OrderService.instance;
  }

  async placeOrder({ userId, products}: Order): Promise<PlacedOrder> {
    const session = getSession();

    try {
      const productIds = products.map(product => product.id);
      const time = Date.now();
    
      const result = await session.run(
        `CREATE (o:Order)
         WITH o
         MATCH (u:User) WHERE ID(u) = $userId
         WITH o, u
         CREATE (u)-[:PLACED {time: $time}]->(o)
         WITH o, u
         MATCH products=(p:Product) WHERE ID(p) IN $productIds
         FOREACH (pr IN NODES(products) | CREATE (o)-[r:CONTAINS]->(pr))
         RETURN ID(o) as id`, 
        { userId, time, productIds },
      );
  
      const records = result.records.map(record => {
        return {
          id: record.get('id').toNumber(),
          products,
          time,
        };
      })
  
      return records[0];
    } catch (err) {
      throw new Error('Failed to query db');
    } finally {
      session.close();
    }
  }

  async orderHistory(userId: number): Promise<PlacedOrder[]> {
    const session = getSession();

    try {
      const result = await session.run(
        `MATCH (u:User) WHERE ID(u) = $userId
         MATCH (u)-[pl:PLACED]->(o:Order)-[:CONTAINS]->(pr:Product)
         OPTIONAL MATCH (pr)<-[r:RATES]-(u)
         RETURN ID(o) as id, pl.time as time, COLLECT(pr{.*, id: ID(pr), rate: r.value}) as products`, 
        { userId },
      );
  
      const records = result.records.map(record => {
        return {
          id: record.get('id').toNumber(),
          time: record.get('time'),
          products: record.get('products').map((product: any) => ({...product, id: product.id.toNumber()})),
        };
      });

      return records;
    } catch (err) {
      throw new Error('Failed to query db');
    } finally {
      session.close();
    }
  }
}

export default OrderService;
