import React, { useState, useEffect } from 'react';
import { Link } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';
import { ProtectedRoute } from '../../components/ProtectedRoute';

// 定义笔记接口
interface Note {
  id: number;
  title: string;
  content: string;
  author: string;
  created_at: string;
  book_id?: number;
}

export function meta() {
  return [
    { title: "管理笔记 - 哲学书籍分享平台" },
    { name: "description", content: "管理用户上传的笔记" },
  ];
}

const AdminNotes: React.FC = () => {
  const { isAdmin } = useAuth();
  const [notes, setNotes] = useState<Note[]>([]);
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
    fetchNotes();
  }, []);

  const fetchNotes = async () => {
    try {
      const response = await fetch('/api/notes');
      if (!response.ok) {
        throw new Error('获取笔记列表失败');
      }
      const data = await response.json();
      setNotes(data as Note[]);
    } catch (error) {
      setError('获取笔记列表失败，请稍后重试');
      console.error('获取笔记列表错误:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleDeleteNote = async (noteId: number) => {
    try {
      const response = await fetch(`/api/notes/${noteId}`, {
        method: 'DELETE',
      });
      if (!response.ok) {
        throw new Error('删除笔记失败');
      }
      // 更新笔记列表
      setNotes(notes.filter(note => note.id !== noteId));
    } catch (error) {
      setError('删除笔记失败，请稍后重试');
      console.error('删除笔记错误:', error);
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
                <h1 className="text-3xl font-bold text-white">管理笔记</h1>
                <p className="mt-1 text-indigo-200">查看和管理用户上传的笔记</p>
              </div>
              <div className="text-white">
                <span className="bg-indigo-700 px-3 py-1 rounded-full text-sm">管理员</span>
              </div>
            </div>
          </div>

          <div className="px-6 py-8">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-2xl font-bold text-gray-800">笔记列表</h2>
              <div className="text-gray-500">共 {notes.length} 条笔记</div>
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
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">标题</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">作者</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">创建时间</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">操作</th>
                  </tr>
                </thead>
                <tbody>
                  {notes.map(note => (
                    <tr key={note.id} className="border-b">
                      <td className="px-6 py-4 whitespace-nowrap">{note.id}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{note.title}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{note.author}</td>
                      <td className="px-6 py-4 whitespace-nowrap">{new Date(note.created_at).toLocaleString()}</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <button
                          onClick={() => handleDeleteNote(note.id)}
                          className="text-red-600 hover:text-red-800 font-medium"
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

export default AdminNotes;