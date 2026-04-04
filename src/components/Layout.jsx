import { NavLink, Outlet, useLocation, useNavigate } from 'react-router-dom';
import {
  LayoutDashboard, Package, Users, Wrench, FileText,
  TrendingDown, Images, Truck, Sparkles, Menu, X, ChevronRight, Zap,
  LogOut, UserCog, ShoppingCart, Settings, History,
  DollarSign, ClipboardCheck, Bell, Brain, PackagePlus, BarChart2,
  MoreHorizontal, Search,
} from 'lucide-react';
import { useState, useEffect, useRef, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { asesor as asesorApi, buscar as buscarApi } from '../api';
import { Toaster, ConfirmDialog } from './UI';

const navGrupos = [
  {
    etiqueta: 'Principal',
    items: [
      { to: '/', label: 'Dashboard', icon: LayoutDashboard },
    ],
  },
  {
    etiqueta: 'Operaciones',
    items: [
      { to: '/inventario',    label: 'Inventario',        icon: Package,        permiso: 'inventario' },
      { to: '/lista-compras', label: 'Lista de Compras',  icon: ShoppingCart,   permiso: 'lista-compras' },
      { to: '/compras',       label: 'Compras a Proveed.',icon: PackagePlus,    permiso: 'compras' },
      { to: '/conteo-fisico', label: 'Conteo Físico',     icon: ClipboardCheck, permiso: 'conteo-fisico' },
      { to: '/clientes',      label: 'Clientes',          icon: Users,          permiso: 'clientes' },
      { to: '/ordenes',       label: 'Órdenes de Trabajo',icon: Wrench,         permiso: 'ordenes' },
    ],
  },
  {
    etiqueta: 'Finanzas',
    items: [
      { to: '/facturas',    label: 'Facturas',       icon: FileText,    permiso: 'facturas' },
      { to: '/gastos',      label: 'Gastos',         icon: TrendingDown,permiso: 'gastos' },
      { to: '/cierre-caja', label: 'Cierre de Caja', icon: DollarSign,  permiso: 'cierre-caja' },
    ],
  },
  {
    etiqueta: 'Empresa',
    items: [
      { to: '/proveedores',   label: 'Proveedores',  icon: Truck,     permiso: 'proveedores' },
      { to: '/analisis',      label: 'Análisis',     icon: BarChart2, permiso: 'analisis' },
      { to: '/portafolio',    label: 'Portafolio',   icon: Images,    permiso: 'portafolio' },
      { to: '/historial',     label: 'Historial',    icon: History,   permiso: 'historial' },
      { to: '/configuracion', label: 'Configuración',icon: Settings,  permiso: 'configuracion' },
    ],
  },
];

const nombresPagina = {
  '/':               'Dashboard',
  '/inventario':     'Inventario',
  '/lista-compras':  'Lista de Compras',
  '/clientes':       'Clientes',
  '/ordenes':        'Órdenes de Trabajo',
  '/facturas':       'Facturas',
  '/gastos':         'Gastos',
  '/proveedores':    'Proveedores',
  '/portafolio':     'Portafolio',
  '/asistente':      'Asistente IA',
  '/asesor':         'Asesor de Negocios IA',
  '/usuarios':       'Usuarios del Sistema',
  '/historial':      'Historial de Movimientos',
  '/cierre-caja':   'Cierre de Caja',
  '/conteo-fisico': 'Conteo Físico de Inventario',
  '/compras':       'Compras a Proveedores',
  '/analisis':      'Análisis de Negocio',
  '/configuracion':  'Configuración',
};

/* ---------------------------------------------------------- */
/*  SIDEBAR                                                    */
/* ---------------------------------------------------------- */
function Sidebar({ abierto, cerrar, usuario, onLogout, noLeidas = 0, tienePermiso }) {
  return (
    <>
      {abierto && (
        <div
          onClick={cerrar}
          style={{
            position: 'fixed', inset: 0,
            background: 'rgba(15,23,42,.55)',
            backdropFilter: 'blur(3px)',
            zIndex: 20,
          }}
          className="lg:hidden"
        />
      )}

      <aside
        className="scrollbar-hidden"
        style={{
          position: 'fixed',
          top: 0, left: 0, bottom: 0,
          width: 256,
          background: 'var(--color-sidebar)',
          display: 'flex',
          flexDirection: 'column',
          zIndex: 30,
          transition: 'transform 0.25s cubic-bezier(.4,0,.2,1)',
          transform: abierto ? 'translateX(0)' : undefined,
        }}
        /* En lg siempre visible via CSS */
      >
        {/* ── Logo ── */}
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '20px 20px 18px',
          borderBottom: '1px solid var(--color-sidebar-borde)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
            <div style={{
              width: 36, height: 36, borderRadius: 10,
              background: 'linear-gradient(135deg, var(--color-toyo) 0%, var(--color-toyo-oscuro) 100%)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              boxShadow: '0 4px 12px rgba(220,38,38,.4)',
              flexShrink: 0,
            }}>
              <Zap size={16} color="#fff" fill="#fff" />
            </div>
            <div>
              <p style={{ color: '#fff', fontWeight: 700, fontSize: '0.9375rem', lineHeight: 1 }}>Toyo+</p>
              <p style={{ color: 'rgba(255,255,255,.35)', fontSize: '0.7rem', marginTop: 3 }}>Sistema de Gestión</p>
            </div>
          </div>
          <button
            onClick={cerrar}
            className="lg:hidden"
            style={{
              width: 28, height: 28, borderRadius: 7,
              border: 'none', background: 'transparent',
              color: 'rgba(255,255,255,.4)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}
          >
            <X size={15} />
          </button>
        </div>

        {/* ── Navegación ── */}
        <nav style={{ flex: 1, padding: '12px 10px', overflowY: 'auto' }}>
          {navGrupos.map(grupo => {
            const itemsVisibles = grupo.items.filter(item => !item.permiso || tienePermiso(item.permiso));
            if (itemsVisibles.length === 0) return null;
            return (
            <div key={grupo.etiqueta} style={{ marginBottom: 20 }}>
              <p style={{
                padding: '0 10px',
                marginBottom: 4,
                fontSize: '0.65rem',
                fontWeight: 700,
                textTransform: 'uppercase',
                letterSpacing: '0.1em',
                color: 'rgba(255,255,255,.22)',
              }}>
                {grupo.etiqueta}
              </p>
              {itemsVisibles.map(({ to, label, icon: Icon }) => (
                <NavLink
                  key={to}
                  to={to}
                  end={to === '/'}
                  onClick={cerrar}
                  style={({ isActive }) => ({
                    display: 'flex', alignItems: 'center', gap: 10,
                    padding: '9px 10px',
                    borderRadius: 10,
                    marginBottom: 1,
                    textDecoration: 'none',
                    fontSize: '0.8125rem',
                    fontWeight: 500,
                    transition: 'background 0.12s, color 0.12s',
                    position: 'relative',
                    color: isActive ? '#fff' : 'var(--color-sidebar-texto)',
                    background: isActive ? 'rgba(220,38,38,.18)' : 'transparent',
                    boxShadow: isActive ? 'inset 0 0 0 1px rgba(220,38,38,.22)' : 'none',
                  })}
                  className={({ isActive }) => isActive ? '' : 'sidebar-item'}
                >
                  {({ isActive }) => (
                    <>
                      {isActive && (
                        <div style={{
                          position: 'absolute', left: -10, top: '50%',
                          transform: 'translateY(-50%)',
                          width: 3, height: 20,
                          borderRadius: '0 3px 3px 0',
                          background: 'var(--color-toyo)',
                        }} />
                      )}
                      <div style={{
                        width: 28, height: 28, borderRadius: 7,
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                        flexShrink: 0,
                        background: isActive ? 'rgba(220,38,38,.3)' : 'transparent',
                        transition: 'background 0.12s',
                      }}>
                        <Icon size={14} color={isActive ? '#fca5a5' : undefined} />
                      </div>
                      <span style={{ flex: 1 }}>{label}</span>
                      {isActive && <ChevronRight size={12} style={{ color: '#fca5a5', opacity: 0.7 }} />}
                    </>
                  )}
                </NavLink>
              ))}
            </div>
            );
          })}

          {/* ── Admin: Usuarios ── */}
          {usuario?.rol === 'admin' && (
            <div style={{ marginBottom: 20 }}>
              <p style={{
                padding: '0 10px', marginBottom: 4,
                fontSize: '0.65rem', fontWeight: 700,
                textTransform: 'uppercase', letterSpacing: '0.1em',
                color: 'rgba(255,255,255,.22)',
              }}>
                Administración
              </p>
              <NavLink
                to="/usuarios"
                end
                onClick={cerrar}
                style={({ isActive }) => ({
                  display: 'flex', alignItems: 'center', gap: 10,
                  padding: '9px 10px', borderRadius: 10, marginBottom: 1,
                  textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 500,
                  transition: 'background 0.12s, color 0.12s', position: 'relative',
                  color: isActive ? '#fff' : 'var(--color-sidebar-texto)',
                  background: isActive ? 'rgba(220,38,38,.18)' : 'transparent',
                  boxShadow: isActive ? 'inset 0 0 0 1px rgba(220,38,38,.22)' : 'none',
                })}
                className={({ isActive }) => isActive ? '' : 'sidebar-item'}
              >
                {({ isActive }) => (
                  <>
                    {isActive && (
                      <div style={{
                        position: 'absolute', left: -10, top: '50%',
                        transform: 'translateY(-50%)',
                        width: 3, height: 20, borderRadius: '0 3px 3px 0',
                        background: 'var(--color-toyo)',
                      }} />
                    )}
                    <div style={{
                      width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                      background: isActive ? 'rgba(220,38,38,.3)' : 'transparent',
                      transition: 'background 0.12s',
                    }}>
                      <UserCog size={14} color={isActive ? '#fca5a5' : undefined} />
                    </div>
                    <span style={{ flex: 1 }}>Usuarios</span>
                    {isActive && <ChevronRight size={12} style={{ color: '#fca5a5', opacity: 0.7 }} />}
                  </>
                )}
              </NavLink>
            </div>
          )}

          {/* ── Inteligencia IA ── */}
          <div style={{ padding: '0 0 8px' }}>
            <p style={{
              padding: '0 10px', marginBottom: 4,
              fontSize: '0.65rem', fontWeight: 700,
              textTransform: 'uppercase', letterSpacing: '0.1em',
              color: 'rgba(255,255,255,.22)',
            }}>
              Inteligencia
            </p>
            <NavLink
              to="/asesor"
              onClick={cerrar}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10, marginBottom: 4,
                textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 600,
                transition: 'all 0.15s',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(124,58,237,.3), rgba(220,38,38,.22))'
                  : 'linear-gradient(135deg, rgba(124,58,237,.12), rgba(220,38,38,.08))',
                boxShadow: isActive
                  ? 'inset 0 0 0 1px rgba(124,58,237,.3)'
                  : 'inset 0 0 0 1px rgba(124,58,237,.15)',
                color: isActive ? '#fff' : 'rgba(255,255,255,.65)',
                position: 'relative',
              })}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'linear-gradient(135deg, #7c3aed, #dc2626)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Brain size={14} color="#fff" />
              </div>
              <span style={{ flex: 1 }}>Asesor IA</span>
              {noLeidas > 0 && (
                <span style={{
                  fontSize: '0.65rem', fontWeight: 700, padding: '2px 6px', borderRadius: 99,
                  background: '#dc2626', color: '#fff', minWidth: 18, textAlign: 'center',
                }}>
                  {noLeidas}
                </span>
              )}
            </NavLink>
            <NavLink
              to="/asistente"
              onClick={cerrar}
              style={({ isActive }) => ({
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 12px', borderRadius: 10,
                textDecoration: 'none', fontSize: '0.8125rem', fontWeight: 600,
                transition: 'all 0.15s',
                background: isActive
                  ? 'linear-gradient(135deg, rgba(124,58,237,.3), rgba(220,38,38,.22))'
                  : 'linear-gradient(135deg, rgba(124,58,237,.12), rgba(220,38,38,.08))',
                boxShadow: isActive
                  ? 'inset 0 0 0 1px rgba(124,58,237,.3)'
                  : 'inset 0 0 0 1px rgba(124,58,237,.15)',
                color: isActive ? '#fff' : 'rgba(255,255,255,.65)',
              })}
            >
              <div style={{
                width: 28, height: 28, borderRadius: 7,
                background: 'linear-gradient(135deg, #7c3aed, #dc2626)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}>
                <Sparkles size={14} color="#fff" />
              </div>
              <span style={{ flex: 1 }}>Asistente IA</span>
              <span style={{
                fontSize: '0.6rem', fontWeight: 700, padding: '2px 6px', borderRadius: 99,
                background: 'linear-gradient(135deg, #7c3aed, #dc2626)',
                color: '#fff', letterSpacing: '0.04em',
              }}>
                IA
              </span>
            </NavLink>
          </div>
        </nav>

        {/* ── Footer: usuario + logout ── */}
        <div style={{
          padding: '14px 14px',
          borderTop: '1px solid var(--color-sidebar-borde)',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            <div style={{
              width: 32, height: 32, borderRadius: 9, flexShrink: 0,
              background: usuario?.rol === 'admin'
                ? 'linear-gradient(135deg, var(--color-toyo), #7c3aed)'
                : 'linear-gradient(135deg, var(--color-gris-500), var(--color-gris-700))',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              fontSize: '0.75rem', fontWeight: 700, color: '#fff',
            }}>
              {usuario?.nombre?.charAt(0)?.toUpperCase() || 'U'}
            </div>
            <div style={{ flex: 1, minWidth: 0 }}>
              <p style={{
                color: 'rgba(255,255,255,.75)', fontSize: '0.75rem', fontWeight: 600,
                whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis',
              }}>
                {usuario?.nombre || 'Usuario'}
              </p>
              <p style={{ color: 'rgba(255,255,255,.3)', fontSize: '0.68rem', textTransform: 'capitalize' }}>
                {usuario?.rol || 'empleado'}
              </p>
            </div>
            <button
              onClick={onLogout}
              title="Cerrar sesión"
              style={{
                width: 28, height: 28, borderRadius: 7, flexShrink: 0,
                border: 'none', background: 'rgba(255,255,255,.06)',
                color: 'rgba(255,255,255,.35)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'background 0.12s, color 0.12s',
              }}
              onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,.2)'; e.currentTarget.style.color = '#fca5a5'; }}
              onMouseLeave={e => { e.currentTarget.style.background = 'rgba(255,255,255,.06)'; e.currentTarget.style.color = 'rgba(255,255,255,.35)'; }}
            >
              <LogOut size={13} />
            </button>
          </div>
        </div>
      </aside>

      {/* CSS inline para hover del sidebar en desktop */}
      <style>{`
        @media (min-width: 1024px) {
          aside { position: static !important; transform: none !important; }
        }
        @media (max-width: 1023px) {
          aside { transform: ${abierto ? 'translateX(0)' : 'translateX(-100%)'}; }
        }
        .sidebar-item:hover {
          background: rgba(255,255,255,.05) !important;
          color: rgba(255,255,255,.85) !important;
        }
      `}</style>
    </>
  );
}

/* ---------------------------------------------------------- */
/*  BARRA INFERIOR MÓVIL                                       */
/* ---------------------------------------------------------- */
const navBottom = [
  { to: '/',           label: 'Inicio',    icon: LayoutDashboard },
  { to: '/inventario', label: 'Inventario',icon: Package },
  { to: '/ordenes',    label: 'Órdenes',   icon: Wrench },
  { to: '/facturas',   label: 'Facturas',  icon: FileText },
];

function BottomNav({ onMenuOpen, noLeidas }) {
  const location = useLocation();
  return (
    <>
      <nav className="bottom-nav-mobile" style={{
        position: 'fixed', bottom: 0, left: 0, right: 0,
        background: 'rgba(15,23,42,0.97)',
        backdropFilter: 'blur(12px)',
        borderTop: '1px solid rgba(255,255,255,.08)',
        alignItems: 'stretch',
        zIndex: 40,
        paddingBottom: 'env(safe-area-inset-bottom, 0px)',
        paddingLeft: 'env(safe-area-inset-left, 0px)',
        paddingRight: 'env(safe-area-inset-right, 0px)',
      }}>
        {navBottom.map(({ to, label, icon: Icon }) => {
          const active = to === '/' ? location.pathname === '/' : location.pathname.startsWith(to);
          return (
            <NavLink key={to} to={to} end={to === '/'} style={{
              flex: 1, display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 3,
              textDecoration: 'none', padding: '6px 0', height: 62,
              color: active ? '#fca5a5' : 'rgba(255,255,255,.35)',
              fontSize: '0.6rem', fontWeight: active ? 700 : 500,
              position: 'relative',
              transition: 'color 0.15s',
            }}>
              {active && (
                <span style={{
                  position: 'absolute', top: 0, left: '50%', transform: 'translateX(-50%)',
                  width: 28, height: 2, borderRadius: '0 0 3px 3px',
                  background: '#dc2626',
                }} />
              )}
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: active ? 'rgba(220,38,38,.2)' : 'transparent',
                transition: 'background 0.15s',
              }}>
                <Icon size={16} />
              </div>
              {label}
            </NavLink>
          );
        })}

        {/* Botón Más → abre el sidebar */}
        <button onClick={onMenuOpen} style={{
          flex: 1, display: 'flex', flexDirection: 'column',
          alignItems: 'center', justifyContent: 'center', gap: 3,
          border: 'none', background: 'transparent', cursor: 'pointer',
          color: 'rgba(255,255,255,.35)', fontSize: '0.6rem', fontWeight: 500,
          padding: '6px 0', height: 62, position: 'relative',
        }}>
          {noLeidas > 0 && (
            <span style={{
              position: 'absolute', top: 6, right: 'calc(50% - 20px)',
              background: '#dc2626', color: '#fff',
              fontSize: '0.55rem', fontWeight: 700,
              padding: '1px 4px', borderRadius: 99, minWidth: 14, textAlign: 'center',
            }}>
              {noLeidas}
            </span>
          )}
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <MoreHorizontal size={16} />
          </div>
          Más
        </button>
      </nav>

      {/* CSS: barra solo visible en móvil, padding bottom para no tapar contenido */}
      <style>{`
        .bottom-nav-mobile { display: none; }
        @media (max-width: 1023px) {
          .bottom-nav-mobile { display: flex; }
          .main-content {
            padding: 16px 12px calc(62px + env(safe-area-inset-bottom, 0px) + 8px) !important;
          }
        }
      `}</style>
    </>
  );
}

