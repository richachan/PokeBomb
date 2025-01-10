import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket } from 'net';
import { Server } from 'socket.io';
import { matchesGlob } from 'path';


let userMap = new Map<string,string>() //username, socket.id
let userList = new Array()            //list of usernames
let currTurn: number = 0;
type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: HTTPServer & {
      io?: Server;
    };
  };
};
//mock data for guessing test
const pokedex = ['bulbasaur']
function getPokemon() {
  return pokedex[Math.floor(Math.random() * pokedex.length)] //returns random pokemon from pokedex list
}

let currentPoke = getPokemon()

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
        if(socket.id == userList[currTurn] && msg.text == currentPoke){
          let msg1 = {user: userMap[socket.id], text:" has correctly guessed " + currentPoke + "!"};
          io.emit('message', msg1);
          currTurn = (currTurn + 1) % userList.length; 
          msg1 = {user: "It is now " + userMap[userList[currTurn]] + "'s turn to guess!", text:""};
          io.emit('message', msg1); 
        }
        else if (socket.id == userList[currTurn]) {
  
          const msg2 = {user: userMap[socket.id], text: " wrongly guessed " + msg.text};
          io.emit('message', msg2);
        }
      });
      socket.on('register', (userName) => {
        userList.push(socket.id);  
        userMap[socket.id] = userName;       

        console.log(userMap[socket.id] + " has joined the game with client id: " + socket.id);
        console.log("Current turn " + userList[currTurn]);
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
