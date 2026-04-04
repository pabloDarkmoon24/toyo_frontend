// Sistema de toast global — sin contexto, importa y usa en cualquier lado
let _id = 0;
const _listeners = new Set();

export const toast = (message, type = 'info', duration = 4000) => {
  const notif = { id: ++_id, message, type, duration };
  _listeners.forEach(fn => fn(notif));
};

toast.success = (m, d) => toast(m, 'success', d);
toast.error   = (m, d) => toast(m, 'error', d);
toast.warning = (m, d) => toast(m, 'warning', d);
toast.info    = (m, d) => toast(m, 'info', d);
toast._sub    = (fn) => { _listeners.add(fn); return () => _listeners.delete(fn); };
