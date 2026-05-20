import { useState } from 'react';

export default function Clientes() {
  const [cliente, setCliente] = useState('royito');

  const compras = [
    { id: 1, fecha: '7/5/2026 0:13:12', producto: 'Playera Gymshark', categoria: 'Ropa', cant: 1, total: 600.00 },
    { id: 2, fecha: '7/5/2026 0:13:12', producto: 'Television Samsung', categoria: 'Electronica', cant: 1, total: 50000.00 },
  ];

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
              value={cliente}
              onChange={(e) => setCliente(e.target.value)}
            >
              <option value="royito">RRRRooooyyy (royito@gmail.com)</option>
              <option value="otro">Otro Cliente (otro@gmail.com)</option>
            </select>
          </div>

          <div className="flex flex-col items-center justify-center p-6 bg-white rounded-xl border border-brand-100 shadow-sm">
            <div className="w-24 h-24 bg-brand-100 rounded-full flex items-center justify-center text-5xl mb-4 text-brand-600 border-4 border-white shadow-sm">
              👤
            </div>
            <h3 className="text-xl font-black text-brand-900">RRRRooooyyy</h3>
            <p className="text-brand-600 font-medium">royito@gmail.com</p>
          </div>
        </div>

        {/* Panel derecho: Historial de compras */}
        <div className="w-full lg:w-2/3">
          <h3 className="text-brand-800 font-bold mb-4 flex items-center gap-2 uppercase tracking-wider text-sm">
            ⏱️ Historial de Compras
          </h3>
          
          <div className="bg-white border border-brand-200 rounded-xl overflow-hidden shadow-sm">
            <table className="w-full text-left text-sm text-brand-900">
              <thead className="bg-brand-50 text-brand-800 font-bold border-b border-brand-200">
                <tr>
                  <th className="p-4">Fecha</th>
                  <th className="p-4">Producto</th>
                  <th className="p-4">Categoría</th>
                  <th className="p-4">Cant.</th>
                  <th className="p-4">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-brand-100">
                {compras.map((compra) => (
                  <tr key={compra.id} className="hover:bg-brand-50/50 transition-colors">
                    <td className="p-4 text-brand-600">{compra.fecha}</td>
                    <td className="p-4 font-bold text-brand-900">{compra.producto}</td>
                    <td className="p-4">
                      <span className="bg-brand-100 text-brand-800 border border-brand-200 px-3 py-1 rounded-full text-xs font-bold">
                        {compra.categoria}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{compra.cant}</td>
                    <td className="p-4 font-black text-green-600">${compra.total.toFixed(2)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

      </div>
    </div>
  );
}