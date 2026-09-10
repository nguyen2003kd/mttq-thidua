const baseConfig = {
  backendDomain: import.meta.env.VITE_API_BASE_URL?.trim() || 'http://localhost:5241',
  frontendDomain: 'http://localhost:5173',
  imgEndpointDomain: 'http://localhost:3003',
};

export default baseConfig;
