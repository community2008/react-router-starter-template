import React, { useEffect, useState } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';
import type { Book } from '../../models/book';

export function meta() {
  return [
    { title: "管理书籍 - 哲学书籍分享平台" },
    { name: "description", content: "管理员管理已上传的书籍" },
  ];
}

const AdminBooks: React.FC = () => {
  const { isAdmin } = useAuth();
  const [books, setBooks] = useState<Book[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [deleteBookId, setDeleteBookId] = useState<number | null>(null);

  useEffect(() => {
    fetchBooks();
  }, []);

  const fetchBooks = async () => {
    try {
      const response = await fetch('/api/books');
      if (!response.ok) {
        throw new Error('获取书籍列表失败');
      }
      const data = await response.json();
      setBooks(data as Book[]);
    } catch (error) {
      setError('获取书籍列表失败，请稍后重试');
      console.error('获取书籍列表错误:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    try {
      setDeleteBookId(id);
      const response = await fetch(`/api/books/${id}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('删除书籍失败');
      }
      // 删除成功后更新书籍列表
      setBooks(books.filter(book => book.id !== id));
    } catch (error) {
      setError('删除书籍失败，请稍后重试');
      console.error('删除书籍错误:', error);
    } finally {
      setDeleteBookId(null);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gradient-to-r from-purple-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-8">
            <div>
              <h1 className="text-3xl font-bold text-gray-900">管理书籍</h1>
              <p className="mt-2 text-sm text-gray-600">查看和管理已上传的书籍</p>
            </div>
            <Link
              to="/admin/upload"
              className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
            >
              <span className="mr-2">📚</span>
              上传新书籍
            </Link>
          </div>

          {error && (
            <div className="mb-6 p-4 bg-red-100 text-red-800 rounded-lg">
              {error}
            </div>
          )}

          {isLoading ? (
            <div className="flex justify-center items-center py-20">
              <div className="text-xl text-gray-500">加载中...</div>
            </div>
          ) : books.length === 0 ? (
            <div className="bg-white rounded-lg shadow-md p-12 text-center">
              <div className="text-6xl mb-4">📚</div>
              <h3 className="text-xl font-bold text-gray-800 mb-2">暂无书籍</h3>
              <p className="text-gray-600 mb-6">您还没有上传任何书籍</p>
              <Link
                to="/admin/upload"
                className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-lg hover:bg-indigo-700 transition-colors"
              >
                上传第一本书籍
              </Link>
            </div>
          ) : (
            <div className="bg-white rounded-lg shadow-md overflow-hidden">
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        封面
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        书籍信息
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        上传者
                      </th>
                      <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        上传时间
                      </th>
                      <th scope="col" className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">
                        操作
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {books.map((book) => (
                      <tr key={book.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="w-16 h-24 overflow-hidden rounded-md">
                            <img
                              src={book.cover_url || `https://via.placeholder.com/120x180/2c3e50/ffffff?text=${encodeURIComponent(book.title)}`}
                              alt={book.title}
                              className="w-full h-full object-cover"
                            />
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex flex-col">
                            <div className="text-sm font-semibold text-gray-900">
                              {book.title}
                            </div>
                            <div className="text-sm text-gray-500 mt-1">
                              {book.author}
                            </div>
                            <div className="text-xs text-gray-400 mt-1 line-clamp-2">
                              {book.description || '无描述'}
                            </div>
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-900">
                            用户ID: {book.uploaded_by}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-sm text-gray-500">
                            {new Date(book.created_at).toLocaleString('zh-CN')}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                          <div className="flex items-center justify-end space-x-2">
                            <button
                              type="button"
                              className="text-blue-600 hover:text-blue-900"
                              onClick={() => alert('编辑功能开发中')}
                            >
                              编辑
                            </button>
                            <button
                              type="button"
                              className="text-red-600 hover:text-red-900"
                              onClick={() => handleDelete(book.id)}
                              disabled={deleteBookId === book.id}
                            >
                              {deleteBookId === book.id ? '删除中...' : '删除'}
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default AdminBooks;