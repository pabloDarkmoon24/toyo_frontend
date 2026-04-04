import { useEffect, useRef, useState } from 'react';
import { asesor as api } from '../api';
import { toast } from '../utils/toast';
import {
  Brain, RefreshCw, CheckCheck, Send, ChevronDown, ChevronUp,
  TrendingUp, TrendingDown, AlertTriangle, Package, ShoppingCart,
  DollarSign, Lightbulb, Info, MessageSquare, Sparkles,
} from 'lucide-react';
import { PageLoader, SectionHeader, Btn } from '../components/UI';

/* ── Colores por prioridad ── */
const priColors = {
  alta:   { bg: 'rgba(220,38,38,.07)',   border: 'rgba(220,38,38,.25)',   badge: '#dc2626', dot: '#dc2626' },
  media:  { bg: 'rgba(234,179,8,.06)',   border: 'rgba(234,179,8,.25)',   badge: '#d97706', dot: '#d97706' },
  baja:   { bg: 'rgba(37,99,235,.06)',   border: 'rgba(37,99,235,.2)',    badge: '#2563eb', dot: '#2563eb' },
  info:   { bg: 'rgba(20,184,166,.06)',  border: 'rgba(20,184,166,.2)',   badge: '#0d9488', dot: '#0d9488' },
};

/* ── Iconos por tipo ── */
const tipoIcono = {
  alerta:      { Icon: AlertTriangle, color: '#dc2626' },
  oportunidad: { Icon: TrendingUp,    color: '#059669' },
  stock:       { Icon: Package,       color: '#7c3aed' },
  finanzas:    { Icon: DollarSign,    color: '#2563eb' },
  compras:     { Icon: ShoppingCart,  color: '#d97706' },
  tendencia:   { Icon: TrendingDown,  color: '#dc2626' },
  sugerencia:  { Icon: Lightbulb,     color: '#d97706' },
  info:        { Icon: Info,          color: '#0d9488' },
};

function getIcono(tipo) {
  return tipoIcono[tipo] || { Icon: Brain, color: '#7c3aed' };
}

