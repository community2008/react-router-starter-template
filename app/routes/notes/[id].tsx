import { useState, useEffect } from 'react';
import { useParams, useNavigate, Form } from 'react-router';
import { useAuth } from '../../contexts/AuthContext';

interface NoteFile {
  id: string;
  name: string;
  type: string;
  size: number;
  uploadedAt: string;
  userId: number;
  userName: string;
}

export async function loader({ params }: { params: { id: string } }) {
  try {
    const response = await fetch(`/api/notes/files/${params.id}`);
    if (!response.ok) throw new Error('Failed to fetch note');
    const noteFile: NoteFile = await response.json();
    return noteFile;
  } catch (error) {
    console.error('Error loading note:', error);
    return null;
  }
}

export default function EditNote() {
  const params = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [noteFile, setNoteFile] = useState<NoteFile | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState('');
  const [formData, setFormData] = useState({
    name: '',
  });

  useEffect(() => {
    async function loadNote() {
      if (!params.id) return;
      try {
        setIsLoading(true);
        const response = await fetch(`/api/notes/files/${params.id}`);
        if (!response.ok) throw new Error('Failed to fetch note');
        const data: NoteFile = await response.json();
        setNoteFile(data);
        setFormData({ name: data.name });
      } catch (err) {
        setError('Failed to load note. Please try again.');
        console.error('Error loading note:', err);
      } finally {
        setIsLoading(false);
      }
    }

    loadNote();
  }, [params.id]);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-indigo-600">Loading...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-red-600">{error}</div>
      </div>
    );
  }

  if (!noteFile) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-gray-600">Note not found</div>
      </div>
    );
  }

  // Check if current user is the owner of the note or an admin
  const isOwnerOrAdmin = user?.id === noteFile.userId || user?.role === 'admin';

  if (!isOwnerOrAdmin) {
    return (
      <div className="min-h-screen bg-gradient-to-r from-purple-50 to-indigo-100 flex items-center justify-center">
        <div className="text-xl text-red-600">You don't have permission to edit this note.</div>
      </div>
    );
  }

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData(prev => ({
      ...prev,
      [e.target.name]: e.target.value,
    }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!params.id) return;

    try {
      setError('');
      const response = await fetch(`/api/notes/files/${params.id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(formData),
      });

      if (!response.ok) throw new Error('Failed to update note');

      // Navigate back to notes page after successful update
      navigate('/notes');
    } catch (err) {
      setError('Failed to update note. Please try again.');
      console.error('Error updating note:', err);
    }
  };

  const handleDelete = async () => {
    if (!params.id || !window.confirm('Are you sure you want to delete this note? This action cannot be undone.')) return;

    try {
      setError('');
      const response = await fetch(`/api/notes/files/${params.id}`, {
        method: 'DELETE',
      });

      if (!response.ok) throw new Error('Failed to delete note');

      // Navigate back to notes page after successful deletion
      navigate('/notes');
    } catch (err) {
      setError('Failed to delete note. Please try again.');
      console.error('Error deleting note:', err);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-r from-purple-50 to-indigo-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto bg-white rounded-lg shadow-lg overflow-hidden">
        <div className="bg-indigo-600 px-6 py-4">
          <h1 className="text-2xl font-bold text-white">Edit Note</h1>
        </div>
        <div className="px-6 py-8">
          {error && (
            <div className="mb-4 p-3 bg-red-100 text-red-700 rounded-md">
              {error}
            </div>
          )}
          <Form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700">
                File Name
              </label>
              <input
                type="text"
                name="name"
                id="name"
                value={formData.name}
                onChange={handleChange}
                className="mt-1 focus:ring-indigo-500 focus:border-indigo-500 block w-full shadow-sm sm:text-sm border-gray-300 rounded-md"
                required
              />
            </div>
            <div className="flex items-center justify-between">
              <button
                type="button"
                onClick={handleDelete}
                className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
              >
                Delete Note
              </button>
              <div className="flex items-center space-x-3">
                <button
                  type="button"
                  onClick={() => navigate('/notes')}
                  className="inline-flex items-center px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-indigo-600 hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500"
                >
                  Save Changes
                </button>
              </div>
            </div>
          </Form>
        </div>
        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
            <div>
              <span className="font-medium">File Type:</span> {noteFile.type}
            </div>
            <div>
              <span className="font-medium">Size:</span> {Math.round(noteFile.size / 1024)} KB
            </div>
            <div>
              <span className="font-medium">Uploaded At:</span> {new Date(noteFile.uploadedAt).toLocaleString()}
            </div>
            <div>
              <span className="font-medium">Uploaded By:</span> {noteFile.userName}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}