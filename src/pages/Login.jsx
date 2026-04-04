import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Zap, Lock, Mail, Eye, EyeOff, AlertCircle } from 'lucide-react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const navigate = useNavigate();

  const [form, setForm] = useState({ email: '', password: '' });
  const [mostrarPass, setMostrarPass] = useState(false);
  const [cargando, setCargando] = useState(false);
  const [error, setError] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setCargando(true);
    try {
      await login(form.email, form.password);
      navigate('/', { replace: true });
    } catch (err) {
      setError(err.response?.data?.error || 'Error al iniciar sesión');
    } finally {
      setCargando(false);
    }
  };

  return (
    <div style={{
      minHeight: '100vh',
      background: 'var(--color-fondo)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '24px',
    }}>
      {/* Fondo decorativo */}
      <div style={{
        position: 'fixed', inset: 0, overflow: 'hidden', pointerEvents: 'none',
      }}>
        <div style={{
          position: 'absolute', top: '-20%', right: '-10%',
          width: 600, height: 600, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(220,38,38,.06) 0%, transparent 70%)',
        }} />
        <div style={{
          position: 'absolute', bottom: '-15%', left: '-5%',
          width: 500, height: 500, borderRadius: '50%',
          background: 'radial-gradient(circle, rgba(124,58,237,.05) 0%, transparent 70%)',
        }} />
      </div>

      <div className="anim-fade-up" style={{ width: '100%', maxWidth: 420, position: 'relative' }}>
        {/* Logo */}
        <div style={{ textAlign: 'center', marginBottom: 36 }}>
          <div style={{
            width: 56, height: 56, borderRadius: 16, margin: '0 auto 16px',
            background: 'linear-gradient(135deg, var(--color-toyo) 0%, var(--color-toyo-oscuro) 100%)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            boxShadow: '0 8px 24px rgba(220,38,38,.35)',
          }}>
            <Zap size={24} color="#fff" fill="#fff" />
          </div>
          <h1 style={{ fontSize: '1.625rem', fontWeight: 800, color: 'var(--color-gris-900)', marginBottom: 4 }}>
            Toyo+
          </h1>
          <p style={{ color: 'var(--color-gris-500)', fontSize: '0.875rem' }}>
            Sistema de Gestión · Inicia sesión para continuar
          </p>
        </div>

        {/* Card */}
        <div className="tarjeta" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.125rem', fontWeight: 700, color: 'var(--color-gris-900)', marginBottom: 6 }}>
            Bienvenido de nuevo
          </h2>
          <p style={{ color: 'var(--color-gris-500)', fontSize: '0.8125rem', marginBottom: 24 }}>
            Ingresa tus credenciales para acceder al sistema
          </p>

          {error && (
            <div style={{
              display: 'flex', alignItems: 'center', gap: 10,
              padding: '12px 14px', borderRadius: 10, marginBottom: 20,
              background: 'rgba(220,38,38,.06)',
              border: '1px solid rgba(220,38,38,.2)',
              color: 'var(--color-toyo)',
              fontSize: '0.8125rem',
            }}>
              <AlertCircle size={15} style={{ flexShrink: 0 }} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {/* Email */}
            <div>
              <label className="etiqueta">Correo electrónico</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--color-gris-400)',
                }}>
                  <Mail size={15} />
                </div>
                <input
                  type="email"
                  className="campo"
                  placeholder="usuario@ejemplo.com"
                  value={form.email}
                  onChange={e => setForm(f => ({ ...f, email: e.target.value }))}
                  required
                  style={{ paddingLeft: 38 }}
                  autoComplete="email"
                />
              </div>
            </div>

            {/* Contraseña */}
            <div>
              <label className="etiqueta">Contraseña</label>
              <div style={{ position: 'relative' }}>
                <div style={{
                  position: 'absolute', left: 12, top: '50%', transform: 'translateY(-50%)',
                  color: 'var(--color-gris-400)',
                }}>
                  <Lock size={15} />
                </div>
                <input
                  type={mostrarPass ? 'text' : 'password'}
                  className="campo"
                  placeholder="Tu contraseña"
                  value={form.password}
                  onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  required
                  style={{ paddingLeft: 38, paddingRight: 44 }}
                  autoComplete="current-password"
                />
                <button
                  type="button"
                  onClick={() => setMostrarPass(v => !v)}
                  style={{
                    position: 'absolute', right: 10, top: '50%', transform: 'translateY(-50%)',
                    border: 'none', background: 'transparent',
                    color: 'var(--color-gris-400)', cursor: 'pointer',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    padding: 6, borderRadius: 6,
                  }}
                  tabIndex={-1}
                >
                  {mostrarPass ? <EyeOff size={15} /> : <Eye size={15} />}
                </button>
              </div>
            </div>

            <button
              type="submit"
              className="btn-primario"
              disabled={cargando}
              style={{
                marginTop: 4,
                height: 44,
                fontSize: '0.9375rem',
                fontWeight: 600,
                opacity: cargando ? 0.7 : 1,
              }}
            >
              {cargando ? 'Verificando...' : 'Iniciar sesión'}
            </button>
          </form>
        </div>

        <p style={{ textAlign: 'center', marginTop: 20, color: 'var(--color-gris-400)', fontSize: '0.75rem' }}>
          Toyo+ Sistema de Gestión · v1.0.0
        </p>
      </div>
    </div>
  );
}
