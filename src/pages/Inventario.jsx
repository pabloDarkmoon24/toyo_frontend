import { useEffect, useState, useRef, useCallback } from 'react';
import writeXlsxFile from 'write-excel-file/browser';
import readXlsxFile from 'read-excel-file/browser';
import { productos as api } from '../api';
import { Plus, Search, Package, AlertTriangle, Pencil, Trash2, ArrowUpDown, Filter, Download, Tag, Upload, FileSpreadsheet, FolderCog, Clock } from 'lucide-react';
import { Modal, ModalFooter, Btn, Input, Select, Textarea, Badge, PageLoader, EmptyState, SectionHeader, Table, Td, ActionMenu, IconBtn } from '../components/UI';
import { toast } from '../utils/toast';
import { confirmar } from '../utils/confirmar';
import ImagenUploader from '../components/ImagenUploader';
import { useAuth } from '../context/AuthContext';

const CATEGORIAS_DEFAULT = ['rines', 'llantas', 'accesorios', 'rines restaurados', 'repuestos', 'pintura', 'herramientas', 'lubricantes', 'servicios', 'otros'];

const productoVacio = {
  nombre: '', categoria: 'repuestos', descripcion: '',
  precio: '', costo: '', stock: '', stockMinimo: '5', unidad: 'unidad', imagenUrl: '',
  condicion: 'nuevo',
};

const categoriaColors = {
  llantas:            'info',
  repuestos:          'default',
  pintura:            'purple',
  accesorios:         'success',
  herramientas:       'warning',
  lubricantes:        'danger',
  rines:              'default',
  'rines restaurados':'purple',
  otros:              'default',
};

// ── Plantilla Excel ──────────────────────────────────────────────────────────
async function descargarPlantilla() {
  const data = [
    ['Nombre','Categoría','Precio de Venta','Precio de Compra (Costo)','Stock Inicial','Stock Mínimo','Unidad','Condición','Descripción']
      .map(h => ({ value: h, fontWeight: 'bold' })),
    [{ value: 'EJEMPLO: Llanta Pirelli 205/55R16' },{ value: 'llantas' },{ value: 150, type: Number },{ value: 110, type: Number },{ value: 4, type: Number },{ value: 1, type: Number },{ value: 'unidad' },{ value: 'nuevo' },{ value: 'Descripción opcional' }],
    [{ value: 'EJEMPLO: Rin Vossen 17 Negro' },{ value: 'rines' },{ value: 85, type: Number },{ value: 60, type: Number },{ value: 8, type: Number },{ value: 1, type: Number },{ value: 'unidad' },{ value: 'usado' },{ value: '' }],
  ];
  await writeXlsxFile(data, {
    columns: [{ width: 40 },{ width: 20 },{ width: 18 },{ width: 24 },{ width: 14 },{ width: 14 },{ width: 10 },{ width: 12 },{ width: 30 }],
    fileName: 'plantilla_productos_toyo.xlsx',
    sheet: 'Productos',
  });
}

// ── Prefijos por categoría ───────────────────────────────────────────────────
const PREFIJOS_CAT = {
  llantas:             'LLAN',
  rines:               'RIN',
  'rines restaurados': 'RRES',
  accesorios:          'ACC',
  repuestos:           'REP',
  pintura:             'PINT',
  herramientas:        'HERR',
  lubricantes:         'LUB',
  servicios:           'SER',
  otros:               'OTR',
};

function prefijoDeCat(cat) {
  const key = cat.toLowerCase().trim();
  if (PREFIJOS_CAT[key]) return PREFIJOS_CAT[key];
  // Para categorías personalizadas: primeras 4 letras en mayúsculas sin espacios
  return key.replace(/\s+/g, '').slice(0, 4).toUpperCase() || 'PROD';
}

function generarCodigos(productos) {
  const contadores = {};
  return productos.map(p => {
    const prefijo = prefijoDeCat(p.categoria);
    contadores[prefijo] = (contadores[prefijo] || 0) + 1;
    const codigo = `${prefijo}-${String(contadores[prefijo]).padStart(3, '0')}`;
    return { ...p, codigo };
  });
}

// ── Leer Excel importado ─────────────────────────────────────────────────────
async function leerExcelProductos(file) {
  const rows = await readXlsxFile(file);
  const productos = rows.slice(1)
    .filter(r => r[0] && !String(r[0]).startsWith('EJEMPLO'))
    .map(r => ({
      nombre:      String(r[0] || '').trim(),
      categoria:   String(r[1] || 'otros').toLowerCase().trim(),
      precio:      Number(r[2]) || 0,
      costo:       r[3] != null ? Number(r[3]) : null,
      stock:       Number(r[4]) || 0,
      stockMinimo: Number(r[5]) || 1,
      unidad:      String(r[6] || 'unidad').trim(),
      condicion:   ['nuevo','usado'].includes(String(r[7] || '').toLowerCase().trim()) ? String(r[7]).toLowerCase().trim() : 'nuevo',
      descripcion: String(r[8] || '').trim() || null,
    }))
    .filter(p => p.nombre.length >= 2);
  return generarCodigos(productos);
}

// ── Modal Importar ───────────────────────────────────────────────────────────
const LOTE = 50;

function BarraProgreso({ procesados, total }) {
  const pct = total > 0 ? Math.round((procesados / total) * 100) : 0;
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8125rem', fontWeight: 600 }}>
        <span style={{ color: 'var(--color-gris-700)' }}>Importando productos...</span>
        <span style={{ color: 'var(--color-toyo)' }}>{procesados} / {total}</span>
      </div>
      <div style={{ height: 10, borderRadius: 99, background: 'var(--color-gris-200)', overflow: 'hidden' }}>
        <div style={{
          height: '100%', borderRadius: 99,
          background: 'linear-gradient(90deg, var(--color-toyo) 0%, #f97316 100%)',
          width: `${pct}%`,
          transition: 'width 0.3s ease',
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: 'var(--color-gris-500)' }}>
        <span>{pct}% completado</span>
        <span>Lote {Math.ceil(procesados / LOTE)} de {Math.ceil(total / LOTE)}</span>
      </div>
    </div>
  );
}

