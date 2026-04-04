import { useEffect, useState } from 'react';
import writeXlsxFile from 'write-excel-file/browser';
import { reportes, productos as apiProductos } from '../api';
import { ShoppingCart, AlertTriangle, Download, RefreshCw, Package, CheckCircle2, Search } from 'lucide-react';
import { PageLoader, EmptyState, SectionHeader, Btn, Badge } from '../components/UI';
import { toast } from '../utils/toast';

const catColors = {
  rines: 'default', llantas: 'info', accesorios: 'success',
  'rines restaurados': 'purple', repuestos: 'default',
  pintura: 'purple', herramientas: 'warning', lubricantes: 'danger', otros: 'default',
};

function nivelUrgencia(p) {
  if (p.stock === 0) return { label: 'Agotado', color: '#dc2626', bg: 'rgba(220,38,38,.1)' };
  if (p.stock <= Math.floor(p.stockMinimo * 0.5)) return { label: 'Crítico', color: '#ea580c', bg: 'rgba(234,88,12,.1)' };
  return { label: 'Bajo', color: '#d97706', bg: 'rgba(217,119,6,.1)' };
}

async function exportarListaExcel(productos, cantidades) {
  const headers = ['Código','Producto','Categoría','Stock Actual','Stock Mínimo','Faltante','Cant. a Pedir','Estado'];
  const data = [
    headers.map(h => ({ value: h, fontWeight: 'bold' })),
    ...productos.map(p => [
      { value: p.codigo || '' },
      { value: p.nombre },
      { value: p.categoria },
      { value: p.stock, type: Number },
      { value: p.stockMinimo, type: Number },
      { value: Math.max(0, p.stockMinimo - p.stock), type: Number },
      { value: cantidades[p.id] || '' },
      { value: p.stock === 0 ? 'Agotado' : 'Stock Bajo' },
    ]),
  ];
  await writeXlsxFile(data, {
    columns: [{ width: 10 },{ width: 50 },{ width: 18 },{ width: 12 },{ width: 12 },{ width: 10 },{ width: 14 },{ width: 12 }],
    fileName: `lista_compras_${new Date().toISOString().slice(0, 10)}.xlsx`,
    sheet: 'Lista de Compras',
  });
}

