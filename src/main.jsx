import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { registerSW } from 'virtual:pwa-register'
import './index.css'
import App from './App.jsx'

// Captura el prompt de instalación de Android (antes de renderizar)
window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__installPrompt = e;
  window.dispatchEvent(new Event('pwa-installable'));
});

if ('serviceWorker' in navigator) {
  // Cuando el SW nuevo toma el control → recarga automática
  navigator.serviceWorker.addEventListener('controllerchange', () => {
    window.location.reload();
  });
}

// Registra el SW. onRegisteredSW nos da la referencia para forzar checks.
const updateSW = registerSW({
  immediate: true,
  onRegisteredSW(_, registration) {
    if (!registration) return;

    // Revisar actualizaciones al volver a la app (cambio de pestaña / desbloqueo)
    document.addEventListener('visibilitychange', () => {
      if (document.visibilityState === 'visible') {
        registration.update();
      }
    });
  },
});

window.__pwaUpdate = updateSW;

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
