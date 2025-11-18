import type { Route } from "./+types/home";

export function meta({}: Route.MetaArgs) {
  return [
    { title: "哲学书籍分享平台" },
    { name: "description", content: "探索哲学世界，分享智慧与思考" },
  ];
}

export function loader({ context }: Route.LoaderArgs) {
  return {
    isAuthenticated: false, // 暂时硬编码为未登录
    isAdmin: false // 暂时硬编码为非管理员
  };
}

// 分类卡片组件
function CategoryCard({ title, description, link, icon }: { title: string; description: string; link: string; icon: string }) {
  return (
    <a 
      href={link} 
      className="bg-white bg-opacity-80 backdrop-blur-sm rounded-xl shadow-lg overflow-hidden transition-all hover:scale-105 hover:shadow-xl"
    >
      <div className="p-8 text-center">
        <div className="text-4xl mb-4">{icon}</div>
        <h3 className="text-2xl font-bold text-gray-800 mb-2">{title}</h3>
        <p className="text-gray-600 mb-4">{description}</p>
        <div className="inline-block px-6 py-3 bg-blue-600 text-white rounded-full font-medium hover:bg-blue-700 transition-colors">
          进入专区
        </div>
      </div>
    </a>
  );
}

export default function Home({ loaderData }: Route.ComponentProps) {
  const { isAuthenticated, isAdmin } = loaderData;
  
  return (
    <div className="min-h-screen bg-cover bg-center bg-fixed" style={{ backgroundImage: `url('/image/1.jpg')` }}>
      {/* 导航栏 */}
      <nav className="bg-white bg-opacity-90 backdrop-blur-sm shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <h1 className="text-2xl font-bold text-gray-900">哲学书籍分享平台</h1>
            </div>
            <div className="flex items-center space-x-6">
              {isAuthenticated ? (
                <div className="flex items-center space-x-4">
                  {isAdmin && (
                    <a 
                      href="/admin/upload" 
                      className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors"
                    >
                      上传书籍
                    </a>
                  )}
                  <button className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-2 rounded-full text-sm font-medium transition-colors">
                    退出登录
                  </button>
                </div>
              ) : (
                <div className="flex items-center space-x-4">
                  <a 
                    href="/login" 
                    className="bg-gray-200 hover:bg-gray-300 text-gray-900 px-6 py-2 rounded-full text-sm font-medium transition-colors"
                  >
                    登录
                  </a>
                  <a 
                    href="/register" 
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-full text-sm font-medium transition-colors"
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
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-20">
        {/* 欢迎信息 */}
        <div className="text-center mb-20">
          <h2 className="text-5xl font-bold text-white mb-6 drop-shadow-lg">探索哲学世界</h2>
          <p className="text-xl text-white bg-black bg-opacity-50 inline-block px-8 py-3 rounded-full drop-shadow-md">
            分享智慧，启迪思考
          </p>
        </div>
        
        {/* 分类卡片 */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-12 max-w-4xl mx-auto">
          <CategoryCard 
            title="哲学书籍" 
            description="探索各类哲学著作，涵盖西方哲学、东方哲学、现代哲学等多个领域" 
            link="/books" 
            icon="📚" 
          />
          <CategoryCard 
            title="学习笔记" 
            description="查看和分享哲学学习笔记，交流思想与见解" 
            link="/notes" 
            icon="📝" 
          />
        </div>
      </main>
      
      {/* 页脚 */}
      <footer className="bg-black bg-opacity-80 backdrop-blur-sm mt-24">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <div className="text-center text-white text-sm">
            <p>哲学书籍分享平台 &copy; {new Date().getFullYear()}</p>
            <p className="mt-2">探索智慧，传承思想</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
