import type { Route } from "./+types/notes";
import { useAuth } from "../contexts/AuthContext";
import { useEffect, useState } from "react";
import { Link } from "react-router";

// R2文件类型定义
interface R2File {
  key: string;
  size: number;
  uploaded: Date;
  url: string;
}

// 笔记文件类型定义
interface NoteFile {
  id: string;
  title: string;
  author: string;
  fileName: string;
  fileType: string;
  fileSize: string;
  uploadDate: string;
  url: string;
}

export function meta({}: Route.MetaArgs) {
  return [
    { title: "学习笔记 - 哲学书籍分享平台" },
    { name: "description", content: "查看和分享哲学学习笔记" },
  ];
}

// 格式化文件大小
function formatFileSize(size: number): string {
  if (size < 1024) return `${size} B`;
  if (size < 1024 * 1024) return `${(size / 1024).toFixed(1)} KB`;
  return `${(size / (1024 * 1024)).toFixed(1)} MB`;
}

export async function loader({ context }: Route.LoaderArgs) {
  try {
    // 调用API获取R2存储桶中的笔记文件列表
    const response = await fetch('/api/notes/files/list');
    if (!response.ok) {
      throw new Error('Failed to fetch note files');
    }
    
    const data: { files: R2File[] } = await response.json();
    const r2Files: R2File[] = data.files;
    
    // 转换R2文件数据为前端需要的格式
    const noteFiles: NoteFile[] = r2Files.map((file, index) => {
      // 从文件名中提取标题和作者信息
      // 假设文件名格式为: "笔记标题 - 作者.扩展名"
      const fileName = file.key.replace('notes/', '');
      const [namePart, extension] = fileName.split('.');
      const [title, author] = namePart.split(' - ');
      
      return {
        id: `note-${index + 1}`,
        title: title || namePart,
        author: author || '未知作者',
        fileName,
        fileType: extension || 'unknown',
        fileSize: formatFileSize(file.size),
        uploadDate: new Date(file.uploaded).toLocaleDateString('zh-CN'),
        url: file.url
      };
    });
    
    return {
      notes: noteFiles,
      isAuthenticated: false,
      isAdmin: false
    };
  } catch (error) {
    console.error('Error loading note files:', error);
    return {
      notes: [],
      isAuthenticated: false,
      isAdmin: false
    };
  }
}

// 笔记卡片组件
function NoteCard({ note }: { note: any }) {
  const { user } = useAuth();
  
  // 获取文件类型图标
  const getFileTypeIcon = (type: string) => {
    switch(type.toLowerCase()) {
      case 'pdf':
        return '📄';
      case 'doc':
      case 'docx':
        return '📝';
      case 'txt':
        return '📋';
      case 'md':
        return '📄';
      default:
        return '📚';
    }
  };
  
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-4px]">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-bold text-gray-800 line-clamp-1">{note.title}</h3>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
            {note.fileType.toUpperCase()}
          </span>
        </div>
        <div className="flex items-center mb-4 text-sm text-gray-500">
          <span>作者: {note.author}</span>
          <span className="mx-2">•</span>
          <span>上传于: {note.uploadDate}</span>
          <span className="mx-2">•</span>
          <span>{note.fileSize}</span>
        </div>
        <div className="flex justify-between items-center mb-4">
          <span className="text-gray-500">文件名: {note.fileName}</span>
          <div className="text-3xl">{getFileTypeIcon(note.fileType)}</div>
        </div>
        <div className="flex justify-end space-x-3">
          <a href={note.url} target="_blank" rel="noopener noreferrer" className="px-5 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
            下载笔记
          </a>
          {user && (user.name === note.author || user.role === 'admin') && (
            <a href={`/notes/${note.id}`} className="px-5 py-2 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              编辑笔记
            </a>
          )}
        </div>
      </div>
    </div>
  );
}

// 上传笔记组件
function UploadNoteForm() {
  const { user } = useAuth();
  const [isOpen, setIsOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState(user?.name || '');
  const [noteFile, setNoteFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setNoteFile(e.target.files[0]);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!noteFile || !title || !author) return;

    setIsUploading(true);

    try {
      const formData = new FormData();
      formData.append('noteFile', noteFile);
      formData.append('title', title);
      formData.append('author', author);

      const response = await fetch('/api/notes/upload', {
        method: 'POST',
        body: formData,
        credentials: 'include'
      });

      if (response.ok) {
        // 上传成功，刷新页面
        window.location.reload();
      } else {
        alert('上传失败，请重试');
      }
    } catch (error) {
      console.error('Error uploading note:', error);
      alert('上传失败，请重试');
    } finally {
      setIsUploading(false);
      setIsOpen(false);
    }
  };

  return (
    <div>
      <button
        onClick={() => setIsOpen(true)}
        className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors mb-6"
      >
        上传笔记
      </button>

      {isOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <div className="bg-white rounded-xl shadow-2xl w-full max-w-md">
            <div className="p-6">
              <div className="flex justify-between items-center mb-4">
                <h3 className="text-xl font-bold text-gray-800">上传学习笔记</h3>
                <button
                  onClick={() => setIsOpen(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
                    笔记标题
                  </label>
                  <input
                    type="text"
                    id="title"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="author" className="block text-sm font-medium text-gray-700 mb-1">
                    作者
                  </label>
                  <input
                    type="text"
                    id="author"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="mb-4">
                  <label htmlFor="noteFile" className="block text-sm font-medium text-gray-700 mb-1">
                    笔记文件
                  </label>
                  <input
                    type="file"
                    id="noteFile"
                    accept=".pdf,.doc,.docx,.txt,.md"
                    onChange={handleFileChange}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-transparent"
                    required
                  />
                </div>

                <div className="flex justify-end space-x-3 mt-6">
                  <button
                    type="button"
                    onClick={() => setIsOpen(false)}
                    className="px-5 py-2 bg-gray-200 hover:bg-gray-300 text-gray-900 rounded-lg font-medium transition-colors"
                  >
                    取消
                  </button>
                  <button
                    type="submit"
                    disabled={isUploading}
                    className="px-5 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors disabled:bg-green-400 disabled:cursor-not-allowed"
                  >
                    {isUploading ? '上传中...' : '上传'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default function Notes({ loaderData }: Route.ComponentProps) {
  const { notes } = loaderData;
  const { user, isAdmin, logout } = useAuth();

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 to-blue-50">
      {/* 导航栏 */}
      <nav className="bg-white shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-xl font-bold text-gray-900">哲学书籍分享平台</h1>
            </div>
            <div className="flex items-center space-x-4">
              {user ? (
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/profile" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    个人中心
                  </Link>
                  {isAdmin && (
                    <Link 
                      to="/admin/upload" 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                    >
                      上传书籍
                    </Link>
                  )}
                  <button 
                    onClick={logout} 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    退出登录
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <Link 
                    to="/login" 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-4 py-2 rounded-md text-sm font-medium"
                  >
                    登录
                  </Link>
                  <Link 
                    to="/register" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium"
                  >
                    注册
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </nav>

      {/* 主要内容 */}
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">哲学学习笔记</h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            查看和分享哲学学习心得，与其他哲学爱好者交流思想与见解
          </p>
        </div>

        {/* 上传按钮 */}
        {user && (
          <div className="flex justify-center mb-8">
            <UploadNoteForm />
          </div>
        )}

        {/* 笔记列表 */}
        <div className="grid grid-cols-1 gap-6">
          {notes.map((note) => (
            <NoteCard key={note.id} note={note} />
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