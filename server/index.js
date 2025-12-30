import app from './app.js';
import { initializeDatabase } from './services/db.js';

const PORT = process.env.PORT ?? 4000;

async function start() {
  try {
    await initializeDatabase();

    app.listen(PORT, '0.0.0.0', () => {
      console.log(`API server listening on http://0.0.0.0:${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server', error);
    process.exit(1);
  }
}

start();
