'use strict';

let handler;
let loadError;

try {
  const mod = require('../dist/serverless.js');
  handler = mod.default || mod;
} catch (err) {
  loadError = err;
}

module.exports = async function serverlessEntry(req, res) {
  const origin = req.headers.origin || '*';
  res.setHeader('Access-Control-Allow-Origin', origin);
  res.setHeader('Access-Control-Allow-Credentials', 'true');
  res.setHeader('Access-Control-Allow-Methods', 'GET,POST,PUT,PATCH,DELETE,OPTIONS');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'Content-Type,Authorization,X-Requested-With,Accept,Accept-Version,Content-Length,Content-MD5,Date,X-Api-Version,X-CSRF-Token',
  );

  // Immediate 204 OK on preflight OPTIONS so browser CORS checks never fail
  if (req.method === 'OPTIONS') {
    res.statusCode = 204;
    res.end();
    return;
  }

  if (loadError || typeof handler !== 'function') {
    res.statusCode = 500;
    res.setHeader('Content-Type', 'application/json; charset=utf-8');
    res.end(
      JSON.stringify({
        error: 'API Serverless Initialization Error',
        message: loadError ? loadError.message : 'Serverless handler is not a function',
        stack: loadError ? loadError.stack : undefined,
      }),
    );
    return;
  }

  return handler(req, res);
};
