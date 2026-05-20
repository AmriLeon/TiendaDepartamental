import { useState } from 'react';

export default function InventarioUnificado({ inventario, onStockUpdate }) {
  // Estados para Añadir Stock
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedTalla, setSelectedTalla] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [cantidadToAdd, setCantidadToAdd] = useState('');
  const [loadingSync, setLoadingSync] = useState(false);
  const [syncMessage, setSyncMessage] = useState(null);

  // Estados para otros formularios
  const [nuevoProd, setNuevoProd] = useState({ nombre: '', categoria: '', talla: '', color: '', precio: '', stock: '', min: 5 });
  const [tpv, setTpv] = useState({ producto: '', talla: '', color: '', sucursal: '', cantidad: 1 });

  const alertas = inventario.filter(item => item.alerta_reabastecimiento);

  // Lógica para los selects dinámicos de Añadir Stock
  const uniqueProducts = Array.from(new Set(inventario.map(i => i.producto)));
  
  // Encontrar la categoría del producto seleccionado para saber si es Ropa (o si tiene talla/color que no sea N/A)
  const productItems = inventario.filter(i => i.producto === selectedProduct);
  const isClothing = productItems.some(i => i.categoria === 'Ropa' || (i.talla && i.talla !== 'N/A' && i.talla !== 'None'));

  const uniqueTallas = Array.from(new Set(productItems.map(i => i.talla).filter(t => t && t !== 'N/A' && t !== 'None')));
  const uniqueColores = Array.from(new Set(productItems.filter(i => i.talla === selectedTalla || !isClothing).map(i => i.color).filter(c => c && c !== 'N/A' && c !== 'None')));

  const handleSyncStock = async () => {
    if (!selectedProduct || !cantidadToAdd || Number(cantidadToAdd) <= 0) {
      setSyncMessage({ type: 'error', text: 'Por favor, llena los campos requeridos.' });
      return;
    }

    let targetItem = null;
    if (isClothing) {
      if (!selectedTalla || !selectedColor) {
        setSyncMessage({ type: 'error', text: 'Por favor, selecciona talla y color.' });
        return;
      }
      targetItem = productItems.find(i => i.talla === selectedTalla && i.color === selectedColor);
    } else {
      targetItem = productItems[0]; // Producto general, tomamos el primero
    }

    if (!targetItem) {
      setSyncMessage({ type: 'error', text: 'Variante no encontrada.' });
      return;
    }

    setLoadingSync(true);
    setSyncMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/inventario/add-stock', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          id_inventario: targetItem.id,
          cantidad: Number(cantidadToAdd)
        })
      });

      if (res.ok) {
        setSyncMessage({ type: 'success', text: 'Stock actualizado ✅' });
        setCantidadToAdd('');
        if (onStockUpdate) onStockUpdate();
      } else {
        setSyncMessage({ type: 'error', text: 'Error al actualizar' });
      }
    } catch (error) {
      setSyncMessage({ type: 'error', text: 'Error de red' });
    }
    setLoadingSync(false);
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
        <span className="text-brand-600">📦</span> 1. Inventario Unificado
      </h2>

      {/* Alertas y Añadir Stock */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 bg-brand-50/50 p-6 rounded-xl border border-brand-200">
        <div>
          <h3 className="text-red-600 font-bold mb-2 flex items-center gap-2">
            ⚠️ Alertas de Reabastecimiento
          </h3>
          <p className="text-brand-600 text-sm mb-4">Productos por debajo del stock mínimo operativo.</p>
          <div className="space-y-3">
            {alertas.length > 0 ? (
              alertas.map(item => (
                <div key={item.id} className="flex justify-between items-center bg-white border border-red-200 p-3 rounded-lg shadow-sm">
                  <div className="flex items-center gap-2">
                    <span className="text-red-500">🔴</span>
                    <span className="text-brand-900 font-medium">{item.producto} ({item.detalles.split('-')[1]?.trim()})</span>
                  </div>
                  <span className="bg-red-100 text-red-700 px-3 py-1 rounded-full text-xs font-bold">
                    {item.stock} en stock
                  </span>
                </div>
              ))
            ) : (
              <div className="text-brand-500 text-sm">No hay alertas de reabastecimiento.</div>
            )}
          </div>
        </div>

        <div>
          <h3 className="text-green-600 font-bold mb-2 flex items-center gap-2">
            ➕ Añadir Stock
          </h3>
          <p className="text-brand-600 text-sm mb-4">Actualiza existencias directamente en la base de datos.</p>
          <div className="space-y-3">
            <select 
              className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-2.5 focus:ring-2 focus:ring-brand-500 outline-none shadow-sm"
              value={selectedProduct}
              onChange={(e) => {
                setSelectedProduct(e.target.value);
                setSelectedTalla('');
                setSelectedColor('');
                setSyncMessage(null);
              }}
            >
              <option value="">1. Seleccionar Producto...</option>
              {uniqueProducts.map((prod, idx) => (
                <option key={idx} value={prod}>{prod}</option>
              ))}
            </select>

            {selectedProduct && isClothing && (
              <div className="grid grid-cols-2 gap-3">
                <select 
                  className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                  value={selectedTalla}
                  onChange={(e) => {
                    setSelectedTalla(e.target.value);
                    setSelectedColor('');
                    setSyncMessage(null);
                  }}
                >
                  <option value="">2. Seleccionar Talla...</option>
                  {uniqueTallas.map((t, idx) => (
                    <option key={idx} value={t}>{t}</option>
                  ))}
                </select>
                <select 
                  className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                  value={selectedColor}
                  onChange={(e) => {
                    setSelectedColor(e.target.value);
                    setSyncMessage(null);
                  }}
                  disabled={!selectedTalla}
                >
                  <option value="">3. Seleccionar Color...</option>
                  {uniqueColores.map((c, idx) => (
                    <option key={idx} value={c}>{c}</option>
                  ))}
                </select>
              </div>
            )}

            <div className="flex gap-3">
              <div className="relative flex-1">
                <span className="absolute left-3 top-2.5 text-brand-400">#</span>
                <input 
                  type="number" 
                  placeholder="Cant. a sumar" 
                  className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-2.5 pl-8 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" 
                  value={cantidadToAdd}
                  onChange={(e) => setCantidadToAdd(e.target.value)}
                  min="1"
                />
              </div>
              <button 
                onClick={handleSyncStock}
                disabled={loadingSync}
                className="bg-brand-600 hover:bg-brand-800 disabled:opacity-50 text-white font-bold py-2 px-6 rounded-lg transition-colors flex items-center gap-2 shadow-sm"
              >
                {loadingSync ? '...' : '☁️ SINCRONIZAR'}
              </button>
            </div>
            
            {syncMessage && (
              <div className={`text-sm font-bold ${syncMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {syncMessage.text}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Alta de Nueva Mercancía */}
      <div className="bg-brand-50/50 p-6 rounded-xl border border-brand-200 border-t-4 border-t-brand-600">
        <h3 className="text-brand-900 font-bold mb-4 flex items-center gap-2 text-lg">
          📦 Alta de Nueva Mercancía
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
          <input type="text" placeholder="Nombre del producto..." className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" />
          <div className="relative">
             <span className="absolute left-3 top-2.5 text-brand-400">🏷️</span>
             <select className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-2.5 pl-8 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm">
              <option value="">Categoría...</option>
              <option value="ropa">Ropa</option>
              <option value="electronica">Electrónica</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-brand-400">📏</span>
              <input type="text" placeholder="Talla (Opcional)" className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-2.5 pl-8 outline-none focus:ring-2 focus:ring-brand-500 text-sm shadow-sm" />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-brand-400">🎨</span>
              <input type="text" placeholder="Color (Opcional)" className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-2.5 pl-8 outline-none focus:ring-2 focus:ring-brand-500 text-sm shadow-sm" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-brand-400">$</span>
            <input type="number" placeholder="Precio" className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-2.5 pl-8 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-brand-400">📦</span>
            <input type="number" placeholder="Stock Inicial" className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-2.5 pl-8 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-brand-400">🔔</span>
            <input type="number" defaultValue="5" className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-2.5 pl-8 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" />
          </div>
          <button className="bg-brand-600 hover:bg-brand-800 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm">
            ✓ CREAR PRODUCTO
          </button>
        </div>
      </div>

      {/* Terminal Punto de Venta (TPV) */}
      <div className="bg-brand-50/50 p-6 rounded-xl border border-brand-200 border-t-4 border-t-brand-600">
        <h3 className="text-brand-900 font-bold mb-4 flex items-center gap-2 text-lg">
          📠 Terminal Punto de Venta (TPV)
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <select className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm">
              <option value="">1. Buscar Prenda...</option>
              {inventario.map(item => <option key={item.id} value={item.id}>{item.producto}</option>)}
            </select>
            <div className="grid grid-cols-2 gap-4">
              <select className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm">
                <option value="">2. Seleccionar Talla...</option>
              </select>
              <select className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm">
                <option value="">3. Seleccionar Color...</option>
              </select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <span className="absolute left-3 top-3 text-brand-400">🏬</span>
                <select className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-3 pl-9 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm">
                  <option value="">Sucursal Centro</option>
                  <option value="norte">Sucursal Norte</option>
                  <option value="sur">Sucursal Sur</option>
                </select>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-3 text-brand-400">🛒</span>
                <input type="number" placeholder="Cantidad a vender" className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-3 pl-9 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" />
              </div>
            </div>
            <button className="w-full bg-brand-600 hover:bg-brand-800 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm">
              💵 PROCESAR COBRO
            </button>
          </div>
          
          <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-brand-200 p-6 shadow-sm">
            <p className="text-brand-500 font-bold uppercase tracking-wider mb-2">TOTAL A PAGAR</p>
            <p className="text-5xl font-extrabold text-brand-900">$0.00</p>
            <div className="w-full h-2 bg-brand-100 rounded-full mt-8 overflow-hidden">
              <div className="w-1/3 h-full bg-brand-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
