import React, { useState } from 'react';
import { useNavigate } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';

export function meta() {
  return [
    { title: "上传书籍 - 哲学书籍分享平台" },
    { name: "description", content: "管理员上传新书籍" },
  ];
}

const UploadPage: React.FC = () => {
  const { user, isAdmin } = useAuth();
  const navigate = useNavigate();
  
  const [title, setTitle] = useState('');
  const [author, setAuthor] = useState('');
  const [description, setDescription] = useState('');
  const [bookFile, setBookFile] = useState<File | null>(null);
  const [coverFile, setCoverFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!title || !author || !bookFile) {
      setError('请填写所有必填字段');
      return;
    }

    setIsUploading(true);
    setError('');

    try {
      // 创建FormData对象
      const formData = new FormData();
      formData.append('title', title);
      formData.append('author', author);
      formData.append('description', description);
      formData.append('bookFile', bookFile);
      formData.append('userId', user?.id?.toString() || '');
      if (coverFile) {
        formData.append('coverFile', coverFile);
      }

      // 发送上传请求
      const response = await fetch('/api/admin/upload-book', {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        throw new Error('上传失败');
      }

      // 上传成功，返回首页
      navigate('/');
    } catch (error) {
      setError('上传失败，请稍后重试');
      console.error('上传错误:', error);
    } finally {
      setIsUploading(false);
    }
  };

  return (
    <ProtectedRoute requireAdmin>
      <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-3xl font-extrabold text-gray-900 text-center">
            上传新书籍
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            请填写书籍信息并上传文件
          </p>

          <div className="mt-8 bg-white p-6 rounded-lg shadow-md">
            {error && (
              <div className="mb-4 p-3 bg-red-100 text-red-700 rounded">
                {error}
              </div>
            )}

            <form className="space-y-6" onSubmit={handleSubmit}>
              <div>
                <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                  书籍标题 *
                </label>
                <div className="mt-1">
                  <input
                    id="title"
                    name="title"
                    type="text"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="输入书籍标题"
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="author" className="block text-sm font-medium text-gray-700">
                  作者 *
                </label>
                <div className="mt-1">
                  <input
                    id="author"
                    name="author"
                    type="text"
                    required
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="输入作者姓名"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                  书籍描述
                </label>
                <div className="mt-1">
                  <textarea
                    id="description"
                    name="description"
                    rows={4}
                    className="appearance-none block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
                    placeholder="输入书籍描述"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                  />
                </div>
              </div>

              <div>
                <label htmlFor="bookFile" className="block text-sm font-medium text-gray-700">
                  书籍文件 *
                </label>
                <div className="mt-1">
                  <input
                    id="bookFile"
                    name="bookFile"
                    type="file"
                    accept=".pdf,.epub,.mobi"
                    required
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={(e) => setBookFile(e.target.files?.[0] || null)}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    支持的格式：PDF, EPUB, MOBI
                  </p>
                </div>
              </div>

              <div>
                <label htmlFor="coverFile" className="block text-sm font-medium text-gray-700">
                  封面图片
                </label>
                <div className="mt-1">
                  <input
                    id="coverFile"
                    name="coverFile"
                    type="file"
                    accept=".jpg,.jpeg,.png,.webp"
                    className="block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
                    onChange={(e) => setCoverFile(e.target.files?.[0] || null)}
                  />
                  <p className="mt-1 text-sm text-gray-500">
                    支持的格式：JPG, PNG, WEBP
                  </p>
                </div>
              </div>

              <div>
                <button
                  type="submit"
                  disabled={isUploading}
                  className="w-full flex justify-center py-2 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isUploading ? '上传中...' : '上传书籍'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

// 导出默认组件，使用ProtectedRoute包装
export default function AdminUpload() {
  return (
    <ProtectedRoute requireAdmin>
      <UploadPage />
    </ProtectedRoute>
  );
}