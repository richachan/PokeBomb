import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function UserPage() {
  const [username, setUsername] = useState('');
  const router = useRouter();
  const roomID = router.query.roomID as string || '';
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomID.trim()) return;
    router.push(`/room?username=${encodeURIComponent(username)}&roomID=${encodeURIComponent(roomID)}`);
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', marginTop: '20%'}}>
      <h1>Choose a name!</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Name"
          value={username}
          onChange={(e) => setUsername(e.target.value)}
          style={{ width: '100%', marginBottom: 10, borderRadius: 8, padding: 5,
            color: 'black', border: '1px solid #ccc',
          }}
        />
        <button type="submit" style={{ width: '100%' }}>Join Room</button>
      </form>
    <div>
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
    </div>
    </div>
  );
}