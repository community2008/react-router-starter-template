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

// 管理员上传书籍文件
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