import { useEffect, useState } from 'react';
import { configuracion as apiConfig, auth, productos as apiProductos, gastosFijos as apiFijos, metodosPago as apiMetodos, backup as apiBackup } from '../api';
import { Settings, KeyRound, Package, Building2, CheckCircle2, AlertTriangle, Target, Plus, Trash2, Pencil, X, CreditCard, Smartphone, RefreshCw, Database, Download, Cloud } from 'lucide-react';
import { SectionHeader, Btn, Input, PageLoader } from '../components/UI';
import { confirmar } from '../utils/confirmar';
import { toast } from '../utils/toast';
import { useAuth } from '../context/AuthContext';

function SeccionCard({ icon: Icon, titulo, descripcion, children }) {
  return (
    <div className="tarjeta" style={{ padding: 24, display: 'flex', flexDirection: 'column', gap: 20 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12, paddingBottom: 16, borderBottom: '1px solid var(--color-gris-100)' }}>
        <div style={{
          width: 38, height: 38, borderRadius: 10, flexShrink: 0,
          background: 'linear-gradient(135deg, var(--color-toyo) 0%, var(--color-toyo-oscuro) 100%)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          boxShadow: '0 4px 12px rgba(220,38,38,.25)',
        }}>
          <Icon size={16} color="#fff" />
        </div>
        <div>
          <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-gris-900)' }}>{titulo}</p>
          {descripcion && <p style={{ fontSize: '0.78rem', color: 'var(--color-gris-500)', marginTop: 2 }}>{descripcion}</p>}
        </div>
      </div>
      {children}
    </div>
  );
}

function Alerta({ tipo, mensaje }) {
  if (!mensaje) return null;
  const exito = tipo === 'exito';
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 8,
      padding: '10px 14px', borderRadius: 8,
      background: exito ? 'rgba(5,150,105,.08)' : 'rgba(220,38,38,.08)',
      border: `1px solid ${exito ? 'rgba(5,150,105,.25)' : 'rgba(220,38,38,.25)'}`,
      color: exito ? '#065f46' : '#991b1b',
      fontSize: '0.8125rem', fontWeight: 500,
    }}>
      {exito ? <CheckCircle2 size={14} /> : <AlertTriangle size={14} />}
      {mensaje}
    </div>
  );
}

