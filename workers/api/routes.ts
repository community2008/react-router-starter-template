import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import type { R2Bucket } from '@cloudflare/workers-types';
import { D1UserRepository, D1BookRepository, D1NoteRepository } from '../database/d1-repository';
import { CloudflareR2Service } from '../services/r2-service';
import bcrypt from 'bcryptjs';

interface Env {
  DB: D1Database;
  BOOKS_BUCKET: R2Bucket;
  JWT_SECRET: string;
}

// 扩展 Hono 上下文类型，添加我们自定义的键
declare module 'hono' {
  interface ContextVariableMap {
    userRepo: D1UserRepository;
    bookRepo: D1BookRepository;
    noteRepo: D1NoteRepository;
    r2Service: CloudflareR2Service;
  }
}

export const apiRoutes = new Hono<{ Bindings: Env }>();

// 初始化服务
apiRoutes.use('*', async (c, next) => {
  const { DB, BOOKS_BUCKET } = c.env;
  
  // 将服务添加到上下文
  c.set('userRepo', new D1UserRepository(DB));
  c.set('bookRepo', new D1BookRepository(DB));
  c.set('noteRepo', new D1NoteRepository(DB));
  c.set('r2Service', new CloudflareR2Service(BOOKS_BUCKET));
  
  await next();
})

// 用户注册
apiRoutes.post('/register', async (c) => {
  try {
    const userRepo = c.get('userRepo');
    const { email, name, password, role = 'user' } = await c.req.json();
    
    // 检查用户是否已存在
    const existingUser = await userRepo.getUserByEmail(email);
    if (existingUser) {
      return c.text('用户已存在', 400);
    }
    
    // 哈希密码
    const salt = await bcrypt.genSalt(10);
    const password_hash = await bcrypt.hash(password, salt);
    
    // 创建用户
    const user = await userRepo.createUser({ email, name, password_hash, role });
    
    // 不返回密码哈希给客户端
    const { password_hash: _, ...userWithoutPassword } = user;
    return c.json(userWithoutPassword);
  } catch (error) {
    console.error('注册错误:', error);
    return c.text('注册失败，请重试', 500);
  }
});

// 获取所有用户
apiRoutes.get('/users', async (c) => {
  try {
    const userRepo = c.get('userRepo');
    const users = await userRepo.getAllUsers();
    return c.json(users);
  } catch (error) {
    console.error('Error in getAllUsers:', error);
    return c.text('Internal Server Error', 500);
  }
});

// 获取单个用户
apiRoutes.get('/users/:id', async (c) => {
  const userRepo = c.get('userRepo');
  const id = parseInt(c.req.param('id'));
  const user = await userRepo.getUserById(id);
  
  if (!user) {
    return c.text('用户不存在', 404);
  }
  
  return c.json(user);
});

// 删除用户
apiRoutes.delete('/users/:id', async (c) => {
  const userRepo = c.get('userRepo');
  const id = parseInt(c.req.param('id'));
  
  if (isNaN(id)) {
    return c.text('无效的用户ID', 400);
  }
  
  const success = await userRepo.deleteUser(id);
  
  if (!success) {
    return c.text('删除用户失败', 404);
  }
  
  return c.text('用户删除成功', 200);
});

// 更新用户角色
apiRoutes.patch('/users/:id', async (c) => {
  const userRepo = c.get('userRepo');
  const id = parseInt(c.req.param('id'));
  const updates = await c.req.json();
  
  if (isNaN(id)) {
    return c.text('无效的用户ID', 400);
  }
  
  const user = await userRepo.updateUser(id, updates);
  
  if (!user) {
    return c.text('更新用户失败', 404);
  }
  
  return c.json(user);
});

// 用户登录
apiRoutes.post('/login', async (c) => {
  try {
    const userRepo = c.get('userRepo');
    const { email, password } = await c.req.json();
    
    console.log('登录请求:', { email }); // 不要记录密码
    
    // 查找用户
    console.log('开始查找用户:', email);
    const user = await userRepo.getUserByEmail(email);
    console.log('查找用户结果:', user ? '找到用户' : '未找到用户');
    
    if (!user) {
      console.log('登录失败: 用户不存在', email);
      return c.text('用户不存在', 404);
    }
    
    // 验证密码
    console.log('开始验证密码');
    // 类型断言：user.password_hash 在数据库中不可能为 undefined
    const isValidPassword = await bcrypt.compare(password, user.password_hash as string);
    console.log('密码验证结果:', isValidPassword);
    
    if (!isValidPassword) {
      console.log('登录失败: 密码错误', email);
      return c.text('密码错误', 401);
    }
    
    // 不返回密码哈希给客户端
    const { password_hash, ...userWithoutPassword } = user;
    console.log('登录成功:', email);
    return c.json(userWithoutPassword);
  } catch (error) {
    console.error('登录错误:', error);
    console.error('错误详情:', JSON.stringify(error, Object.getOwnPropertyNames(error)));
    return c.text('登录失败，请重试', 500);
  }
});

