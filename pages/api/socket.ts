import type { NextApiRequest, NextApiResponse } from 'next';
import type { Server as HTTPServer } from 'http';
import type { Socket } from 'net';
import { Server } from 'socket.io';
import { matchesGlob } from 'path';


let userMap = new Map<string,string>() //socket.id, username
let userList = new Array()            //list of usernames
let currTurn: number = 0;
let timerId;
type NextApiResponseServerIO = NextApiResponse & {
  socket: Socket & {
    server: HTTPServer & {
      io?: Server;
    };
  };
};
//151 pokemon from gen 1 missing mr. mime because he has a space and period in his name
// farfetch'd also gives faulty gif link because of formatting
const pokedex = ["bulbasaur", "ivysaur", "venusaur", "charmander", "charmeleon", "charizard", "squirtle", "wartortle", "blastoise",
"caterpie", "metapod", "butterfree", "weedle", "kakuna", "beedrill", "pidgey", "pidgeotto", "pidgeot",
"rattata", "raticate", "spearow", "fearow", "ekans", "arbok", "pikachu", "raichu", "sandshrew", "sandslash",
"nidoran", "nidorina", "nidoqueen", "nidoran", "nidorino", "nidoking", "clefairy", "clefable", "vulpix", "ninetales",
"jigglypuff", "wigglytuff", "zubat", "golbat", "oddish", "gloom", "vileplume", "paras", "parasect", "venonat", "venomoth",
"diglett", "dugtrio", "meowth", "persian", "psyduck", "golduck", "mankey", "primeape", "growlithe", "arcanine",
"poliwag", "poliwhirl", "poliwrath", "abra", "kadabra", "alakazam", "machop", "machoke", "machamp", "bellsprout",
"weepinbell", "victreebel", "tentacool", "tentacruel", "geodude", "graveler", "golem", "ponyta", "rapidash", "slowpoke",
"slowbro", "magnemite", "magneton", "farfetch'd", "doduo", "dodrio", "seel", "dewgong", "grimer", "muk", "shellder",
"cloyster", "gastly", "haunter", "gengar", "onix", "drowzee", "hypno", "krabby", "kingler", "voltorb", "electrode",
"exeggcute", "exeggutor", "cubone", "marowak", "hitmonlee", "hitmonchan", "lickitung", "koffing", "weezing", "rhyhorn",
"rhydon", "chansey", "tangela", "kangaskhan", "horsea", "seadra", "goldeen", "seaking", "staryu", "starmie",
"scyther", "jynx", "electabuzz", "magmar", "pinsir", "tauros", "magikarp", "gyarados", "lapras", "ditto", "eevee",
"vaporeon", "jolteon", "flareon", "porygon", "omanyte", "omastar", "kabuto", "kabutops", "aerodactyl", "snorlax",
"articuno", "zapdos", "moltres", "dratini", "dragonair", "dragonite", "mewtwo", "mew"];

function getPokemon() {
  return pokedex[Math.floor(Math.random() * pokedex.length)] //returns random pokemon from pokedex list
}
//gets the sprite based on pokemon name from pokemonshowdown api
function getSprite(name: string) {
  return `https://play.pokemonshowdown.com/sprites/xyani/${name.toLowerCase()}.gif`;
}

let currentPoke = getPokemon()
let currentSprite = getSprite(currentPoke)

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
        if(userList.length == 0){
          return;
        }

        if(socket.id == userList[currTurn] && msg.text.toLowerCase() == currentPoke){
          let msg1 = {user: userMap[socket.id], text:" has correctly guessed " + currentPoke + "!"};
          io.emit('message', msg1);
          currTurn = (currTurn + 1) % userList.length; 
          msg1 = {user: "It is now " + userMap[userList[currTurn]] + "'s turn to guess!", text:""};
          io.emit('message', msg1);
          clearInterval(timerId); 

          //shuffle the pokemon and sprite and send to room.tsx (frontend)
          currentPoke = getPokemon();
          currentSprite = getSprite(currentPoke);
          io.emit('pokemon', { name: currentPoke, sprite: currentSprite });
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
        let registerMsg = {user: userMap[socket.id], text:" has joined the game!"};
        io.emit('message', registerMsg);
        if (userList.length === 1) {
          currTurn = 0;
        }

        console.log("Current turn " + userList[currTurn]);

        //emit for the client everytime they first join because they won't see what already connected players are seeing
        io.emit('pokemon', { name: currentPoke, sprite: currentSprite });
      });
      socket.on('newTimer', () =>{
        let count = 15;
        io.emit('setTimer',count);
        timerId = setInterval(() => { 
          count--;
          if(count == 0){
            clearInterval(timerId)
            let msg1 = {user: userMap[socket.id], text:" has failed to guess " + currentPoke + "!"};
            io.emit('message', msg1);
            currTurn = (currTurn + 1) % userList.length; 
            msg1 = {user: "It is now " + userMap[userList[currTurn]] + "'s turn to guess!", text:""};
            io.emit('message', msg1); 

            //shuffle the pokemon and sprite and send to room.tsx (frontend)
            currentPoke = getPokemon();
            currentSprite = getSprite(currentPoke);
            io.emit('pokemon', { name: currentPoke, sprite: currentSprite });
          }
          io.emit('setTimer',count);
        }
        , 1000);
      });
      socket.on('disconnect', () => {
        console.log('Client disconnected:', socket.id);
        let index = userList.indexOf(socket.id)
        let msg1 = {user: userMap[socket.id], text:" has disconnected "};
        io.emit('message', msg1);
        userList.splice(userList.indexOf(socket.id),1)
        userMap.delete(socket.id)
        if (userList.length === 0) {
          // Reset the game state when no players are left
          currTurn = 0;
          return;
        }
        const keysArray = Array.from(userMap.keys());
        console.log(keysArray); 
        if(currTurn > index)currTurn--  // 3 
        else if ( currTurn == index){
          currTurn = currTurn % userList.length
          msg1 = {user: "It is now " + userMap[userList[currTurn]] + "'s turn to guess!", text:""};
          io.emit('message', msg1); 
        }
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
