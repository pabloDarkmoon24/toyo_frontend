import { useEffect, useState, useMemo } from 'react';
import writeXlsxFile from 'write-excel-file/browser';
import { productos as api } from '../api';
import {
  ClipboardCheck, CheckCircle2, AlertTriangle, RefreshCw,
  Save, Filter, Download, Square, CheckSquare, Search,
} from 'lucide-react';
import { PageLoader, EmptyState, SectionHeader, Btn, Badge } from '../components/UI';
import { toast } from '../utils/toast';
import { confirmar } from '../utils/confirmar';

const CATEGORIAS = ['rines', 'llantas', 'accesorios', 'rines restaurados', 'repuestos', 'pintura', 'herramientas', 'lubricantes', 'otros'];

const catColors = {
  rines: 'default', llantas: 'info', accesorios: 'success',
  'rines restaurados': 'purple', repuestos: 'default',
  pintura: 'purple', herramientas: 'warning', lubricantes: 'danger', otros: 'default',
};

function difColor(dif) {
  if (dif === 0) return { color: '#059669', bg: 'rgba(5,150,105,.1)' };
  if (dif > 0)  return { color: '#2563eb', bg: 'rgba(37,99,235,.1)' };
  return { color: '#dc2626', bg: 'rgba(220,38,38,.1)' };
}

async function descargarExcel(todos, conteos) {
  const headers = ['Código','Nombre','Categoría','Stock Sistema','Conteo Físico','Diferencia','Estado'];
  const data = [
    headers.map(h => ({ value: h, fontWeight: 'bold' })),
    ...todos.map(p => {
      const val = conteos[p.id];
      const conteoNum = (val !== '' && val !== undefined) ? Number(val) : null;
      const dif = conteoNum !== null ? conteoNum - p.stock : null;
      const estado = conteoNum === null ? '' : dif === 0 ? 'OK' : dif > 0 ? 'Sobrante' : 'Faltante';
      return [
        { value: p.codigo || '' },
        { value: p.nombre },
        { value: p.categoria },
        { value: p.stock, type: Number },
        { value: conteoNum !== null ? conteoNum : '' },
        { value: dif !== null ? dif : '' },
        { value: estado },
      ];
    }),
  ];
  await writeXlsxFile(data, {
    columns: [{ width: 12 },{ width: 40 },{ width: 18 },{ width: 14 },{ width: 14 },{ width: 12 },{ width: 12 }],
    fileName: `conteo_fisico_${new Date().toISOString().split('T')[0]}.xlsx`,
    sheet: 'Conteo Físico',
  });
}

