import type { Route } from "./+types/notes";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "学习笔记 - 哲学书籍分享平台" },
    { name: "description", content: "查看和分享哲学学习笔记" },
  ];
}

// 模拟笔记数据
const mockNotes = [
  {
    id: "1",
    title: "柏拉图理想国核心思想",
    author: "哲学爱好者",
    category: "西方哲学",
    content: "《理想国》是柏拉图的代表作，主要探讨正义的本质、理想的国家制度以及哲学家王的理念。书中通过苏格拉底的对话，提出了著名的洞穴喻，阐述了哲学家从洞穴中走出，认识到真理的过程...",
    createdAt: "2024-01-20",
    likes: 42
  },
  {
    id: "2",
    title: "亚里士多德的伦理学思想",
    author: "哲学研究者",
    category: "西方哲学",
    content: "亚里士多德在《尼各马可伦理学》中提出了幸福是最高善的观点，并认为幸福在于合乎德性的活动。他将德性分为道德德性和理智德性，强调中道原则...",
    createdAt: "2024-02-15",
    likes: 35
  },
  {
    id: "3",
    title: "老子道德经的道与德",
    author: "东方哲学爱好者",
    category: "东方哲学",
    content: "《道德经》中的'道'是宇宙的本原和规律，'德'是道在万物中的体现。老子主张'道法自然'、'无为而治'，强调顺应自然规律，不过分干预事物的发展...",
    createdAt: "2024-03-10",
    likes: 28
  },
  {
    id: "4",
    title: "海德格尔存在与时间解读",
    author: "现代哲学研究者",
    category: "现代哲学",
    content: "海德格尔在《存在与时间》中提出了'此在'的概念，强调存在的时间性。他认为，人的存在是向死存在，只有面对死亡，才能真正理解存在的意义...",
    createdAt: "2024-04-05",
    likes: 22
  }
];

export function loader({ context }: Route.LoaderArgs) {
  return {
    notes: mockNotes,
    isAuthenticated: false,
    isAdmin: false
  };
}

// 笔记卡片组件
function NoteCard({ note }: { note: typeof mockNotes[0] }) {
  return (
    <div className="bg-white rounded-xl shadow-md overflow-hidden transition-all hover:shadow-lg hover:translate-y-[-4px]">
      <div className="p-6">
        <div className="flex justify-between items-start mb-4">
          <h3 className="text-2xl font-bold text-gray-800 line-clamp-1">{note.title}</h3>
          <span className="px-3 py-1 bg-purple-100 text-purple-800 rounded-full text-xs font-medium">
            {note.category}
          </span>
        </div>
        <div className="flex items-center mb-4 text-sm text-gray-500">
          <span>作者: {note.author}</span>
          <span className="mx-2">•</span>
          <span>发布于: {note.createdAt}</span>
          <span className="mx-2">•</span>
          <span>👍 {note.likes}</span>
        </div>
        <p className="text-gray-700 mb-6 line-clamp-3">{note.content}</p>
        <div className="flex justify-end">
          <button className="px-5 py-2 bg-purple-600 text-white rounded-lg font-medium hover:bg-purple-700 transition-colors">
            阅读全文
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Notes({ loaderData }: Route.ComponentProps) {
  const { notes, isAuthenticated, isAdmin } = loaderData;

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
      <main className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold text-gray-800 mb-4">哲学学习笔记</h2>
          <p className="text-gray-600 max-w-3xl mx-auto">
            查看和分享哲学学习心得，与其他哲学爱好者交流思想与见解
          </p>
        </div>

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