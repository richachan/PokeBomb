import React, { useState } from 'react';
import { useRouter } from 'next/router';

export default function UserPage() {
  const [roomID, setRoomID] = useState('');
  
  const router = useRouter();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomID.trim()) return;
    router.push(`/game?roomID=${encodeURIComponent(roomID)}`);
  };

  return (
    <div style={{ 
      height: '100vh', overflow: 'hidden', position: 'relative' 
      }}>
    <div style={{ 
      width: 250, top: '53%', position: 'absolute', left: '50%', transform: 'translate(-50%, -50%)',
      }}>
      
      <form onSubmit={handleSubmit}>
        <input
          type="text"
          placeholder="Enter room code"
          value={roomID}
          onChange={(e) => setRoomID(e.target.value)}
          style={{ width: '100%', marginBottom: 10, borderRadius: 8, padding: 5,
            color: 'black', border: '1px solid #ccc',
          }}
        />
        <button type="submit" style={{ width: '100%', color: 'white' }}>Enter Room</button>
      </form>
    </div>
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
    <img src={"/spin.gif"} 
    style =
    {{ 
      filter: 'saturate(50%)',
      opacity: '0.25',
      position: 'absolute', 
      top: '-7px', 
      right: '25px', 
      maxWidth: '130px',
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
      bottom: '-270px',
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
      
    }}><div
    style={{
    width: '1000px',
    height: '32px',
    fontSize: '30px',
    color: 'grey',
    top: '15%',
    left: '1%',
    position: 'absolute',
    }}
    >
    HOME
  </div>
  </div>
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

    }}>
      <div
      style = 
      {{
        marginBottom: '3px',
        bottom: '30%',
        right: '1%',
        position: 'absolute',
        fontSize: '25px',
        color: 'rgb(65, 65, 65)',
      }}
      >
        Created by richachan and junchaoo
    </div>
    </div>
    </div>
    
    
    
  
 

  );
}