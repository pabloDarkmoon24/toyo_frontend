import { useEffect, useState, useCallback } from 'react';
import writeXlsxFile from 'write-excel-file/browser';
import { movimientos as api } from '../api';
import {
  History, TrendingUp, TrendingDown, Package, FileText,
  Wrench, RefreshCw, Download, Filter, User, ArrowLeftRight,
  ShoppingCart, CheckCircle2, XCircle, ArrowUpDown,
} from 'lucide-react';
import { PageLoader, EmptyState, SectionHeader, Btn } from '../components/UI';

// ── Config por tipo ──────────────────────────────────────────────────────────
const TIPOS = {
  venta:          { label: 'Venta',              icon: TrendingUp,     color: '#059669', bg: 'rgba(5,150,105,.1)' },
  cotizacion:     { label: 'Cotización',          icon: FileText,       color: '#2563eb', bg: 'rgba(37,99,235,.1)' },
  conversion:     { label: 'Conversión',          icon: ArrowLeftRight, color: '#7c3aed', bg: 'rgba(124,58,237,.1)' },
  factura_estado: { label: 'Estado Factura',      icon: CheckCircle2,   color: '#0891b2', bg: 'rgba(8,145,178,.1)' },
  stock_entrada:  { label: 'Entrada Stock',       icon: Package,        color: '#16a34a', bg: 'rgba(22,163,74,.1)' },
  stock_salida:   { label: 'Salida Stock',        icon: ArrowUpDown,    color: '#ea580c', bg: 'rgba(234,88,12,.1)' },
  stock_venta:    { label: 'Salida por Venta',    icon: ShoppingCart,   color: '#d97706', bg: 'rgba(217,119,6,.1)' },
  stock_ajuste:   { label: 'Ajuste Stock',        icon: ArrowUpDown,    color: '#6b7280', bg: 'rgba(107,114,128,.1)' },
  gasto:          { label: 'Gasto',               icon: TrendingDown,   color: '#dc2626', bg: 'rgba(220,38,38,.1)' },
  gasto_eliminado:{ label: 'Gasto Eliminado',     icon: XCircle,        color: '#991b1b', bg: 'rgba(153,27,27,.1)' },
  orden_nueva:    { label: 'Nueva Orden',          icon: Wrench,         color: '#b45309', bg: 'rgba(180,83,9,.1)' },
  orden_estado:   { label: 'Estado Orden',         icon: Wrench,         color: '#78716c', bg: 'rgba(120,113,108,.1)' },
};

function IconoTipo({ tipo }) {
  const cfg = TIPOS[tipo] || { icon: History, color: '#6b7280', bg: 'rgba(107,114,128,.1)' };
  const Ic = cfg.icon;
  return (
    <div style={{
      width: 34, height: 34, borderRadius: 9, flexShrink: 0,
      background: cfg.bg, display: 'flex', alignItems: 'center', justifyContent: 'center',
    }}>
      <Ic size={15} color={cfg.color} />
    </div>
  );
}

function BadgeTipo({ tipo }) {
  const cfg = TIPOS[tipo] || { label: tipo, color: '#6b7280', bg: 'rgba(107,114,128,.1)' };
  return (
    <span style={{
      padding: '2px 8px', borderRadius: 99, fontSize: '0.68rem', fontWeight: 700,
      background: cfg.bg, color: cfg.color, whiteSpace: 'nowrap',
    }}>
      {cfg.label}
    </span>
  );
}

function agruparPorFecha(lista) {
  const grupos = {};
  lista.forEach(m => {
    const fecha = new Date(m.fecha).toLocaleDateString('es-VE', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });
    if (!grupos[fecha]) grupos[fecha] = [];
    grupos[fecha].push(m);
  });
  return grupos;
}

async function exportar(lista) {
  const headers = ['Fecha','Tipo','Descripción','Usuario','Referencia','Monto','Cantidad'];
  const data = [
    headers.map(h => ({ value: h, fontWeight: 'bold' })),
    ...lista.map(m => [
      { value: new Date(m.fecha).toLocaleString('es-VE') },
      { value: TIPOS[m.tipo]?.label || m.tipo },
      { value: m.descripcion },
      { value: m.usuarioNombre || '—' },
      { value: m.referencia || '—' },
      { value: m.monto ?? '' },
      { value: m.cantidad ?? '' },
    ]),
  ];
  await writeXlsxFile(data, {
    columns: [{ width: 20 },{ width: 18 },{ width: 60 },{ width: 18 },{ width: 16 },{ width: 12 },{ width: 10 }],
    fileName: `historial_toyo_${new Date().toISOString().slice(0, 10)}.xlsx`,
    sheet: 'Historial',
  });
}

