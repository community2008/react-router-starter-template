import type { D1Database } from '@cloudflare/workers-types';
import type { User, UserInput, UserRepository } from '../../app/models/user';
import type { Book, BookInput, BookRepository } from '../../app/models/book';
import type { Note, NoteInput, NoteRepository } from '../../app/models/note';

// 用户数据库操作实现
export class D1UserRepository implements UserRepository {
  constructor(private db: D1Database) {}

  async createUser(user: Omit<UserInput, 'password'> & { password_hash: string }): Promise<User> {
    const { email, name, password_hash, role = 'user' } = user;
    
    const result = await this.db.prepare(
      'INSERT INTO users (email, name, password_hash, role) VALUES (?, ?, ?, ?) RETURNING *'
    ).bind(email, name, password_hash, role).first<User>();

    if (!result) {
      throw new Error('Failed to create user');
    }

    return result;
  }

  async getUserById(id: number): Promise<User | null> {
    return await this.db.prepare('SELECT * FROM users WHERE id = ?').bind(id).first<User>();
  }

  async getUserByEmail(email: string): Promise<User | null> {
    return await this.db.prepare('SELECT * FROM users WHERE email = ?').bind(email).first<User>();
  }

  async getAllUsers(): Promise<User[]> {
    try {
      const result = await this.db.prepare('SELECT * FROM users ORDER BY created_at DESC').all<User>();
      // 返回结果中的 results 属性
      return (result as any).results || [];
    } catch (error) {
      console.error('Error in getAllUsers:', error);
      return [];
    }
  }

  async updateUser(id: number, updates: Partial<User>): Promise<User | null> {
    // 构建更新语句
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);

    const result = await this.db.prepare(
      `UPDATE users SET ${setClause} WHERE id = ? RETURNING *`
    ).bind(...values).first<User>();

    return result;
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM users WHERE id = ?').bind(id).run();
    // D1Result 类型的 run() 方法返回的是 D1RunResult，包含 success 和 changes
    return result.success && (result as any).changes > 0;
  }
}

// 书籍数据库操作实现
export class D1BookRepository implements BookRepository {
  constructor(private db: D1Database) {}

  async createBook(book: BookInput): Promise<Book> {
    const { title, author, description, cover_url, file_url, uploaded_by } = book;
    
    const result = await this.db.prepare(
      'INSERT INTO books (title, author, description, cover_url, file_url, uploaded_by) VALUES (?, ?, ?, ?, ?, ?) RETURNING *'
    ).bind(title, author, description, cover_url, file_url, uploaded_by).first<Book>();

    if (!result) {
      throw new Error('Failed to create book');
    }

    return result;
  }

  async getBookById(id: number): Promise<Book | null> {
    return await this.db.prepare('SELECT * FROM books WHERE id = ?').bind(id).first<Book>();
  }

  async getAllBooks(): Promise<Book[]> {
    try {
      const result = await this.db.prepare('SELECT * FROM books ORDER BY created_at DESC').all<Book>();
      console.log('getAllBooks result:', JSON.stringify(result, null, 2));
      // 返回结果中的 results 属性
      return (result as any).results || [];
    } catch (error) {
      console.error('Error in getAllBooks:', error);
      return [];
    }
  }

  async updateBook(id: number, updates: Partial<Book>): Promise<Book | null> {
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);

    const result = await this.db.prepare(
      `UPDATE books SET ${setClause} WHERE id = ? RETURNING *`
    ).bind(...values).first<Book>();

    return result;
  }

  async deleteBook(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM books WHERE id = ?').bind(id).run();
    // D1Result 类型的 run() 方法返回的是 D1RunResult，包含 success 和 changes
    return result.success && (result as any).changes > 0;
  }
}

// 笔记数据库操作实现
export class D1NoteRepository implements NoteRepository {
  constructor(private db: D1Database) {}

  async createNote(note: NoteInput): Promise<Note> {
    const { title, content, book_id, user_id } = note;
    
    const result = await this.db.prepare(
      'INSERT INTO notes (title, content, book_id, user_id) VALUES (?, ?, ?, ?) RETURNING *'
    ).bind(title, content, book_id, user_id).first<Note>();

    if (!result) {
      throw new Error('Failed to create note');
    }

    return result;
  }

  async getNoteById(id: number): Promise<Note | null> {
    return await this.db.prepare('SELECT * FROM notes WHERE id = ?').bind(id).first<Note>();
  }

  async getAllNotes(): Promise<Note[]> {
    try {
      const result = await this.db.prepare('SELECT * FROM notes ORDER BY created_at DESC').all<Note>();
      // 返回结果中的 results 属性
      return (result as any).results || [];
    } catch (error) {
      console.error('Error in getAllNotes:', error);
      return [];
    }
  }

  async getNotesByBookId(book_id: number): Promise<Note[]> {
    try {
      const result = await this.db.prepare('SELECT * FROM notes WHERE book_id = ? ORDER BY created_at DESC').bind(book_id).all<Note>();
      // 返回结果中的 results 属性
      return (result as any).results || [];
    } catch (error) {
      console.error('Error in getNotesByBookId:', error);
      return [];
    }
  }

  async getNotesByUserId(userId: number): Promise<Note[]> {
    try {
      const result = await this.db.prepare('SELECT * FROM notes WHERE user_id = ? ORDER BY created_at DESC').bind(userId).all<Note>();
      // 返回结果中的 results 属性
      return (result as any).results || [];
    } catch (error) {
      console.error('Error in getNotesByUserId:', error);
      return [];
    }
  }

  async updateNote(id: number, updates: Partial<Note>): Promise<Note | null> {
    const setClause = Object.keys(updates).map(key => `${key} = ?`).join(', ');
    const values = Object.values(updates);
    values.push(id);

    const result = await this.db.prepare(
      `UPDATE notes SET ${setClause} WHERE id = ? RETURNING *`
    ).bind(...values).first<Note>();

    return result;
  }

  async deleteNote(id: number): Promise<boolean> {
    const result = await this.db.prepare('DELETE FROM notes WHERE id = ?').bind(id).run();
    // D1Result 类型的 run() 方法返回的是 D1RunResult，包含 success 和 changes
    return result.success && (result as any).changes > 0;
  }
}