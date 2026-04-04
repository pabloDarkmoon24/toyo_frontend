import { createContext, useContext, useState, useEffect, useCallback } from 'react';
import axios from 'axios';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [usuario, setUsuario] = useState(null);
  const [cargando, setCargando] = useState(true);

  // Inyectar token en todas las peticiones axios
  useEffect(() => {
    const interceptor = axios.interceptors.request.use((config) => {
      const token = localStorage.getItem('token');
      if (token) config.headers.Authorization = `Bearer ${token}`;
      return config;
    });
    return () => axios.interceptors.request.eject(interceptor);
  }, []);

  // Verificar sesión al cargar
  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) { setCargando(false); return; }

    axios.get('/api/auth/me')
      .then(r => setUsuario(r.data))
      .catch(() => {
        localStorage.removeItem('token');
        setUsuario(null);
      })
      .finally(() => setCargando(false));
  }, []);

  const login = useCallback(async (email, password) => {
    const { data } = await axios.post('/api/auth/login', { email, password });
    localStorage.setItem('token', data.token);
    setUsuario(data.usuario);
    return data.usuario;
  }, []);

  const logout = useCallback(() => {
    const token = localStorage.getItem('token');
    if (token) {
      // Invalidar token en servidor (fire-and-forget, no bloquea el logout local)
      axios.post('/api/auth/logout').catch(() => {});
    }
    localStorage.removeItem('token');
    setUsuario(null);
  }, []);

  /**
   * Verifica si el usuario tiene permiso para una clave dada.
   * - Admin siempre tiene acceso.
   * - Si permisos es null (no asignado), se permite todo (compatibilidad).
   * - 'facturas' = facturas-cotizaciones OR facturas-facturas.
   */
  const tienePermiso = useCallback((key) => {
    if (!usuario) return false;
    if (usuario.rol === 'admin') return true;
    if (!usuario.permisos) return true;
    if (key === 'facturas') {
      return !!usuario.permisos['facturas-cotizaciones'] || !!usuario.permisos['facturas-facturas'];
    }
    return !!usuario.permisos[key];
  }, [usuario]);

  const actualizarUsuario = useCallback((datos) => {
    setUsuario(u => u ? { ...u, ...datos } : u);
  }, []);

  return (
    <AuthContext.Provider value={{ usuario, cargando, login, logout, tienePermiso, actualizarUsuario }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