// 修改密码
apiRoutes.post('/update-password', async (c) => {
  const userRepo = c.get('userRepo');
  const { userId, currentPassword, newPassword } = await c.req.json();
  
  // 查找用户
  const user = await userRepo.getUserById(userId);
  if (!user) {
    return c.text('用户不存在', 404);
  }
  
  // 验证当前密码
    // 类型断言：user.password_hash 在数据库中不可能为 undefined
    const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash as string);
    if (!isValidPassword) {
      return c.text('当前密码错误', 401);
    }
  
  // 哈希新密码
  const salt = await bcrypt.genSalt(10);
  const newPasswordHash = await bcrypt.hash(newPassword, salt);
  
  // 更新密码
  const updatedUser = await userRepo.updateUser(userId, {
    password_hash: newPasswordHash,
    updated_at: new Date().toISOString()
  });
  
  if (!updatedUser) {
    return c.text('修改密码失败', 500);
  }
  
  return c.json({ success: true, message: '密码修改成功' });
});



// 获取书籍列表
apiRoutes.get('/books', async (c) => {
  try {
    const bookRepo = c.get('bookRepo');
    const books = await bookRepo.getAllBooks();
    
    return c.json(books);
  } catch (error) {
    console.error('Error in getAllBooks:', error);
    return c.text('Internal Server Error', 500);
  }
});

// 获取单个书籍
apiRoutes.get('/books/:id', async (c) => {
  const bookRepo = c.get('bookRepo');
  const id = parseInt(c.req.param('id'));
  const book = await bookRepo.getBookById(id);
  
  if (!book) {
    return c.text('书籍不存在', 404);
  }
  
  return c.json(book);
});

// 删除书籍
apiRoutes.delete('/books/:id', async (c) => {
  const bookRepo = c.get('bookRepo');
  const r2Service = c.get('r2Service');
  const id = parseInt(c.req.param('id'));
  
  if (isNaN(id)) {
    return c.text('无效的书籍ID', 400);
  }
  
  // 先获取书籍信息
  const book = await bookRepo.getBookById(id);
  if (!book) {
    return c.text('书籍不存在', 404);
  }
  
  // 从URL中提取文件路径
  const extractPath = (url: string) => {
    const parts = url.split('/api/files/');
    return parts.length > 1 ? parts[1] : '';
  };
  
  // 删除R2存储中的文件
  try {
    if (book.file_url) {
      const bookPath = extractPath(book.file_url);
      if (bookPath) {
        await r2Service.deleteFile(bookPath);
        console.log('删除书籍文件成功:', bookPath);
      }
    }
    
    if (book.cover_url) {
      const coverPath = extractPath(book.cover_url);
      if (coverPath) {
        await r2Service.deleteFile(coverPath);
        console.log('删除封面文件成功:', coverPath);
      }
    }
  } catch (error) {
    console.error('删除R2文件失败:', error);
    // 即使文件删除失败，仍继续删除数据库记录
  }
  
  // 删除数据库记录
  const success = await bookRepo.deleteBook(id);
  
  if (!success) {
    return c.text('删除数据库记录失败', 404);
  }
  
  return c.text('书籍删除成功', 200);
});

// 列出R2存储桶中的书籍文件
apiRoutes.get('/books/files/list', async (c) => {
  const r2Service = c.get('r2Service');
  
  try {
    const files = await r2Service.listFiles('books/');
    
    // 为每个文件生成下载URL
    const filesWithUrl = await Promise.all(files.map(async (file) => {
      return {
        key: file.key,
        size: file.size,
        uploaded: file.uploaded,
        url: `${c.req.url.replace('/api/books/files/list', '/api/files/')}${file.key}`
      };
    }));
    
    return c.json({ files: filesWithUrl });
  } catch (error) {
    console.error('Error listing book files:', error);
    return c.text('获取文件列表失败', 500);
  }
});

// 列出R2存储桶中的笔记文件
apiRoutes.get('/notes/files/list', async (c) => {
  const r2Service = c.get('r2Service');
  
  try {
    const files = await r2Service.listFiles('notes/');
    
    // 为每个文件生成下载URL
    const filesWithUrl = await Promise.all(files.map(async (file) => {
      return {
        key: file.key,
        size: file.size,
        uploaded: file.uploaded,
        url: `${c.req.url.replace('/api/notes/files/list', '/api/files/')}${file.key}`
      };
    }));
    
    return c.json({ files: filesWithUrl });
  } catch (error) {
    console.error('Error listing note files:', error);
    return c.text('获取文件列表失败', 500);
  }
});

