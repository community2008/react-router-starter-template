export interface Note {
  id: number;
  title: string;
  content: string;
  book_id: number;
  user_id: number;
  created_at: string;
  updated_at: string;
}

export interface NoteInput {
  title: string;
  content: string;
  book_id: number;
  user_id: number;
}

// 数据库操作接口
export interface NoteRepository {
  createNote(note: NoteInput): Promise<Note>;
  getNoteById(id: number): Promise<Note | null>;
  getAllNotes(): Promise<Note[]>;
  getNotesByBookId(book_id: number): Promise<Note[]>;
  getNotesByUserId(user_id: number): Promise<Note[]>;
  updateNote(id: number, updates: Partial<Note>): Promise<Note | null>;
  deleteNote(id: number): Promise<boolean>;
}