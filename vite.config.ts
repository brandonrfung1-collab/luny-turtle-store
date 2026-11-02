import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

// The dev server runs inside Express (server/index.js) in middleware mode,
// so the site and the /api routes share one port: http://localhost:5173
export default defineConfig({
  plugins: [react()],
});
