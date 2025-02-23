import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function UserPage() {
  const [roomID, setRoomID] = useState('');
  const router = useRouter();
  const username = router.query.username as string || '';

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomID.trim()) return;
    router.push(`/room?username=${encodeURIComponent(username)}?ID=${encodeURIComponent(roomID)}`);
  };

  return (
    <div style={{ maxWidth: 400, margin: '50px auto', marginTop: '20%'}}>
      <h1>Enter room ID!</h1>
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Choose a name"
          value={roomID}
          onChange={(e) => setRoomID(e.target.value)}
          style={{ width: '100%', marginBottom: 10, borderRadius: 8, padding: 5,
            color: 'black', border: '1px solid #ccc',
          }}
        />
        <button type="submit" style={{ width: '100%' }}>Join Game</button>
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