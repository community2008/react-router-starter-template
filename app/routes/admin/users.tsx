import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';

// 定义用户接口
interface User {
  id: number;
  name: string;
  email: string;
  role: 'user' | 'admin';
  created_at: string;
}

export function meta() {
  return [
    { title: "用户管理 - 哲学书籍分享平台" },
    { name: "description", content: "管理注册用户" },
  ];
}

const AdminUsers: React.FC = () => {
  const { isAdmin } = useAuth();
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');

  // 确保只有管理员可以访问
  if (!isAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-red-600">您没有权限访问此页面</div>
      </div>
    );
  }

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const response = await fetch('/api/users');
      if (!response.ok) {
        throw new Error('获取用户列表失败');
      }
      const data = await response.json();
      setUsers(data as User[]);
    } catch (error) {
      setError('获取用户列表失败，请稍后重试');
      console.error('获取用户列表错误:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleToggleAdmin = async (userId: number, currentRole: 'user' | 'admin') => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ role: currentRole === 'admin' ? 'user' : 'admin' }),
      });
      if (!response.ok) {
        throw new Error('更新用户权限失败');
      }
      // 更新用户列表
      setUsers(users.map(user => 
        user.id === userId ? { ...user, role: currentRole === 'admin' ? 'user' : 'admin' } : user
      ));
    } catch (error) {
      setError('更新用户权限失败，请稍后重试');
      console.error('更新用户权限错误:', error);
    }
  };

  const handleDeleteUser = async (userId: number) => {
    try {
      const response = await fetch(`/api/users/${userId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('删除用户失败');
      }
      // 更新用户列表
      setUsers(users.filter(user => user.id !== userId));
    } catch (error) {
      setError('删除用户失败，请稍后重试');
      console.error('删除用户错误:', error);
    }
  };

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
                <h1 className="text-3xl font-bold text-white">用户管理</h1>
                <p className="mt-1 text-indigo-200">查看和管理注册用户</p>
              </div>
              <div className="text-white">
                <span className="bg-indigo-700 px-3 py-1 rounded-full text-sm">管理员</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">用户列表</h2>
              <div className="text-gray-500">共 {users.length} 个用户</div>
            </div>

            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 p-4 mb-6">
                <p className="text-red-700">{error}</p>
              </div>
            )}

            <div className="overflow-x-auto">
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-gray-100">
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">ID</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">用户名</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">邮箱</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">是否管理员</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">注册时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map(user => (
                    <tr key={user.id} className="border-b">
                      <td className="px-6 py-4 whitespace-nowrap">{user.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.name}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{user.email}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleToggleAdmin(user.id, user.role)}
                          className={`px-3 py-1 rounded-full text-xs font-medium ${user.role === 'admin' ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}
                        >
                          {user.role === 'admin' ? '是' : '否'}
                        </button>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(user.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteUser(user.id)}
                          className="text-red-600 hover:text-red-800 font-medium mr-4"
                        >
                          删除
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminUsers;