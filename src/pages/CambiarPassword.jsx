import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { KeyRound, Eye, EyeOff, ShieldCheck, Zap } from 'lucide-react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function CambiarPassword() {
  const { usuario, actualizarUsuario } = useAuth();
  const navigate = useNavigate();

  const [form, setForm]         = useState({ actual: '', nueva: '', confirmar: '' });
  const [mostrando, setMostrando] = useState({ actual: false, nueva: false, confirmar: false });
  const [guardando, setGuardando] = useState(false);
  const [error, setError]       = useState('');

  const toggle = (campo) => setMostrando(m => ({ ...m, [campo]: !m[campo] }));

  const guardar = async (e) => {
    e.preventDefault();
    setError('');

    if (form.nueva.length < 6) {
      setError('La nueva contraseña debe tener al menos 6 caracteres');
      return;
    }
    if (form.nueva !== form.confirmar) {
      setError('Las contraseñas no coinciden');
      return;
    }
    if (form.actual === form.nueva) {
      setError('La nueva contraseña debe ser diferente a la actual');
      return;
    }

    setGuardando(true);
    try {
      await axios.post('/api/auth/cambiar-password', {
        passwordActual: form.actual,
        passwordNuevo: form.nueva,
      });
      // Limpia el flag localmente para no redirigir de nuevo
      actualizarUsuario({ debesCambiarPassword: false });
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al cambiar la contraseña');
    } finally {
      setGuardando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100dvh',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      background: 'var(--color-fondo)',
      padding: '24px 16px',
    }}>
      <div style={{
        width: '100%', maxWidth: 420,
        background: '#fff',
        borderRadius: 20,
        boxShadow: '0 8px 48px rgba(0,0,0,.12)',
        overflow: 'hidden',
      }}>
        {/* Cabecera */}
        <div style={{
          background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)',
          padding: '28px 32px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12,
        }}>
          <div style={{
            width: 52, height: 52, borderRadius: 14,
            background: 'linear-gradient(135deg, var(--color-toyo) 0%, #7c3aed 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 6px 20px rgba(220,38,38,.4)',
          }}>
            <KeyRound size={22} color="#fff" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <p style={{ color: '#fff', fontWeight: 800, fontSize: '1.125rem', lineHeight: 1.2 }}>
              Cambiar contraseña
            </p>
            <p style={{ color: 'rgba(255,255,255,.45)', fontSize: '0.8rem', marginTop: 4 }}>
              {usuario?.nombre && `Hola ${usuario.nombre}, debes`} establecer una contraseña personal antes de continuar
            </p>
          </div>
        </div>

        {/* Banner aviso */}
        <div style={{
          display: 'flex', alignItems: 'center', gap: 10,
          padding: '12px 20px',
          background: 'rgba(220,38,38,.06)',
          borderBottom: '1px solid rgba(220,38,38,.12)',
        }}>
          <ShieldCheck size={15} style={{ color: 'var(--color-toyo)', flexShrink: 0 }} />
          <p style={{ fontSize: '0.78rem', color: 'var(--color-toyo)', fontWeight: 600 }}>
            Por seguridad debes crear tu propia contraseña
          </p>
        </div>

        {/* Formulario */}
        <form onSubmit={guardar} style={{ padding: '24px 28px', display: 'flex', flexDirection: 'column', gap: 16 }}>
          {error && (
            <div style={{
              padding: '10px 14px', borderRadius: 10,
              background: 'rgba(220,38,38,.06)', border: '1px solid rgba(220,38,38,.2)',
              color: 'var(--color-toyo)', fontSize: '0.8125rem', fontWeight: 500,
            }}>
              {error}
            </div>
          )}

          {[
            { campo: 'actual',    label: 'Contraseña actual',          placeholder: 'Tu contraseña actual' },
            { campo: 'nueva',     label: 'Nueva contraseña',           placeholder: 'Mínimo 6 caracteres' },
            { campo: 'confirmar', label: 'Confirmar nueva contraseña', placeholder: 'Repite la nueva contraseña' },
          ].map(({ campo, label, placeholder }) => (
            <div key={campo} style={{ display: 'flex', flexDirection: 'column', gap: 5 }}>
              <label style={{
                fontSize: '0.72rem', fontWeight: 600, color: 'var(--color-gris-500)',
                textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {label}
              </label>
              <div style={{ position: 'relative' }}>
                <input
                  type={mostrando[campo] ? 'text' : 'password'}
                  value={form[campo]}
                  onChange={e => setForm(f => ({ ...f, [campo]: e.target.value }))}
                  placeholder={placeholder}
                  required
                  className="campo"
                  style={{ width: '100%', paddingRight: 40, fontSize: '0.875rem' }}
                />
                <button
                  type="button"
                  onClick={() => toggle(campo)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    background: 'none', border: 'none', cursor: 'pointer',
                    color: 'var(--color-gris-400)', display: 'flex', alignItems: 'center',
                    padding: 2,
                  }}
                >
                  {mostrando[campo] ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>
          ))}

          <button
            type="submit"
            disabled={guardando || !form.actual || !form.nueva || !form.confirmar}
            style={{
              marginTop: 4,
              padding: '12px',
              borderRadius: 12,
              border: 'none',
              background: (!form.actual || !form.nueva || !form.confirmar || guardando)
                ? 'var(--color-gris-200)'
                : 'linear-gradient(135deg, var(--color-toyo), #b91c1c)',
              color: (!form.actual || !form.nueva || !form.confirmar || guardando) ? 'var(--color-gris-400)' : '#fff',
              fontWeight: 700, fontSize: '0.9375rem', cursor: guardando ? 'wait' : 'pointer',
              transition: 'all 0.15s',
              boxShadow: (!form.actual || !form.nueva || !form.confirmar || guardando)
                ? 'none'
                : '0 4px 16px rgba(220,38,38,.3)',
            }}
          >
            {guardando ? 'Guardando...' : 'Establecer contraseña'}
          </button>
        </form>

        <div style={{
          padding: '12px 28px 20px',
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 6,
          borderTop: '1px solid var(--color-gris-100)',
        }}>
          <Zap size={12} style={{ color: 'var(--color-gris-300)' }} />
          <span style={{ fontSize: '0.72rem', color: 'var(--color-gris-400)' }}>
            Toyo+ · Sistema de Gestión
          </span>
        </div>
      </div>
    </div>
  );
}
