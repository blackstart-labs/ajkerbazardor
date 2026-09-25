import 'reflect-metadata';
import { createNestApp } from './setup.js';

async function bootstrap() {
  const app = await createNestApp();
  const port = process.env['PORT'] ?? 3000;
  await app.listen(port, '0.0.0.0');
  console.warn(`API listening on port ${port} — docs at http://localhost:${port}/api/docs`);
}

bootstrap().catch((err: unknown) => {
  console.error('Failed to start API:', err);
  process.exit(1);
});
