import { useState, useEffect, useCallback } from 'react';
import {
  UserPlus, Shield, User, ToggleLeft, ToggleRight, Pencil,
  AlertCircle, Lock, Unlock, Trash2, Plus, ShieldCheck, KeyRound,
} from 'lucide-react';
import {
  SectionHeader, Btn, Modal, ModalFooter, Input, Select,
  Table, Td, Badge, Spinner, EmptyState,
} from '../components/UI';
import { usuarios as api, plantillasPermisos as rolesApi } from '../api';
import { toast } from '../utils/toast';
import { confirmar } from '../utils/confirmar';

// ── Definición de permisos disponibles ───────────────────────────────────────
const PERMISOS_CONFIG = [
  {
    grupo: 'Operaciones',
    items: [
      { key: 'inventario',    label: 'Inventario' },
      { key: 'lista-compras', label: 'Lista de Compras' },
      { key: 'compras',       label: 'Compras a Proveedores' },
      { key: 'conteo-fisico', label: 'Conteo Físico' },
      { key: 'clientes',      label: 'Clientes' },
      { key: 'ordenes',       label: 'Órdenes de Trabajo' },
    ],
  },
  {
    grupo: 'Finanzas',
    items: [
      { key: 'facturas-facturas',     label: 'Facturas' },
      { key: 'facturas-cotizaciones', label: 'Cotizaciones' },
      { key: 'gastos',                label: 'Gastos' },
      { key: 'cierre-caja',           label: 'Cierre de Caja' },
    ],
  },
  {
    grupo: 'Empresa',
    items: [
      { key: 'proveedores',   label: 'Proveedores' },
      { key: 'analisis',      label: 'Análisis' },
      { key: 'portafolio',    label: 'Portafolio' },
      { key: 'historial',     label: 'Historial' },
      { key: 'configuracion', label: 'Configuración' },
    ],
  },
  {
    grupo: 'Inteligencia',
    items: [
      { key: 'asesor',    label: 'Asesor IA' },
      { key: 'asistente', label: 'Asistente IA' },
    ],
  },
];

const TODAS_LAS_CLAVES = PERMISOS_CONFIG.flatMap(g => g.items.map(i => i.key));
const PERMISOS_VACIOS  = Object.fromEntries(TODAS_LAS_CLAVES.map(k => [k, false]));

// ── Avatar ────────────────────────────────────────────────────────────────────
function Avatar({ nombre, rol }) {
  return (
    <div style={{
      width: 36, height: 36, borderRadius: 10, flexShrink: 0,
      background: rol === 'admin'
        ? 'linear-gradient(135deg, var(--color-toyo), #7c3aed)'
        : 'linear-gradient(135deg, var(--color-gris-400), var(--color-gris-600))',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '0.8rem', fontWeight: 700, color: '#fff',
    }}>
      {nombre.charAt(0).toUpperCase()}
    </div>
  );
}

