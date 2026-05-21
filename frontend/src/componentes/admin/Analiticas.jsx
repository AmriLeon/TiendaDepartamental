import { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import { Chart as ChartJS, CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend } from 'chart.js';

ChartJS.register(CategoryScale, LinearScale, BarElement, Title, Tooltip, Legend);

export default function Analiticas({ inventario }) {
  const [analiticas, setAnaliticas] = useState({
    ticket_promedio: 0,
    top_productos: [],
    ventas_sucursal: []
  });

  useEffect(() => {
    const fetchAnaliticas = async () => {
      try {
        const token = localStorage.getItem('token');
        const res = await fetch('http://localhost:8000/api/dashboard/analytics', {
          headers: { 'Authorization': `Bearer ${token}` }
        });
        if (res.ok) {
          setAnaliticas(await res.json());
        }
      } catch (e) {
        console.error("Error cargando analíticas:", e);
      }
    };
    fetchAnaliticas();
    const interval = setInterval(fetchAnaliticas, 10000); // Polling 10s
    return () => clearInterval(interval);
  }, []);

  const barData = {
    labels: analiticas.ventas_sucursal.map(v => v.sucursal),
    datasets: [
      {
        label: 'Ingresos por Sucursal ($)',
        data: analiticas.ventas_sucursal.map(v => v.total),
        backgroundColor: '#845162', // brand-600
        borderRadius: 4,
      }
    ]
  };

  const barOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: { color: '#FFE3D8' }, // brand-50
        ticks: { color: '#845162' } // brand-400
      },
      x: {
        grid: { display: false },
        ticks: { color: '#845162' } // brand-400
      }
    }
  };

  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
        <span className="text-brand-600">📈</span> 2. Analíticas de Ventas
      </h2>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Ticket Promedio */}
        <div className="bg-white p-6 rounded-xl border border-brand-200 shadow-sm flex flex-col items-center justify-center min-h-[250px]">
          <div className="w-16 h-16 bg-amber-100 text-amber-600 rounded-full flex items-center justify-center text-2xl mb-4">
            🧾
          </div>
          <p className="text-brand-500 font-bold uppercase tracking-wider mb-2 text-sm">TICKET PROMEDIO</p>
          <p className="text-4xl font-extrabold text-amber-500">${analiticas.ticket_promedio.toFixed(2)}</p>
        </div>

        {/* Top Productos */}
        <div className="bg-white p-6 rounded-xl border border-brand-200 shadow-sm">
          <h3 className="text-brand-600 font-bold uppercase tracking-wider text-sm mb-4 flex items-center justify-center gap-2">
            🏆 TOP PRODUCTOS
          </h3>
          <div className="space-y-3">
            {analiticas.top_productos.map((prod, index) => (
              <div key={prod.id} className="flex items-center justify-between bg-brand-50/50 border border-brand-100 p-3 rounded-lg">
                <div className="flex items-center gap-3">
                  <span className="text-brand-600 font-mono font-bold">{index + 1}.</span>
                  <span className="text-brand-900 font-medium">{prod.nombre}</span>
                </div>
                <span className="bg-brand-100 text-brand-800 px-3 py-1 rounded-full text-xs font-bold border border-brand-200">
                  {prod.uds} uds
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* Ventas por Sucursal */}
        <div className="bg-white p-6 rounded-xl border border-brand-200 shadow-sm flex flex-col">
          <h3 className="text-brand-600 font-bold uppercase tracking-wider text-sm mb-4 flex items-center justify-center gap-2">
            📊 POR SUCURSAL
          </h3>
          <div className="flex-1 w-full min-h-[200px]">
            <Bar data={barData} options={barOptions} />
          </div>
        </div>
      </div>
    </div>
  );
}