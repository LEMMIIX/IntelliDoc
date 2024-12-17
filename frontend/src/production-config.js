/**
 * Diese Datei stellt die Konfigurationsfunktion bereit, um die Backend-URL je nach Umgebung (Entwicklung oder Produktion) dynamisch zu bestimmen.
 *
 * @author Lennart
 */

const getBackendUrl = () => {
  if (import.meta?.env?.VITE_BACKEND_URL) {
      return import.meta.env.VITE_BACKEND_URL;
  }
  
  // For production
  if (import.meta?.env?.PROD) {
      return '';
  }
  
  // Development fallback
  return 'http://localhost:3000';
};

const config = {
  backendUrl: getBackendUrl()
};

export default config;