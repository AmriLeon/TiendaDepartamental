import { useState, useEffect } from 'react';

export default function Clientes() {
  const [clientes, setClientes] = useState([]);
  const [clienteSel, setClienteSel] = useState('');
  const [compras, setCompras] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchClientes = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/api/dashboard/clientes', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          const data = await res.json();
          setClientes(data);
          if (data.length > 0) {
            setClienteSel(data[0].id.toString());
          }
        }
      } catch (e) {
        console.error("Error cargando clientes:", e);
      } finally {
        setLoading(false);
      }
    };
    fetchClientes();
  }, []);

  useEffect(() => {
    if (!clienteSel) return;
    const fetchHistorial = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch(`http://localhost:8000/api/dashboard/clientes/${clienteSel}/historial`, {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setCompras(await res.json());
        }
      } catch (e) {
        console.error("Error cargando historial:", e);
      }
    };
    fetchHistorial();
  }, [clienteSel]);

  const clienteData = clientes.find(c => c.id.toString() === clienteSel);

  if (loading) return <div>Cargando módulo de clientes...</div>;

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
        <span className="text-brand-600">👥</span> 4. Perfil de Cliente e Historial
      </h2>

      <div className="bg-brand-50/50 p-6 rounded-xl border border-brand-200 flex flex-col lg:flex-row gap-8">
        
        {/* Panel izquierdo: Buscador y Perfil */}
        <div className="w-full lg:w-1/3 space-y-6">
          <div>
            <h3 className="text-brand-800 font-bold uppercase tracking-wider text-sm mb-2 flex items-center gap-2">
              🔍 Buscar Cliente
            </h3>
            <select 
              className="w-full bg-white border border-brand-200 text-brand-900 rounded-lg p-3 outline-none focus:ring-2 focus:ring-brand-500 shadow-sm"
              value={clienteSel}
              onChange={(e) => setClienteSel(e.target.value)}
            >
              {clientes.map(c => (
                <option key={c.id} value={c.id}>{c.nombre} ({c.correo})</option>
              ))}
            </select>
          </div>

          {clienteData && (
            <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-brand-100 shadow-sm">
              <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center text-5xl mb-4 text-brand-600 border-4 border-white shadow-sm">
                👤
              </div>
              <h3 className="text-xl font-black text-brand-900">{clienteData.nombre}</h3>
              <p className="text-brand-600 font-medium">{clienteData.correo}</p>
              
              <div className="mt-4 w-full pt-4 border-t border-brand-100 flex justify-between text-sm">
                <span className="font-bold text-gray-500">Total Compras:</span>
                <span className="font-black text-brand-800">{compras.length} items</span>
              </div>
            </div>
          )}
        </div>

        {/* Panel derecho: Historial de compras */}
        <div className="w-full lg:w-2/3">
          <h3 className="text-brand-800 font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
            ⏱️ Historial de Compras
          </h3>
          
          <div className="bg-white border border-brand-200 rounded-xl overflow-hidden shadow-sm h-[400px] overflow-y-auto">
            <table className="w-full text-left text-sm text-brand-900 relative">
              <thead className="bg-brand-50 text-brand-800 font-bold border-b border-brand-200 sticky top-0 shadow-sm">
                <tr>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Producto</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Cant.</th>
                  <th className="p-4">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {compras.length > 0 ? compras.map((compra, idx) => (
                  <tr key={idx} className="hover:bg-brand-50/50 transition-colors">
                    <td className="p-4 text-brand-600 whitespace-nowrap">{compra.fecha}</td>
                    <td className="p-4 font-bold text-brand-900">{compra.producto}</td>
                    <td className="p-4">
                      <span className="bg-brand-100 text-brand-800 border border-brand-200 px-3 py-1 rounded-full text-xs font-bold whitespace-nowrap">
                        {compra.categoria}
                      </span>
                    </td>
                    <td className="p-4 font-medium text-center">{compra.cant}</td>
                    <td className="p-4 font-black text-green-600">${compra.total.toFixed(2)}</td>
                  </tr>
                )) : (
                  <tr>
                    <td colSpan="5" className="p-8 text-center text-gray-400 font-medium">Este cliente no ha realizado compras.</td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}