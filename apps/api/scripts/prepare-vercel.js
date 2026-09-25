#!/usr/bin/env node
// Post-build: copy compiled output to api/ for Vercel Functions convention
const fs = require('fs');
const path = require('path');

const root = path.resolve(__dirname, '..');
const apiDir = path.join(root, 'api');
const distDir = path.join(root, 'dist');

// Create api/ directory
fs.mkdirSync(apiDir, { recursive: true });

// Copy dist/ into api/dist/ so require paths resolve
fs.cpSync(distDir, path.join(apiDir, 'dist'), { recursive: true });

// Create thin wrapper that Vercel picks up
fs.writeFileSync(
  path.join(apiDir, 'index.js'),
  `const handler = require('./dist/serverless.js');\nmodule.exports = handler.default || handler;\n`,
);

console.log('✓ Vercel function prepared at api/index.js');
