import type { NextApiRequest, NextApiResponse } from 'next';
import Redis from 'ioredis';

export const config = { api: { bodyParser: false } };

// Single Redis connection for pub/sub
const redisPublisher = new Redis(process.env.REDIS_URL);
export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  res.setHeader('Content-Type', 'text/event-stream');
  res.setHeader('Cache-Control', 'no-cache');
  res.setHeader('Connection', 'keep-alive');

  // Duplicate for subscription
  const subscriber = redisPublisher.duplicate();
  await subscriber.connect();
  await subscriber.subscribe('gameUpdates');
  subscriber.on('message', (_channel, message) => {
    res.write(`data: ${message}\n\n`);
  });

  req.on('close', () => {
    subscriber.disconnect();
    res.end();
  });
} 