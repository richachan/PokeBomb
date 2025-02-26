import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/router';





export default function UserPage() {
  const [roomID, setRoomID] = useState('');
  //Welcome to PokeBomb!
  const [welcome, setWelcome] = useState(false);
  //Compete with your friends and challenge your Pokémon knowledge!
  const [instruction, setInstruction] = useState(false);

  const router = useRouter();
  
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!roomID.trim()) return;
    router.push(`/game?roomID=${encodeURIComponent(roomID)}`);
  };

  useEffect(() => {
    // Fade in the welcome text immediately on mount
    setWelcome(true);
    // Fade in the instruction text after a short delay (e.g., 800ms)
    const timeout = setTimeout(() => {
      setInstruction(true);
    }, 550);
    return () => clearTimeout(timeout);
  }, []);
  
  return (
    <div style={{ 
      height: '100vh', overflow: 'hidden', position: 'relative' 
      }}>
    <div style={{ 
      width: 250, top: '58%', position: 'absolute', left: '50%', transform: 'translate(-50%, -50%)',
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
    <div style={{
      position: 'absolute',
      left: '-36%',
      top: '-210%',
      fontSize: '40px',
      width: '500px',
      opacity: welcome ? 1 : 0,
      transition: 'opacity 1.6s ease, transform 1.2s ease',
      transform: welcome ? 'translateY(-10px)' : 'translateY(0)',
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
      opacity: instruction ? 1 : 0,
      transition: 'opacity 1.6s ease, transform 1.2s ease',
      transform: instruction ? 'translateY(-10px)' : 'translateY(0)',
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
    <img src={"/pikachuSpin.gif"} 
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