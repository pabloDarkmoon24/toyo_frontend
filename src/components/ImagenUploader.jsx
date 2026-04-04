import { useRef, useState } from 'react';
import { Upload, X, ImageIcon, Loader } from 'lucide-react';
import axios from 'axios';

/**
 * ImagenUploader — sube UNA imagen y devuelve la URL al padre.
 *
 * Props:
 *   value       string | null   — URL actual
 *   onChange    (url) => void   — URL nueva o null al eliminar
 *   label       string          — etiqueta opcional
 *   compact     bool            — versión pequeña para tablas
 */
export default function ImagenUploader({ value, onChange, label, compact = false }) {
  const inputRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  const seleccionar = () => inputRef.current?.click();

  const handleFile = async (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setError('');
    setSubiendo(true);
    try {
      const form = new FormData();
      form.append('imagen', file);
      const token = localStorage.getItem('token');
      const { data } = await axios.post('/api/uploads', form, {
        headers: {
          'Content-Type': 'multipart/form-data',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
      });
      onChange(data.url);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir imagen');
    } finally {
      setSubiendo(false);
      e.target.value = '';
    }
  };

  const eliminar = (e) => {
    e.stopPropagation();
    onChange(null);
  };

  if (compact) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
        {value ? (
          <div style={{ position: 'relative', flexShrink: 0 }}>
            <img
              src={value}
              alt=""
              style={{ width: 40, height: 40, objectFit: 'cover', borderRadius: 8, border: '1px solid var(--color-gris-200)' }}
            />
            <button
              type="button"
              onClick={eliminar}
              style={{
                position: 'absolute', top: -6, right: -6,
                width: 16, height: 16, borderRadius: '50%',
                background: '#dc2626', border: '2px solid #fff',
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 9, lineHeight: 1,
              }}
            >×</button>
          </div>
        ) : (
          <button
            type="button"
            onClick={seleccionar}
            disabled={subiendo}
            style={{
              width: 40, height: 40, borderRadius: 8,
              border: '1.5px dashed var(--color-gris-300)',
              background: 'var(--color-gris-50)',
              color: 'var(--color-gris-400)',
              cursor: 'pointer', display: 'flex',
              alignItems: 'center', justifyContent: 'center',
            }}
          >
            {subiendo ? <Loader size={13} style={{ animation: 'spin .7s linear infinite' }} /> : <ImageIcon size={13} />}
          </button>
        )}
        <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />
      </div>
    );
  }

  return (
    <div>
      {label && <label className="etiqueta">{label}</label>}
      <input ref={inputRef} type="file" accept="image/*" style={{ display: 'none' }} onChange={handleFile} />

      {value ? (
        <div style={{ position: 'relative', borderRadius: 12, overflow: 'hidden', border: '1px solid var(--color-gris-200)' }}>
          <img
            src={value}
            alt="Imagen"
            style={{ width: '100%', height: 180, objectFit: 'cover', display: 'block' }}
          />
          <div style={{
            position: 'absolute', inset: 0,
            background: 'rgba(0,0,0,0)',
            transition: 'background .2s',
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: 8,
          }}
            onMouseEnter={e => e.currentTarget.style.background = 'rgba(0,0,0,.35)'}
            onMouseLeave={e => e.currentTarget.style.background = 'rgba(0,0,0,0)'}
          >
            <button
              type="button"
              onClick={seleccionar}
              style={{
                padding: '6px 12px', borderRadius: 8, border: 'none',
                background: '#fff', color: 'var(--color-gris-800)',
                fontSize: '0.8rem', fontWeight: 600, cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                opacity: 0, transition: 'opacity .2s',
              }}
              onMouseEnter={e => e.currentTarget.style.opacity = 1}
              onMouseLeave={e => e.currentTarget.style.opacity = 0}
              ref={el => {
                if (el) {
                  el.closest('div').addEventListener('mouseenter', () => el.style.opacity = 1);
                  el.closest('div').addEventListener('mouseleave', () => el.style.opacity = 0);
                }
              }}
            >
              <Upload size={12} /> Cambiar
            </button>
            <button
              type="button"
              onClick={eliminar}
              style={{
                padding: '6px 10px', borderRadius: 8, border: 'none',
                background: '#dc2626', color: '#fff',
                fontSize: '0.8rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 5,
                opacity: 0, transition: 'opacity .2s',
              }}
            >
              <X size={12} />
            </button>
          </div>
        </div>
      ) : (
        <button
          type="button"
          onClick={seleccionar}
          disabled={subiendo}
          style={{
            width: '100%', height: 120, borderRadius: 12,
            border: '2px dashed var(--color-gris-300)',
            background: subiendo ? 'var(--color-gris-50)' : '#fff',
            color: 'var(--color-gris-400)', cursor: 'pointer',
            display: 'flex', flexDirection: 'column',
            alignItems: 'center', justifyContent: 'center', gap: 8,
            transition: 'border-color .15s, background .15s',
          }}
          onMouseEnter={e => { if (!subiendo) { e.currentTarget.style.borderColor = 'var(--color-toyo)'; e.currentTarget.style.background = 'rgba(220,38,38,.03)'; } }}
          onMouseLeave={e => { e.currentTarget.style.borderColor = 'var(--color-gris-300)'; e.currentTarget.style.background = '#fff'; }}
        >
          {subiendo ? (
            <Loader size={20} style={{ animation: 'spin .7s linear infinite', color: 'var(--color-toyo)' }} />
          ) : (
            <Upload size={20} />
          )}
          <span style={{ fontSize: '0.8rem', fontWeight: 500 }}>
            {subiendo ? 'Subiendo...' : 'Haz clic para subir imagen'}
          </span>
          <span style={{ fontSize: '0.72rem' }}>JPG, PNG, WEBP · máx 8 MB</span>
        </button>
      )}
      {error && <p className="campo-err" style={{ marginTop: 6 }}>{error}</p>}
    </div>
  );
}

