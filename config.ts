export const config = {
  API_ENDPOINT: import.meta.env.VITE_API_ENDPOINT || 'http://localhost:8080',
  WS_ENDPOINT: import.meta.env.VITE_WS_ENDPOINT || 'ws://localhost:8080',
};
