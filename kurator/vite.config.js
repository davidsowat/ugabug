import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';

export default defineConfig({
  plugins: [react()],
  server: {
    https: {
      key: fs.readFileSync(path.resolve(__dirname, 'cert/localhost+1-key.pem')),
      cert: fs.readFileSync(path.resolve(__dirname, 'cert/localhost+1.pem')),
    },
    port: 5173,
    strictPort: true,
    host: 'trackcurator.org' // ✔️ bara domännamnet
  },
});
