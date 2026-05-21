import { useCart } from '../context/CartContext';
import { useState } from 'react';

export default function Carrito() {
  const { cartItems, removeFromCart, updateQuantity, clearCart, cartTotal, isCartOpen, setIsCartOpen } = useCart();
  const [checkoutStatus, setCheckoutStatus] = useState(null);
  const [loading, setLoading] = useState(false);

  if (!isCartOpen) return null;

  const handleCheckout = async () => {
    if (cartItems.length === 0) return;
    
    setLoading(true);
    setCheckoutStatus(null);
    const token = localStorage.getItem('token');

    try {
      const itemsPayload = cartItems.map(item => ({
        id_variante: item.id_variante,
        id_sucursal: item.id_sucursal || 1, // Fallback si es null
        cantidad: item.cantidad,
        precio_unitario: item.precio
      }));

      const res = await fetch('http://localhost:8000/api/tpv/venta', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': token ? `Bearer ${token}` : ''
        },
        body: JSON.stringify({ items: itemsPayload })
      });

      if (res.ok) {
        setCheckoutStatus('success');
        clearCart();
        setTimeout(() => {
          setIsCartOpen(false);
          setCheckoutStatus(null);
        }, 2000);
      } else {
        const error = await res.json();
        setCheckoutStatus(error.detail || 'Error procesando la compra');
      }
    } catch (err) {
      setCheckoutStatus('Error de conexión con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      {/* Overlay */}
      <div 
        className="fixed inset-0 bg-black bg-opacity-50 z-50 transition-opacity"
        onClick={() => setIsCartOpen(false)}
      ></div>

      {/* Cart Panel */}
      <div className="fixed inset-y-0 right-0 max-w-md w-full bg-white shadow-2xl z-50 flex flex-col transform transition-transform duration-300 ease-in-out">
        <div className="p-4 border-b border-gray-200 flex justify-between items-center bg-brand-50">
          <h2 className="text-xl font-black text-brand-900 flex items-center gap-2">
            🛒 Tu Carrito
          </h2>
          <button 
            onClick={() => setIsCartOpen(false)}
            className="text-gray-500 hover:text-red-500 font-bold p-2"
          >
            ✕ Cerrar
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-4 space-y-4">
          {cartItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <span className="text-6xl mb-4">🛍️</span>
              <p className="text-lg font-medium">Tu carrito está vacío</p>
              <button 
                onClick={() => setIsCartOpen(false)}
                className="mt-4 text-brand-600 hover:text-brand-800 font-bold underline"
              >
                Seguir comprando
              </button>
            </div>
          ) : (
            cartItems.map(item => (
              <div key={item.id_variante} className="flex gap-4 border border-gray-100 p-3 rounded-xl shadow-sm hover:shadow-md transition-shadow">
                <img src={item.imagen} alt={item.producto} className="w-20 h-20 object-cover rounded-lg border border-gray-200" />
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <h3 className="font-bold text-gray-800 line-clamp-1">{item.producto}</h3>
                    <p className="text-xs text-gray-500">{item.detalles}</p>
                  </div>
                  <div className="flex justify-between items-center mt-2">
                    <span className="font-black text-brand-900">${item.precio}</span>
                    <div className="flex items-center gap-2 bg-gray-100 rounded-lg p-1">
                      <button 
                        onClick={() => updateQuantity(item.id_variante, item.cantidad - 1)}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded-md text-gray-600 font-bold hover:bg-gray-200 shadow-sm"
                      >-</button>
                      <span className="w-4 text-center text-sm font-bold">{item.cantidad}</span>
                      <button 
                        onClick={() => updateQuantity(item.id_variante, item.cantidad + 1)}
                        className="w-6 h-6 flex items-center justify-center bg-white rounded-md text-gray-600 font-bold hover:bg-gray-200 shadow-sm"
                      >+</button>
                    </div>
                  </div>
                </div>
                <button 
                  onClick={() => removeFromCart(item.id_variante)}
                  className="text-red-400 hover:text-red-600 p-1 self-start"
                >
                  🗑️
                </button>
              </div>
            ))
          )}
        </div>

        {cartItems.length > 0 && (
          <div className="p-6 border-t border-gray-200 bg-gray-50">
            {checkoutStatus && (
              <div className={`mb-4 p-3 rounded-lg text-center font-bold text-sm ${checkoutStatus === 'success' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {checkoutStatus === 'success' ? '✅ ¡Compra realizada con éxito!' : `❌ ${checkoutStatus}`}
              </div>
            )}
            
            <div className="flex justify-between items-center mb-4 text-lg">
              <span className="font-medium text-gray-600">Subtotal:</span>
              <span className="font-black text-2xl text-brand-900">${cartTotal.toFixed(2)}</span>
            </div>
            
            <button 
              onClick={handleCheckout}
              disabled={loading}
              className="w-full bg-brand-600 hover:bg-brand-800 text-white py-4 rounded-xl font-bold text-lg shadow-md transition-transform transform active:scale-95 disabled:opacity-50"
            >
              {loading ? 'Procesando...' : 'Finalizar Compra 💳'}
            </button>
          </div>
        )}
      </div>
    </>
  );
}