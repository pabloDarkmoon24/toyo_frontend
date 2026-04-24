// ============================================================
// Toyo+ — Librería de componentes UI
// Usa las clases semánticas de index.css
// ============================================================

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import { X, CheckCircle2, AlertTriangle, XCircle, Info } from 'lucide-react';
import { toast as _toast } from '../utils/toast';
import { confirmar as _confirmar } from '../utils/confirmar';

/* ---- BADGE ---- */
export function Badge({ children, variant = 'gris' }) {
  const map = {
    default: 'badge-gris',
    gris:    'badge-gris',
    success: 'badge-verde',
    warning: 'badge-amarillo',
    danger:  'badge-rojo',
    info:    'badge-azul',
    purple:  'badge-purpura',
  };
  return (
    <span className={`badge ${map[variant] || 'badge-gris'}`}>{children}</span>
  );
}

/* ---- SPINNER ---- */
export function Spinner({ size = 'md' }) {
  const s = { sm: '16px', md: '28px', lg: '40px' }[size];
  const b = size === 'lg' ? '3px' : '2px';
  return (
    <div style={{
      width: s, height: s,
      borderRadius: '50%',
      border: `${b} solid rgba(220,38,38,.2)`,
      borderTopColor: '#dc2626',
      animation: 'spin 0.7s linear infinite',
    }} />
  );
}

/* ---- LOADER DE PÁGINA ---- */
export function PageLoader() {
  return (
    <div className="estado-vacio" style={{ height: 200 }}>
      <Spinner size="md" />
      <p style={{ color: 'var(--color-gris-400)', fontSize: '0.8rem', marginTop: 12 }}>Cargando...</p>
    </div>
  );
}

/* ---- ESTADO VACÍO ---- */
export function EmptyState({ icon: Icon, title, description, action }) {
  return (
    <div className="estado-vacio">
      <div className="estado-vacio-icono">
        <Icon size={26} />
      </div>
      <h3>{title}</h3>
      {description && <p>{description}</p>}
      {action}
    </div>
  );
}

/* ---- BOTÓN ---- */
export function Btn({ children, onClick, variant = 'primary', size = 'md', disabled, icon: Icon, type = 'button', className = '', style }) {
  const v = {
    primary:   'btn btn-primario',
    secondary: 'btn btn-secundario',
    ghost:     'btn btn-fantasma',
    danger:    'btn btn-peligro',
    success:   'btn btn-exito',
    ia:        'btn btn-ia',
  };
  const s = { sm: 'btn-sm', md: '', lg: 'btn-lg' };
  return (
    <button type={type} onClick={onClick} disabled={disabled} style={style}
      className={`${v[variant] || 'btn btn-primario'} ${s[size]} ${className}`}>
      {Icon && <Icon size={size === 'sm' ? 13 : 14} />}
      {children}
    </button>
  );
}

/* ---- INPUT ---- */
export function Input({ label, error, className = '', ...props }) {
  return (
    <div>
      {label && <label className="etiqueta">{label}</label>}
      <input className={`campo ${error ? 'campo-error' : ''} ${className}`} {...props} />
      {error && <p className="campo-err">{error}</p>}
    </div>
  );
}

/* ---- SELECT ---- */
export function Select({ label, children, className = '', ...props }) {
  return (
    <div>
      {label && <label className="etiqueta">{label}</label>}
      <select className={`campo ${className}`} {...props}>{children}</select>
    </div>
  );
}

/* ---- TEXTAREA ---- */
export function Textarea({ label, className = '', ...props }) {
  return (
    <div>
      {label && <label className="etiqueta">{label}</label>}
      <textarea className={`campo ${className}`} style={{ resize: 'none' }} {...props} />
    </div>
  );
}

/* ---- MODAL ---- */
export function Modal({ titulo, onClose, children, size = 'md' }) {
  const arr = React.Children.toArray(children);
  const footer = arr.find(c => c.type === ModalFooter);
  const body = arr.filter(c => c.type !== ModalFooter);

  return createPortal(
    <div className="modal-overlay" onClick={onClose}>
      <div className={`modal-caja modal-caja--${size}`} onClick={e => e.stopPropagation()}>
        <div className="modal-cabecera">
          <h3>{titulo}</h3>
          <button className="modal-cerrar" onClick={onClose}>
            <X size={14} />
          </button>
        </div>
        <div className="modal-cuerpo">{body}</div>
        {footer}
      </div>
    </div>,
    document.body
  );
}

/* ---- MODAL FOOTER ---- */
export function ModalFooter({ children }) {
  return <div className="modal-pie">{children}</div>;
}

