import { useEffect, useState } from 'react';
import { compras as api, proveedores as provApi, productos as productosApi } from '../api';
import { Plus, ShoppingBag, Truck, CheckCircle2, XCircle, Clock, Search, Trash2, Package } from 'lucide-react';
import { Modal, ModalFooter, Btn, Input, Badge, PageLoader, EmptyState, SectionHeader, Table, Td } from '../components/UI';
import { toast } from '../utils/toast';
import { confirmar } from '../utils/confirmar';

const fmt = (n) => `$${Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;
const fmtF = (d) => new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });

const ESTADO_INFO = {
  pendiente: { label: 'Pendiente',  variant: 'warning', icon: Clock },
  recibida:  { label: 'Recibida',   variant: 'success', icon: CheckCircle2 },
  cancelada: { label: 'Cancelada',  variant: 'danger',  icon: XCircle },
};

function ModalCrearCompra({ onClose, onGuardado }) {
  const [proveedores, setProveedores] = useState([]);
  const [productos, setProductos]     = useState([]);
  const [provSel, setProvSel]         = useState('');
  const [items, setItems]             = useState([]);
  const [form, setForm]               = useState({ notas: '', impuesto: 0, fechaEstimada: '' });
  const [guardando, setGuardando]     = useState(false);
  const [buscarProd, setBuscarProd]   = useState('');
  const [creandoProv, setCreandoProv] = useState(false);
  const [nuevoProv, setNuevoProv]     = useState('');
  const [guardandoProv, setGuardandoProv] = useState(false);

  useEffect(() => {
    Promise.all([provApi.listar(), productosApi.listar()]).then(([p, pr]) => {
      setProveedores(p.data.filter(x => x.activo));
      setProductos(pr.data.filter(x => x.activo));
    });
  }, []);

  const crearProveedor = async () => {
    if (!nuevoProv.trim()) return;
    setGuardandoProv(true);
    try {
      const r = await provApi.crear({ nombre: nuevoProv.trim() });
      const nuevo = r.data;
      setProveedores(prev => [...prev, nuevo]);
      setProvSel(String(nuevo.id));
      setCreandoProv(false);
      setNuevoProv('');
      toast.success('Proveedor creado');
    } catch (e) { toast.error('Error: ' + (e.response?.data?.error || e.message)); }
    finally { setGuardandoProv(false); }
  };

  const prodsFiltrados = buscarProd.trim()
    ? productos.filter(p => p.nombre.toLowerCase().includes(buscarProd.toLowerCase())).slice(0, 6)
    : [];

  const agregarProducto = (p) => {
    setItems(prev => [...prev, {
      productoId: p.id,
      descripcion: p.nombre,
      cantidad: 1,
      costo: p.costo || p.precio,
      stockActual: p.stock,
    }]);
    setBuscarProd('');
  };

  const agregarItem = () => {
    setItems(prev => [...prev, { productoId: null, descripcion: '', cantidad: 1, costo: '', stockActual: null }]);
  };

  const updItem = (i, k, v) => {
    const n = [...items];
    n[i] = { ...n[i], [k]: v };
    setItems(n);
  };

  const subtotal = items.reduce((s, d) => s + Number(d.cantidad || 0) * Number(d.costo || 0), 0);
  const total    = subtotal + Number(form.impuesto || 0);

  const guardar = async () => {
    if (items.length === 0) { toast.warning('Agrega al menos un producto'); return; }
    if (items.some(i => !i.descripcion || !i.costo)) { toast.warning('Completa descripción y costo en todos los ítems'); return; }
    setGuardando(true);
    try {
      await api.crear({
        proveedorId: provSel ? Number(provSel) : null,
        detalles: items.map(i => ({
          productoId: i.productoId || undefined,
          descripcion: i.descripcion,
          cantidad: Number(i.cantidad),
          costo: Number(i.costo),
        })),
        notas: form.notas || undefined,
        impuesto: Number(form.impuesto || 0),
        fechaEstimada: form.fechaEstimada || undefined,
      });
      toast.success('Orden de compra creada');
      onGuardado();
    } catch (e) {
      toast.error('Error: ' + (e.response?.data?.error || e.message));
    } finally { setGuardando(false); }
  };

  return (
    <Modal titulo="Nueva Orden de Compra" onClose={onClose} size="xl">
      <div className="space-y-5">
        {/* Proveedor */}
        <div>
          <div className="flex items-center justify-between mb-1.5">
            <label className="text-xs font-semibold text-slate-600">Proveedor (opcional)</label>
            {!creandoProv && (
              <button onClick={() => setCreandoProv(true)}
                className="text-xs font-medium text-red-600 hover:text-red-700 transition-colors">
                + Nuevo proveedor
              </button>
            )}
          </div>
          {creandoProv ? (
            <div className="flex gap-2">
              <input
                type="text"
                value={nuevoProv}
                onChange={e => setNuevoProv(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && crearProveedor()}
                placeholder="Nombre del proveedor..."
                className="flex-1 text-sm border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
                autoFocus
              />
              <button onClick={crearProveedor} disabled={guardandoProv || !nuevoProv.trim()}
                className="text-xs font-semibold bg-red-600 text-white px-3 py-2 rounded-xl hover:bg-red-700 disabled:opacity-50 transition-colors">
                {guardandoProv ? '...' : 'Guardar'}
              </button>
              <button onClick={() => { setCreandoProv(false); setNuevoProv(''); }}
                className="text-xs font-medium bg-slate-100 text-slate-600 px-3 py-2 rounded-xl hover:bg-slate-200 transition-colors">
                Cancelar
              </button>
            </div>
          ) : (
            <select
              value={provSel}
              onChange={e => setProvSel(e.target.value)}
              className="w-full text-sm border border-slate-300 rounded-xl px-3 py-2 outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 bg-white">
              <option value="">— Sin proveedor —</option>
              {proveedores.map(p => <option key={p.id} value={p.id}>{p.nombre}</option>)}
            </select>
          )}
        </div>

        {/* Búsqueda de productos */}
        <div>
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-slate-600">Productos a comprar</p>
            <button onClick={agregarItem}
              className="text-xs font-medium text-slate-500 hover:text-slate-700 border border-slate-200 rounded-lg px-3 py-1.5 transition-colors hover:bg-slate-50">
              + Ítem manual
            </button>
          </div>
          <div className="relative mb-3">
            <Search size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            <input
              type="text"
              value={buscarProd}
              onChange={e => setBuscarProd(e.target.value)}
              placeholder="Buscar producto del inventario para agregar..."
              className="w-full pl-9 pr-4 py-2 text-sm border border-slate-300 rounded-xl outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400"
            />
            {prodsFiltrados.length > 0 && (
              <div className="absolute top-full left-0 right-0 z-50 bg-white border border-slate-200 rounded-xl shadow-lg mt-1 overflow-hidden">
                {prodsFiltrados.map(p => (
                  <button key={p.id} onClick={() => agregarProducto(p)}
                    className="flex items-center justify-between w-full px-4 py-2.5 text-left hover:bg-slate-50 transition-colors border-b border-slate-100 last:border-0">
                    <div>
                      <p className="text-sm font-medium text-slate-800">{p.nombre}</p>
                      <p className="text-xs text-slate-400">{p.categoria} · Stock: {p.stock}</p>
                    </div>
                    <span className="text-xs font-semibold text-slate-600">{fmt(p.costo || p.precio)}</span>
                  </button>
                ))}
              </div>
            )}
          </div>

          {items.length > 0 ? (
            <div className="border border-slate-200 rounded-xl overflow-hidden">
              <div className="grid grid-cols-12 bg-slate-50 px-3 py-2 border-b border-slate-200">
                <div className="col-span-5 text-xs font-semibold text-slate-500">Producto / Descripción</div>
                <div className="col-span-2 text-xs font-semibold text-slate-500 text-center">Cant.</div>
                <div className="col-span-3 text-xs font-semibold text-slate-500 text-right">Costo unit.</div>
                <div className="col-span-2 text-xs font-semibold text-slate-500 text-right">Sub.</div>
              </div>
              {items.map((d, i) => (
                <div key={i} className="grid grid-cols-12 gap-2 p-3 border-b border-slate-100 items-center last:border-0">
                  <div className="col-span-5">
                    <input type="text" placeholder="Descripción..." value={d.descripcion}
                      onChange={e => updItem(i, 'descripcion', e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none focus:border-red-400" />
                    {d.stockActual !== null && (
                      <p className="text-xs text-slate-400 mt-0.5">Stock actual: {d.stockActual}</p>
                    )}
                  </div>
                  <div className="col-span-2">
                    <input type="number" min="1" value={d.cantidad}
                      onChange={e => updItem(i, 'cantidad', e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none text-center focus:border-red-400" />
                  </div>
                  <div className="col-span-3">
                    <input type="number" value={d.costo} placeholder="0.00"
                      onChange={e => updItem(i, 'costo', e.target.value)}
                      className="w-full text-xs border border-slate-200 rounded-lg px-2 py-1.5 outline-none text-right focus:border-red-400" />
                  </div>
                  <div className="col-span-2 flex items-center justify-end gap-1">
                    <span className="text-xs font-bold text-slate-700">{fmt(Number(d.cantidad || 0) * Number(d.costo || 0))}</span>
                    <button onClick={() => setItems(items.filter((_, j) => j !== i))}
                      className="w-5 h-5 flex items-center justify-center text-slate-300 hover:text-red-500 transition-colors">
                      <Trash2 size={11} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="border-2 border-dashed border-slate-200 rounded-xl p-6 text-center">
              <p className="text-sm text-slate-400">Busca un producto o agrega un ítem manual</p>
            </div>
          )}
        </div>

        {/* Opciones */}
        <div className="grid grid-cols-3 gap-3">
          <Input label="Impuesto / Recargo ($)" type="number"
            value={form.impuesto} onChange={e => setForm({ ...form, impuesto: e.target.value })} placeholder="0.00" />
          <Input label="Fecha estimada de llegada" type="date"
            value={form.fechaEstimada} onChange={e => setForm({ ...form, fechaEstimada: e.target.value })} />
          <Input label="Notas internas" value={form.notas}
            onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Observaciones..." />
        </div>

        {/* Totales */}
        <div className="p-4 rounded-xl border border-slate-200 bg-slate-50">
          <div className="flex justify-between text-sm mb-1.5">
            <span className="text-slate-500">Subtotal</span><span className="font-medium">{fmt(subtotal)}</span>
          </div>
          {Number(form.impuesto) > 0 && (
            <div className="flex justify-between text-sm mb-1.5">
              <span className="text-slate-500">Impuesto</span><span className="font-medium">{fmt(Number(form.impuesto))}</span>
            </div>
          )}
          <div className="flex justify-between text-base font-bold pt-2 border-t border-slate-200">
            <span>Total compra</span><span className="text-red-600">{fmt(total)}</span>
          </div>
        </div>
      </div>
      <ModalFooter>
        <Btn variant="secondary" onClick={onClose} className="flex-1">Cancelar</Btn>
        <Btn onClick={guardar} disabled={guardando || items.length === 0} className="flex-1">
          {guardando ? 'Guardando...' : 'Crear Orden de Compra'}
        </Btn>
      </ModalFooter>
    </Modal>
  );
}

export default function Compras() {
  const [lista, setLista]           = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [filtro, setFiltro]         = useState('');
  const [modalCrear, setModalCrear] = useState(false);
  const [expandido, setExpandido]   = useState(null);

  const cargar = () => {
    setCargando(true);
    api.listar(filtro ? { estado: filtro } : {})
      .then(r => setLista(r.data))
      .catch(() => toast.error('Error al cargar compras'))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [filtro]);

  const recibirCompra = async (compra) => {
    if (!await confirmar(
      `Se agregarán ${compra.detalles.filter(d => d.productoId).length} productos al inventario. Esta acción no se puede deshacer.`,
      `Marcar "${compra.numero}" como recibida`
    )) return;
    try {
      await api.recibir(compra.id);
      toast.success('Compra recibida — stock actualizado');
      cargar();
    } catch (e) { toast.error(e.response?.data?.error || 'Error al recibir compra'); }
  };

  const cancelarCompra = async (compra) => {
    if (!await confirmar(`La orden ${compra.numero} será cancelada.`, '¿Cancelar orden de compra?')) return;
    try {
      await api.cancelar(compra.id);
      toast.success('Orden cancelada');
      cargar();
    } catch (e) { toast.error(e.response?.data?.error || 'Error al cancelar'); }
  };

  const FILTROS = [
    { valor: '',          label: 'Todas' },
    { valor: 'pendiente', label: 'Pendientes' },
    { valor: 'recibida',  label: 'Recibidas' },
    { valor: 'cancelada', label: 'Canceladas' },
  ];

  const pendientes = lista.filter(c => c.estado === 'pendiente').length;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Órdenes de Compra"
        subtitle={`${lista.length} órdenes · ${pendientes} pendientes`}
        action={<Btn icon={Plus} onClick={() => setModalCrear(true)}>Nueva Orden</Btn>}
      />

      {/* Filtros */}
      <div className="flex gap-2 flex-wrap">
        {FILTROS.map(f => (
          <button key={f.valor} onClick={() => setFiltro(f.valor)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filtro === f.valor
                ? 'bg-red-600 text-white shadow-sm'
                : 'bg-white border border-slate-200 text-slate-600 hover:bg-slate-50'
            }`}>
            {f.label}
          </button>
        ))}
      </div>

      {cargando ? <PageLoader /> : lista.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200">
          <EmptyState
            icon={ShoppingBag}
            title="Sin órdenes de compra"
            description="Crea una orden para registrar una compra a proveedor"
            action={<Btn icon={Plus} onClick={() => setModalCrear(true)}>Nueva Orden</Btn>}
          />
        </div>
      ) : (
        <div className="space-y-3">
          {lista.map(compra => {
            const info = ESTADO_INFO[compra.estado] || ESTADO_INFO.pendiente;
            const abierto = expandido === compra.id;
            return (
              <div key={compra.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
                <div className="flex items-center gap-4 p-4 cursor-pointer"
                  onClick={() => setExpandido(abierto ? null : compra.id)}>
                  <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 ${
                    compra.estado === 'recibida' ? 'bg-emerald-100' :
                    compra.estado === 'cancelada' ? 'bg-red-100' : 'bg-amber-100'
                  }`}>
                    <ShoppingBag size={18} className={
                      compra.estado === 'recibida' ? 'text-emerald-600' :
                      compra.estado === 'cancelada' ? 'text-red-600' : 'text-amber-600'
                    } />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <p className="font-semibold text-slate-900 text-sm">{compra.numero}</p>
                      <Badge variant={info.variant}>{info.label}</Badge>
                    </div>
                    <p className="text-xs text-slate-500 mt-0.5">
                      {compra.proveedor?.nombre || 'Sin proveedor'} · {fmtF(compra.createdAt)}
                      {compra.fechaEstimada && ` · Llegada: ${fmtF(compra.fechaEstimada)}`}
                    </p>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="font-bold text-slate-900">{fmt(compra.total)}</p>
                    <p className="text-xs text-slate-400">{compra.detalles?.length || 0} ítems</p>
                  </div>
                </div>

                {abierto && (
                  <div className="border-t border-slate-100 p-4 space-y-4">
                    {/* Detalles */}
                    <Table headers={['Producto', 'Cantidad', 'Costo unit.', 'Subtotal']}>
                      {compra.detalles?.map((d, i) => (
                        <tr key={i} className="hover:bg-slate-50">
                          <Td>
                            <p className="font-medium text-slate-800">{d.descripcion}</p>
                            {d.producto && (
                              <p className="text-xs text-slate-400">Stock actual: {d.producto.stock}</p>
                            )}
                          </Td>
                          <Td className="text-center">{d.cantidad}</Td>
                          <Td className="text-right">{fmt(d.costo)}</Td>
                          <Td className="text-right font-semibold">{fmt(d.subtotal)}</Td>
                        </tr>
                      ))}
                    </Table>

                    {compra.notas && (
                      <p className="text-xs text-slate-500 italic">Nota: {compra.notas}</p>
                    )}

                    {/* Acciones */}
                    {compra.estado === 'pendiente' && (
                      <div className="flex gap-2 justify-end pt-2">
                        <Btn variant="danger" onClick={() => cancelarCompra(compra)}>
                          Cancelar orden
                        </Btn>
                        <Btn onClick={() => recibirCompra(compra)}>
                          <CheckCircle2 size={14} />
                          Marcar como recibida
                        </Btn>
                      </div>
                    )}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {modalCrear && (
        <ModalCrearCompra
          onClose={() => setModalCrear(false)}
          onGuardado={() => { setModalCrear(false); cargar(); }}
        />
      )}
    </div>
  );
}
