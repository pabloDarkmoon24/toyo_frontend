import { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import writeXlsxFile from 'write-excel-file/browser';
import { reportes, gastosFijos as gastosFijosApi } from '../api';
import { toast } from '../utils/toast';
import {
  TrendingUp, TrendingDown, Wrench, Package,
  AlertTriangle, Users, FileText, ArrowRight, Sparkles,
  ShoppingCart, Clock, DollarSign, BarChart2, Download,
  Target, Brain, ChevronRight, ChevronLeft,
} from 'lucide-react';
import { PageLoader, AlertBanner, StatCard, Btn } from '../components/UI';

function AccesoRapido({ to, icon: Icon, label, descripcion, color }) {
  return (
    <Link to={to}
      className="tarjeta tarjeta-hover"
      style={{ display: 'flex', alignItems: 'center', gap: 14, padding: '14px 16px', textDecoration: 'none' }}
    >
      <div style={{
        width: 40, height: 40, borderRadius: 10, flexShrink: 0,
        background: color, display: 'flex', alignItems: 'center', justifyContent: 'center',
        boxShadow: `0 4px 12px ${color}55`,
      }}>
        <Icon size={18} color="#fff" />
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-gris-900)' }}>{label}</p>
        <p style={{ fontSize: '0.75rem', color: 'var(--color-gris-500)', marginTop: 1 }}>{descripcion}</p>
      </div>
      <ArrowRight size={14} style={{ color: 'var(--color-gris-300)', flexShrink: 0 }} />
    </Link>
  );
}

function TendenciaBarra({ mes, ventas, gastos, maxVal }) {
  const pV = maxVal > 0 ? (ventas / maxVal) * 100 : 0;
  const pG = maxVal > 0 ? (gastos / maxVal) * 100 : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 6, flex: 1 }}>
      <div style={{ width: '100%', height: 80, display: 'flex', alignItems: 'flex-end', gap: 2, position: 'relative' }}>
        <div style={{ flex: 1, height: `${pV}%`, background: 'linear-gradient(to top, #059669, #34d399)', borderRadius: '3px 3px 0 0', minHeight: 2 }} title={`Ventas: $${ventas.toLocaleString()}`} />
        <div style={{ flex: 1, height: `${pG}%`, background: 'linear-gradient(to top, #dc2626, #f87171)', borderRadius: '3px 3px 0 0', minHeight: 2 }} title={`Gastos: $${gastos.toLocaleString()}`} />
      </div>
      <p style={{ fontSize: '0.65rem', color: 'var(--color-gris-400)', fontWeight: 600, textAlign: 'center' }}>{mes}</p>
    </div>
  );
}

function variacion(actual, anterior) {
  if (!anterior) return null;
  const pct = ((actual - anterior) / anterior) * 100;
  const sube = pct >= 0;
  return (
    <span style={{ fontSize: '0.7rem', fontWeight: 600, color: sube ? '#059669' : '#dc2626' }}>
      {sube ? '▲' : '▼'} {Math.abs(pct).toFixed(0)}% vs mes anterior
    </span>
  );
}

