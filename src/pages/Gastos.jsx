import { useEffect, useState } from 'react';
import { gastos as api } from '../api';
import { Plus, TrendingDown, Trash2 } from 'lucide-react';
import { Modal, ModalFooter, Btn, Input, Select, Textarea, Badge, PageLoader, EmptyState, SectionHeader, Table, Td, IconBtn } from '../components/UI';
import { toast } from '../utils/toast';
import { confirmar } from '../utils/confirmar';

const CATEGORIAS = ['servicios', 'materiales', 'nomina', 'alquiler', 'servicios publicos', 'transporte', 'otros'];

const catVariant = {
  servicios: 'info', materiales: 'warning', nomina: 'success',
  alquiler: 'purple', 'servicios publicos': 'default', transporte: 'default', otros: 'default',
};

const vacio = { descripcion: '', monto: '', categoria: 'materiales', notas: '' };

export default function Gastos() {
  const [lista, setLista] = useState([]);
  const [cargando, setCargando] = useState(true);
  const [modal, setModal] = useState(false);
  const [form, setForm] = useState(vacio);
  const [guardando, setGuardando] = useState(false);

  const cargar = () => {
    setCargando(true);
    api.listar().then(r => setLista(r.data)).finally(() => setCargando(false));
  };

  useEffect(() => { cargar(); }, []);

  const guardar = async () => {
    setGuardando(true);
    try {
      await api.crear({ ...form, monto: Number(form.monto) });
      setModal(false); setForm(vacio); cargar();
    } catch (e) { toast.error('Error: ' + e.message); }
    finally { setGuardando(false); }
  };

  const eliminar = async (id) => {
    if (!await confirmar('Este gasto será eliminado permanentemente.', '¿Eliminar gasto?')) return;
    try { await api.eliminar(id); toast.success('Gasto eliminado'); cargar(); }
    catch (e) { toast.error('Error al eliminar: ' + e.message); }
  };

  const total = lista.reduce((s, g) => s + g.monto, 0);
  const fmt = (n) => `$${Number(n).toLocaleString('es-VE', { minimumFractionDigits: 2 })}`;
  const fmtF = (d) => new Date(d).toLocaleDateString('es-VE', { day: '2-digit', month: 'short', year: 'numeric' });

  // Totales por categoría
  const porCategoria = CATEGORIAS.map(c => ({
    cat: c,
    total: lista.filter(g => g.categoria === c).reduce((s, g) => s + g.monto, 0),
  })).filter(x => x.total > 0).sort((a, b) => b.total - a.total);

  return (
    <div className="space-y-5">
      <SectionHeader
        title="Gastos"
        subtitle={`${lista.length} registros · Total: ${fmt(total)}`}
        action={<Btn icon={Plus} onClick={() => setModal(true)}>Registrar Gasto</Btn>}
      />

      {/* Summary por categoría */}
      {porCategoria.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
          {porCategoria.slice(0, 4).map(({ cat, total: t }) => (
            <div key={cat} className="bg-white rounded-xl border border-slate-200 p-4" style={{ boxShadow: '0 1px 2px rgba(0,0,0,.04)' }}>
              <p className="text-xs text-slate-400 capitalize mb-1">{cat}</p>
              <p className="text-base font-bold text-slate-800">{fmt(t)}</p>
              <div className="mt-2 h-1 rounded-full bg-slate-100 overflow-hidden">
                <div className="h-full bg-red-500 rounded-full" style={{ width: `${Math.min(100, (t / total) * 100)}%` }} />
              </div>
            </div>
          ))}
        </div>
      )}

      <style>{`
        .gas-tabla { display: block; }
        .gas-cards { display: none; }
        @media (max-width: 640px) {
          .gas-tabla { display: none; }
          .gas-cards { display: flex; flex-direction: column; gap: 8px; }
        }
      `}</style>

      <div className="gas-tabla bg-white rounded-2xl border border-slate-200/80 overflow-hidden" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
        {cargando ? <PageLoader /> : lista.length === 0 ? (
          <EmptyState icon={TrendingDown} title="No hay gastos registrados" description="Registra el primer gasto del negocio"
            action={<Btn icon={Plus} onClick={() => setModal(true)}>Registrar Gasto</Btn>} />
        ) : (
          <Table headers={['Descripción', { label: 'Categoría', align: 'center' }, 'Fecha', { label: 'Monto', align: 'right' }, { label: '', align: 'center' }]}>
            {lista.map((g, i) => (
              <tr key={g.id} className={`hover:bg-slate-50/60 transition-colors ${i % 2 === 0 ? '' : 'bg-slate-50/30'}`}>
                <Td>
                  <p className="font-medium text-slate-900">{g.descripcion}</p>
                  {g.notas && <p className="text-xs text-slate-400 mt-0.5">{g.notas}</p>}
                </Td>
                <Td align="center"><Badge variant={catVariant[g.categoria] || 'default'}>{g.categoria}</Badge></Td>
                <Td><span className="text-slate-500 text-xs">{fmtF(g.fecha)}</span></Td>
                <Td align="right"><span className="font-bold text-red-600">{fmt(g.monto)}</span></Td>
                <Td align="center"><IconBtn icon={Trash2} onClick={() => eliminar(g.id)} color="red" title="Eliminar" /></Td>
              </tr>
            ))}
          </Table>
        )}
      </div>

      {!cargando && lista.length > 0 && (
        <div className="gas-cards">
          {lista.map(g => (
            <div key={g.id} className="bg-white rounded-2xl border border-slate-200/80 p-3" style={{ boxShadow: '0 1px 3px rgba(0,0,0,.05)' }}>
              <div className="flex items-start justify-between gap-3">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="font-semibold text-slate-900 text-sm">{g.descripcion}</span>
                    <Badge variant={catVariant[g.categoria] || 'default'}>{g.categoria}</Badge>
                  </div>
                  {g.notas && <p className="text-xs text-slate-400 mt-0.5">{g.notas}</p>}
                  <p className="text-xs text-slate-400 mt-1">{fmtF(g.fecha)}</p>
                </div>
                <div className="flex items-center gap-2 shrink-0">
                  <span className="font-bold text-red-600 text-sm">{fmt(g.monto)}</span>
                  <IconBtn icon={Trash2} onClick={() => eliminar(g.id)} color="red" title="Eliminar" />
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {modal && (
        <Modal titulo="Registrar Gasto" onClose={() => setModal(false)} size="sm">
          <div className="space-y-4">
            <Input label="Descripción *" value={form.descripcion} onChange={e => setForm({ ...form, descripcion: e.target.value })} placeholder="Ej: Compra de pintura base" />
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <Input label="Monto *" type="number" value={form.monto} onChange={e => setForm({ ...form, monto: e.target.value })} placeholder="0.00" />
              <Select label="Categoría" value={form.categoria} onChange={e => setForm({ ...form, categoria: e.target.value })}>
                {CATEGORIAS.map(c => <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>)}
              </Select>
            </div>
            <Input label="Notas opcionales" value={form.notas} onChange={e => setForm({ ...form, notas: e.target.value })} placeholder="Detalles adicionales..." />
          </div>
          <ModalFooter>
            <Btn variant="secondary" onClick={() => setModal(false)} className="flex-1">Cancelar</Btn>
            <Btn onClick={guardar} disabled={guardando || !form.descripcion || !form.monto} className="flex-1">
              {guardando ? 'Guardando...' : 'Registrar'}
            </Btn>
          </ModalFooter>
        </Modal>
      )}
    </div>
  );
}