function ModalImportar({ onClose, onImportado }) {
  const inputRef = useRef();
  const [preview, setPreview] = useState(null);
  const [importando, setImportando] = useState(false);
  const [progreso, setProgreso] = useState({ procesados: 0, total: 0 });
  const [resultado, setResultado] = useState(null);

  const handleFile = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    try {
      const productos = await leerExcelProductos(file);
      setPreview(productos);
    } catch { toast.error('Error al leer el archivo. Usa la plantilla oficial.'); }
  };

  const importar = async () => {
    if (!preview?.length) return;
    setImportando(true);
    setProgreso({ procesados: 0, total: preview.length });

    let totalInsertados = 0;
    let totalOmitidosDetalle = [];
    let totalErrores = [];

    try {
      for (let i = 0; i < preview.length; i += LOTE) {
        const lote = preview.slice(i, i + LOTE);
        let r;
        try {
          r = await api.importarMasivo(lote, 'omitir');
        } catch (eLote) {
          // Si un lote falla, registra todos sus productos como error y continúa
          const msg = eLote.response?.data?.error || eLote.message || 'Error de servidor';
          lote.forEach(p => totalErrores.push({ nombre: p.nombre, error: `Error de servidor: ${msg}` }));
          setProgreso({ procesados: Math.min(i + LOTE, preview.length), total: preview.length });
          continue;
        }
        totalInsertados += r.data.insertados || 0;
        totalOmitidosDetalle = [...totalOmitidosDetalle, ...(r.data.omitidosDetalle || [])];
        totalErrores = [...totalErrores, ...(r.data.errores || [])];
        setProgreso({ procesados: Math.min(i + LOTE, preview.length), total: preview.length });
      }
      // Siempre muestra el resultado, aunque todo haya fallado
      setResultado({
        total: preview.length,
        insertados: totalInsertados,
        omitidos: totalOmitidosDetalle.length,
        omitidosDetalle: totalOmitidosDetalle,
        errores: totalErrores,
      });
      if (totalInsertados > 0) onImportado();
    } catch (e) {
      // Error catastrófico (ej: sin conexión al servidor)
      setResultado({
        total: preview.length,
        insertados: 0,
        omitidos: 0,
        omitidosDetalle: [],
        errores: [{ nombre: 'Error general', error: e.response?.data?.error || e.message || 'No se pudo conectar al servidor' }],
      });
    } finally { setImportando(false); }
  };

  return (
    <Modal titulo="Importar Productos desde Excel — v1.0.4" onClose={importando ? undefined : onClose} size="lg">
      {!resultado ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Info precios */}
          <div style={{ padding: '12px 14px', borderRadius: 8, background: 'rgba(37,99,235,.06)', border: '1px solid rgba(37,99,235,.2)', fontSize: '0.8125rem', color: '#1e40af', lineHeight: 1.6 }}>
            <strong>Precios:</strong> La columna <em>"Precio de Venta"</em> es lo que cobra al cliente en la factura.
            La columna <em>"Precio de Compra"</em> es lo que pagó al proveedor (queda oculto al cliente).
          </div>

          <div style={{ display: 'flex', gap: 10 }}>
            <Btn icon={FileSpreadsheet} variant="secondary" onClick={descargarPlantilla} style={{ flex: 1 }} disabled={importando}>
              Descargar plantilla
            </Btn>
            <Btn icon={Upload} onClick={() => inputRef.current.click()} style={{ flex: 1 }} disabled={importando}>
              Seleccionar Excel
            </Btn>
            <input ref={inputRef} type="file" accept=".xlsx,.xls" onChange={handleFile} style={{ display: 'none' }} />
          </div>

          {/* Barra de progreso */}
          {importando && (
            <BarraProgreso procesados={progreso.procesados} total={progreso.total} />
          )}

          {preview && !importando && (
            <>
              <div style={{ padding: '10px 14px', borderRadius: 8, background: 'rgba(5,150,105,.08)', border: '1px solid rgba(5,150,105,.2)', fontSize: '0.8125rem', color: '#065f46', fontWeight: 600 }}>
                {preview.length} productos detectados en el archivo — listos para importar
              </div>
              <div style={{ maxHeight: 300, overflowY: 'auto', border: '1px solid var(--color-gris-200)', borderRadius: 8 }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
                  <thead>
                    <tr style={{ background: 'var(--color-gris-50)', position: 'sticky', top: 0 }}>
                      {['#', 'Código', 'Nombre', 'Categoría', 'Condición', 'P. Venta', 'Stock'].map(h => (
                        <th key={h} style={{ padding: '8px 10px', textAlign: 'left', fontWeight: 600, color: 'var(--color-gris-600)', borderBottom: '1px solid var(--color-gris-200)', whiteSpace: 'nowrap' }}>{h}</th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {preview.map((p, i) => (
                      <tr key={i} style={{ borderBottom: '1px solid var(--color-gris-100)' }}>
                        <td style={{ padding: '7px 10px', color: 'var(--color-gris-400)', fontSize: '0.75rem' }}>{i + 1}</td>
                        <td style={{ padding: '7px 10px' }}>
                          <span style={{ fontFamily: 'monospace', fontWeight: 700, fontSize: '0.78rem', background: 'var(--color-gris-100)', padding: '2px 7px', borderRadius: 4, color: 'var(--color-toyo)', whiteSpace: 'nowrap' }}>
                            {p.codigo}
                          </span>
                        </td>
                        <td style={{ padding: '7px 10px', maxWidth: 200, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', fontWeight: 500 }}>{p.nombre}</td>
                        <td style={{ padding: '7px 10px', color: 'var(--color-gris-500)', whiteSpace: 'nowrap' }}>{p.categoria}</td>
                        <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>
                          <span style={{
                            display: 'inline-block', padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 700,
                            background: p.condicion === 'usado' ? 'rgba(217,119,6,.12)' : 'rgba(5,150,105,.1)',
                            color: p.condicion === 'usado' ? '#b45309' : '#047857',
                          }}>
                            {p.condicion === 'usado' ? 'Usado' : 'Nuevo'}
                          </span>
                        </td>
                        <td style={{ padding: '7px 10px', color: '#059669', fontWeight: 600, whiteSpace: 'nowrap' }}>${p.precio}</td>
                        <td style={{ padding: '7px 10px', whiteSpace: 'nowrap' }}>{p.stock}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </>
          )}
        </div>
      ) : (
        <ResultadoImport resultado={resultado} />
      )}
      <ModalFooter>
        <Btn variant="secondary" onClick={onClose} disabled={importando} style={{ flex: 1 }}>
          {resultado ? 'Cerrar' : 'Cancelar'}
        </Btn>
        {!resultado && (
          <Btn onClick={importar} disabled={!preview?.length || importando} style={{ flex: 1 }}>
            {importando ? `Importando lote ${Math.ceil(progreso.procesados / LOTE) + 1} de ${Math.ceil(progreso.total / LOTE)}...` : `Importar ${preview?.length || 0} productos`}
          </Btn>
        )}
      </ModalFooter>
    </Modal>
  );
}

// ── Resultado detallado de importación ──────────────────────────────────────
function ResultadoImport({ resultado }) {
  const omitidos = resultado.omitidosDetalle || [];
  const errores  = resultado.errores || [];
  const noImportados = [
    ...omitidos.map(r => ({ nombre: r.nombre, motivo: r.motivo, tipo: 'repetido' })),
    ...errores.map(r  => ({ nombre: r.nombre, motivo: r.error,  tipo: 'error'    })),
  ];

  const descargar = async () => {
    const data = [
      [{ value: 'Nombre', fontWeight: 'bold' }, { value: 'Motivo', fontWeight: 'bold' }],
      ...noImportados.map(r => [{ value: r.nombre }, { value: r.motivo }]),
    ];
    await writeXlsxFile(data, { columns: [{ width: 50 },{ width: 45 }], fileName: 'no_importados.xlsx', sheet: 'No importados' });
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

      {/* Resumen en texto claro */}
      <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--color-gris-50)', border: '1px solid var(--color-gris-200)', fontSize: '0.9rem', lineHeight: 2 }}>
        <div>De <strong>{resultado.total}</strong> productos en el archivo:</div>
        <div style={{ color: '#059669', fontWeight: 700 }}>✓ {resultado.insertados} importados exitosamente</div>
        {omitidos.length > 0 && <div style={{ color: '#d97706', fontWeight: 700 }}>⚠ {omitidos.length} repetidos (ya existían en inventario)</div>}
        {errores.length  > 0 && <div style={{ color: '#dc2626', fontWeight: 700 }}>✗ {errores.length} con error de datos</div>}
      </div>

      {/* Lista de no importados */}
      {noImportados.length > 0 && (
        <>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-gris-600)' }}>
              Productos no importados ({noImportados.length})
            </span>
            <button onClick={descargar} style={{ display: 'flex', alignItems: 'center', gap: 5, padding: '5px 12px', borderRadius: 7, border: '1.5px solid var(--color-gris-300)', background: 'transparent', cursor: 'pointer', fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-gris-600)' }}>
              <Download size={12} /> Descargar Excel
            </button>
          </div>
          <div style={{ maxHeight: 250, overflowY: 'auto', border: '1px solid var(--color-gris-200)', borderRadius: 8 }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.78rem' }}>
              <thead>
                <tr style={{ background: 'var(--color-gris-50)', position: 'sticky', top: 0 }}>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-gris-600)', borderBottom: '1px solid var(--color-gris-200)', width: '50%' }}>Nombre</th>
                  <th style={{ padding: '8px 12px', textAlign: 'left', fontWeight: 600, color: 'var(--color-gris-600)', borderBottom: '1px solid var(--color-gris-200)' }}>Motivo</th>
                </tr>
              </thead>
              <tbody>
                {noImportados.map((r, i) => (
                  <tr key={i} style={{ borderBottom: '1px solid var(--color-gris-100)' }}>
                    <td style={{ padding: '7px 12px', fontWeight: 500, color: 'var(--color-gris-800)' }}>{r.nombre}</td>
                    <td style={{ padding: '7px 12px', color: r.tipo === 'error' ? '#dc2626' : '#d97706' }}>{r.motivo}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  );
}

// ── Exportar Excel ───────────────────────────────────────────────────────────
async function exportarExcel(lista) {
  const filas = lista.map(p => ({
    'Código':      p.codigo || '',
    'Nombre':      p.nombre,
    'Categoría':   p.categoria,
    'Precio':      p.precio,
    'Costo':       p.costo || 0,
    'Stock':       p.stock,
    'Stock Mín.':  p.stockMinimo,
    'Unidad':      p.unidad,
    'Descripción': p.descripcion || '',
  }));
  const headers = ['Código','Nombre','Categoría','Precio','Costo','Stock','Stock Mín.','Unidad','Descripción'];
  const xlsData = [
    headers.map(h => ({ value: h, fontWeight: 'bold' })),
    ...filas.map(f => Object.values(f).map(v => ({ value: v }))),
  ];
  await writeXlsxFile(xlsData, {
    columns: [{ width: 10 },{ width: 50 },{ width: 20 },{ width: 12 },{ width: 12 },{ width: 8 },{ width: 10 },{ width: 10 },{ width: 40 }],
    fileName: `inventario_toyo_${new Date().toISOString().slice(0,10)}.xlsx`,
    sheet: 'Inventario',
  });
}

// ── Imprimir stickers ────────────────────────────────────────────────────────
function imprimirStickers(seleccion) {
  // seleccion: [{ producto, cantidad }]
  const items = seleccion.filter(s => s.cantidad > 0);
  if (!items.length) return;

  // Expande: si cantidad=3, genera 3 etiquetas para ese producto
  const etiquetas = [];
  items.forEach(({ producto, cantidad }) => {
    for (let i = 0; i < cantidad; i++) {
      etiquetas.push(producto);
    }
  });

  const html = `<!DOCTYPE html>
<html>
<head>
<meta charset="utf-8">
<title>Stickers TOYO+</title>
<style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body { font-family: 'Arial', sans-serif; background: #fff; }
  .grid {
    display: grid;
    grid-template-columns: repeat(4, 1fr);
    gap: 6px;
    padding: 12px;
  }
  .sticker {
    border: 1.5px dashed #aaa;
    border-radius: 6px;
    padding: 8px 6px;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    min-height: 72px;
    text-align: center;
    page-break-inside: avoid;
  }
  .codigo {
    font-size: 13px;
    font-weight: 900;
    letter-spacing: 1.5px;
    color: #111;
    font-family: 'Courier New', monospace;
    border: 2px solid #111;
    border-radius: 4px;
    padding: 2px 8px;
    display: inline-block;
    margin-bottom: 4px;
  }
  .nombre {
    font-size: 7.5px;
    color: #444;
    line-height: 1.2;
    max-width: 100%;
    overflow: hidden;
    display: -webkit-box;
    -webkit-line-clamp: 2;
    -webkit-box-orient: vertical;
  }
  .categoria {
    font-size: 6.5px;
    color: #888;
    text-transform: uppercase;
    letter-spacing: 0.5px;
    margin-top: 3px;
  }
  @media print {
    body { margin: 0; }
    .grid { padding: 8px; gap: 4px; }
  }
</style>
</head>
<body>
<div class="grid">
${etiquetas.map(p => `
  <div class="sticker">
    <span class="codigo">${p.codigo || p.id}</span>
    <span class="nombre">${p.nombre}</span>
    <span class="categoria">${p.categoria}</span>
  </div>`).join('')}
</div>
<script>window.onload = () => { window.print(); }<\/script>
</body>
</html>`;

  const w = window.open('', '_blank');
  w.document.write(html);
  w.document.close();
}

// ── Modal Stickers ───────────────────────────────────────────────────────────
function ModalStickers({ lista, categorias, onClose }) {
  const [buscar, setBuscar] = useState('');
  const [catFiltro, setCatFiltro] = useState('');
  const [seleccion, setSeleccion] = useState({});

  const filtrados = lista.filter(p => {
    const ok = p.nombre.toLowerCase().includes(buscar.toLowerCase()) ||
               (p.codigo || '').toLowerCase().includes(buscar.toLowerCase());
    return ok && (!catFiltro || p.categoria === catFiltro);
  });

  const setCant = (id, val) => {
    setSeleccion(prev => ({ ...prev, [id]: Math.max(0, Number(val)) }));
  };

  const totalEtiquetas = Object.values(seleccion).reduce((a, b) => a + b, 0);

  const usarStock = () => {
    const nuevo = {};
    filtrados.forEach(p => { if (p.stock > 0) nuevo[p.id] = p.stock; });
    setSeleccion(nuevo);
  };

  const limpiar = () => setSeleccion({});

  const imprimir = () => {
    const items = lista
      .filter(p => seleccion[p.id] > 0)
      .map(p => ({ producto: p, cantidad: seleccion[p.id] }));
    imprimirStickers(items);
  };

  return (
    <Modal titulo="Imprimir Stickers de Códigos" onClose={onClose} size="xl">
      {/* Controles superiores */}
      <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', marginBottom: 12, alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 200 }}>
          <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gris-400)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Buscar código o nombre..."
            value={buscar}
            onChange={e => setBuscar(e.target.value)}
            className="campo"
            style={{ paddingLeft: 32, fontSize: '0.8125rem' }}
          />
        </div>
        <select
          value={catFiltro}
          onChange={e => setCatFiltro(e.target.value)}
          className="campo"
          style={{ fontSize: '0.8125rem', minWidth: 160 }}
        >
          <option value="">Todas las categorías</option>
          {(categorias || []).map(c => <option key={c} value={c}>{c}</option>)}
        </select>
        <Btn variant="secondary" onClick={usarStock} style={{ fontSize: '0.75rem', padding: '7px 14px' }}>
          Usar stock actual
        </Btn>
        <Btn variant="secondary" onClick={limpiar} style={{ fontSize: '0.75rem', padding: '7px 14px' }}>
          Limpiar
        </Btn>
      </div>

      {/* Info */}
      <div style={{
        padding: '8px 14px', borderRadius: 8, marginBottom: 10,
        background: totalEtiquetas > 0 ? 'rgba(37,99,235,.06)' : 'var(--color-gris-50)',
        border: `1px solid ${totalEtiquetas > 0 ? 'rgba(37,99,235,.2)' : 'var(--color-gris-200)'}`,
        fontSize: '0.8125rem', color: totalEtiquetas > 0 ? '#1e40af' : 'var(--color-gris-500)',
      }}>
        {totalEtiquetas > 0
          ? `Se imprimirán ${totalEtiquetas} stickers de ${Object.keys(seleccion).filter(k => seleccion[k] > 0).length} productos.`
          : 'Ingresa la cantidad de stickers que quieres para cada producto, o usa "Usar stock actual".'}
      </div>

      {/* Tabla de productos */}
      <div style={{ maxHeight: 420, overflowY: 'auto', border: '1px solid var(--color-gris-200)', borderRadius: 10 }}>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.8125rem' }}>
          <thead>
            <tr style={{ background: 'var(--color-gris-50)', borderBottom: '1px solid var(--color-gris-200)' }}>
              <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--color-gris-600)', fontSize: '0.75rem' }}>Código</th>
              <th style={{ padding: '9px 14px', textAlign: 'left', fontWeight: 600, color: 'var(--color-gris-600)', fontSize: '0.75rem' }}>Nombre</th>
              <th style={{ padding: '9px 14px', textAlign: 'center', fontWeight: 600, color: 'var(--color-gris-600)', fontSize: '0.75rem' }}>Stock</th>
              <th style={{ padding: '9px 100px 9px 14px', textAlign: 'center', fontWeight: 600, color: 'var(--color-gris-600)', fontSize: '0.75rem' }}>Stickers a imprimir</th>
            </tr>
          </thead>
          <tbody>
            {filtrados.map((p, i) => (
              <tr key={p.id} style={{ borderBottom: i < filtrados.length - 1 ? '1px solid var(--color-gris-100)' : 'none' }}>
                <td style={{ padding: '8px 14px' }}>
                  <span style={{
                    fontFamily: 'monospace', fontWeight: 700, fontSize: '0.75rem',
                    background: 'var(--color-gris-100)', padding: '2px 7px', borderRadius: 4,
                    color: 'var(--color-gris-800)',
                  }}>
                    {p.codigo || '—'}
                  </span>
                </td>
                <td style={{ padding: '8px 14px', color: 'var(--color-gris-800)' }}>
                  <div style={{ fontWeight: 500 }}>{p.nombre}</div>
                  <div style={{ fontSize: '0.7rem', color: 'var(--color-gris-400)', marginTop: 1 }}>{p.categoria}</div>
                </td>
                <td style={{ padding: '8px 14px', textAlign: 'center', color: 'var(--color-gris-500)' }}>
                  {p.stock}
                </td>
                <td style={{ padding: '8px 14px', textAlign: 'center' }}>
                  <input
                    type="number"
                    min="0"
                    value={seleccion[p.id] ?? ''}
                    onChange={e => setCant(p.id, e.target.value)}
                    placeholder="0"
                    className="campo"
                    style={{ width: 80, textAlign: 'center', fontSize: '0.8125rem', padding: '5px 8px' }}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ModalFooter>
        <Btn variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cancelar</Btn>
        <Btn icon={Tag} onClick={imprimir} disabled={totalEtiquetas === 0} style={{ flex: 1 }}>
          Imprimir {totalEtiquetas > 0 ? `${totalEtiquetas} stickers` : 'stickers'}
        </Btn>
      </ModalFooter>
    </Modal>
  );
}

// ── Modal Gestionar Categorías ───────────────────────────────────────────────
function ModalCategorias({ onClose, onActualizado, onCrearCategoria }) {
  const [categorias, setCategorias] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [editando, setEditando] = useState(null); // { nombre, total }
  const [nuevoNombre, setNuevoNombre] = useState('');
  const [guardando, setGuardando] = useState(false);
  const [nuevaCat, setNuevaCat] = useState('');

  useEffect(() => {
    api.categoriasDetalle()
      .then(r => setCategorias(r.data))
      .finally(() => setCargando(false));
  }, []);

  const abrirEditar = (cat) => { setEditando(cat); setNuevoNombre(cat.nombre); };
  const cerrarEditar = () => { setEditando(null); setNuevoNombre(''); };

  const renombrar = async () => {
    if (!nuevoNombre.trim() || nuevoNombre.trim() === editando.nombre) return;
    setGuardando(true);
    try {
      const r = await api.renombrarCategoria(editando.nombre, nuevoNombre.trim());
      toast.success(`${r.data.actualizados} productos actualizados`);
      cerrarEditar();
      onActualizado();
      const res = await api.categoriasDetalle();
      setCategorias(res.data);
    } catch { toast.error('Error al renombrar'); }
    finally { setGuardando(false); }
  };

  const eliminar = async (cat) => {
    if (cat.total > 0) {
      toast.error(`No se puede eliminar: hay ${cat.total} producto${cat.total > 1 ? 's' : ''} en esta categoría. Muévelos primero a otra categoría.`);
      return;
    }
    if (!await confirmar(`¿Eliminar la categoría "${cat.nombre}"?`, '¿Eliminar categoría?')) return;
    // Categoría vacía — solo quitar de la lista local
    setCategorias(prev => prev.filter(c => c.nombre !== cat.nombre));
    toast.success(`Categoría "${cat.nombre}" eliminada`);
    onActualizado();
  };

  const agregarCategoria = () => {
    const nombre = nuevaCat.trim().toLowerCase();
    if (!nombre) return;
    if (categorias.some(c => c.nombre === nombre)) {
      toast.error('Esa categoría ya existe');
      return;
    }
    onCrearCategoria(nombre);
    setCategorias(prev => [...prev, { nombre, total: 0 }]);
    setNuevaCat('');
    toast.success(`Categoría "${nombre}" creada`);
  };

  return (
    <Modal titulo="Gestionar Categorías" onClose={onClose} size="md">
      {cargando ? <PageLoader /> : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
          {/* Nueva categoría */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 4 }}>
            <input
              className="campo"
              value={nuevaCat}
              onChange={e => setNuevaCat(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && agregarCategoria()}
              placeholder="Nueva categoría..."
              style={{ flex: 1, fontSize: '0.875rem' }}
            />
            <Btn onClick={agregarCategoria} disabled={!nuevaCat.trim()} style={{ padding: '6px 16px', fontSize: '0.8125rem' }}>
              Agregar
            </Btn>
          </div>
          <p style={{ fontSize: '0.8125rem', color: 'var(--color-gris-500)', marginBottom: 4 }}>
            Renombra categorías. Solo puedes eliminar categorías que no tengan productos asignados.
          </p>
          {categorias.map(cat => (
            <div key={cat.nombre}>
              {editando?.nombre === cat.nombre ? (
                <div style={{ display: 'flex', gap: 8, alignItems: 'center', padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-toyo)', background: 'rgba(220,38,38,.04)' }}>
                  <input
                    className="campo"
                    value={nuevoNombre}
                    onChange={e => setNuevoNombre(e.target.value)}
                    onKeyDown={e => e.key === 'Enter' && renombrar()}
                    autoFocus
                    style={{ flex: 1, fontSize: '0.875rem' }}
                    list="cats-existentes"
                  />
                  <datalist id="cats-existentes">
                    {categorias.map(c => <option key={c.nombre} value={c.nombre} />)}
                  </datalist>
                  <Btn onClick={renombrar} disabled={guardando} style={{ padding: '6px 14px', fontSize: '0.8125rem' }}>
                    {guardando ? '...' : 'Guardar'}
                  </Btn>
                  <Btn variant="secondary" onClick={cerrarEditar} style={{ padding: '6px 14px', fontSize: '0.8125rem' }}>
                    Cancelar
                  </Btn>
                </div>
              ) : (
                <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 14px', borderRadius: 10, border: '1px solid var(--color-gris-200)', background: 'var(--color-gris-50)' }}>
                  <span style={{ flex: 1, fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-gris-800)', textTransform: 'capitalize' }}>{cat.nombre}</span>
                  <span style={{ fontSize: '0.78rem', color: 'var(--color-gris-400)' }}>{cat.total} producto{cat.total !== 1 ? 's' : ''}</span>
                  <button className="btn-icono btn-icono-ambar" onClick={() => abrirEditar(cat)} title="Renombrar"><Pencil size={13} /></button>
                  <button
                    className={cat.total > 0 ? 'btn-icono' : 'btn-icono btn-icono-rojo'}
                    onClick={() => eliminar(cat)}
                    title={cat.total > 0 ? `No se puede eliminar: tiene ${cat.total} producto${cat.total > 1 ? 's' : ''}` : 'Eliminar categoría'}
                    disabled={guardando}
                    style={cat.total > 0 ? { opacity: 0.3, cursor: 'not-allowed' } : {}}
                  ><Trash2 size={13} /></button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
      <ModalFooter>
        <Btn variant="secondary" onClick={onClose} style={{ flex: 1 }}>Cerrar</Btn>
      </ModalFooter>
    </Modal>
  );
}

// ── Componente principal ─────────────────────────────────────────────────────
export default function Inventario() {
  const { usuario } = useAuth();
  const esAdmin = usuario?.rol === 'admin';
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [buscarInput, setBuscarInput] = useState('');
  const [buscar, setBuscar] = useState('');
  const [categoriaFiltro, setCategoriaFiltro] = useState('');
  const [ordenFiltro, setOrdenFiltro] = useState('');
  const reqIdRef = useRef(0);
  const [modal, setModal] = useState(null);
  const [form, setForm] = useState(productoVacio);
  const [stockForm, setStockForm] = useState({ cantidad: '', tipo: 'entrada' });
  const [productoActual, setProductoActual] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [CATEGORIAS, setCategorias] = useState(CATEGORIAS_DEFAULT);
  const [seleccionados, setSeleccionados] = useState(new Set());
  const [eliminandoMasivo, setEliminandoMasivo] = useState(false);

  // Debounce: espera 350ms después de que el usuario deja de escribir
  useEffect(() => {
    const t = setTimeout(() => setBuscar(buscarInput), 350);
    return () => clearTimeout(t);
  }, [buscarInput]);

  // Función estable para recargar categorías (usada al montar y tras renombrar)
  const refreshCategorias = useCallback(() => {
    api.categorias().then(r => {
      const cats = r.data || [];
      const merged = [...new Set([...CATEGORIAS_DEFAULT, ...cats])];
      setCategorias(merged);
    }).catch(() => {});
  }, []);

  // silencioso=true: sincroniza en background sin mostrar spinner (post-crear/editar)
  const cargar = useCallback((silencioso = false) => {
    const reqId = ++reqIdRef.current;
    if (!silencioso) setCargando(true);
    api.listar({
      buscar:    buscar         || undefined,
      categoria: categoriaFiltro || undefined,
      orden:     ordenFiltro    || undefined,
    })
      .then(r => {
        if (reqId === reqIdRef.current) setLista(r.data);
      })
      .catch(() => {
        if (reqId === reqIdRef.current) toast.error('Error al cargar productos');
      })
      .finally(() => {
        if (reqId === reqIdRef.current) setCargando(false);
      });
  }, [buscar, categoriaFiltro, ordenFiltro]);

  useEffect(() => { refreshCategorias(); }, [refreshCategorias]);

  // [cargar] como dep es equivalente a [buscar, categoriaFiltro] pero con closure siempre fresco
  useEffect(() => { cargar(); }, [cargar]);

  const abrirNuevo = () => { setForm(productoVacio); setModal('form'); };
  const abrirEditar = (p) => { setForm({ ...p, costo: p.costo || '' }); setProductoActual(p); setModal('form'); };
  const abrirStock = (p) => { setProductoActual(p); setStockForm({ cantidad: '', tipo: 'entrada' }); setModal('stock'); };
  const cerrar = () => { setModal(null); setProductoActual(null); };

  const f = (k, v) => setForm(prev => ({ ...prev, [k]: v }));

  const guardar = async () => {
    setGuardando(true);
    try {
      const data = {
        ...form,
        precio: Number(form.precio),
        costo: form.costo ? Number(form.costo) : undefined,
        stock: Number(form.stock || 0),
        stockMinimo: Number(form.stockMinimo || 5),
        imagenUrl: form.imagenUrl || null,
      };
      if (!productoActual) {
        const { data: nuevo } = await api.crear(data);
        const conMeta = { ...nuevo, stockBajo: nuevo.stock <= nuevo.stockMinimo };
        // Insertar de inmediato respetando el orden activo
        setLista(prev => {
          const todos = [...prev, conMeta];
          return ordenFiltro === 'recientes'
            ? todos.sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
            : todos.sort((a, b) => a.nombre.localeCompare(b.nombre, 'es'));
        });
        cerrar();
        toast.success('Producto creado');
        cargar(true); // sincroniza filtros en background sin spinner
      } else {
        const { data: actualizado } = await api.actualizar(productoActual.id, data);
        const conMeta = { ...actualizado, stockBajo: actualizado.stock <= actualizado.stockMinimo };
        // Actualizar en sitio — sin recargar toda la lista
        setLista(prev => prev.map(p => p.id === actualizado.id ? conMeta : p));
        cerrar();
        toast.success('Producto actualizado');
        cargar(true);
      }
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'Error desconocido';
      toast.error('Error: ' + msg);
    }
    finally { setGuardando(false); }
  };

  const ajustarStock = async () => {
    setGuardando(true);
    try {
      await api.ajustarStock(productoActual.id, { cantidad: Number(stockForm.cantidad), tipo: stockForm.tipo });
      toast.success('Stock actualizado');
      cerrar(); cargar();
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'Error desconocido';
      toast.error('Error: ' + msg);
    }
    finally { setGuardando(false); }
  };

  const eliminar = async (id) => {
    if (!await confirmar('Este producto será eliminado permanentemente del inventario.', '¿Eliminar producto?')) return;
    try {
      await api.eliminar(id);
      toast.success('Producto eliminado');
      cargar();
      refreshCategorias();
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'Error desconocido';
      toast.error('Error al eliminar: ' + msg);
    }
  };

  const MAX_SELECCION = 100;

  const toggleSeleccion = (id) => {
    setSeleccionados(prev => {
      const nuevo = new Set(prev);
      if (nuevo.has(id)) {
        nuevo.delete(id);
      } else if (nuevo.size < MAX_SELECCION) {
        nuevo.add(id);
      } else {
        toast.error(`Máximo ${MAX_SELECCION} productos a la vez`);
      }
      return nuevo;
    });
  };

  const toggleTodos = () => {
    if (seleccionados.size > 0) {
      setSeleccionados(new Set());
    } else {
      const primeros = lista.slice(0, MAX_SELECCION).map(p => p.id);
      setSeleccionados(new Set(primeros));
      if (lista.length > MAX_SELECCION)
        toast(`Se seleccionaron los primeros ${MAX_SELECCION} de ${lista.length}`);
    }
  };

  const eliminarSeleccionados = async () => {
    const n = seleccionados.size;
    if (!await confirmar(`Se eliminarán ${n} producto${n > 1 ? 's' : ''} del inventario. Esta acción no se puede deshacer.`, `¿Eliminar ${n} producto${n > 1 ? 's' : ''}?`)) return;
    setEliminandoMasivo(true);
    try {
      await api.eliminarMasivo([...seleccionados]);
      toast.success(`${n} producto${n > 1 ? 's' : ''} eliminado${n > 1 ? 's' : ''}`);
      setSeleccionados(new Set());
      cargar();
      refreshCategorias();
    } catch (e) {
      const msg = e.response?.data?.error || e.message || 'Error desconocido';
      toast.error('Error al eliminar: ' + msg);
    }
    finally { setEliminandoMasivo(false); }
  };

  const fmt = (n) => `$${Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
  const stockBajoCount = lista.filter(p => p.stockBajo).length;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <SectionHeader
        title="Inventario"
        subtitle={`${lista.length} productos · ${stockBajoCount > 0 ? `${stockBajoCount} con stock bajo` : 'stock saludable'}`}
        action={
          <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
            <Btn icon={Tag} variant="secondary" onClick={() => setModal('stickers')}>Stickers</Btn>
            <Btn icon={Download} variant="secondary" onClick={() => exportarExcel(lista)}>Exportar</Btn>
            <Btn icon={Upload} variant="secondary" onClick={() => setModal('importar')}>Importar Excel</Btn>
            {esAdmin && <Btn icon={FolderCog} variant="secondary" onClick={() => setModal('categorias')}>Categorías</Btn>}
            <Btn icon={Plus} onClick={abrirNuevo}>Nuevo</Btn>
          </div>
        }
      />

      {/* Barra de selección masiva — solo admin */}
      {esAdmin && seleccionados.size > 0 && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 12,
          padding: '12px 18px', borderRadius: 10,
          background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.25)',
        }}>
          <span style={{ flex: 1, fontSize: '0.875rem', fontWeight: 600, color: '#991b1b' }}>
            {seleccionados.size} producto{seleccionados.size > 1 ? 's' : ''} seleccionado{seleccionados.size > 1 ? 's' : ''}
          </span>
          <Btn variant="secondary" onClick={() => setSeleccionados(new Set())} style={{ fontSize: '0.8125rem', padding: '6px 14px' }}>
            Cancelar
          </Btn>
          <Btn icon={Trash2} onClick={eliminarSeleccionados} disabled={eliminandoMasivo}
            style={{ fontSize: '0.8125rem', padding: '6px 14px', background: '#dc2626', borderColor: '#dc2626' }}>
            {eliminandoMasivo ? 'Eliminando...' : `Eliminar ${seleccionados.size}`}
          </Btn>
        </div>
      )}

      {/* Filtros */}
      <div className="tarjeta" style={{ padding: '16px 20px', display: 'flex', gap: 16, flexWrap: 'wrap', alignItems: 'center' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: 220 }}>
          <Search size={14} style={{ position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gris-400)', pointerEvents: 'none' }} />
          <input
            type="text"
            placeholder="Buscar producto..."
            value={buscarInput}
            onChange={e => setBuscarInput(e.target.value)}
            className="campo"
            style={{ paddingLeft: 36 }}
          />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
          <Filter size={13} style={{ color: 'var(--color-gris-400)', flexShrink: 0 }} />
          <div style={{ display: 'flex', gap: 6, flexWrap: 'wrap' }}>
            {/* Orden */}
            <button
              onClick={() => setOrdenFiltro(o => o === 'recientes' ? '' : 'recientes')}
              className={ordenFiltro === 'recientes' ? 'filtro-tab filtro-tab-activo' : 'filtro-tab'}
              style={{ display: 'flex', alignItems: 'center', gap: 4 }}
            >
              <Clock size={11} />
              Recientes
            </button>
            <span style={{ color: 'var(--color-gris-300)', alignSelf: 'center' }}>|</span>
            {/* Categorías */}
            <button
              onClick={() => setCategoriaFiltro('')}
              className={!categoriaFiltro ? 'filtro-tab filtro-tab-activo' : 'filtro-tab'}
            >
              Todas
            </button>
            {CATEGORIAS.map(c => (
              <button
                key={c}
                onClick={() => setCategoriaFiltro(c === categoriaFiltro ? '' : c)}
                className={categoriaFiltro === c ? 'filtro-tab filtro-tab-activo' : 'filtro-tab'}
              >
                {c}
              </button>
            ))}
          </div>
        </div>
      </div>

      <style>{`
        .inv-tabla { display: block; }
        .inv-cards { display: none; }
        @media (max-width: 700px) {
          .inv-tabla { display: none; }
          .inv-cards { display: flex; flex-direction: column; gap: 8px; }
        }
      `}</style>

      {/* Tabla desktop */}
      <div className="inv-tabla tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
        {cargando ? (
          <PageLoader />
        ) : lista.length === 0 ? (
          <EmptyState
            icon={Package}
            title="No hay productos"
            description="Agrega el primer producto al inventario"
            action={<Btn icon={Plus} onClick={abrirNuevo}>Agregar Producto</Btn>}
          />
        ) : (
          <Table headers={[
            ...(esAdmin ? [{ label: <input type="checkbox" checked={seleccionados.size > 0} onChange={toggleTodos} title={seleccionados.size > 0 ? 'Deseleccionar todo' : `Seleccionar primeros ${MAX_SELECCION}`} style={{ cursor: 'pointer', width: 15, height: 15 }} />, align: 'center' }] : []),
            'Producto', 'Categoría', { label: 'Condición', align: 'center' }, { label: 'Precio', align: 'right' }, { label: 'Costo', align: 'right' }, { label: 'Stock', align: 'center' }, { label: 'Acciones', align: 'center' }
          ]}>
            {lista.map(p => (
              <tr key={p.id} style={{ background: seleccionados.has(p.id) ? 'rgba(220,38,38,.04)' : undefined }}>
                {esAdmin && (
                  <Td align="center">
                    <input type="checkbox" checked={seleccionados.has(p.id)} onChange={() => toggleSeleccion(p.id)} style={{ cursor: 'pointer', width: 15, height: 15 }} />
                  </Td>
                )}
                <Td>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                    <div style={{ width: 38, height: 38, borderRadius: 9, flexShrink: 0, overflow: 'hidden', border: '1px solid var(--color-gris-200)' }}>
                      {p.imagenUrl ? <img src={p.imagenUrl} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                        <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.75rem', fontWeight: 700, background: p.stockBajo ? 'rgba(220,38,38,.08)' : 'var(--color-gris-100)', color: p.stockBajo ? 'var(--color-toyo)' : 'var(--color-gris-500)' }}>
                          {p.nombre[0].toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-gris-900)' }}>{p.nombre}</p>
                      {p.codigo && <p style={{ fontSize: '0.7rem', color: 'var(--color-gris-400)', marginTop: 1, fontFamily: 'monospace', fontWeight: 600 }}>{p.codigo}</p>}
                      {p.descripcion && <p style={{ fontSize: '0.75rem', color: 'var(--color-gris-400)', marginTop: 1, maxWidth: 280, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.descripcion}</p>}
                    </div>
                  </div>
                </Td>
                <Td><Badge variant={categoriaColors[p.categoria] || 'default'}>{p.categoria}</Badge></Td>
                <Td align="center">
                  <span style={{
                    display: 'inline-block', padding: '3px 10px', borderRadius: 99,
                    fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.3px',
                    background: p.condicion === 'usado' ? 'rgba(217,119,6,.12)' : 'rgba(5,150,105,.1)',
                    color: p.condicion === 'usado' ? '#b45309' : '#047857',
                    border: `1px solid ${p.condicion === 'usado' ? 'rgba(217,119,6,.3)' : 'rgba(5,150,105,.25)'}`,
                  }}>
                    {p.condicion === 'usado' ? 'Usado' : 'Nuevo'}
                  </span>
                </Td>
                <Td align="right"><span style={{ fontWeight: 600, color: 'var(--color-gris-800)' }}>{fmt(p.precio)}</span></Td>
                <Td align="right"><span style={{ color: 'var(--color-gris-500)' }}>{p.costo ? fmt(p.costo) : '—'}</span></Td>
                <Td align="center">
                  <div style={{ display: 'inline-flex', alignItems: 'center', gap: 5, padding: '4px 10px', borderRadius: 99, fontSize: '0.75rem', fontWeight: 600, background: p.stock === 0 ? 'rgba(220,38,38,.1)' : p.stockBajo ? 'rgba(217,119,6,.1)' : 'rgba(5,150,105,.1)', color: p.stock === 0 ? '#dc2626' : p.stockBajo ? '#d97706' : '#059669' }}>
                    {p.stockBajo && p.stock > 0 && <AlertTriangle size={10} />}
                    {p.stock} {p.unidad}
                  </div>
                </Td>
                <Td align="center">
                  <ActionMenu>
                    <IconBtn icon={ArrowUpDown} onClick={() => abrirStock(p)} title="Ajustar stock" color="blue" />
                    <IconBtn icon={Pencil} onClick={() => abrirEditar(p)} title="Editar" color="amber" />
                    <IconBtn icon={Trash2} onClick={() => eliminar(p.id)} title="Eliminar" color="red" />
                  </ActionMenu>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {/* Tarjetas móvil */}
      {!cargando && lista.length > 0 && (
        <div className="inv-cards">
          {lista.map(p => (
            <div key={p.id} className="tarjeta" style={{ padding: '12px 14px', background: seleccionados.has(p.id) ? 'rgba(220,38,38,.04)' : undefined }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                {esAdmin && (
                  <input type="checkbox" checked={seleccionados.has(p.id)} onChange={() => toggleSeleccion(p.id)} style={{ cursor: 'pointer', width: 16, height: 16, flexShrink: 0 }} />
                )}
                <div style={{ width: 42, height: 42, borderRadius: 10, flexShrink: 0, overflow: 'hidden', border: '1px solid var(--color-gris-200)' }}>
                  {p.imagenUrl ? <img src={p.imagenUrl} alt={p.nombre} style={{ width: '100%', height: '100%', objectFit: 'cover' }} /> : (
                    <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.8rem', fontWeight: 700, background: p.stockBajo ? 'rgba(220,38,38,.08)' : 'var(--color-gris-100)', color: p.stockBajo ? 'var(--color-toyo)' : 'var(--color-gris-500)' }}>
                      {p.nombre[0].toUpperCase()}
                    </div>
                  )}
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-gris-900)' }}>{p.nombre}</span>
                    <Badge variant={categoriaColors[p.categoria] || 'default'}>{p.categoria}</Badge>
                    <span style={{
                      display: 'inline-block', padding: '2px 8px', borderRadius: 99,
                      fontSize: '0.68rem', fontWeight: 700,
                      background: p.condicion === 'usado' ? 'rgba(217,119,6,.12)' : 'rgba(5,150,105,.1)',
                      color: p.condicion === 'usado' ? '#b45309' : '#047857',
                    }}>
                      {p.condicion === 'usado' ? 'Usado' : 'Nuevo'}
                    </span>
                  </div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: 10, marginTop: 4, flexWrap: 'wrap' }}>
                    <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-gris-800)' }}>{fmt(p.precio)}</span>
                    {p.costo && <span style={{ fontSize: '0.75rem', color: 'var(--color-gris-400)' }}>Costo: {fmt(p.costo)}</span>}
                    <div style={{ display: 'inline-flex', alignItems: 'center', gap: 4, padding: '2px 8px', borderRadius: 99, fontSize: '0.72rem', fontWeight: 600, background: p.stock === 0 ? 'rgba(220,38,38,.1)' : p.stockBajo ? 'rgba(217,119,6,.1)' : 'rgba(5,150,105,.1)', color: p.stock === 0 ? '#dc2626' : p.stockBajo ? '#d97706' : '#059669' }}>
                      {p.stockBajo && p.stock > 0 && <AlertTriangle size={9} />}
                      {p.stock} {p.unidad}
                    </div>
                  </div>
                </div>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 4, flexShrink: 0 }}>
                  <button className="btn-icono btn-icono-azul" onClick={() => abrirStock(p)} title="Ajustar stock"><ArrowUpDown size={13} /></button>
                  <button className="btn-icono btn-icono-ambar" onClick={() => abrirEditar(p)} title="Editar"><Pencil size={13} /></button>
                  <button className="btn-icono btn-icono-rojo" onClick={() => eliminar(p.id)} title="Eliminar"><Trash2 size={13} /></button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
      {!cargando && lista.length === 0 && (
        <div className="inv-cards">
          <EmptyState icon={Package} title="No hay productos" description="Agrega el primer producto al inventario" action={<Btn icon={Plus} onClick={abrirNuevo}>Agregar Producto</Btn>} />
        </div>
      )}

      {/* Modal Importar */}
      {modal === 'importar' && (
        <ModalImportar onClose={cerrar} onImportado={() => { cerrar(); cargar(); }} />
      )}

      {/* Modal Stickers */}
      {modal === 'stickers' && (
        <ModalStickers lista={lista} categorias={CATEGORIAS} onClose={cerrar} />
      )}

      {/* Modal Categorías */}
      {modal === 'categorias' && (
        <ModalCategorias
          onClose={cerrar}
          onActualizado={() => { cargar(); refreshCategorias(); }}
          onCrearCategoria={(nombre) => setCategorias(prev => [...new Set([...prev, nombre])])}
        />
      )}

      {/* Modal Producto */}
      {modal === 'form' && (
        <Modal
          titulo={productoActual ? 'Editar Producto' : 'Nuevo Producto'}
          onClose={cerrar}
          size="lg"
        >
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <Input label="Nombre del producto *" value={form.nombre} onChange={e => f('nombre', e.target.value)} placeholder="Ej: Llanta Pirelli 205/55 R16" />
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: 14 }}>
              <Select label="Categoría" value={form.categoria} onChange={e => f('categoria', e.target.value)}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </Select>
              <Select label="Condición del producto" value={form.condicion || 'nuevo'} onChange={e => f('condicion', e.target.value)}>
                <option value="nuevo">Nuevo</option>
                <option value="usado">Usado / Segunda</option>
              </Select>
              <Input label="Unidad de medida" value={form.unidad} onChange={e => f('unidad', e.target.value)} placeholder="unidad, litro, kg..." />
              <Input label="Precio de venta *" type="number" value={form.precio} onChange={e => f('precio', e.target.value)} placeholder="0.00" />
              <Input label="Costo de compra" type="number" value={form.costo} onChange={e => f('costo', e.target.value)} placeholder="0.00" />
              <Input label="Stock inicial" type="number" value={form.stock} onChange={e => f('stock', e.target.value)} placeholder="0" />
              <Input label="Stock mínimo (alerta)" type="number" value={form.stockMinimo} onChange={e => f('stockMinimo', e.target.value)} placeholder="5" />
            </div>
            <Textarea label="Descripción" value={form.descripcion} onChange={e => f('descripcion', e.target.value)} rows={2} placeholder="Descripción opcional del producto..." />
            <ImagenUploader label="Imagen del producto" value={form.imagenUrl} onChange={url => f('imagenUrl', url || '')} />
          </div>
          <ModalFooter>
            <Btn variant="secondary" onClick={cerrar} className="flex-1">Cancelar</Btn>
            <Btn onClick={guardar} disabled={guardando || !form.nombre || !form.precio} className="flex-1">
              {guardando ? 'Guardando...' : 'Guardar Producto'}
            </Btn>
          </ModalFooter>
        </Modal>
      )}

      {/* Modal Stock */}
      {modal === 'stock' && (
        <Modal titulo="Ajustar Stock" onClose={cerrar} size="sm">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: '12px 14px', borderRadius: 10,
              background: 'var(--color-gris-50)', border: '1px solid var(--color-gris-200)',
            }}>
              <div style={{
                width: 36, height: 36, borderRadius: 9, flexShrink: 0,
                background: '#fff', border: '1px solid var(--color-gris-200)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-gris-700)',
              }}>
                {productoActual?.nombre[0].toUpperCase()}
              </div>
              <div>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-gris-900)' }}>{productoActual?.nombre}</p>
                <p style={{ fontSize: '0.75rem', color: 'var(--color-gris-500)', marginTop: 2 }}>
                  Stock actual: <strong style={{ color: 'var(--color-gris-700)' }}>{productoActual?.stock} {productoActual?.unidad}</strong>
                </p>
              </div>
            </div>
            <Select
              label="Tipo de ajuste"
              value={stockForm.tipo}
              onChange={e => setStockForm({ ...stockForm, tipo: e.target.value })}
            >
              <option value="entrada">Entrada — suma al stock</option>
              <option value="salida">Salida — resta del stock</option>
              <option value="ajuste">Ajuste directo — valor exacto</option>
            </Select>
            <Input
              label="Cantidad"
              type="number"
              value={stockForm.cantidad}
              onChange={e => setStockForm({ ...stockForm, cantidad: e.target.value })}
              placeholder="0"
            />
            {stockForm.cantidad && (
              <div style={{
                padding: '10px 14px', borderRadius: 10,
                background: 'rgba(37,99,235,.06)', border: '1px solid rgba(37,99,235,.15)',
                fontSize: '0.8125rem', color: '#1e40af',
              }}>
                Stock resultante:{' '}
                <strong>
                  {stockForm.tipo === 'entrada' && productoActual?.stock + Number(stockForm.cantidad)}
                  {stockForm.tipo === 'salida' && productoActual?.stock - Number(stockForm.cantidad)}
                  {stockForm.tipo === 'ajuste' && Number(stockForm.cantidad)}
                </strong> {productoActual?.unidad}
              </div>
            )}
          </div>
          <ModalFooter>
            <Btn variant="secondary" onClick={cerrar} className="flex-1">Cancelar</Btn>
            <Btn onClick={ajustarStock} disabled={guardando || !stockForm.cantidad} className="flex-1">
              {guardando ? 'Aplicando...' : 'Aplicar Ajuste'}
            </Btn>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
