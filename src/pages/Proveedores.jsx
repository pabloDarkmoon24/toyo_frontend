import { useEffect, useState } from 'react';
import { proveedores as api } from '../api';
import { Plus, Truck, Pencil, Trash2, Phone, Mail, Package, ChevronDown, ChevronUp } from 'lucide-react';
import { Modal, ModalFooter, Btn, Input, PageLoader, EmptyState, SectionHeader, Badge } from '../components/UI';
import { toast } from '../utils/toast';
import { confirmar } from '../utils/confirmar';

const vacio = { nombre: '', contacto: '', telefono: '', email: '', direccion: '' };

const categoriaColors = {
  llantas: 'info', repuestos: 'default', pintura: 'purple',
  accesorios: 'success', herramientas: 'warning', lubricantes: 'danger', otros: 'default',
};

function ProveedorCard({ proveedor, onEdit, onDelete }) {
  const [expandido, setExpandido] = useState(false);
  const productos = proveedor.productos || [];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-md transition-all duration-200 group"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className="w-11 h-11 rounded-xl bg-blue-50 border border-blue-100 flex items-center justify-center">
          <Truck size={18} className="text-blue-500" />
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(proveedor)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(proveedor.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-slate-900 mb-0.5">{proveedor.nombre}</h3>
      {proveedor.contacto && <p className="text-xs text-slate-400 mb-3">Contacto: {proveedor.contacto}</p>}

      <div className="space-y-1.5">
        {proveedor.telefono && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Phone size={11} className="text-slate-400 shrink-0" /> {proveedor.telefono}
          </div>
        )}
        {proveedor.email && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Mail size={11} className="text-slate-400 shrink-0" /> <span className="truncate">{proveedor.email}</span>
          </div>
        )}
      </div>

      {productos.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <button
            onClick={() => setExpandido(v => !v)}
            className="flex items-center justify-between w-full text-left"
          >
            <div className="flex items-center gap-1.5">
              <Package size={11} className="text-emerald-500" />
              <span className="text-xs font-medium text-emerald-600">
                {productos.length} producto{productos.length > 1 ? 's' : ''}
              </span>
            </div>
            {expandido
              ? <ChevronUp size={12} className="text-slate-400" />
              : <ChevronDown size={12} className="text-slate-400" />
            }
          </button>

          {expandido && (
            <div className="mt-2 space-y-1.5">
              {productos.map(p => (
                <div key={p.id} className="flex items-center justify-between gap-2 px-2 py-1.5 rounded-lg bg-slate-50">
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium text-slate-700 truncate">{p.nombre}</p>
                    <div className="flex items-center gap-1.5 mt-0.5">
                      <Badge variant={categoriaColors[p.categoria] || 'default'} style={{ fontSize: '0.6rem', padding: '1px 5px' }}>
                        {p.categoria}
                      </Badge>
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    <p className="text-xs font-semibold text-slate-800">${Number(p.precio).toFixed(2)}</p>
                    <p className={`text-xs ${p.stock <= 0 ? 'text-red-500' : 'text-slate-400'}`}>
                      stock: {p.stock}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      )}

      {productos.length === 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100">
          <span className="text-xs text-slate-400">Sin productos registrados</span>
        </div>
      )}
    </div>
  );
}

export default function Proveedores() {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(vacio);
  const [actual, setActual] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    setCargando(true);
    api.listar().then(r => setLista(r.data)).finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const abrirNuevo = () => { setForm(vacio); setActual(null); setModal(true); };
  const abrirEditar = (p) => { setForm(p); setActual(p); setModal(true); };
  const cerrar = () => { setModal(false); setActual(null); };

  const guardar = async () => {
    setGuardando(true);
    try {
      if (!actual) await api.crear(form);
      else await api.actualizar(actual.id, form);
      cerrar(); cargar();
    } catch (e) { toast.error('Error: ' + e.message); }
    finally { setGuardando(false); }
  };

  const eliminar = async (id) => {
    if (!await confirmar('Este proveedor será eliminado permanentemente.', '¿Eliminar proveedor?')) return;
    try { await api.eliminar(id); toast.success('Proveedor eliminado'); cargar(); }
    catch (e) { toast.error('Error al eliminar: ' + e.message); }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Proveedores"
        subtitle={`${lista.length} proveedores registrados`}
        action={<Btn icon={Plus} onClick={abrirNuevo}>Nuevo Proveedor</Btn>}
      />

      {cargando ? <PageLoader /> : lista.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200">
          <EmptyState icon={Truck} title="No hay proveedores" description="Agrega el primer proveedor"
            action={<Btn icon={Plus} onClick={abrirNuevo}>Agregar Proveedor</Btn>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {lista.map(p => (
            <ProveedorCard key={p.id} proveedor={p} onEdit={abrirEditar} onDelete={eliminar} />
          ))}
        </div>
      )}

      {modal && (
        <Modal titulo={actual ? 'Editar Proveedor' : 'Nuevo Proveedor'} onClose={cerrar}>
          <div className="space-y-4">
            <Input label="Nombre del proveedor *" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Nombre de la empresa o persona" />
            <Input label="Persona de contacto" value={form.contacto || ''} onChange={e => setForm({ ...form, contacto: e.target.value })} placeholder="Nombre del contacto" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Teléfono" value={form.telefono || ''} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="0414-000-0000" />
              <Input label="Email" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@empresa.com" />
            </div>
            <Input label="Dirección" value={form.direccion || ''} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Dirección del proveedor" />
          </div>
          <ModalFooter>
            <Btn variant="secondary" onClick={cerrar} className="flex-1">Cancelar</Btn>
            <Btn onClick={guardar} disabled={guardando || !form.nombre} className="flex-1">
              {guardando ? 'Guardando...' : 'Guardar Proveedor'}
            </Btn>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
