import path from 'path';
import fs from 'fs';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** Serve src-front/assets/map-dist at /map-dist (Map.ir Web SDK). See https://help.map.ir/documentation/websdk-installation/ */
function serveMapDist() {
  const mapDistPath = path.resolve(__dirname, '../assets/map-dist');
  const mime: Record<string, string> = {
    '.js': 'application/javascript',
    '.css': 'text/css',
    '.json': 'application/json',
    '.woff': 'font/woff',
    '.woff2': 'font/woff2',
    '.svg': 'image/svg+xml',
  };
  return {
    name: 'serve-map-dist',
    configureServer(server: { middlewares: { use: (fn: (req: any, res: any, next: () => void) => void) => void } }) {
      server.middlewares.use('/map-dist', (req, res, next) => {
        const url = (req.url ?? '/').split('?')[0];
        const filePath = path.join(mapDistPath, url);
        if (!path.resolve(filePath).startsWith(path.resolve(mapDistPath))) return next();
        fs.stat(filePath, (err, stat) => {
          if (err || !stat?.isFile()) return next();
          fs.readFile(filePath, (err, data) => {
            if (err) return next();
            res.setHeader('Content-Type', mime[path.extname(filePath)] ?? 'application/octet-stream');
            res.end(data);
          });
        });
      });
    },
  };
}

export default defineConfig(({ mode }) => {
  const rootEnvDir = path.resolve(__dirname, '../..');
  const env = loadEnv(mode, rootEnvDir, '');
  return {
    envDir: rootEnvDir,
    server: {
      port: 3002,
      host: '0.0.0.0',
      fs: { allow: [path.resolve(__dirname, '..')] },
    },
    plugins: [react(), serveMapDist()],
    define: {
      'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
    },
    resolve: {
      alias: {
        '@': path.resolve(__dirname, '.'),
        '@assets': path.resolve(__dirname, '../assets'),
      },
    },
  };
});