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
      const response = await fetch('http://localhost:8000/orders/orders', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          items: [
            {
              id_variante: id_variante,
              id_sucursal: id_sucursal,
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
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <header className="mb-10 text-center">
        <h2 className="text-4xl font-extrabold text-blue-900 mb-2">🛍️ EDMIRS - Portal de Compras</h2>
        <p className="text-gray-600">Vista del Cliente (Punto de Venta Web)</p>
      </header>

      {mensajeCompra && (
        <div className={`mb-6 p-4 rounded-lg font-bold text-center ${mensajeCompra.includes('✅') ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
          {mensajeCompra}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
        {productos.map(producto => (
          <div key={producto.id} className="bg-white rounded-2xl shadow-lg hover:shadow-xl transition-shadow duration-300 p-6 border border-gray-100 flex flex-col justify-between">
            <div>
              <div className="flex justify-between items-start mb-3">
                <span className="text-xs font-bold text-blue-600 bg-blue-50 px-2 py-1 rounded-md uppercase tracking-wider">{producto.sucursal}</span>
                <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-md">{producto.categoria}</span>
              </div>
              <h3 className="text-2xl font-bold text-gray-900 mb-2">{producto.producto}</h3>
              <p className="text-gray-500 text-sm mb-2">SKU: {producto.sku} | {producto.detalles}</p>
              <div className="text-3xl font-extrabold text-blue-900 mb-4">${producto.precio}</div>
            </div>
            
            <div className="mt-4 pt-4 border-t border-gray-100">
              <div className="flex justify-between items-center mb-5">
                <span className="text-gray-600 font-semibold text-sm">Disponibilidad:</span>
                {producto.stock > 0 ? (
                  <span className="px-3 py-1 bg-green-100 text-green-800 rounded-full text-xs font-bold shadow-sm">
                    {producto.stock} unidades
                  </span>
                ) : (
                  <span className="px-3 py-1 bg-red-100 text-red-800 rounded-full text-xs font-bold shadow-sm">
                    Agotado
                  </span>
                )}
              </div>
              
              <button 
                onClick={() => handleComprar(producto.id, producto.id)} // id de la variante y sucursal. En un caso real vendría mapeado correctamente.
                disabled={producto.stock <= 0}
                className={`w-full py-3.5 rounded-xl font-bold text-white transition-all transform hover:scale-[1.02] active:scale-[0.98] ${
                  producto.stock > 0 
                    ? 'bg-gradient-to-r from-blue-600 to-indigo-700 hover:from-blue-700 hover:to-indigo-800 shadow-md' 
                    : 'bg-gray-300 cursor-not-allowed'
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