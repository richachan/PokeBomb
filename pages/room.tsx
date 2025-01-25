import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';


let socket: Socket | null = null;

type displayMessage = { user: string; text: string };
type Pokemon = { name: string; sprite: string ;guessed:boolean};

export default function Home() {
  const router = useRouter();
  const { query } = router;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [user, setUser] = useState<string>('');
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [selectedGenerations, setSelectedGenerations] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for the bottom of the chatbox
  const [userMap, setUserMap] = useState<{ [socketId: string]: string }>({});
  const [currTurn, setCurrTurn] = useState<number>(0);
  const [lives, setLives] = useState<{ [socketId: string]: number }>({});
  const [gameActive, setGameActive] = useState(false)


  useEffect(() => {

    const username = query.username as string;
    setUser(username);

    // Ensure the server side is initialized
    fetch('/api/socket').catch((err) => console.error(err));

    // Connect the client socket if not already connected
    if (!socket) 
    {
      socket = io({ path: '/api/socket_io' });

      socket.on('connect', () => {
        console.log('Connected:', socket?.id);
        const msg = {user: username, text:" has connected"};
        socket.emit('message', msg)
        socket.emit('register',username)
      });

      socket.on('message', (msg: displayMessage) => {
        const strMsg = `${msg.user} ${msg.text}`;
        setMessages((prev) => [...prev, strMsg]);
      });

      socket.on('setTimer', (num) => {
        document.getElementById("timer").innerHTML = num.toString();
      });

      socket.on('players', (data: { userMap: { [id: string]: string }; currTurn: number; lives: { [id: string]: number }}) => {
        setUserMap(data.userMap);
        setCurrTurn(data.currTurn);
        setLives(data.lives);
      });

      socket.on('pokemon', ({ name, sprite ,guessed}: Pokemon) => 
      {
        if(guessed)socket.emit('newTimer');
        setPokemon({ name, sprite ,guessed});
      });
    }

    // Cleanup on unmount
    return () => 
    {
      socket?.disconnect();
      socket = null;
    };
  }, [router.query]);

  useEffect(() => 
  {
    if (socket) {
      socket.on('updateGenerations', (gens: number[]) => {
        setSelectedGenerations(gens); // Update local state when the server broadcasts generations
      });
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTo({
        top: messagesEndRef.current.scrollHeight,
        behavior: "smooth", // Smooth scrolling
      });
    }
  }, [messages]);
  const sendMessage = (e: React.FormEvent) => 
  {
    e.preventDefault();
    if (!socket || !message.trim() || !user.trim()) return;

    const userMsg = { user: user, text: message }; // user + message in one constant
    socket.emit('message', userMsg);
    setMessage('');
  };

  useEffect(() => 
  {
    socket.on('gameStatus', ({ gameActive }: { gameActive: boolean }) => 
    {
      setGameActive(gameActive);
    });
  }, []);

  const toggleGeneration = (generation: number) =>
  {
    let updatedGenerations: number[]

    if (selectedGenerations.includes(generation)) 
    {
      updatedGenerations = selectedGenerations.filter((gen) => gen !== generation);
    }
    else 
    {
      updatedGenerations = [...selectedGenerations, generation];
    }

    setSelectedGenerations(updatedGenerations);
    socket?.emit('updateGenerations', updatedGenerations);
  }

  //for current players and turns
  const playerEntries = Object.entries(userMap);

  const startGame = () =>
  {
    socket.emit('gameStarted')
  };

  return (
    <div
      className="bg-pokemon bg-cover bg-center text-white min-h-[100vh]"
      style={{
        backgroundImage: "url('/eevee.jpg')", 
        backgroundPosition: "50% 80%",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100%"
        
      }}
      
    >
      
    <div style={{ margin: '0px auto', maxWidth: 800 }}>
      <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'left', height: '70px', overflow: 'hidden'}}></div>
        <img src={"/pokebomb_logo.png"} style={{ position: 'absolute', top: '20px', left: '20px', maxWidth: '150px', height: 'auto', }} />
        {pokemon && (
  <div
    style={{
      display: 'flex',
      flexDirection: 'column',  // Column to stack "Current Pokémon" text above sprite
      alignItems: 'center',     // Center horizontally
      justifyContent: 'center',
      height: '150px',
      marginTop: '-40px',
      overflow: 'hidden',
      position: 'relative',
      zIndex: 1
    }}
  >
    {/* "Current Pokémon" text image on top */}
    <img
      src="/current_pokemon.png"
      style={{ width: '240px', height: '50px', marginBottom: '0px' }}
      alt="Current Pokémon Title"
    />
  </div>
)}
  {pokemon && (
  <div
      style={{
        display: 'flex',
        alignItems: 'center',     // Center horizontally
        justifyContent: 'center',
        height: '165px',
        marginTop: '-50px',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 2
      }}
    >
      {/* Actual Pokémon sprite below */}
      <img
        src={pokemon.sprite}
        alt={pokemon.name}
        style={{width: 'auto', height: 'auto'}}
      />
    </div>
  )}



  <div id = "startButton" style={{ display: 'flex', justifyContent: 'center', marginTop: -15 }}>
    <button 
      onClick = {startGame}
      disabled = {gameActive}
      style = 
      {{ 
        padding: '6px 15px', 
        fontSize: '17px', 
        color: 'black',
        cursor: 'pointer', 
        border: '4px solid #000', 
        borderRadius: '25px',      
        background: 'linear-gradient(to bottom, #e25031 50%, #fff 50%)',
        marginTop: '20px',
        marginBottom: '20px',
        fontWeight: 'bold',
        visibility: gameActive ? 'hidden' : 'visible', 
        }}>
        Start Game
    </button>
  </div>

    <div id = "timer" style={{display: 'flex', justifyContent: 'center',alignItems: 'center'}}>
      Waiting for game to start...
    </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10, marginBottom: 20 }}>
      {Array.from({ length: 9 }, (_, i) => i + 1).map((gen) => (
        <label key={gen} style={{ margin: '0 10px', textAlign: 'center' }}>
          <input
            type="checkbox"
            checked={selectedGenerations.includes(gen)}
            onChange={() => toggleGeneration(gen)}
            style={{ marginRight: 5 }}
          />
          Gen {gen}
        </label>
      ))}
      </div>

      <div style={{ border: '1px solid #ccc', padding: 10, height: 200, overflowY: 'auto'}} ref={messagesEndRef}>
        {messages.map((userMsg, i) => (
          <div key={i}>{userMsg}</div>
        ))}
        
      </div>

      <form onSubmit={sendMessage} style={{ marginTop: 10 }}>
        <input
          style={{ width: '93%', marginRight: 10 }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
      <hr />
      <h2>Playing:</h2>
      {playerEntries.length === 0 && <p>It's quiet in here</p>}
      {playerEntries.map(([socketId, username], index) => (
        <div key={socketId} style={{ margin: '4px 0' }}>
          {username} {lives[socketId]}
          {index === currTurn && <strong style={{ color: 'red', marginLeft: 8 }}>← Current turn</strong>}
        </div>
      ))}
    </div>
    </div>
  );  
}
