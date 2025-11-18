export interface User {
  id: number;
  email: string;
  name: string;
  password_hash?: string; // 可选，因为API返回时会过滤掉这个字段
  role: 'user' | 'admin';
  created_at: string;
  updated_at: string;
}

export interface UserInput {
  email: string;
  name: string;
  password: string;
  role?: 'user' | 'admin';
}

export interface LoginInput {
  email: string;
  password: string;
}

// 数据库操作接口
export interface UserRepository {
  createUser(user: Omit<UserInput, 'password'> & { password_hash: string }): Promise<User>;
  getUserById(id: number): Promise<User | null>;
  getUserByEmail(email: string): Promise<User | null>;
  updateUser(id: number, updates: Partial<User>): Promise<User | null>;
  deleteUser(id: number): Promise<boolean>;
}