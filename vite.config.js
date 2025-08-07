import { defineConfig } from 'vite';
import vue from '@vitejs/plugin-vue';

// https://vitejs.dev/config/
export default defineConfig({
  plugins: [vue()],
  server: {
    proxy: {
      '/api/v2': {
        target: 'dynamic',
        changeOrigin: true,
        secure: false,
        rewrite: (path) => path.replace(/^\/api\/v2/, '/v2'),
        configure: (proxy) => {
          proxy.on('proxyReq', (proxyReq, req) => {
            const mirrorUrl = req.headers['x-mirror-url'];
            if (mirrorUrl) {
              try {
                const url = new URL(mirrorUrl);
                proxyReq.setHeader('Host', url.host);
                proxyReq.setHeader('Origin', url.origin);
                proxy.options.target = url.origin;
              } catch (error) {
                console.error(`Invalid mirror URL: ${mirrorUrl}`, error);
                proxyReq.destroy();
              }
            } else {
              console.error('No x-mirror-url header provided');
              proxyReq.destroy();
            }
          });
          proxy.on('proxyRes', (proxyRes, req) => {
            const mirrorUrl = req.headers['x-mirror-url'] || 'unknown';
            if (![200, 401, 403, 429].includes(proxyRes.statusCode)) {
              console.warn(`Non-standard status code ${proxyRes.statusCode} for ${mirrorUrl}`);
            }
          });
          proxy.on('error', (err, req, res) => {
            const mirrorUrl = req.headers['x-mirror-url'] || 'unknown';
            console.error(`Proxy error for ${mirrorUrl}:`, err);
            res.writeHead(500, { 'Content-Type': 'application/json' });
            res.end(JSON.stringify({
              error: 'Proxy error',
              message: err.message,
              code: err.code || 'UNKNOWN',
            }));
          });
        },
      },
    },
  },
});