// 获取R2存储桶中的文件内容
apiRoutes.get('/files/:path{.*}', async (c) => {
  const r2Service = c.get('r2Service');
  const path = c.req.param('path');
  
  try {
    const file = await c.env.BOOKS_BUCKET.get(path);
    
    if (!file) {
      return c.text('文件不存在', 404);
    }
    
    // 将R2文件转换为ArrayBuffer以避免类型不匹配问题
    const arrayBuffer = await file.arrayBuffer();
    return new Response(arrayBuffer, {
      headers: {
        'Content-Type': file.httpMetadata?.contentType || 'application/octet-stream',
        'Content-Length': file.size.toString(),
        'ETag': file.httpEtag || ''
      }
    });
  } catch (error) {
    console.error('Error getting file:', error);
    return c.text('获取文件失败', 500);
  }
});

// 获取所有笔记
apiRoutes.get('/notes', async (c) => {
  try {
    const noteRepo = c.get('noteRepo');
    const notes = await noteRepo.getAllNotes();
    return c.json(notes);
  } catch (error) {
    console.error('Error in getAllNotes:', error);
    return c.text('Internal Server Error', 500);
  }
});

// 获取单个笔记
apiRoutes.get('/notes/:id', async (c) => {
  const noteRepo = c.get('noteRepo');
  const id = parseInt(c.req.param('id'));
  const note = await noteRepo.getNoteById(id);
  
  if (!note) {
    return c.text('笔记不存在', 404);
  }
  
  return c.json(note);
});

// 删除笔记
apiRoutes.delete('/notes/:id', async (c) => {
  const noteRepo = c.get('noteRepo');
  const r2Service = c.get('r2Service');
  const id = parseInt(c.req.param('id'));
  
  if (isNaN(id)) {
    return c.text('无效的笔记ID', 400);
  }
  
  // 先获取笔记信息
  const note = await noteRepo.getNoteById(id);
  if (!note) {
    return c.text('笔记不存在', 404);
  }
  
  // 笔记没有关联的文件存储，跳过文件删除步骤
  
  // 删除数据库记录
  const success = await noteRepo.deleteNote(id);
  
  if (!success) {
    return c.text('删除数据库记录失败', 404);
  }
  
  return c.text('笔记删除成功', 200);
});

// 更新笔记
apiRoutes.put('/notes/:id', async (c) => {
  try {
    const noteRepo = c.get('noteRepo');
    const id = parseInt(c.req.param('id'));
    const noteData = await c.req.json();
    
    if (isNaN(id)) {
      return c.text('无效的笔记ID', 400);
    }
    
    const updatedNote = await noteRepo.updateNote(id, noteData);
    if (!updatedNote) {
      return c.text('笔记不存在', 404);
    }
    
    return c.json(updatedNote);
  } catch (error) {
    console.error('Error in updateNote:', error);
    return c.text('Internal Server Error', 500);
  }
});

// 创建笔记
apiRoutes.post('/notes', async (c) => {
  try {
    const noteRepo = c.get('noteRepo');
    const noteData = await c.req.json();
    
    // 验证必要字段
    if (!noteData.title || !noteData.content || !noteData.user_id) {
      return c.text('缺少必要字段', 400);
    }
    
    const newNote = await noteRepo.createNote(noteData);
    return c.json(newNote, 201);
  } catch (error) {
    console.error('Error in createNote:', error);
    return c.text('Internal Server Error', 500);
  }
});

// 用户上传笔记文件
apiRoutes.post('/notes/upload', async (c) => {
  try {
    // 处理文件上传
    const formData = await c.req.formData();
    const noteFile = formData.get('noteFile') as File;
    const title = formData.get('title') as string;
    const author = formData.get('author') as string;
    
    if (!noteFile || !title || !author) {
      console.log('上传失败：缺少文件或元数据');
      return c.text('请提供完整信息', 400);
    }
    
    console.log('开始上传文件:', noteFile.name, '大小:', noteFile.size, '类型:', noteFile.type);
    console.log('标题:', title, '作者:', author);
    
    // 上传笔记文件到R2存储桶
    const notePath = `notes/${Date.now()}-${noteFile.name}`;
    
    // 使用上下文（context）中的r2Service
    const r2Service = c.get('r2Service');
    
    if (!r2Service) {
      console.error('R2服务未初始化');
      return c.text('服务未初始化', 500);
    }
    
    console.log('使用R2服务上传文件，路径:', notePath);
    
    // 尝试上传文件
    const uploadedPath = await r2Service.uploadFile(noteFile, notePath, { title, author });
    
    console.log('文件上传成功到R2:', uploadedPath);
    
    // 返回成功信息
    return c.json({
      success: true,
      message: '笔记上传成功',
      path: uploadedPath,
      fileInfo: {
        name: noteFile.name,
        size: noteFile.size,
        type: noteFile.type,
        path: uploadedPath
      }
    });
  } catch (error) {
    console.error('上传错误:', error);
    console.error('错误类型:', typeof error);
    console.error('错误堆栈:', error instanceof Error ? error.stack : 'N/A');
    return c.text(`上传笔记失败: ${error instanceof Error ? error.message : '未知错误'}`, 500);
  }
});

