import { useState, useEffect } from 'react';

function TiendaCliente() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [mensajeCompra, setMensajeCompra] = useState(null);

  useEffect(() => {
    const token = localStorage.getItem('token');
    // Obtenemos los productos con su stock del API Gateway unificado
    fetch('http://localhost:8000/api/dashboard/inventory', {
      headers: {
        'Authorization': `Bearer ${token}`
      }
    })
      .then((respuesta) => respuesta.json())
      .then((datos) => {
        if (Array.isArray(datos)) {
          setProductos(datos);
        } else {
          console.error("La respuesta no es un array válido:", datos);
          setProductos([]); // Evita que se rompa el .map
        }
        setCargando(false);
      })
      .catch((error) => {
        console.error("Error al cargar productos: ", error);
        setCargando(false);
      });
  }, []);

  const handleComprar = async (id_variante, id_sucursal) => {
    setMensajeCompra(null);
    const token = localStorage.getItem('token');
    try {
      const response = await fetch('http://localhost:8000/api/tpv/venta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: [
            {
              id_variante: id_variante,
              id_sucursal: id_sucursal || 1, // Default fallback if no sucursal is specified
              cantidad: 1,
              precio_unitario: 500 // Simulando precio, en la vida real viene del carrito
            }
          ]
        })
      });

      if (response.ok) {
        setMensajeCompra("✅ ¡Compra realizada con éxito! El stock se ha actualizado.");
        // Refrescar los datos para ver el nuevo stock
        const newData = await fetch('http://localhost:8000/api/dashboard/inventory', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        }).then(res => res.json());
        setProductos(newData);
      } else {
        const errorData = await response.json();
        setMensajeCompra(`❌ Error: ${errorData.detail?.detail || 'No se pudo completar la compra'}`);
      }
    } catch (error) {
      setMensajeCompra("❌ Error de conexión al servidor.");
    }
  };

  if (cargando) {
    return <div className="text-center p-10 text-xl font-bold">Cargando catálogo... ⏳</div>;
  }

  return (
    <div className="p-8 max-w-7xl mx-auto min-h-screen bg-brand-50">
      <header className="mb-12 text-center">
        <h2 className="text-5xl font-black text-brand-900 mb-3 tracking-tight">EDMIRS - Portal de Compras</h2>
        <p className="text-brand-800 font-medium text-lg"> Punto de Venta </p>
      </header>

      {mensajeCompra && (
        <div className={`mb-8 p-4 rounded-xl font-bold text-center shadow-sm max-w-2xl mx-auto ${mensajeCompra.includes('✅') ? 'bg-green-100 text-green-800 border border-green-200' : 'bg-red-100 text-red-800 border border-red-200'}`}>
          {mensajeCompra}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {productos.map(producto => (
          <div key={producto.id} className="bg-white rounded-3xl shadow-md hover:shadow-xl transition-all duration-300 p-6 border border-brand-100 hover:border-brand-300 flex flex-col justify-between transform hover:-translate-y-1">
            <div>
              <div className="flex justify-between items-start mb-4">
                <span className="text-xs font-bold text-brand-600 bg-brand-100 px-3 py-1.5 rounded-full uppercase tracking-widest">{producto.sucursal}</span>
                <span className="text-xs font-semibold text-brand-800 bg-brand-50 border border-brand-200 px-3 py-1.5 rounded-full">{producto.categoria}</span>
              </div>
              <h3 className="text-2xl font-extrabold text-brand-900 mb-2 leading-tight">{producto.producto}</h3>
              <p className="text-brand-600 text-sm mb-4 font-medium">SKU: {producto.sku} | {producto.detalles}</p>
              <div className="text-4xl font-black text-brand-900 mb-6">${producto.precio}</div>
            </div>
            
            <div className="mt-2 pt-5 border-t border-brand-100">
              <div className="flex justify-between items-center mb-6">
                <span className="text-brand-800 font-semibold text-sm">Disponibilidad:</span>
                {producto.stock > 0 ? (
                  <span className="px-4 py-1.5 bg-green-100 text-green-800 rounded-full text-xs font-bold shadow-sm border border-green-200">
                    {producto.stock} unidades
                  </span>
                ) : (
                  <span className="px-4 py-1.5 bg-red-100 text-red-800 rounded-full text-xs font-bold shadow-sm border border-red-200">
                    Agotado
                  </span>
                )}
              </div>
              
              <button 
                onClick={() => handleComprar(producto.id_variante, producto.id_sucursal)} 
                disabled={producto.stock <= 0}
                className={`w-full py-4 rounded-2xl font-bold text-lg transition-all transform active:scale-[0.98] ${
                  producto.stock > 0 
                    ? 'bg-brand-100 text-brand-900 hover:bg-brand-200 border border-brand-200 shadow-sm' 
                    : 'bg-gray-100 text-gray-400 cursor-not-allowed border border-gray-200'
                }`}
              >
                {producto.stock > 0 ? '🛍️ Comprar 1 Unidad' : '❌ Sin Stock'}
              </button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

export default TiendaCliente;