// frontend/src/production-config.js

const getBackendUrl = () => {
  // For Vite in development
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