/**
 * GaleriaUploader — sube MÚLTIPLES imágenes (para antes/después de órdenes)
 *
 * Props:
 *   values      string[]        — URLs actuales
 *   onChange    (urls[]) => void
 *   label       string
 *   max         number          — máximo de imágenes (default 6)
 */
export function GaleriaUploader({ values = [], onChange, label, max = 6 }) {
  const inputRef = useRef(null);
  const [subiendo, setSubiendo] = useState(false);
  const [error, setError] = useState('');

  const handleFiles = async (e) => {
    const files = Array.from(e.target.files || []);
    if (!files.length) return;
    const disponibles = max - values.length;
    const lote = files.slice(0, disponibles);
    setError('');
    setSubiendo(true);
    try {
      const token = localStorage.getItem('token');
      const nuevas = await Promise.all(lote.map(async (file) => {
        const form = new FormData();
        form.append('imagen', file);
        const { data } = await axios.post('/api/uploads', form, {
          headers: {
            'Content-Type': 'multipart/form-data',
            ...(token ? { Authorization: `Bearer ${token}` } : {}),
          },
        });
        return data.url;
      }));
      onChange([...values, ...nuevas]);
    } catch (err) {
      setError(err.response?.data?.error || 'Error al subir');
    } finally {
      setSubiendo(false);
      e.target.value = '';
    }
  };

  const eliminar = (idx) => {
    onChange(values.filter((_, i) => i !== idx));
  };

  return (
    <div>
      {label && <label className="etiqueta">{label}</label>}
      <input ref={inputRef} type="file" accept="image/*" multiple style={{ display: 'none' }} onChange={handleFiles} />

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(90px, 1fr))', gap: 8 }}>
        {values.map((url, i) => (
          <div key={i} style={{ position: 'relative', borderRadius: 10, overflow: 'hidden', aspectRatio: '1', border: '1px solid var(--color-gris-200)' }}>
            <img src={url} alt="" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
            <button
              type="button"
              onClick={() => eliminar(i)}
              style={{
                position: 'absolute', top: 4, right: 4,
                width: 20, height: 20, borderRadius: '50%',
                background: 'rgba(0,0,0,.6)', border: 'none',
                color: '#fff', cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}
            >
              <X size={11} />
            </button>
          </div>
        ))}

        {values.length < max && (
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            disabled={subiendo}
            style={{
              aspectRatio: '1', borderRadius: 10,
              border: '2px dashed var(--color-gris-300)',
              background: 'var(--color-gris-50)',
              color: 'var(--color-gris-400)', cursor: 'pointer',
              display: 'flex', flexDirection: 'column',
              alignItems: 'center', justifyContent: 'center', gap: 4,
              transition: 'border-color .15s',
            }}
            onMouseEnter={e => e.currentTarget.style.borderColor = 'var(--color-toyo)'}
            onMouseLeave={e => e.currentTarget.style.borderColor = 'var(--color-gris-300)'}
          >
            {subiendo
              ? <Loader size={16} style={{ animation: 'spin .7s linear infinite', color: 'var(--color-toyo)' }} />
              : <Upload size={16} />
            }
            <span style={{ fontSize: '0.65rem', fontWeight: 600 }}>Añadir</span>
          </button>
        )}
      </div>

      {error && <p className="campo-err" style={{ marginTop: 6 }}>{error}</p>}
      {values.length > 0 && (
        <p style={{ fontSize: '0.72rem', color: 'var(--color-gris-400)', marginTop: 6 }}>
          {values.length}/{max} imágenes
        </p>
      )}
    </div>
  );
}
