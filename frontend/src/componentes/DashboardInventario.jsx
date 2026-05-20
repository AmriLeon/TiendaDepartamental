import { useState, useEffect } from 'react';
import InventarioUnificado from './admin/InventarioUnificado';
import Analiticas from './admin/Analiticas';
import Logistica from './admin/Logistica';
import Clientes from './admin/Clientes';

function DashboardInventario() {
  const [inventario, setInventario] = useState([]);
  const [cargando, setCargando] = useState(true);

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
        console.error("Error al conectar con el backend: ", error);
        setCargando(false);
      });
  };

  useEffect(() => {
    fetchData();
    // Simulamos WebSockets con polling cada 5 segundos
    const interval = setInterval(fetchData, 5000);
    return () => clearInterval(interval);
  }, []);

  if (cargando) {
    return <div className="text-center p-10 text-xl font-bold text-brand-900">Cargando datos del panel... </div>;
  }

  return (
    <div className="max-w-7xl mx-auto text-brand-900">
      <header className="mb-8 border-b border-brand-200 pb-4">
        <h2 className="text-3xl font-extrabold text-brand-900 mb-1">Resumen del Sistema</h2>
        <p className="text-brand-600 font-medium">Gestión Integral EDMIRS (Inventario, Ventas, Logística y Clientes)</p>
      </header>

      <div className="space-y-10">
        <section className="bg-white rounded-2xl shadow-sm border border-brand-100 p-6">
          <InventarioUnificado inventario={inventario} onStockUpdate={fetchData} />
        </section>
        
        <section className="bg-white rounded-2xl shadow-sm border border-brand-100 p-6">
          <Analiticas inventario={inventario} />
        </section>
        
        <section className="bg-white rounded-2xl shadow-sm border border-brand-100 p-6">
          <Logistica />
        </section>
        
        <section className="bg-white rounded-2xl shadow-sm border border-brand-100 p-6">
          <Clientes />
        </section>
      </div>
    </div>
  );
}

export default DashboardInventario;