async function descargarContabilidad(data) {
  if (!data) return;
  const { facturas, gastos, ordenes, resumen } = data;

  const sheetResumen = [
    [{ value: 'Concepto', fontWeight: 'bold' }, { value: 'Monto', fontWeight: 'bold' }],
    [{ value: 'Total Ventas (Facturas)' }, { value: resumen.totalVentas, type: Number }],
    [{ value: 'Total Órdenes de Trabajo' }, { value: resumen.totalOrdenes, type: Number }],
    [{ value: 'Total Gastos' }, { value: resumen.totalGastos, type: Number }],
    [{ value: 'Ganancia Neta' }, { value: resumen.ganancia, type: Number }],
  ];

  const sheetFacturas = [
    ['N° Factura','Fecha','Cliente','Subtotal','Impuesto','Total','Estado'].map(h => ({ value: h, fontWeight: 'bold' })),
    ...facturas.map(f => [
      { value: f.numero }, { value: new Date(f.createdAt).toLocaleDateString('es-VE') },
      { value: f.cliente?.nombre || '' }, { value: f.subtotal, type: Number },
      { value: f.impuesto, type: Number }, { value: f.total, type: Number }, { value: f.estado },
    ]),
  ];

  const sheetGastos = [
    ['Fecha','Descripción','Categoría','Monto','Notas'].map(h => ({ value: h, fontWeight: 'bold' })),
    ...gastos.map(g => [
      { value: new Date(g.fecha).toLocaleDateString('es-VE') }, { value: g.descripcion },
      { value: g.categoria }, { value: g.monto, type: Number }, { value: g.notas || '' },
    ]),
  ];

  const sheets = [sheetResumen, sheetFacturas, sheetGastos];
  const sheetNames = ['Resumen', 'Facturas', 'Gastos'];
  const columnSets = [
    [{ width: 30 }, { width: 18 }],
    [{ width: 18 },{ width: 12 },{ width: 30 },{ width: 12 },{ width: 12 },{ width: 12 },{ width: 12 }],
    [{ width: 12 },{ width: 40 },{ width: 18 },{ width: 12 },{ width: 30 }],
  ];

  if (ordenes.length) {
    sheets.push([
      ['N° Orden','Fecha','Cliente','Descripción','Estado','Total'].map(h => ({ value: h, fontWeight: 'bold' })),
      ...ordenes.map(o => [
        { value: o.numero }, { value: new Date(o.createdAt).toLocaleDateString('es-VE') },
        { value: o.vehiculo?.cliente?.nombre || '' }, { value: o.descripcion },
        { value: o.estado }, { value: o.total || 0, type: Number },
      ]),
    ]);
    sheetNames.push('Órdenes');
    columnSets.push([{ width: 14 },{ width: 12 },{ width: 30 },{ width: 40 },{ width: 12 },{ width: 12 }]);
  }

  await writeXlsxFile(sheets, {
    sheets: sheetNames,
    columns: columnSets,
    fileName: `contabilidad_toyo_${new Date().toISOString().slice(0, 10)}.xlsx`,
  });
}

