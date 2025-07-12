import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Miljöflagga: använd `npm run dev` för development
const isDev = process.env.NODE_ENV !== 'production';

export default defineConfig({
  plugins: [react()],
  server: {
    port: 5173,
    ...(isDev
      ? {
          https: false, // 🧪 I utveckling – INGEN HTTPS! Viktigt för Spotify
        }
      : {
          https: {
            key: fs.readFileSync(path.resolve(__dirname, 'cert', 'localhost+1-key.pem')),
            cert: fs.readFileSync(path.resolve(__dirname, 'cert', 'localhost+1.pem')),
          },
        }),
  },
});
