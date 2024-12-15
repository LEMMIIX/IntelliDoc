// frontend/src/production-config.js

const getBackendUrl = () => {
    // Für Production: Lies aus Build-Zeit Umgebungsvariablen
    if (process.env.REACT_APP_BACKEND_URL) {
      return process.env.REACT_APP_BACKEND_URL;
    }
    
    // Fallback für Production wenn keine ENV gesetzt
    if (process.env.NODE_ENV === 'production') {
      // Leerer String bedeutet relative URL zum aktuellen Host
      return '';
    }
    
    // Development Fallback
    return 'http://localhost:3000';
  };
  
  const config = {
    backendUrl: getBackendUrl()
  };
  
  export default prodconfig;