/* ---------------------------------------------------------- */
/*  BUSCADOR GLOBAL                                            */
/* ---------------------------------------------------------- */
function BuscadorGlobal({ navigate }) {
  const [q, setQ] = useState('');
  const [resultados, setResultados] = useState(null);
  const [buscando, setBuscando] = useState(false);
  const [abierto, setAbierto] = useState(false);
  const timer = useRef(null);
  const ref = useRef(null);

  useEffect(() => {
    const cerrar = (e) => { if (ref.current && !ref.current.contains(e.target)) setAbierto(false); };
    document.addEventListener('mousedown', cerrar);
    return () => document.removeEventListener('mousedown', cerrar);
  }, []);

  useEffect(() => {
    clearTimeout(timer.current);
    if (!q.trim() || q.trim().length < 2) { setResultados(null); setAbierto(false); return; }
    timer.current = setTimeout(async () => {
      setBuscando(true);
      try {
        const r = await buscarApi.global(q.trim());
        setResultados(r.data);
        setAbierto(true);
      } catch { /* silencioso */ }
      finally { setBuscando(false); }
    }, 320);
  }, [q]);

  const ir = (ruta) => { navigate(ruta); setQ(''); setAbierto(false); setResultados(null); };

  const total = resultados
    ? (resultados.clientes.length + resultados.ordenes.length + resultados.facturas.length + resultados.productos.length)
    : 0;

  return (
    <div ref={ref} style={{ position: 'relative', flex: 1, maxWidth: 360 }}>
      <div style={{ position: 'relative' }}>
        <Search size={13} style={{ position: 'absolute', left: 10, top: '50%', transform: 'translateY(-50%)', color: 'var(--color-gris-400)', pointerEvents: 'none' }} />
        <input
          type="text"
          value={q}
          onChange={e => setQ(e.target.value)}
          onFocus={() => { if (resultados) setAbierto(true); }}
          placeholder="Buscar clientes, órdenes, facturas..."
          style={{
            width: '100%', paddingLeft: 32, paddingRight: q ? 28 : 12,
            height: 34, border: '1px solid var(--color-gris-200)',
            borderRadius: 9, fontSize: '0.8125rem', outline: 'none',
            background: 'var(--color-gris-50)', color: 'var(--color-gris-800)',
            transition: 'border-color 0.15s',
          }}
          onMouseEnter={e => e.target.style.borderColor = 'var(--color-gris-300)'}
          onMouseLeave={e => { if (document.activeElement !== e.target) e.target.style.borderColor = 'var(--color-gris-200)'; }}
          onFocusCapture={e => e.target.style.borderColor = '#dc2626'}
          onBlurCapture={e => e.target.style.borderColor = 'var(--color-gris-200)'}
        />
        {q && (
          <button onClick={() => { setQ(''); setAbierto(false); }} style={{ position: 'absolute', right: 8, top: '50%', transform: 'translateY(-50%)', border: 'none', background: 'transparent', cursor: 'pointer', color: 'var(--color-gris-400)', display: 'flex', alignItems: 'center' }}>
            <X size={12} />
          </button>
        )}
      </div>

      {abierto && (
        <div style={{
          position: 'absolute', top: 'calc(100% + 6px)', left: 0, right: 0, zIndex: 200,
          background: '#fff', border: '1px solid var(--color-gris-200)',
          borderRadius: 12, boxShadow: '0 8px 32px rgba(0,0,0,.12)',
          overflow: 'hidden', maxHeight: 420, overflowY: 'auto',
        }}>
          {buscando && <div style={{ padding: '12px 16px', fontSize: '0.8rem', color: 'var(--color-gris-400)' }}>Buscando...</div>}
          {!buscando && total === 0 && <div style={{ padding: '14px 16px', fontSize: '0.8rem', color: 'var(--color-gris-400)' }}>Sin resultados para "{q}"</div>}

          {!buscando && resultados?.clientes.length > 0 && (
            <div>
              <p style={{ padding: '8px 14px 4px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gris-400)' }}>Clientes</p>
              {resultados.clientes.map(c => (
                <button key={c.id} onClick={() => ir('/clientes')} style={{ display: 'flex', flexDirection: 'column', width: '100%', padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-gris-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <span style={{ fontWeight: 600, fontSize: '0.8375rem', color: 'var(--color-gris-900)' }}>{c.nombre}</span>
                  {(c.cedula || c.telefono) && <span style={{ fontSize: '0.73rem', color: 'var(--color-gris-400)' }}>{[c.cedula, c.telefono].filter(Boolean).join(' · ')}</span>}
                </button>
              ))}
            </div>
          )}

          {!buscando && resultados?.ordenes.length > 0 && (
            <div>
              <p style={{ padding: '8px 14px 4px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gris-400)' }}>Órdenes</p>
              {resultados.ordenes.map(o => (
                <button key={o.id} onClick={() => ir('/ordenes')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-gris-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.8375rem', color: 'var(--color-gris-900)', fontFamily: 'monospace' }}>{o.numero}</span>
                    <span style={{ fontSize: '0.73rem', color: 'var(--color-gris-500)', marginLeft: 8 }}>{o.vehiculo?.cliente?.nombre}</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-gris-400)', textTransform: 'capitalize' }}>{o.estado}</span>
                </button>
              ))}
            </div>
          )}

          {!buscando && resultados?.facturas.length > 0 && (
            <div>
              <p style={{ padding: '8px 14px 4px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gris-400)' }}>Facturas</p>
              {resultados.facturas.map(f => (
                <button key={f.id} onClick={() => ir('/facturas')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-gris-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.8375rem', color: 'var(--color-gris-900)', fontFamily: 'monospace' }}>{f.numero}</span>
                    <span style={{ fontSize: '0.73rem', color: 'var(--color-gris-500)', marginLeft: 8 }}>{f.cliente?.nombre}</span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: 'var(--color-gris-400)', textTransform: 'capitalize' }}>{f.estado}</span>
                </button>
              ))}
            </div>
          )}

          {!buscando && resultados?.productos.length > 0 && (
            <div>
              <p style={{ padding: '8px 14px 4px', fontSize: '0.65rem', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.06em', color: 'var(--color-gris-400)' }}>Productos</p>
              {resultados.productos.map(p => (
                <button key={p.id} onClick={() => ir('/inventario')} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', padding: '8px 14px', border: 'none', background: 'transparent', cursor: 'pointer', textAlign: 'left' }}
                  onMouseEnter={e => e.currentTarget.style.background = 'var(--color-gris-50)'}
                  onMouseLeave={e => e.currentTarget.style.background = 'transparent'}>
                  <div>
                    <span style={{ fontWeight: 600, fontSize: '0.8375rem', color: 'var(--color-gris-900)' }}>{p.nombre}</span>
                    {p.codigo && <span style={{ fontSize: '0.73rem', color: 'var(--color-gris-400)', marginLeft: 8 }}>{p.codigo}</span>}
                  </div>
                  <span style={{ fontSize: '0.73rem', color: 'var(--color-gris-500)' }}>Stock: {p.stock}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

/* ---------------------------------------------------------- */
/*  LAYOUT PRINCIPAL                                           */
/* ---------------------------------------------------------- */
export default function Layout() {
  const [sidebarAbierto, setSidebarAbierto] = useState(false);
  const [noLeidas, setNoLeidas] = useState(0);
  const location = useLocation();
  const navigate = useNavigate();
  const { usuario, logout, tienePermiso } = useAuth();
  const pagina = nombresPagina[location.pathname] || 'Toyo+';


  useEffect(() => {
    asesorApi.notificaciones()
      .then(r => setNoLeidas(r.data.noLeidas || 0))
      .catch(() => {});
    const intervalo = setInterval(() => {
      asesorApi.notificaciones()
        .then(r => setNoLeidas(r.data.noLeidas || 0))
        .catch(() => {});
    }, 5 * 60 * 1000);
    return () => clearInterval(intervalo);
  }, []);

  const handleLogout = () => {
    logout();
    navigate('/login', { replace: true });
  };

  return (
    <>
    <div style={{ display: 'flex', height: '100dvh', overflow: 'hidden', background: 'var(--color-fondo)' }}>
      <Sidebar abierto={sidebarAbierto} cerrar={() => setSidebarAbierto(false)} usuario={usuario} onLogout={handleLogout} noLeidas={noLeidas} tienePermiso={tienePermiso} />

      <div style={{ flex: 1, display: 'flex', flexDirection: 'column', overflow: 'hidden', minWidth: 0 }}>
        {/* ── Topbar ── */}
        <header style={{
          background: 'rgba(255,255,255,.92)',
          backdropFilter: 'blur(8px)',
          borderBottom: '1px solid rgba(0,0,0,.06)',
          boxShadow: '0 1px 3px rgba(0,0,0,.04)',
          paddingTop: 'env(safe-area-inset-top, 0px)',
          flexShrink: 0,
        }}>
        <div style={{
          height: 58,
          display: 'flex', alignItems: 'center',
          padding: '0 24px',
          justifyContent: 'space-between',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 14, flex: 1, minWidth: 0 }}>
            <button
              onClick={() => setSidebarAbierto(true)}
              className="lg:hidden"
              style={{
                width: 34, height: 34, borderRadius: 8,
                border: 'none', background: 'transparent',
                color: 'var(--color-gris-600)', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                flexShrink: 0,
              }}
            >
              <Menu size={18} />
            </button>

            {/* Breadcrumb desktop */}
            <div className="hidden lg:flex" style={{ alignItems: 'center', gap: 6, flexShrink: 0 }}>
              <span style={{ color: 'var(--color-gris-500)', fontSize: '0.8125rem' }}>Toyo+</span>
              <ChevronRight size={13} style={{ color: 'var(--color-gris-400)' }} />
              <span style={{ color: 'var(--color-gris-900)', fontSize: '0.8125rem', fontWeight: 600 }}>{pagina}</span>
            </div>

            {/* Título móvil */}
            <span className="lg:hidden" style={{ fontSize: '0.9375rem', fontWeight: 700, color: 'var(--color-gris-900)', flexShrink: 0 }}>
              {pagina}
            </span>

            {/* Búsqueda global — solo desktop */}
            <div className="hidden lg:flex" style={{ flex: 1, maxWidth: 380 }}>
              <BuscadorGlobal navigate={navigate} />
            </div>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {/* Campana notificaciones IA */}
            <button
              onClick={() => navigate('/asesor')}
              title={noLeidas > 0 ? `${noLeidas} recomendaciones nuevas` : 'Asesor IA'}
              style={{
                position: 'relative', width: 34, height: 34, borderRadius: 9,
                border: '1px solid var(--color-gris-200)',
                background: noLeidas > 0 ? 'rgba(124,58,237,.08)' : 'var(--color-gris-50)',
                color: noLeidas > 0 ? '#7c3aed' : 'var(--color-gris-500)',
                cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center',
                transition: 'all 0.15s',
              }}
            >
              <Bell size={15} />
              {noLeidas > 0 && (
                <span style={{
                  position: 'absolute', top: -4, right: -4,
                  background: '#dc2626', color: '#fff',
                  fontSize: '0.6rem', fontWeight: 700, lineHeight: 1,
                  padding: '2px 4px', borderRadius: 99, minWidth: 16, textAlign: 'center',
                }}>
                  {noLeidas}
                </span>
              )}
            </button>

            {/* Indicador sistema activo */}
            <div className="hidden sm:flex" style={{
              alignItems: 'center', gap: 6,
              padding: '5px 12px', borderRadius: 99,
              border: '1px solid var(--color-gris-200)',
              background: 'var(--color-gris-50)',
              fontSize: '0.75rem', color: 'var(--color-gris-500)',
            }}>
              <span className="dot-activo" />
              Sistema activo
            </div>

            {/* Avatar + nombre + logout */}
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div className="hidden sm:block" style={{ textAlign: 'right' }}>
                <p style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--color-gris-800)', lineHeight: 1.2 }}>
                  {usuario?.nombre}
                </p>
                <p style={{ fontSize: '0.7rem', color: 'var(--color-gris-400)', textTransform: 'capitalize' }}>
                  {usuario?.rol}
                </p>
              </div>
              <div style={{
                width: 32, height: 32, borderRadius: 9,
                background: usuario?.rol === 'admin'
                  ? 'linear-gradient(135deg, var(--color-toyo), #7c3aed)'
                  : 'linear-gradient(135deg, var(--color-gris-500), var(--color-gris-700))',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: '0.7rem', fontWeight: 700, color: '#fff',
                boxShadow: '0 2px 8px rgba(220,38,38,.25)',
              }}>
                {usuario?.nombre?.charAt(0)?.toUpperCase() || 'U'}
              </div>
              <button
                onClick={handleLogout}
                title="Cerrar sesión"
                style={{
                  width: 32, height: 32, borderRadius: 8,
                  border: '1px solid var(--color-gris-200)',
                  background: 'var(--color-gris-50)',
                  color: 'var(--color-gris-400)', cursor: 'pointer',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => { e.currentTarget.style.background = 'rgba(220,38,38,.08)'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.borderColor = 'rgba(220,38,38,.3)'; }}
                onMouseLeave={e => { e.currentTarget.style.background = 'var(--color-gris-50)'; e.currentTarget.style.color = 'var(--color-gris-400)'; e.currentTarget.style.borderColor = 'var(--color-gris-200)'; }}
              >
                <LogOut size={14} />
              </button>
            </div>
          </div>
        </div>
        </header>

        {/* ── Contenido ── */}
        <main style={{ flex: 1, overflowY: 'auto', padding: '24px' }} className="main-content">
          <div style={{ maxWidth: 1280, margin: '0 auto' }} className="anim-fade-up">
            <Outlet />
          </div>
        </main>
      </div>

      {/* ── Barra de navegación inferior (solo móvil) ── */}
      <BottomNav onMenuOpen={() => setSidebarAbierto(true)} noLeidas={noLeidas} />

    </div>
    <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    <Toaster />
    <ConfirmDialog />
    </>
  );
}
