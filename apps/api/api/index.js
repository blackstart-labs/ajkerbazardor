// Vercel serverless handler — plain JS so @vercel/node doesn't need
// to re-compile with esbuild (which can't handle NestJS decorators).
// The actual app is pre-compiled to dist/ by the build script.

require('reflect-metadata');

let cachedApp = null;

const ALLOWED_ORIGINS = [
  'https://ajkerbazardor.vercel.app',
  'https://ajkerbazardoor.vercel.app',
  'http://localhost:3001',
  'http://localhost:3002',
];

function getAllowedOrigin(reqOrigin) {
  if (!reqOrigin) return '';
  const clean = reqOrigin.replace(/\/$/, '');
  if (ALLOWED_ORIGINS.includes(clean)) return clean;
  if (/\.vercel\.app$/.test(clean)) return clean;
  return '';
}

function setCorsHeaders(res, origin) {
  if (origin) {
    res.setHeader('Access-Control-Allow-Origin', origin);
    res.setHeader('Access-Control-Allow-Credentials', 'true');
    res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type,Authorization');
    res.setHeader('Access-Control-Max-Age', '86400');
  }
}

async function getApp() {
  if (!cachedApp) {
    const { createNestApp } = require('../dist/setup.js');
    cachedApp = await createNestApp();
    await cachedApp.init();
    await cachedApp.getHttpAdapter().getInstance().ready();
  }
  return cachedApp;
}

module.exports = async function handler(req, res) {
  const origin = getAllowedOrigin(req.headers.origin);

  // Fast-path: handle OPTIONS preflight without booting NestJS
  if (req.method === 'OPTIONS') {
    setCorsHeaders(res, origin);
    res.statusCode = 204;
    res.end();
    return;
  }

  try {
    const app = await getApp();
    const instance = app.getHttpAdapter().getInstance();
    instance.server.emit('request', req, res);
  } catch (err) {
    console.error('Vercel handler error:', err);
    setCorsHeaders(res, origin);
    res.statusCode = 500;
    res.end(
      JSON.stringify({
        error: 'Internal Server Error',
        message: err instanceof Error ? err.message : String(err),
      }),
    );
  }
};
