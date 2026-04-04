import { useEffect, useState } from 'react';
import { caja as apiCaja } from '../api';
import { DollarSign, TrendingUp, TrendingDown, Printer, Wrench, FileText, RefreshCw } from 'lucide-react';
import { PageLoader, SectionHeader, Btn } from '../components/UI';

const hoyISO = () => new Date().toISOString().slice(0, 10);

function fmt(n) {
  return `$${Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
}

function FilaIngreso({ label, valor, sub, color = '#059669' }) {
  return (
    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 0', borderBottom: '1px solid var(--color-gris-100)' }}>
      <div>
        <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-gris-800)' }}>{label}</p>
        {sub && <p style={{ fontSize: '0.72rem', color: 'var(--color-gris-400)', marginTop: 1 }}>{sub}</p>}
      </div>
      <span style={{ fontWeight: 700, color, fontSize: '0.9rem' }}>{fmt(valor)}</span>
    </div>
  );
}

function imprimirCierre(data) {
  const { fecha, facturas, gastos, ordenes, resumen } = data;
  const html = `<!DOCTYPE html><html><head><meta charset="utf-8">
  <title>Cierre de Caja ${fecha}</title>
  <style>
    * { margin:0; padding:0; box-sizing:border-box; }
    body { font-family: 'Courier New', monospace; font-size: 12px; padding: 20px; max-width: 380px; margin: 0 auto; }
    h1 { font-size: 16px; text-align: center; border-bottom: 2px solid #000; padding-bottom: 8px; margin-bottom: 12px; }
    .sub { font-size: 10px; text-align: center; color: #555; margin-bottom: 16px; }
    .seccion { margin-bottom: 14px; }
    .seccion-titulo { font-weight: bold; text-transform: uppercase; font-size: 10px; letter-spacing: 1px; border-bottom: 1px dashed #888; padding-bottom: 3px; margin-bottom: 6px; }
    .fila { display: flex; justify-content: space-between; padding: 2px 0; }
    .fila.total { font-weight: bold; border-top: 1px solid #000; margin-top: 4px; padding-top: 4px; }
    .resumen { border: 2px solid #000; padding: 10px; margin-top: 16px; }
    .resumen .fila { font-size: 13px; }
    .ganancia { font-size: 15px; font-weight: 900; }
    .verde { color: #059669; }
    .rojo { color: #dc2626; }
    @media print { body { padding: 8px; } }
  </style></head><body>
  <h1>TOYO+ — CIERRE DE CAJA</h1>
  <p class="sub">${new Date(fecha + 'T12:00:00').toLocaleDateString('es-VE', { weekday:'long', year:'numeric', month:'long', day:'numeric' })}</p>
  <p class="sub">Generado: ${new Date().toLocaleString('es-VE')}</p>

  ${facturas.length ? `
  <div class="seccion">
    <p class="seccion-titulo">Facturas (${facturas.length})</p>
    ${facturas.map(f => `<div class="fila"><span>${f.numero} — ${f.cliente?.nombre || ''}</span><span>$${Number(f.total).toFixed(2)}</span></div>`).join('')}
    <div class="fila total"><span>SUBTOTAL FACTURAS</span><span>$${Number(resumen.totalFacturas).toFixed(2)}</span></div>
  </div>` : ''}

  ${ordenes.length ? `
  <div class="seccion">
    <p class="seccion-titulo">Órdenes Entregadas (${ordenes.length})</p>
    ${ordenes.map(o => `<div class="fila"><span>${o.numero} — ${o.vehiculo?.cliente?.nombre || ''}</span><span>$${Number(o.total).toFixed(2)}</span></div>`).join('')}
    <div class="fila total"><span>SUBTOTAL ÓRDENES</span><span>$${Number(resumen.totalOrdenes).toFixed(2)}</span></div>
  </div>` : ''}

  ${gastos.length ? `
  <div class="seccion">
    <p class="seccion-titulo">Gastos (${gastos.length})</p>
    ${gastos.map(g => `<div class="fila"><span>${g.descripcion}</span><span>-$${Number(g.monto).toFixed(2)}</span></div>`).join('')}
    <div class="fila total"><span>TOTAL GASTOS</span><span>-$${Number(resumen.totalGastos).toFixed(2)}</span></div>
  </div>` : ''}

  <div class="resumen">
    <div class="fila"><span>Total Ingresos</span><span class="verde">$${Number(resumen.totalIngresos).toFixed(2)}</span></div>
    <div class="fila"><span>Total Gastos</span><span class="rojo">-$${Number(resumen.totalGastos).toFixed(2)}</span></div>
    <div class="fila total ganancia"><span>GANANCIA DEL DÍA</span><span class="${resumen.ganancia >= 0 ? 'verde' : 'rojo'}">$${Number(resumen.ganancia).toFixed(2)}</span></div>
  </div>
  <p style="text-align:center;margin-top:16px;font-size:10px;color:#888;">— Toyo+ Sistema de Gestión —</p>
  <script>window.onload=()=>window.print()<\/script>
  </body></html>`;
  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
}

export default function CierreCaja() {
  const [fecha, setFecha] = useState(hoyISO());
  const [data, setData] = useState(null);
  const [cargando, setCargando] = useState(true);

  const cargar = (f) => {
    setCargando(true);
    apiCaja.obtener(f || fecha)
      .then(r => setData(r.data))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const cambiarFecha = (v) => { setFecha(v); cargar(v); };

  if (cargando) return <PageLoader />;

  const r = data?.resumen || {};
  const sinActividad = !data?.facturas?.length && !data?.gastos?.length && !data?.ordenes?.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader
        title="Cierre de Caja"
        subtitle="Resumen financiero diario"
        action={
          <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
            <input
              type="date"
              value={fecha}
              onChange={e => cambiarFecha(e.target.value)}
              className="campo"
              style={{ fontSize: '0.875rem', padding: '7px 12px' }}
            />
            <Btn icon={RefreshCw} variant="secondary" onClick={() => cargar()}>Actualizar</Btn>
            {!sinActividad && (
              <Btn icon={Printer} onClick={() => imprimirCierre(data)}>Imprimir</Btn>
            )}
          </div>
        }
      />

      {/* Resumen principal */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 14 }}>
        {[
          { label: 'Ingresos del Día', valor: r.totalIngresos, color: '#059669', bg: 'rgba(5,150,105,.08)', icon: TrendingUp },
          { label: 'Facturas', valor: r.totalFacturas, color: '#2563eb', bg: 'rgba(37,99,235,.08)', icon: FileText },
          { label: 'Órdenes Entregadas', valor: r.totalOrdenes, color: '#d97706', bg: 'rgba(217,119,6,.08)', icon: Wrench },
          { label: 'Gastos del Día', valor: r.totalGastos, color: '#dc2626', bg: 'rgba(220,38,38,.08)', icon: TrendingDown },
          {
            label: 'Ganancia Neta',
            valor: r.ganancia,
            color: r.ganancia >= 0 ? '#059669' : '#dc2626',
            bg: r.ganancia >= 0 ? 'rgba(5,150,105,.08)' : 'rgba(220,38,38,.08)',
            icon: DollarSign,
            destacado: true,
          },
        ].map(({ label, valor, color, bg, icon: Icon, destacado }) => (
          <div key={label} className="tarjeta" style={{ padding: '16px 18px', background: bg, border: `1px solid ${color}22` }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <Icon size={14} color={color} />
              <p style={{ fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color }}>{label}</p>
            </div>
            <p style={{ fontSize: destacado ? '1.6rem' : '1.4rem', fontWeight: 900, color, lineHeight: 1 }}>
              {fmt(valor)}
            </p>
          </div>
        ))}
      </div>

      {sinActividad ? (
        <div className="tarjeta" style={{ padding: 40, textAlign: 'center', color: 'var(--color-gris-400)' }}>
          <DollarSign size={32} style={{ marginBottom: 10, opacity: 0.3 }} />
          <p style={{ fontSize: '0.9rem', fontWeight: 600 }}>Sin actividad registrada para esta fecha</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: 20 }}>

          {/* Facturas */}
          {data?.facturas?.length > 0 && (
            <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-gris-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <FileText size={14} color="#2563eb" />
                  <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>Facturas ({data.facturas.length})</p>
                </div>
                <span style={{ fontWeight: 700, color: '#059669' }}>{fmt(r.totalFacturas)}</span>
              </div>
              {data.facturas.map((f, i) => (
                <div key={f.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: i < data.facturas.length - 1 ? '1px solid var(--color-gris-50)' : 'none', fontSize: '0.8125rem' }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--color-gris-500)' }}>{f.numero}</span>
                    <p style={{ fontWeight: 500, color: 'var(--color-gris-800)' }}>{f.cliente?.nombre || '—'}</p>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <p style={{ fontWeight: 700, color: 'var(--color-gris-900)' }}>{fmt(f.total)}</p>
                    <p style={{ fontSize: '0.7rem', color: f.estado === 'pagada' ? '#059669' : '#d97706' }}>{f.estado}</p>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Órdenes */}
          {data?.ordenes?.length > 0 && (
            <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-gris-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <Wrench size={14} color="#d97706" />
                  <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>Órdenes Entregadas ({data.ordenes.length})</p>
                </div>
                <span style={{ fontWeight: 700, color: '#059669' }}>{fmt(r.totalOrdenes)}</span>
              </div>
              {data.ordenes.map((o, i) => (
                <div key={o.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: i < data.ordenes.length - 1 ? '1px solid var(--color-gris-50)' : 'none', fontSize: '0.8125rem' }}>
                  <div>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--color-gris-500)' }}>{o.numero}</span>
                    <p style={{ fontWeight: 500, color: 'var(--color-gris-800)' }}>{o.vehiculo?.cliente?.nombre || '—'}</p>
                  </div>
                  <p style={{ fontWeight: 700, color: 'var(--color-gris-900)' }}>{fmt(o.total)}</p>
                </div>
              ))}
            </div>
          )}

          {/* Gastos */}
          {data?.gastos?.length > 0 && (
            <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
              <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--color-gris-100)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                  <TrendingDown size={14} color="#dc2626" />
                  <p style={{ fontWeight: 700, fontSize: '0.875rem' }}>Gastos ({data.gastos.length})</p>
                </div>
                <span style={{ fontWeight: 700, color: '#dc2626' }}>-{fmt(r.totalGastos)}</span>
              </div>
              {data.gastos.map((g, i) => (
                <div key={g.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 18px', borderBottom: i < data.gastos.length - 1 ? '1px solid var(--color-gris-50)' : 'none', fontSize: '0.8125rem' }}>
                  <div>
                    <p style={{ fontWeight: 500, color: 'var(--color-gris-800)' }}>{g.descripcion}</p>
                    <p style={{ fontSize: '0.72rem', color: 'var(--color-gris-400)' }}>{g.categoria}</p>
                  </div>
                  <p style={{ fontWeight: 700, color: '#dc2626' }}>-{fmt(g.monto)}</p>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}
