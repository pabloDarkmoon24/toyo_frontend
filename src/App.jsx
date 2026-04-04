import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider } from './context/AuthContext';
import RutaProtegida from './components/RutaProtegida';
import Layout from './components/Layout';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Inventario from './pages/Inventario';
import Clientes from './pages/Clientes';
import Ordenes from './pages/Ordenes';
import Facturas from './pages/Facturas';
import Gastos from './pages/Gastos';
import Proveedores from './pages/Proveedores';
import Portafolio from './pages/Portafolio';
import Asistente from './pages/Asistente';
import Asesor from './pages/Asesor';
import Usuarios from './pages/Usuarios';
import ListaCompras from './pages/ListaCompras';
import Configuracion from './pages/Configuracion';
import Historial from './pages/Historial';
import CierreCaja from './pages/CierreCaja';
import ConteoFisico from './pages/ConteoFisico';
import Compras from './pages/Compras';
import Analisis from './pages/Analisis';
import CambiarPassword from './pages/CambiarPassword';

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<Login />} />
          <Route path="/cambiar-password" element={
            <RutaProtegida>
              <CambiarPassword />
            </RutaProtegida>
          } />
          <Route
            path="/"
            element={
              <RutaProtegida>
                <Layout />
              </RutaProtegida>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="inventario" element={<Inventario />} />
            <Route path="clientes" element={<Clientes />} />
            <Route path="ordenes" element={<Ordenes />} />
            <Route path="facturas" element={<Facturas />} />
            <Route path="gastos" element={<Gastos />} />
            <Route path="proveedores" element={<Proveedores />} />
            <Route path="portafolio" element={<Portafolio />} />
            <Route path="asistente" element={<Asistente />} />
            <Route path="asesor" element={<Asesor />} />
            <Route path="lista-compras" element={<ListaCompras />} />
            <Route path="configuracion" element={<Configuracion />} />
            <Route path="historial" element={<Historial />} />
            <Route path="cierre-caja" element={<CierreCaja />} />
            <Route path="conteo-fisico" element={<ConteoFisico />} />
            <Route path="compras" element={<Compras />} />
            <Route path="analisis" element={<Analisis />} />
            <Route
              path="usuarios"
              element={
                <RutaProtegida rolRequerido="admin">
                  <Usuarios />
                </RutaProtegida>
              }
            />
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