/* ── Tarjeta de notificación ── */
function NotifCard({ n, onLeer, onChat }) {
  const [expandida, setExpandida] = useState(false);
  const col = priColors[n.prioridad] || priColors.baja;
  const { Icon, color } = getIcono(n.tipo);
  const fecha = new Date(n.fecha);
  const fechaStr = fecha.toLocaleDateString('es-VE', { day: 'numeric', month: 'short', hour: '2-digit', minute: '2-digit' });

  return (
    <div
      style={{
        background: n.leida ? 'var(--color-gris-50)' : col.bg,
        border: `1px solid ${n.leida ? 'var(--color-gris-200)' : col.border}`,
        borderRadius: 12,
        padding: '14px 16px',
        opacity: n.leida ? 0.7 : 1,
        transition: 'opacity 0.2s',
      }}
    >
      <div style={{ display: 'flex', gap: 12, alignItems: 'flex-start' }}>
        {/* Icono */}
        <div style={{
          width: 36, height: 36, borderRadius: 10, flexShrink: 0,
          background: n.leida ? 'var(--color-gris-100)' : `${col.bg.replace(',.06', ',.15').replace(',.07', ',.15').replace(',.06', ',.15')}`,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          border: `1px solid ${n.leida ? 'var(--color-gris-200)' : col.border}`,
        }}>
          <Icon size={16} color={n.leida ? 'var(--color-gris-400)' : color} />
        </div>

        {/* Contenido */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 8, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
              {!n.leida && (
                <span style={{
                  width: 7, height: 7, borderRadius: '50%',
                  background: col.dot, flexShrink: 0, display: 'inline-block',
                }} />
              )}
              <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-gris-900)' }}>{n.titulo}</p>
              <span style={{
                fontSize: '0.65rem', fontWeight: 700, padding: '2px 7px', borderRadius: 99,
                background: col.badge, color: '#fff', textTransform: 'uppercase', letterSpacing: '0.05em',
              }}>
                {n.prioridad}
              </span>
              <span style={{
                fontSize: '0.65rem', padding: '2px 7px', borderRadius: 99,
                background: 'var(--color-gris-100)', color: 'var(--color-gris-500)',
                textTransform: 'capitalize',
              }}>
                {n.tipo}
              </span>
            </div>
            <span style={{ fontSize: '0.72rem', color: 'var(--color-gris-400)', flexShrink: 0 }}>{fechaStr}</span>
          </div>

          <p style={{ fontSize: '0.8125rem', color: 'var(--color-gris-600)', marginTop: 4, lineHeight: 1.5 }}>{n.descripcion}</p>

          {n.accion && (
            <p style={{
              fontSize: '0.775rem', color: 'var(--color-gris-500)', marginTop: 6,
              fontStyle: 'italic', lineHeight: 1.4,
            }}>
              → {n.accion}
            </p>
          )}

          {/* Datos adicionales */}
          {n.datos && (
            <div style={{ marginTop: 8 }}>
              <button
                onClick={() => setExpandida(!expandida)}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer',
                  fontSize: '0.75rem', color: 'var(--color-gris-500)',
                  display: 'flex', alignItems: 'center', gap: 4, padding: 0,
                }}
              >
                {expandida ? <ChevronUp size={12} /> : <ChevronDown size={12} />}
                {expandida ? 'Ocultar datos' : 'Ver datos'}
              </button>
              {expandida && (
                <div style={{
                  marginTop: 6, padding: '8px 10px', borderRadius: 8,
                  background: 'var(--color-gris-100)', fontSize: '0.75rem',
                  color: 'var(--color-gris-600)', fontFamily: 'monospace', whiteSpace: 'pre-wrap',
                }}>
                  {(() => {
                    try { return JSON.stringify(JSON.parse(n.datos), null, 2); }
                    catch { return n.datos; }
                  })()}
                </div>
              )}
            </div>
          )}

          {/* Acciones */}
          <div style={{ display: 'flex', gap: 8, marginTop: 10, flexWrap: 'wrap' }}>
            <button
              onClick={() => onChat(n)}
              style={{
                display: 'flex', alignItems: 'center', gap: 5,
                padding: '5px 12px', borderRadius: 8, border: 'none', cursor: 'pointer',
                background: 'linear-gradient(135deg, rgba(124,58,237,.12), rgba(220,38,38,.08))',
                color: '#7c3aed', fontSize: '0.775rem', fontWeight: 600,
                boxShadow: 'inset 0 0 0 1px rgba(124,58,237,.2)',
                transition: 'all 0.15s',
              }}
            >
              <MessageSquare size={12} /> Profundizar con IA
            </button>
            {!n.leida && (
              <button
                onClick={() => onLeer(n.id)}
                style={{
                  padding: '5px 12px', borderRadius: 8,
                  border: '1px solid var(--color-gris-200)', cursor: 'pointer',
                  background: 'transparent', color: 'var(--color-gris-500)',
                  fontSize: '0.775rem', transition: 'all 0.15s',
                }}
              >
                Marcar leída
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

/* ── Burbuja de chat ── */
function Burbuja({ msg }) {
  const esIA = msg.role === 'assistant';
  return (
    <div style={{
      display: 'flex', justifyContent: esIA ? 'flex-start' : 'flex-end',
      gap: 8, alignItems: 'flex-end',
    }}>
      {esIA && (
        <div style={{
          width: 28, height: 28, borderRadius: 8, flexShrink: 0,
          background: 'linear-gradient(135deg, #7c3aed, #dc2626)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
        }}>
          <Brain size={14} color="#fff" />
        </div>
      )}
      <div style={{
        maxWidth: '75%',
        padding: '10px 14px',
        borderRadius: esIA ? '4px 14px 14px 14px' : '14px 4px 14px 14px',
        background: esIA
          ? 'var(--color-gris-100)'
          : 'linear-gradient(135deg, #7c3aed, #dc2626)',
        color: esIA ? 'var(--color-gris-800)' : '#fff',
        fontSize: '0.8125rem',
        lineHeight: 1.6,
        whiteSpace: 'pre-wrap',
      }}>
        {msg.content}
      </div>
    </div>
  );
}

/* ── Panel de Chat ── */
function PanelChat({ notifInicial, onCerrar }) {
  const [mensajes, setMensajes] = useState(() => {
    if (!notifInicial) return [];
    return [
      {
        role: 'user',
        content: `Quiero profundizar sobre esta recomendación:\n\n**${notifInicial.titulo}**\n${notifInicial.descripcion}${notifInicial.accion ? '\n\nAcción sugerida: ' + notifInicial.accion : ''}`,
      },
    ];
  });
  const [input, setInput] = useState('');
  const [enviando, setEnviando] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  // Enviar primer mensaje automáticamente si hay notif inicial
  useEffect(() => {
    if (notifInicial && mensajes.length === 1) {
      enviar(mensajes);
    }
  }, []);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes]);

  const enviar = async (msgsActuales) => {
    const listaMsg = msgsActuales || [...mensajes, { role: 'user', content: input.trim() }];
    if (!msgsActuales) {
      if (!input.trim()) return;
      setMensajes(listaMsg);
      setInput('');
    }
    setEnviando(true);
    try {
      const res = await api.chat(
        listaMsg.map(m => ({ role: m.role, content: m.content })),
        notifInicial?.id,
      );
      setMensajes(prev => [...prev, { role: 'assistant', content: res.data.respuesta }]);
    } catch (e) {
      setMensajes(prev => [...prev, { role: 'assistant', content: 'Error al conectar con el asesor. Intenta de nuevo.' }]);
    } finally {
      setEnviando(false);
      inputRef.current?.focus();
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
  };

  return (
    <div style={{
      display: 'flex', flexDirection: 'column',
      height: '100%', minHeight: 0,
    }}>
      {/* Header chat */}
      <div style={{
        display: 'flex', alignItems: 'center', justifyContent: 'space-between',
        padding: '14px 18px', borderBottom: '1px solid var(--color-gris-200)',
        flexShrink: 0,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <div style={{
            width: 32, height: 32, borderRadius: 9,
            background: 'linear-gradient(135deg, #7c3aed, #dc2626)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
          }}>
            <Brain size={15} color="#fff" />
          </div>
          <div>
            <p style={{ fontWeight: 700, fontSize: '0.875rem', color: 'var(--color-gris-900)', lineHeight: 1 }}>Asesor de Negocios IA</p>
            <p style={{ fontSize: '0.7rem', color: '#059669', marginTop: 2 }}>● En línea</p>
          </div>
        </div>
        <button
          onClick={onCerrar}
          style={{
            padding: '5px 12px', borderRadius: 8,
            border: '1px solid var(--color-gris-200)', cursor: 'pointer',
            background: 'transparent', color: 'var(--color-gris-500)',
            fontSize: '0.775rem',
          }}
        >
          ← Notificaciones
        </button>
      </div>

      {/* Mensajes */}
      <div style={{ flex: 1, overflowY: 'auto', padding: '16px 18px', display: 'flex', flexDirection: 'column', gap: 12 }}>
        {mensajes.length === 0 && (
          <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--color-gris-400)' }}>
            <Brain size={36} style={{ margin: '0 auto 12px', opacity: 0.3 }} />
            <p style={{ fontSize: '0.875rem' }}>¿En qué puedo ayudarte hoy?</p>
            <p style={{ fontSize: '0.775rem', marginTop: 6 }}>Pregúntame sobre ventas, inventario, finanzas o cualquier aspecto del negocio.</p>
          </div>
        )}
        {mensajes.map((m, i) => <Burbuja key={i} msg={m} />)}
        {enviando && (
          <div style={{ display: 'flex', gap: 8, alignItems: 'flex-end' }}>
            <div style={{
              width: 28, height: 28, borderRadius: 8,
              background: 'linear-gradient(135deg, #7c3aed, #dc2626)',
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              <Brain size={14} color="#fff" />
            </div>
            <div style={{
              padding: '10px 16px', borderRadius: '4px 14px 14px 14px',
              background: 'var(--color-gris-100)',
            }}>
              <span style={{ display: 'inline-flex', gap: 4 }}>
                {[0,1,2].map(i => (
                  <span key={i} style={{
                    width: 6, height: 6, borderRadius: '50%',
                    background: 'var(--color-gris-400)',
                    animation: `pulse 1s ${i * 0.2}s ease-in-out infinite`,
                  }} />
                ))}
              </span>
            </div>
          </div>
        )}
        <div ref={bottomRef} />
      </div>

      {/* Input */}
      <div style={{
        padding: '12px 16px', borderTop: '1px solid var(--color-gris-200)',
        display: 'flex', gap: 8, flexShrink: 0,
      }}>
        <textarea
          ref={inputRef}
          value={input}
          onChange={e => setInput(e.target.value)}
          onKeyDown={handleKeyDown}
          placeholder="Escribe tu pregunta... (Enter para enviar)"
          rows={1}
          style={{
            flex: 1, resize: 'none', padding: '9px 12px',
            borderRadius: 10, border: '1px solid var(--color-gris-300)',
            fontSize: '0.8125rem', lineHeight: 1.5, outline: 'none',
            fontFamily: 'inherit', maxHeight: 120, overflowY: 'auto',
          }}
          onInput={e => {
            e.target.style.height = 'auto';
            e.target.style.height = Math.min(e.target.scrollHeight, 120) + 'px';
          }}
        />
        <button
          onClick={() => enviar()}
          disabled={enviando || !input.trim()}
          style={{
            width: 38, height: 38, borderRadius: 10, border: 'none',
            background: enviando || !input.trim()
              ? 'var(--color-gris-200)'
              : 'linear-gradient(135deg, #7c3aed, #dc2626)',
            color: enviando || !input.trim() ? 'var(--color-gris-400)' : '#fff',
            cursor: enviando || !input.trim() ? 'not-allowed' : 'pointer',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            flexShrink: 0, transition: 'all 0.15s',
          }}
        >
          <Send size={15} />
        </button>
      </div>
    </div>
  );
}

/* ── Página principal ── */
export default function Asesor() {
  const [notifs, setNotifs] = useState([]);
  const [noLeidas, setNoLeidas] = useState(0);
  const [cargando, setCargando] = useState(true);
  const [analizando, setAnalizando] = useState(false);
  const [vista, setVista] = useState('notificaciones'); // 'notificaciones' | 'chat'
  const [notifChat, setNotifChat] = useState(null);
  const [filtro, setFiltro] = useState('todas'); // 'todas' | 'no-leidas'

  const cargar = async () => {
    try {
      const res = await api.notificaciones();
      setNotifs(res.data.notificaciones);
      setNoLeidas(res.data.noLeidas);
    } catch (e) {
      console.error(e);
    } finally {
      setCargando(false);
    }
  };

  useEffect(() => { cargar(); }, []);

  const analizar = async () => {
    setAnalizando(true);
    try {
      await api.analizar();
      await cargar();
    } catch (e) {
      toast.error('Error al analizar: ' + (e.response?.data?.error || e.message));
    } finally {
      setAnalizando(false);
    }
  };

  const leer = async (id) => {
    await api.leer(id);
    setNotifs(prev => prev.map(n => n.id === id ? { ...n, leida: true } : n));
    setNoLeidas(prev => Math.max(0, prev - 1));
  };

  const leerTodas = async () => {
    await api.leerTodas();
    setNotifs(prev => prev.map(n => ({ ...n, leida: true })));
    setNoLeidas(0);
  };

  const abrirChat = (n) => {
    setNotifChat(n);
    setVista('chat');
  };

  const lista = filtro === 'no-leidas' ? notifs.filter(n => !n.leida) : notifs;

  if (cargando) return <PageLoader />;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20, height: '100%' }}>
      <SectionHeader
        title="Asesor de Negocios IA"
        subtitle="Análisis inteligente del negocio, oportunidades y recomendaciones"
        action={
          <div style={{ display: 'flex', gap: 8 }}>
            {noLeidas > 0 && (
              <Btn icon={CheckCheck} variant="secondary" onClick={leerTodas}>
                Marcar todas leídas
              </Btn>
            )}
            <Btn
              icon={analizando ? RefreshCw : Sparkles}
              onClick={analizar}
              disabled={analizando}
            >
              {analizando ? 'Analizando...' : 'Analizar negocio'}
            </Btn>
          </div>
        }
      />

      {/* Layout dos columnas */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr', gap: 20 }}>

        {/* Panel izquierdo: notificaciones o chat */}
        <div className="tarjeta" style={{ padding: 0, overflow: 'hidden', minHeight: 560 }}>
          {vista === 'chat' ? (
            <PanelChat
              notifInicial={notifChat}
              onCerrar={() => { setVista('notificaciones'); setNotifChat(null); }}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>
              {/* Header notificaciones */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 18px', borderBottom: '1px solid var(--color-gris-200)',
                flexWrap: 'wrap', gap: 10,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <p style={{ fontWeight: 700, fontSize: '0.9375rem', color: 'var(--color-gris-900)' }}>
                    Recomendaciones
                  </p>
                  {noLeidas > 0 && (
                    <span style={{
                      background: '#dc2626', color: '#fff',
                      fontSize: '0.7rem', fontWeight: 700,
                      padding: '2px 7px', borderRadius: 99,
                    }}>
                      {noLeidas} nuevas
                    </span>
                  )}
                </div>
                <div style={{ display: 'flex', gap: 6 }}>
                  {['todas', 'no-leidas'].map(f => (
                    <button
                      key={f}
                      onClick={() => setFiltro(f)}
                      className={filtro === f ? 'filtro-tab filtro-tab-activo' : 'filtro-tab'}
                    >
                      {f === 'todas' ? 'Todas' : 'No leídas'}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lista */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 10 }}>
                {lista.length === 0 ? (
                  <div style={{ textAlign: 'center', padding: '48px 20px', color: 'var(--color-gris-400)' }}>
                    <Brain size={40} style={{ margin: '0 auto 14px', opacity: 0.2 }} />
                    <p style={{ fontWeight: 600, fontSize: '0.9rem', marginBottom: 6, color: 'var(--color-gris-600)' }}>
                      {filtro === 'no-leidas' ? 'No hay notificaciones nuevas' : 'Sin análisis aún'}
                    </p>
                    <p style={{ fontSize: '0.8125rem' }}>
                      {filtro === 'no-leidas'
                        ? 'Todas las recomendaciones han sido revisadas.'
                        : 'Haz clic en "Analizar negocio" para obtener recomendaciones inteligentes basadas en tus datos.'}
                    </p>
                    {filtro === 'todas' && (
                      <button
                        onClick={analizar}
                        disabled={analizando}
                        style={{
                          marginTop: 16, padding: '8px 20px', borderRadius: 10, border: 'none',
                          background: 'linear-gradient(135deg, #7c3aed, #dc2626)',
                          color: '#fff', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
                        }}
                      >
                        {analizando ? 'Analizando...' : 'Analizar ahora'}
                      </button>
                    )}
                  </div>
                ) : (
                  lista.map(n => (
                    <NotifCard key={n.id} n={n} onLeer={leer} onChat={abrirChat} />
                  ))
                )}
              </div>
            </div>
          )}
        </div>

        {/* Botón chat libre */}
        {vista === 'notificaciones' && (
          <div style={{
            padding: '16px 20px', borderRadius: 14,
            background: 'linear-gradient(135deg, rgba(124,58,237,.08), rgba(220,38,38,.05))',
            border: '1px solid rgba(124,58,237,.2)',
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            flexWrap: 'wrap', gap: 12,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
              <div style={{
                width: 40, height: 40, borderRadius: 11,
                background: 'linear-gradient(135deg, #7c3aed, #dc2626)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <MessageSquare size={18} color="#fff" />
              </div>
              <div>
                <p style={{ fontWeight: 700, fontSize: '0.9rem', color: 'var(--color-gris-900)' }}>Chat libre con el Asesor</p>
                <p style={{ fontSize: '0.775rem', color: 'var(--color-gris-500)' }}>
                  Haz cualquier pregunta sobre tu negocio, finanzas, inventario o estrategia.
                </p>
              </div>
            </div>
            <button
              onClick={() => { setNotifChat(null); setVista('chat'); }}
              style={{
                padding: '9px 20px', borderRadius: 10, border: 'none',
                background: 'linear-gradient(135deg, #7c3aed, #dc2626)',
                color: '#fff', fontWeight: 600, fontSize: '0.8125rem', cursor: 'pointer',
                display: 'flex', alignItems: 'center', gap: 8,
              }}
            >
              <Sparkles size={14} /> Abrir chat
            </button>
          </div>
        )}
      </div>

      <style>{`
        @keyframes pulse {
          0%, 100% { opacity: 0.3; transform: scale(0.8); }
          50% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
