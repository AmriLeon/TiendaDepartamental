export default function Logistica() {
  return (
    <div className="space-y-6">
      <h2 className="text-2xl font-bold text-brand-900 flex items-center gap-2">
        <span className="text-brand-600">🚚</span> 3. Logística y &quot;Pick & Pack&quot;
      </h2>

      {/* Kanban Board */}
      <div className="bg-brand-50/50 p-6 rounded-xl border border-brand-200">
        <h3 className="text-brand-800 font-bold uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
          📋 ESTADO DE PREPARACIÓN
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pendiente */}
          <div className="bg-white border border-brand-200 rounded-xl overflow-hidden flex flex-col h-64 shadow-sm">
            <div className="bg-brand-100 text-brand-900 font-bold p-3 text-center flex items-center justify-center gap-2 border-b border-brand-200">
              🕒 PENDIENTE
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-brand-50/30">
              <div className="bg-white border border-brand-200 p-3 rounded-lg text-brand-900 font-medium flex items-center gap-2 cursor-pointer hover:bg-brand-50 hover:border-brand-300 transition-colors shadow-sm">
                📦 Pedido #001
              </div>
            </div>
          </div>

          {/* Empacando */}
          <div className="bg-white border border-brand-200 rounded-xl overflow-hidden flex flex-col h-64 shadow-sm">
            <div className="bg-brand-400 text-white font-bold p-3 text-center flex items-center justify-center gap-2 border-b border-brand-400">
              📦 EMPACANDO
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-brand-50/30">
              {/* Vacio por ahora */}
            </div>
          </div>

          {/* Enviado */}
          <div className="bg-white border border-brand-200 rounded-xl overflow-hidden flex flex-col h-64 shadow-sm">
            <div className="bg-green-100 text-green-800 font-bold p-3 text-center flex items-center justify-center gap-2 border-b border-green-200">
              ✓ ENVIADO
            </div>
            <div className="p-4 flex-1 overflow-y-auto space-y-3 bg-brand-50/30">
              {/* Vacio por ahora */}
            </div>
          </div>
        </div>
      </div>

      {/* Mapa GPS Dummy */}
      <div className="bg-brand-50/50 p-6 rounded-xl border border-brand-200">
        <h3 className="text-brand-800 font-bold uppercase tracking-wider text-sm mb-4 flex items-center gap-2">
          🗺️ SEGUIMIENTO GPS DE RUTAS
        </h3>
        <div className="w-full h-80 bg-brand-100 border border-brand-200 rounded-xl relative overflow-hidden flex items-center justify-center shadow-inner">
          {/* Placeholder for map */}
          <div className="absolute inset-0 opacity-40" style={{
            backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23845162' fill-opacity='0.2'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`
          }}></div>
          
          <div className="relative z-10 flex flex-col items-center animate-bounce">
            <div className="bg-white text-brand-900 px-4 py-2 rounded-lg shadow-lg font-bold text-sm mb-2 relative border border-brand-200">
              Repartidor en camino al cliente!
              <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2 w-4 h-4 bg-white border-b border-r border-brand-200 rotate-45"></div>
            </div>
            <div className="text-4xl drop-shadow-md">📍</div>
          </div>
          
          {/* Controles de mapa fake */}
          <div className="absolute top-4 left-4 bg-white rounded-lg shadow-md flex flex-col border border-brand-200 overflow-hidden">
            <button className="w-8 h-8 flex items-center justify-center border-b border-brand-200 text-brand-900 hover:bg-brand-50 font-bold transition-colors">+</button>
            <button className="w-8 h-8 flex items-center justify-center text-brand-900 hover:bg-brand-50 font-bold transition-colors">-</button>
          </div>
          <div className="absolute bottom-2 right-2 bg-white/90 px-3 py-1.5 text-xs font-medium text-brand-800 rounded-md shadow-sm border border-brand-200">
            Leaflet | © OpenStreetMap contributors, © CARTO
          </div>
        </div>
      </div>
    </div>
  );
}