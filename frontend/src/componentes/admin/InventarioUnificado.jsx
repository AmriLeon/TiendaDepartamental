import { useState, useEffect } from 'react';

export default function InventarioUnificado({ inventario, onStockUpdate }) {
  // Alertas
  const alertas = inventario.filter(item => item.alerta_reabastecimiento);

  // Estados para añadir stock
  const [selectedProduct, setSelectedProduct] = useState('');
  const [selectedTalla, setSelectedTalla] = useState('');
  const [selectedColor, setSelectedColor] = useState('');
  const [cantidadToAdd, setCantidadToAdd] = useState('');
  const [syncMessage, setSyncMessage] = useState(null);
  const [loadingSync, setLoadingSync] = useState(false);

  // Estados para Alta de Producto
  const [nuevoProd, setNuevoProd] = useState({
    nombre: '', categoria: '', talla: '', color: '', precio: '', stock_inicial: '', punto_pedido: 5
  });
  const [crearMessage, setCrearMessage] = useState(null);
  const [loadingCrear, setLoadingCrear] = useState(false);

  // Estados para TPV
  const [tpvProd, setTpvProd] = useState('');
  const [tpvTalla, setTpvTalla] = useState('');
  const [tpvColor, setTpvColor] = useState('');
  const [tpvSucursal, setTpvSucursal] = useState('');
  const [tpvCantidad, setTpvCantidad] = useState('');
  const [tpvMessage, setTpvMessage] = useState(null);
  const [loadingTpv, setLoadingTpv] = useState(false);

  // Agrupar inventario
  const uniqueProducts = [...new Set(inventario.map(i => i.producto))];
  
  // Helpers para filtros
  const isClothing = (prodName) => {
    const p = inventario.find(i => i.producto === prodName);
    return p && (p.categoria === 'Ropa' || p.talla !== 'N/A' || p.color !== 'N/A');
  };

  const getTallasForProduct = (prodName) => [...new Set(inventario.filter(i => i.producto === prodName && i.talla !== 'N/A').map(i => i.talla))];
  const getColoresForProductAndTalla = (prodName, talla) => [...new Set(inventario.filter(i => i.producto === prodName && i.talla === talla && i.color !== 'N/A').map(i => i.color))];

  const handleSyncStock = async () => {
    if (!selectedProduct || !cantidadToAdd || isNaN(cantidadToAdd) || Number(cantidadToAdd) <= 0) {
      setSyncMessage({ type: 'error', text: 'Selecciona producto y cantidad válida' });
      return;
    }
    
    // Encontrar variante específica
    const variante = inventario.find(i => 
      i.producto === selectedProduct && 
      (isClothing(selectedProduct) ? (i.talla === selectedTalla && i.color === selectedColor) : true)
    );

    if (!variante) {
      setSyncMessage({ type: 'error', text: 'Variante no encontrada en inventario' });
      return;
    }

    setLoadingSync(true);
    setSyncMessage(null);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/inventario/add-stock', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ id_inventario: variante.id, cantidad: Number(cantidadToAdd) })
      });
      if (res.status === 401) {
        setSyncMessage({ type: 'error', text: 'Sesión expirada. Inicia sesión nuevamente.' });
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        window.location.href = '/login';
        return;
      }
      if (res.ok) {
        setSyncMessage({ type: 'success', text: '✅ Stock sincronizado' });
        setCantidadToAdd('');
        onStockUpdate();
      } else {
        setSyncMessage({ type: 'error', text: 'Error al sincronizar' });
      }
    } catch (e) {
      __dbgReport__({ point: 'add_stock_error', error: String(e) });
      setSyncMessage({ type: 'error', text: 'Error de conexión' });
    }
    setLoadingSync(false);
  };

  const handleCrearProducto = async () => {
    if (!nuevoProd.nombre || !nuevoProd.categoria || !nuevoProd.precio || !nuevoProd.stock_inicial) {
      setCrearMessage({ type: 'error', text: 'Llena los campos obligatorios' });
      return;
    }

    setLoadingCrear(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/inventario/nuevo-producto', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          nombre: nuevoProd.nombre,
          categoria: nuevoProd.categoria,
          precio: Number(nuevoProd.precio),
          stock_inicial: Number(nuevoProd.stock_inicial),
          punto_pedido: Number(nuevoProd.punto_pedido),
          talla: nuevoProd.talla || 'N/A',
          color: nuevoProd.color || 'N/A'
        })
      });
      if (res.status === 401) {
        setCrearMessage({ type: 'error', text: 'Sesión expirada. Inicia sesión nuevamente.' });
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        window.location.href = '/login';
        return;
      }
      if (res.ok) {
        setCrearMessage({ type: 'success', text: '✅ Producto creado' });
        setNuevoProd({ nombre: '', categoria: '', talla: '', color: '', precio: '', stock_inicial: '', punto_pedido: 5 });
        onStockUpdate();
      } else {
        setCrearMessage({ type: 'error', text: 'Error al crear' });
      }
    } catch (e) {
      __dbgReport__({ point: 'nuevo_producto_error', error: String(e) });
      setCrearMessage({ type: 'error', text: 'Error de conexión' });
    }
    setLoadingCrear(false);
  };

  const handleCobro = async () => {
    if (!tpvProd || !tpvSucursal || !tpvCantidad || Number(tpvCantidad) <= 0) {
      setTpvMessage({ type: 'error', text: 'Llena los campos obligatorios' });
      return;
    }

    const variante = inventario.find(i => 
      i.producto === tpvProd && 
      (isClothing(tpvProd) ? (i.talla === tpvTalla && i.color === tpvColor) : true) &&
      i.id_sucursal.toString() === tpvSucursal.toString()
    );

    if (!variante) {
      setTpvMessage({ type: 'error', text: 'Variante no disponible en esa sucursal' });
      return;
    }

    if (variante.stock < Number(tpvCantidad)) {
      setTpvMessage({ type: 'error', text: 'Stock insuficiente' });
      return;
    }

    setLoadingTpv(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch('http://localhost:8000/api/tpv/venta', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({
          items: [{
            id_variante: variante.id_variante,
            id_sucursal: variante.id_sucursal,
            cantidad: Number(tpvCantidad),
            precio_unitario: variante.precio
          }]
        })
      });
      if (res.status === 401) {
        setTpvMessage({ type: 'error', text: 'Sesión expirada. Inicia sesión nuevamente.' });
        localStorage.removeItem('token');
        localStorage.removeItem('rol');
        window.location.href = '/login';
        return;
      }
      if (res.ok) {
        setTpvMessage({ type: 'success', text: '✅ Venta exitosa' });
        setTpvCantidad('');
        onStockUpdate();
      } else {
        setTpvMessage({ type: 'error', text: 'Error al procesar' });
      }
    } catch (e) {
      __dbgReport__({ point: 'tpv_venta_error', error: String(e) });
      setTpvMessage({ type: 'error', text: 'Error de conexión' });
    }
    setLoadingTpv(false);
  };

  const calcularTotalTpv = () => {
    if (!tpvProd || !tpvCantidad) return 0;
    const variante = inventario.find(i => i.producto === tpvProd);
    if (!variante) return 0;
    return variante.precio * Number(tpvCantidad);
  };

  const uniqueTallas = selectedProduct ? getTallasForProduct(selectedProduct) : [];
  const uniqueColores = (selectedProduct && selectedTalla) ? getColoresForProductAndTalla(selectedProduct, selectedTalla) : [];

  const uniqueTpvTallas = tpvProd ? getTallasForProduct(tpvProd) : [];
  const uniqueTpvColores = (tpvProd && tpvTalla) ? getColoresForProductAndTalla(tpvProd, tpvTalla) : [];
  
  // Extraer sucursales únicas del inventario
  const sucursales = [];
  inventario.forEach(i => {
    if (i.id_sucursal && !sucursales.find(s => s.id === i.id_sucursal)) {
      sucursales.push({ id: i.id_sucursal, nombre: i.sucursal });
    }
  });

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
          <input type="text" placeholder="Nombre del producto..." 
                 value={nuevoProd.nombre} onChange={e => setNuevoProd({...nuevoProd, nombre: e.target.value})}
                 className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-2.5 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" />
          <div className="relative">
             <span className="absolute left-3 top-2.5 text-brand-400">🏷️</span>
             <select 
              value={nuevoProd.categoria} onChange={e => setNuevoProd({...nuevoProd, categoria: e.target.value})}
              className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-2.5 pl-8 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm">
              <option value="">Categoría...</option>
              <option value="Ropa">Ropa</option>
              <option value="Electrónica">Electrónica</option>
              <option value="Alimentos">Alimentos</option>
              <option value="Deportes">Deportes</option>
              <option value="Farmacia">Farmacia</option>
              <option value="Limpieza">Limpieza</option>
              <option value="Cuidado personal">Cuidado personal</option>
              <option value="Mascotas">Mascotas</option>
              <option value="Bebidas">Bebidas</option>
              <option value="Licores">Licores</option>
              <option value="Electrodomésticos">Electrodomésticos</option>
              <option value="Celulares">Celulares</option>
              <option value="Pantallas y audio">Pantallas y audio</option>
            </select>
          </div>
          <div className="grid grid-cols-2 gap-2">
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-brand-400">📏</span>
              <input type="text" placeholder="Talla (Opcional)" 
                     value={nuevoProd.talla} onChange={e => setNuevoProd({...nuevoProd, talla: e.target.value})}
                     className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-2.5 pl-8 outline-none focus:ring-2 focus:ring-brand-500 text-sm shadow-sm" />
            </div>
            <div className="relative">
              <span className="absolute left-3 top-2.5 text-brand-400">🎨</span>
              <input type="text" placeholder="Color (Opcional)" 
                     value={nuevoProd.color} onChange={e => setNuevoProd({...nuevoProd, color: e.target.value})}
                     className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-2.5 pl-8 outline-none focus:ring-2 focus:ring-brand-500 text-sm shadow-sm" />
            </div>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-brand-400">$</span>
            <input type="number" placeholder="Precio" 
                   value={nuevoProd.precio} onChange={e => setNuevoProd({...nuevoProd, precio: e.target.value})}
                   className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-2.5 pl-8 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-brand-400">📦</span>
            <input type="number" placeholder="Stock Inicial" 
                   value={nuevoProd.stock_inicial} onChange={e => setNuevoProd({...nuevoProd, stock_inicial: e.target.value})}
                   className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-2.5 pl-8 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" />
          </div>
          <div className="relative">
            <span className="absolute left-3 top-2.5 text-brand-400">🔔</span>
            <input type="number" placeholder="Punto de pedido" 
                   value={nuevoProd.punto_pedido} onChange={e => setNuevoProd({...nuevoProd, punto_pedido: e.target.value})}
                   className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-2.5 pl-8 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" />
          </div>
          <button 
            onClick={handleCrearProducto}
            disabled={loadingCrear}
            className="bg-brand-600 hover:bg-brand-800 disabled:opacity-50 text-white font-bold py-2 px-4 rounded-lg transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            {loadingCrear ? '...' : '✓ CREAR PRODUCTO'}
          </button>
        </div>
        {crearMessage && (
          <div className={`mt-3 text-sm font-bold ${crearMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
            {crearMessage.text}
          </div>
        )}
      </div>

      {/* Terminal Punto de Venta (TPV) */}
      <div className="bg-brand-50/50 p-6 rounded-xl border border-brand-200 border-t-4 border-t-brand-600">
        <h3 className="text-brand-900 font-bold mb-4 flex items-center gap-2 text-lg">
          📠 Terminal Punto de Venta (TPV)
        </h3>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 space-y-4">
            <select 
              value={tpvProd} onChange={e => { setTpvProd(e.target.value); setTpvTalla(''); setTpvColor(''); setTpvMessage(null); }}
              className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
            >
              <option value="">1. Buscar Producto...</option>
              {uniqueProducts.map((item, idx) => <option key={idx} value={item}>{item}</option>)}
            </select>
            
            {tpvProd && isClothing(tpvProd) && (
              <div className="grid grid-cols-2 gap-4">
                <select 
                  value={tpvTalla} onChange={e => { setTpvTalla(e.target.value); setTpvColor(''); setTpvMessage(null); }}
                  className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                >
                  <option value="">2. Seleccionar Talla...</option>
                  {uniqueTpvTallas.map((t, idx) => <option key={idx} value={t}>{t}</option>)}
                </select>
                <select 
                  value={tpvColor} onChange={e => { setTpvColor(e.target.value); setTpvMessage(null); }}
                  disabled={!tpvTalla}
                  className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                >
                  <option value="">3. Seleccionar Color...</option>
                  {uniqueTpvColores.map((c, idx) => <option key={idx} value={c}>{c}</option>)}
                </select>
              </div>
            )}
            
            <div className="grid grid-cols-2 gap-4">
              <div className="relative">
                <span className="absolute left-3 top-3 text-brand-400">🏬</span>
                <select 
                  value={tpvSucursal} onChange={e => setTpvSucursal(e.target.value)}
                  className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-3 pl-9 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
                >
                  <option value="">Sucursal...</option>
                  {sucursales.map(s => <option key={s.id} value={s.id}>{s.nombre}</option>)}
                </select>
              </div>
              <div className="relative">
                <span className="absolute left-3 top-3 text-brand-400">🛒</span>
                <input type="number" placeholder="Cantidad a vender" 
                       value={tpvCantidad} onChange={e => setTpvCantidad(e.target.value)}
                       className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-3 pl-9 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm" />
              </div>
            </div>
            <button 
              onClick={handleCobro}
              disabled={loadingTpv}
              className="w-full bg-brand-600 hover:bg-brand-800 disabled:opacity-50 text-white font-bold py-3 rounded-lg transition-colors flex items-center justify-center gap-2 mt-4 shadow-sm"
            >
              {loadingTpv ? 'Procesando...' : '💵 PROCESAR COBRO'}
            </button>
            {tpvMessage && (
              <div className={`mt-2 text-sm font-bold ${tpvMessage.type === 'error' ? 'text-red-600' : 'text-green-600'}`}>
                {tpvMessage.text}
              </div>
            )}
          </div>
          
          <div className="flex flex-col items-center justify-center bg-white rounded-xl border border-brand-200 p-6 shadow-sm">
            <p className="text-brand-500 font-bold uppercase tracking-wider mb-2">TOTAL A PAGAR</p>
            <p className="text-5xl font-extrabold text-brand-900">${calcularTotalTpv().toFixed(2)}</p>
            <div className="w-full h-2 bg-brand-100 rounded-full mt-8 overflow-hidden">
              <div className="w-1/3 h-full bg-brand-600 rounded-full"></div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