function MetaMensual({ ventasMes = 0, gastosMes = 0, breakEven = 0, porCategoria = {} }) {
  const fmt = (n) => `$${Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 0 })}`;
  const gananciaActual = ventasMes - gastosMes;
  const pct = breakEven > 0 ? Math.min(100, (ventasMes / breakEven) * 100) : 0;
  const superado = ventasMes >= breakEven;
  const colorBarra = pct < 50 ? '#dc2626' : pct < 80 ? '#d97706' : '#059669';
  const CAT_LABELS = { colaboradores: 'Colaboradores', arriendo: 'Arriendo', servicios: 'Servicios', publicidad: 'Publicidad', otros: 'Otros' };
  const tieneItems = breakEven > 0;

  return (
    <div className="tarjeta" style={{ padding: 22 }}>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 18, flexWrap: 'wrap', gap: 10 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 36, height: 36, borderRadius: 10,
            background: superado ? 'rgba(5,150,105,.12)' : 'rgba(220,38,38,.08)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            border: `1px solid ${superado ? 'rgba(5,150,105,.25)' : 'rgba(220,38,38,.2)'}`,
          }}>
            <Target size={16} color={superado ? '#059669' : '#dc2626'} />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-gris-900)', lineHeight: 1 }}>Meta Mensual</p>
            <p style={{ fontSize: '0.72rem', color: 'var(--color-gris-400)', marginTop: 2 }}>Punto de equilibrio del negocio</p>
          </div>
        </div>
        <Link to="/configuracion" style={{
          fontSize: '0.75rem', color: 'var(--color-gris-400)', textDecoration: 'none',
          display: 'flex', alignItems: 'center', gap: 3, fontWeight: 500,
        }}>
          Configurar <ChevronRight size={12} />
        </Link>
      </div>

      {!tieneItems ? (
        <div style={{ textAlign: 'center', padding: '20px 0' }}>
          <p style={{ fontSize: '0.8375rem', color: 'var(--color-gris-400)', marginBottom: 12 }}>
            Define tus costos fijos para ver el punto de equilibrio
          </p>
          <Link to="/configuracion" style={{
            display: 'inline-flex', alignItems: 'center', gap: 6,
            padding: '7px 16px', borderRadius: 8, textDecoration: 'none',
            background: 'var(--color-gris-100)', color: 'var(--color-gris-600)',
            fontSize: '0.8125rem', fontWeight: 600,
          }}>
            <Target size={13} /> Configurar ahora
          </Link>
        </div>
      ) : (
        <>
          {/* Barra de progreso */}
          <div style={{ marginBottom: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-end', marginBottom: 7 }}>
              <div>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gris-500)', marginBottom: 3 }}>Ventas actuales</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: superado ? '#059669' : 'var(--color-gris-800)', lineHeight: 1 }}>{fmt(ventasMes)}</p>
              </div>
              <div style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gris-500)', marginBottom: 3 }}>Punto de equilibrio</p>
                <p style={{ fontSize: '1.1rem', fontWeight: 700, color: 'var(--color-gris-700)', lineHeight: 1 }}>{fmt(breakEven)}</p>
              </div>
            </div>
            <div style={{ height: 10, borderRadius: 99, background: 'var(--color-gris-100)', overflow: 'hidden' }}>
              <div style={{
                height: '100%', borderRadius: 99,
                width: `${pct}%`,
                background: superado
                  ? 'linear-gradient(90deg, #059669, #34d399)'
                  : `linear-gradient(90deg, ${colorBarra}, ${colorBarra}aa)`,
                transition: 'width 0.6s ease',
              }} />
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: 6 }}>
              <span style={{ fontSize: '0.72rem', fontWeight: 700, color: colorBarra }}>
                {pct.toFixed(0)}% completado
              </span>
              {superado ? (
                <span style={{ fontSize: '0.72rem', fontWeight: 700, color: '#059669' }}>
                  ✓ Punto de equilibrio superado · Ganancia: {fmt(ventasMes - breakEven)}
                </span>
              ) : (
                <span style={{ fontSize: '0.72rem', color: 'var(--color-gris-400)' }}>
                  Faltan {fmt(breakEven - ventasMes)} para cubrir costos
                </span>
              )}
            </div>
          </div>

          {/* Desglose por categoría */}
          {Object.keys(porCategoria).length > 0 && (
            <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', marginBottom: 14 }}>
              {Object.entries(porCategoria).map(([cat, monto]) => (
                <div key={cat} style={{
                  padding: '5px 10px', borderRadius: 8,
                  background: 'var(--color-gris-50)', border: '1px solid var(--color-gris-200)',
                  fontSize: '0.72rem',
                }}>
                  <span style={{ color: 'var(--color-gris-500)', fontWeight: 500 }}>{CAT_LABELS[cat] || cat}: </span>
                  <span style={{ color: 'var(--color-gris-800)', fontWeight: 700 }}>{fmt(monto)}</span>
                </div>
              ))}
            </div>
          )}

          {/* Ganancia neta */}
          <div style={{
            display: 'flex', justifyContent: 'space-between', alignItems: 'center',
            padding: '10px 14px', borderRadius: 10,
            background: gananciaActual >= 0 ? 'rgba(5,150,105,.06)' : 'rgba(220,38,38,.06)',
            border: `1px solid ${gananciaActual >= 0 ? 'rgba(5,150,105,.2)' : 'rgba(220,38,38,.2)'}`,
          }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-gris-600)' }}>Ganancia neta del mes (ventas − gastos)</span>
            <span style={{ fontWeight: 800, color: gananciaActual >= 0 ? '#059669' : '#dc2626' }}>
              {gananciaActual >= 0 ? '+' : ''}{fmt(gananciaActual)}
            </span>
          </div>

          <Link to="/asesor" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 7, marginTop: 12,
            padding: '8px', borderRadius: 9, textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 600,
            background: 'linear-gradient(135deg, rgba(124,58,237,.08), rgba(220,38,38,.05))',
            color: '#7c3aed', border: '1px solid rgba(124,58,237,.15)',
          }}>
            <Brain size={13} /> Ver estrategias para vender más
          </Link>
        </>
      )}
    </div>
  );
}

const MESES = ['Enero','Febrero','Marzo','Abril','Mayo','Junio','Julio','Agosto','Septiembre','Octubre','Noviembre','Diciembre'];

