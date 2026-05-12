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
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <nav className="bg-gray-900 shadow-md border-b border-gray-800">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between h-16">
            <div className="flex">
              <div className="flex-shrink-0 flex items-center">
                <span className="text-white font-bold text-xl tracking-tight">🏢 EDMIRS</span>
              </div>
              <div className="hidden sm:ml-6 sm:flex sm:space-x-8">
                <div className="border-blue-500 text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">
                  📊 Dashboard Admin
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-4">
              <Link
                to="/"
                className="text-gray-300 hover:text-white px-3 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Ver Tienda
              </Link>
              <span className="text-gray-300 text-sm border-l border-gray-700 pl-4">
                Admin
              </span>
              <button
                onClick={onLogout}
                className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors"
              >
                Cerrar Sesión
              </button>
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
