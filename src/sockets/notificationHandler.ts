import { Server, Socket } from 'socket.io';
import jwt from 'jsonwebtoken';
import { logger } from '../lib/logger';

interface JWTPayload {
  id: string;
  email: string;
  role: string;
}

export function setupNotificationSockets(io: Server) {
  io.use((socket: Socket, next) => {
    const token = socket.handshake.auth?.token as string | undefined;

    if (!token) {
      next(new Error('Missing token'));
      return;
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as JWTPayload;
      socket.data.user = decoded;
      next();
    } catch (err) {
      logger.warn({ err }, 'Socket JWT verification failed');
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket: Socket) => {
    const user = socket.data.user as JWTPayload | undefined;
    if (!user) {
      socket.disconnect(true);
      return;
    }

    const room = `user:${user.id}`;
    socket.join(room);
    logger.info({ socketId: socket.id, userId: user.id }, `Socket joined room ${room}`);

    socket.on('disconnect', () => {
      logger.info({ socketId: socket.id, userId: user.id }, 'Socket disconnected');
    });
  });
}
