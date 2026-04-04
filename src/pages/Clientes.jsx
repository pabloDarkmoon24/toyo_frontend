import { useEffect, useState } from 'react';
import { clientes as api } from '../api';
import { Plus, Search, Users, Pencil, Trash2, Car, Phone, Mail, MapPin, History, X, Clock, CheckCircle2, Wrench } from 'lucide-react';
import { Modal, ModalFooter, Btn, Input, PageLoader, EmptyState, SectionHeader, Badge } from '../components/UI';
import { toast } from '../utils/toast';
import { confirmar } from '../utils/confirmar';

const vacio = { nombre: '', cedula: '', telefono: '', email: '', direccion: '' };

const fmtF = (d) => new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });
const fmt  = (n) => `$${Number(n || 0).toLocaleString('es-VE', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}`;

const ESTADO_ORDEN = {
  recibido:   { label: 'Recibido',   variant: 'info' },
  en_proceso: { label: 'En Proceso', variant: 'warning' },
  listo:      { label: 'Listo',      variant: 'success' },
  entregado:  { label: 'Entregado',  variant: 'default' },
};

function ModalHistorial({ vehiculo, onClose }) {
  const ordenes = vehiculo.ordenes || [];
  return (
    <Modal titulo={`Historial — ${vehiculo.marca} ${vehiculo.modelo}`} onClose={onClose} size="xl">
      <div className="space-y-4">
        {/* Info vehículo */}
        <div className="flex flex-wrap gap-3 p-3 bg-slate-50 rounded-xl text-sm">
          {vehiculo.placa && (
            <span className="flex items-center gap-1.5 font-mono font-bold text-slate-800 bg-white border border-slate-200 px-3 py-1 rounded-lg">
              <Car size={13} className="text-blue-500" /> {vehiculo.placa}
            </span>
          )}
          {vehiculo.color && <span className="text-slate-500">Color: <b className="text-slate-700">{vehiculo.color}</b></span>}
          {vehiculo.anio  && <span className="text-slate-500">Año: <b className="text-slate-700">{vehiculo.anio}</b></span>}
          <span className="text-slate-500">{ordenes.length} servicio{ordenes.length !== 1 ? 's' : ''} registrado{ordenes.length !== 1 ? 's' : ''}</span>
        </div>

        {ordenes.length === 0 ? (
          <div className="text-center py-10">
            <Wrench size={36} className="text-slate-300 mx-auto mb-2" />
            <p className="text-slate-500">Este vehículo no tiene servicios registrados</p>
          </div>
        ) : (
          <div className="space-y-3 max-h-[55vh] overflow-y-auto pr-1">
            {ordenes.map(orden => {
              const estadoInfo = ESTADO_ORDEN[orden.estado] || ESTADO_ORDEN.recibido;
              return (
                <div key={orden.id} className="border border-slate-200 rounded-xl p-4">
                  <div className="flex items-start justify-between gap-3 mb-2">
                    <div>
                      <div className="flex items-center gap-2 flex-wrap">
                        <p className="font-semibold text-slate-900 text-sm">{orden.numero}</p>
                        <Badge variant={estadoInfo.variant}>{estadoInfo.label}</Badge>
                      </div>
                      <p className="text-xs text-slate-500 mt-0.5">{fmtF(orden.createdAt)}</p>
                    </div>
                    {orden.total > 0 && (
                      <p className="font-bold text-slate-800 shrink-0">{fmt(orden.total)}</p>
                    )}
                  </div>
                  <p className="text-sm text-slate-700 mb-2">{orden.descripcion}</p>
                  {orden.detalles?.length > 0 && (
                    <div className="space-y-1">
                      {orden.detalles.map((d, i) => (
                        <div key={i} className="flex justify-between text-xs text-slate-500 bg-slate-50 rounded-lg px-3 py-1.5">
                          <span>{d.descripcion}{d.producto ? ` (${d.producto.nombre})` : ''}</span>
                          <span className="font-medium">{d.cantidad} × {fmt(d.precio)}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  {orden.observaciones && (
                    <p className="text-xs text-slate-400 italic mt-2">Obs: {orden.observaciones}</p>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
      <ModalFooter>
        <Btn variant="secondary" onClick={onClose} className="flex-1">Cerrar</Btn>
      </ModalFooter>
    </Modal>
  );
}

function ClienteCard({ cliente, onEdit, onDelete, onVerHistorial }) {
  const initials = cliente.nombre.split(' ').map(w => w[0]).slice(0, 2).join('').toUpperCase();
  const colors = ['from-red-400 to-red-600', 'from-blue-400 to-blue-600', 'from-purple-400 to-purple-600',
    'from-emerald-400 to-emerald-600', 'from-amber-400 to-amber-600', 'from-pink-400 to-pink-600'];
  const color = colors[cliente.id % colors.length];

  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 p-5 hover:shadow-md transition-all duration-200 group"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
      <div className="flex items-start justify-between mb-4">
        <div className={`w-11 h-11 rounded-xl bg-gradient-to-br ${color} flex items-center justify-center text-white font-bold text-sm`}>
          {initials}
        </div>
        <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
          <button onClick={() => onEdit(cliente)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-amber-600 hover:bg-amber-50 transition-colors">
            <Pencil size={13} />
          </button>
          <button onClick={() => onDelete(cliente.id)}
            className="w-7 h-7 flex items-center justify-center rounded-lg text-slate-400 hover:text-red-600 hover:bg-red-50 transition-colors">
            <Trash2 size={13} />
          </button>
        </div>
      </div>

      <h3 className="font-semibold text-slate-900 mb-0.5">{cliente.nombre}</h3>
      {cliente.cedula && <p className="text-xs text-slate-400 mb-3">CI: {cliente.cedula}</p>}

      <div className="space-y-1.5 mt-3">
        {cliente.telefono && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Phone size={11} className="text-slate-400 shrink-0" />
            <span>{cliente.telefono}</span>
          </div>
        )}
        {cliente.email && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <Mail size={11} className="text-slate-400 shrink-0" />
            <span className="truncate">{cliente.email}</span>
          </div>
        )}
        {cliente.direccion && (
          <div className="flex items-center gap-2 text-xs text-slate-500">
            <MapPin size={11} className="text-slate-400 shrink-0" />
            <span className="truncate">{cliente.direccion}</span>
          </div>
        )}
      </div>

      {cliente.vehiculos?.length > 0 && (
        <div className="mt-3 pt-3 border-t border-slate-100 space-y-1.5">
          {cliente.vehiculos.map(v => (
            <button key={v.id}
              onClick={() => onVerHistorial(v)}
              className="flex items-center gap-2 w-full text-left rounded-lg px-2 py-1.5 hover:bg-blue-50 transition-colors group/veh">
              <Car size={12} className="text-blue-500 shrink-0" />
              <span className="text-xs font-medium text-blue-600 flex-1 truncate">
                {v.marca} {v.modelo}{v.placa ? ` · ${v.placa}` : ''}
              </span>
              <History size={11} className="text-slate-400 group-hover/veh:text-blue-500 transition-colors shrink-0" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

export default function Clientes() {
  const [lista, setLista]               = useState([]);
  const [cargando, setCargando]         = useState(true);
  const [buscar, setBuscar]             = useState('');
  const [modal, setModal]               = useState(false);
  const [form, setForm]                 = useState(vacio);
  const [actual, setActual]             = useState(null);
  const [guardando, setGuardando]       = useState(false);
  const [vehiculoHistorial, setVehiculoHistorial] = useState(null);

  const cargar = () => {
    setCargando(true);
    api.listar({ buscar: buscar || undefined })
      .then(r => setLista(r.data))
      .finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [buscar]);

  const abrirNuevo   = () => { setForm(vacio); setActual(null); setModal(true); };
  const abrirEditar  = (c) => { setForm(c); setActual(c); setModal(true); };
  const cerrar       = () => { setModal(false); setActual(null); };

  const verHistorial = async (vehiculo) => {
    // Cargar historial completo del vehículo
    try {
      const r = await api.historialVehiculo(vehiculo.id);
      setVehiculoHistorial(r.data);
    } catch {
      toast.error('Error al cargar historial');
    }
  };

  const guardar = async () => {
    setGuardando(true);
    try {
      if (!actual) await api.crear(form);
      else await api.actualizar(actual.id, form);
      toast.success(actual ? 'Cliente actualizado' : 'Cliente creado');
      cerrar(); cargar();
    } catch (e) { toast.error('Error: ' + e.message); }
    finally { setGuardando(false); }
  };

  const eliminar = async (id) => {
    if (!await confirmar('Este cliente y sus datos serán eliminados permanentemente.', '¿Eliminar cliente?')) return;
    try { await api.eliminar(id); toast.success('Cliente eliminado'); cargar(); }
    catch (e) { toast.error('Error al eliminar: ' + e.message); }
  };

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Clientes"
        subtitle={`${lista.length} clientes registrados`}
        action={<Btn icon={Plus} onClick={abrirNuevo}>Nuevo Cliente</Btn>}
      />

      <div className="relative max-w-sm">
        <Search size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          placeholder="Buscar por nombre, cédula, teléfono o placa..."
          value={buscar}
          onChange={e => setBuscar(e.target.value)}
          className="w-full pl-9 pr-4 py-2 text-sm rounded-xl border border-slate-300 bg-white outline-none focus:ring-2 focus:ring-red-100 focus:border-red-400 transition-all"
        />
      </div>

      {cargando ? (
        <PageLoader />
      ) : lista.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200">
          <EmptyState
            icon={Users}
            title="No hay clientes registrados"
            description="Agrega el primer cliente para comenzar"
            action={<Btn icon={Plus} onClick={abrirNuevo}>Agregar Cliente</Btn>}
          />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {lista.map(c => (
            <ClienteCard key={c.id} cliente={c} onEdit={abrirEditar} onDelete={eliminar} onVerHistorial={verHistorial} />
          ))}
        </div>
      )}

      {/* Modal crear/editar */}
      {modal && (
        <Modal titulo={actual ? 'Editar Cliente' : 'Nuevo Cliente'} onClose={cerrar}>
          <div className="space-y-4">
            <Input label="Nombre completo *" value={form.nombre || ''} onChange={e => setForm({ ...form, nombre: e.target.value })} placeholder="Ej: Juan Carlos Pérez" />
            <div className="grid grid-cols-2 gap-3">
              <Input label="Cédula" value={form.cedula || ''} onChange={e => setForm({ ...form, cedula: e.target.value })} placeholder="V-12345678" />
              <Input label="Teléfono" type="tel" value={form.telefono || ''} onChange={e => setForm({ ...form, telefono: e.target.value })} placeholder="0414-000-0000" />
            </div>
            <Input label="Correo electrónico" type="email" value={form.email || ''} onChange={e => setForm({ ...form, email: e.target.value })} placeholder="correo@ejemplo.com" />
            <Input label="Dirección" value={form.direccion || ''} onChange={e => setForm({ ...form, direccion: e.target.value })} placeholder="Dirección del cliente" />
          </div>
          <ModalFooter>
            <Btn variant="secondary" onClick={cerrar} className="flex-1">Cancelar</Btn>
            <Btn onClick={guardar} disabled={guardando || !form.nombre} className="flex-1">
              {guardando ? 'Guardando...' : 'Guardar Cliente'}
            </Btn>
          </ModalFooter>
        </Modal>
      )}

      {/* Modal historial de vehículo */}
      {vehiculoHistorial && (
        <ModalHistorial
          vehiculo={vehiculoHistorial}
          onClose={() => setVehiculoHistorial(null)}
        />
      )}
    </div>
  );
}
