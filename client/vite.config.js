import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// Dev proxy: the browser calls /api/* on :5173, Vite forwards to the Express server.
export default defineConfig({
  plugins: [react()],
  server: { proxy: { '/api': 'http://localhost:5000' } },
});
