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

  const backHome = (e) =>
  {
    e.preventDefault();
    router.push(`/`);
  }

  return (
    <div style={{ height: '100vh', overflow: 'hidden', position: 'relative' }}>
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
        <button type="submit" style={{ width: '100%' }}>Join Game</button>
      </form>
    <div>
    <img src={"/pokebomb_logo.png"} 
    style =
    {{ 
      filter: 'saturate(50%)',
      opacity: '0.25',
      position: 'absolute', 
      bottom: '65px', 
      left: '15px', 
      maxWidth: '170px',
      height: 'auto', 
    }} 
    />
    </div>

    <div>
    <img src={"/homepage art.png"} 
    style =
    {{  
      filter: 'saturate(70%) blur(3px) brightness(80%)',
      position: 'absolute', 
      width: '100vw',
      height: 'auto',
      
      left: '0%',
      top: '0%',
      zIndex: -1,
    }} 
    />
    </div>

    {/*Header*/}
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '65px',
      backgroundColor: 'rgba(23, 23, 23, 0.95)',
      boxShadow: '0 2px 4px rgba(69, 69, 69, 0.5)',
      top: '0%',
      left: '0%',
      zIndex: -1,
    }}></div>
    {/*footer*/}
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '65px',
      backgroundColor: 'rgba(23, 23, 23, 0.95)',
      boxShadow: '0 -2px 4px rgba(69, 69, 69, 0.5)',
      bottom: '-2%',
      left: '0%',
      zIndex: -1,
    }}></div>

    <button
           onClick={backHome}
            style={{
            width: '100px',
            height: '32px',
            fontSize: '30px',
            color: 'grey',
            cursor: 'pointer',
            borderRadius: '7px',
            backgroundColor: 'rgba(255, 255, 255, 0)',
            backdropFilter: 'blur(1.5px)',
            top: '1.5%',
            left: '0.5%',
            position: 'absolute',
          }}
        >
          BACK
    </button>
    </div>
    <div
      style = {{
        bottom: '1%',
        right: '1%',
        position: 'absolute',
        fontSize: '25px',
        color: 'rgb(65, 65, 65)',
      }}
      >
        Created by Richard Chan and Jun Chao Wu
    </div> 
    </div>
  );
}

