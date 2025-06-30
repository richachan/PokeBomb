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
    <div style={{width: 250, top: '58%', position: 'absolute', left: '50%', transform: 'translate(-50%, -50%)'}}>
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
        <button type="submit" style={{ width: '100%', color: 'white' }}>Join Game</button>
      </form>
      <div style={{
      position: 'absolute',
      left: '-36%',
      top: '-210%',
      fontSize: '40px',
      width: '500px',
      transform: 'translateY(-10px)',
    }}>
      
    <h1>Welcome to 
      <span style= {{color: 'rgb(50, 38, 80)'}}> PokéBomb!</span>
    </h1>
    </div>
    <div style={{
      position: 'absolute',
      left: '-44%',
      top: '-120%',
      fontSize: '22px',
      width: '470px',
      alignItems: 'center',
      justifyContent: 'center',
      textAlign: 'center',
      transform: 'translateY(-10px)',
    }}>
      
    <h1>Compete with your friends and challenge your Pokémon knowledge!</h1>
    
    </div>
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
    <img src={"/lunalaCosmog.png"} 
    style =
    {{  
      filter: 'saturate(70%) blur(4px) brightness(80%)',
      position: 'absolute', 
      width: '100vw',
      height: 'auto',
      
      left: '0%',
      top: '-16%',
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
      zIndex: 1,
    }}>
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
            top: '15%',
            left: '0.5%',
            position: 'absolute',
            zIndex: 1000,
          }}
        >
          BACK
    </button>
    </div>
    {/*footer*/}
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '55px',
      backgroundColor: 'rgba(23, 23, 23, 0.95)',
      boxShadow: '0 -2px 4px rgba(69, 69, 69, 0.5)',
      bottom: '0%',
      left: '0%',
      zIndex: -1,

    }}>
      <div
      style = 
      {{
        bottom: '15%',
        right: '10px',
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

