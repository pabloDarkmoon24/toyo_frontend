import { useState, useRef, useEffect } from 'react';
import { asistente as api } from '../api';
import { Send, Bot, User, Loader2, Sparkles, Zap, RotateCcw } from 'lucide-react';

const sugerencias = [
  { text: '¿Qué productos tienen stock bajo?', icon: '📦' },
  { text: 'Muéstrame el resumen del negocio', icon: '📊' },
  { text: '¿Cuántas órdenes están activas en el taller?', icon: '🔧' },
  { text: '¿Cuántas llantas tenemos disponibles?', icon: '🚗' },
  { text: 'Añade 20 unidades de aceite 5W30 a $12 c/u', icon: '✅' },
  { text: 'Crea una orden para Carlos López, Toyota Hilux placa AA123', icon: '📋' },
];

function MessageBubble({ msg }) {
  const isUser = msg.role === 'user';
  return (
    <div className={`flex gap-3 animate-fade-in ${isUser ? 'justify-end' : 'justify-start'}`}>
      {!isUser && (
        <div className="w-8 h-8 rounded-xl shrink-0 mt-1 flex items-center justify-center"
          style={{ background: 'linear-gradient(135deg, #7c3aed, #dc2626)' }}>
          <Bot size={15} className="text-white" />
        </div>
      )}
      <div className={`max-w-[75%] rounded-2xl px-4 py-3 text-sm leading-relaxed whitespace-pre-wrap ${
        isUser
          ? 'text-white rounded-tr-sm'
          : 'text-slate-800 rounded-tl-sm border border-slate-200/80'
      }`}
        style={isUser
          ? { background: 'linear-gradient(135deg, #dc2626, #b91c1c)', boxShadow: '0 2px 8px rgba(220,38,38,.25)' }
          : { background: '#fff', boxShadow: '0 1px 3px rgba(0,0,0,.06)' }
        }>
        {msg.content}
      </div>
      {isUser && (
        <div className="w-8 h-8 rounded-xl shrink-0 mt-1 flex items-center justify-center bg-slate-700">
          <User size={15} className="text-white" />
        </div>
      )}
    </div>
  );
}

