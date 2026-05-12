import { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, Navigate } from 'react-router-dom';
import AdminLayout from './layouts/AdminLayout';
import ClientLayout from './layouts/ClientLayout';
import DashboardInventario from './componentes/DashboardInventario';
import TiendaCliente from './componentes/TiendaCliente';
import Auth from './componentes/Auth';

function App() {
  const [rolActual, setRolActual] = useState(null);
  const [cargando, setCargando] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('token');
    const rol = localStorage.getItem('rol');
    if (token && rol) {
      setRolActual(rol);
    }
    setCargando(false);
  }, []);

  const handleLogin = (rol) => {
    setRolActual(rol);
    if (rol === 'admin') {
      navigate('/admin');
    } else {
      navigate('/');
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('rol');
    setRolActual(null);
    navigate('/');
  };

  if (cargando) {
    return <div className="min-h-screen flex items-center justify-center">Cargando...</div>;
  }

  return (
    <Routes>
      {/* Rutas de Cliente (Frontend) */}
      <Route element={<ClientLayout rolActual={rolActual} handleLogout={handleLogout} />}>
        <Route path="/" element={<TiendaCliente />} />
      </Route>

      {/* Rutas de Administrador (Backend / Dashboard) */}
      <Route element={<AdminLayout rolActual={rolActual} handleLogout={handleLogout} />}>
        <Route path="/admin" element={<DashboardInventario />} />
      </Route>

      {/* Ruta de Autenticación */}
      <Route 
        path="/login" 
        element={
          rolActual ? (
            <Navigate to={rolActual === 'admin' ? '/admin' : '/'} replace />
          ) : (
            <div>
              <nav className="bg-gray-900 shadow-md border-b border-gray-800 p-4">
                <button onClick={() => navigate('/')} className="text-white hover:text-gray-300 font-medium text-sm flex items-center">
                  ← Volver a la Tienda
                </button>
              </nav>
              <Auth onLogin={handleLogin} />
            </div>
          )
        } 
      />

      {/* Ruta por defecto para URLs no encontradas */}
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
