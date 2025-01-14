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

  useEffect(() => {

    const username = query.username as string;
    setUser(username);

    // Ensure the server side is initialized
    fetch('/api/socket').catch((err) => console.error(err));

    // Connect the client socket if not already connected
    if (!socket) {
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

      socket.on('pokemon', ({ name, sprite ,guessed}: Pokemon) => {
        if(guessed)socket.emit('newTimer');
        setPokemon({ name, sprite ,guessed});
      });
    }

    // Cleanup on unmount
    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [router.query]);

  useEffect(() => 
    {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [messages]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !message.trim() || !user.trim()) return;

    const userMsg = { user: user, text: message }; // user + message in one constant
    socket.emit('message', userMsg);
    setMessage('');
  };

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

  return (
    <div style={{ margin: '40px auto', maxWidth: 600 }}>
      <h1>PokeBomb!</h1>

      {pokemon && (
      <div style={{ textAlign: 'center', marginBottom: 20 }}>
        <h2>Current Pokémon</h2>
        <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '150px', overflow: 'hidden'}}>
          <img src={pokemon.sprite} alt={pokemon.name} style={{ maxWidth: '150px', height: 'auto' }} />
        </div>
      </div>
      )}

      <div id = "timer" style={{display: 'flex', justifyContent: 'center',alignItems: 'center'}}>
          PLACEHOLDER
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

      <div style={{ border: '1px solid #ccc', padding: 10, height: 200, overflowY: 'auto'}}>
        {messages.map((userMsg, i) => (
          <div key={i}>{userMsg}</div>
        ))}
        <div ref={messagesEndRef} />
      </div>

      <form onSubmit={sendMessage} style={{ marginTop: 10 }}>
        <input
          style={{ width: '75%', marginRight: 10 }}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
          placeholder="Type a message..."
        />
        <button type="submit">Send</button>
      </form>
    </div>
  );  
}
