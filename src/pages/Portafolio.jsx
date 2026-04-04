import { useEffect, useState } from 'react';
import { portafolio as api } from '../api';
import { Plus, Images, Star, Trash2, Pencil, ExternalLink } from 'lucide-react';
import { Modal, ModalFooter, Btn, Input, Select, Textarea, Badge, PageLoader, EmptyState, SectionHeader } from '../components/UI';
import { toast } from '../utils/toast';
import { confirmar } from '../utils/confirmar';

const CATEGORIAS = ['latoneria', 'pintura', 'modificaciones', 'llantas', 'accesorios', 'otros'];
const catVariant = { latoneria: 'danger', pintura: 'purple', modificaciones: 'warning', llantas: 'info', accesorios: 'success', otros: 'default' };

const vacio = { titulo: '', descripcion: '', categoria: 'latoneria', imagenUrl: '', destacado: false };

function PortafolioCard({ item, onEdit, onDelete }) {
  return (
    <div className="bg-white rounded-2xl border border-slate-200/80 overflow-hidden hover:shadow-lg transition-all duration-200 group"
      style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
      {/* Image */}
      <div className="relative h-48 bg-gradient-to-br from-slate-100 to-slate-200 overflow-hidden">
        {item.imagenUrl ? (
          <img src={item.imagenUrl} alt={item.titulo}
            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
            onError={e => { e.target.style.display = 'none'; }} />
        ) : (
          <div className="w-full h-full flex items-center justify-center">
            <Images size={32} className="text-slate-300" />
          </div>
        )}

        {/* Overlay con acciones */}
        <div className="absolute inset-0 bg-slate-900/0 group-hover:bg-slate-900/30 transition-all duration-200 flex items-center justify-center gap-2 opacity-0 group-hover:opacity-100">
          {item.imagenUrl && (
            <a href={item.imagenUrl} target="_blank" rel="noopener noreferrer"
              className="w-9 h-9 rounded-xl bg-white/90 flex items-center justify-center text-slate-700 hover:bg-white transition-colors">
              <ExternalLink size={15} />
            </a>
          )}
          <button onClick={() => onEdit(item)}
            className="w-9 h-9 rounded-xl bg-white/90 flex items-center justify-center text-amber-600 hover:bg-white transition-colors">
            <Pencil size={15} />
          </button>
          <button onClick={() => onDelete(item.id)}
            className="w-9 h-9 rounded-xl bg-white/90 flex items-center justify-center text-red-600 hover:bg-white transition-colors">
            <Trash2 size={15} />
          </button>
        </div>

        {item.destacado && (
          <div className="absolute top-3 right-3 w-7 h-7 rounded-lg flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #f59e0b, #d97706)' }}>
            <Star size={13} className="text-white" fill="white" />
          </div>
        )}
      </div>

      {/* Info */}
      <div className="p-4">
        <div className="flex items-start justify-between gap-2 mb-1">
          <h3 className="font-semibold text-slate-900 text-sm leading-tight flex-1">{item.titulo}</h3>
          <Badge variant={catVariant[item.categoria] || 'default'}>{item.categoria}</Badge>
        </div>
        {item.descripcion && (
          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.descripcion}</p>
        )}
      </div>
    </div>
  );
}

export default function Portafolio() {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [filtroCategoria, setFiltroCategoria] = useState('');
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(vacio);
  const [actual, setActual] = useState(null);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    setCargando(true);
    api.listar({ categoria: filtroCategoria || undefined }).then(r => setLista(r.data)).finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, [filtroCategoria]);

  const abrirNuevo = () => { setForm(vacio); setActual(null); setModal(true); };
  const abrirEditar = (item) => { setForm(item); setActual(item); setModal(true); };
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
    if (!await confirmar('Este trabajo del portafolio será eliminado permanentemente.', '¿Eliminar trabajo?')) return;
    try { await api.eliminar(id); toast.success('Trabajo eliminado'); cargar(); }
    catch (e) { toast.error('Error al eliminar: ' + e.message); }
  };

  const destacados = lista.filter(i => i.destacado).length;

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Portafolio"
        subtitle={`${lista.length} trabajos${destacados > 0 ? ` · ${destacados} destacados` : ''}`}
        action={<Btn icon={Plus} onClick={abrirNuevo}>Agregar Trabajo</Btn>}
      />

      {/* Filtros categoría */}
      <div className="flex gap-2 flex-wrap">
        <button onClick={() => setFiltroCategoria('')}
          className={`px-3 py-1.5 rounded-xl text-xs font-medium transition-all ${!filtroCategoria ? 'bg-slate-900 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:border-slate-400'}`}>
          Todos
        </button>
        {CATEGORIAS.map(c => (
          <button key={c} onClick={() => setFiltroCategoria(c === filtroCategoria ? '' : c)}
            className={`px-3 py-1.5 rounded-xl text-xs font-medium capitalize transition-all ${filtroCategoria === c ? 'bg-slate-900 text-white' : 'bg-white border border-slate-300 text-slate-600 hover:border-slate-400'}`}>
            {c}
          </button>
        ))}
      </div>

      {cargando ? <PageLoader /> : lista.length === 0 ? (
        <div className="bg-white rounded-2xl border border-slate-200">
          <EmptyState icon={Images} title="No hay trabajos en el portafolio"
            description="Muestra los mejores trabajos de Toyo+"
            action={<Btn icon={Plus} onClick={abrirNuevo}>Agregar Primer Trabajo</Btn>} />
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {lista.map(item => (
            <PortafolioCard key={item.id} item={item} onEdit={abrirEditar} onDelete={eliminar} />
          ))}
        </div>
      )}

      {modal && (
        <Modal titulo={actual ? 'Editar Trabajo' : 'Nuevo Trabajo al Portafolio'} onClose={cerrar}>
          <div className="space-y-4">
            <Input label="Título *" value={form.titulo} onChange={e => setForm({ ...form, titulo: e.target.value })}
              placeholder="Ej: Restauración completa Toyota Hilux 2020" />
            <Select label="Categoría" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
              {CATEGORIAS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
            </Select>
            <Input label="URL de la imagen" value={form.imagenUrl} onChange={e => setForm({ ...form, imagenUrl: e.target.value })}
              placeholder="https://..." type="url" />
            {form.imagenUrl && (
              <div className="rounded-xl overflow-hidden h-32 bg-slate-100">
                <img src={form.imagenUrl} alt="Preview" className="w-full h-full object-cover"
                  onError={e => e.target.style.display = 'none'} />
              </div>
            )}
            <Textarea label="Descripción" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })}
              rows={2} placeholder="Describe el trabajo realizado..." />
            <label className="flex items-center gap-3 cursor-pointer">
              <div className={`w-10 h-6 rounded-full transition-colors relative ${form.destacado ? 'bg-amber-500' : 'bg-slate-200'}`}
                onClick={() => setForm({ ...form, destacado: !form.destacado })}>
                <div className={`absolute top-1 w-4 h-4 rounded-full bg-white shadow transition-transform ${form.destacado ? 'translate-x-5' : 'translate-x-1'}`} />
              </div>
              <span className="text-sm font-medium text-slate-700">Marcar como trabajo destacado</span>
            </label>
          </div>
          <ModalFooter>
            <Btn variant="secondary" onClick={cerrar} className="flex-1">Cancelar</Btn>
            <Btn onClick={guardar} disabled={guardando || !form.titulo} className="flex-1">
              {guardando ? 'Guardando...' : 'Guardar'}
            </Btn>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