/* ---- TABLE ---- */
export function Table({ headers, children, empty }) {
  return (
    <div className="overflow-x-auto">
      <table className="tabla">
        <thead>
          <tr>
            {headers.map((h, i) => (
              <th key={i} className={
                typeof h === 'object'
                  ? h.align === 'right' ? 'derecha' : h.align === 'center' ? 'centro' : ''
                  : ''
              }>
                {typeof h === 'object' ? h.label : h}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>{children}</tbody>
      </table>
      {empty}
    </div>
  );
}

/* ---- TABLE CELL ---- */
export function Td({ children, align, className = '' }) {
  const a = align === 'right' ? 'derecha' : align === 'center' ? 'centro' : '';
  return <td className={`${a} ${className}`}>{children}</td>;
}

/* ---- BOTÓN ÍCONO ---- */
export function IconBtn({ icon: Icon, onClick, title, color = 'gris' }) {
  return (
    <button onClick={onClick} title={title}
      className={`btn-icono btn-icono-${color === 'red' ? 'rojo' : color === 'amber' ? 'ambar' : color === 'blue' ? 'azul' : color === 'emerald' ? 'verde' : 'gris'}`}>
      <Icon size={14} />
    </button>
  );
}

/* ---- ACTION MENU ---- */
export function ActionMenu({ children }) {
  return <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 2 }}>{children}</div>;
}

/* ---- SECTION HEADER ---- */
export function SectionHeader({ title, subtitle, action }) {
  return (
    <div className="seccion-cabecera">
      <div>
        <h1 className="seccion-titulo">{title}</h1>
        {subtitle && <p className="seccion-subtitulo">{subtitle}</p>}
      </div>
      {action}
    </div>
  );
}

/* ---- ALERT BANNER ---- */
export function AlertBanner({ icon: Icon, title, message, variant = 'warning', action }) {
  const v = { warning: 'alerta-alerta', danger: 'alerta-peligro', info: 'alerta-info', success: 'alerta-exito' };
  const ic = { warning: '#d97706', danger: '#dc2626', info: '#2563eb', success: '#059669' };
  return (
    <div className={`alerta ${v[variant] || 'alerta-alerta'}`}>
      <Icon size={16} style={{ color: ic[variant], flexShrink: 0, marginTop: 2 }} />
      <div style={{ flex: 1 }}>
        <p style={{ fontWeight: 600, fontSize: '0.875rem' }}>{title}</p>
        <p style={{ fontSize: '0.8125rem', opacity: 0.85, marginTop: 2 }}>{message}</p>
      </div>
      {action}
    </div>
  );
}

/* ---- STAT CARD ---- */
export function StatCard({ label, value, sub, icon: Icon, gradient, style }) {
  const dark = !!gradient;
  return (
    <div className="tarjeta-metrica"
      style={gradient
        ? { background: gradient, boxShadow: '0 6px 24px rgba(0,0,0,.2)', ...style }
        : { background: '#fff', border: '1px solid var(--color-gris-200)', boxShadow: 'var(--shadow-sm)', ...style }
      }
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 12 }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <p style={{
            fontSize: '0.7rem', fontWeight: 700, textTransform: 'uppercase',
            letterSpacing: '0.1em', marginBottom: 10,
            color: dark ? 'rgba(255,255,255,.7)' : 'var(--color-gris-500)',
          }}>{label}</p>
          <p style={{
            fontSize: '1.625rem', fontWeight: 800, lineHeight: 1, letterSpacing: '-0.03em',
            color: dark ? '#fff' : 'var(--color-gris-900)',
          }}>{value}</p>
          {sub && (
            <p style={{
              fontSize: '0.75rem', marginTop: 8,
              color: dark ? 'rgba(255,255,255,.55)' : 'var(--color-gris-400)',
            }}>{sub}</p>
          )}
        </div>
        {Icon && (
          <div style={{
            width: 40, height: 40, borderRadius: 11, display: 'flex',
            alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            background: dark ? 'rgba(255,255,255,.18)' : 'var(--color-gris-100)',
          }}>
            <Icon size={18} style={{ color: dark ? '#fff' : 'var(--color-gris-500)' }} />
          </div>
        )}
      </div>
    </div>
  );
}

/* ---- CARD ---- */
export function Card({ children, className = '', padding = true }) {
  return (
    <div className={`tarjeta ${padding ? '' : ''} ${className}`}
      style={padding ? { padding: 24 } : {}}>
      {children}
    </div>
  );
}

/* ---- TOASTER ---- */
const TOAST_STYLES = {
  success: { bg: '#f0fdf4', border: '#86efac', icon: CheckCircle2, color: '#15803d' },
  error:   { bg: '#fef2f2', border: '#fca5a5', icon: XCircle,      color: '#dc2626' },
  warning: { bg: '#fffbeb', border: '#fde68a', icon: AlertTriangle, color: '#d97706' },
  info:    { bg: '#eff6ff', border: '#93c5fd', icon: Info,          color: '#2563eb' },
};

export function Toaster() {
  const [toasts, setToasts] = useState([]);

  useEffect(() => {
    const unsub = _toast._sub((notif) => {
      setToasts(prev => [...prev, notif]);
      setTimeout(() => setToasts(prev => prev.filter(t => t.id !== notif.id)), notif.duration || 4000);
    });
    return unsub;
  }, []);

  if (!toasts.length) return null;

  return createPortal(
    <div style={{
      position: 'fixed', bottom: 24, right: 24, zIndex: 9999,
      display: 'flex', flexDirection: 'column', gap: 10,
      maxWidth: 360, width: 'calc(100vw - 48px)',
      pointerEvents: 'none',
    }}>
      {toasts.map((t) => {
        const s = TOAST_STYLES[t.type] || TOAST_STYLES.info;
        const Icon = s.icon;
        return (
          <div key={t.id} style={{
            display: 'flex', alignItems: 'flex-start', gap: 10,
            padding: '12px 14px', borderRadius: 12,
            background: s.bg, border: `1px solid ${s.border}`,
            boxShadow: '0 4px 20px rgba(0,0,0,.12)',
            animation: 'toast-in 0.25s ease',
            pointerEvents: 'auto',
          }}>
            <Icon size={17} color={s.color} style={{ flexShrink: 0, marginTop: 1 }} />
            <p style={{ fontSize: '0.8375rem', color: '#1e293b', lineHeight: 1.45, flex: 1, fontWeight: 500 }}>
              {t.message}
            </p>
            <button
              onClick={() => setToasts(prev => prev.filter(x => x.id !== t.id))}
              style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#94a3b8', padding: 0, flexShrink: 0 }}
            >
              <X size={13} />
            </button>
          </div>
        );
      })}
      <style>{`@keyframes toast-in { from { opacity:0; transform:translateY(8px); } to { opacity:1; transform:none; } }`}</style>
    </div>,
    document.body
  );
}

/* ---- CONFIRM DIALOG ---- */
export function ConfirmDialog() {
  const [state, setState] = useState(null);

  useEffect(() => {
    const unsub = _confirmar._sub(({ mensaje, titulo, resolve }) => {
      setState({ mensaje, titulo, resolve });
    });
    return unsub;
  }, []);

  const responder = (ok) => {
    if (state?.resolve) state.resolve(ok);
    setState(null);
  };

  if (!state) return null;

  return createPortal(
    <div style={{
      position: 'fixed', inset: 0,
      background: 'rgba(15,23,42,.5)',
      backdropFilter: 'blur(4px)',
      zIndex: 10000,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: 20,
    }}
      onClick={() => responder(false)}
    >
      <div
        onClick={e => e.stopPropagation()}
        style={{
          background: '#fff', borderRadius: 16,
          padding: '24px 26px', maxWidth: 400, width: '100%',
          boxShadow: '0 20px 60px rgba(0,0,0,.2)',
          animation: 'confirm-in 0.2s ease',
        }}
      >
        <div style={{ display: 'flex', gap: 14, alignItems: 'flex-start', marginBottom: 20 }}>
          <div style={{
            width: 40, height: 40, borderRadius: 11, flexShrink: 0,
            background: 'rgba(220,38,38,.1)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <AlertTriangle size={18} color="#dc2626" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: '#0f172a', marginBottom: 5 }}>
              {state.titulo}
            </p>
            <p style={{ fontSize: '0.8375rem', color: '#64748b', lineHeight: 1.5 }}>
              {state.mensaje}
            </p>
          </div>
        </div>
        <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
          <button
            onClick={() => responder(false)}
            style={{
              padding: '8px 20px', borderRadius: 9,
              border: '1px solid #e2e8f0', background: '#fff',
              color: '#64748b', fontSize: '0.8375rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.12s',
            }}
          >
            Cancelar
          </button>
          <button
            onClick={() => responder(true)}
            style={{
              padding: '8px 20px', borderRadius: 9,
              border: 'none', background: '#dc2626',
              color: '#fff', fontSize: '0.8375rem', fontWeight: 600,
              cursor: 'pointer', transition: 'all 0.12s',
              boxShadow: '0 2px 8px rgba(220,38,38,.35)',
            }}
          >
            Confirmar
          </button>
        </div>
      </div>
      <style>{`@keyframes confirm-in { from { opacity:0; transform:scale(.95); } to { opacity:1; transform:none; } }`}</style>
    </div>,
    document.body
  );
}
