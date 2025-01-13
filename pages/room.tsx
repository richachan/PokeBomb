import { useRouter } from 'next/router';
import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

let socket: Socket | null = null;

type displayMessage = { user: string; text: string };
type Pokemon = { name: string; sprite: string };

export default function Home() {
  const router = useRouter();
  const { query } = router;
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [user, setUser] = useState<string>('');
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);

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
        const strMsg = `${msg.user}: ${msg.text}`;
        setMessages((prev) => [...prev, strMsg]);
      });
    

      socket.on('pokemon', ({ name, sprite }: Pokemon) => {
        setPokemon({ name, sprite });
      });
    }

    // Cleanup on unmount
    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [router.query]);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !message.trim() || !user.trim()) return;

    const userMsg = { user: user, text: message }; // user + message in one constant
    socket.emit('message', userMsg);
    setMessage('');
  };

  return (
    <div style={{ margin: '40px auto', maxWidth: 600 }}>
      <h1>PokeBomb!</h1>

  
      {pokemon && (
        <div style={{ textAlign: 'center', marginBottom: 20 }}>
          <h2>Current Pokémon</h2>
          <img src={pokemon.sprite} alt={pokemon.name} />
        </div>
      )}

      <div style={{ border: '1px solid #ccc', padding: 10, minHeight: 200 }}>
        {messages.map((userMsg, i) => (
          <div key={i}>{userMsg}</div>
        ))}
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
