const backendUrl = process.env.NODE_ENV === 'production' 
  ? '' // Empty string means use relative URLs
  : 'http://localhost:3000';

  console.log('Environment:', process.env.NODE_ENV);
  console.log('Backend URL:', backendUrl);

export default backendUrl;