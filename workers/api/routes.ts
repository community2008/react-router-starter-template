import { Hono } from 'hono';
import type { D1Database } from '@cloudflare/workers-types';
import type { R2Bucket } from '@cloudflare/workers-types';
import { D1UserRepository } from '../database/d1-repository';
import { D1BookRepository } from '../database/d1-repository';
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
  c.set('r2Service', new CloudflareR2Service(BOOKS_BUCKET));
  
  await next();
});

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

// 用户登录
apiRoutes.post('/login', async (c) => {
  try {
    const userRepo = c.get('userRepo');
    const { email, password } = await c.req.json();
    
    // 查找用户
    const user = await userRepo.getUserByEmail(email);
    if (!user) {
      return c.text('用户不存在', 404);
    }
    
    // 验证密码
    const isValidPassword = await bcrypt.compare(password, user.password_hash);
    if (!isValidPassword) {
      return c.text('密码错误', 401);
    }
    
    // 不返回密码哈希给客户端
    const { password_hash, ...userWithoutPassword } = user;
    return c.json(userWithoutPassword);
  } catch (error) {
    console.error('登录错误:', error);
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
  const isValidPassword = await bcrypt.compare(currentPassword, user.password_hash);
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

// 上传书籍（管理员专用）
apiRoutes.post('/admin/upload-book', async (c) => {
  const bookRepo = c.get('bookRepo');
  const r2Service = c.get('r2Service');
  
  // 验证用户身份（这里应该使用JWT验证，暂时简化）
  const { userId, role } = await c.req.json();
  if (role !== 'admin') {
    return c.text('无权限', 403);
  }
  
  // 处理文件上传
  const formData = await c.req.formData();
  const title = formData.get('title') as string;
  const author = formData.get('author') as string;
  const description = formData.get('description') as string;
  const bookFile = formData.get('bookFile') as File;
  const coverFile = formData.get('coverFile') as File;
  
  // 上传书籍文件
  const bookPath = `books/${Date.now()}-${bookFile.name}`;
  await r2Service.uploadFile(bookFile, bookPath);
  
  // 上传封面图片（如果有）
  let coverPath = '';
  if (coverFile) {
    coverPath = `covers/${Date.now()}-${coverFile.name}`;
    await r2Service.uploadFile(coverFile, coverPath);
  }
  
  // 获取文件URL
  const bookUrl = await r2Service.getFileUrl(bookPath);
  const coverUrl = coverPath ? await r2Service.getFileUrl(coverPath) : '';
  
  // 保存书籍信息到数据库
  const book = await bookRepo.createBook({
    title,
    author,
    description,
    cover_url: coverUrl,
    file_url: bookUrl,
    uploaded_by: userId
  });
  
  return c.json(book);
});

// 获取书籍列表
apiRoutes.get('/books', async (c) => {
  const bookRepo = c.get('bookRepo');
  const books = await bookRepo.getAllBooks();
  
  return c.json(books);
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

// 用户上传笔记文件
apiRoutes.post('/notes/upload', async (c) => {
  const r2Service = c.get('r2Service');
  const userRepo = c.get('userRepo');
  
  try {
    // 验证用户身份
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.text('未授权', 401);
    }
    
    const token = authHeader.replace('Bearer ', '');
    // 这里应该验证JWT token，暂时简化为检查用户是否存在
    
    // 处理文件上传
    const formData = await c.req.formData();
    const noteFile = formData.get('noteFile') as File;
    const title = formData.get('title') as string;
    const author = formData.get('author') as string;
    
    if (!noteFile || !title || !author) {
      return c.text('请提供完整信息', 400);
    }
    
    // 上传笔记文件到R2存储桶
    const notePath = `notes/${Date.now()}-${noteFile.name}`;
    await r2Service.uploadFile(noteFile, notePath);
    
    // 返回成功信息
    return c.json({
      success: true,
      message: '笔记上传成功',
      path: notePath
    });
  } catch (error) {
    console.error('Error uploading note:', error);
    return c.text('上传笔记失败', 500);
  }
});

// 管理员上传书籍文件
apiRoutes.post('/admin/upload-book', async (c) => {
  const bookRepo = c.get('bookRepo');
  const r2Service = c.get('r2Service');
  
  try {
    // 验证用户身份（这里应该使用JWT验证，暂时简化）
    const authHeader = c.req.header('Authorization');
    if (!authHeader) {
      return c.text('未授权', 401);
    }
    
    // 处理文件上传
    const formData = await c.req.formData();
    const title = formData.get('title') as string;
    const author = formData.get('author') as string;
    const description = formData.get('description') as string;
    const bookFile = formData.get('bookFile') as File;
    const coverFile = formData.get('coverFile') as File;
    const userId = formData.get('userId') as string;
    
    // 上传书籍文件
    const bookPath = `books/${Date.now()}-${bookFile.name}`;
    await r2Service.uploadFile(bookFile, bookPath);
    
    // 上传封面图片（如果有）
    let coverPath = '';
    if (coverFile) {
      coverPath = `covers/${Date.now()}-${coverFile.name}`;
      await r2Service.uploadFile(coverFile, coverPath);
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
    
    return c.json(book);
  } catch (error) {
    console.error('Error uploading book:', error);
    return c.text('上传书籍失败', 500);
  }
});