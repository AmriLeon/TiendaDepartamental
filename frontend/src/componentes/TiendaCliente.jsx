import { useState, useEffect } from 'react';
import { useCart } from '../context/CartContext';
import { useOutletContext } from 'react-router-dom';

function TiendaCliente() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [errorCarga, setErrorCarga] = useState(null);
  
  const { searchTerm, selectedCategory, setSelectedCategory } = useOutletContext();
  const { addToCart, setIsCartOpen } = useCart();

  useEffect(() => {
    let mounted = true;

    const fetchData = async () => {
      try {
        const respuesta = await fetch('http://localhost:8000/api/dashboard/inventory');
        const datos = await respuesta.json();

        if (!mounted) return;

        if (respuesta.ok && Array.isArray(datos)) {
          setProductos(datos);
          setErrorCarga(null);
        } else {
          setProductos([]);
          setErrorCarga('No se pudo cargar el inventario. Verifica que el backend esté activo.');
        }
      } catch (error) {
        if (!mounted) return;
        setErrorCarga('No se pudo conectar con el servidor. Reintentando automáticamente...');
      } finally {
        if (mounted) setCargando(false);
      }
    };

    fetchData();
    const interval = setInterval(fetchData, 5000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  const categorias = ['Todas', ...new Set(productos.map(p => p.categoria))];

  const productosFiltrados = productos.filter(p => {
    const matchesCategory = selectedCategory === 'Todas' || p.categoria === selectedCategory;
    const matchesSearch = p.producto.toLowerCase().includes(searchTerm.toLowerCase()) || 
                          (p.descripcion && p.descripcion.toLowerCase().includes(searchTerm.toLowerCase()));
    return matchesCategory && matchesSearch;
  });

  const handleAddToCart = (producto) => {
    addToCart(producto);
    setIsCartOpen(true); // Abre el carrito para mostrar feedback visual
  };

  if (cargando) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[60vh] text-brand-900">
        <div className="w-16 h-16 border-4 border-brand-200 border-t-brand-600 rounded-full animate-spin mb-4"></div>
        <h2 className="text-xl font-bold">Cargando los mejores productos...</h2>
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto min-h-screen">
      
      {/* Banner Promocional */}
      {selectedCategory === 'Todas' && !searchTerm && (
        <div className="bg-gradient-to-r from-brand-900 to-brand-600 text-white p-8 md:p-12 mb-8 md:rounded-b-3xl shadow-lg relative overflow-hidden">
          <div className="relative z-10">
            <span className="bg-yellow-400 text-yellow-900 text-xs font-black px-3 py-1 rounded-full uppercase tracking-widest mb-4 inline-block shadow-sm">
              OFERTA ESPECIAL
            </span>
            <h2 className="text-4xl md:text-5xl font-black mb-4 leading-tight">
              Descubre la nueva <br/> colección de tecnología
            </h2>
            <p className="text-brand-100 text-lg mb-6 max-w-lg">
              Aprovecha hasta un 40% de descuento en pantallas, celulares y electrodomésticos seleccionados.
            </p>
            <button 
              onClick={() => setSelectedCategory('Celulares')}
              className="bg-white text-brand-900 px-6 py-3 rounded-full font-bold shadow-md hover:bg-gray-100 transition-colors"
            >
              Ver Ofertas
            </button>
          </div>
          <div className="absolute right-0 bottom-0 opacity-20 transform translate-x-1/4 translate-y-1/4">
            <span className="text-[20rem]">📺</span>
          </div>
        </div>
      )}

      <div className="px-4 sm:px-6 lg:px-8 mt-6">
        {errorCarga && productos.length === 0 && (
          <div className="mb-6 bg-red-50 border border-red-200 text-red-700 rounded-xl p-4 font-bold text-sm flex items-center justify-between gap-4">
            <span>⚠️ {errorCarga}</span>
            <button
              onClick={() => window.location.reload()}
              className="bg-white border border-red-200 text-red-700 px-4 py-2 rounded-lg font-bold hover:bg-red-100 transition-colors"
            >
              Reintentar
            </button>
          </div>
        )}
        
        {/* Category Filters */}
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-2xl font-black text-brand-900">
            {searchTerm ? `Resultados para "${searchTerm}"` : (selectedCategory === 'Todas' ? 'Nuestros Productos' : selectedCategory)}
          </h3>
          <div className="hidden md:flex gap-2">
            {categorias.slice(0, 5).map(cat => (
              <button
                key={cat}
                onClick={() => setSelectedCategory(cat)}
                className={`px-4 py-1.5 rounded-full text-sm font-bold transition-all shadow-sm ${
                  selectedCategory === cat 
                    ? 'bg-brand-900 text-white' 
                    : 'bg-white text-brand-800 border border-brand-200 hover:bg-brand-50'
                }`}
              >
                {cat}
              </button>
            ))}
          </div>
        </div>

        {/* Mobile Category Select */}
        <div className="md:hidden mb-6">
          <select 
            value={selectedCategory}
            onChange={(e) => setSelectedCategory(e.target.value)}
            className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-3 outline-none font-bold shadow-sm"
          >
            {categorias.map(cat => (
              <option key={cat} value={cat}>{cat}</option>
            ))}
          </select>
        </div>

        {/* Product Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 mb-12">
          {productosFiltrados.map(producto => (
            <div key={producto.id} className="bg-white rounded-2xl shadow-sm hover:shadow-xl transition-all duration-300 border border-gray-100 flex flex-col overflow-hidden group">
              
              {/* Product Image */}
              <div className="relative h-48 bg-gray-100 flex items-center justify-center overflow-hidden p-4">
                {producto.imagen ? (
                  <img src={producto.imagen} alt={producto.producto} className="w-full h-full object-contain mix-blend-multiply group-hover:scale-105 transition-transform duration-500" />
                ) : (
                  <span className="text-6xl opacity-50">🛍️</span>
                )}
                {producto.stock <= 3 && producto.stock > 0 && (
                  <span className="absolute top-2 left-2 bg-red-500 text-white text-xs font-bold px-2 py-1 rounded-md shadow-sm">
                    ¡Últimos {producto.stock}!
                  </span>
                )}
                {!producto.stock && (
                  <div className="absolute inset-0 bg-white/60 backdrop-blur-sm flex items-center justify-center z-10">
                    <span className="bg-gray-800 text-white px-3 py-1 rounded-full font-bold text-sm">AGOTADO</span>
                  </div>
                )}
              </div>

              {/* Product Info */}
              <div className="p-5 flex flex-col flex-1">
                <div className="flex justify-between items-start mb-2">
                  <span className="text-[10px] font-bold text-brand-600 bg-brand-50 px-2 py-1 rounded uppercase tracking-wider">
                    {producto.categoria}
                  </span>
                  <span className="text-[10px] font-semibold text-gray-400">
                    {producto.sucursal_nombre || producto.sucursal}
                  </span>
                </div>
                
                <h3 className="text-lg font-bold text-gray-900 mb-1 line-clamp-2 leading-tight">
                  {producto.producto}
                </h3>
                <p className="text-gray-500 text-xs mb-4 line-clamp-2 min-h-[2rem]">
                  {producto.descripcion || producto.detalles}
                </p>
                
                <div className="mt-auto">
                  <div className="text-2xl font-black text-brand-900 mb-4">
                    ${producto.precio.toLocaleString('en-US', { minimumFractionDigits: 2 })}
                  </div>
                  
                  <button 
                    onClick={() => handleAddToCart(producto)} 
                    disabled={producto.stock <= 0}
                    className={`w-full py-3 rounded-xl font-bold text-sm transition-all transform active:scale-95 flex items-center justify-center gap-2 ${
                      producto.stock > 0 
                        ? 'bg-brand-600 text-white hover:bg-brand-800 shadow-md hover:shadow-lg' 
                        : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                    }`}
                  >
                    {producto.stock > 0 ? (
                      <><span>🛒</span> Añadir al carrito</>
                    ) : (
                      'Agotado'
                    )}
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>

        {productosFiltrados.length === 0 && (
          <div className="text-center py-20 text-gray-500">
            <span className="text-6xl mb-4 block">🔍</span>
            <h3 className="text-xl font-bold mb-2">No encontramos productos</h3>
            <p>Intenta seleccionar otra categoría o elimina los filtros.</p>
            <button 
              onClick={() => { setSelectedCategory('Todas'); }}
              className="mt-4 bg-brand-100 text-brand-800 px-6 py-2 rounded-full font-bold hover:bg-brand-200 transition-colors"
            >
              Ver todos los productos
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

export default TiendaCliente;