// ── Panel de checkboxes de permisos ───────────────────────────────────────────
function PermisosPanel({ permisos, onChange }) {
  const todas = TODAS_LAS_CLAVES.every(k => permisos[k]);

  const toggleTodas = () => {
    const val = !todas;
    const nuevo = {};
    TODAS_LAS_CLAVES.forEach(k => { nuevo[k] = val; });
    onChange(nuevo);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '8px 12px', borderRadius: 8,
        background: 'var(--color-gris-50)', border: '1px solid var(--color-gris-200)',
      }}>
        <span style={{ fontSize: '0.8125rem', fontWeight: 600, color: 'var(--color-gris-700)' }}>
          Seleccionar todo
        </span>
        <input
          type="checkbox" checked={todas} onChange={toggleTodas}
          style={{ width: 15, height: 15, accentColor: 'var(--color-toyo)', cursor: 'pointer' }}
        />
      </div>

      {PERMISOS_CONFIG.map(({ grupo, items }) => (
        <div key={grupo}>
          <p style={{
            fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.08em', color: 'var(--color-gris-400)', marginBottom: 6, paddingLeft: 2,
          }}>
            {grupo}
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 6 }}>
            {items.map(({ key, label }) => (
              <label key={key} style={{
                display: 'flex', alignItems: 'center', gap: 8,
                padding: '7px 10px', borderRadius: 8, cursor: 'pointer',
                background: permisos[key] ? 'rgba(220,38,38,.06)' : 'var(--color-gris-50)',
                border: `1px solid ${permisos[key] ? 'rgba(220,38,38,.25)' : 'var(--color-gris-200)'}`,
                transition: 'all 0.12s',
              }}>
                <input
                  type="checkbox" checked={!!permisos[key]}
                  onChange={() => onChange({ ...permisos, [key]: !permisos[key] })}
                  style={{ width: 14, height: 14, accentColor: 'var(--color-toyo)', cursor: 'pointer', flexShrink: 0 }}
                />
                <span style={{
                  fontSize: '0.78rem', fontWeight: 500,
                  color: permisos[key] ? 'var(--color-gris-800)' : 'var(--color-gris-500)',
                }}>
                  {label}
                </span>
              </label>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}

// ── Colores para las tarjetas de roles ────────────────────────────────────────
const COLORES_ROL = [
  { bg: 'rgba(220,38,38,.08)',  border: 'rgba(220,38,38,.2)',  text: '#b91c1c',  dot: '#dc2626' },
  { bg: 'rgba(37,99,235,.08)', border: 'rgba(37,99,235,.2)',  text: '#1d4ed8',  dot: '#2563eb' },
  { bg: 'rgba(5,150,105,.08)', border: 'rgba(5,150,105,.2)',  text: '#047857',  dot: '#059669' },
  { bg: 'rgba(124,58,237,.08)',border: 'rgba(124,58,237,.2)', text: '#6d28d9',  dot: '#7c3aed' },
  { bg: 'rgba(217,119,6,.08)', border: 'rgba(217,119,6,.2)',  text: '#b45309',  dot: '#d97706' },
  { bg: 'rgba(8,145,178,.08)', border: 'rgba(8,145,178,.2)',  text: '#0e7490',  dot: '#0891b2' },
];

// ── Componente principal ──────────────────────────────────────────────────────
export default function Usuarios() {
  const [lista, setLista]           = useState([]);
  const [roles, setRoles]           = useState([]);
  const [cargando, setCargando]     = useState(true);
  const [error, setError]           = useState('');

  // Modal usuario
  const [modalUsuario, setModalUsuario]   = useState(false);
  const [editandoUsuario, setEditandoU]   = useState(null);
  const [guardandoU, setGuardandoU]       = useState(false);
  const [formU, setFormU]                 = useState({ nombre: '', email: '', password: '', rol: 'empleado' });
  const [tipoAcceso, setTipoAcceso]       = useState('completo'); // 'completo' | 'rol' | 'personalizado'
  const [rolSeleccionado, setRolSel]      = useState('');
  const [permisosCustom, setPermisosC]    = useState(PERMISOS_VACIOS);

  // Modal reset password
  const [modalReset, setModalReset]   = useState(false);
  const [resetUsuario, setResetU]     = useState(null);
  const [resetPass, setResetPass]     = useState({ nueva: '', confirmar: '' });
  const [guardandoReset, setGReset]   = useState(false);

  // Modal rol
  const [modalRol, setModalRol]     = useState(false);
  const [editandoRol, setEditandoR] = useState(null);
  const [guardandoR, setGuardandoR] = useState(false);
  const [formRol, setFormRol]       = useState({ nombre: '', permisos: PERMISOS_VACIOS });

  const cargar = useCallback(async () => {
    try {
      setCargando(true);
      const [{ data: u }, { data: r }] = await Promise.all([api.listar(), rolesApi.listar()]);
      setLista(u);
      setRoles(r);
    } catch {
      setError('No se pudo cargar la información');
    } finally {
      setCargando(false);
    }
  }, []);

  useEffect(() => { cargar(); }, [cargar]);

  // ── Reset de contraseña ───────────────────────────────────────────────────
  const abrirReset = (u) => {
    setResetU(u);
    setResetPass({ nueva: '', confirmar: '' });
    setModalReset(true);
  };

  const guardarReset = async (e) => {
    e.preventDefault();
    if (resetPass.nueva.length < 6) { toast.error('Mínimo 6 caracteres'); return; }
    if (resetPass.nueva !== resetPass.confirmar) { toast.error('Las contraseñas no coinciden'); return; }
    setGReset(true);
    try {
      await api.actualizar(resetUsuario.id, { password: resetPass.nueva });
      setModalReset(false);
      toast.success(`Contraseña de ${resetUsuario.nombre} actualizada — deberá cambiarla al ingresar`);
    } catch {
      toast.error('Error al actualizar la contraseña');
    } finally {
      setGReset(false);
    }
  };

  // ── Acciones de roles ─────────────────────────────────────────────────────
  const abrirCrearRol = () => {
    setEditandoR(null);
    setFormRol({ nombre: '', permisos: PERMISOS_VACIOS });
    setModalRol(true);
  };

  const abrirEditarRol = (r) => {
    setEditandoR(r);
    setFormRol({ nombre: r.nombre, permisos: { ...PERMISOS_VACIOS, ...r.permisos } });
    setModalRol(true);
  };

  const guardarRol = async (e) => {
    e.preventDefault();
    if (!formRol.nombre.trim()) return;
    setGuardandoR(true);
    try {
      if (editandoRol) {
        await rolesApi.actualizar(editandoRol.id, { nombre: formRol.nombre, permisos: formRol.permisos });
      } else {
        await rolesApi.crear({ nombre: formRol.nombre, permisos: formRol.permisos });
      }
      setModalRol(false);
      cargar();
    } catch {
      toast.error('Error al guardar el rol');
    } finally {
      setGuardandoR(false);
    }
  };

  const eliminarRol = async (r) => {
    if (!await confirmar(`El rol "${r.nombre}" será eliminado.`, '¿Eliminar rol?')) return;
    try {
      await rolesApi.eliminar(r.id);
      cargar();
      toast.success('Rol eliminado');
    } catch {
      toast.error('Error al eliminar');
    }
  };

  // ── Acciones de usuarios ──────────────────────────────────────────────────
  const abrirCrearUsuario = () => {
    setEditandoU(null);
    setFormU({ nombre: '', email: '', password: '', rol: 'empleado' });
    setTipoAcceso('completo');
    setRolSel('');
    setPermisosC(PERMISOS_VACIOS);
    setModalUsuario(true);
  };

  const abrirEditarUsuario = (u) => {
    setEditandoU(u);
    setFormU({ nombre: u.nombre, email: u.email, password: '', rol: u.rol });
    if (!u.permisos || u.rol === 'admin') {
      setTipoAcceso('completo');
      setRolSel('');
      setPermisosC(PERMISOS_VACIOS);
    } else {
      // intentar detectar si coincide con algún rol existente
      const rolMatch = roles.find(r =>
        TODAS_LAS_CLAVES.every(k => !!r.permisos[k] === !!u.permisos[k])
      );
      if (rolMatch) {
        setTipoAcceso('rol');
        setRolSel(String(rolMatch.id));
      } else {
        setTipoAcceso('personalizado');
        setRolSel('');
      }
      setPermisosC({ ...PERMISOS_VACIOS, ...u.permisos });
    }
    setModalUsuario(true);
  };

  const resolverPermisos = () => {
    if (formU.rol === 'admin' || tipoAcceso === 'completo') return null;
    if (tipoAcceso === 'rol') {
      const r = roles.find(r => String(r.id) === rolSeleccionado);
      return r ? r.permisos : null;
    }
    return permisosCustom;
  };

  const guardarUsuario = async (e) => {
    e.preventDefault();
    setGuardandoU(true);
    try {
      const permisos = resolverPermisos();
      if (editandoUsuario) {
        const data = { nombre: formU.nombre, email: formU.email, rol: formU.rol, permisos };
        if (formU.password) data.password = formU.password;
        await api.actualizar(editandoUsuario.id, data);
      } else {
        await api.crear({ ...formU, permisos });
      }
      setModalUsuario(false);
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al guardar');
    } finally {
      setGuardandoU(false);
    }
  };

  const toggleActivo = async (u) => {
    try {
      if (u.activo) await api.eliminar(u.id);
      else await api.actualizar(u.id, { activo: true });
      cargar();
    } catch (err) {
      toast.error(err.response?.data?.error || 'Error al actualizar estado');
    }
  };

  const etiquetaAcceso = (u) => {
    if (u.rol === 'admin') return { texto: 'Total', color: '#059669', icon: Unlock };
    if (!u.permisos) return { texto: 'Completo', color: 'var(--color-gris-400)', icon: Unlock };
    const rolMatch = roles.find(r => TODAS_LAS_CLAVES.every(k => !!r.permisos[k] === !!u.permisos[k]));
    if (rolMatch) return { texto: rolMatch.nombre, color: '#2563eb', icon: ShieldCheck };
    const n = Object.values(u.permisos).filter(Boolean).length;
    return { texto: `${n} módulo${n !== 1 ? 's' : ''}`, color: '#d97706', icon: Lock };
  };

  if (cargando) return <div style={{ display: 'flex', justifyContent: 'center', padding: 60 }}><Spinner /></div>;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32 }}>
      <style>{`
        .usr-tabla { display: block; }
        .usr-cards { display: none; }
        @media (max-width: 700px) {
          .usr-tabla { display: none; }
          .usr-cards { display: flex; flex-direction: column; gap: 10px; }
        }
      `}</style>

      {error && (
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px', borderRadius: 10,
          background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.18)',
          color: 'var(--color-toyo)', fontSize: '0.8125rem',
        }}>
          <AlertCircle size={15} style={{ flexShrink: 0 }} />{error}
        </div>
      )}

      {/* ══════════════════════════════════════════════════════════
          SECCIÓN 1 — ROLES
      ══════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          title="Roles"
          subtitle={`${roles.length} rol${roles.length !== 1 ? 'es' : ''} definido${roles.length !== 1 ? 's' : ''}`}
          action={<Btn icon={Plus} onClick={abrirCrearRol}>Nuevo Rol</Btn>}
        />

        {roles.length === 0 ? (
          <div className="tarjeta" style={{ padding: '28px 20px', textAlign: 'center' }}>
            <ShieldCheck size={28} style={{ color: 'var(--color-gris-300)', marginBottom: 8 }} />
            <p style={{ fontSize: '0.875rem', fontWeight: 600, color: 'var(--color-gris-500)', marginBottom: 4 }}>
              No hay roles creados
            </p>
            <p style={{ fontSize: '0.8rem', color: 'var(--color-gris-400)', marginBottom: 16 }}>
              Crea roles con permisos específicos y asígnalos a tus empleados
            </p>
            <Btn icon={Plus} onClick={abrirCrearRol}>Crear primer rol</Btn>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 12 }}>
            {roles.map((r, idx) => {
              const col = COLORES_ROL[idx % COLORES_ROL.length];
              const activos = Object.values(r.permisos).filter(Boolean).length;
              const modulosActivos = PERMISOS_CONFIG.flatMap(g =>
                g.items.filter(i => r.permisos[i.key]).map(i => i.label)
              ).slice(0, 3);

              return (
                <div key={r.id} style={{
                  padding: '16px 18px', borderRadius: 14,
                  background: col.bg, border: `1px solid ${col.border}`,
                  display: 'flex', flexDirection: 'column', gap: 10,
                }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: 8 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      <div style={{
                        width: 34, height: 34, borderRadius: 9, flexShrink: 0,
                        background: col.bg, border: `1.5px solid ${col.border}`,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <ShieldCheck size={16} color={col.text} />
                      </div>
                      <div>
                        <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: col.text, lineHeight: 1.2 }}>
                          {r.nombre}
                        </p>
                        <p style={{ fontSize: '0.72rem', color: col.text, opacity: 0.7, marginTop: 2 }}>
                          {activos} módulo{activos !== 1 ? 's' : ''}
                        </p>
                      </div>
                    </div>
                    <div style={{ display: 'flex', gap: 4, flexShrink: 0 }}>
                      <button onClick={() => abrirEditarRol(r)} className="btn-icono btn-icono-azul" title="Editar rol">
                        <Pencil size={12} />
                      </button>
                      <button onClick={() => eliminarRol(r)} className="btn-icono btn-icono-rojo" title="Eliminar rol">
                        <Trash2 size={12} />
                      </button>
                    </div>
                  </div>

                  {activos > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                      {modulosActivos.map(m => (
                        <span key={m} style={{
                          fontSize: '0.68rem', fontWeight: 600, padding: '2px 7px', borderRadius: 99,
                          background: 'rgba(255,255,255,.6)', color: col.text,
                        }}>
                          {m}
                        </span>
                      ))}
                      {activos > 3 && (
                        <span style={{
                          fontSize: '0.68rem', fontWeight: 600, padding: '2px 7px', borderRadius: 99,
                          background: 'rgba(255,255,255,.6)', color: col.text,
                        }}>
                          +{activos - 3} más
                        </span>
                      )}
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* ══════════════════════════════════════════════════════════
          SECCIÓN 2 — USUARIOS
      ══════════════════════════════════════════════════════════ */}
      <section>
        <SectionHeader
          title="Usuarios del Sistema"
          subtitle={`${lista.length} usuario${lista.length !== 1 ? 's' : ''} registrado${lista.length !== 1 ? 's' : ''}`}
          action={<Btn icon={UserPlus} onClick={abrirCrearUsuario}>Nuevo Usuario</Btn>}
        />

        {lista.length === 0 ? (
          <EmptyState
            icon={User}
            title="Sin usuarios"
            description="Crea el primer usuario del sistema"
            action={<Btn icon={UserPlus} onClick={abrirCrearUsuario}>Crear usuario</Btn>}
          />
        ) : (
          <>
            <div className="usr-tabla tarjeta" style={{ padding: 0, overflow: 'hidden' }}>
              <Table headers={['Usuario', 'Email', 'Rol sistema', 'Acceso', 'Estado', '']}>
                {lista.map(u => {
                  const acc = etiquetaAcceso(u);
                  const AccIc = acc.icon;
                  return (
                    <tr key={u.id}>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                          <Avatar nombre={u.nombre} rol={u.rol} />
                          <span style={{ fontWeight: 500 }}>{u.nombre}</span>
                        </div>
                      </Td>
                      <Td style={{ color: 'var(--color-gris-500)' }}>{u.email}</Td>
                      <Td>
                        {u.rol === 'admin'
                          ? <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><Shield size={13} style={{ color: 'var(--color-toyo)' }} /><Badge variant="danger">Admin</Badge></div>
                          : <div style={{ display: 'flex', alignItems: 'center', gap: 6 }}><User size={13} style={{ color: 'var(--color-gris-500)' }} /><Badge variant="gris">Empleado</Badge></div>
                        }
                      </Td>
                      <Td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 5 }}>
                          <AccIc size={12} style={{ color: acc.color }} />
                          <span style={{ fontSize: '0.78rem', fontWeight: 600, color: acc.color }}>{acc.texto}</span>
                        </div>
                      </Td>
                      <Td>
                        {u.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="gris">Inactivo</Badge>}
                      </Td>
                      <Td>
                        <div style={{ display: 'flex', gap: 6 }}>
                          <button onClick={() => abrirEditarUsuario(u)} className="btn-icono btn-icono-azul" title="Editar usuario">
                            <Pencil size={13} />
                          </button>
                          <button onClick={() => abrirReset(u)} className="btn-icono btn-icono-gris" title="Resetear contraseña">
                            <KeyRound size={13} />
                          </button>
                          <button
                            onClick={() => toggleActivo(u)}
                            className={`btn-icono ${u.activo ? 'btn-icono-ambar' : 'btn-icono-verde'}`}
                            title={u.activo ? 'Desactivar' : 'Activar'}
                          >
                            {u.activo ? <ToggleRight size={13} /> : <ToggleLeft size={13} />}
                          </button>
                        </div>
                      </Td>
                    </tr>
                  );
                })}
              </Table>
            </div>

            <div className="usr-cards">
              {lista.map(u => {
                const acc = etiquetaAcceso(u);
                const AccIc = acc.icon;
                return (
                  <div key={u.id} className="tarjeta" style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                      <Avatar nombre={u.nombre} rol={u.rol} />
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 6, flexWrap: 'wrap' }}>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-gris-900)' }}>{u.nombre}</span>
                          {u.rol === 'admin' ? <Badge variant="danger">Admin</Badge> : <Badge variant="gris">Empleado</Badge>}
                          {u.activo ? <Badge variant="success">Activo</Badge> : <Badge variant="gris">Inactivo</Badge>}
                        </div>
                        <p style={{ fontSize: '0.8rem', color: 'var(--color-gris-500)', marginTop: 2, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                          {u.email}
                        </p>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 3 }}>
                          <AccIc size={11} style={{ color: acc.color }} />
                          <span style={{ fontSize: '0.75rem', fontWeight: 600, color: acc.color }}>{acc.texto}</span>
                        </div>
                      </div>
                      <div style={{ display: 'flex', gap: 6, flexShrink: 0 }}>
                        <button onClick={() => abrirEditarUsuario(u)} className="btn-icono btn-icono-azul" title="Editar">
                          <Pencil size={14} />
                        </button>
                        <button onClick={() => abrirReset(u)} className="btn-icono btn-icono-gris" title="Resetear contraseña">
                          <KeyRound size={14} />
                        </button>
                        <button
                          onClick={() => toggleActivo(u)}
                          className={`btn-icono ${u.activo ? 'btn-icono-ambar' : 'btn-icono-verde'}`}
                          title={u.activo ? 'Desactivar' : 'Activar'}
                        >
                          {u.activo ? <ToggleRight size={14} /> : <ToggleLeft size={14} />}
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </>
        )}
      </section>

      {/* ── Modal: Resetear contraseña ─────────────────────────────────────── */}
      {modalReset && (
        <Modal
          titulo={`Resetear contraseña · ${resetUsuario?.nombre}`}
          onClose={() => setModalReset(false)}
          size="sm"
        >
          <form onSubmit={guardarReset}>
            <div style={{
              display: 'flex', alignItems: 'flex-start', gap: 10, marginBottom: 20,
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(220,38,38,.05)', border: '1px solid rgba(220,38,38,.15)',
            }}>
              <KeyRound size={15} style={{ color: 'var(--color-toyo)', flexShrink: 0, marginTop: 2 }} />
              <p style={{ fontSize: '0.8rem', color: 'var(--color-gris-600)', lineHeight: 1.5 }}>
                Al guardar, <strong>{resetUsuario?.nombre}</strong> deberá cambiar esta contraseña la próxima vez que inicie sesión.
              </p>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              <Input
                label="Nueva contraseña"
                type="password"
                value={resetPass.nueva}
                onChange={e => setResetPass(p => ({ ...p, nueva: e.target.value }))}
                required
                placeholder="Mínimo 6 caracteres"
              />
              <Input
                label="Confirmar contraseña"
                type="password"
                value={resetPass.confirmar}
                onChange={e => setResetPass(p => ({ ...p, confirmar: e.target.value }))}
                required
                placeholder="Repite la contraseña"
              />
            </div>
            <ModalFooter>
              <Btn variant="secondary" onClick={() => setModalReset(false)} type="button">Cancelar</Btn>
              <Btn type="submit" disabled={guardandoReset || !resetPass.nueva || !resetPass.confirmar}>
                {guardandoReset ? 'Guardando...' : 'Actualizar contraseña'}
              </Btn>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* ── Modal: Crear / Editar Rol ───────────────────────────────────────── */}
      {modalRol && (
        <Modal
          titulo={editandoRol ? `Editar Rol: ${editandoRol.nombre}` : 'Nuevo Rol'}
          onClose={() => setModalRol(false)}
          size="lg"
        >
          <form onSubmit={guardarRol}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
              <Input
                label="Nombre del rol"
                value={formRol.nombre}
                onChange={e => setFormRol(f => ({ ...f, nombre: e.target.value }))}
                required
                placeholder="Ej: Mecánico, Vendedor, Cajero..."
              />
              <div>
                <p style={{
                  fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-gris-500)',
                  textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10,
                }}>
                  Módulos permitidos
                </p>
                <PermisosPanel
                  permisos={formRol.permisos}
                  onChange={p => setFormRol(f => ({ ...f, permisos: p }))}
                />
              </div>
            </div>
            <ModalFooter>
              <Btn variant="secondary" onClick={() => setModalRol(false)} type="button">Cancelar</Btn>
              <Btn type="submit" disabled={guardandoR || !formRol.nombre.trim()}>
                {guardandoR ? 'Guardando...' : editandoRol ? 'Guardar cambios' : 'Crear rol'}
              </Btn>
            </ModalFooter>
          </form>
        </Modal>
      )}

      {/* ── Modal: Crear / Editar Usuario ──────────────────────────────────── */}
      {modalUsuario && (
        <Modal
          titulo={editandoUsuario ? 'Editar Usuario' : 'Nuevo Usuario'}
          onClose={() => setModalUsuario(false)}
          size={tipoAcceso === 'personalizado' ? 'lg' : 'sm'}
        >
          <form onSubmit={guardarUsuario}>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
              <Input
                label="Nombre completo"
                value={formU.nombre}
                onChange={e => setFormU(f => ({ ...f, nombre: e.target.value }))}
                required placeholder="Juan Pérez"
              />
              <Input
                label="Correo electrónico"
                type="email"
                value={formU.email}
                onChange={e => setFormU(f => ({ ...f, email: e.target.value }))}
                required placeholder="usuario@ejemplo.com"
              />
              <Input
                label={editandoUsuario ? 'Nueva contraseña (vacío = no cambiar)' : 'Contraseña'}
                type="password"
                value={formU.password}
                onChange={e => setFormU(f => ({ ...f, password: e.target.value }))}
                required={!editandoUsuario}
                placeholder={editandoUsuario ? 'Nueva contraseña...' : 'Mínimo 6 caracteres'}
              />
              <Select
                label="Rol del sistema"
                value={formU.rol}
                onChange={e => setFormU(f => ({ ...f, rol: e.target.value }))}
              >
                <option value="empleado">Empleado</option>
                <option value="admin">Administrador</option>
              </Select>

              {/* ── Tipo de acceso (solo empleados) ── */}
              {formU.rol !== 'admin' && (
                <div style={{ borderTop: '1px solid var(--color-gris-100)', paddingTop: 16 }}>
                  <p style={{
                    fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-gris-500)',
                    textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 10,
                  }}>
                    Tipo de acceso
                  </p>

                  {/* Selector de tipo */}
                  <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                    {[
                      { val: 'completo',     label: 'Acceso completo' },
                      { val: 'rol',          label: 'Por rol',         disabled: roles.length === 0 },
                      { val: 'personalizado',label: 'Personalizado' },
                    ].map(({ val, label, disabled }) => (
                      <button
                        key={val}
                        type="button"
                        disabled={disabled}
                        onClick={() => { setTipoAcceso(val); if (val === 'rol' && !rolSeleccionado && roles.length > 0) setRolSel(String(roles[0].id)); }}
                        style={{
                          padding: '6px 14px', borderRadius: 20, cursor: disabled ? 'not-allowed' : 'pointer',
                          fontSize: '0.8rem', fontWeight: 600, transition: 'all 0.12s',
                          border: `1.5px solid ${tipoAcceso === val ? 'var(--color-toyo)' : 'var(--color-gris-200)'}`,
                          background: tipoAcceso === val ? 'rgba(220,38,38,.08)' : 'var(--color-gris-50)',
                          color: tipoAcceso === val ? 'var(--color-toyo)' : disabled ? 'var(--color-gris-300)' : 'var(--color-gris-600)',
                        }}
                      >
                        {label}
                      </button>
                    ))}
                  </div>

                  {/* Selector de rol */}
                  {tipoAcceso === 'rol' && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                      <p style={{ fontSize: '0.8rem', color: 'var(--color-gris-500)', marginBottom: 4 }}>
                        Selecciona el rol a asignar:
                      </p>
                      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 8 }}>
                        {roles.map((r, idx) => {
                          const col = COLORES_ROL[idx % COLORES_ROL.length];
                          const activo = rolSeleccionado === String(r.id);
                          return (
                            <button
                              key={r.id}
                              type="button"
                              onClick={() => setRolSel(String(r.id))}
                              style={{
                                display: 'flex', alignItems: 'center', gap: 8,
                                padding: '8px 16px', borderRadius: 10, cursor: 'pointer',
                                border: `2px solid ${activo ? col.dot : col.border}`,
                                background: activo ? col.bg : 'transparent',
                                transition: 'all 0.12s',
                              }}
                            >
                              <ShieldCheck size={14} color={col.text} />
                              <div style={{ textAlign: 'left' }}>
                                <p style={{ fontSize: '0.875rem', fontWeight: 700, color: col.text, lineHeight: 1.2 }}>
                                  {r.nombre}
                                </p>
                                <p style={{ fontSize: '0.68rem', color: col.text, opacity: 0.7 }}>
                                  {Object.values(r.permisos).filter(Boolean).length} módulos
                                </p>
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}

                  {/* Panel personalizado */}
                  {tipoAcceso === 'personalizado' && (
                    <PermisosPanel permisos={permisosCustom} onChange={setPermisosC} />
                  )}
                </div>
              )}
            </div>

            <ModalFooter>
              <Btn variant="secondary" onClick={() => setModalUsuario(false)} type="button">Cancelar</Btn>
              <Btn type="submit" disabled={guardandoU || (tipoAcceso === 'rol' && !rolSeleccionado)}>
                {guardandoU ? 'Guardando...' : editandoUsuario ? 'Guardar cambios' : 'Crear usuario'}
              </Btn>
            </ModalFooter>
          </form>
        </Modal>
      )}
    </div>
  );
}
