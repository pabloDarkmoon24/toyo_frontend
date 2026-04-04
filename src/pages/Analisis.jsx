import { useEffect, useState } from 'react';
import { analisis as api } from '../api';
import { BarChart2, TrendingUp, Package, Star, Info } from 'lucide-react';
import { PageLoader, SectionHeader } from '../components/UI';
import { toast } from '../utils/toast';

const fmt = (n) => `$${Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtPct = (n) => `${Number(n || 0).toFixed(1)}%`;

const CLASE_COLORS = {
  A: { bg: 'bg-emerald-100', text: 'text-emerald-700', badge: 'bg-emerald-600', desc: '80% de ingresos' },
  B: { bg: 'bg-blue-100',    text: 'text-blue-700',    badge: 'bg-blue-600',    desc: 'siguiente 15%' },
  C: { bg: 'bg-slate-100',   text: 'text-slate-600',   badge: 'bg-slate-500',   desc: 'último 5%' },
};

const LINEA_COLORS = {
  taller:  { color: '#dc2626', label: 'Taller / Servicios',    bg: 'bg-red-50',     text: 'text-red-700',     border: 'border-red-200' },
  ventas:  { color: '#2563eb', label: 'Ventas de productos',   bg: 'bg-blue-50',    text: 'text-blue-700',    border: 'border-blue-200' },
  general: { color: '#7c3aed', label: 'General / Sin clasificar', bg: 'bg-purple-50', text: 'text-purple-700', border: 'border-purple-200' },
};

function BarHorizontal({ value, max, color }) {
  const pct = max > 0 ? (value / max) * 100 : 0;
  return (
    <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden">
      <div className="h-full rounded-full transition-all duration-500" style={{ width: `${pct}%`, background: color || '#dc2626' }} />
    </div>
  );
}

export default function Analisis() {
  const [tabActivo, setTabActivo] = useState('abc');
  const [abcData, setAbcData]     = useState(null);
  const [rentData, setRentData]   = useState(null);
  const [cargando, setCargando]   = useState(true);
  const [desde, setDesde]         = useState('');
  const [hasta, setHasta]         = useState('');

  const cargarAbc = () => {
    return api.abc().then(r => setAbcData(r.data));
  };

  const cargarRent = () => {
    return api.rentabilidad({ desde: desde || undefined, hasta: hasta || undefined })
      .then(r => setRentData(r.data));
  };

  useEffect(() => {
    setCargando(true);
    Promise.all([cargarAbc(), cargarRent()])
      .catch(() => toast.error('Error al cargar análisis'))
      .finally(() => setCargando(false));
  }, []);

  const aplicarFiltro = () => {
    setCargando(true);
    cargarRent().finally(() => setCargando(false));
  };

  const TABS = [
    { id: 'abc',          label: 'Análisis ABC',              icon: BarChart2 },
    { id: 'rentabilidad', label: 'Líneas de Negocio',         icon: TrendingUp },
  ];

  if (cargando) return <PageLoader />;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Análisis de Negocio"
        subtitle="ABC de productos y rentabilidad por línea de negocio"
      />

      {/* Tabs */}
      <div className="flex gap-1 bg-slate-100 p-1 rounded-xl w-fit">
        {TABS.map(t => (
          <button key={t.id} onClick={() => setTabActivo(t.id)}
            className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              tabActivo === t.id ? 'bg-white text-slate-900 shadow-sm' : 'text-slate-500 hover:text-slate-700'
            }`}>
            <t.icon size={14} />
            {t.label}
          </button>
        ))}
      </div>

      {/* ABC Tab */}
      {tabActivo === 'abc' && abcData && (
        <div className="space-y-5">
          {/* Resumen */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
            <div className="tarjeta p-4">
              <p className="text-xs text-slate-500 mb-1">Total productos</p>
              <p className="text-2xl font-bold text-slate-900">{abcData.totalProductos}</p>
            </div>
            {['A', 'B', 'C'].map(cls => (
              <div key={cls} className={`tarjeta p-4 ${CLASE_COLORS[cls].bg}`}>
                <div className="flex items-center gap-2 mb-1">
                  <span className={`w-5 h-5 rounded-full flex items-center justify-center text-white text-xs font-bold ${CLASE_COLORS[cls].badge}`}>{cls}</span>
                  <p className="text-xs text-slate-500">Clase {cls} — {CLASE_COLORS[cls].desc}</p>
                </div>
                <p className={`text-2xl font-bold ${CLASE_COLORS[cls].text}`}>
                  {abcData[`clase${cls}`]} productos
                </p>
              </div>
            ))}
          </div>

          {/* Aviso si no hay datos */}
          {abcData.totalProductos === 0 && (
            <div className="tarjeta p-6 text-center">
              <Package size={36} className="text-slate-300 mx-auto mb-2" />
              <p className="text-slate-500">No hay ventas registradas para el análisis ABC.</p>
              <p className="text-xs text-slate-400 mt-1">Empieza a emitir facturas para ver el análisis.</p>
            </div>
          )}

          {/* Tabla ABC */}
          {abcData.productos.length > 0 && (
            <div className="tarjeta overflow-hidden">
              <div className="p-4 border-b border-slate-100 flex items-center gap-2">
                <Star size={16} className="text-amber-500" />
                <p className="font-semibold text-slate-800">Ranking de productos por ingresos</p>
                <span className="ml-auto text-xs text-slate-400 bg-slate-100 px-2 py-1 rounded-lg">
                  Total: {fmt(abcData.totalIngresos)}
                </span>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="bg-slate-50 border-b border-slate-200">
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">#</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Clase</th>
                      <th className="text-left px-4 py-3 text-xs font-semibold text-slate-500">Producto</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Vendido</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">Ingresos</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">% Total</th>
                      <th className="text-right px-4 py-3 text-xs font-semibold text-slate-500">% Acum.</th>
                      <th className="px-4 py-3 text-xs font-semibold text-slate-500 min-w-24">Barra</th>
                    </tr>
                  </thead>
                  <tbody>
                    {abcData.productos.map((p, idx) => {
                      const cls = CLASE_COLORS[p.clase];
                      return (
                        <tr key={p.id} className="border-b border-slate-100 hover:bg-slate-50 transition-colors">
                          <td className="px-4 py-3 text-sm text-slate-400 font-mono">{idx + 1}</td>
                          <td className="px-4 py-3">
                            <span className={`inline-flex items-center justify-center w-6 h-6 rounded-full text-white text-xs font-bold ${cls.badge}`}>
                              {p.clase}
                            </span>
                          </td>
                          <td className="px-4 py-3">
                            <p className="text-sm font-medium text-slate-800">{p.nombre}</p>
                            <p className="text-xs text-slate-400">{p.categoria}</p>
                          </td>
                          <td className="px-4 py-3 text-right text-sm text-slate-700">{p.cantidadVendida} u.</td>
                          <td className="px-4 py-3 text-right text-sm font-semibold text-slate-900">{fmt(p.ingresos)}</td>
                          <td className="px-4 py-3 text-right text-sm text-slate-600">{fmtPct(p.pctIngresos)}</td>
                          <td className={`px-4 py-3 text-right text-sm font-medium ${cls.text}`}>{fmtPct(p.pctAcumulado)}</td>
                          <td className="px-4 py-3">
                            <BarHorizontal value={p.ingresos} max={abcData.productos[0]?.ingresos} color={
                              p.clase === 'A' ? '#059669' : p.clase === 'B' ? '#2563eb' : '#94a3b8'
                            } />
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Rentabilidad Tab */}
      {tabActivo === 'rentabilidad' && (
        <div className="space-y-5">
          {/* Filtro fecha */}
          <div className="tarjeta p-4">
            <div className="flex items-center gap-3 flex-wrap">
              <p className="text-sm font-medium text-slate-700">Filtrar período:</p>
              <input type="date" value={desde} onChange={e => setDesde(e.target.value)}
                className="text-sm border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400" />
              <span className="text-slate-400 text-sm">—</span>
              <input type="date" value={hasta} onChange={e => setHasta(e.target.value)}
                className="text-sm border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400" />
              <button onClick={aplicarFiltro}
                className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 transition-colors">
                Aplicar
              </button>
              {(desde || hasta) && (
                <button onClick={() => { setDesde(''); setHasta(''); setTimeout(aplicarFiltro, 0); }}
                  className="px-4 py-2 bg-slate-100 text-slate-600 rounded-xl text-sm font-medium hover:bg-slate-200 transition-colors">
                  Limpiar
                </button>
              )}
            </div>
          </div>

          {rentData && (
            <>
              {/* Resumen total */}
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                <div className="tarjeta p-5">
                  <p className="text-xs text-slate-500 mb-1">Ingresos totales</p>
                  <p className="text-2xl font-bold text-emerald-600">{fmt(rentData.totalIngresos)}</p>
                </div>
                <div className="tarjeta p-5">
                  <p className="text-xs text-slate-500 mb-1">Gastos totales</p>
                  <p className="text-2xl font-bold text-red-600">{fmt(rentData.totalGastos)}</p>
                </div>
                <div className={`tarjeta p-5 ${rentData.gananciaEstimada >= 0 ? 'bg-emerald-50' : 'bg-red-50'}`}>
                  <p className="text-xs text-slate-500 mb-1">Ganancia estimada</p>
                  <p className={`text-2xl font-bold ${rentData.gananciaEstimada >= 0 ? 'text-emerald-700' : 'text-red-700'}`}>
                    {fmt(rentData.gananciaEstimada)}
                  </p>
                </div>
              </div>

              {/* Aviso de clasificación */}
              {rentData.lineas.length === 0 ? (
                <div className="tarjeta p-8 text-center">
                  <TrendingUp size={40} className="text-slate-300 mx-auto mb-3" />
                  <p className="font-medium text-slate-600">No hay datos de ingresos por período</p>
                  <p className="text-sm text-slate-400 mt-1">Emite facturas y órdenes de trabajo para ver la rentabilidad.</p>
                </div>
              ) : (
                <>
                  {rentData.lineas.some(l => l.nombre === 'general') && (
                    <div className="flex items-start gap-3 p-4 bg-amber-50 border border-amber-200 rounded-xl">
                      <Info size={16} className="text-amber-600 shrink-0 mt-0.5" />
                      <div>
                        <p className="text-sm font-medium text-amber-800">Facturas sin clasificar</p>
                        <p className="text-xs text-amber-700 mt-0.5">
                          Algunas facturas están en "General". Al crear facturas, selecciona la línea de negocio
                          (Ventas / Taller) para un análisis más preciso.
                        </p>
                      </div>
                    </div>
                  )}

                  {/* Cards por línea */}
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {rentData.lineas.map(linea => {
                      const info = LINEA_COLORS[linea.nombre] || LINEA_COLORS.general;
                      return (
                        <div key={linea.nombre} className={`tarjeta p-5 border ${info.border} ${info.bg}`}>
                          <div className="flex items-center justify-between mb-3">
                            <p className={`font-semibold text-sm ${info.text}`}>{info.label}</p>
                            <span className={`text-xs font-bold px-2 py-1 rounded-lg ${info.bg} ${info.text} border ${info.border}`}>
                              {fmtPct(linea.pctTotal)} del total
                            </span>
                          </div>
                          <p className="text-2xl font-bold text-slate-900 mb-1">{fmt(linea.totalIngresos)}</p>
                          <div className="space-y-1 mt-3">
                            {linea.ingresoFacturas > 0 && (
                              <div className="flex justify-between text-xs text-slate-600">
                                <span>Facturas</span><span className="font-medium">{fmt(linea.ingresoFacturas)}</span>
                              </div>
                            )}
                            {linea.ingresoOrdenes > 0 && (
                              <div className="flex justify-between text-xs text-slate-600">
                                <span>Órdenes de trabajo</span><span className="font-medium">{fmt(linea.ingresoOrdenes)}</span>
                              </div>
                            )}
                            <div className="flex justify-between text-xs text-slate-500 pt-1 border-t border-slate-200">
                              <span>Transacciones</span><span>{linea.transacciones}</span>
                            </div>
                          </div>
                          <div className="mt-3">
                            <BarHorizontal
                              value={linea.totalIngresos}
                              max={rentData.totalIngresos}
                              color={info.color}
                            />
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}
