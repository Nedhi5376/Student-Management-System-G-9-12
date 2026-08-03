import { createApp } from './app.js';
import { connectDb, disconnectDb } from './config/db.js';
import { env } from './config/env.js';
import { logger } from './utils/logger.js';

async function start() {
  await connectDb();
  const server = createApp().listen(env.PORT, () => logger.info(`api listening on port ${env.PORT}`));

  const shutdown = async (signal) => {
    logger.info(`received ${signal}, shutting down`);
    server.close(async () => {
      await disconnectDb();
      process.exit(0);
    });
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

start().catch((error) => {
  logger.error('failed to start server', { message: error.message });
  process.exit(1);
});
