export interface Book {
  id: number;
  title: string;
  author: string;
  description: string;
  cover_url: string;
  file_url: string;
  uploaded_by: number;
  created_at: string;
}

export interface BookInput {
  title: string;
  author: string;
  description: string;
  cover_url: string;
  file_url: string;
  uploaded_by: number;
}

// 数据库操作接口
export interface BookRepository {
  createBook(book: BookInput): Promise<Book>;
  getBookById(id: number): Promise<Book | null>;
  getAllBooks(): Promise<Book[]>;
  updateBook(id: number, updates: Partial<Book>): Promise<Book | null>;
  deleteBook(id: number): Promise<boolean>;
}