export default function Historial() {
  const [lista, setLista] = useState([]);
  const [usuarios, setUsuarios] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtros, setFiltros] = useState({ tipo: '', usuarioId: '', desde: '', hasta: '' });

  const cargar = useCallback(() => {
    setCargando(true);
    const params = { limite: 500 };
    if (filtros.tipo) params.tipo = filtros.tipo;
    if (filtros.usuarioId) params.usuarioId = filtros.usuarioId;
    if (filtros.desde) params.desde = filtros.desde;
    if (filtros.hasta) params.hasta = filtros.hasta;
    api.listar(params)
      .then(r => setLista(r.data))
      .finally(() => setCargando(false));
  }, [filtros]);

  useEffect(() => { cargar(); }, [cargar]);

  useEffect(() => {
    api.usuarios().then(r => setUsuarios(r.data)).catch(() => {});
  }, []);

  const f = (k, v) => setFiltros(p => ({ ...p, [k]: v }));
  const limpiar = () => setFiltros({ tipo: '', usuarioId: '', desde: '', hasta: '' });

  const grupos = agruparPorFecha(lista);
  const fmt = (n) => n != null ? `$${Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2 })}` : null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader
        title="Historial de Movimientos"
        subtitle={`${lista.length} registros${Object.keys(filtros).some(k => filtros[k]) ? ' (filtrados)' : ''}`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn icon={RefreshCw} variant="secondary" onClick={cargar}>Actualizar</Btn>
            <Btn icon={Download} variant="secondary" onClick={() => exportar(lista)} disabled={!lista.length}>
              Exportar Excel
            </Btn>
          </div>
        }
      />

      {/* Filtros */}
      <div className="tarjeta" style={{ padding: '14px 16px', display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
        <Filter size={14} style={{ color: 'var(--color-gris-400)', flexShrink: 0, marginBottom: 8 }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 140px' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-gris-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Tipo</label>
          <select value={filtros.tipo} onChange={e => f('tipo', e.target.value)} className="campo" style={{ fontSize: '0.8125rem' }}>
            <option value="">Todos los tipos</option>
            {Object.entries(TIPOS).map(([k, v]) => <option key={k} value={k}>{v.label}</option>)}
          </select>
        </div>

        {usuarios.length > 0 && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 130px' }}>
            <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-gris-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Usuario</label>
            <select value={filtros.usuarioId} onChange={e => f('usuarioId', e.target.value)} className="campo" style={{ fontSize: '0.8125rem' }}>
              <option value="">Todos</option>
              {usuarios.map(u => <option key={u.usuarioId} value={u.usuarioId}>{u.usuarioNombre}</option>)}
            </select>
          </div>
        )}

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 130px' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-gris-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Desde</label>
          <input type="date" value={filtros.desde} onChange={e => f('desde', e.target.value)} className="campo" style={{ fontSize: '0.8125rem', width: '100%' }} />
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flex: '1 1 130px' }}>
          <label style={{ fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-gris-500)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hasta</label>
          <input type="date" value={filtros.hasta} onChange={e => f('hasta', e.target.value)} className="campo" style={{ fontSize: '0.8125rem', width: '100%' }} />
        </div>

        {Object.values(filtros).some(v => v) && (
          <Btn variant="secondary" onClick={limpiar} style={{ fontSize: '0.8125rem', padding: '7px 14px' }}>
            Limpiar filtros
          </Btn>
        )}
      </div>

      {/* Timeline */}
      {cargando ? (
        <PageLoader />
      ) : lista.length === 0 ? (
        <EmptyState
          icon={History}
          title="Sin movimientos"
          description="Aún no hay actividad registrada en el sistema"
        />
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
          {Object.entries(grupos).map(([fecha, items]) => (
            <div key={fecha}>
              {/* Separador de fecha */}
              <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginBottom: 10 }}>
                <span style={{
                  fontSize: '0.72rem', fontWeight: 700, textTransform: 'uppercase',
                  letterSpacing: '0.07em', color: 'var(--color-gris-500)',
                  whiteSpace: 'nowrap',
                }}>
                  {fecha}
                </span>
                <div style={{ flex: 1, height: 1, background: 'var(--color-gris-200)' }} />
                <span style={{ fontSize: '0.68rem', color: 'var(--color-gris-400)', whiteSpace: 'nowrap' }}>
                  {items.length} evento{items.length > 1 ? 's' : ''}
                </span>
              </div>

              {/* Items del día */}
              <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
                {items.map((m, i) => (
                  <div
                    key={m.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: 12,
                      padding: '12px 16px',
                      borderBottom: i < items.length - 1 ? '1px solid var(--color-gris-50)' : 'none',
                    }}
                  >
                    <IconoTipo tipo={m.tipo} />

                    <div style={{ flex: 1, minWidth: 0 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
                        <BadgeTipo tipo={m.tipo} />
                        {m.referencia && (
                          <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', color: 'var(--color-gris-500)', background: 'var(--color-gris-100)', padding: '1px 6px', borderRadius: 4 }}>
                            {m.referencia}
                          </span>
                        )}
                      </div>
                      <p style={{ fontSize: '0.8125rem', color: 'var(--color-gris-800)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                        {m.descripcion}
                      </p>
                    </div>

                    {/* Monto */}
                    {m.monto != null && (
                      <span style={{
                        fontWeight: 700, fontSize: '0.875rem', flexShrink: 0,
                        color: ['venta', 'stock_entrada', 'conversion'].includes(m.tipo) ? '#059669' : '#dc2626',
                      }}>
                        {fmt(m.monto)}
                      </span>
                    )}

                    {/* Cantidad (sin monto) */}
                    {m.cantidad != null && m.monto == null && (
                      <span style={{ fontWeight: 600, fontSize: '0.8125rem', color: 'var(--color-gris-500)', flexShrink: 0 }}>
                        ×{m.cantidad}
                      </span>
                    )}

                    <div style={{ textAlign: 'right', flexShrink: 0, minWidth: 90 }}>
                      <p style={{ fontSize: '0.72rem', color: 'var(--color-gris-400)' }}>
                        {new Date(m.fecha).toLocaleTimeString('es-VE', { hour: '2-digit', minute: '2-digit' })}
                      </p>
                      {m.usuarioNombre && (
                        <div style={{ display: 'flex', alignItems: 'center', gap: 3, justifyContent: 'flex-end', marginTop: 2 }}>
                          <User size={10} style={{ color: 'var(--color-gris-400)' }} />
                          <p style={{ fontSize: '0.7rem', color: 'var(--color-gris-500)', fontWeight: 500 }}>
                            {m.usuarioNombre}
                          </p>
                        </div>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