export default function Dashboard() {
  const [data, setData] = useState(null);
  const [meta, setMeta] = useState({ items: [], totalBreakEven: 0, porCategoria: {} });
  const [cargando, setCargando] = useState(true);
  const [descargando, setDescargando] = useState(false);
  const hoyRef = new Date();
  const [mesSel, setMesSel] = useState(hoyRef.getMonth() + 1); // 1-12
  const [anoSel, setAnoSel] = useState(hoyRef.getFullYear());
  const esMesActual = mesSel === hoyRef.getMonth() + 1 && anoSel === hoyRef.getFullYear();

  const navMes = (delta) => {
    setMesSel(m => {
      let nm = m + delta;
      let na = anoSel;
      if (nm < 1) { nm = 12; na -= 1; }
      if (nm > 12) { nm = 1; na += 1; }
      setAnoSel(na);
      return nm;
    });
  };

  useEffect(() => {
    setCargando(true);
    Promise.all([
      reportes.dashboard({ mes: mesSel, ano: anoSel }),
      gastosFijosApi.listar(),
    ]).then(([r, gf]) => {
      setData(r.data);
      setMeta(gf.data);
    }).catch(console.error)
      .finally(() => setCargando(false));
  }, [mesSel, anoSel]);

  const descargar = async () => {
    setDescargando(true);
    try {
      const r = await reportes.contabilidad();
      descargarContabilidad(r.data);
    } catch (e) { toast.error('Error al generar contabilidad'); }
    finally { setDescargando(false); }
  };

  if (cargando) return <PageLoader />;

  const fmt = (n) => `$${Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
  const maxTendencia = data?.tendencia ? Math.max(...data.tendencia.flatMap(t => [t.ventas, t.gastos]), 1) : 1;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>

      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: 12 }}>
        <div>
          <h1 className="seccion-titulo">Bienvenido a Toyo+</h1>
          <p className="seccion-subtitulo">
            {new Date().toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
          </p>
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
          {/* Selector de mes */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 4, background: 'var(--color-gris-100)', borderRadius: 10, padding: '4px 6px' }}>
            <button onClick={() => navMes(-1)} style={{ width: 26, height: 26, border: 'none', background: 'transparent', borderRadius: 6, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--color-gris-600)' }}>
              <ChevronLeft size={14} />
            </button>
            <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-gris-800)', minWidth: 110, textAlign: 'center' }}>
              {MESES[mesSel - 1]} {anoSel}
            </span>
            <button
              onClick={() => navMes(1)}
              disabled={esMesActual}
              style={{ width: 26, height: 26, border: 'none', background: 'transparent', borderRadius: 6, cursor: esMesActual ? 'default' : 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', color: esMesActual ? 'var(--color-gris-300)' : 'var(--color-gris-600)' }}>
              <ChevronRight size={14} />
            </button>
          </div>
          <Btn icon={Download} variant="secondary" onClick={descargar} disabled={descargando}>
            {descargando ? 'Generando...' : 'Descargar Contabilidad'}
          </Btn>
          <Link to="/asistente" className="btn btn-ia" style={{ textDecoration: 'none' }}>
            <Sparkles size={14} />
            Asistente IA
          </Link>
        </div>
      </div>

      {/* Alertas */}
      {data?.productosStockBajo > 0 && (
        <AlertBanner
          icon={AlertTriangle}
          title="Productos con stock bajo"
          message={`${data.productosStockBajo} producto${data.productosStockBajo > 1 ? 's' : ''} requieren reposición urgente.`}
          variant="warning"
          action={
            <Link to="/lista-compras"
              style={{ textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, color: '#92400e', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, marginTop: 2 }}>
              Ver lista de compras <ArrowRight size={12} />
            </Link>
          }
        />
      )}

      {data?.montoPendiente > 0 && (
        <AlertBanner
          icon={Clock}
          title="Facturas pendientes de cobro"
          message={`${data.facturasPendientesCount} factura${data.facturasPendientesCount > 1 ? 's' : ''} por cobrar — Total: ${fmt(data.montoPendiente)}`}
          variant="info"
          action={
            <Link to="/facturas"
              style={{ textDecoration: 'none', fontSize: '0.8rem', fontWeight: 600, color: '#1e3a8a', display: 'flex', alignItems: 'center', gap: 3, flexShrink: 0, marginTop: 2 }}>
              Ver facturas <ArrowRight size={12} />
            </Link>
          }
        />
      )}

      {/* KPIs principales */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
        <StatCard
          icon={TrendingUp}
          label={`Ventas — ${MESES[mesSel - 1]}`}
          value={fmt(data?.ventasMes)}
          sub={<>{data?.facturasCount || 0} facturas &nbsp;·&nbsp; {variacion(data?.ventasMes, data?.ventasMesAnterior)}</>}
          gradient="linear-gradient(135deg, #059669 0%, #047857 100%)"
        />
        <StatCard
          icon={TrendingDown}
          label="Gastos del Mes"
          value={fmt(data?.gastosMes)}
          sub={variacion(data?.gastosMes, data?.gastosMesAnterior)}
          gradient="linear-gradient(135deg, #dc2626 0%, #991b1b 100%)"
        />
        <StatCard
          icon={DollarSign}
          label="Ganancia del Mes"
          value={fmt(data?.gananciasMes)}
          sub={`Acumulado año: ${fmt(data?.ventasAno)}`}
          gradient={(data?.gananciasMes || 0) >= 0
            ? "linear-gradient(135deg, #2563eb 0%, #1d4ed8 100%)"
            : "linear-gradient(135deg, #9333ea 0%, #7e22ce 100%)"
          }
        />
        <StatCard
          icon={Wrench}
          label="Órdenes Activas"
          value={data?.ordenesActivas || 0}
          sub="vehículos en taller"
          gradient="linear-gradient(135deg, #d97706 0%, #b45309 100%)"
        />
      </div>

      {/* Métricas secundarias */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 14 }}>
        <StatCard icon={Package} label="Productos" value={data?.totalProductos || 0} />
        <StatCard
          icon={AlertTriangle}
          label="Stock Bajo"
          value={data?.productosStockBajo || 0}
          sub="requieren reposición"
          style={data?.productosStockBajo > 0 ? { background: 'var(--color-alerta-claro)', border: '1px solid var(--color-alerta-borde)' } : {}}
        />
        <StatCard icon={Users} label="Clientes" value={data?.clientesTotal || 0} />
        <StatCard
          icon={Clock}
          label="Por cobrar"
          value={data?.facturasPendientesCount || 0}
          sub={fmt(data?.montoPendiente)}
          style={{ background: 'rgba(37,99,235,.04)', border: '1px solid rgba(37,99,235,.15)' }}
        />
        <StatCard
          icon={FileText}
          label="Cotizaciones pendientes"
          value={data?.cotizacionesPendientes || 0}
        />
      </div>

      {/* Meta Mensual */}
      <MetaMensual
        ventasMes={data?.ventasMes || 0}
        gastosMes={data?.gastosMes || 0}
        breakEven={meta.totalBreakEven}
        porCategoria={meta.porCategoria}
      />

      {/* Tendencia + Top productos */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

        {/* Tendencia 6 meses */}
        <div className="tarjeta" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <BarChart2 size={15} style={{ color: 'var(--color-gris-400)' }} />
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-gris-900)' }}>Tendencia 6 meses</p>
          </div>
          <div style={{ display: 'flex', gap: 6, alignItems: 'flex-end', marginBottom: 10 }}>
            {data?.tendencia?.map(t => (
              <TendenciaBarra key={t.mes} {...t} maxVal={maxTendencia} />
            ))}
          </div>
          <div style={{ display: 'flex', gap: 16, justifyContent: 'center' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: 'var(--color-gris-500)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#059669', display: 'inline-block' }} />
              Ventas
            </span>
            <span style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: '0.7rem', color: 'var(--color-gris-500)' }}>
              <span style={{ width: 10, height: 10, borderRadius: 2, background: '#dc2626', display: 'inline-block' }} />
              Gastos
            </span>
          </div>
        </div>

        {/* Top productos */}
        <div className="tarjeta" style={{ padding: 20 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <TrendingUp size={15} style={{ color: 'var(--color-gris-400)' }} />
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-gris-900)' }}>Productos más vendidos</p>
          </div>
          {(!data?.topProductos || data.topProductos.length === 0) ? (
            <p style={{ fontSize: '0.8125rem', color: 'var(--color-gris-400)', textAlign: 'center', padding: '20px 0' }}>
              Aún no hay ventas registradas
            </p>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
              {data.topProductos.map((t, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <span style={{
                    width: 22, height: 22, borderRadius: 6, flexShrink: 0,
                    background: i === 0 ? '#fbbf24' : i === 1 ? 'var(--color-gris-300)' : 'var(--color-gris-200)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: '0.7rem', fontWeight: 800, color: i < 2 ? '#fff' : 'var(--color-gris-600)',
                  }}>
                    {i + 1}
                  </span>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-gris-800)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {t.producto?.nombre || 'Producto'}
                    </p>
                    <p style={{ fontSize: '0.7rem', color: 'var(--color-gris-400)' }}>{t.producto?.categoria}</p>
                  </div>
                  <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-gris-700)', flexShrink: 0 }}>
                    ×{t.cantidad}
                  </span>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Últimas facturas */}
      {data?.ultimasFacturas?.length > 0 && (
        <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
          <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--color-gris-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-gris-900)' }}>Últimas facturas</p>
            <Link to="/facturas" style={{ fontSize: '0.78rem', color: 'var(--color-toyo)', fontWeight: 600, textDecoration: 'none', display: 'flex', alignItems: 'center', gap: 3 }}>
              Ver todas <ArrowRight size={12} />
            </Link>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
            <tbody>
              {data.ultimasFacturas.map((f, i) => (
                <tr key={f.id} style={{ borderBottom: i < data.ultimasFacturas.length - 1 ? '1px solid var(--color-gris-50)' : 'none' }}>
                  <td style={{ padding: '11px 20px' }}>
                    <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem', color: 'var(--color-gris-600)' }}>{f.numero}</span>
                  </td>
                  <td style={{ padding: '11px 8px', color: 'var(--color-gris-700)', fontWeight: 500 }}>
                    {f.cliente?.nombre || '—'}
                  </td>
                  <td style={{ padding: '11px 8px', color: 'var(--color-gris-400)', fontSize: '0.75rem' }}>
                    {new Date(f.createdAt).toLocaleDateString('es-VE')}
                  </td>
                  <td style={{ padding: '11px 20px', textAlign: 'right', fontWeight: 700, color: 'var(--color-gris-800)' }}>
                    {fmt(f.total)}
                  </td>
                  <td style={{ padding: '11px 20px', textAlign: 'center' }}>
                    <span style={{
                      padding: '2px 9px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 600,
                      background: f.estado === 'pagada' ? 'rgba(5,150,105,.1)' : f.estado === 'cancelada' ? 'rgba(220,38,38,.1)' : 'rgba(217,119,6,.1)',
                      color: f.estado === 'pagada' ? '#059669' : f.estado === 'cancelada' ? '#dc2626' : '#d97706',
                    }}>
                      {f.estado}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Accesos rápidos */}
      <div>
        <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--color-gris-500)', marginBottom: 10 }}>
          Accesos Rápidos
        </p>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 10 }}>
          <AccesoRapido to="/inventario"    icon={Package}      label="Inventario"         descripcion="Gestionar productos y stock"   color="#3b82f6" />
          <AccesoRapido to="/lista-compras" icon={ShoppingCart} label="Lista de Compras"   descripcion="Productos por reponer"         color="#f97316" />
          <AccesoRapido to="/ordenes"       icon={Wrench}       label="Nueva Orden"        descripcion="Registrar trabajo de taller"   color="#f59e0b" />
          <AccesoRapido to="/facturas"      icon={FileText}     label="Facturación"        descripcion="Emitir y gestionar facturas"   color="#10b981" />
          <AccesoRapido to="/asistente"     icon={Sparkles}     label="Asistente IA"       descripcion="Gestionar todo por chat"       color="#7c3aed" />
        </div>
      </div>
    </div>
  );
}
