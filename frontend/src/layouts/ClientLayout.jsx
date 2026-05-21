import { Outlet, Link, useNavigate, useLocation } from 'react-router-dom';
import { useCart } from '../context/CartContext';
import Carrito from '../componentes/Carrito';
import { useState } from 'react';

export default function ClientLayout({ rolActual, handleLogout }) {
  const navigate = useNavigate();
  const location = useLocation();
  const { cartCount, setIsCartOpen } = useCart();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('Todas');

  const onLogout = () => {
    handleLogout();
    navigate('/');
  };

  const handleSearch = (e) => {
    setSearchTerm(e.target.value);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const handleCategorySelect = (cat) => {
    setSelectedCategory(cat);
    if (location.pathname !== '/') {
      navigate('/');
    }
  };

  const categories = [
    'Todas', 'Alimentos', 'Deportes', 'Farmacia', 'Limpieza', 
    'Cuidado personal', 'Mascotas', 'Electrodomésticos', 'Celulares', 'Pantallas y audio', 'Bebidas', 'Licores'
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans bg-gray-50">
      <nav className="bg-brand-900 shadow-md border-b border-brand-800 sticky top-0 z-40 text-white">
        {/* Top Navbar */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            
            {/* Logo */}
            <div className="flex-shrink-0 flex items-center gap-2 cursor-pointer" onClick={() => navigate('/')}>
              <span className="text-3xl">🏢</span>
              <span className="text-white font-extrabold text-2xl tracking-tight hidden sm:block">EDMIRS</span>
            </div>

            {/* Search Bar (Desktop) */}
            <div className="hidden md:flex flex-1 max-w-xl mx-8">
              <div className="relative w-full">
                <input 
                  type="text" 
                  value={searchTerm}
                  onChange={handleSearch}
                  placeholder="Buscar productos, marcas y más..." 
                  className="w-full bg-white text-gray-900 rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 shadow-inner"
                />
                <button className="absolute right-2 top-2 text-gray-400 hover:text-brand-600">
                  🔍
                </button>
              </div>
            </div>

            {/* User & Cart */}
            <div className="flex items-center space-x-4 sm:space-x-6">
              {rolActual === 'admin' && (
                <Link
                  to="/admin"
                  className="text-brand-200 hover:text-white px-3 py-2 text-sm font-medium transition-colors underline-offset-4 hover:underline hidden sm:block"
                >
                  Ir al Dashboard
                </Link>
              )}
              {rolActual ? (
                <div className="hidden sm:flex items-center space-x-4">
                  <span className="text-brand-100 text-sm">
                    Hola, <strong className="text-white font-bold capitalize">{rolActual}</strong>
                  </span>
                  <button
                    onClick={onLogout}
                    className="text-sm text-red-300 hover:text-red-400 font-bold transition-colors"
                  >
                    Cerrar Sesión
                  </button>
                </div>
              ) : (
                <Link
                  to="/login"
                  className="text-white hover:text-brand-200 text-sm font-bold transition-colors hidden sm:block"
                >
                  Ingresa / Regístrate
                </Link>
              )}

              {/* Cart Button */}
              <button 
                onClick={() => setIsCartOpen(true)}
                className="relative flex items-center gap-1 hover:text-brand-200 transition-colors p-2"
              >
                <span className="text-2xl">🛒</span>
                {cartCount > 0 && (
                  <span className="absolute top-0 right-0 -mt-1 -mr-1 bg-red-500 text-white text-xs font-black w-5 h-5 flex items-center justify-center rounded-full shadow-md">
                    {cartCount}
                  </span>
                )}
              </button>
            </div>
          </div>
        </div>

        {/* Categories Bar */}
        <div className="bg-brand-800 text-brand-100 text-sm py-2 px-4 shadow-inner">
          <div className="max-w-7xl mx-auto flex gap-6 overflow-x-auto no-scrollbar">
            {categories.map(cat => (
              <span 
                key={cat} 
                onClick={() => handleCategorySelect(cat)}
                className={`cursor-pointer whitespace-nowrap transition-colors ${selectedCategory === cat ? 'font-bold text-white' : 'hover:text-white'}`}
              >
                {cat === 'Todas' ? 'Todas las Categorías' : cat}
              </span>
            ))}
          </div>
        </div>
      </nav>

      {/* Mobile Search Bar */}
      <div className="md:hidden bg-brand-900 p-3 border-t border-brand-800">
        <div className="relative w-full">
          <input 
            type="text" 
            value={searchTerm}
            onChange={handleSearch}
            placeholder="Buscar en EDMIRS..." 
            className="w-full bg-white text-gray-900 rounded-lg pl-4 pr-10 py-2 focus:outline-none focus:ring-2 focus:ring-brand-400 shadow-inner"
          />
          <button className="absolute right-2 top-2 text-gray-400">
            🔍
          </button>
        </div>
      </div>

      <main className="flex-1 w-full bg-gray-50 pb-12">
        <Outlet context={{ searchTerm, selectedCategory, setSelectedCategory }} />
      </main>

      <Carrito />
    </div>
  );
}
