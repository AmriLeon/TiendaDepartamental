import { useState, useEffect } from 'react';
import { Bar, Pie } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
} from 'chart.js';

ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
  ArcElement
);

function DashboardInventario() {
  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);

  useEffect(() => {
    // Usamos el API Gateway unificado
    const fetchData = () => {
      const token = localStorage.getItem('token');
      fetch('http://localhost:8000/api/dashboard/inventory', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
        .then((respuesta) => respuesta.json())
        .then((datos) => {
          if (Array.isArray(datos)) {
            setInventario(datos);
          } else {
            console.error("La respuesta no es un array válido:", datos);
            setInventario([]);
          }
          setCargando(false);
        })
        .catch((error) => {
          console.error("Error al conectar con el API Gateway: ", error);
          setCargando(false);
        });
    };

    fetchData();
    // Simulamos WebSockets con polling cada 5 segundos
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (cargando) {
    return <div className="text-center p-10 text-xl font-bold">Conectando con Microservicios... 🚀</div>;
  }

  // Datos para gráficos
  const sucursalesData = {};
  inventario.forEach(item => {
    sucursalesData[item.sucursal] = (sucursalesData[item.sucursal] || 0) + item.stock;
  });

  const barData = {
    labels: Object.keys(sucursalesData),
    datasets: [
      {
        label: 'Stock Total por Sucursal',
        data: Object.values(sucursalesData),
        backgroundColor: 'rgba(54, 162, 235, 0.5)',
        borderColor: 'rgba(54, 162, 235, 1)',
        borderWidth: 1,
      },
    ],
  };

  const pieData = {
    labels: Object.keys(sucursalesData),
    datasets: [
      {
        data: Object.values(sucursalesData),
        backgroundColor: [
          'rgba(255, 99, 132, 0.5)',
          'rgba(75, 192, 192, 0.5)',
          'rgba(255, 206, 86, 0.5)',
        ],
        borderWidth: 1,
      },
    ],
  };

  return (
    <div className="p-8 max-w-7xl mx-auto bg-gray-50 min-h-screen">
      <header className="mb-10">
        <h2 className="text-4xl font-extrabold text-gray-900 mb-2">🏬 EDMIRS</h2>
        <p className="text-gray-600">Dashboard de Microservicios en Tiempo Real</p>
      </header>

      {/* Gráficos */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8 mb-12">
        <div className="bg-white p-6 rounded-xl shadow-md">
          <h3 className="text-lg font-bold mb-4">Stock por Sucursal (Barras)</h3>
          <Bar data={barData} />
        </div>
        <div className="bg-white p-6 rounded-xl shadow-md flex flex-col items-center">
          <h3 className="text-lg font-bold mb-4 w-full">Distribución de Inventario</h3>
          <div className="w-64">
            <Pie data={pieData} />
          </div>
        </div>
      </div>
      
      {/* Tabla */}
      <div className="bg-white shadow-xl rounded-xl overflow-hidden border border-gray-100">
        <div className="bg-gray-800 p-4">
          <h3 className="text-white font-bold">📦 Inventario Unificado (API Gateway)</h3>
        </div>
        <table className="min-w-full text-left text-sm">
          <thead className="bg-gray-50 text-gray-600 uppercase text-xs font-semibold">
            <tr>
              <th className="px-6 py-4">Sucursal</th>
              <th className="px-6 py-4">Producto</th>
              <th className="px-6 py-4">SKU</th>
              <th className="px-6 py-4">Variante</th>
              <th className="px-6 py-4 text-center">Stock</th>
              <th className="px-6 py-4 text-center">Estado</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {inventario.map((item) => (
              <tr 
                key={item.id} 
                className={`hover:bg-gray-50 transition duration-150 ${
                  item.alerta_reabastecimiento ? 'bg-red-50' : ''
                }`}
              >
                <td className="px-6 py-4 font-semibold text-blue-600">{item.sucursal}</td>
                <td className="px-6 py-4 font-medium text-gray-900">{item.producto}</td>
                <td className="px-6 py-4 text-gray-500 font-mono">{item.sku}</td>
                <td className="px-6 py-4 text-gray-500">{item.detalles}</td>
                <td className="px-6 py-4 text-center font-bold text-lg">{item.stock}</td>
                <td className="px-6 py-4 text-center">
                  {item.alerta_reabastecimiento ? (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-red-100 text-red-700 border border-red-200">
                      🚨 RESURTIR
                    </span>
                  ) : (
                    <span className="px-3 py-1 rounded-full text-xs font-bold bg-green-100 text-green-700">
                      ✅ OK
                    </span>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default DashboardInventario;
