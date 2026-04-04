// Diálogo de confirmación global — reemplaza window.confirm()
// Uso: const ok = await confirmar('¿Eliminar?')
const _listeners = new Set();

export function confirmar(mensaje, titulo = 'Confirmar acción') {
  return new Promise((resolve) => {
    _listeners.forEach(fn => fn({ mensaje, titulo, resolve }));
  });
}

confirmar._sub = (fn) => { _listeners.add(fn); return () => _listeners.delete(fn); };
