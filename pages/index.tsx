// pages/index.tsx

import React, { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface ChatMessage
{
  userId: string;
  text: string;
}

let socket: Socket | null = null;

export default function Home() {
  const [message, setMessage] = useState('');
  const [messages, setMessages] = useState<string[]>([]);

  useEffect(() => {
    // Ensure the server side is initialized
    fetch('/api/socket').catch((err) => console.error(err));

    // Connect the client socket if not already connected
    if (!socket) {
      socket = io({ path: '/api/socket_io' });

      socket.on('connect', () => {
        console.log('Connected:', socket?.id);
      });

      socket.on('message', (msg: string) => {
        setMessages((prev) => [...prev, msg]);
      });
    }

    // Cleanup on unmount
    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, []);

  const sendMessage = (e: React.FormEvent) => {
    e.preventDefault();
    if (!socket || !message.trim()) return;
    socket.emit('message', message);
    setMessage('');
  };

  return (
    <div style={{ margin: '40px auto', maxWidth: 600 }}>
      <h1>Next.js + Socket.IO Chat</h1>
      <div style={{ border: '1px solid #ccc', padding: 10, minHeight: 200 }}>
        {messages.map((msg, i) => (
          <div key={i}>{msg}</div>
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
