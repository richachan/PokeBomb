// pages/api/socket.ts

import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket } from 'net';
import { Server } from 'socket.io';

/** 
 * Extend Next.js' default NextApiResponse to include 
 * a Socket.IO server instance on res.socket.server.io
 */
type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: HTTPServer & {
      io?: Server;
    };
  };
};

export default function handler(
  req: NextApiRequest,
  res: NextApiResponseServerIO
) {
  // If Socket.IO server is not set up yet, set it up
  if (!res.socket.server.io) {
    console.log('Initializing new Socket.IO server...');
    
    const io = new Server(res.socket.server, {
      path: '/api/socket_io', // optional path
      cors: {
        origin: '*',
      },
    });

    io.on('connection', (socket) => {
      console.log('A client connected:', socket.id);

      socket.on('message', (msg) => {
        io.emit('message', msg);
      });

      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
      });
    });

    // Attach the Socket.IO server to the Next.js socket server
    res.socket.server.io = io;
  } else {
    console.log('Socket.IO server already running');
  }

  // We must end the response so Next.js can finish the API route
  res.end();
}
