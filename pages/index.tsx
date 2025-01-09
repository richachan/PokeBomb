import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function UserPage() {
  const [username, setUsername] = useState('');
  const router = useRouter();

  function uniqueCode() { //Generates a unqique 4-digit code between 1000 and 9999
    return Math.floor(1000 + Math.random() * 9000).toString();
  }
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;

    const uniqueID = uniqueCode();
    router.push(`/room?username=${encodeURIComponent(username)}&id=${uniqueID}`);
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto' }}>
      <h1>Enter a Username</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Your name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: '100%', marginBottom: 10 }}
        />
        <button type="submit" style={{ width: '100%' }}>Join Chat</button>
      </form>
    </div>
  );
}
