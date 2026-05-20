import { Outlet, Link, useNavigate, Navigate } from 'react-router-dom';

export default function AdminLayout({ rolActual, handleLogout }) {
  const navigate = useNavigate();

  // Si no es admin, redirigir al login o al home
  if (rolActual !== 'admin') {
    return <Navigate to="/login" replace />;
  }

  const onLogout = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex bg-brand-50 font-sans">
      {/* Sidebar */}
      <aside className="w-64 bg-brand-900 shadow-xl flex flex-col hidden md:flex sticky top-0 h-screen">
        <div className="p-6 border-b border-brand-800 flex items-center gap-3">
          <span className="text-3xl">🏢</span>
          <span className="text-brand-50 font-black text-2xl tracking-tight">EDMIRS</span>
        </div>
        
        <div className="p-4 flex-1">
          <div className="text-xs font-bold text-brand-400 uppercase tracking-wider mb-4 px-2">Menu Principal</div>
          <nav className="space-y-1">
            <div className="bg-brand-800 text-brand-50 px-4 py-3 rounded-xl flex items-center gap-3 font-semibold shadow-sm border border-brand-600">
              <span>📊</span> Dashboard
            </div>
          </nav>
        </div>

        <div className="p-4 border-t border-brand-800">
          <div className="px-4 py-3 bg-brand-800/50 rounded-xl mb-4">
            <p className="text-xs text-brand-400 font-medium">Usuario actual</p>
            <p className="text-sm text-brand-50 font-bold capitalize flex items-center gap-2">
              <span className="w-2 h-2 bg-green-400 rounded-full inline-block"></span>
              {rolActual}
            </p>
          </div>
          <button
            onClick={onLogout}
            className="w-full bg-red-500/10 hover:bg-red-500 hover:text-white text-red-400 border border-red-500/20 px-4 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center justify-center gap-2"
          >
            <span>🚪</span> Cerrar Sesión
          </button>
        </div>
      </aside>

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-h-screen overflow-hidden">
        {/* Mobile Header (only visible on small screens) */}
        <header className="md:hidden bg-brand-900 text-white p-4 flex justify-between items-center sticky top-0 z-50 shadow-md">
          <div className="flex items-center gap-2">
            <span className="text-xl">🏢</span>
            <span className="font-black tracking-tight">EDMIRS Admin</span>
          </div>
          <button onClick={onLogout} className="text-sm bg-red-500 px-3 py-1.5 rounded-lg font-bold">Salir</button>
        </header>

        {/* Top Navbar */}
        <header className="bg-white shadow-sm border-b border-brand-200 h-16 hidden md:flex items-center justify-between px-8 sticky top-0 z-40">
          <h1 className="text-xl font-bold text-brand-900">Panel de Administración</h1>
          <div className="flex items-center gap-4">
            <Link
              to="/"
              className="text-brand-600 hover:text-brand-900 font-semibold text-sm flex items-center gap-2 transition-colors bg-brand-50 px-4 py-2 rounded-lg border border-brand-100 hover:border-brand-300"
            >
              <span>🛍️</span> Ver Tienda
            </Link>
          </div>
        </header>

        <main className="flex-1 w-full p-4 md:p-8 overflow-y-auto">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
