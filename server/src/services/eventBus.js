import { logger } from '../utils/logger.js';

const HEARTBEAT_MS = 25000;

const connections = new Set();

export function subscribe(res, userId) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache, no-transform',
    Connection: 'keep-alive',
    'X-Accel-Buffering': 'no',
  });
  res.flushHeaders();
  res.write(`retry: 5000\n\n`);

  const connection = { userId: userId.toString(), res };
  connections.add(connection);

  const heartbeat = setInterval(() => {
    if (res.writableEnded) return;
    res.write(`: ping\n\n`);
  }, HEARTBEAT_MS);

  const cleanup = () => {
    clearInterval(heartbeat);
    connections.delete(connection);
    logger.info('events.unsubscribed', { userId: userId.toString() });
  };

  res.on('close', cleanup);

  logger.info('events.subscribed', { userId: userId.toString() });
}

export function broadcast(event, data, userId) {
  for (const connection of connections) {
    if (connection.userId !== userId.toString()) continue;
    try {
      connection.res.write(`event: ${event}\n`);
      connection.res.write(`data: ${JSON.stringify(data)}\n\n`);
    } catch (error) {
      logger.warn('events.send_failed', { userId: connection.userId, event, error: error.message });
    }
  }
}