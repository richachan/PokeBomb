import { useRouter } from 'next/router';
import React, { useDeferredValue, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import '@fortawesome/fontawesome-free/css/all.min.css';
import MusicPlayer from './musicPlayer';
import next from 'next';

let socket: Socket | null = null;

type displayMessage = { user: string; text: string };
type Pokemon = { name: string; sprite: string ;guessed:boolean};

export default function Home() 
{
  const router = useRouter();
  const { query } = router;
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [user, setUser] = useState<string>('');
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [selectedGenerations, setSelectedGenerations] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for the bottom of the chatbox
  const [userMap, setUserMap] = useState<{ [socketId: string]: string }>({});
  const [currTurn, setCurrTurn] = useState<number>(0);
  const [lives, setLives] = useState<{ [socketId: string]: number }>({});
  const [gameActive, setGameActive] = useState(false);
  const deferredMessage = useDeferredValue(message);
  
  useEffect(() => {
    setMessage(''); 
  }, [currTurn]); 

  useEffect(() => 
  {
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

      socket.on('updateGlobalKey',(message)=>{
        if (socket && socket.id !== Object.keys(userMap)[currTurn]) {
        setMessage(message); }
      });

      socket.on('chat', (msg: displayMessage) => {
        const strMsg = `${msg.user}: ${msg.text}`;
        setMessages((prev) => [...prev, strMsg]);
      });


      socket.on('setTimer', (num) => {
        document.getElementById("timer").innerHTML = num.toString();
      });

      socket.on('players', (data: { userMap: { [id: string]: string }; currTurn: number; lives: { [id: string]: number }}) => {
        setUserMap(data.userMap);
        setCurrTurn(data.currTurn);
        setLives(data.lives);
        socket?.emit('updateGlobalKey', ''); //clear the global key on player update
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

  const sendChat = (e: React.FormEvent) =>
  {
    e.preventDefault();
    if (!socket || !chat.trim() || !user.trim()) return;

    const chatMsg = { user: user, text: chat }; // user + message in one constant
    socket.emit('chat', chatMsg);
    setChat('');
  }

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
    socket.emit('updateGlobalKey', ''); //clear the global key on game start
  };

  const handleInputChange = (e) => 
  {
    if (socket && socket.id == Object.keys(userMap)[currTurn]) {
      const newValue = e.target.value;
      setMessage(newValue);
      socket?.emit('logKey', newValue);
    }
  }

  return (

    <div
      className="bg-pokemon bg-cover bg-center text-white min-h-[100vh]"
      style={{
        backgroundImage: "url('/eevee.jpg')", 
        backgroundPosition: "50% 85%",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100%",
        overflow: 'hidden',
        boxShadow: 'inset 0 0 1000px 205px rgba(0, 0, 0, 0.80)'
        
      }}
      
    >

    {/* Header */}

    <div
      style = 
      {{
        position: "relative",
        transform: "scale(1)", // Keep the header scaling as you intended
        maxWidth: "100%", // Ensure it doesn’t go offscreen
        height: "69px",
        padding: "10px",
        backgroundColor: "rgba(32, 32, 37, 0)", // Your original `hsl(248, 13%, 82%, 0.25)` in RGBA
        backdropFilter: 'blur(1.5px)',
      }}
    >
    </div>

    {/*Music Player */}
    <MusicPlayer/>

    <div 
      style = 
      {{ 
        margin: '80px auto', 
        maxWidth: 800 
      }}>
      <div 
        style = 
        {{ 
          display: 'flex', 
          justifyContent: 'left', 
          alignItems: 'left', 
          height: '10px', 
          overflow: 'hidden'
        }}>
      </div>
        <img src={"/pokebomb_logo.png"} 
        style =
        {{ 
          filter: 'saturate(60%)',
          position: 'absolute', 
          top: '20px', 
          left: '15px', 
          maxWidth: '165px',
          height: 'auto', 
        }} 
    />
    {pokemon && (
    <div
    style={{
      display: 'flex',
      flexDirection: 'column',  // Column to stack "Current Pokémon" text above sprite
      alignItems: 'center',     // Center horizontally
      justifyContent: 'center',
      height: '20px',
      marginTop: '-30px',
      
      position: 'relative',
      zIndex: 1
    }}
  >
    {/* "Current Pokémon" text image on top */}
    <img
      src="/current_pokemon.png"
      style={{ 
        width: '15vw', 
        marginBottom: '-105px' ,
        filter: 'saturate(70%)',
      }}
      alt="Current Pokémon Title"
    />
  </div>
)}
  {pokemon && (
  <div
      style = 
      {{
        display: 'flex',
        alignItems: 'center',   
        justifyContent: 'center',
        height: '270px',
        pointerEvents: 'none',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 2
      }}
    >
      {/* Actual Pokémon sprite below */}
      <img
        src = {pokemon.sprite}
        alt = {pokemon.name}
        style = 
        {{
          width: 'auto', 
          height: 'auto'
        }}
      />
    </div>
  )}

  <div 
    id = "startButton" 
    style = 
    {{ 
      display: 'flex', 
      justifyContent: 'center',
      position: 'fixed',
      top: '415px',
      left: '50%', 
      transform: 'translate(-50%, 0)',
    
    }}>
    {(playerEntries.length < 2) ? (
  <p style={{
    color: 'white', 
    fontSize: '16px', 
    
    
    marginTop: '10px',
    marginBottom: '160px',
    
  }}>
    Need 2 or more players to start!
  </p>
) : (
  <button 
    onClick={startGame}
    disabled={gameActive}
    style={{ 
      padding: '6px 15px', 
      fontSize: '15px', 
      color: 'white',
      cursor: 'pointer', 
      borderRadius: '8px',      
      
      backgroundColor: 'rgb(255, 255, 255, 0.3)',
      marginTop: '20px',
      marginBottom: '140px',
      visibility: gameActive ? 'hidden' : 'visible', 
    }}>
    Start Game
  </button>
)}

  </div>

    
    <div id = "timer" style={{fontWeight: 'bold', marginTop: '-55px', display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      Waiting for game start
    </div>

      <div style={{ 
        display: 'flex', 
        position: 'absolute', 
        bottom: '10px', 
        left: '10px',
        visibility: gameActive ? 'hidden' : 'visible'
        }}>
      {Array.from({ length: 9 }, (_, i) => i + 1).map((gen) => (
        <label 
          key = {gen} 
          style = 
          {{ 
            margin: '0 10px', 
            textAlign: 'center' 
          }}>
          <input
            type="checkbox"
            checked={selectedGenerations.includes(gen)}
            onChange={() => toggleGeneration(gen)}
            style={{ marginRight: 5, border: 'none' }}
          />
          Gen {gen}
        </label>
      ))}
      </div>

  <div 
  style =
  {{
    position: 'absolute',
    right: 20,
    height: '220px',
    bottom: 20,  // Ensure it stays near the bottom
    width: '25%',  // Adjust to fit well on zoom
    minWidth: '420px', // Prevent it from getting too small
    maxWidth: '420px', // Prevent excessive growth
    fontSize: '14px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(42, 42, 42, 0.4)',
    backdropFilter: 'blur(1.5px)'
  }}
>
  {/* Chat History */}
  <div 
    style={{ 
      flex: 1,  // Makes the chat history take up available space
      padding: 10,
      overflowY: 'auto',
      height: '200px', // Prevents excessive growth
      color: '#f9e2c2',
      fontWeight: 'bold',
    }} 
    ref={messagesEndRef}
  >
    {messages.map((userMsg, i) => (
      <div key={i}>{userMsg}</div>
    ))}
  </div>

  {/* Chat Input */}
  <form 
    onSubmit={sendChat} 
    style={{ 
      height: '40px',
      borderTop: '1px solid #ccc',
      padding: '5px'
    }}
  >
    <input
      style = 
      {{ 
        flex: 1, 
        padding: '2px',
        marginLeft: '1px',
        marginRight: '5px',
        border: 'none',
        borderRadius: '5px',
        outline: 'none',
        color: 'grey',
        width: '100%',
        backgroundColor: 'rgba(42, 42, 42, 0.4)',
      }}
      value = {chat}
      onChange={(p) => setChat(p.target.value)}
      placeholder=" Type your message "
    />
  </form>
</div>
     
    
    { /*guessing box*/ }
    <form 
      onSubmit = {sendMessage} 
      style = 
      {{ 
        height: '40px',
        padding: '5px',
        display: 'flex',
        justifyContent: 'center', 
        alignContent: 'center',
        fontWeight: 'bold',
        border: 'none',
      }}
     
  >
      <input
      style = 
      {{ 
        flex: 1, 
        fontWeight: 'bold',
        padding: '8px',
        marginRight: '5px',
        justifyContent: 'center',
        alignContent: 'center',
        borderRadius: '8px',
        border: 'none',
        outline: 'none',
        color: 'black',
        width: '50%',
        maxWidth: '250px',
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 1)',
      }}
      value = {deferredMessage}
      onKeyUp = {handleInputChange}
      placeholder=" Guess the Pokémon "   
      
    />
  </form>

  <div style = 
      {{
        display: 'flex', 
        
        flexDirection: 'column',
        position: 'absolute',
        left: '20%',
        top: '30%',
        border: 'none',
        fontSize: '20px',
        }}>
        
        <h2>Players:</h2>
{playerEntries.length === 0 && <p>It's quiet in here</p>}
<div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
  {playerEntries.map(([socketId, username], index) => (
    <div 
      key={socketId} 
      style={{ 
        padding: '7px 13px',
        backgroundColor: index === currTurn ? 'rgba(249, 226, 194, 0.1)' : 'rgba(255, 255, 255, 0.1)',
        color: 'white',
        borderRadius: '8px',
        border: '1px solid rgba(255, 255, 255, 0.2)',
        textAlign: 'center',
        fontWeight: 'bold',
        boxShadow: index === currTurn ? '0 0 10px 4px rgba(249, 226, 194, 0.8)' : 'none',
        transition: 'box-shadow 0.3s ease-in-out',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '200px',
      }}
    >
      <span>{username}</span>
      <span style={{ fontSize: '14px', opacity: 0.8}}> {lives[socketId]}</span>
    </div>
    ))}
    </div>
    </div>
    </div>
    </div>
  );  

}