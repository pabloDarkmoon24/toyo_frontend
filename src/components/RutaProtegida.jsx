import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { PageLoader } from './UI';

export default function RutaProtegida({ children, rolRequerido, permisoRequerido }) {
  const { usuario, cargando, tienePermiso } = useAuth();
  const location = useLocation();

  if (cargando) return <PageLoader />;
  if (!usuario) return <Navigate to="/login" replace />;

  // Forzar cambio de contraseña antes de entrar a cualquier ruta
  if (usuario.debesCambiarPassword && location.pathname !== '/cambiar-password') {
    return <Navigate to="/cambiar-password" replace />;
  }

  if (rolRequerido && usuario.rol !== rolRequerido) return <Navigate to="/" replace />;
  if (permisoRequerido && !tienePermiso(permisoRequerido)) return <Navigate to="/" replace />;

  return children;
}