export default function ConteoFisico() {
  const [todos, setTodos] = useState([]);
  const [conteos, setConteos] = useState({});
  const [contado, setContado] = useState(new Set());
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [cargando, setCargando] = useState(true);
  const [aplicando, setAplicando] = useState(false);
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [soloConDif, setSoloConDif] = useState(false);
  const [finalizado, setFinalizado] = useState(false);
  const [buscarTexto, setBuscarTexto] = useState('');

  const cargar = () => {
    setCargando(true);
    api.listar({}).then(r => setTodos(r.data)).finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const lista = todos.filter(p => {
    if (categoriaFiltro && p.categoria !== categoriaFiltro) return false;
    if (buscarTexto) {
      const q = buscarTexto.toLowerCase();
      if (!p.nombre.toLowerCase().includes(q) && !(p.codigo || '').toLowerCase().includes(q)) return false;
    }
    if (soloConDif && contado.has(p.id)) {
      const dif = (conteos[p.id] ?? p.stock) - p.stock;
      if (dif === 0) return false;
    }
    return true;
  });

  const setConteo = (id, val) => {
    const num = val === '' ? '' : Math.max(0, Number(val));
    setConteos(prev => ({ ...prev, [id]: num }));
    setContado(prev => {
      const s = new Set(prev);
      num !== '' ? s.add(id) : s.delete(id);
      return s;
    });
    // Auto-marcar en seleccionados si hay diferencia, auto-desmarcar si no hay
    setSeleccionados(prev => {
      const s = new Set(prev);
      const p = todos.find(x => x.id === id);
      if (num !== '' && p && Number(num) !== p.stock) {
        s.add(id);
      } else {
        s.delete(id);
      }
      return s;
    });
  };

  // Items con diferencia (todos los contados que difieren)
  const conDiferencia = useMemo(() =>
    [...contado].filter(id => {
      const p = todos.find(x => x.id === id);
      return p && conteos[id] !== '' && Number(conteos[id]) !== p.stock;
    }),
    [contado, conteos, todos]
  );

  // Items seleccionados que tienen diferencia
  const paraAplicar = conDiferencia.filter(id => seleccionados.has(id));

  const sobrantes = conDiferencia.filter(id => Number(conteos[id]) > (todos.find(x => x.id === id)?.stock || 0)).length;
  const faltantes = conDiferencia.filter(id => Number(conteos[id]) < (todos.find(x => x.id === id)?.stock || 0)).length;

  const toggleSeleccion = (id) => {
    setSeleccionados(prev => {
      const s = new Set(prev);
      s.has(id) ? s.delete(id) : s.add(id);
      return s;
    });
  };

  const toggleTodos = () => {
    if (paraAplicar.length === conDiferencia.length) {
      // Desmarcar todos
      setSeleccionados(new Set());
    } else {
      // Marcar todos con diferencia
      setSeleccionados(new Set(conDiferencia));
    }
  };

  const aplicarAjustes = async () => {
    if (paraAplicar.length === 0) return;
    if (!await confirmar(
      `Se actualizarán ${paraAplicar.length} producto(s) en el inventario. Cada cambio quedará registrado en el historial.`,
      '¿Aplicar ajustes de conteo físico?'
    )) return;

    setAplicando(true);
    try {
      const ajustes = paraAplicar.map(id => {
        const p = todos.find(x => x.id === id);
        return {
          id,
          nuevoStock: Number(conteos[id]),
          stockAnterior: p.stock,
          nombre: p.nombre,
          codigo: p.codigo,
        };
      });
      await api.ajusteMasivoConteo(ajustes);
      setFinalizado(true);
      toast.success(`${paraAplicar.length} ajuste(s) aplicados al inventario`);
      cargar();
    } catch (e) {
      toast.error('Error al aplicar ajustes: ' + e.message);
    } finally {
      setAplicando(false);
    }
  };

  const reiniciar = () => {
    setConteos({});
    setContado(new Set());
    setSeleccionados(new Set());
    setFinalizado(false);
    cargar();
  };

  if (cargando) return <PageLoader />;

  const todosMarcados = conDiferencia.length > 0 && paraAplicar.length === conDiferencia.length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader
        title="Conteo Físico"
        subtitle={`${todos.length} productos · ${contado.size} contados · ${conDiferencia.length} con diferencias`}
        action={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn icon={RefreshCw} variant="secondary" onClick={reiniciar}>
              Reiniciar
            </Btn>
            <Btn
              icon={Download}
              variant="secondary"
              onClick={() => descargarExcel(todos, conteos, contado)}
            >
              Descargar formato
            </Btn>
            {paraAplicar.length > 0 && (
              <Btn icon={Save} onClick={aplicarAjustes} disabled={aplicando}>
                {aplicando ? 'Aplicando...' : `Aplicar ${paraAplicar.length} ajuste(s)`}
              </Btn>
            )}
          </div>
        }
      />

      {finalizado && (
        <div style={{
          padding: '14px 18px', borderRadius: 10, background: 'rgba(5,150,105,.08)',
          border: '1px solid rgba(5,150,105,.25)', display: 'flex', gap: 10,
          alignItems: 'center', fontSize: '0.875rem', color: '#065f46', fontWeight: 600,
        }}>
          <CheckCircle2 size={18} color="#059669" />
          ¡Conteo aplicado! El inventario fue actualizado y los cambios quedaron en el historial.
        </div>
      )}

      {/* Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 12 }}>
        {[
          { label: 'Total productos', valor: todos.length, color: 'var(--color-gris-700)', bg: 'var(--color-gris-50)' },
          { label: 'Contados', valor: contado.size, color: '#2563eb', bg: 'rgba(37,99,235,.08)' },
          { label: 'Sin diferencia', valor: contado.size - conDiferencia.length, color: '#059669', bg: 'rgba(5,150,105,.08)' },
          { label: 'Sobrantes', valor: sobrantes, color: '#2563eb', bg: 'rgba(37,99,235,.08)' },
          { label: 'Faltantes', valor: faltantes, color: '#dc2626', bg: 'rgba(220,38,38,.08)' },
        ].map(s => (
          <div key={s.label} className="tarjeta" style={{ padding: '12px 14px', background: s.bg }}>
            <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: s.color, marginBottom: 4 }}>{s.label}</p>
            <p style={{ fontSize: '1.5rem', fontWeight: 900, color: s.color, lineHeight: 1 }}>{s.valor}</p>
          </div>
        ))}
      </div>

      {/* Buscador */}
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gris-400)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={buscarTexto}
          onChange={e => setBuscarTexto(e.target.value)}
          placeholder="Buscar producto o código..."
          className="campo"
          style={{ paddingLeft: 32, fontSize: '0.8125rem', width: '100%', maxWidth: 360 }}
        />
      </div>

      {/* Filtros */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap', alignItems: 'center' }}>
        <Filter size={13} style={{ color: 'var(--color-gris-400)' }} />
        <button onClick={() => setCategoriaFiltro('')} className={!categoriaFiltro ? 'filtro-tab filtro-tab-activo' : 'filtro-tab'}>
          Todas
        </button>
        {CATEGORIAS.map(c => (
          <button key={c} onClick={() => setCategoriaFiltro(c === categoriaFiltro ? '' : c)} className={categoriaFiltro === c ? 'filtro-tab filtro-tab-activo' : 'filtro-tab'}>
            {c}
          </button>
        ))}
        <button
          onClick={() => setSoloConDif(!soloConDif)}
          className={soloConDif ? 'filtro-tab filtro-tab-activo' : 'filtro-tab'}
          style={{ marginLeft: 'auto' }}
        >
          Solo con diferencias
        </button>
      </div>

      {/* Instrucción */}
      <div style={{ padding: '10px 14px', borderRadius: 8, background: 'var(--color-gris-50)', border: '1px solid var(--color-gris-200)', fontSize: '0.8125rem', color: 'var(--color-gris-600)' }}>
        Ingresa el <strong>conteo físico real</strong> de cada producto. Los que tengan diferencia aparecerán marcados automáticamente — desmarca los que quieras omitir. Al aplicar, cada cambio se guarda en el historial.
      </div>

      {/* Panel de diferencias con checkboxes — solo si hay diferencias */}
      {conDiferencia.length > 0 && (
        <div style={{
          padding: '14px 18px', borderRadius: 10,
          background: 'rgba(220,38,38,.04)', border: '1px solid rgba(220,38,38,.18)',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: 10, marginBottom: 12 }}>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <AlertTriangle size={16} color="#dc2626" />
              <p style={{ fontSize: '0.875rem', fontWeight: 600, color: '#991b1b' }}>
                {conDiferencia.length} diferencia(s): {faltantes} faltante(s), {sobrantes} sobrante(s)
              </p>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button
                onClick={toggleTodos}
                style={{
                  display: 'flex', alignItems: 'center', gap: 5,
                  fontSize: '0.8rem', fontWeight: 600, color: '#374151',
                  background: 'white', border: '1px solid #d1d5db',
                  borderRadius: 7, padding: '5px 12px', cursor: 'pointer',
                }}
              >
                {todosMarcados ? <CheckSquare size={14} /> : <Square size={14} />}
                {todosMarcados ? 'Desmarcar todos' : 'Marcar todos'}
              </button>
              <Btn icon={Save} onClick={aplicarAjustes} disabled={aplicando || paraAplicar.length === 0}>
                {aplicando ? 'Aplicando...' : `Aplicar ${paraAplicar.length} seleccionado(s)`}
              </Btn>
            </div>
          </div>

          {/* Lista compacta de diferencias con checkbox */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
            {conDiferencia.map(id => {
              const p = todos.find(x => x.id === id);
              if (!p) return null;
              const nuevoStock = Number(conteos[id]);
              const dif = nuevoStock - p.stock;
              const dc = difColor(dif);
              const marcado = seleccionados.has(id);
              return (
                <label
                  key={id}
                  style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    background: marcado ? 'white' : 'rgba(255,255,255,.4)',
                    border: `1px solid ${marcado ? '#e5e7eb' : 'transparent'}`,
                    borderRadius: 8, padding: '8px 12px', cursor: 'pointer',
                    opacity: marcado ? 1 : 0.55, transition: 'all 0.15s',
                  }}
                >
                  <input
                    type="checkbox"
                    checked={marcado}
                    onChange={() => toggleSeleccion(id)}
                    style={{ width: 15, height: 15, cursor: 'pointer', accentColor: '#dc2626' }}
                  />
                  <span style={{ flex: 1, fontSize: '0.8125rem', fontWeight: 600, color: '#1f2937', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                    {p.nombre}
                  </span>
                  {p.codigo && (
                    <span style={{ fontFamily: 'monospace', fontSize: '0.7rem', background: '#f3f4f6', padding: '1px 6px', borderRadius: 4, color: '#6b7280', flexShrink: 0 }}>
                      {p.codigo}
                    </span>
                  )}
                  <span style={{ fontSize: '0.8125rem', color: '#6b7280', flexShrink: 0 }}>
                    {p.stock} →
                  </span>
                  <span style={{ fontWeight: 800, fontSize: '0.9rem', color: dc.color, flexShrink: 0 }}>
                    {nuevoStock}
                  </span>
                  <span style={{
                    padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
                    background: dc.bg, color: dc.color, flexShrink: 0,
                  }}>
                    {dif > 0 ? `+${dif}` : dif}
                  </span>
                </label>
              );
            })}
          </div>
        </div>
      )}

      {/* Tabla */}
      <div className="tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
        {lista.length === 0 ? (
          <EmptyState icon={ClipboardCheck} title="Sin productos" description="Cambia los filtros para ver productos" />
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-gris-50)', borderBottom: '2px solid var(--color-gris-200)' }}>
                  {['Código', 'Producto', 'Categoría', 'Stock sistema', 'Conteo físico', 'Diferencia'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--color-gris-600)', fontSize: '0.72rem', textTransform: 'uppercase', letterSpacing: '0.05em', whiteSpace: 'nowrap' }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {lista.map((p, i) => {
                  const val = conteos[p.id];
                  const conteoNum = val !== '' && val !== undefined ? Number(val) : null;
                  const dif = conteoNum !== null ? conteoNum - p.stock : null;
                  const dc = dif !== null ? difColor(dif) : null;
                  const fueContado = contado.has(p.id);
                  return (
                    <tr key={p.id} style={{
                      borderBottom: i < lista.length - 1 ? '1px solid var(--color-gris-100)' : 'none',
                      background: fueContado && dif !== 0 && dif !== null
                        ? (dif > 0 ? 'rgba(37,99,235,.03)' : 'rgba(220,38,38,.03)')
                        : 'transparent',
                    }}>
                      <td style={{ padding: '9px 14px' }}>
                        <span style={{ fontFamily: 'monospace', fontSize: '0.72rem', background: 'var(--color-gris-100)', padding: '2px 6px', borderRadius: 4, fontWeight: 700, color: 'var(--color-gris-700)' }}>
                          {p.codigo || '—'}
                        </span>
                      </td>
                      <td style={{ padding: '9px 14px', maxWidth: 260 }}>
                        <p style={{ fontWeight: 600, color: 'var(--color-gris-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</p>
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <Badge variant={catColors[p.categoria] || 'default'}>{p.categoria}</Badge>
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                        <span style={{ fontWeight: 700, fontSize: '1rem', color: p.stock === 0 ? '#dc2626' : 'var(--color-gris-700)' }}>{p.stock}</span>
                      </td>
                      <td style={{ padding: '9px 14px' }}>
                        <input
                          type="number"
                          min="0"
                          value={val ?? ''}
                          onChange={e => setConteo(p.id, e.target.value)}
                          placeholder="—"
                          className="campo"
                          style={{
                            width: 90, textAlign: 'center', padding: '6px 8px', fontSize: '0.875rem',
                            borderColor: fueContado && dif !== 0 ? (dif > 0 ? 'rgba(37,99,235,.4)' : 'rgba(220,38,38,.4)') : undefined,
                            fontWeight: fueContado ? 700 : 400,
                          }}
                        />
                      </td>
                      <td style={{ padding: '9px 14px', textAlign: 'center' }}>
                        {dif !== null ? (
                          <span style={{
                            display: 'inline-flex', alignItems: 'center', gap: 3,
                            padding: '3px 10px', borderRadius: 99, fontSize: '0.78rem', fontWeight: 700,
                            background: dc.bg, color: dc.color,
                          }}>
                            {dif === 0 ? '✓' : dif > 0 ? `+${dif}` : dif}
                          </span>
                        ) : (
                          <span style={{ color: 'var(--color-gris-300)', fontSize: '0.8125rem' }}>—</span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