// 获取统计数据
apiRoutes.get('/statistics', async (c) => {
  try {
    const userRepo = c.get('userRepo');
    const bookRepo = c.get('bookRepo');
    const noteRepo = c.get('noteRepo');

    const [users, books, notes] = await Promise.all([
      userRepo.getAllUsers(),
      bookRepo.getAllBooks(),
      noteRepo.getAllNotes()
    ]);

    // 计算最近30天上传的书籍和笔记
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const thirtyDaysAgoISO = thirtyDaysAgo.toISOString();

    const recentBooks = books.filter(book => new Date(book.created_at) >= thirtyDaysAgo).length;
    const recentNotes = notes.filter(note => new Date(note.created_at) >= thirtyDaysAgo).length;

    // 模拟活跃用户（最近30天有登录的用户） - 实际项目中需要在用户表添加last_login_at字段
    const activeUsers = users.length;

    // 获取热门书籍（按创建时间倒序，模拟浏览量）
    const popularBooks = books
      .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
      .slice(0, 3)
      .map((book, index) => ({
        id: book.id,
        title: book.title,
        author: book.author,
        views: Math.floor(Math.random() * 150) + 50, // 模拟浏览量
        rating: Math.floor(Math.random() * 5) + 1 // 模拟评分 (1-5)
      }));

    const stats = {
      total_users: users.length,
      total_books: books.length,
      total_notes: notes.length,
      active_users: activeUsers,
      recent_books: recentBooks,
      recent_notes: recentNotes,
      popular_books: popularBooks
    };

    return c.json(stats);
  } catch (error) {
    console.error('Error in statistics:', error);
    return c.text('Internal Server Error', 500);
  }
});

// 管理员工具上传书籍文件
apiRoutes.post('/admin/upload-book', async (c) => {
  const bookRepo = c.get('bookRepo');
  const r2Service = c.get('r2Service');
  
  try {
    // 处理文件上传
    const formData = await c.req.formData();
    const title = formData.get('title') as string;
    const author = formData.get('author') as string;
    const description = formData.get('description') as string;
    const bookFile = formData.get('bookFile') as File;
    const coverFile = formData.get('coverFile') as File;
    const userId = formData.get('userId') as string;
    
    if (!bookFile || !title || !author || !userId) {
      console.log('上传书籍失败：缺少必填字段');
      return c.text('请提供完整信息', 400);
    }
    
    console.log('开始上传书籍:', bookFile.name, '大小:', bookFile.size, '类型:', bookFile.type);
    console.log('标题:', title, '作者:', author, '描述:', description, '用户ID:', userId);
    if (coverFile) {
      console.log('封面文件:', coverFile.name, '大小:', coverFile.size, '类型:', coverFile.type);
    }
    
    // 上传书籍文件
    const bookPath = `books/${Date.now()}-${bookFile.name}`;
    await r2Service.uploadFile(bookFile, bookPath);
    console.log('书籍文件上传成功到R2:', bookPath);
    
    // 上传封面图片（如果有）
    let coverPath = '';
    if (coverFile) {
      coverPath = `covers/${Date.now()}-${coverFile.name}`;
      await r2Service.uploadFile(coverFile, coverPath);
      console.log('封面图片上传成功到R2:', coverPath);
    }
    
    // 获取文件URL
    const bookUrl = `${c.req.url.replace('/api/admin/upload-book', '/api/files/')}${bookPath}`;
    const coverUrl = coverPath ? `${c.req.url.replace('/api/admin/upload-book', '/api/files/')}${coverPath}` : '';
    
    // 保存书籍信息到数据库
    const book = await bookRepo.createBook({
      title,
      author,
      description,
      cover_url: coverUrl,
      file_url: bookUrl,
      uploaded_by: parseInt(userId)
    });
    
    console.log('书籍信息保存成功到数据库:', book.id);
    return c.json(book);
  } catch (error) {
    console.error('上传书籍错误:', error);
    return c.text(`上传书籍失败: ${error instanceof Error ? error.message : '未知错误'}`, 500);
  }
});