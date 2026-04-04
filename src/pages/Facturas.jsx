import { useEffect, useRef, useState, useMemo } from 'react';
import { useAuth } from '../context/AuthContext';
import { facturas as api, clientes as clientesApi, productos as productosApi, metodosPago as mpApi } from '../api';
import { Plus, FileText, Trash2, Search, UserPlus, AlertTriangle, Printer, MessageCircle, RefreshCw, ClipboardList, Receipt } from 'lucide-react';
import { Modal, ModalFooter, Btn, Input, Badge, PageLoader, EmptyState, SectionHeader, Table, Td } from '../components/UI';
import { toast } from '../utils/toast';
import { confirmar } from '../utils/confirmar';

// ── Constantes ─────────────────────────────────────────────────────────────
const ESTADOS_FACTURA     = ['pendiente', 'pagada', 'cancelada'];
const ESTADOS_COTIZACION  = ['pendiente', 'aceptada', 'rechazada'];
const estadoVariant = {
  pendiente: 'warning', pagada: 'success', cancelada: 'danger',
  aceptada: 'success',  rechazada: 'danger', aprobada: 'success',
};

// ── Helpers ─────────────────────────────────────────────────────────────────
const fmt  = (n) => `$${Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtF = (d) => new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });

function fechaVencimiento(createdAt) {
  const d = new Date(createdAt);
  d.setDate(d.getDate() + 7);
  return fmtF(d);
}

function generarHTMLDocumento(doc) {
  const esFactura = doc.tipo === 'factura';
  const fecha     = fmtF(doc.createdAt);
  const vence     = fechaVencimiento(doc.createdAt);

  const itemsHTML = (doc.detalles || []).map(d => `
    <tr>
      <td>
        <div class="item-nombre">${d.descripcion || d.producto?.nombre || 'Servicio'}</div>
        ${d.producto?.categoria ? `<div class="item-cat">${d.producto.categoria}</div>` : ''}
      </td>
      <td class="center">${d.cantidad}</td>
      <td class="right">${fmt(d.precio)}</td>
      <td class="right subtotal-cel">${fmt(d.subtotal)}</td>
    </tr>
  `).join('');

  return `<!DOCTYPE html>
