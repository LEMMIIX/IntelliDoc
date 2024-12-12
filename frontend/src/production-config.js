const backendUrl = process.env.NODE_ENV === 'production' 
  ? '' // Empty string means use relative URLs
  : 'http://localhost:3000';

export default backendUrl;