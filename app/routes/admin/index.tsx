import React from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export function meta() {
  return [
    { title: "管理员面板 - 哲学书籍分享平台" },
    { name: "description", content: "管理员管理面板" },
  ];
}

const AdminDashboard: React.FC = () => {
  const { isAdmin, user } = useAuth();

  // 确保只有管理员可以访问
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-red-600">您没有权限访问此页面</div>
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
                <h1 className="text-3xl font-bold text-white">管理员面板</h1>
                <p className="mt-1 text-indigo-200">欢迎回来，{user?.name}</p>
              </div>
              <div className="text-white">
                <span className="bg-indigo-700 px-3 py-1 rounded-full text-sm">管理员</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* 上传书籍 */}
              <Link to="/admin/upload" className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow p-6 border-2 border-indigo-100 hover:border-indigo-300">
                <div className="flex items-center">
                  <div className="text-4xl text-indigo-600 mr-4">📚</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">上传书籍</h3>
                    <p className="mt-1 text-gray-600">上传新的哲学书籍</p>
                  </div>
                </div>
                <div className="mt-4 text-right">
                  <span className="text-indigo-600 font-medium">查看详情 →</span>
                </div>
              </Link>

              {/* 管理书籍 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow p-6 border-2 border-indigo-100 hover:border-indigo-300">
                <div className="flex items-center">
                  <div className="text-4xl text-indigo-600 mr-4">📖</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">管理书籍</h3>
                    <p className="mt-1 text-gray-600">查看和管理已上传的书籍</p>
                  </div>
                </div>
                <div className="mt-4 text-right">
                  <span className="text-gray-400 font-medium">功能开发中 →</span>
                </div>
              </div>

              {/* 管理笔记 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow p-6 border-2 border-indigo-100 hover:border-indigo-300">
                <div className="flex items-center">
                  <div className="text-4xl text-indigo-600 mr-4">📝</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">管理笔记</h3>
                    <p className="mt-1 text-gray-600">查看和管理用户上传的笔记</p>
                  </div>
                </div>
                <div className="mt-4 text-right">
                  <span className="text-gray-400 font-medium">功能开发中 →</span>
                </div>
              </div>

              {/* 用户管理 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow p-6 border-2 border-indigo-100 hover:border-indigo-300">
                <div className="flex items-center">
                  <div className="text-4xl text-indigo-600 mr-4">👥</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">用户管理</h3>
                    <p className="mt-1 text-gray-600">查看和管理注册用户</p>
                  </div>
                </div>
                <div className="mt-4 text-right">
                  <span className="text-gray-400 font-medium">功能开发中 →</span>
                </div>
              </div>

              {/* 系统设置 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow p-6 border-2 border-indigo-100 hover:border-indigo-300">
                <div className="flex items-center">
                  <div className="text-4xl text-indigo-600 mr-4">⚙️</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">系统设置</h3>
                    <p className="mt-1 text-gray-600">管理系统配置</p>
                  </div>
                </div>
                <div className="mt-4 text-right">
                  <span className="text-gray-400 font-medium">功能开发中 →</span>
                </div>
              </div>

              {/* 数据统计 */}
              <div className="bg-white rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow p-6 border-2 border-indigo-100 hover:border-indigo-300">
                <div className="flex items-center">
                  <div className="text-4xl text-indigo-600 mr-4">📊</div>
                  <div>
                    <h3 className="text-xl font-bold text-gray-800">数据统计</h3>
                    <p className="mt-1 text-gray-600">查看系统数据统计</p>
                  </div>
                </div>
                <div className="mt-4 text-right">
                  <span className="text-gray-400 font-medium">功能开发中 →</span>
                </div>
              </div>
            </div>

            {/* 快速链接 */}
            <div className="mt-10">
              <h2 className="text-2xl font-bold text-gray-800 mb-4">快速链接</h2>
              <div className="bg-gray-50 rounded-lg p-6">
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                  <Link 
                    to="/" 
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    首页
                  </Link>
                  <Link 
                    to="/books" 
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    书籍列表
                  </Link>
                  <Link 
                    to="/notes" 
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    学习笔记
                  </Link>
                  <Link 
                    to="/admin/upload" 
                    className="text-indigo-600 hover:text-indigo-800 font-medium"
                  >
                    上传书籍
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboard;