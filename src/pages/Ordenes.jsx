import { useEffect, useRef, useState } from 'react';
import { ordenes as api, clientes as clientesApi } from '../api';
import { Plus, Wrench, Car, ChevronRight, Calendar, User, Camera, Search, UserPlus, MessageSquare, Send, FileText, Loader2 } from 'lucide-react';
import { Modal, ModalFooter, Btn, Input, Textarea, Badge, PageLoader, EmptyState, SectionHeader } from '../components/UI';
import { toast } from '../utils/toast';
import { GaleriaUploader } from '../components/ImagenUploader';

const ESTADOS = [
  { valor: 'recibido',   label: 'Recibido',    variant: 'info',    dot: 'bg-blue-500' },
  { valor: 'en_proceso', label: 'En Proceso',  variant: 'warning', dot: 'bg-amber-500' },
  { valor: 'listo',      label: 'Listo',       variant: 'success', dot: 'bg-emerald-500' },
  { valor: 'entregado',  label: 'Entregado',   variant: 'default', dot: 'bg-slate-400' },
];

const estadoInfo = (v) => ESTADOS.find(e => e.valor === v) || ESTADOS[0];

// ── Buscador de cliente ────────────────────────────────────────────────────
function BuscadorCliente({ onSeleccionar }) {
  const [query, setQuery] = useState('');
  const [resultados, setResultados] = useState([]);
  const [buscando, setBuscando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const [clienteElegido, setClienteElegido] = useState(null);
  const [modoNuevo, setModoNuevo] = useState(false);
  const [nombreNuevo, setNombreNuevo] = useState('');
  const timer = useRef(null);
  const ref = useRef(null);

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
    setClienteElegido(c);
    setQuery(c.nombre);
    setAbierto(false);
    setModoNuevo(false);
    onSeleccionar({ tipo: 'existente', cliente: c });
  };

  const activarNuevo = () => {
    setModoNuevo(true);
    setNombreNuevo(query);
    setAbierto(false);
    setClienteElegido(null);
    onSeleccionar({ tipo: 'nuevo', nombre: query });
  };

  const actualizarNombre = (v) => {
    setNombreNuevo(v);
    onSeleccionar({ tipo: 'nuevo', nombre: v });
  };

  const limpiar = () => {
    setQuery(''); setClienteElegido(null); setModoNuevo(false);
    setNombreNuevo(''); setResultados([]);
    onSeleccionar(null);
  };

  if (modoNuevo) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2 p-2.5 rounded-xl bg-emerald-50 border border-emerald-200">
          <UserPlus size={13} className="text-emerald-600 shrink-0" />
          <span className="text-xs font-medium text-emerald-700">Nuevo cliente (se creará al guardar)</span>
          <button onClick={limpiar} className="ml-auto text-xs text-emerald-600 hover:text-emerald-800 font-medium">Cambiar</button>
        </div>
        <Input
          label="Nombre del cliente *"
          value={nombreNuevo}
          onChange={e => actualizarNombre(e.target.value)}
          placeholder="Nombre completo"
        />
      </div>
    );
  }

  return (
    <div ref={ref} style={{ position: 'relative' }}>
      <label className="etiqueta">Cliente *</label>
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gris-400)', pointerEvents: 'none' }} />
        <input
          type="text"
          className="campo"
          style={{ paddingLeft: 32 }}
          placeholder="Buscar cliente por nombre..."
          value={query}
          onChange={e => { setQuery(e.target.value); setAbierto(true); setClienteElegido(null); }}
          onFocus={() => { if (query) setAbierto(true); }}
          autoComplete="off"
        />
        {clienteElegido && (
          <span style={{
            position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
            fontSize: '0.7rem', fontWeight: 700, color: '#059669',
          }}>✓</span>
        )}
      </div>

      {abierto && query.trim() && (
        <div style={{
          position: 'absolute', top: '100%', left: 0, right: 0, zIndex: 100,
          background: '#fff', border: '1px solid var(--color-gris-200)',
          borderRadius: 10, boxShadow: '0 4px 20px rgba(0,0,0,.12)',
          marginTop: 4, overflow: 'hidden',
        }}>
          {buscando && (
            <div style={{ padding: '10px 14px', fontSize: '0.8rem', color: 'var(--color-gris-400)' }}>Buscando...</div>
          )}
          {!buscando && resultados.map(c => (
            <button key={c.id} onClick={() => elegir(c)}
              style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '10px 14px', textAlign: 'left', border: 'none', background: 'transparent', cursor: 'pointer', borderBottom: '1px solid var(--color-gris-100)' }}
              onMouseEnter={e => e.currentTarget.style.background = 'var(--color-gris-50)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <span style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--color-gris-900)' }}>{c.nombre}</span>
              {c.cedula && <span style={{ fontSize: '0.75rem', color: 'var(--color-gris-400)' }}>{c.cedula} {c.telefono ? `· ${c.telefono}` : ''}</span>}
            </button>
          ))}
          {!buscando && (
            <button onClick={activarNuevo}
              style={{ display: 'flex', alignItems: 'center', gap: 7, width: '100%', padding: '10px 14px', border: 'none', background: 'transparent', cursor: 'pointer', color: '#dc2626' }}
              onMouseEnter={e => e.currentTarget.style.background = 'rgba(220,38,38,.05)'}
              onMouseLeave={e => e.currentTarget.style.background = 'transparent'}
            >
              <UserPlus size={13} />
              <span style={{ fontSize: '0.83rem', fontWeight: 600 }}>
                {resultados.length === 0 ? `Crear "${query}"` : `Crear nuevo cliente "${query}"`}
              </span>
            </button>
          )}
        </div>
      )}
    </div>
  );
}

// ── Card de orden ──────────────────────────────────────────────────────────
function OrdenCard({ orden, onCambiarEstado, onVerDetalle }) {
  const est = estadoInfo(orden.estado);
  const fecha = new Date(orden.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short' });

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-md transition-all duration-200"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
      <div className="flex items-start justify-between gap-3 mb-4">
        <div>
          <div className="flex items-center gap-2 mb-1">
            <span className="font-mono text-xs font-bold text-slate-400">{orden.numero}</span>
            <Badge variant={est.variant}>
              <span className={`w-1.5 h-1.5 rounded-full ${est.dot} inline-block`} />
              {est.label}
            </Badge>
          </div>
          <div className="flex items-center gap-1.5 text-sm font-semibold text-slate-900">
            <Car size={14} className="text-slate-400 shrink-0" />
            {orden.vehiculo?.marca} {orden.vehiculo?.modelo}
            {orden.vehiculo?.placa && <span className="text-xs font-normal text-slate-400">· {orden.vehiculo.placa}</span>}
          </div>
        </div>
        <div className="flex items-center gap-1.5 text-xs text-slate-400 shrink-0">
          <Calendar size={11} />
          {fecha}
        </div>
      </div>

      <p className="text-sm text-slate-600 line-clamp-2 mb-4">{orden.descripcion}</p>

      <div className="flex items-center gap-2 pt-3 border-t border-slate-100">
        <div className="flex items-center gap-1.5 flex-1 min-w-0">
          <User size={11} className="text-slate-400 shrink-0" />
          <span className="text-xs text-slate-500 truncate">{orden.vehiculo?.cliente?.nombre}</span>
        </div>
        <select
          value={orden.estado}
          onChange={e => onCambiarEstado(orden.id, e.target.value)}
          onClick={e => e.stopPropagation()}
          className="text-xs border border-slate-200 rounded-lg px-2 py-1 bg-white outline-none focus:border-red-400 text-slate-600"
        >
          {ESTADOS.map(e => <option key={e.valor} value={e.valor}>{e.label}</option>)}
        </select>
        <button
          onClick={() => onVerDetalle(orden)}
          className="flex items-center gap-0.5 text-xs text-red-600 hover:text-red-700 font-medium shrink-0"
        >
          Ver <ChevronRight size={12} />
        </button>
      </div>
    </div>
  );
}

// ── Página principal ───────────────────────────────────────────────────────
export default function Ordenes() {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroEstado, setFiltroEstado] = useState('');
  const [modal, setModal] = useState(null);
  const [detalle, setDetalle] = useState(null);
  const [guardando, setGuardando] = useState(false);
  const [clienteSeleccion, setClienteSeleccion] = useState(null);
  const [vehiculoForm, setVehiculoForm] = useState({ marca: 'Toyota', modelo: '', placa: '', color: '' });
  const [trabajoForm, setTrabajoForm] = useState({ descripcion: '', observaciones: '' });

  // Notas
  const [notas, setNotas] = useState([]);
  const [notaTexto, setNotaTexto] = useState('');
  const [enviandoNota, setEnviandoNota] = useState(false);

  // Convertir a factura
  const [convirtiendo, setConvirtiendo] = useState(false);

  const cargar = () => {
    setCargando(true);
    api.listar({ estado: filtroEstado || undefined })
      .then(r => setLista(r.data?.data ?? r.data))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [filtroEstado]);

  // Cargar notas cuando se abre el detalle
  useEffect(() => {
    if (!detalle) { setNotas([]); setNotaTexto(''); return; }
    api.notas(detalle.id).then(r => setNotas(r.data)).catch(() => {});
  }, [detalle?.id]);

  const enviarNota = async () => {
    if (!notaTexto.trim() || !detalle) return;
    setEnviandoNota(true);
    try {
      const r = await api.agregarNota(detalle.id, notaTexto.trim());
      setNotas(n => [...n, r.data]);
      setNotaTexto('');
    } catch (e) { toast.error('Error al agregar nota'); }
    finally { setEnviandoNota(false); }
  };

  const convertirFactura = async () => {
    if (!detalle) return;
    setConvirtiendo(true);
    try {
      const r = await api.convertirFactura(detalle.id);
      toast.success(`Factura ${r.data.numero} creada correctamente`);
      setDetalle(null);
    } catch (e) { toast.error(e.response?.data?.error || 'Error al convertir a factura'); }
    finally { setConvirtiendo(false); }
  };

  const abrirNuevo = () => {
    setClienteSeleccion(null);
    setVehiculoForm({ marca: 'Toyota', modelo: '', placa: '', color: '' });
    setTrabajoForm({ descripcion: '', observaciones: '' });
    setModal('nuevo');
  };

  const crear = async () => {
    if (!clienteSeleccion) { toast.warning('Selecciona o crea un cliente'); return; }
    if (!trabajoForm.descripcion) { toast.warning('Describe el trabajo a realizar'); return; }
    setGuardando(true);
    try {
      let clienteId;
      if (clienteSeleccion.tipo === 'existente') {
        clienteId = clienteSeleccion.cliente.id;
      } else {
        const nombre = clienteSeleccion.nombre?.trim();
        if (!nombre) { toast.warning('Ingresa el nombre del cliente'); return; }
        // Try to find existing, then create if not found
        const existing = await clientesApi.listar({ buscar: nombre });
        const exacto = existing.data.find(c => c.nombre.toLowerCase() === nombre.toLowerCase());
        if (exacto) {
          clienteId = exacto.id;
        } else {
          const r = await clientesApi.crear({ nombre });
          clienteId = r.data.id;
        }
      }

      const vR = await clientesApi.agregarVehiculo(clienteId, {
        marca: vehiculoForm.marca || 'Toyota',
        modelo: vehiculoForm.modelo || 'No especificado',
        placa: vehiculoForm.placa || undefined,
        color: vehiculoForm.color || undefined,
      });
      await api.crear({
        vehiculoId: vR.data.id,
        descripcion: trabajoForm.descripcion,
        observaciones: trabajoForm.observaciones,
      });
      setModal(null);
      cargar();
    } catch (e) { toast.error('Error: ' + e.message); }
    finally { setGuardando(false); }
  };

  const cambiarEstado = async (id, estado) => {
    await api.cambiarEstado(id, estado);
    cargar();
  };

  const guardarFotos = async (id, campo, urls) => {
    await api.actualizar(id, { [campo]: JSON.stringify(urls) });
    setDetalle(d => ({ ...d, [campo]: JSON.stringify(urls) }));
    cargar();
  };

  const canGuardar = clienteSeleccion &&
    (clienteSeleccion.tipo === 'existente' || clienteSeleccion.nombre?.trim()) &&
    trabajoForm.descripcion;

  const counts = ESTADOS.reduce((acc, e) => {
    acc[e.valor] = lista.filter(o => o.estado === e.valor).length;
    return acc;
  }, {});

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Órdenes de Trabajo"
        subtitle={`${lista.length} órdenes · ${(counts['recibido'] || 0) + (counts['en_proceso'] || 0)} activas`}
        action={<Btn icon={Plus} onClick={abrirNuevo}>Nueva Orden</Btn>}
      />

      {/* Kanban tabs */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => setFiltroEstado('')}
          className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${!filtroEstado ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-300 text-slate-600 hover:border-slate-400'}`}
        >
          Todas
          <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${!filtroEstado ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
            {lista.length}
          </span>
        </button>
        {ESTADOS.map(e => (
          <button
            key={e.valor}
            onClick={() => setFiltroEstado(e.valor === filtroEstado ? '' : e.valor)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${filtroEstado === e.valor ? 'bg-slate-900 text-white shadow-sm' : 'bg-white border border-slate-300 text-slate-600 hover:border-slate-400'}`}
          >
            <span className={`w-2 h-2 rounded-full ${e.dot}`} />
            {e.label}
            <span className={`text-xs px-1.5 py-0.5 rounded-full font-bold ${filtroEstado === e.valor ? 'bg-white/20 text-white' : 'bg-slate-100 text-slate-500'}`}>
              {counts[e.valor] || 0}
            </span>
          </button>
        ))}
      </div>

      {cargando ? (
        <PageLoader />
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200">
          <EmptyState
            icon={Wrench}
            title="No hay órdenes de trabajo"
            description="Registra el primer trabajo del taller"
            action={<Btn icon={Plus} onClick={abrirNuevo}>Nueva Orden</Btn>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {lista.map(o => (
            <OrdenCard key={o.id} orden={o} onCambiarEstado={cambiarEstado} onVerDetalle={setDetalle} />
          ))}
        </div>
      )}

      {/* Modal nueva orden */}
      {modal === 'nuevo' && (
        <Modal titulo="Nueva Orden de Trabajo" onClose={() => setModal(null)} size="lg">
          <div className="space-y-4">
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Cliente</p>
              <BuscadorCliente onSeleccionar={setClienteSeleccion} />
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Vehículo</p>
              <div className="grid grid-cols-2 gap-3">
                <Input label="Marca" value={vehiculoForm.marca} onChange={e => setVehiculoForm(p => ({ ...p, marca: e.target.value }))} placeholder="Toyota" />
                <Input label="Modelo" value={vehiculoForm.modelo} onChange={e => setVehiculoForm(p => ({ ...p, modelo: e.target.value }))} placeholder="Hilux, Corolla..." />
                <Input label="Placa" value={vehiculoForm.placa} onChange={e => setVehiculoForm(p => ({ ...p, placa: e.target.value }))} placeholder="AB123XY" />
                <Input label="Color" value={vehiculoForm.color} onChange={e => setVehiculoForm(p => ({ ...p, color: e.target.value }))} placeholder="Blanco, Negro..." />
              </div>
            </div>
            <div className="p-4 bg-slate-50 rounded-xl border border-slate-200">
              <p className="text-xs font-semibold text-slate-500 uppercase tracking-wide mb-3">Trabajo a Realizar</p>
              <div className="space-y-3">
                <Textarea label="Descripción del trabajo *" value={trabajoForm.descripcion} onChange={e => setTrabajoForm(p => ({ ...p, descripcion: e.target.value }))} rows={3} placeholder="Describe el trabajo a realizar en detalle..." />
                <Textarea label="Observaciones" value={trabajoForm.observaciones} onChange={e => setTrabajoForm(p => ({ ...p, observaciones: e.target.value }))} rows={2} placeholder="Condición del vehículo, detalles adicionales..." />
              </div>
            </div>
          </div>
          <ModalFooter>
            <Btn variant="secondary" onClick={() => setModal(null)} className="flex-1">Cancelar</Btn>
            <Btn onClick={crear} disabled={guardando || !canGuardar} className="flex-1">
              {guardando ? 'Creando...' : 'Crear Orden'}
            </Btn>
          </ModalFooter>
        </Modal>
      )}

      {/* Detalle */}
      {detalle && (
        <Modal titulo={`Orden ${detalle.numero}`} onClose={() => setDetalle(null)} size="lg">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Badge variant={estadoInfo(detalle.estado).variant}>
                <span className={`w-1.5 h-1.5 rounded-full ${estadoInfo(detalle.estado).dot}`} />
                {estadoInfo(detalle.estado).label}
              </Badge>
              <span className="text-xs text-slate-400">
                {new Date(detalle.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'long', year: 'numeric' })}
              </span>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">Cliente</p>
                <p className="font-semibold text-sm text-slate-900">{detalle.vehiculo?.cliente?.nombre}</p>
                {detalle.vehiculo?.cliente?.telefono && (
                  <p className="text-xs text-slate-500 mt-0.5">{detalle.vehiculo.cliente.telefono}</p>
                )}
              </div>
              <div className="p-3 bg-slate-50 rounded-xl">
                <p className="text-xs text-slate-400 mb-1">Vehículo</p>
                <p className="font-semibold text-sm text-slate-900">{detalle.vehiculo?.marca} {detalle.vehiculo?.modelo}</p>
                {detalle.vehiculo?.placa && <p className="text-xs text-slate-500 mt-0.5">Placa: {detalle.vehiculo.placa}</p>}
                {detalle.vehiculo?.color && <p className="text-xs text-slate-500">Color: {detalle.vehiculo.color}</p>}
              </div>
            </div>
            <div className="p-3 bg-slate-50 rounded-xl">
              <p className="text-xs text-slate-400 mb-1">Trabajo</p>
              <p className="text-sm text-slate-800">{detalle.descripcion}</p>
            </div>
            {detalle.observaciones && (
              <div className="p-3 bg-amber-50 rounded-xl border border-amber-100">
                <p className="text-xs text-amber-600 font-medium mb-1">Observaciones</p>
                <p className="text-sm text-amber-900">{detalle.observaciones}</p>
              </div>
            )}

            {/* Fotos antes / después */}
            <div style={{
              display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16,
              padding: '14px 16px', borderRadius: 12,
              background: 'var(--color-gris-50)', border: '1px solid var(--color-gris-200)',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, gridColumn: '1/-1', marginBottom: 4 }}>
                <Camera size={14} style={{ color: 'var(--color-gris-500)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gris-500)' }}>
                  Registro Fotográfico
                </span>
              </div>
              <GaleriaUploader
                label="Antes del trabajo"
                values={(() => { try { return JSON.parse(detalle.imagenesAntes || '[]'); } catch { return []; } })()}
                onChange={urls => guardarFotos(detalle.id, 'imagenesAntes', urls)}
                max={6}
              />
              <GaleriaUploader
                label="Después del trabajo"
                values={(() => { try { return JSON.parse(detalle.imagenesDespues || '[]'); } catch { return []; } })()}
                onChange={urls => guardarFotos(detalle.id, 'imagenesDespues', urls)}
                max={6}
              />
            </div>

            <div>
              <p className="text-xs text-slate-400 mb-2">Actualizar Estado</p>
              <div className="flex gap-2 flex-wrap">
                {ESTADOS.map(e => (
                  <button
                    key={e.valor}
                    onClick={() => { cambiarEstado(detalle.id, e.valor); setDetalle({ ...detalle, estado: e.valor }); }}
                    className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${detalle.estado === e.valor ? 'bg-slate-900 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:border-slate-400'}`}
                  >
                    <span className={`w-1.5 h-1.5 rounded-full ${e.dot}`} />
                    {e.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Notas de progreso */}
            <div style={{ borderTop: '1px solid var(--color-gris-100)', paddingTop: 16 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, marginBottom: 12 }}>
                <MessageSquare size={13} style={{ color: 'var(--color-gris-400)' }} />
                <span style={{ fontSize: '0.75rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gris-500)' }}>
                  Notas de Progreso
                </span>
                {notas.length > 0 && (
                  <span style={{ fontSize: '0.65rem', fontWeight: 700, padding: '1px 6px', borderRadius: 99, background: 'var(--color-gris-100)', color: 'var(--color-gris-600)' }}>
                    {notas.length}
                  </span>
                )}
              </div>

              {/* Timeline de notas */}
              {notas.length > 0 && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 8, marginBottom: 12, maxHeight: 200, overflowY: 'auto' }}>
                  {notas.map(n => (
                    <div key={n.id} style={{ display: 'flex', gap: 10 }}>
                      <div style={{ width: 28, height: 28, borderRadius: 9, background: 'linear-gradient(135deg, var(--color-toyo), #b91c1c)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, fontSize: '0.65rem', fontWeight: 700, color: '#fff' }}>
                        {n.autor?.charAt(0)?.toUpperCase() || 'S'}
                      </div>
                      <div style={{ flex: 1, background: 'var(--color-gris-50)', borderRadius: 10, padding: '8px 12px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 3 }}>
                          <span style={{ fontSize: '0.73rem', fontWeight: 700, color: 'var(--color-gris-700)' }}>{n.autor}</span>
                          <span style={{ fontSize: '0.68rem', color: 'var(--color-gris-400)' }}>
                            {new Date(n.createdAt).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', hour: '2-digit', minute: '2-digit' })}
                          </span>
                        </div>
                        <p style={{ fontSize: '0.8125rem', color: 'var(--color-gris-800)', margin: 0 }}>{n.texto}</p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Input nueva nota */}
              <div style={{ display: 'flex', gap: 8 }}>
                <input
                  type="text"
                  value={notaTexto}
                  onChange={e => setNotaTexto(e.target.value)}
                  onKeyDown={e => { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviarNota(); } }}
                  placeholder="Agregar nota de progreso..."
                  className="campo"
                  style={{ flex: 1, fontSize: '0.8125rem' }}
                />
                <button
                  onClick={enviarNota}
                  disabled={!notaTexto.trim() || enviandoNota}
                  style={{
                    width: 36, height: 36, borderRadius: 9, border: 'none', flexShrink: 0,
                    background: notaTexto.trim() ? 'var(--color-toyo)' : 'var(--color-gris-200)',
                    color: notaTexto.trim() ? '#fff' : 'var(--color-gris-400)',
                    cursor: notaTexto.trim() ? 'pointer' : 'default',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    transition: 'all 0.15s',
                  }}
                >
                  {enviandoNota ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Send size={14} />}
                </button>
              </div>
            </div>

            {/* Convertir a factura */}
            {(detalle.estado === 'listo' || detalle.estado === 'entregado') && detalle.total > 0 && (
              <div style={{ borderTop: '1px solid var(--color-gris-100)', paddingTop: 16 }}>
                <button
                  onClick={convertirFactura}
                  disabled={convirtiendo}
                  style={{
                    width: '100%', padding: '11px', borderRadius: 11, border: 'none',
                    background: convirtiendo ? 'var(--color-gris-200)' : 'linear-gradient(135deg, #059669, #047857)',
                    color: convirtiendo ? 'var(--color-gris-400)' : '#fff',
                    fontWeight: 700, fontSize: '0.875rem', cursor: convirtiendo ? 'wait' : 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
                    boxShadow: convirtiendo ? 'none' : '0 4px 14px rgba(5,150,105,.35)',
                    transition: 'all 0.15s',
                  }}
                >
                  {convirtiendo
                    ? <><Loader2 size={15} style={{ animation: 'spin 1s linear infinite' }} /> Generando factura...</>
                    : <><FileText size={15} /> Generar Factura desde esta Orden</>
                  }
                </button>
              </div>
            )}
          </div>
        </Modal>
      )}
    </div>
  );
}
