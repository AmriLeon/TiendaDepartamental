import { Outlet, Link, useNavigate } from 'react-router-dom';

export default function ClientLayout({ rolActual, handleLogout }) {
  const navigate = useNavigate();

  const onLogout = () => {
    handleLogout();
    navigate('/');
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-gray-900 shadow-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-white font-bold text-xl tracking-tight">🏢 EDMIRS</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <Link to="/" className="border-blue-500 text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  🛍️ Portal de Compras
                </Link>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              {rolActual === 'admin' && (
                <Link
                  to="/admin"
                  className="text-blue-400 hover:text-blue-300 px-3 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Ir al Dashboard
                </Link>
              )}
              {rolActual ? (
                <>
                  <span className="text-gray-300 text-sm">
                    Hola, <strong className="text-white capitalize">{rolActual}</strong>
                  </span>
                  <button
                    onClick={onLogout}
                    className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </>
              ) : (
                <Link
                  to="/login"
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
                >
                  Iniciar Sesión
                </Link>
              )}
            </div>
          </div>
        </div>
      </nav>
      <main className="flex-1 w-full">
        <Outlet />
      </main>
    </div>
  );
}
