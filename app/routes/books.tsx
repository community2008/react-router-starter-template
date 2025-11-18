import type { Route } from "./+types/books";
import { useAuth } from '../contexts/AuthContext';
import type { Book } from '../models/book';

export function meta({}: Route.MetaArgs) {
  return [
    { title: "哲学书籍 - 哲学书籍分享平台" },
    { name: "description", content: "浏览和下载各类哲学书籍" },
  ];
}

export async function loader({ context }: Route.LoaderArgs) {
  try {
    // 调用API从数据库获取书籍列表
    const response = await fetch('/api/books');
    if (!response.ok) {
      throw new Error('Failed to fetch books');
    }
    
    const books: Book[] = await response.json();
    
    return {
      books,
      isAuthenticated: false,
      isAdmin: false
    };
  } catch (error) {
    console.error('Error loading books:', error);
    return {
      books: [],
      isAuthenticated: false,
      isAdmin: false
    };
  }
}

// 书籍文件卡片组件
function BookFileCard({ book }: { book: Book }) {
  // 根据文件类型返回不同的图标
  const getFileTypeIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'txt':
        return '📝';
      case 'epub':
        return '📖';
      case 'mobi':
        return '📱';
      default:
        return '📚';
    }
  };

  // 从file_url提取文件类型
  const fileType = book.file_url.split('.').pop() || 'unknown';
  // 格式化上传日期
  const uploadDate = new Date(book.created_at).toLocaleDateString('zh-CN');

  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-4px]">
      <div className="flex">
        <div className="w-32 h-48 overflow-hidden">
          <img 
            src={book.cover_url || `https://via.placeholder.com/120x180/2c3e50/ffffff?text=${encodeURIComponent(book.title)}`} 
            alt={book.title} 
            className="w-full h-full object-cover"
          />
        </div>
        <div className="flex-1 p-5">
          <div className="flex justify-between items-start mb-2">
            <h3 className="text-xl font-bold text-gray-800 line-clamp-1">{book.title}</h3>
            <span className="text-3xl">{getFileTypeIcon(fileType)}</span>
          </div>
          <p className="text-sm text-gray-600 mb-2">作者: {book.author}</p>
          <p className="text-sm text-gray-600 mb-3 line-clamp-3">{book.description || '无描述'}</p>
          <div className="flex flex-wrap gap-2 items-center mt-4">
            <span className="px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-xs font-medium">
              {fileType.toUpperCase()}
            </span>
            <span className="text-xs text-gray-500">上传于: {uploadDate}</span>
          </div>
          <div className="mt-4">
            <a 
              href={book.file_url} 
              target="_blank" 
              rel="noopener noreferrer"
              className="inline-flex items-center px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
            >
              下载
              <span className="ml-2">⬇️</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function Books({ loaderData }: Route.ComponentProps) {
    const { books } = loaderData;
    const { user, isAuthenticated, isAdmin } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">哲学书籍分享平台</h1>
            </div>
            <div className="flex items-center space-x-4">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  {isAdmin && (
                    <a 
                      href="/admin/upload" 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      上传书籍
                    </a>
                  )}
                  <button className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-md text-sm font-medium">
                    退出登录
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <a 
                    href="/login" 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    登录
                  </a>
                  <a 
                    href="/register" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    注册
                  </a>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">哲学书籍</h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            浏览和下载各类哲学书籍，深入探索哲学思想的博大精深
          </p>
          {/* 管理员上传按钮 */}
          {isAdmin && (
            <div className="mt-6">
              <a 
                href="/admin/upload" 
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
              >
                上传书籍
              </a>
            </div>
          )}
        </div>

        {/* 书籍文件列表 */}
        <div className="grid grid-cols-1 gap-6">
          {books.map((book) => (
            <BookFileCard key={book.id} book={book} />
          ))}
        </div>

        {/* 返回主页按钮 */}
        <div className="text-center mt-12">
          <a 
            href="/" 
            className="inline-flex items-center px-6 py-3 bg-gray-200 text-gray-800 rounded-full font-medium hover:bg-gray-300 transition-colors"
          >
            ← 返回主页
          </a>
        </div>
      </main>

      {/* 页脚 */}
      <footer className="bg-gray-800 text-white py-12 mt-16">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <p className="mb-2">哲学书籍分享平台 &copy; {new Date().getFullYear()}</p>
            <p className="text-gray-400 text-sm">探索智慧，传承思想</p>
          </div>
        </div>
      </footer>
    </div>
  );
}