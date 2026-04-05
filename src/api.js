import axios from 'axios';

const BASE = import.meta.env.VITE_API_URL || '/api';
const api = axios.create({ baseURL: BASE });

// Inyectar token en cada petición
api.interceptors.request.use((config) => {
  const token = localStorage.getItem('token');
  if (token) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

export const productos = {
  listar: (params) => api.get('/productos', { params }),
  obtener: (id) => api.get(`/productos/${id}`),
  crear: (data) => api.post('/productos', data),
  actualizar: (id, data) => api.put(`/productos/${id}`, data),
  ajustarStock: (id, data) => api.patch(`/productos/${id}/stock`, data),
  ajusteMasivoConteo: (ajustes) => api.post('/productos/ajuste-masivo-conteo', { ajustes }),
  eliminar: (id) => api.delete(`/productos/${id}`),
  eliminarMasivo: (ids) => api.post('/productos/eliminar-masivo', { ids }),
  categorias: () => api.get('/productos/meta/categorias'),
  categoriasDetalle: () => api.get('/productos/meta/categorias-detalle'),
  renombrarCategoria: (de, a) => api.put('/productos/meta/categorias/renombrar', { de, a }),
  importarMasivo: (productos, modo = 'omitir') => api.post('/productos/importar-masivo', { productos, modo }),
};

export const caja = {
  obtener: (fecha) => api.get('/caja', { params: { fecha } }),
};

export const clientes = {
  listar: (params) => api.get('/clientes', { params }),
  obtener: (id) => api.get(`/clientes/${id}`),
  crear: (data) => api.post('/clientes', data),
  actualizar: (id, data) => api.put(`/clientes/${id}`, data),
  eliminar: (id) => api.delete(`/clientes/${id}`),
  agregarVehiculo: (id, data) => api.post(`/clientes/${id}/vehiculos`, data),
  historialVehiculo: (vehiculoId) => api.get(`/clientes/vehiculo/${vehiculoId}/historial`),
};

export const proveedores = {
  listar: () => api.get('/proveedores'),
  crear: (data) => api.post('/proveedores', data),
  actualizar: (id, data) => api.put(`/proveedores/${id}`, data),
  eliminar: (id) => api.delete(`/proveedores/${id}`),
};

export const facturas = {
  listar: (params) => api.get('/facturas', { params }),
  obtener: (id) => api.get(`/facturas/${id}`),
  crear: (data) => api.post('/facturas', data),
  convertir: (id) => api.post(`/facturas/${id}/convertir`),
  cambiarEstado: (id, estado) => api.patch(`/facturas/${id}/estado`, { estado }),
};

export const ordenes = {
  listar: (params) => api.get('/ordenes', { params }),
  obtener: (id) => api.get(`/ordenes/${id}`),
  crear: (data) => api.post('/ordenes', data),
  cambiarEstado: (id, estado) => api.patch(`/ordenes/${id}/estado`, { estado }),
  actualizar: (id, data) => api.put(`/ordenes/${id}`, data),
  notas: (id) => api.get(`/ordenes/${id}/notas`),
  agregarNota: (id, texto) => api.post(`/ordenes/${id}/notas`, { texto }),
  convertirFactura: (id) => api.post(`/ordenes/${id}/convertir-factura`),
};

export const gastos = {
  listar: (params) => api.get('/gastos', { params }),
  crear: (data) => api.post('/gastos', data),
  actualizar: (id, data) => api.put(`/gastos/${id}`, data),
  eliminar: (id) => api.delete(`/gastos/${id}`),
};

export const portafolio = {
  listar: (params) => api.get('/portafolio', { params }),
  crear: (data) => api.post('/portafolio', data),
  actualizar: (id, data) => api.put(`/portafolio/${id}`, data),
  eliminar: (id) => api.delete(`/portafolio/${id}`),
};

export const buscar = {
  global: (q) => api.get('/buscar', { params: { q } }),
};

export const reportes = {
  dashboard: (params) => api.get('/reportes/dashboard', { params }),
  stockBajo: () => api.get('/reportes/stock-bajo'),
  ventas: (params) => api.get('/reportes/ventas', { params }),
  contabilidad: (params) => api.get('/reportes/contabilidad', { params }),
};

export const movimientos = {
  listar: (params) => api.get('/movimientos', { params }),
  usuarios: () => api.get('/movimientos/usuarios'),
};

export const configuracion = {
  obtener: () => api.get('/configuracion'),
  guardar: (data) => api.put('/configuracion', data),
  set: (clave, valor) => api.put(`/configuracion/${clave}`, { valor }),
};

export const asistente = {
  chat: (mensajes) => api.post('/asistente/chat', { mensajes }),
};

export const gastosFijos = {
  listar: () => api.get('/gastos-fijos'),
  crear: (data) => api.post('/gastos-fijos', data),
  actualizar: (id, data) => api.put(`/gastos-fijos/${id}`, data),
  eliminar: (id) => api.delete(`/gastos-fijos/${id}`),
};

export const asesor = {
  notificaciones: () => api.get('/asesor/notificaciones'),
  analizar: () => api.post('/asesor/analizar'),
  leerTodas: () => api.patch('/asesor/notificaciones/leer-todas'),
  leer: (id) => api.patch(`/asesor/notificaciones/${id}/leer`),
  chat: (mensajes, notificacionId) => api.post('/asesor/chat', { mensajes, notificacionId }),
};

export const compras = {
  listar: (params) => api.get('/compras', { params }),
  obtener: (id) => api.get(`/compras/${id}`),
  crear: (data) => api.post('/compras', data),
  recibir: (id) => api.patch(`/compras/${id}/recibir`),
  cancelar: (id) => api.patch(`/compras/${id}/cancelar`),
};

export const metodosPago = {
  listar: () => api.get('/metodos-pago'),
  crear: (data) => api.post('/metodos-pago', data),
  actualizar: (id, data) => api.put(`/metodos-pago/${id}`, data),
  eliminar: (id) => api.delete(`/metodos-pago/${id}`),
};

export const analisis = {
  abc: () => api.get('/reportes/abc'),
  rentabilidad: (params) => api.get('/reportes/rentabilidad', { params }),
};

export const auth = {
  login: (email, password) => api.post('/auth/login', { email, password }),
  me: () => api.get('/auth/me'),
  cambiarPassword: (passwordActual, passwordNuevo) =>
    api.post('/auth/cambiar-password', { passwordActual, passwordNuevo }),
};

export const usuarios = {
  listar: () => api.get('/usuarios'),
  crear: (data) => api.post('/usuarios', data),
  actualizar: (id, data) => api.put(`/usuarios/${id}`, data),
  eliminar: (id) => api.delete(`/usuarios/${id}`),
};

export const plantillasPermisos = {
  listar: () => api.get('/usuarios/plantillas'),
  crear: (data) => api.post('/usuarios/plantillas', data),
  actualizar: (id, data) => api.put(`/usuarios/plantillas/${id}`, data),
  eliminar: (id) => api.delete(`/usuarios/plantillas/${id}`),
};
