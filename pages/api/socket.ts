import type { NextApiRequest, NextApiResponse } from "next";
import { Server } from "socket.io";

type NextApiResponseServerIO = NextApiResponse & {
    socket: {
        server: {
            io?: Server;
        };
    };
};

export default function handler(req: NextApiRequest, res: NextApiResponseServerIO) {
    if (!res.socket.server.io) {
        console.log("Initializing Socket.IO...");

        const io = new Server(res.socket.server as any, {
            cors: {
                origin: "*", // Allow all origins
                methods: ["GET", "POST"],
            },
        });

        res.socket.server.io = io;

        io.on("connection", (socket) => {
            console.log("A user connected:", socket.id);

            // Handle incoming messages
            socket.on("message", (message: string) => {
                console.log(`Message received: ${message}`);
                io.emit("message", `${socket.id.substring(0, 5)}: ${message}`);
            });

            socket.on("disconnect", () => {
                console.log("A user disconnected:", socket.id);
            });
        });
    }

    res.end();
}