export default function ListaCompras() {
  const [productos, setProductos] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [cantidades, setCantidades] = useState({});
  const [pedidos, setPedidos] = useState(new Set());
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [buscarTexto, setBuscarTexto] = useState('');
  const [editandoMin, setEditandoMin] = useState({});
  const [guardando, setGuardando] = useState({});

  const cargar = () => {
    setCargando(true);
    reportes.stockBajo()
      .then(r => setProductos(r.data))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const categorias = [...new Set(productos.map(p => p.categoria))].sort();

  const filtrados = productos.filter(p => {
    if (categoriaFiltro && p.categoria !== categoriaFiltro) return false;
    if (buscarTexto) {
      const q = buscarTexto.toLowerCase();
      if (!p.nombre.toLowerCase().includes(q) && !(p.codigo || '').toLowerCase().includes(q)) return false;
    }
    return true;
  });

  const agotados = productos.filter(p => p.stock === 0).length;
  const criticos = productos.filter(p => p.stock > 0 && p.stock <= Math.floor(p.stockMinimo * 0.5)).length;

  const setCant = (id, val) => setCantidades(prev => ({ ...prev, [id]: Math.max(0, Number(val)) }));

  const togglePedido = (id) => {
    setPedidos(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const guardarMinimo = async (p) => {
    const nuevoMin = Number(editandoMin[p.id]);
    if (!nuevoMin || nuevoMin < 0) return;
    setGuardando(prev => ({ ...prev, [p.id]: true }));
    try {
      await apiProductos.actualizar(p.id, { ...p, stockMinimo: nuevoMin });
      setEditandoMin(prev => { const n = { ...prev }; delete n[p.id]; return n; });
      cargar();
    } catch (e) { toast.error('Error: ' + e.message); }
    finally { setGuardando(prev => ({ ...prev, [p.id]: false })); }
  };

  const totalPedido = Object.values(cantidades).reduce((a, b) => a + (Number(b) || 0), 0);

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader
        title="Lista de Compras"
        subtitle={`${productos.length} productos por reponer · ${agotados} agotados · ${criticos} críticos`}
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            <Btn icon={RefreshCw} variant="secondary" onClick={cargar}>Actualizar</Btn>
            <Btn icon={Download} variant="secondary" onClick={() => exportarListaExcel(filtrados, cantidades)}>
              Exportar Excel
            </Btn>
          </div>
        }
      />

      {/* Resumen */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total por reponer', value: productos.length, color: '#d97706', bg: 'rgba(217,119,6,.08)' },
          { label: 'Agotados', value: agotados, color: '#dc2626', bg: 'rgba(220,38,38,.08)' },
          { label: 'Críticos', value: criticos, color: '#ea580c', bg: 'rgba(234,88,12,.08)' },
          { label: 'Unidades a pedir', value: totalPedido || '—', color: '#2563eb', bg: 'rgba(37,99,235,.08)' },
        ].map(s => (
          <div key={s.label} className="tarjeta" style={{ padding: '14px 16px', background: s.bg, border: `1px solid ${s.color}22` }}>
            <p style={{ fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: s.color, marginBottom: 6 }}>{s.label}</p>
            <p style={{ fontSize: '1.75rem', fontWeight: 800, color: s.color, lineHeight: 1 }}>{s.value}</p>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative', maxWidth: 400 }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gris-400)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={buscarTexto}
          onChange={e => setBuscarTexto(e.target.value)}
          placeholder="Buscar producto o código..."
          className="campo"
          style={{ paddingLeft: 32, fontSize: '0.8125rem', width: '100%' }}
        />
      </div>

      {/* Filtros por categoría */}
      {categorias.length > 1 && (
        <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
          <button
            onClick={() => setCategoriaFiltro('')}
            className={!categoriaFiltro ? 'filtro-tab filtro-tab-activo' : 'filtro-tab'}
          >
            Todas ({productos.length})
          </button>
          {categorias.map(c => (
            <button
              key={c}
              onClick={() => setCategoriaFiltro(c === categoriaFiltro ? '' : c)}
              className={categoriaFiltro === c ? 'filtro-tab filtro-tab-activo' : 'filtro-tab'}
            >
              {c} ({productos.filter(p => p.categoria === c).length})
            </button>
          ))}
        </div>
      )}

      {/* Tabla */}
      <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
        {cargando ? (
          <PageLoader />
        ) : filtrados.length === 0 ? (
          <EmptyState
            icon={CheckCircle2}
            title="¡Inventario en orden!"
            description="Todos los productos están por encima del stock mínimo"
          />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-gris-50)', borderBottom: '2px solid var(--color-gris-200)' }}>
                  {['Estado', 'Código', 'Producto', 'Categoría', 'Stock actual', 'Mínimo', 'Faltante', 'Cant. a pedir', 'Pedido'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--color-gris-600)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtrados.map((p, i) => {
                  const urg = nivelUrgencia(p);
                  const isPedido = pedidos.has(p.id);
                  const editMin = editandoMin[p.id] !== undefined;
                  return (
                    <tr
                      key={p.id}
                      style={{
                        borderBottom: i < filtrados.length - 1 ? '1px solid var(--color-gris-100)' : 'none',
                        background: isPedido ? 'rgba(5,150,105,.04)' : 'transparent',
                        opacity: isPedido ? 0.7 : 1,
                      }}
                    >
                      {/* Estado */}
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{
                          display: 'inline-flex', alignItems: 'center', gap: 4,
                          padding: '3px 8px', borderRadius: 99, fontSize: '0.7rem', fontWeight: 700,
                          background: urg.bg, color: urg.color,
                        }}>
                          <AlertTriangle size={9} />
                          {urg.label}
                        </span>
                      </td>
                      {/* Código */}
                      <td style={{ padding: '10px 14px' }}>
                        <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem', background: 'var(--color-gris-100)', padding: '2px 6px', borderRadius: 4, color: 'var(--color-gris-700)' }}>
                          {p.codigo || '—'}
                        </span>
                      </td>
                      {/* Nombre */}
                      <td style={{ padding: '10px 14px', maxWidth: 280 }}>
                        <p style={{ fontWeight: 600, color: 'var(--color-gris-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</p>
                      </td>
                      {/* Categoría */}
                      <td style={{ padding: '10px 14px' }}>
                        <Badge variant={catColors[p.categoria] || 'default'}>{p.categoria}</Badge>
                      </td>
                      {/* Stock actual */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, color: urg.color, fontSize: '1rem' }}>{p.stock}</span>
                      </td>
                      {/* Mínimo (editable) */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        {editMin ? (
                          <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
                            <input
                              type="number"
                              min="1"
                              value={editandoMin[p.id]}
                              onChange={e => setEditandoMin(prev => ({ ...prev, [p.id]: e.target.value }))}
                              className="campo"
                              style={{ width: 60, textAlign: 'center', padding: '3px 6px', fontSize: '0.8125rem' }}
                              autoFocus
                            />
                            <button
                              onClick={() => guardarMinimo(p)}
                              disabled={guardando[p.id]}
                              style={{ background: '#059669', color: '#fff', border: 'none', borderRadius: 5, padding: '3px 7px', cursor: 'pointer', fontSize: '0.75rem', fontWeight: 600 }}
                            >
                              {guardando[p.id] ? '...' : 'OK'}
                            </button>
                            <button
                              onClick={() => setEditandoMin(prev => { const n = { ...prev }; delete n[p.id]; return n; })}
                              style={{ background: 'var(--color-gris-200)', border: 'none', borderRadius: 5, padding: '3px 7px', cursor: 'pointer', fontSize: '0.75rem' }}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <span
                            onClick={() => setEditandoMin(prev => ({ ...prev, [p.id]: p.stockMinimo }))}
                            title="Clic para editar mínimo"
                            style={{ cursor: 'pointer', fontWeight: 600, color: 'var(--color-gris-600)', borderBottom: '1px dashed var(--color-gris-400)' }}
                          >
                            {p.stockMinimo}
                          </span>
                        )}
                      </td>
                      {/* Faltante */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, color: '#dc2626' }}>
                          +{Math.max(0, p.stockMinimo - p.stock)}
                        </span>
                      </td>
                      {/* Cantidad a pedir */}
                      <td style={{ padding: '10px 14px' }}>
                        <input
                          type="number"
                          min="0"
                          value={cantidades[p.id] ?? ''}
                          onChange={e => setCant(p.id, e.target.value)}
                          placeholder={Math.max(0, p.stockMinimo - p.stock)}
                          className="campo"
                          style={{ width: 80, textAlign: 'center', padding: '5px 8px', fontSize: '0.8125rem' }}
                          disabled={isPedido}
                        />
                      </td>
                      {/* Marcar pedido */}
                      <td style={{ padding: '10px 14px', textAlign: 'center' }}>
                        <button
                          onClick={() => togglePedido(p.id)}
                          title={isPedido ? 'Marcar como pendiente' : 'Marcar como pedido'}
                          style={{
                            background: isPedido ? 'rgba(5,150,105,.1)' : 'var(--color-gris-100)',
                            border: `1px solid ${isPedido ? '#059669' : 'var(--color-gris-300)'}`,
                            color: isPedido ? '#059669' : 'var(--color-gris-500)',
                            borderRadius: 7, padding: '5px 10px', cursor: 'pointer',
                            fontSize: '0.75rem', fontWeight: 600,
                            display: 'flex', alignItems: 'center', gap: 4,
                          }}
                        >
                          <CheckCircle2 size={12} />
                          {isPedido ? 'Pedido' : 'Pedir'}
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {totalPedido > 0 && (
        <div style={{
          padding: '12px 16px', borderRadius: 10,
          background: 'rgba(37,99,235,.06)', border: '1px solid rgba(37,99,235,.2)',
          display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10,
        }}>
          <p style={{ fontSize: '0.875rem', color: '#1e40af', fontWeight: 600 }}>
            Lista de compra: <strong>{totalPedido} unidades</strong> de{' '}
            <strong>{Object.values(cantidades).filter(v => v > 0).length} productos</strong>
          </p>
          <Btn icon={Download} onClick={() => exportarListaExcel(filtrados, cantidades)} style={{ fontSize: '0.8125rem' }}>
            Descargar lista
          </Btn>
        </div>
      )}
    </div>
  );
}