export default function Configuracion() {
  const { usuario } = useAuth();
  const [cargando, setCargando] = useState(true);
  const [config, setConfig] = useState({});

  // PWA
  const [instalable, setInstalable] = useState(!!window.__installPrompt);
  const [yaInstalada, setYaInstalada] = useState(window.matchMedia('(display-mode: standalone)').matches);
  const [hayActualizacion, setHayActualizacion] = useState(false);
  const [verificando, setVerificando] = useState(false);
  const [actualizando, setActualizando] = useState(false);

  useEffect(() => {
    const onInstalable = () => setInstalable(true);
    const onUpdate = () => setHayActualizacion(true);
    window.addEventListener('pwa-installable', onInstalable);
    window.addEventListener('pwa-update-available', onUpdate);
    return () => {
      window.removeEventListener('pwa-installable', onInstalable);
      window.removeEventListener('pwa-update-available', onUpdate);
    };
  }, []);

  const instalarApp = async () => {
    const prompt = window.__installPrompt;
    if (!prompt) return;
    await prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === 'accepted') {
      setInstalable(false);
      setYaInstalada(true);
      window.__installPrompt = null;
    }
  };

  const verificarActualizacion = async () => {
    setVerificando(true);
    try {
      if ('serviceWorker' in navigator) {
        const regs = await navigator.serviceWorker.getRegistrations();
        for (const reg of regs) await reg.update();
        // Espera 2s para que el SW detecte cambios
        await new Promise(r => setTimeout(r, 2000));
      }
      if (!hayActualizacion) toast.success('La app ya está al día');
    } catch { toast.error('No se pudo verificar'); }
    finally { setVerificando(false); }
  };

  const aplicarActualizacion = () => {
    setActualizando(true);
    window.location.reload();
  };

  // Info del negocio
  const [negocio, setNegocio] = useState({ nombre: '', rif: '', telefono: '', direccion: '', email: '' });
  const [guardandoNegocio, setGuardandoNegocio] = useState(false);
  const [alertaNegocio, setAlertaNegocio] = useState(null);

  // Stock mínimo global
  const [stockMinGlobal, setStockMinGlobal] = useState('5');
  const [guardandoStock, setGuardandoStock] = useState(false);
  const [alertaStock, setAlertaStock] = useState(null);

  // Backup
  const [backupDriveStatus, setBackupDriveStatus] = useState(null); // null | 'loading' | 'ok' | 'error'
  const [backupDriveMsg, setBackupDriveMsg] = useState('');
  const [descargandoBackup, setDescargandoBackup] = useState(false);

  const ejecutarBackupDrive = async () => {
    setBackupDriveStatus('loading');
    setBackupDriveMsg('');
    try {
      const r = await apiBackup.ejecutarDrive();
      setBackupDriveStatus('ok');
      setBackupDriveMsg(r.data.mensaje || 'Backup enviado a Google Drive.');
    } catch (e) {
      setBackupDriveStatus('error');
      setBackupDriveMsg(e.response?.data?.error || 'Error al ejecutar el backup.');
    }
  };

  const descargarBackup = async () => {
    setDescargandoBackup(true);
    try {
      const r = await apiBackup.descargar();
      const url = URL.createObjectURL(new Blob([r.data], { type: 'application/json' }));
      const a = document.createElement('a');
      a.href = url;
      a.download = `toyo-backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
    } catch { toast.error('Error al descargar el backup'); }
    finally { setDescargandoBackup(false); }
  };

  // Cambio contraseña
  const [pass, setPass] = useState({ actual: '', nueva: '', confirmar: '' });
  const [guardandoPass, setGuardandoPass] = useState(false);
  const [alertaPass, setAlertaPass] = useState(null);

  // Gastos fijos / Punto de equilibrio
  const [gastosFijos, setGastosFijos] = useState([]);
  const [totalBreakEven, setTotalBreakEven] = useState(0);
  const [porCategoria, setPorCategoria] = useState({});
  const [formFijo, setFormFijo] = useState(null); // null = cerrado, {} = nuevo, {id,...} = editar
  const [guardandoFijo, setGuardandoFijo] = useState(false);

  const CATS_FIJAS = [
    { valor: 'colaboradores', label: 'Colaboradores' },
    { valor: 'arriendo', label: 'Arriendo' },
    { valor: 'servicios', label: 'Servicios' },
    { valor: 'publicidad', label: 'Publicidad' },
    { valor: 'otros', label: 'Otros' },
  ];

  const CAT_COLORS = {
    colaboradores: { bg: 'rgba(37,99,235,.08)', border: 'rgba(37,99,235,.2)', color: '#1d4ed8' },
    arriendo:      { bg: 'rgba(124,58,237,.08)', border: 'rgba(124,58,237,.2)', color: '#7c3aed' },
    servicios:     { bg: 'rgba(5,150,105,.08)',  border: 'rgba(5,150,105,.2)',  color: '#059669' },
    publicidad:    { bg: 'rgba(217,119,6,.08)',  border: 'rgba(217,119,6,.2)',  color: '#d97706' },
    otros:         { bg: 'rgba(100,116,139,.08)', border: 'rgba(100,116,139,.2)', color: '#475569' },
  };

  const cargarFijos = () => {
    apiFijos.listar().then(r => {
      setGastosFijos(r.data.items);
      setTotalBreakEven(r.data.totalBreakEven);
      setPorCategoria(r.data.porCategoria);
    }).catch(console.error);
  };

  const guardarFijo = async () => {
    if (!formFijo?.nombre || !formFijo?.monto) return toast.warning('Nombre y monto son requeridos');
    setGuardandoFijo(true);
    try {
      if (formFijo.id) {
        await apiFijos.actualizar(formFijo.id, { nombre: formFijo.nombre, monto: Number(formFijo.monto), categoria: formFijo.categoria, activo: formFijo.activo });
        toast.success('Costo actualizado');
      } else {
        await apiFijos.crear({ nombre: formFijo.nombre, monto: Number(formFijo.monto), categoria: formFijo.categoria || 'otros' });
        toast.success('Costo agregado');
      }
      setFormFijo(null);
      cargarFijos();
    } catch (e) { toast.error('Error: ' + e.message); }
    finally { setGuardandoFijo(false); }
  };

  const eliminarFijo = async (id) => {
    if (!await confirmar('Este costo fijo será eliminado del cálculo de punto de equilibrio.', '¿Eliminar costo fijo?')) return;
    try { await apiFijos.eliminar(id); toast.success('Eliminado'); cargarFijos(); }
    catch (e) { toast.error('Error: ' + e.message); }
  };

  const toggleActivoFijo = async (item) => {
    try {
      await apiFijos.actualizar(item.id, { activo: !item.activo });
      cargarFijos();
    } catch (e) { toast.error('Error: ' + e.message); }
  };

  // Métodos de pago
  const [metodosPago, setMetodosPago] = useState([]);
  const [formMetodo, setFormMetodo]   = useState('');
  const [guardandoMetodo, setGuardandoMetodo] = useState(false);

  const cargarMetodos = () => {
    apiMetodos.listar().then(r => setMetodosPago(r.data)).catch(console.error);
  };

  const agregarMetodo = async () => {
    if (!formMetodo.trim()) return toast.warning('Ingresa un nombre');
    setGuardandoMetodo(true);
    try {
      await apiMetodos.crear({ nombre: formMetodo.trim(), orden: metodosPago.length });
      setFormMetodo('');
      toast.success('Método de pago agregado');
      cargarMetodos();
    } catch (e) { toast.error('Error: ' + e.message); }
    finally { setGuardandoMetodo(false); }
  };

  const toggleMetodo = async (m) => {
    try { await apiMetodos.actualizar(m.id, { activo: !m.activo }); cargarMetodos(); }
    catch (e) { toast.error('Error: ' + e.message); }
  };

  const eliminarMetodo = async (id) => {
    if (!await confirmar('Este método de pago será eliminado.', '¿Eliminar método?')) return;
    try { await apiMetodos.eliminar(id); toast.success('Eliminado'); cargarMetodos(); }
    catch (e) { toast.error('Error: ' + e.message); }
  };


  useEffect(() => {
    cargarFijos();
    cargarMetodos();
    apiConfig.obtener().then(r => {
      const c = r.data;
      setConfig(c);
      if (c.stockMinGlobal) setStockMinGlobal(c.stockMinGlobal);
      setNegocio({
        nombre:    c.negocioNombre    || '',
        rif:       c.negocioRif       || '',
        telefono:  c.negocioTelefono  || '',
        direccion: c.negocioDireccion || '',
        email:     c.negocioEmail     || '',
      });
    }).finally(() => setCargando(false));
  }, []);

  const mostrar = (set, tipo, msg, ms = 3500) => {
    set({ tipo, msg });
    setTimeout(() => set(null), ms);
  };

  const guardarNegocio = async () => {
    setGuardandoNegocio(true);
    try {
      await apiConfig.guardar({
        negocioNombre:    negocio.nombre,
        negocioRif:       negocio.rif,
        negocioTelefono:  negocio.telefono,
        negocioDireccion: negocio.direccion,
        negocioEmail:     negocio.email,
      });
      mostrar(setAlertaNegocio, 'exito', 'Información del negocio guardada');
    } catch { mostrar(setAlertaNegocio, 'error', 'Error al guardar'); }
    finally { setGuardandoNegocio(false); }
  };

  const aplicarStockGlobal = async () => {
    const val = Number(stockMinGlobal);
    if (!val || val < 1) return mostrar(setAlertaStock, 'error', 'Ingresa un valor válido mayor a 0');
    if (!await confirmar(`Se sobreescribirán los valores individuales de todos los productos con stock mínimo de ${val}.`, `¿Aplicar stock mínimo de ${val} a TODOS los productos?`)) return;
    setGuardandoStock(true);
    try {
      // Guardar en config
      await apiConfig.set('stockMinGlobal', String(val));
      // Obtener todos los productos y actualizarlos
      const { data: lista } = await apiProductos.listar({});
      let i = 0;
      for (const p of lista) {
        await apiProductos.actualizar(p.id, { stockMinimo: val });
        i++;
      }
      mostrar(setAlertaStock, 'exito', `Stock mínimo de ${val} aplicado a ${i} productos`);
    } catch { mostrar(setAlertaStock, 'error', 'Error al aplicar stock mínimo'); }
    finally { setGuardandoStock(false); }
  };

  const guardarSoloConfig = async () => {
    const val = Number(stockMinGlobal);
    if (!val || val < 1) return mostrar(setAlertaStock, 'error', 'Ingresa un valor válido');
    setGuardandoStock(true);
    try {
      await apiConfig.set('stockMinGlobal', String(val));
      mostrar(setAlertaStock, 'exito', 'Valor guardado. Los nuevos productos usarán este mínimo.');
    } catch { mostrar(setAlertaStock, 'error', 'Error al guardar'); }
    finally { setGuardandoStock(false); }
  };

  const cambiarPassword = async () => {
    if (!pass.actual || !pass.nueva || !pass.confirmar)
      return mostrar(setAlertaPass, 'error', 'Completa todos los campos');
    if (pass.nueva !== pass.confirmar)
      return mostrar(setAlertaPass, 'error', 'Las contraseñas nuevas no coinciden');
    if (pass.nueva.length < 6)
      return mostrar(setAlertaPass, 'error', 'La contraseña debe tener mínimo 6 caracteres');
    setGuardandoPass(true);
    try {
      await auth.cambiarPassword(pass.actual, pass.nueva);
      setPass({ actual: '', nueva: '', confirmar: '' });
      mostrar(setAlertaPass, 'exito', 'Contraseña actualizada correctamente');
    } catch (e) {
      mostrar(setAlertaPass, 'error', e.response?.data?.error || 'Error al cambiar contraseña');
    } finally { setGuardandoPass(false); }
  };

  if (cargando) return <PageLoader />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 24 }}>
      <style>{`
        .cfg-grid        { display: grid; grid-template-columns: repeat(auto-fit, minmax(320px, 1fr)); gap: 20px; }
        .cfg-grid-2col   { display: grid; grid-template-columns: 1fr 1fr; gap: 12px; }
        .cfg-btns        { display: flex; gap: 8px; }
        @media (max-width: 600px) {
          .cfg-grid-2col { grid-template-columns: 1fr; }
          .cfg-btns      { flex-direction: column; }
          .cfg-btns > *  { width: 100%; }
        }
      `}</style>
      <SectionHeader
        title="Configuración"
        subtitle="Ajustes del sistema, inventario y cuenta"
      />

      {/* Punto de Equilibrio — full width */}
      <SeccionCard icon={Target} titulo="Punto de Equilibrio Mensual" descripcion="Define tus costos fijos para saber cuánto necesitas vender para cubrir gastos">
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Resumen */}
          {totalBreakEven > 0 && (
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: 10 }}>
              <div style={{ padding: '12px 16px', borderRadius: 10, background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.18)', textAlign: 'center' }}>
                <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gris-500)', marginBottom: 4 }}>Punto de Equilibrio</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 800, color: '#dc2626', lineHeight: 1 }}>${totalBreakEven.toLocaleString('es-VE', { minimumFractionDigits: 0 })}</p>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-gris-400)', marginTop: 3 }}>debe venderse al mes</p>
              </div>
              {Object.entries(porCategoria).map(([cat, monto]) => {
                const col = CAT_COLORS[cat] || CAT_COLORS.otros;
                const label = CATS_FIJAS.find(c => c.valor === cat)?.label || cat;
                return (
                  <div key={cat} style={{ padding: '12px 16px', borderRadius: 10, background: col.bg, border: `1px solid ${col.border}`, textAlign: 'center' }}>
                    <p style={{ fontSize: '0.68rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gris-500)', marginBottom: 4 }}>{label}</p>
                    <p style={{ fontSize: '1.1rem', fontWeight: 800, color: col.color, lineHeight: 1 }}>${Number(monto).toLocaleString('es-VE', { minimumFractionDigits: 0 })}</p>
                  </div>
                );
              })}
            </div>
          )}

          {/* Lista de ítems */}
          {gastosFijos.length > 0 && (
            <div style={{ border: '1px solid var(--color-gris-200)', borderRadius: 10, overflow: 'hidden' }}>
              {gastosFijos.map((g, i) => {
                const col = CAT_COLORS[g.categoria] || CAT_COLORS.otros;
                const label = CATS_FIJAS.find(c => c.valor === g.categoria)?.label || g.categoria;
                return (
                  <div key={g.id} style={{
                    display: 'flex', alignItems: 'center', gap: 12, padding: '11px 14px',
                    borderBottom: i < gastosFijos.length - 1 ? '1px solid var(--color-gris-100)' : 'none',
                    background: !g.activo ? 'var(--color-gris-50)' : '#fff',
                    opacity: g.activo ? 1 : 0.55,
                  }}>
                    <span style={{
                      fontSize: '0.65rem', fontWeight: 700, padding: '2px 8px', borderRadius: 99,
                      background: col.bg, color: col.color, border: `1px solid ${col.border}`,
                      flexShrink: 0, textTransform: 'capitalize',
                    }}>
                      {label}
                    </span>
                    <span style={{ flex: 1, fontSize: '0.8375rem', fontWeight: 500, color: 'var(--color-gris-800)' }}>{g.nombre}</span>
                    <span style={{ fontWeight: 700, fontSize: '0.875rem', color: g.activo ? 'var(--color-gris-800)' : 'var(--color-gris-400)', flexShrink: 0 }}>
                      ${Number(g.monto).toLocaleString('es-VE', { minimumFractionDigits: 0 })}
                    </span>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button
                        onClick={() => toggleActivoFijo(g)}
                        title={g.activo ? 'Desactivar' : 'Activar'}
                        style={{
                          width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer',
                          background: g.activo ? 'rgba(5,150,105,.1)' : 'var(--color-gris-100)',
                          color: g.activo ? '#059669' : 'var(--color-gris-400)',
                          fontSize: '0.65rem', fontWeight: 700,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                        }}
                      >
                        {g.activo ? '✓' : '○'}
                      </button>
                      <button
                        onClick={() => setFormFijo({ ...g })}
                        style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(37,99,235,.08)', color: '#2563eb', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Pencil size={11} />
                      </button>
                      <button
                        onClick={() => eliminarFijo(g.id)}
                        style={{ width: 26, height: 26, borderRadius: 6, border: 'none', cursor: 'pointer', background: 'rgba(220,38,38,.08)', color: '#dc2626', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                      >
                        <Trash2 size={11} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {/* Formulario inline */}
          {formFijo ? (
            <div style={{ padding: '14px 16px', borderRadius: 10, background: 'var(--color-gris-50)', border: '1px solid var(--color-gris-200)', display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <p style={{ fontWeight: 600, fontSize: '0.875rem', color: 'var(--color-gris-800)' }}>
                  {formFijo.id ? 'Editar costo' : 'Nuevo costo fijo'}
                </p>
                <button onClick={() => setFormFijo(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gris-400)' }}>
                  <X size={15} />
                </button>
              </div>
              <div className="cfg-grid-2col">
                <Input
                  label="Nombre del costo *"
                  value={formFijo.nombre || ''}
                  onChange={e => setFormFijo(p => ({ ...p, nombre: e.target.value }))}
                  placeholder="Ej: Sueldo mecánico, Luz eléctrica..."
                />
                <Input
                  label="Monto mensual *"
                  type="number"
                  min="0"
                  value={formFijo.monto || ''}
                  onChange={e => setFormFijo(p => ({ ...p, monto: e.target.value }))}
                  placeholder="0.00"
                />
              </div>
              <div>
                <label className="etiqueta">Categoría</label>
                <select
                  className="campo"
                  value={formFijo.categoria || 'otros'}
                  onChange={e => setFormFijo(p => ({ ...p, categoria: e.target.value }))}
                >
                  {CATS_FIJAS.map(c => <option key={c.valor} value={c.valor}>{c.label}</option>)}
                </select>
              </div>
              <div className="cfg-btns">
                <Btn variant="secondary" onClick={() => setFormFijo(null)} style={{ flex: 1 }}>Cancelar</Btn>
                <Btn onClick={guardarFijo} disabled={guardandoFijo || !formFijo.nombre || !formFijo.monto} style={{ flex: 1 }}>
                  {guardandoFijo ? 'Guardando...' : formFijo.id ? 'Actualizar' : 'Agregar'}
                </Btn>
              </div>
            </div>
          ) : (
            <Btn icon={Plus} variant="secondary" onClick={() => setFormFijo({ nombre: '', monto: '', categoria: 'otros' })}>
              Agregar costo fijo
            </Btn>
          )}

          {gastosFijos.length === 0 && !formFijo && (
            <div style={{ padding: '16px', textAlign: 'center', color: 'var(--color-gris-400)', fontSize: '0.8125rem' }}>
              Agrega tus costos fijos mensuales: sueldos, arriendo, servicios, etc.
            </div>
          )}
        </div>
      </SeccionCard>

      <div className="cfg-grid">

        {/* Info del Negocio */}
        <SeccionCard icon={Building2} titulo="Información del Negocio" descripcion="Datos que aparecen en facturas y cotizaciones">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div className="cfg-grid-2col">
              <Input
                label="Nombre del negocio"
                value={negocio.nombre}
                onChange={e => setNegocio(p => ({ ...p, nombre: e.target.value }))}
                placeholder="Ej: TOYO+"
              />
              <Input
                label="RIF / NIT"
                value={negocio.rif}
                onChange={e => setNegocio(p => ({ ...p, rif: e.target.value }))}
                placeholder="J-12345678-9"
              />
              <Input
                label="Teléfono"
                value={negocio.telefono}
                onChange={e => setNegocio(p => ({ ...p, telefono: e.target.value }))}
                placeholder="+58 412 000 0000"
              />
              <Input
                label="Email"
                value={negocio.email}
                onChange={e => setNegocio(p => ({ ...p, email: e.target.value }))}
                placeholder="contacto@toyo.com"
              />
            </div>
            <Input
              label="Dirección"
              value={negocio.direccion}
              onChange={e => setNegocio(p => ({ ...p, direccion: e.target.value }))}
              placeholder="Av. Principal, Local 1..."
            />
            {alertaNegocio && <Alerta tipo={alertaNegocio.tipo} mensaje={alertaNegocio.msg} />}
            <Btn onClick={guardarNegocio} disabled={guardandoNegocio}>
              {guardandoNegocio ? 'Guardando...' : 'Guardar información'}
            </Btn>
          </div>
        </SeccionCard>

        {/* Stock mínimo global */}
        <SeccionCard icon={Package} titulo="Stock Mínimo Global" descripcion="Define el mínimo de inventario para alertas de reposición">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{
              padding: '12px 14px', borderRadius: 8,
              background: 'var(--color-gris-50)', border: '1px solid var(--color-gris-200)',
              fontSize: '0.8125rem', color: 'var(--color-gris-600)', lineHeight: 1.6,
            }}>
              Este valor define cuándo el sistema debe alertarte de que un producto necesita reposición.
              Puedes aplicarlo a todos los productos de una vez, o editar cada uno individualmente desde el Inventario.
            </div>
            <Input
              label="Stock mínimo por defecto"
              type="number"
              min="1"
              value={stockMinGlobal}
              onChange={e => setStockMinGlobal(e.target.value)}
              placeholder="5"
            />
            {alertaStock && <Alerta tipo={alertaStock.tipo} mensaje={alertaStock.msg} />}
            <div className="cfg-btns">
              <Btn variant="secondary" onClick={guardarSoloConfig} disabled={guardandoStock} style={{ flex: 1 }}>
                Solo guardar valor
              </Btn>
              <Btn onClick={aplicarStockGlobal} disabled={guardandoStock} style={{ flex: 1 }}>
                {guardandoStock ? 'Aplicando...' : 'Aplicar a todos'}
              </Btn>
            </div>
          </div>
        </SeccionCard>

        {/* Cambio de contraseña */}
        <SeccionCard icon={KeyRound} titulo="Cambiar Contraseña" descripcion={`Cuenta: ${usuario?.email}`}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Input
              label="Contraseña actual"
              type="password"
              value={pass.actual}
              onChange={e => setPass(p => ({ ...p, actual: e.target.value }))}
              placeholder="••••••••"
            />
            <Input
              label="Nueva contraseña"
              type="password"
              value={pass.nueva}
              onChange={e => setPass(p => ({ ...p, nueva: e.target.value }))}
              placeholder="Mínimo 6 caracteres"
            />
            <Input
              label="Confirmar nueva contraseña"
              type="password"
              value={pass.confirmar}
              onChange={e => setPass(p => ({ ...p, confirmar: e.target.value }))}
              placeholder="Repite la nueva contraseña"
            />
            {alertaPass && <Alerta tipo={alertaPass.tipo} mensaje={alertaPass.msg} />}
            <Btn
              icon={KeyRound}
              onClick={cambiarPassword}
              disabled={guardandoPass || !pass.actual || !pass.nueva || !pass.confirmar}
            >
              {guardandoPass ? 'Actualizando...' : 'Cambiar contraseña'}
            </Btn>
          </div>
        </SeccionCard>

        {/* Métodos de pago */}
        <SeccionCard icon={CreditCard} titulo="Métodos de Pago" descripcion="Configura los métodos disponibles en facturas">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 6 }}>
              {metodosPago.map(m => (
                <div key={m.id} style={{
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '8px 12px', borderRadius: 10,
                  background: m.activo ? 'rgba(5,150,105,.06)' : 'var(--color-gris-50)',
                  border: `1px solid ${m.activo ? 'rgba(5,150,105,.2)' : 'var(--color-gris-200)'}`,
                }}>
                  <button onClick={() => toggleMetodo(m)} title={m.activo ? 'Desactivar' : 'Activar'}
                    style={{
                      width: 18, height: 18, borderRadius: '50%', border: 'none', cursor: 'pointer', flexShrink: 0,
                      background: m.activo ? '#059669' : 'var(--color-gris-300)',
                    }} />
                  <span style={{ flex: 1, fontSize: '0.875rem', color: m.activo ? 'var(--color-gris-800)' : 'var(--color-gris-400)', fontWeight: 500 }}>
                    {m.nombre}
                  </span>
                  <button onClick={() => eliminarMetodo(m.id)}
                    style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--color-gris-400)', padding: 4 }}>
                    <Trash2 size={13} />
                  </button>
                </div>
              ))}
            </div>
            <div className="cfg-btns" style={{ alignItems: 'stretch' }}>
              <input
                type="text"
                value={formMetodo}
                onChange={e => setFormMetodo(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && agregarMetodo()}
                placeholder="Ej: Zelle, Criptomoneda..."
                style={{ flex: 1, fontSize: '0.875rem', border: '1px solid var(--color-gris-200)', borderRadius: 10, padding: '9px 12px', outline: 'none' }}
              />
              <Btn onClick={agregarMetodo} disabled={guardandoMetodo || !formMetodo.trim()} icon={Plus}>
                Agregar
              </Btn>
            </div>
          </div>
        </SeccionCard>


        {/* Info del sistema */}
        {/* ── App móvil ── */}
        <SeccionCard icon={Smartphone} titulo="App Móvil" descripcion="Instala Toyo+ en tu celular y mantén la app actualizada">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

            {/* Instalar en Android */}
            {!yaInstalada && instalable && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <div style={{
                  padding: '12px 16px', borderRadius: 10,
                  background: 'rgba(5,150,105,.06)', border: '1px solid rgba(5,150,105,.2)',
                  fontSize: '0.8125rem', color: '#065f46', lineHeight: 1.5,
                }}>
                  Instala la app en tu celular Android para usarla sin necesidad del navegador, con acceso rápido desde la pantalla de inicio.
                </div>
                <Btn icon={Smartphone} onClick={instalarApp}>
                  Instalar en este dispositivo
                </Btn>
              </div>
            )}

            {yaInstalada && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '12px 16px', borderRadius: 10,
                background: 'rgba(5,150,105,.06)', border: '1px solid rgba(5,150,105,.2)',
                fontSize: '0.8125rem', color: '#065f46', fontWeight: 500,
              }}>
                <CheckCircle2 size={15} />
                App instalada en este dispositivo
              </div>
            )}

            {!yaInstalada && !instalable && (
              <div style={{
                padding: '12px 16px', borderRadius: 10,
                background: 'rgba(100,116,139,.06)', border: '1px solid rgba(100,116,139,.2)',
                fontSize: '0.8125rem', color: '#475569', lineHeight: 1.6,
              }}>
                <strong>Para instalar en iPhone:</strong> toca el botón compartir <strong>⬆</strong> en Safari → "Añadir a pantalla de inicio"<br />
                <strong>Para instalar en Android:</strong> abre la app en Chrome → menú <strong>⋮</strong> → "Instalar app" o "Añadir a pantalla de inicio"
              </div>
            )}

            {/* Actualizaciones */}
            <div style={{ borderTop: '1px solid var(--color-gris-100)', paddingTop: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
              <p style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-gris-700)' }}>Actualizaciones</p>

              {hayActualizacion ? (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div style={{
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '12px 16px', borderRadius: 10,
                    background: 'rgba(37,99,235,.06)', border: '1px solid rgba(37,99,235,.2)',
                    fontSize: '0.8125rem', color: '#1e40af', fontWeight: 500,
                  }}>
                    <RefreshCw size={14} />
                    Nueva versión disponible
                  </div>
                  <Btn icon={RefreshCw} onClick={aplicarActualizacion} disabled={actualizando}>
                    {actualizando ? 'Actualizando...' : 'Aplicar actualización'}
                  </Btn>
                </div>
              ) : (
                <Btn icon={RefreshCw} variant="secondary" onClick={verificarActualizacion} disabled={verificando}>
                  {verificando ? 'Verificando...' : 'Verificar actualizaciones'}
                </Btn>
              )}
            </div>
          </div>
        </SeccionCard>

        {/* Respaldos */}
        <SeccionCard icon={Database} titulo="Respaldos" descripcion="Backup automático diario a Google Drive a las 2:00 AM">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>

            <div style={{
              padding: '11px 14px', borderRadius: 8,
              background: 'var(--color-gris-50)', border: '1px solid var(--color-gris-200)',
              fontSize: '0.8rem', color: 'var(--color-gris-600)', lineHeight: 1.6,
            }}>
              El sistema guarda automáticamente la base de datos y las imágenes en Google Drive todos los días a las <strong>2:00 AM</strong>.
              Los backups se conservan por <strong>30 días</strong> y luego se eliminan automáticamente.
            </div>

            {backupDriveStatus === 'ok' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8,
                background: 'rgba(5,150,105,.08)', border: '1px solid rgba(5,150,105,.25)',
                color: '#065f46', fontSize: '0.8125rem', fontWeight: 500,
              }}>
                <CheckCircle2 size={14} /> {backupDriveMsg}
              </div>
            )}
            {backupDriveStatus === 'error' && (
              <div style={{
                display: 'flex', alignItems: 'center', gap: 8, padding: '10px 14px', borderRadius: 8,
                background: 'rgba(220,38,38,.08)', border: '1px solid rgba(220,38,38,.25)',
                color: '#991b1b', fontSize: '0.8125rem', fontWeight: 500,
              }}>
                <AlertTriangle size={14} /> {backupDriveMsg}
              </div>
            )}

            <Btn
              icon={Cloud}
              onClick={ejecutarBackupDrive}
              disabled={backupDriveStatus === 'loading'}
            >
              {backupDriveStatus === 'loading' ? 'Enviando a Drive...' : 'Ejecutar backup ahora'}
            </Btn>

            <Btn icon={Download} variant="secondary" onClick={descargarBackup} disabled={descargandoBackup}>
              {descargandoBackup ? 'Descargando...' : 'Descargar backup local (JSON)'}
            </Btn>
          </div>
        </SeccionCard>

        <SeccionCard icon={Settings} titulo="Sistema" descripcion="Información de la instalación">
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            {[
              { label: 'Versión',      valor: 'Toyo+ 2025' },
              { label: 'Usuario',      valor: usuario?.nombre },
              { label: 'Rol',          valor: usuario?.rol === 'admin' ? 'Administrador' : 'Empleado' },
              { label: 'Email',        valor: usuario?.email },
            ].map(({ label, valor }) => (
              <div key={label} style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                padding: '9px 0', borderBottom: '1px solid var(--color-gris-100)',
                fontSize: '0.8125rem',
              }}>
                <span style={{ color: 'var(--color-gris-500)', fontWeight: 500 }}>{label}</span>
                <span style={{ color: 'var(--color-gris-800)', fontWeight: 600 }}>{valor}</span>
              </div>
            ))}
          </div>
        </SeccionCard>

      </div>
    </div>
  );
}
