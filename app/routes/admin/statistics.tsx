import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';

// 定义统计数据接口
interface Statistics {
  total_users: number;
  total_books: number;
  total_notes: number;
  active_users: number;
  recent_books: number;
  recent_notes: number;
  popular_books: {
    id: number;
    title: string;
    author: string;
    views: number;
    rating: number;
  }[];
}

export function meta() {
  return [
    { title: "数据统计 - 哲学书籍分享平台" },
    { name: "description", content: "查看系统数据统计" },
  ];
}

const AdminStatistics: React.FC = () => {
  const { isAdmin } = useAuth();
  const [statistics, setStatistics] = useState<Statistics>({
    total_users: 0,
    total_books: 0,
    total_notes: 0,
    active_users: 0,
    recent_books: 0,
    recent_notes: 0,
    popular_books: []
  });
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 必须在所有条件返回之前调用useEffect钩子
  useEffect(() => {
    fetchStatistics();
  }, []);

  const fetchStatistics = async () => {
    try {
      const response = await fetch('/api/statistics');
      if (!response.ok) {
        throw new Error('获取统计数据失败');
      }
      const data = await response.json();
      setStatistics(data as Statistics);
    } catch (error) {
      setError('获取统计数据失败，请稍后重试');
      console.error('获取统计数据错误:', error);
    } finally {
      setIsLoading(false);
    }
  };

  // 确保只有管理员可以访问
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-red-600">您没有权限访问此页面</div>
      </div>
    );
  }
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">加载中...</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">数据统计</h1>
                <p className="mt-1 text-indigo-200">查看系统数据统计</p>
              </div>
              <div className="text-white">
                <span className="bg-indigo-700 px-3 py-1 rounded-full text-sm">管理员</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-10">
              {/* 总用户 */}
              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-blue-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">总用户</p>
                    <p className="text-3xl font-bold text-blue-600 mt-1">{statistics.total_users}</p>
                  </div>
                  <div className="text-5xl text-blue-200">👥</div>
                </div>
              </div>

              {/* 总书籍 */}
              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-green-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">总书籍</p>
                    <p className="text-3xl font-bold text-green-600 mt-1">{statistics.total_books}</p>
                  </div>
                  <div className="text-5xl text-green-200">📚</div>
                </div>
              </div>

              {/* 总笔记 */}
              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-purple-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">总笔记</p>
                    <p className="text-3xl font-bold text-purple-600 mt-1">{statistics.total_notes}</p>
                  </div>
                  <div className="text-5xl text-purple-200">📝</div>
                </div>
              </div>

              {/* 活跃用户 */}
              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-yellow-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">活跃用户</p>
                    <p className="text-3xl font-bold text-yellow-600 mt-1">{statistics.active_users}</p>
                  </div>
                  <div className="text-5xl text-yellow-200">💡</div>
                </div>
              </div>

              {/* 最近上传书籍 */}
              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-indigo-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">最近上传书籍</p>
                    <p className="text-3xl font-bold text-indigo-600 mt-1">{statistics.recent_books}</p>
                  </div>
                  <div className="text-5xl text-indigo-200">📖</div>
                </div>
              </div>

              {/* 最近上传笔记 */}
              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-pink-100">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-gray-600 text-sm font-medium">最近上传笔记</p>
                    <p className="text-3xl font-bold text-pink-600 mt-1">{statistics.recent_notes}</p>
                  </div>
                  <div className="text-5xl text-pink-200">✍️</div>
                </div>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* 数据趋势 */}
              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">数据趋势</h3>
                  <div className="text-gray-500 text-sm">最近30天</div>
                </div>
                <div className="h-64 bg-gray-100 rounded-lg flex items-center justify-center">
                  <div className="text-gray-500">趋势图表（模拟数据）</div>
                </div>
              </div>

              {/* 热门书籍/笔记 */}
              <div className="bg-white rounded-lg shadow-md p-6 border-2 border-gray-100">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="text-xl font-bold text-gray-800">热门推荐</h3>
                  <div className="text-gray-500 text-sm">基于浏览量</div>
                </div>
                <div className="space-y-4">
                  {statistics.popular_books && statistics.popular_books.map((book) => (
                    <div key={book.id} className="flex items-center justify-between">
                      <div>
                        <p className="font-medium text-gray-800">{book.title}</p>
                        <p className="text-sm text-gray-500">作者: {book.author} | 浏览量: {book.views}</p>
                      </div>
                      <div className="text-yellow-500">
                        {Array(book.rating).fill('⭐️').join('')}
                        {Array(5 - book.rating).fill('☆').join('')}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminStatistics;