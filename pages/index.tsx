import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function UserPage() {
  const [username, setUsername] = useState('');
  const router = useRouter();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!username.trim()) return;
    router.push(`/room?username=${encodeURIComponent(username)}`);
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', marginTop: '20%'}}>
      <h1>Welcome to PokéBomb!</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Choose a name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: '100%', marginBottom: 10, borderRadius: 8, padding: 5,
            color: 'black', border: '1px solid #ccc',
          }}
        />
        <button type="submit" style={{ width: '100%' }}>Join Game</button>
      </form>
    </div>
  );
}