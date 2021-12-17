import bcrypt from 'bcryptjs';

import getSession from '../db';

export interface User {
  id: number;
  name: string;
  email: string;
  password?: string;
}

export interface CreateUser {
  name: string;
  email: string;
  password: string;
}

export interface Credentials {
  email: string;
  password: string;
}

class UserService {
  private static instance: UserService | undefined;

  private constructor() {}

  public static getInstance(): UserService {
    if (!UserService.instance) {
      UserService.instance = new UserService();
    }

    return UserService.instance;
  }

  async createUser(userData: CreateUser): Promise<User> {
    const session = getSession();
    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(userData.password, salt);

    try {
      const result = await session.run(
        'CREATE (u:User {name: $name, email: $email, password: $password}) RETURN ID(u) as id, u.name as name, u.email as email', 
        { ...userData, password: passwordHash },
      );
  
      const users = result.records.map(record => {
        return {
          id: record.get('id').toNumber(),
          name: record.get('name'),
          email: record.get('email'),
        };
      })
  
      return users[0];
    } catch (_) {
      throw new Error('Failed to query db');
    } finally {
      session.close();
    }
  }

  async loginUser(credentials: Credentials): Promise<User> {
    const session = getSession();

    try {
      const result = await session.run(
        'MATCH (u:User {email: $email}) RETURN ID(u) as id, u.name as name, u.email as email, u.password as password',
        { email: credentials.email },
      );
  
      const users: User[] = result.records.map(record => {
        return {
          id: record.get('id').toNumber(),
          name: record.get('name'),
          email: record.get('email'),
          password: record.get('password'),
        }
      });
  
      const user = users[0];

      const isValidPassword = await bcrypt.compare(credentials.password, user.password as string);

      if (isValidPassword) {
        return { ...user, password: undefined };
      } else {
        throw new Error('Invalid password');
      }
    } catch (_) {
      throw new Error('Failed to query db');
    } finally {
      session.close();
    }
  }
}

export default UserService;
