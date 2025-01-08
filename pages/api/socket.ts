import { Server } from 'socket.io';
import { NextApiRequest, NextApiResponse } from 'next';
import { Server as HttpServer } from 'http';
import { Socket as NetSocket } from 'net';

type NextApiResponseWithSocket = NextApiResponse & {
    socket: NetSocket & { server: HttpServer & { io?: Server } };
};

export default function handler(req: NextApiRequest, res: NextApiResponseWithSocket) {
    if (!res.socket.server.io) {
        console.log('Setting up Socket.IO server...');
        const io = new Server(res.socket.server);

        io.on('connection', (socket) => {
            console.log('a user connected:', socket.id);

            socket.on('message', (message: string) => {
                console.log(message);
                io.emit('message', `${socket.id.substr(0, 2)} said: ${message}`);
            });

            socket.on('disconnect', () => {
                console.log('user disconnected:', socket.id);
            });
        });

        res.socket.server.io = io; // Attach the server to res.socket
    }
    res.end(); // Required to end the API response
}
