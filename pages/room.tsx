import { useRouter } from 'next/router';
import React, { useDeferredValue, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import '@fortawesome/fontawesome-free/css/all.min.css';
import MusicPlayer from './musicPlayer';
import next from 'next';
import { clear } from 'console';
import dynamic from 'next/dynamic';
import { trackSynchronousPlatformIOAccessInDev } from 'next/dist/server/app-render/dynamic-rendering';

let socket: Socket | null = null;

type displayMessage = { user: string; text: string };
type Pokemon = { name: string; sprite: string ;guessed:boolean};

export default function Home() 
{
  const router = useRouter();
  const { query } = router;
  const [message, setMessage] = useState('');
  const [chat, setChat] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [user, setUser] = useState<string>('');
  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [selectedGenerations, setSelectedGenerations] = useState<number[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null); // Ref for the bottom of the chatbox
  const [userMap, setUserMap] = useState<{ [socketId: string]: string }>({});
  const [currTurn, setCurrTurn] = useState<number>(0);
  const [lives, setLives] = useState<{ [socketId: string]: number }>({});
  const [gameActive, setGameActive] = useState(false);
  const [countdown, setCountdown] = useState<number | null>(null);
  const deferredMessage = useDeferredValue(message);
  const [fade, setFade] = useState<boolean>(false);
  const [blur, setBlur] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [newSprite, setNewSprite] = useState<boolean>(false);
  const canvasRef = useRef<HTMLCanvasElement>(null);

  
  useEffect(() => {
    if (socket) {
      
      //listen for countdown updates from the socket.ts
      socket.on('countdownUpdate', (time) => {
        setCountdown(time);
        if (time != 4) {
          setVisible(true);
        }
        else {
          setVisible(false);
        }
        setTimeout(() => setFade(true), 0);
        setTimeout(() => setFade(false), 500); 
      });
      
      //start game as soon as countdown ends
      socket.on('countdownEnd', () => {
        setCountdown(null);
        setFade(false);
        socket.emit('gameStarted');
        setMessage('');
      });
    }
  
    return () => {
      socket?.off('countdownUpdate');
      socket?.off('countdownEnd');
    };
  }, [socket]);

  useEffect(() => {
    if (socket?.id === Object.keys(userMap)[currTurn]) {
      setMessage(''); //clear input only if it's the new turn for this player
    }
  }, [currTurn]);

  useEffect(() => 
  {
    const username = query.username as string;
    setUser(username);

    //ensure the server side is initialized
    fetch('/api/socket').catch((err) => console.error(err));

    //connect the client socket if not already connected
    if (!socket) 
    {
      socket = io({ path: '/api/socket_io' });

      socket.on('gameStatus', ({ gameActive }) => {
        console.log('[client] got gameStatus:', gameActive);
        setGameActive(gameActive);
      });
      
      socket.on('connect', () => {
        console.log('Connected:', socket?.id);
        const msg = {user: username, text:" has connected"};
        socket.emit('message', msg)
        socket.emit('register', username)
        
      });

      socket.on('message', (msg: displayMessage) => {
        const strMsg = `${msg.user} ${msg.text}`;
        setMessages((prev) => [...prev, strMsg]);
      });

      socket.on('updateGlobalKey',(message)=>{
        if (socket && socket.id !== Object.keys(userMap)[currTurn]) {
        setMessage(message); }
      });

      socket.on('chat', (msg: displayMessage) => {
        const strMsg = `${msg.user}: ${msg.text}`;
        setMessages((prev) => [...prev, strMsg]);
      });


      socket.on('setTimer', (num) => {
        document.getElementById("timer").innerHTML = num.toString();
      });

      socket.on('players', (data: { userMap: { [id: string]: string }; currTurn: number; lives: { [id: string]: number }}) => {
        setUserMap(data.userMap);
        setCurrTurn(data.currTurn);
        setLives(data.lives);
        setMessage('');
      });

      socket.on('pokemon', ({ name, sprite, guessed}: Pokemon) => 
      {
        if(guessed)socket.emit('newTimer');

        setPokemon({ name, sprite, guessed });
      });
    }

    //cleanup on unmount
    return () => 
    {
      socket?.disconnect();
      socket = null;
    };
  }, [router.query]);

  useEffect(() => 
  {
    if (socket) {
      socket.on('updateGenerations', (gens: number[]) => {
        setSelectedGenerations(gens); // Update local state when the server broadcasts generations
      });
    }
  }, []);

  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTo({
        top: messagesEndRef.current.scrollHeight,
        behavior: "smooth", //smooth scrolling
      });
    }
  }, [messages]);
  const sendMessage = (e: React.FormEvent) => 
  {
    e.preventDefault();
    if (!socket || !message.trim() || !user.trim()) return;

    const userMsg = { user: user, text: message }; //user + message in one constant
    socket.emit('message', userMsg);
    setMessage('');
  };

  const sendChat = (e: React.FormEvent) =>
  {
    e.preventDefault();
    if (!socket || !chat.trim() || !user.trim()) return;

    const chatMsg = { user: user, text: chat }; //user + message in one constant
    socket.emit('chat', chatMsg);
    setChat('');
  }

  useEffect(() => 
  {
    socket.on('gameStatus', ({ gameActive }: { gameActive: boolean }) => 
    {
      setGameActive(gameActive);
    });
  }, []);

  const toggleGeneration = (generation: number) =>
  {
    let updatedGenerations: number[]

    if (selectedGenerations.includes(generation)) 
    {
      updatedGenerations = selectedGenerations.filter((gen) => gen !== generation);
    }
    else 
    {
      updatedGenerations = [...selectedGenerations, generation];
    }

    setSelectedGenerations(updatedGenerations);
    socket?.emit('updateGenerations', updatedGenerations);
  }

  //for current players and turns
  const playerEntries = Object.entries(userMap);

  const startGame = () =>
  {
    setBlur(true);
    socket?.emit('countdown');
  };

  const handleInputChange = (e) => 
  {
    if (socket && socket.id == Object.keys(userMap)[currTurn]) {
      const newValue = e.target.value;
      setMessage(newValue);
      socket?.emit('logKey', newValue);
    }
  }
  
  useEffect(() => {
    // Make sure the window is defined (avoid SSR issues)
    if (typeof window === 'undefined') return;

    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    // Resize canvas to fill window
    const resizeCanvas = () => 
    {
      canvas.width = window.innerWidth;
      canvas.height = window.innerHeight;
    };
    resizeCanvas();
    window.addEventListener('resize', resizeCanvas);

    // Particle class
    class Particle 
    {
      x: number;
      y: number;
      size: number;
      vx: number;
      vy: number;
      color: string;
      opacity: number;

      constructor(x: number, y: number, size: number, vx: number, vy: number, color: string, opacity: number) 
      {
        this.x = x;
        this.y = y;
        this.size = size;
        this.vx = vx;
        this.vy = vy;
        this.color = color;
        this.opacity = opacity;
      }

      update() 
      {
        this.x += this.vx;
        this.y += this.vy;

        // Wrap around edges
        if (this.x > canvas.width) this.x = 0;
        if (this.x < 0) this.x = canvas.width;
        if (this.y > canvas.height) this.y = 0;
        if (this.y < 0) this.y = canvas.height;
      }

      draw(context: CanvasRenderingContext2D) 
      {
        context.save();
        context.globalAlpha = this.opacity;
        const gradient = context.createRadialGradient
        (
          this.x, this.y, 0,
          this.x, this.y, this.size
        );
        gradient.addColorStop(0, 'rgb(255, 216, 162)');
        gradient.addColorStop(1, 'rgba(255, 221, 158, 0)');
        context.fillStyle = gradient;
        context.beginPath();
        context.arc(this.x, this.y, this.size, 0, 2 * Math.PI);
        context.fill();
        context.closePath();
        context.restore();
      }
    }

    //Create particles
    const particles: Particle[] = [];
    const numParticles = 40;

    function initParticles() 
    {
      for (let i = 0; i < numParticles; i++) 
      {
        const x = Math.random() * canvas.width;
        const y = Math.random() * canvas.height;
        const size = Math.random() * 7 + 2;
        const vx = (Math.random() - 0.5) * 0.1;
        const vy = (Math.random() - 0.5) * 0.1;
        const color = '#fabe6b';
        const opacity = Math.random() * 0.5 + 0.1;
        particles.push(new Particle(x, y, size, vx, vy, color, opacity));
      }
    }

    initParticles();
    //Completely clear the canvas instead of painting black:
    ctx.clearRect(0, 0, canvas.width, canvas.height);

    //Animation
    let animationFrame: number;
    function animate() 
    {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      
      for (const p of particles) {
        p.update();
        p.draw(ctx);
      }

      animationFrame = requestAnimationFrame(animate);
    }
    animate();

    // Cleanup on unmount
    return () => {
      window.removeEventListener('resize', resizeCanvas);
      cancelAnimationFrame(animationFrame);
      };
    }, []);

  return (
    <div style={{ position: 'relative' }}>
      {/* The background canvas */}
      <canvas
        ref={canvasRef}
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          zIndex: 0, // behind content
          width: '100vw',
          height: '100vh'
          
        }}
      />

    <div
      className="bg-pokemon bg-cover bg-center text-white min-h-[100vh]"
      style =
      {{
        backgroundImage: "url('/eevee.jpg')", 
        backgroundPosition: "25% 88%",
        backgroundRepeat: "no-repeat",
        backgroundSize: "105%",
        overflow: 'hidden',
      }}
    >
      {/* Countdown Overlay */}
      { (countdown !== null) && (
        <>
        <div
          style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            height: '100vh', width: '100vw',
            position: 'fixed',  
            fontSize: '7rem',
            color: '#f9e2c2',
            left: '0.35%',
            zIndex: 1000, //make sure it's on top
            transition: 'opacity 0.3s ease-in-out, transform 0.8s ease-in-out',
            opacity: fade ? 1 : 0, 
            visibility: visible ? 'visible' : 'hidden',
            transform: fade ? 'scale(1)' : 'scale(1.2)'
          }}
      >
        {countdown} 
            
      </div>
      </>
      )}

      
   

    
    
   
    {/*Music Player */}
    <MusicPlayer gameActive = {gameActive}/>
    <div 
      style = 
      {{ 
        margin: '80px auto', 
        maxWidth: 800 
      }}>
      <div 
        style = 
        {{ 
          display: 'flex', 
          justifyContent: 'left', 
          alignItems: 'left', 
          height: '10px', 
          overflow: 'hidden'
        }}>

  <div
    style = 
    {{
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      overflow: 'hidden', // Prevent scrollbars
      zIndex: 0
    }}
  >
  {/* Background container */}
  <div
    style = 
    {{
      position: 'relative',
      height: '220px',
      width: '500px',
      borderRadius: '8px',
      display: 'flex',
      transform: 'translate(1%, 0%)',
    }}
  >
    {/* Pokémon sprite */}
    {pokemon && (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: '100px',
          pointerEvents: 'none',
         
          zIndex: 2,
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translate(-50%, -50%)',
        }}
      >
        <img
          src={pokemon.sprite}
          alt={pokemon.name}
          style={{
            width: 'auto',
            height: 'auto',
            opacity: newSprite ? 0 : 1,
            transition: 'opacity 1s ease-in, opacity 1s ease-out',
          }}
        />
      </div>
    )}

    <div 
      style = {{
        width: '100%',
        height: '100%',
        borderRadius: '8px',
        backgroundColor: 'rgba(42, 42, 42, 0)',
      }}
      ></div>
    {/* Start button */}
    <div
      style={{
        display: 'flex',
        justifyContent: 'center',
        position: 'absolute',
        top: '94.5%',
        left: '50%',
        transform: 'translate(-51%, -50%)',
      }}
    >
      {playerEntries.length < 2 ? (
        <p style={{ color: 'white', fontSize: '16px' }}>
          Need 2 or more players to start
        </p>
      ) : (
        <button
          onClick={startGame}
          disabled={gameActive}
          style={{
            width: '100px',
            height: '32px',
            fontSize: '15px',
            color: 'white',
            cursor: 'pointer',
            borderRadius: '7px',
            backgroundColor: 'rgba(255, 255, 255, 0.2)',
            backdropFilter: 'blur(1.5px)',
            visibility: gameActive ? 'hidden' : 'visible'
          }}
        >
          Start Game
        </button>
      )}
    </div>

    {/* Timer */}
    <div id = "timer"
      style={{
        fontWeight: 'bold',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: '60%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      Waiting for game start
    </div>

    {/* Guessing box */}
    <form
      onSubmit={sendMessage}
      style={{
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        position: 'absolute',
        top: '76.5%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
      }}
    >
      <input
        style={{
          flex: 10,
          fontWeight: 'bold',
          padding: '3.8px',
          marginRight: '5px',
          borderRadius: '8px',
          border: 'none',
          outline: 'none',
          color: 'black',
          width: '50%',
          maxWidth: '220px',
          textAlign: 'center',
          backgroundColor: 'rgba(255, 255, 255, 1)',
        }}
        value={deferredMessage}
        onChange={
          socket?.id === Object.keys(userMap)[currTurn] ? handleInputChange : undefined
        }
        placeholder="Guess the Pokémon"
      />
    </form>
  </div>
</div>

      <div style={{ 
        display: 'flex', 
        position: 'absolute', 
        bottom: '10px', 
        left: '10px',
        visibility: gameActive ? 'hidden' : 'visible'
        }}>
      {Array.from({ length: 9 }, (_, i) => i + 1).map((gen) => (
        <label 
          key = {gen} 
          style = 
          {{ 
            margin: '0 10px', 
            textAlign: 'center' 
          }}>
          <input
            type="checkbox"
            checked={selectedGenerations.includes(gen)}
            onChange={() => toggleGeneration(gen)}
            style={{ marginRight: 5, border: 'none' }}
          />
          Gen {gen}
        </label>
      ))}
      </div>

  <div 
  style =
  {{
    position: 'absolute',
    right: 20,
    height: '220px',
    bottom: 20,  // Ensure it stays near the bottom
    width: '25%',  // Adjust to fit well on zoom
    minWidth: '420px', // Prevent it from getting too small
    maxWidth: '420px', // Prevent excessive growth
    fontSize: '14px',
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(170, 170, 170, 0.08)',
    border: '1px solid rgba(205, 205, 205, 0.1)',
    boxShadow : '0 0 5px 0.5px rgba(200, 200, 200, 0.2)',
    backdropFilter: 'blur(1.5px)'
  }}
>
  {/* Chat History */}
  <div 
    style={{ 
      flex: 1,  // Makes the chat history take up available space
      padding: 10,
      
      overflowY: 'auto',
      height: '200px', // Prevents excessive growth
      color: '#f9e2c2',
      fontWeight: 'bold',
      scrollbarWidth: 'none',
    }} 
    ref={messagesEndRef}
  >
    {messages.map((userMsg, i) => (
      <div key={i}>{userMsg}</div>
    ))}
  </div>

  {/* Chat Input */}
  <form 
    onSubmit={sendChat} 
    style={{ 
      height: '40px',
      padding: '8px'
    }}
  >
    <input
    className = "placeholder-[rgb(105,105,105)]"
    style={{
      flex: 1,
      padding: '2px',
      marginLeft: '1px',
      marginRight: '5px',
      border: 'none',
      borderRadius: '5px',
      outline: 'none',
      color: 'rgba(255, 255, 255, 0.8)',
      width: '100%',
      backgroundColor: 'rgba(60, 60, 60, 0.4)',
  }}
    value={chat}
    onChange={(p) => setChat(p.target.value)}
    placeholder = "Type your message"
  />

    
  </form>
  
</div>
     
    
    

  <div style = 
      {{
        display: 'flex', 
        
        flexDirection: 'column',
        position: 'absolute',
        left: '20%',
        top: '28%',
        border: 'none',
        fontSize: '20px',
        }}>
        
        <h2 style={{ marginBottom: '10px', textAlign: 'center', fontWeight: 'bold' }}>Players</h2>

<div 
  style={{ 
    display: 'flex', 
    flexDirection: 'column', 
    gap: '8.5px', 
    marginTop: '5px', 
    perspective: '800px', 
  }}
>
  {playerEntries.map(([socketId, username], index) => (
    <div 
      key={socketId} 
      style={{ 
        padding: '7px 13px',
        backgroundColor: lives[socketId] === 0 ? 'rgba(200, 200, 200, 0.10)' : 'rgba(200, 200, 200, 0.15)',
        color: 'white',
        borderRadius: '8px',
        border: '1px solid rgba(125, 125, 125, 0.3)',
        textAlign: 'center',
        fontWeight: 'bold',
        boxShadow: index === currTurn ? '0 0 13px 2px rgba(249, 226, 194, 0.8)' : '0 0 5px 0.1px rgba(220, 220, 220, 0.35)',
        transition: 'box-shadow 0.35s ease-in-out, transform 0.35s ease-in-out, opacity 0.35s ease-in-out',
        opacity: lives[socketId] === 0 ? 0.4 : 1,
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        width: '200px',
        backdropFilter: 'blur(1.5px)',
        
        //3D Transformations
        transform: `rotateX(2deg) rotateY(6deg)`,
        transformOrigin: 'center center',
      }}
    >
      <span>{username}</span>
      <span style={{ fontSize: '14px', opacity: 0.8 }}> {lives[socketId]}</span>
    </div>
  ))}


  </div>
  </div>
  </div>
  </div>
  </div>
  </div>
  );  

}