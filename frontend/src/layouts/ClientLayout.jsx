import { Outlet, Link, useNavigate } from 'react-router-dom';

export default function ClientLayout({ rolActual, handleLogout }) {
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <div className="min-h-screen flex flex-col font-sans">
      <nav className="bg-brand-50 shadow-sm border-b border-brand-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex items-center">
              <div className="flex-shrink-0 flex items-center gap-2">
                <span className="text-2xl">🏢</span>
                <span className="text-brand-900 font-extrabold text-xl tracking-tight">EDMIRS</span>
              </div>
              <div className="hidden sm:ml-8 sm:flex sm:space-x-8 items-center">
                <Link to="/" className="text-brand-800 hover:text-brand-600 inline-flex items-center px-1 text-sm font-medium transition-colors">
                  <span className="mr-2">🛍️</span> Portal de Compras
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-6">
              {rolActual === 'admin' && (
                <Link
                  to="/admin"
                  className="text-brand-800 hover:text-brand-600 px-3 py-2 text-sm font-medium transition-colors underline-offset-4 hover:underline"
                >
                  Ir al Dashboard
                </Link>
              )}
              {rolActual ? (
                <div className="flex items-center space-x-4">
                  <span className="text-brand-800 text-sm">
                    Hola, <strong className="text-brand-900 font-bold capitalize">{rolActual}</strong>
                  </span>
                  <button
                    onClick={onLogout}
                    className="bg-red-500 hover:bg-red-600 text-white px-5 py-2 rounded-full text-sm font-bold shadow-sm transition-all transform hover:scale-105 active:scale-95"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="bg-brand-600 hover:bg-brand-800 text-white px-5 py-2 rounded-full text-sm font-bold shadow-sm transition-all transform hover:scale-105 active:scale-95"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 w-full bg-brand-50">
        <Outlet />
      </main>
    </div>
  );
}