<html lang="es">
<head>
  <meta charset="UTF-8">
  <title>${esFactura ? 'FACTURA' : 'COTIZACIÓN'} ${doc.numero}</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:'Segoe UI',Tahoma,Arial,sans-serif;background:#eef2f7;padding:32px 24px;min-height:100vh}
    .acciones-top{max-width:860px;margin:0 auto 20px;display:flex;gap:12px}
    .btn-a{display:inline-flex;align-items:center;gap:8px;padding:11px 24px;border:none;border-radius:10px;font-size:14px;font-weight:600;cursor:pointer;transition:opacity .15s}
    .btn-a:hover{opacity:.85}
    .btn-print{background:#1e293b;color:#fff}
    .btn-close{background:#fff;color:#64748b;border:1px solid #e2e8f0}
    .pagina{max-width:860px;margin:0 auto;background:#fff;border-radius:18px;overflow:hidden;box-shadow:0 8px 48px rgba(0,0,0,.18)}
    .header{background:#0f172a;padding:36px 48px;display:flex;justify-content:space-between;align-items:flex-start}
    .logo{font-size:38px;font-weight:900;color:#fff;letter-spacing:-2px}
    .logo span{color:#dc2626}
    .logo-sub{font-size:10px;color:rgba(255,255,255,.35);margin-top:5px;text-transform:uppercase;letter-spacing:.18em}
    .doc-header{text-align:right}
    .doc-tipo{font-size:24px;font-weight:800;color:#dc2626;letter-spacing:.04em}
    .doc-numero{font-size:13px;color:rgba(255,255,255,.55);margin-top:6px;font-family:'Courier New',monospace}
    .doc-fecha{font-size:11px;color:rgba(255,255,255,.35);margin-top:3px}
    .accent{height:5px;background:linear-gradient(90deg,#991b1b,#dc2626,#f97316,#fbbf24)}
    .cuerpo{padding:40px 48px}
    .info-grid{display:grid;grid-template-columns:1fr 1fr;gap:32px;margin-bottom:36px;padding-bottom:32px;border-bottom:2px solid #f1f5f9}
    .bloque label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:#94a3b8;display:block;margin-bottom:10px}
    .cli-nombre{font-size:20px;font-weight:700;color:#0f172a;margin-bottom:6px}
    .cli-dato{font-size:13px;color:#475569;margin-bottom:3px}
    .cli-dato b{font-weight:600;color:#1e293b}
    .badge{display:inline-flex;align-items:center;padding:4px 12px;border-radius:20px;font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.08em;margin-top:10px}
    .badge-pendiente{background:#fef3c7;color:#92400e}
    .badge-pagada,.badge-aceptada,.badge-aprobada{background:#dcfce7;color:#14532d}
    .badge-cancelada,.badge-rechazada{background:#fee2e2;color:#7f1d1d}
    .tabla-titulo{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:#94a3b8;margin-bottom:12px}
    table{width:100%;border-collapse:collapse}
    thead tr{background:#1e293b}
    thead th{color:rgba(255,255,255,.8);font-size:11px;font-weight:600;text-transform:uppercase;letter-spacing:.08em;padding:12px 16px;text-align:left}
    .right{text-align:right} .center{text-align:center}
    tbody tr:nth-child(even){background:#f8fafc}
    tbody td{padding:13px 16px;font-size:13px;color:#334155;border-bottom:1px solid #f1f5f9}
    .item-nombre{font-weight:600;color:#1e293b}
    .item-cat{font-size:11px;color:#94a3b8;margin-top:2px}
    .subtotal-cel{font-weight:700;color:#1e293b}
    .totales{display:flex;justify-content:flex-end;margin-top:28px}
    .totales-inner{width:320px}
    .tot-linea{display:flex;justify-content:space-between;padding:7px 0;font-size:13px}
    .tot-linea .lbl{color:#64748b} .tot-linea .val{color:#1e293b;font-weight:500}
    .tot-sep{height:1px;background:#e2e8f0;margin:8px 0}
    .tot-final{display:flex;justify-content:space-between;align-items:center;padding:16px 20px;background:#1e293b;border-radius:12px;margin-top:12px}
    .tot-final .lbl{color:rgba(255,255,255,.65);font-size:11px;font-weight:700;text-transform:uppercase;letter-spacing:.08em}
    .tot-final .val{color:#fff;font-size:22px;font-weight:900}
    .notas{margin-top:32px;padding:18px 22px;background:#f8fafc;border-radius:12px;border-left:4px solid #dc2626}
    .notas label{font-size:10px;font-weight:700;text-transform:uppercase;letter-spacing:.15em;color:#94a3b8;display:block;margin-bottom:8px}
    .notas p{font-size:13px;color:#475569;line-height:1.6}
    .aviso-cot{margin-top:20px;padding:16px 20px;background:#eff6ff;border-radius:12px;border:1px solid #bfdbfe}
    .aviso-cot p{font-size:12px;color:#1e40af;line-height:1.6}
    .aviso-cot b{font-weight:700}
    .footer{margin-top:48px;padding:24px 48px;background:#f8fafc;border-top:1px solid #e2e8f0;display:flex;justify-content:space-between;align-items:center}
    .footer-marca{font-size:18px;font-weight:900;color:#1e293b;letter-spacing:-0.5px}
    .footer-marca span{color:#dc2626}
    .footer-sub{font-size:11px;color:#94a3b8;margin-top:2px}
    .footer-terms{font-size:11px;color:#94a3b8;text-align:right;max-width:280px;line-height:1.55}
    @media print{body{background:#fff;padding:0}.pagina{box-shadow:none;border-radius:0;max-width:100%}.acciones-top{display:none}}
  </style>
</head>
<body>
  <div class="acciones-top">
    <button class="btn-a btn-print" onclick="window.print()">🖨️&nbsp; Imprimir / Guardar PDF</button>
    <button class="btn-a btn-close" onclick="window.close()">✕&nbsp; Cerrar</button>
  </div>
  <div class="pagina">
    <div class="header">
      <div>
        <div class="logo">TOYO<span>+</span></div>
        <div class="logo-sub">Sistema de Gestión Automotriz</div>
      </div>
      <div class="doc-header">
        <div class="doc-tipo">${esFactura ? 'FACTURA' : 'COTIZACIÓN'}</div>
        <div class="doc-numero">${doc.numero}</div>
        <div class="doc-fecha">Emitida el ${fecha}</div>
      </div>
    </div>
    <div class="accent"></div>
    <div class="cuerpo">
      <div class="info-grid">
        <div class="bloque">
          <label>Señor(es)</label>
          <div class="cli-nombre">${doc.cliente?.nombre || '—'}</div>
          ${doc.cliente?.cedula    ? `<div class="cli-dato">C.I.: <b>${doc.cliente.cedula}</b></div>`    : ''}
          ${doc.cliente?.telefono  ? `<div class="cli-dato">Tel.: <b>${doc.cliente.telefono}</b></div>`  : ''}
          ${doc.cliente?.email     ? `<div class="cli-dato">Email: <b>${doc.cliente.email}</b></div>`    : ''}
          ${doc.cliente?.direccion ? `<div class="cli-dato">Dir.: <b>${doc.cliente.direccion}</b></div>` : ''}
        </div>
        <div class="bloque">
          <label>${esFactura ? 'Datos de la Factura' : 'Datos de la Cotización'}</label>
          <div class="cli-dato">N° Documento: <b>${doc.numero}</b></div>
          <div class="cli-dato">Fecha de emisión: <b>${fecha}</b></div>
          ${!esFactura ? `<div class="cli-dato">Válida hasta: <b>${vence}</b></div>` : ''}
          <span class="badge badge-${doc.estado}">${doc.estado}</span>
        </div>
      </div>
      <div class="tabla-titulo">Descripción de Productos y Servicios</div>
      <table>
        <thead>
          <tr>
            <th style="width:46%">Descripción</th>
            <th class="center" style="width:11%">Cant.</th>
            <th class="right" style="width:21%">P. Unitario</th>
            <th class="right" style="width:22%">Subtotal</th>
          </tr>
        </thead>
        <tbody>${itemsHTML}</tbody>
      </table>
      <div class="totales">
        <div class="totales-inner">
          <div class="tot-linea"><span class="lbl">Subtotal</span><span class="val">${fmt(doc.subtotal)}</span></div>
          ${doc.impuesto > 0 ? `<div class="tot-linea"><span class="lbl">Impuesto / Recargo</span><span class="val">${fmt(doc.impuesto)}</span></div>` : ''}
          <div class="tot-sep"></div>
          <div class="tot-final"><span class="lbl">Total a Pagar</span><span class="val">${fmt(doc.total)}</span></div>
        </div>
      </div>
      ${doc.notas ? `<div class="notas"><label>Notas</label><p>${doc.notas}</p></div>` : ''}
      ${!esFactura ? `<div class="aviso-cot"><p><b>Nota:</b> Esta cotización es válida por 7 días hábiles desde la fecha de emisión. Los precios están sujetos a disponibilidad de inventario. Para confirmar su pedido, comuníquese con nosotros.</p></div>` : ''}
    </div>
    <div class="footer">
      <div>
        <div class="footer-marca">TOYO<span>+</span></div>
        <div class="footer-sub">Sistema de Gestión Automotriz</div>
      </div>
      <div class="footer-terms">${esFactura
        ? 'Gracias por su compra. Conserve este comprobante para cualquier reclamo o garantía.'
        : 'Esta cotización no constituye compromiso de venta. Precios en dólares americanos.'}</div>
    </div>
  </div>
</body></html>`;
}

function generarTextoWA(doc) {
  const esFactura = doc.tipo === 'factura';
  const lineas = (doc.detalles || []).map(d =>
    `  • ${d.cantidad}x ${d.descripcion || d.producto?.nombre || 'Servicio'} → ${fmt(d.subtotal)}`
  ).join('\n');
  const emoji = esFactura ? '🧾' : '📋';
  const titulo = esFactura ? 'FACTURA' : 'COTIZACIÓN';
  return `${emoji} *TOYO+ — ${titulo}*
━━━━━━━━━━━━━━━━━━━━
📄 N°: *${doc.numero}*
📅 Fecha: ${fmtF(doc.createdAt)}${!esFactura ? `\n⏳ Válida hasta: ${fechaVencimiento(doc.createdAt)}` : ''}
👤 Cliente: *${doc.cliente?.nombre || '—'}*
━━━━━━━━━━━━━━━━━━━━
*DETALLE:*
${lineas}
━━━━━━━━━━━━━━━━━━━━
Subtotal:   ${fmt(doc.subtotal)}${doc.impuesto > 0 ? `\nImpuesto:   ${fmt(doc.impuesto)}` : ''}
*TOTAL:     ${fmt(doc.total)}*
━━━━━━━━━━━━━━━━━━━━
${!esFactura ? '✅ Para confirmar su pedido responda este mensaje.\n' : ''}
_TOYO+ · Sistema de Gestión Automotriz_`;
}

const abrirImpresion = (doc) => {
  const w = window.open('', '_blank', 'width=920,height=1050');
  w.document.write(generarHTMLDocumento(doc));
  w.document.close();
};

const compartirWA = (doc) => {
  const texto = generarTextoWA(doc);
  const tel = doc.cliente?.telefono?.replace(/\D/g, '');
  const url = tel
    ? `https://wa.me/${tel}?text=${encodeURIComponent(texto)}`
    : `https://wa.me/?text=${encodeURIComponent(texto)}`;
  window.open(url, '_blank');
};

// ── Buscador de cliente ─────────────────────────────────────────────────────
function BuscadorCliente({ onSeleccionar }) {
  const [query, setQuery]         = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando]   = useState(false);
  const [abierto, setAbierto]     = useState(false);
  const [elegido, setElegido]     = useState(null);
  const [modoNuevo, setModoNuevo] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const timer = useRef(null);
  const ref   = useRef(null);

  useEffect(() => {
    const cerrar = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!query.trim()) { setResultados([]); return; }
    timer.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await clientesApi.listar({ buscar: query.trim() });
        setResultados(r.data.slice(0, 6));
      } finally { setBuscando(false); }
    }, 300);
  }, [query]);

  const elegir = (c) => {
    setElegido(c); setQuery(c.nombre); setAbierto(false); setModoNuevo(false);
    onSeleccionar({ tipo: 'existente', cliente: c });
  };
  const activarNuevo = () => {
    setModoNuevo(true); setNombreNuevo(query); setAbierto(false); setElegido(null);
    onSeleccionar({ tipo: 'nuevo', nombre: query });
  };
  const limpiar = () => {
    setQuery(''); setElegido(null); setModoNuevo(false); setNombreNuevo(''); setResultados([]);
    onSeleccionar(null);
  };

  if (modoNuevo) return (
    <div className="space-y-2">
      <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
        <UserPlus size={13} className="text-emerald-600 shrink-0" />
        <span className="text-xs font-medium text-emerald-700">Nuevo cliente (se creará al guardar)</span>
        <button onClick={limpiar} className="ml-auto text-xs text-emerald-600 hover:text-emerald-800 font-medium">Cambiar</button>
      </div>
      <Input label="Nombre *" value={nombreNuevo}
        onChange={e => { setNombreNuevo(e.target.value); onSeleccionar({ tipo: 'nuevo', nombre: e.target.value }); }}
        placeholder="Nombre completo del cliente" />
    </div>
  );

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label className="etiqueta">Cliente *</label>
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gris-400)', pointerEvents: 'none' }} />
        <input type="text" className="campo" style={{ paddingLeft: 32 }}
          placeholder="Buscar cliente por nombre..."
          value={query}
          onChange={e => { setQuery(e.target.value); setAbierto(true); setElegido(null); }}
          onFocus={() => { if (query) setAbierto(true); }}
          autoComplete="off"
        />
        {elegido && <span style={{ position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)', fontSize: '0.7rem', fontWeight: 700, color: '#059669' }}>✓</span>}
      </div>
      {abierto && query.trim() && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, background: '#fff', border: '1px solid var(--color-gris-200)', borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,.15)', marginTop: 4, overflow: 'hidden' }}>
          {buscando && <div style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--color-gris-400)' }}>Buscando...</div>}
          {!buscando && resultados.map(c => (
            <button key={c.id} onClick={() => elegir(c)}
              style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '10px 14px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: '1px solid var(--color-gris-100)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-gris-50)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-gris-900)' }}>{c.nombre}</span>
              {c.cedula && <span style={{ fontSize: '0.75rem', color: 'var(--color-gris-400)' }}>{c.cedula}{c.telefono ? ` · ${c.telefono}` : ''}</span>}
            </button>
          ))}
          {!buscando && (
            <button onClick={activarNuevo}
              style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
              <UserPlus size={13} />
              <span style={{ fontSize: '0.83rem', fontWeight: 600 }}>
                {resultados.length === 0 ? `Crear "${query}"` : `Crear nuevo "${query}"`}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Buscador de producto ────────────────────────────────────────────────────
function BuscadorProducto({ productos, onSeleccionar, esCotizacion = false, idsEnLista = new Set() }) {
  const [query, setQuery]   = useState('');
  const [abierto, setAbierto] = useState(false);
  const ref = useRef(null);

  useEffect(() => {
    const cerrar = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  const filtrados = query.trim()
    ? productos.filter(p => p.nombre.toLowerCase().includes(query.toLowerCase())).slice(0, 8)
    : productos.slice(0, 8);

  const elegir = (p) => {
    if (idsEnLista.has(p.id)) return;
    onSeleccionar(p); setQuery(''); setAbierto(false);
  };

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <div style={{ position: 'relative' }}>
        <Search size={12} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gris-400)', pointerEvents: 'none' }} />
        <input type="text" value={query}
          onChange={e => { setQuery(e.target.value); setAbierto(true); }}
          onFocus={() => setAbierto(true)}
          placeholder="Buscar y agregar producto del inventario..."
          autoComplete="off"
          style={{ width: '100%', fontSize: '0.8rem', border: '1px solid var(--color-gris-200)', borderRadius: 10, padding: '8px 10px 8px 28px', outline: 'none', transition: 'border-color .15s' }}
          onFocus={e => { e.target.style.borderColor = 'var(--color-toyo)'; setAbierto(true); }}
          onBlur={e => e.target.style.borderColor = 'var(--color-gris-200)'}
        />
      </div>
      {abierto && (
        <div style={{ position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 9999, background: '#fff', border: '1px solid var(--color-gris-200)', borderRadius: 10, boxShadow: '0 8px 28px rgba(0,0,0,.15)', marginTop: 3, overflow: 'hidden', maxHeight: 260, overflowY: 'auto' }}>
          {filtrados.length === 0 && <div style={{ padding: '10px 14px', fontSize: '0.78rem', color: 'var(--color-gris-400)' }}>Sin coincidencias</div>}
          {filtrados.map(p => {
            const sinStock = p.stock <= 0;
            const pocoStock = p.stock > 0 && p.stock <= p.stockMinimo;
            const yaAgregado = idsEnLista.has(p.id);
            return (
              <button key={p.id} onClick={() => elegir(p)}
                disabled={yaAgregado}
                style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '10px 14px', border: 'none', background: yaAgregado ? 'var(--color-gris-50)' : 'transparent', cursor: yaAgregado ? 'not-allowed' : 'pointer', borderBottom: '1px solid var(--color-gris-100)', gap: 10, opacity: yaAgregado ? 0.6 : 1 }}
                onMouseEnter={e => { if (!yaAgregado) e.currentTarget.style.background = 'var(--color-gris-50)'; }}
                onMouseLeave={e => { if (!yaAgregado) e.currentTarget.style.background = 'transparent'; }}>
                <div style={{ textAlign: 'left', minWidth: 0 }}>
                  <p style={{ fontWeight: 600, fontSize: '0.83rem', color: 'var(--color-gris-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</p>
                  <p style={{ fontSize: '0.7rem', color: 'var(--color-gris-400)' }}>{p.categoria}</p>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <p style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-gris-800)' }}>{fmt(p.precio)}</p>
                  <p style={{ fontSize: '0.68rem', color: yaAgregado ? '#059669' : sinStock ? '#dc2626' : pocoStock ? '#d97706' : '#64748b' }}>
                    {yaAgregado ? '✓ Ya agregado' : sinStock ? (esCotizacion ? '⚠ Sin stock' : '✗ Sin stock') : `Stock: ${p.stock}`}
                    {!yaAgregado && pocoStock ? ' ⚠' : ''}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// ── Panel selector múltiple de productos ────────────────────────────────────
function SelectorProductos({ productos, esCotizacion, onAgregar, onCerrar, idsEnLista = new Set() }) {
  const [query, setQuery]       = useState('');
  const [seleccion, setSeleccion] = useState({}); // { id: cantidad }

  const filtrados = query.trim()
    ? productos.filter(p => p.nombre.toLowerCase().includes(query.toLowerCase()) || (p.codigo || '').toLowerCase().includes(query.toLowerCase()))
    : productos;

  const toggleItem = (p) => {
    setSeleccion(prev => {
      if (prev[p.id]) { const n = { ...prev }; delete n[p.id]; return n; }
      return { ...prev, [p.id]: 1 };
    });
  };

  const setCant = (id, val) => {
    const n = Math.max(1, Number(val) || 1);
    setSeleccion(prev => ({ ...prev, [id]: n }));
  };

  const totalSel = Object.keys(seleccion).length;

  const confirmar = () => {
    const items = Object.entries(seleccion).map(([id, cant]) => {
      const p = productos.find(x => x.id === Number(id));
      return { ...p, cantidadSel: cant };
    });
    onAgregar(items);
  };

  return (
    <div style={{ border: '1.5px solid var(--color-toyo)', borderRadius: 12, overflow: 'hidden', marginBottom: 8 }}>
      {/* Cabecera */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '10px 14px', background: 'rgba(220,38,38,.05)', borderBottom: '1px solid var(--color-gris-200)' }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: 'var(--color-toyo)' }}>
          Seleccionar productos del inventario
        </span>
        <button onClick={onCerrar} style={{ fontSize: '0.75rem', color: 'var(--color-gris-400)', background: 'none', border: 'none', cursor: 'pointer' }}>✕ Cerrar</button>
      </div>

      {/* Búsqueda */}
      <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--color-gris-100)' }}>
        <div style={{ position: 'relative' }}>
          <Search size={13} style={{ position: 'absolute', left: 9, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gris-400)', pointerEvents: 'none' }} />
          <input type="text" value={query} onChange={e => setQuery(e.target.value)}
            placeholder="Buscar por nombre o código..."
            style={{ width: '100%', fontSize: '0.8rem', border: '1px solid var(--color-gris-200)', borderRadius: 8, padding: '7px 10px 7px 28px', outline: 'none' }} />
        </div>
      </div>

      {/* Lista */}
      <div style={{ maxHeight: 280, overflowY: 'auto' }}>
        {filtrados.length === 0 && (
          <div style={{ padding: '16px', textAlign: 'center', fontSize: '0.8rem', color: 'var(--color-gris-400)' }}>Sin coincidencias</div>
        )}
        {filtrados.map(p => {
          const selec    = !!seleccion[p.id];
          const sinStock  = p.stock <= 0;
          const yaAgregado = idsEnLista.has(p.id);
          const disabled  = yaAgregado || (!esCotizacion && sinStock);
          return (
            <div key={p.id} onClick={() => !disabled && toggleItem(p)}
              style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '9px 14px', borderBottom: '1px solid var(--color-gris-100)', cursor: disabled ? 'not-allowed' : 'pointer', background: selec ? 'rgba(220,38,38,.04)' : yaAgregado ? 'var(--color-gris-50)' : 'transparent', opacity: disabled ? 0.5 : 1, transition: 'background .1s' }}>
              <div style={{ width: 16, height: 16, borderRadius: 4, border: `2px solid ${yaAgregado ? '#059669' : selec ? 'var(--color-toyo)' : 'var(--color-gris-300)'}`, background: yaAgregado ? '#059669' : selec ? 'var(--color-toyo)' : 'transparent', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                {(selec || yaAgregado) && <span style={{ color: '#fff', fontSize: 10, lineHeight: 1 }}>✓</span>}
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 600, color: 'var(--color-gris-900)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{p.nombre}</div>
                <div style={{ fontSize: '0.7rem', color: 'var(--color-gris-400)' }}>{p.categoria}{p.codigo ? ` · ${p.codigo}` : ''}</div>
              </div>
              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{ fontSize: '0.82rem', fontWeight: 700, color: 'var(--color-gris-800)' }}>{fmt(p.precio)}</div>
                <div style={{ fontSize: '0.68rem', color: yaAgregado ? '#059669' : sinStock ? '#dc2626' : '#64748b' }}>
                  {yaAgregado ? '✓ Ya en factura' : sinStock ? (esCotizacion ? '⚠ Sin stock' : '✗ Sin stock') : `Stock: ${p.stock}`}
                </div>
              </div>
              {selec && (
                <div onClick={e => e.stopPropagation()}>
                  <input type="number" min="1" value={seleccion[p.id]}
                    onChange={e => setCant(p.id, e.target.value)}
                    style={{ width: 52, textAlign: 'center', fontSize: '0.8rem', border: '1.5px solid var(--color-toyo)', borderRadius: 7, padding: '4px 6px', outline: 'none' }} />
                </div>
              )}
            </div>
          );
        })}
      </div>

      {/* Footer con botón confirmar */}
      <div style={{ padding: '10px 14px', borderTop: '1px solid var(--color-gris-200)', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: 'var(--color-gris-50)' }}>
        <span style={{ fontSize: '0.8rem', color: 'var(--color-gris-500)' }}>
          {totalSel > 0 ? `${totalSel} producto${totalSel > 1 ? 's' : ''} seleccionado${totalSel > 1 ? 's' : ''}` : 'Haz clic en un producto para seleccionarlo'}
        </span>
        <button onClick={confirmar} disabled={totalSel === 0}
          style={{ padding: '7px 18px', borderRadius: 8, background: totalSel > 0 ? 'var(--color-toyo)' : 'var(--color-gris-200)', color: totalSel > 0 ? '#fff' : 'var(--color-gris-400)', border: 'none', cursor: totalSel > 0 ? 'pointer' : 'not-allowed', fontSize: '0.8125rem', fontWeight: 700, transition: 'background .15s' }}>
          Agregar {totalSel > 0 ? `${totalSel} producto${totalSel > 1 ? 's' : ''}` : 'productos'}
        </button>
      </div>
    </div>
  );
}

// ── Modal crear documento ───────────────────────────────────────────────────
function ModalCrear({ tipo, onClose, onGuardado }) {
  const esCotizacion = tipo === 'cotizacion';
  const [productos, setProductos]     = useState([]);
  const [metodosPago, setMetodosPago] = useState([]);
  const [clienteSel, setClienteSel]   = useState(null);
  const [detalles, setDetalles]       = useState([]);
  const [form, setForm]               = useState({ notas: '', impuesto: 0, metodoPago: '', lineaNegocio: 'ventas' });
  const [guardando, setGuardando]     = useState(false);
  const [aviso, setAviso]             = useState('');
  const [mostrarSelector, setMostrarSelector] = useState(false);

  useEffect(() => {
    Promise.all([productosApi.listar(), mpApi.listar()]).then(([p, m]) => {
      setProductos(p.data);
      setMetodosPago(m.data.filter(x => x.activo));
    });
  }, []);

  const agregarProducto = (p) => {
    if (!esCotizacion && p.stock <= 0) return setAviso(`"${p.nombre}" no tiene stock disponible`);
    if (esCotizacion && p.stock <= 0) setAviso(`⚠ "${p.nombre}" no tiene stock ahora, pero puede cotizarse`);
    else setAviso('');
    setDetalles(prev => [...prev, {
      productoId: p.id, descripcion: p.nombre,
      cantidad: 1, precio: p.precio, stockDisponible: p.stock,
    }]);
  };

  const agregarServicio = () => {
    setDetalles(prev => [...prev, { productoId: null, descripcion: '', cantidad: 1, precio: '', stockDisponible: null }]);
  };

  const agregarManoObra = () => {
    setDetalles(prev => [...prev, { productoId: null, descripcion: 'Mano de obra - ', cantidad: 1, precio: '', stockDisponible: null, esManoObra: true }]);
  };

  const agregarDesdeSelector = (items) => {
    const nuevos = [];
    for (const p of items) {
      if (!esCotizacion && p.stock <= 0) { setAviso(`"${p.nombre}" no tiene stock disponible`); continue; }
      nuevos.push({ productoId: p.id, descripcion: p.nombre, cantidad: p.cantidadSel, precio: p.precio, stockDisponible: p.stock });
    }
    setDetalles(prev => [...prev, ...nuevos]);
    setMostrarSelector(false);
    if (nuevos.length > 0) setAviso('');
  };

  const updDetalle = (i, k, v) => {
    const n = [...detalles];
    n[i] = { ...n[i], [k]: v };
    if (k === 'cantidad' && !esCotizacion && n[i].stockDisponible !== null && Number(v) > n[i].stockDisponible)
      setAviso(`Stock insuficiente para "${n[i].descripcion}". Máximo: ${n[i].stockDisponible}`);
    else if (k === 'cantidad') setAviso('');
    setDetalles(n);
  };

  const subtotal = detalles.reduce((s, d) => s + Number(d.cantidad || 0) * Number(d.precio || 0), 0);
  const total    = subtotal + Number(form.impuesto || 0);

  const stockOk = esCotizacion || detalles.every(d =>
    d.stockDisponible === null || Number(d.cantidad) <= d.stockDisponible
  );
  const canGuardar = clienteSel &&
    (clienteSel.tipo === 'existente' || clienteSel.nombre?.trim()) &&
    detalles.length > 0 && stockOk;

  const guardar = async () => {
    if (!clienteSel) { toast.warning('Selecciona o crea un cliente'); return; }
    if (detalles.length === 0) { toast.warning('Agrega al menos un producto o servicio'); return; }
    if (!stockOk) { toast.warning('Hay productos con stock insuficiente'); return; }
    setGuardando(true);
    try {
      let clienteId;
      if (clienteSel.tipo === 'existente') {
        clienteId = clienteSel.cliente.id;
      } else {
        const nombre = clienteSel.nombre?.trim();
        if (!nombre) { setGuardando(false); toast.warning('Ingresa el nombre del cliente'); return; }
        const existing = await clientesApi.listar({ buscar: nombre });
        const exacto = existing.data.find(c => c.nombre.toLowerCase() === nombre.toLowerCase());
        clienteId = exacto ? exacto.id : (await clientesApi.crear({ nombre })).data.id;
      }
      await api.crear({
        tipo,
        clienteId,
        notas: form.notas,
        impuesto: Number(form.impuesto || 0),
        metodoPago: form.metodoPago || undefined,
        lineaNegocio: form.lineaNegocio || 'general',
        detalles: detalles.map(d => ({
          productoId: d.productoId || undefined,
          descripcion: d.descripcion,
          cantidad: Number(d.cantidad),
          precio: Number(d.precio),
        })),
      });
      onGuardado();
    } catch (e) {
      toast.error('Error: ' + (e.response?.data?.error || e.message));
    } finally { setGuardando(false); }
  };

  return (
    <Modal titulo={esCotizacion ? 'Nueva Cotización' : 'Nueva Factura'} onClose={onClose} size="xl">
      <div className="space-y-5">
        <BuscadorCliente onSeleccionar={setClienteSel} />

        {/* Items */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <p className="text-sm font-semibold text-slate-700">Productos / Servicios</p>
            <div style={{ display: 'flex', gap: 6 }}>
              <button onClick={agregarManoObra}
                style={{ fontSize: '0.75rem', fontWeight: 600, color: '#7c3aed', border: '1.5px solid #ddd6fe', borderRadius: 8, padding: '5px 12px', background: 'transparent', cursor: 'pointer' }}>
                + Mano de obra
              </button>
              <button onClick={agregarServicio}
                className="text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors hover:bg-slate-50">
                + Servicio manual
              </button>
            </div>
          </div>

          {/* Barra de búsqueda rápida + botón selector múltiple */}
          <div style={{ display: 'flex', gap: 8, marginBottom: 10 }}>
            <div style={{ flex: 1 }}>
              <BuscadorProducto productos={productos} onSeleccionar={agregarProducto} esCotizacion={esCotizacion} idsEnLista={new Set(detalles.map(d => d.productoId).filter(Boolean))} />
            </div>
            <button onClick={() => setMostrarSelector(v => !v)}
              style={{ flexShrink: 0, fontSize: '0.8rem', fontWeight: 700, padding: '0 14px', borderRadius: 10, border: mostrarSelector ? '1.5px solid var(--color-toyo)' : '1.5px solid var(--color-gris-300)', background: mostrarSelector ? 'rgba(220,38,38,.06)' : 'transparent', color: mostrarSelector ? 'var(--color-toyo)' : 'var(--color-gris-600)', cursor: 'pointer', whiteSpace: 'nowrap' }}>
              Agregar varios
            </button>
          </div>

          {mostrarSelector && (
            <SelectorProductos
              productos={productos}
              esCotizacion={esCotizacion}
              onAgregar={agregarDesdeSelector}
              idsEnLista={new Set(detalles.map(d => d.productoId).filter(Boolean))}
              onCerrar={() => setMostrarSelector(false)}
            />
          )}

          {aviso && (
            <div className={`flex items-center gap-2 p-2.5 rounded-xl mb-3 ${aviso.startsWith('⚠') ? 'bg-amber-50 border border-amber-200' : 'bg-red-50 border border-red-200'}`}>
              <AlertTriangle size={13} className={aviso.startsWith('⚠') ? 'text-amber-600' : 'text-red-600'} />
              <span className={`text-xs font-medium ${aviso.startsWith('⚠') ? 'text-amber-700' : 'text-red-700'}`}>{aviso}</span>
            </div>
          )}

          {detalles.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 gap-0 bg-slate-50 px-3 py-2 border-b border-slate-200">
                <div className="col-span-5 text-xs font-semibold text-slate-500">Descripción</div>
                <div className="col-span-2 text-xs font-semibold text-slate-500 text-center">Cant.</div>
                <div className="col-span-3 text-xs font-semibold text-slate-500 text-right">Precio</div>
                <div className="col-span-2 text-xs font-semibold text-slate-500 text-right">Sub.</div>
              </div>
              {detalles.map((d, i) => {
                const excede = !esCotizacion && d.stockDisponible !== null && Number(d.cantidad) > d.stockDisponible;
                return (
                  <div key={i} className={`grid grid-cols-12 gap-2 p-3 border-b border-slate-100 items-center last:border-0 ${excede ? 'bg-red-50' : ''}`}>
                    <div className="col-span-5">
                      <input type="text" placeholder="Descripción..." value={d.descripcion}
                        onChange={e => updDetalle(i, 'descripcion', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-400" />
                      {d.stockDisponible !== null && (
                        <p className={`text-xs mt-0.5 ${excede ? 'text-red-600 font-medium' : 'text-slate-400'}`}>
                          {excede ? `⚠ Máx: ${d.stockDisponible}` : `Stock: ${d.stockDisponible}`}
                        </p>
                      )}
                    </div>
                    <div className="col-span-2">
                      <input type="number" min="1" value={d.cantidad}
                        onChange={e => updDetalle(i, 'cantidad', e.target.value)}
                        className={`w-full text-xs border rounded-lg px-2 py-1.5 outline-none text-center ${excede ? 'border-red-400 bg-red-50' : 'border-slate-200 focus:border-red-400'}`} />
                    </div>
                    <div className="col-span-3">
                      <input type="number" value={d.precio}
                        onChange={e => updDetalle(i, 'precio', e.target.value)}
                        className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-400 text-right" />
                    </div>
                    <div className="col-span-2 flex items-center justify-end gap-1">
                      <span className="text-xs font-bold text-slate-700">{fmt(Number(d.cantidad || 0) * Number(d.precio || 0))}</span>
                      <button onClick={() => { setDetalles(detalles.filter((_, j) => j !== i)); setAviso(''); }}
                        className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-8 text-center">
              <p className="text-sm text-slate-400 font-medium">Busca un producto arriba o agrega un servicio manual</p>
            </div>
          )}
        </div>

        {/* Totales y notas */}
        <div className="grid grid-cols-2 gap-4">
          <Input label={`Impuesto / Recargo ($)`} type="number"
            value={form.impuesto} onChange={e => setForm({ ...form, impuesto: e.target.value })} placeholder="0.00" />
          <Input label="Notas internas (opcionales)" value={form.notas}
            onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Observaciones..." />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Método de pago</label>
            <select value={form.metodoPago} onChange={e => setForm({ ...form, metodoPago: e.target.value })}
              className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-white">
              <option value="">— Sin especificar —</option>
              {metodosPago.map(m => <option key={m.id} value={m.nombre}>{m.nombre}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-semibold text-slate-600 mb-1.5">Línea de negocio</label>
            <select value={form.lineaNegocio} onChange={e => setForm({ ...form, lineaNegocio: e.target.value })}
              className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-white">
              <option value="ventas">Ventas (llantas, rines, accesorios)</option>
              <option value="taller">Taller (latonería, pintura)</option>
              <option value="general">General</option>
            </select>
          </div>
        </div>

        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-500">Subtotal</span><span className="font-medium">{fmt(subtotal)}</span></div>
          {Number(form.impuesto) > 0 && (
            <div className="flex justify-between text-sm mb-1.5"><span className="text-slate-500">Impuesto</span><span className="font-medium">{fmt(Number(form.impuesto))}</span></div>
          )}
          <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
            <span>Total</span>
            <span style={{ color: 'var(--color-toyo)' }}>{fmt(total)}</span>
          </div>
        </div>
      </div>

      <ModalFooter>
        <Btn variant="secondary" onClick={onClose}>Cancelar</Btn>
        <Btn onClick={guardar} disabled={guardando || !canGuardar}>
          {guardando ? 'Guardando...' : esCotizacion ? 'Guardar Cotización' : 'Emitir Factura'}
        </Btn>
      </ModalFooter>
    </Modal>
  );
}

// ── Modal detalle ───────────────────────────────────────────────────────────
function ModalDetalle({ docId, onClose, onConvertir, onEstado }) {
  const [doc, setDoc]         = useState(null);
  const [cargando, setCargando] = useState(true);
  const [convirtiendo, setConv] = useState(false);

  useEffect(() => {
    setCargando(true);
    api.obtener(docId).then(r => setDoc(r.data)).finally(() => setCargando(false));
  }, [docId]);

  if (cargando || !doc) return (
    <Modal titulo="Cargando..." onClose={onClose}>
      <PageLoader />
    </Modal>
  );

  const esFactura  = doc.tipo === 'factura';
  const estados    = esFactura ? ESTADOS_FACTURA : ESTADOS_COTIZACION;

  const convertir = async () => {
    if (!await confirmar('Se convertirá en factura y se descontará el stock de los productos.', '¿Convertir cotización en factura?')) return;
    setConv(true);
    try {
      await api.convertir(doc.id);
      onConvertir();
    } catch (e) {
      toast.error('Error: ' + (e.response?.data?.error || e.message));
    } finally { setConv(false); }
  };

  return (
    <Modal titulo={`${esFactura ? 'Factura' : 'Cotización'} ${doc.numero}`} onClose={onClose} size="lg">
      {/* Info superior */}
      <div className="grid grid-cols-3 gap-3 mb-5">
        <div className="p-3 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-400 mb-1">Cliente</p>
          <p className="font-semibold text-sm text-slate-800">{doc.cliente?.nombre}</p>
          {doc.cliente?.telefono && <p className="text-xs text-slate-400 mt-0.5">{doc.cliente.telefono}</p>}
        </div>
        <div className="p-3 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-400 mb-1">Fecha</p>
          <p className="font-semibold text-sm">{fmtF(doc.createdAt)}</p>
          {!esFactura && <p className="text-xs text-amber-600 mt-0.5">Vence: {fechaVencimiento(doc.createdAt)}</p>}
        </div>
        <div className="p-3 bg-slate-50 rounded-xl">
          <p className="text-xs text-slate-400 mb-1">Estado</p>
          <div className="flex items-center gap-2">
            <Badge variant={estadoVariant[doc.estado]}>{doc.estado}</Badge>
          </div>
          <select value={doc.estado}
            onChange={e => { api.cambiarEstado(doc.id, e.target.value).then(() => { setDoc({ ...doc, estado: e.target.value }); onEstado(); }); }}
            className="mt-2 text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none focus:border-red-400 w-full">
            {estados.map(e => <option key={e} value={e}>{e}</option>)}
          </select>
        </div>
      </div>

      {/* Items */}
      <div className="border border-slate-200 rounded-xl overflow-hidden mb-4">
        <div className="grid grid-cols-12 bg-slate-50 px-4 py-2.5 border-b border-slate-200">
          <div className="col-span-6 text-xs font-semibold text-slate-500">Descripción</div>
          <div className="col-span-2 text-xs font-semibold text-slate-500 text-center">Cant.</div>
          <div className="col-span-2 text-xs font-semibold text-slate-500 text-right">P. Unit.</div>
          <div className="col-span-2 text-xs font-semibold text-slate-500 text-right">Subtotal</div>
        </div>
        {doc.detalles?.map((d, i) => (
          <div key={i} className="grid grid-cols-12 px-4 py-3 border-b border-slate-100 last:border-0 text-sm items-center">
            <div className="col-span-6 font-medium text-slate-800">{d.descripcion || d.producto?.nombre || 'Servicio'}</div>
            <div className="col-span-2 text-center text-slate-600">{d.cantidad}</div>
            <div className="col-span-2 text-right text-slate-600">{fmt(d.precio)}</div>
            <div className="col-span-2 text-right font-bold text-slate-900">{fmt(d.subtotal)}</div>
          </div>
        ))}
      </div>

      {/* Totales */}
      <div className="p-4 bg-slate-50 rounded-xl space-y-2 mb-2">
        <div className="flex justify-between text-sm"><span className="text-slate-500">Subtotal</span><span className="font-medium">{fmt(doc.subtotal)}</span></div>
        {doc.impuesto > 0 && (
          <div className="flex justify-between text-sm"><span className="text-slate-500">Impuesto / Recargo</span><span className="font-medium">{fmt(doc.impuesto)}</span></div>
        )}
        <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
          <span>Total</span>
          <span style={{ color: 'var(--color-toyo)' }}>{fmt(doc.total)}</span>
        </div>
      </div>

      {doc.notas && (
        <div className="px-3 py-2 bg-amber-50 border border-amber-100 rounded-lg text-xs text-amber-700">
          <span className="font-semibold">Notas: </span>{doc.notas}
        </div>
      )}

      <ModalFooter>
        {!esFactura && (
          <Btn onClick={convertir} disabled={convirtiendo} icon={RefreshCw}>
            {convirtiendo ? 'Convirtiendo...' : 'Convertir a Factura'}
          </Btn>
        )}
        <Btn variant="secondary" onClick={() => compartirWA(doc)} icon={MessageCircle}>WhatsApp</Btn>
        <Btn variant="secondary" onClick={() => abrirImpresion(doc)} icon={Printer}>Imprimir / PDF</Btn>
      </ModalFooter>
    </Modal>
  );
}

// ── Componente principal ────────────────────────────────────────────────────
export default function Facturas() {
  const { tienePermiso } = useAuth();

  const puedeFacturas     = tienePermiso('facturas-facturas');
  const puedeCotizaciones = tienePermiso('facturas-cotizaciones');

  const tabsDisponibles = useMemo(() => [
    puedeFacturas     && ['facturas',     Receipt,       'Facturas'],
    puedeCotizaciones && ['cotizaciones', ClipboardList, 'Cotizaciones'],
  ].filter(Boolean), [puedeFacturas, puedeCotizaciones]);

  const [tab, setTab]             = useState(() => puedeFacturas ? 'facturas' : 'cotizaciones');
  const [lista, setLista]         = useState([]);
  const [cargando, setCargando]   = useState(true);
  const [filtroEstado, setFiltro] = useState('');
  const [modalCrear, setModalCrear] = useState(null);  // 'factura' | 'cotizacion'
  const [docId, setDocId]         = useState(null);

  const esCotTab = tab === 'cotizaciones';
  const estados  = esCotTab ? ESTADOS_COTIZACION : ESTADOS_FACTURA;

  const cargar = () => {
    setCargando(true);
    api.listar({ tipo: tab === 'cotizaciones' ? 'cotizacion' : 'factura', estado: filtroEstado || undefined })
      .then(r => setLista(r.data?.data ?? r.data))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [tab, filtroEstado]);

  const cambiarEstadoLista = async (id, nuevoEstado) => {
    try {
      await api.cambiarEstado(id, nuevoEstado);
      setLista(prev => prev.map(f => f.id === id ? { ...f, estado: nuevoEstado } : f));
    } catch { toast.error('Error al cambiar estado'); }
  };

  const totalGeneral = lista.filter(f => !['cancelada', 'rechazada'].includes(f.estado))
    .reduce((s, f) => s + f.total, 0);

  return (
    <div className="space-y-5">
      {/* Header */}
      <SectionHeader
        title={esCotTab ? 'Cotizaciones' : 'Facturas'}
        subtitle={`${lista.length} documentos · ${fmt(totalGeneral)}`}
        action={
          <div className="flex gap-2">
            {puedeCotizaciones && (
              <Btn variant="secondary" icon={ClipboardList}
                onClick={() => { setModalCrear('cotizacion'); }}>
                Nueva Cotización
              </Btn>
            )}
            {puedeFacturas && (
              <Btn icon={Receipt}
                onClick={() => { setModalCrear('factura'); }}>
                Nueva Factura
              </Btn>
            )}
          </div>
        }
      />

      {/* Tabs */}
      {tabsDisponibles.length > 1 && (
        <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-fit">
          {tabsDisponibles.map(([key, Icon, label]) => (
            <button key={key} onClick={() => { setTab(key); setFiltro(''); }}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-all ${tab === key ? 'bg-white shadow-sm text-slate-900' : 'text-slate-500 hover:text-slate-700'}`}>
              <Icon size={15} />
              {label}
            </button>
          ))}
        </div>
      )}

      {/* Filtros de estado */}
      <div className="flex gap-2 flex-wrap">
        {['', ...estados].map(e => (
          <button key={e} onClick={() => setFiltro(e)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${filtroEstado === e ? 'bg-slate-900 text-white' : 'bg-white border border-slate-200 text-slate-600 hover:border-slate-400'}`}>
            {e || 'Todos'}
          </button>
        ))}
      </div>

      {/* Lista */}
      <style>{`
        .fac-tabla { display: block; }
        .fac-cards { display: none; }
        @media (max-width: 700px) {
          .fac-tabla { display: none; }
          .fac-cards { display: flex; flex-direction: column; gap: 8px; }
        }
      `}</style>

      <div className="fac-tabla bg-white rounded-2xl border border-slate-200/80 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        {cargando ? <PageLoader /> : lista.length === 0 ? (
          <EmptyState icon={esCotTab ? ClipboardList : FileText}
            title={esCotTab ? 'No hay cotizaciones' : 'No hay facturas'}
            description={esCotTab ? 'Crea la primera cotización para un cliente' : 'Emite la primera factura'}
            action={<Btn icon={Plus} onClick={() => setModalCrear(esCotTab ? 'cotizacion' : 'factura')}>{esCotTab ? 'Nueva Cotización' : 'Nueva Factura'}</Btn>}
          />
        ) : (
          <Table headers={['N° Documento', 'Cliente', 'Fecha', { label: 'Total', align: 'right' }, { label: 'Estado', align: 'center' }, { label: 'Acciones', align: 'center' }]}>
            {lista.map((f, i) => (
              <tr key={f.id} className={`hover:bg-slate-50/60 cursor-pointer transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`} onClick={() => setDocId(f.id)}>
                <Td><span className={`font-mono text-xs font-bold px-2 py-1 rounded-lg ${esCotTab ? 'text-blue-700 bg-blue-50' : 'text-slate-600 bg-slate-100'}`}>{f.numero}</span></Td>
                <Td><span className="font-medium text-slate-800">{f.cliente?.nombre}</span></Td>
                <Td><span className="text-slate-500 text-xs">{fmtF(f.createdAt)}</span></Td>
                <Td align="right"><span className="font-bold text-slate-900">{fmt(f.total)}</span></Td>
                <Td align="center" onClick={e => e.stopPropagation()}>
                  <select
                    value={f.estado}
                    onChange={e => cambiarEstadoLista(f.id, e.target.value)}
                    className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none focus:border-red-400 capitalize cursor-pointer"
                    style={{ fontSize: '0.72rem', color: estadoVariant[f.estado] === 'success' ? '#059669' : estadoVariant[f.estado] === 'danger' ? '#dc2626' : estadoVariant[f.estado] === 'warning' ? '#d97706' : '#475569' }}
                  >
                    {estados.map(e => <option key={e} value={e}>{e}</option>)}
                  </select>
                </Td>
                <Td align="center" onClick={e => e.stopPropagation()}>
                  <div className="flex items-center justify-center gap-1">
                    <button onClick={() => compartirWA(f)} className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors" title="WhatsApp"><MessageCircle size={14} /></button>
                    <button onClick={() => abrirImpresion(f)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors" title="Imprimir"><Printer size={14} /></button>
                    <button onClick={() => setDocId(f.id)} className="p-1.5 rounded-lg text-slate-400 hover:text-blue-600 hover:bg-blue-50 transition-colors" title="Ver detalle"><FileText size={14} /></button>
                  </div>
                </Td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {!cargando && lista.length > 0 && (
        <div className="fac-cards">
          {lista.map(f => (
            <div key={f.id} className="bg-white rounded-2xl border border-slate-200/80 p-3 cursor-pointer active:bg-slate-50"
              style={{ boxShadow: '0 1px 3px rgba(0,0,0,.05)' }} onClick={() => setDocId(f.id)}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap mb-1">
                    <span className={`font-mono text-xs font-bold px-2 py-0.5 rounded-lg ${esCotTab ? 'text-blue-700 bg-blue-50' : 'text-slate-600 bg-slate-100'}`}>{f.numero}</span>
                    <Badge variant={estadoVariant[f.estado]}>{f.estado}</Badge>
                  </div>
                  <p className="font-semibold text-slate-900 text-sm truncate">{f.cliente?.nombre}</p>
                  <p className="text-xs text-slate-400 mt-0.5">{fmtF(f.createdAt)}</p>
                </div>
                <div className="flex flex-col items-end gap-2 shrink-0">
                  <span className="font-bold text-slate-900 text-sm">{fmt(f.total)}</span>
                  <div className="flex gap-1" onClick={e => e.stopPropagation()}>
                    <button onClick={() => compartirWA(f)} className="p-1.5 rounded-lg text-slate-400 hover:text-green-600 hover:bg-green-50 transition-colors"><MessageCircle size={14} /></button>
                    <button onClick={() => abrirImpresion(f)} className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"><Printer size={14} /></button>
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal crear */}
      {modalCrear && (
        <ModalCrear tipo={modalCrear} onClose={() => setModalCrear(null)}
          onGuardado={() => { setModalCrear(null); cargar(); }} />
      )}

      {/* Modal detalle */}
      {docId && (
        <ModalDetalle docId={docId} onClose={() => setDocId(null)}
          onConvertir={() => { setDocId(null); setTab('facturas'); setFiltro(''); cargar(); }}
          onEstado={cargar} />
      )}
    </div>
  );
}