export default function Asistente() {
  const [mensajes, setMensajes] = useState([]);
  const [input, setInput] = useState('');
  const [cargando, setCargando] = useState(false);
  const bottomRef = useRef(null);
  const inputRef = useRef(null);

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [mensajes, cargando]);

  const enviar = async (texto) => {
    const msg = texto || input.trim();
    if (!msg || cargando) return;
    setInput('');

    const nuevos = [...mensajes, { role: 'user', content: msg }];
    setMensajes(nuevos);
    setCargando(true);

    try {
      const r = await api.chat(nuevos);
      setMensajes([...nuevos, { role: 'assistant', content: r.data.respuesta }]);
    } catch {
      setMensajes([...nuevos, {
        role: 'assistant',
        content: 'Ocurrió un error. Verifica que el servidor esté activo y que la API key de Claude esté configurada en server/.env',
      }]);
    } finally {
      setCargando(false);
      setTimeout(() => inputRef.current?.focus(), 50);
    }
  };

  const handleKey = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); enviar(); }
  };

  return (
    <div className="flex flex-col" style={{ height: 'calc(100vh - 112px)' }}>
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl flex items-center justify-center"
            style={{ background: 'linear-gradient(135deg, #7c3aed, #dc2626)', boxShadow: '0 4px 12px rgba(124,58,237,.3)' }}>
            <Sparkles size={18} className="text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-slate-900 tracking-tight">Asistente Toyo+</h1>
            <p className="text-xs text-slate-500">Gestiona el negocio en lenguaje natural</p>
          </div>
        </div>
        {mensajes.length > 0 && (
          <button
            onClick={() => setMensajes([])}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-medium text-slate-500 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <RotateCcw size={12} /> Nueva conversación
          </button>
        )}
      </div>

      {/* Chat container */}
      <div className="flex-1 bg-white rounded-2xl border border-slate-200/80 flex flex-col overflow-hidden"
        style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>

        {/* Messages */}
        <div className="flex-1 overflow-y-auto p-5 space-y-4">
          {mensajes.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center py-8 animate-fade-in">
              {/* Orb decorativo */}
              <div className="relative mb-6">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #7c3aed22, #dc262622)', border: '1px solid rgba(124,58,237,.15)' }}>
                  <Bot size={36} className="text-purple-500" />
                </div>
                <div className="absolute -top-1 -right-1 w-6 h-6 rounded-full flex items-center justify-center"
                  style={{ background: 'linear-gradient(135deg, #7c3aed, #dc2626)' }}>
                  <Zap size={11} className="text-white" fill="white" />
                </div>
              </div>
              <h2 className="text-lg font-bold text-slate-900 mb-1">Hola, soy tu asistente</h2>
              <p className="text-sm text-slate-500 text-center max-w-sm mb-8">
                Puedo gestionar inventario, crear órdenes, consultar ventas y mucho más. Solo dime qué necesitas.
              </p>

              {/* Sugerencias */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 w-full max-w-lg">
                {sugerencias.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => enviar(s.text)}
                    className="flex items-center gap-2.5 text-left px-4 py-3 rounded-xl border border-slate-200 hover:border-purple-300 hover:bg-purple-50/50 transition-all text-sm text-slate-600 hover:text-slate-900 group"
                  >
                    <span className="text-base shrink-0">{s.icon}</span>
                    <span className="flex-1 leading-snug">{s.text}</span>
                  </button>
                ))}
              </div>
            </div>
          ) : (
            mensajes.map((m, i) => <MessageBubble key={i} msg={m} />)
          )}

          {cargando && (
            <div className="flex gap-3 animate-fade-in">
              <div className="w-8 h-8 rounded-xl flex items-center justify-center shrink-0"
                style={{ background: 'linear-gradient(135deg, #7c3aed, #dc2626)' }}>
                <Bot size={15} className="text-white" />
              </div>
              <div className="bg-white border border-slate-200 rounded-2xl rounded-tl-sm px-4 py-3 flex items-center gap-2.5"
                style={{ boxShadow: '0 1px 3px rgba(0,0,0,.06)' }}>
                <div className="flex gap-1">
                  {[0, 1, 2].map(i => (
                    <div key={i} className="w-1.5 h-1.5 rounded-full bg-slate-400 animate-bounce"
                      style={{ animationDelay: `${i * 150}ms` }} />
                  ))}
                </div>
                <span className="text-xs text-slate-400">Procesando...</span>
              </div>
            </div>
          )}
          <div ref={bottomRef} />
        </div>

        {/* Input */}
        <div className="p-4 border-t border-slate-100">
          <div className="flex gap-2 items-end">
            <div className="flex-1 relative">
              <textarea
                ref={inputRef}
                value={input}
                onChange={e => setInput(e.target.value)}
                onKeyDown={handleKey}
                placeholder="Escribe tu mensaje... (Enter para enviar)"
                rows={1}
                className="w-full px-4 py-3 text-sm rounded-xl border border-slate-300 outline-none focus:ring-2 focus:ring-purple-100 focus:border-purple-400 resize-none transition-all"
                style={{ maxHeight: 120, overflowY: 'auto' }}
              />
            </div>
            <button
              onClick={() => enviar()}
              disabled={!input.trim() || cargando}
              className="w-11 h-11 flex items-center justify-center rounded-xl text-white transition-all duration-150 disabled:opacity-40 hover:scale-105 active:scale-95 shrink-0"
              style={{ background: 'linear-gradient(135deg, #7c3aed, #dc2626)', boxShadow: input.trim() && !cargando ? '0 4px 12px rgba(124,58,237,.35)' : 'none' }}
            >
              <Send size={16} />
            </button>
          </div>
          <p className="text-xs text-slate-400 text-center mt-2">
            El asistente accede y modifica datos reales del sistema
          </p>
        </div>
      </div>
    </div>
  );
}
