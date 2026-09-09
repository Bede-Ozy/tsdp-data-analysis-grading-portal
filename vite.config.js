import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

const DEFAULT_GAS_URL = 'https://script.google.com/macros/s/AKfycbyY9VbWzeoe0UR_riMeP6-8h6j01EIR3MVbUrKQJ4ZXAg14tZej574rNEmz6mUa0pfI/exec';

/**
 * Custom Vite plugin to proxy /api/proxy requests to Google Apps Script.
 * Google Apps Script returns 302 Found redirects on Web App exec URLs.
 * Node native fetch follows these redirects automatically with redirect: 'follow'.
 */
function gasProxyPlugin(targetGasUrl) {
  return {
    name: 'gas-proxy-plugin',
    configureServer(server) {
      server.middlewares.use('/api/proxy', async (req, res) => {
        // Handle preflight requests
        if (req.method === 'OPTIONS') {
          res.statusCode = 200;
          res.setHeader('Access-Control-Allow-Origin', '*');
          res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
          res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization, X-Requested-With');
          res.end();
          return;
        }

        if (req.method !== 'POST') {
          res.statusCode = 405;
          res.setHeader('Content-Type', 'application/json');
          res.end(JSON.stringify({ error: 'Method Not Allowed' }));
          return;
        }

        let body = '';
        req.on('data', (chunk) => {
          body += chunk;
        });

        req.on('end', async () => {
          try {
            const contentType = req.headers['content-type'] || 'application/json';
            const response = await fetch(targetGasUrl, {
              method: 'POST',
              body: body,
              headers: {
                'Content-Type': contentType,
              },
              redirect: 'follow',
            });

            const text = await response.text();

            res.statusCode = response.status;
            res.setHeader('Access-Control-Allow-Origin', '*');
            res.setHeader('Content-Type', 'application/json; charset=utf-8');
            res.end(text);
          } catch (err) {
            console.error('[Vite Proxy] Error forwarding request to Google Apps Script:', err);
            res.statusCode = 500;
            res.setHeader('Content-Type', 'application/json');
            res.end(JSON.stringify({ error: 'Proxy forwarding failed', message: err.message }));
          }
        });
      });
    },
  };
}

// https://vite.dev/config/
export default defineConfig(({ mode }) => {
  const env = loadEnv(mode, process.cwd(), '');
  const gasUrl = env.VITE_GAS_URL || DEFAULT_GAS_URL;

  return {
    plugins: [react(), gasProxyPlugin(gasUrl)],
    server: {
      port: 3000,
      open: false,
    },
  };
});


