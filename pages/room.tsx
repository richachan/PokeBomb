import { useRouter } from 'next/router';
import React, { useDeferredValue, useEffect, useRef, useState, useMemo } from 'react';
import { io, Socket } from 'socket.io-client';
import '@fortawesome/fontawesome-free/css/all.min.css';
import MusicPlayer from './musicPlayer';

let socket: Socket | null = null;

type displayMessage = { user: string; text: string };
type Pokemon = { name: string; sprite: string; guessed: boolean };

export default function Home() {
  const router = useRouter();
  const { query } = router;
  const [messages, setMessages] = useState<string[]>([]);
  const [user, setUser] = useState<string>('');
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [selectedGenerations, setSelectedGenerations] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [userMap, setUserMap] = useState<{ [socketId: string]: string }>({});
  const [currTurn, setCurrTurn] = useState<number>(0);
  const [lives, setLives] = useState<{ [socketId: string]: number }>({});
  const [gameActive, setGameActive] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null); // Ref for the guessing input
  const chatInputRef = useRef<HTMLInputElement>(null); // Ref for the chat input

  // Handle real-time guessing input updates
  const handleGuessInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const newValue = e.target.value;
    if (socket) {
      socket.emit('logKey', newValue); // Emit the new value to other players
    }
  };

  // Handle guessing form submission
  const handleGuessSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !inputRef.current?.value.trim() || !user.trim()) return;

    const userMsg = { user: user, text: inputRef.current.value };
    socket.emit('message', userMsg);
    inputRef.current.value = ''; // Clear the input
  };

  // Handle chat form submission
  const handleChatSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !chatInputRef.current?.value.trim() || !user.trim()) return;

    const chatMsg = { user: user, text: chatInputRef.current.value };
    socket.emit('chat', chatMsg);
    chatInputRef.current.value = ''; // Clear the input
  };

  useEffect(() => {
    const username = query.username as string;
    setUser(username);

    fetch('/api/socket').catch((err) => console.error(err));

    if (!socket) {
      socket = io({ path: '/api/socket_io' });

      socket.on('connect', () => {
        console.log('Connected:', socket?.id);
        const msg = { user: username, text: " has connected" };
        socket?.emit('message', msg);
        socket?.emit('register', username);
      });

      socket.on('message', (msg: displayMessage) => {
        const strMsg = `${msg.user} ${msg.text}`;
        setMessages((prev) => [...prev, strMsg]);
      });

      socket.on('updateGlobalKey', (message) => {
        if (inputRef.current) {
          inputRef.current.value = message; // Update the input value without re-rendering
        }
      });

      socket.on('chat', (msg: displayMessage) => {
        const strMsg = `${msg.user}: ${msg.text}`;
        setMessages((prev) => [...prev, strMsg]);
      });

      socket.on('setTimer', (num) => {
        const timerElement = document.getElementById("timer");
        if (timerElement) {
          timerElement.innerHTML = num.toString();
        }
      });

      socket.on('players', (data: { userMap: { [id: string]: string }; currTurn: number; lives: { [id: string]: number } }) => {
        setUserMap(data.userMap);
        setCurrTurn(data.currTurn);
        setLives(data.lives);
      });

      socket.on('pokemon', ({ name, sprite, guessed }: Pokemon) => {
        if (guessed) socket?.emit('newTimer');
        setPokemon({ name, sprite, guessed });
      });

      socket.on('gameStatus', ({ gameActive }: { gameActive: boolean }) => {
        setGameActive(gameActive);
      });

      socket.on('updateGenerations', (gens: number[]) => {
        setSelectedGenerations(gens);
      });
    }

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [router.query]);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTo({
        top: messagesEndRef.current.scrollHeight,
        behavior: "smooth",
      });
    }
  }, [messages]);

  const toggleGeneration = (generation: number) => {
    let updatedGenerations: number[];

    if (selectedGenerations.includes(generation)) {
      updatedGenerations = selectedGenerations.filter((gen) => gen !== generation);
    } else {
      updatedGenerations = [...selectedGenerations, generation];
    }

    setSelectedGenerations(updatedGenerations);
    socket?.emit('updateGenerations', updatedGenerations);
  };

  const playerEntries = Object.entries(userMap);

  const startGame = () => {
    socket?.emit('gameStarted');
  };

  return (
    <div className="bg-pokemon bg-cover bg-center text-white min-h-[100vh]" style={{ backgroundImage: "url('/eevee.jpg')", backgroundPosition: "50% 85%", backgroundRepeat: "no-repeat", backgroundSize: "100%", overflow: 'hidden', boxShadow: 'inset 0 0 1000px 205px rgba(0, 0, 0, 0.80)' }}>
      {/* Header */}
      <div style={{ position: "relative", transform: "scale(1)", maxWidth: "100%", height: "69px", padding: "10px", backgroundColor: "rgba(32, 32, 37, 0)", backdropFilter: 'blur(1.5px)' }}></div>

      {/* Music Player */}
      <MusicPlayer />

      {/* Main Content */}
      <div style={{ margin: '80px auto', maxWidth: 800 }}>
        <div style={{ display: 'flex', justifyContent: 'left', alignItems: 'left', height: '10px', overflow: 'hidden' }}></div>
        <img src={"/pokebomb_logo.png"} style={{ filter: 'saturate(60%)', position: 'absolute', top: '20px', left: '15px', maxWidth: '165px', height: 'auto' }} />

        {/* Current Pokémon */}
        {pokemon && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '20px', marginTop: '-30px', position: 'relative', zIndex: 1 }}>
            <img src="/current_pokemon.png" style={{ width: '15vw', marginBottom: '-105px', filter: 'saturate(70%)' }} alt="Current Pokémon Title" />
          </div>
        )}
        {pokemon && (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '270px', pointerEvents: 'none', overflow: 'hidden', position: 'relative', zIndex: 2 }}>
            <img src={pokemon.sprite} alt={pokemon.name} style={{ width: 'auto', height: 'auto' }} />
          </div>
        )}

        {/* Start Game Button */}
        <div id="startButton" style={{ display: 'flex', justifyContent: 'center', position: 'fixed', top: '415px', left: '50%', transform: 'translate(-50%, 0)' }}>
          {playerEntries.length < 2 ? (
            <p style={{ color: 'white', fontSize: '16px', marginTop: '10px', marginBottom: '160px' }}>Need 2 or more players to start!</p>
          ) : (
            <button onClick={startGame} disabled={gameActive} style={{ padding: '6px 15px', fontSize: '15px', color: 'white', cursor: 'pointer', borderRadius: '8px', backgroundColor: 'rgb(255, 255, 255, 0.3)', marginTop: '20px', marginBottom: '140px', visibility: gameActive ? 'hidden' : 'visible' }}>Start Game</button>
          )}
        </div>

        {/* Timer */}
        <div id="timer" style={{ fontWeight: 'bold', marginTop: '-55px', display: 'flex', justifyContent: 'center', alignItems: 'center' }}>Waiting for game start</div>

        {/* Generation Checkboxes */}
        <div style={{ display: 'flex', position: 'absolute', bottom: '10px', left: '10px', visibility: gameActive ? 'hidden' : 'visible' }}>
          {Array.from({ length: 9 }, (_, i) => i + 1).map((gen) => (
            <label key={gen} style={{ margin: '0 10px', textAlign: 'center' }}>
              <input type="checkbox" checked={selectedGenerations.includes(gen)} onChange={() => toggleGeneration(gen)} style={{ marginRight: 5, border: 'none' }} />
              Gen {gen}
            </label>
          ))}
        </div>

        {/* Chat Box */}
        <div style={{ position: 'absolute', right: 20, height: '220px', bottom: 20, width: '25%', minWidth: '420px', maxWidth: '420px', fontSize: '14px', borderRadius: '8px', display: 'flex', flexDirection: 'column', backgroundColor: 'rgba(42, 42, 42, 0.4)', backdropFilter: 'blur(1.5px)' }}>
          {/* Chat History */}
          <div style={{ flex: 1, padding: 10, overflowY: 'auto', height: '200px', color: '#f9e2c2', fontWeight: 'bold' }} ref={messagesEndRef}>
            {messages.map((userMsg, i) => (
              <div key={i}>{userMsg}</div>
            ))}
          </div>

          {/* Chat Input */}
          <form onSubmit={handleChatSubmit} style={{ height: '40px', borderTop: '1px solid #ccc', padding: '5px' }}>
            <input ref={chatInputRef} style={{ flex: 1, padding: '2px', marginLeft: '1px', marginRight: '5px', border: 'none', borderRadius: '5px', outline: 'none', color: 'grey', width: '100%', backgroundColor: 'rgba(42, 42, 42, 0.4)' }} placeholder=" Type your message " />
          </form>
        </div>

        {/* Guessing Box */}
        <form onSubmit={handleGuessSubmit} style={{ height: '40px', padding: '5px', display: 'flex', justifyContent: 'center', alignContent: 'center', fontWeight: 'bold', border: 'none' }}>
          <input ref={inputRef} style={{ flex: 1, fontWeight: 'bold', padding: '8px', marginRight: '5px', justifyContent: 'center', alignContent: 'center', borderRadius: '8px', border: 'none', outline: 'none', color: 'black', width: '50%', maxWidth: '250px', textAlign: 'center', backgroundColor: 'rgba(255, 255, 255, 1)' }} onChange={handleGuessInputChange} placeholder=" Guess the Pokémon " />
        </form>

        {/* Players List */}
        <div style={{ display: 'flex', flexDirection: 'column', position: 'absolute', left: '20%', top: '35%', border: 'none', fontSize: '20px' }}>
          <h2>Players:</h2>
          {playerEntries.length === 0 && <p>It's quiet in here</p>}
          {playerEntries.map(([socketId, username], index) => (
            <div key={socketId} style={{ margin: '4px 0' }}>
              {username}  {lives[socketId]}
              {index === currTurn && <strong style={{ color: '#f9e2c2', marginLeft: 8 }}>🡄</strong>}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}