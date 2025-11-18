import { useState } from "react";
import { useAuth } from "../contexts/AuthContext";
import { Link } from "react-router";

export function meta() {
  return [
    { title: "个人中心 - 哲学书籍分享平台" },
    { name: "description", content: "管理您的账户和发布的内容" },
  ];
}

export default function Profile() {
  const { user, updateUser } = useAuth();
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPasswordForm, setShowPasswordForm] = useState(false);
  
  // 密码修改表单
  const [passwordForm, setPasswordForm] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: ""
  });

  if (!user) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">请先登录</div>
      </div>
    );
  }

  // 处理密码修改表单提交
  const handlePasswordSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    setLoading(true);

    // 验证表单
    if (!passwordForm.currentPassword || !passwordForm.newPassword || !passwordForm.confirmPassword) {
      setError("请填写所有字段");
      setLoading(false);
      return;
    }

    if (passwordForm.newPassword !== passwordForm.confirmPassword) {
      setError("两次输入的新密码不一致");
      setLoading(false);
      return;
    }

    try {
      // 调用API修改密码
      const response = await fetch("/api/update-password", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          userId: user.id,
          currentPassword: passwordForm.currentPassword,
          newPassword: passwordForm.newPassword
        }),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(errorText || "修改密码失败");
      }

      setSuccess("密码修改成功");
      setShowPasswordForm(false);
      setPasswordForm({
        currentPassword: "",
        newPassword: "",
        confirmPassword: ""
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : "修改密码失败");
    } finally {
      setLoading(false);
    }
  };

  // 处理密码表单输入变化
  const handlePasswordChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setPasswordForm(prev => ({
      ...prev,
      [name]: value
    }));
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="bg-white rounded-lg shadow-xl overflow-hidden">
          <div className="bg-indigo-600 px-6 py-4">
            <div className="flex items-center justify-between">
              <div>
                <h1 className="text-3xl font-bold text-white">个人中心</h1>
                <p className="mt-1 text-indigo-200">欢迎回来，{user.name}</p>
              </div>
              <div className="text-white">
                <span className="bg-indigo-700 px-3 py-1 rounded-full text-sm">{user.role === 'admin' ? '管理员' : '普通用户'}</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            {/* 错误和成功提示 */}
            {error && (
              <div className="bg-red-100 border-l-4 border-red-500 text-red-700 p-4 mb-6">
                <p>{error}</p>
              </div>
            )}
            {success && (
              <div className="bg-green-100 border-l-4 border-green-500 text-green-700 p-4 mb-6">
                <p>{success}</p>
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              {/* 侧边栏导航 */}
              <div className="md:col-span-1">
                <div className="bg-gray-50 rounded-lg shadow p-4">
                  <h2 className="text-lg font-bold text-gray-800 mb-4">账户管理</h2>
                  <ul className="space-y-2">
                    <li>
                      <button 
                        className="w-full text-left px-3 py-2 rounded hover:bg-indigo-100 transition-colors text-gray-700"
                        onClick={() => setShowPasswordForm(false)}
                      >
                        <span className="flex items-center">
                          <span className="mr-2">👤</span>个人信息
                        </span>
                      </button>
                    </li>
                    <li>
                      <button 
                        className={`w-full text-left px-3 py-2 rounded transition-colors ${showPasswordForm ? 'bg-indigo-100 text-indigo-700' : 'hover:bg-indigo-100 text-gray-700'}`}
                        onClick={() => setShowPasswordForm(true)}
                      >
                        <span className="flex items-center">
                          <span className="mr-2">🔒</span>修改密码
                        </span>
                      </button>
                    </li>
                    <li>
                      <Link 
                        to="/notes" 
                        className="block px-3 py-2 rounded hover:bg-indigo-100 transition-colors text-gray-700"
                      >
                        <span className="flex items-center">
                          <span className="mr-2">📝</span>我的笔记
                        </span>
                      </Link>
                    </li>
                    {user.role === 'admin' && (
                      <li>
                        <Link 
                          to="/admin" 
                          className="block px-3 py-2 rounded hover:bg-indigo-100 transition-colors text-gray-700"
                        >
                          <span className="flex items-center">
                            <span className="mr-2">⚙️</span>管理员面板
                          </span>
                        </Link>
                      </li>
                    )}
                  </ul>
                </div>
              </div>

              {/* 主要内容区域 */}
              <div className="md:col-span-2">
                {/* 个人信息 */}
                {!showPasswordForm && (
                  <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">个人信息</h2>
                    <div className="space-y-4">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">用户名</label>
                        <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">{user.name}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">邮箱</label>
                        <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">{user.email}</div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">账户类型</label>
                        <div className={`bg-gray-50 border border-gray-200 rounded px-3 py-2 ${user.role === 'admin' ? 'text-indigo-700 font-medium' : 'text-gray-700'}`}>
                          {user.role === 'admin' ? '管理员' : '普通用户'}
                        </div>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">注册时间</label>
                        <div className="bg-gray-50 border border-gray-200 rounded px-3 py-2">
                          {new Date(user.created_at).toLocaleString('zh-CN')}
                        </div>
                      </div>
                    </div>
                  </div>
                )}

                {/* 修改密码表单 */}
                {showPasswordForm && (
                  <div className="bg-white rounded-lg shadow p-6 border border-gray-100">
                    <h2 className="text-xl font-bold text-gray-800 mb-6">修改密码</h2>
                    <form onSubmit={handlePasswordSubmit} className="space-y-4">
                      <div>
                        <label htmlFor="currentPassword" className="block text-sm font-medium text-gray-700 mb-1">当前密码</label>
                        <input
                          id="currentPassword"
                          name="currentPassword"
                          type="password"
                          autoComplete="current-password"
                          required
                          disabled={loading}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50"
                          value={passwordForm.currentPassword}
                          onChange={handlePasswordChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="newPassword" className="block text-sm font-medium text-gray-700 mb-1">新密码</label>
                        <input
                          id="newPassword"
                          name="newPassword"
                          type="password"
                          autoComplete="new-password"
                          required
                          disabled={loading}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50"
                          value={passwordForm.newPassword}
                          onChange={handlePasswordChange}
                        />
                      </div>
                      <div>
                        <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1">确认新密码</label>
                        <input
                          id="confirmPassword"
                          name="confirmPassword"
                          type="password"
                          autoComplete="new-password"
                          required
                          disabled={loading}
                          className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm disabled:bg-gray-50"
                          value={passwordForm.confirmPassword}
                          onChange={handlePasswordChange}
                        />
                      </div>
                      <div className="flex justify-end">
                        <button
                          type="button"
                          onClick={() => {
                            setShowPasswordForm(false);
                            setPasswordForm({ currentPassword: "", newPassword: "", confirmPassword: "" });
                          }}
                          disabled={loading}
                          className="px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 mr-3 disabled:bg-gray-50"
                        >
                          取消
                        </button>
                        <button
                          type="submit"
                          disabled={loading}
                          className="px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:bg-indigo-400"
                        >
                          {loading ? "修改中..." : "保存修改"}
                        </button>
                      </div>
                    </form>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}