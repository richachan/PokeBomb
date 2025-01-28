import { useRouter } from 'next/router';
import React, { useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';
import '@fortawesome/fontawesome-free/css/all.min.css';
import next from 'next';


let socket: Socket | null = null;

type displayMessage = { user: string; text: string };
type Pokemon = { name: string; sprite: string ;guessed:boolean};

export default function Home() {
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

  //music
  const [isPlaying, setIsPlaying] = useState(true);
  const [currentTime, setCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement>(null);
  const [volume, setVolume] = useState(0.5);
  const [changingVolume, setChangingVolume] = useState(false);
  const [trackIndex, setTrackIndex] = useState(0);

  const musicTrackCalm = 
  [
    "/music/Lake.mp3", "/music/Littleroot Town.mp3", "/music/National Park HGSS.mp3", "/music/Eterna Forest.mp3", 
    "/music/Eterna City.mp3"
  ];

  const [currentTrack, setCurrentTrack] = useState<string>(musicTrackCalm[0]);

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => 
  {
    const newValue = parseFloat(e.target.value);
    setVolume(newValue / 100);
    if (audioRef.current) 
    {
      audioRef.current.volume = newValue / 100;
    }
  };

  const togglePlay = () => 
  {
    if (audioRef.current) {
      if (isPlaying) 
      {
        audioRef.current.pause();
      } 
      else 
      {
        audioRef.current.play();
      }
      setIsPlaying(!isPlaying);
    }
  };

  const handleTimeUpdate = () => 
  {
    if (audioRef.current) 
    {
      setCurrentTime(audioRef.current.currentTime);
    }
  };

  const handleLoadedMetadata = () => 
  {
    if (audioRef.current) 
    {
      setDuration(audioRef.current.duration);
    }
  };

  const previousTrack = () =>
  {
    if(trackIndex === 0)
    {
      setTrackIndex(musicTrackCalm.length - 1);
    }
    else
    {
      setTrackIndex((prevIndex) => (prevIndex - 1) % musicTrackCalm.length);
    }
  }

  const nextTrack = () =>
  {
    setTrackIndex((prevIndex) => (prevIndex + 1) % musicTrackCalm.length);
  }

  useEffect(() => 
  {
    if (audioRef.current) 
    {
      audioRef.current.load();
      audioRef.current.currentTime = 0;
      audioRef.current.play();
    }
  }, [trackIndex]);

  useEffect(() => 
    {
    if (audioRef.current) 
    {
      audioRef.current.volume = 0.5; // Ensure the volume starts at 50%
      setVolume(0.5); // Synchronize the state
    }
  }, []);


  useEffect(() => 
  {
    const username = query.username as string;
    setUser(username);

    // Ensure the server side is initialized
    fetch('/api/socket').catch((err) => console.error(err));

    // Connect the client socket if not already connected
    if (!socket) 
    {
      socket = io({ path: '/api/socket_io' });

      socket.on('connect', () => {
        console.log('Connected:', socket?.id);
        const msg = {user: username, text:" has connected"};
        socket.emit('message', msg)
        socket.emit('register',username)
      });

      socket.on('message', (msg: displayMessage) => {
        const strMsg = `${msg.user} ${msg.text}`;
        setMessages((prev) => [...prev, strMsg]);
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
      });

      socket.on('pokemon', ({ name, sprite ,guessed}: Pokemon) => 
      {
        if(guessed)socket.emit('newTimer');
        setPokemon({ name, sprite ,guessed});
      });
    }

    // Cleanup on unmount
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
        behavior: "smooth", // Smooth scrolling
      });
    }
  }, [messages]);
  const sendMessage = (e: React.FormEvent) => 
  {
    e.preventDefault();
    if (!socket || !message.trim() || !user.trim()) return;

    const userMsg = { user: user, text: message }; // user + message in one constant
    socket.emit('message', userMsg);
    setMessage('');
  };

  const sendChat = (e: React.FormEvent) =>
  {
    e.preventDefault();
    if (!socket || !chat.trim() || !user.trim()) return;

    const chatMsg = { user: user, text: chat }; // user + message in one constant
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
    socket.emit('gameStarted')
  };

  return (

    <div
      className="bg-pokemon bg-cover bg-center text-white min-h-[100vh]"
      style={{
        backgroundImage: "url('/eevee.jpg')", 
        backgroundPosition: "50% 85%",
        backgroundRepeat: "no-repeat",
        backgroundSize: "100%",
        overflow: 'hidden',
        boxShadow: 'inset 0 0 1000px 205px rgba(0, 0, 0, 0.80)'
        
      }}
      
    >

    {/* Header */}

    <div
    style={{
      position: "relative",
      transform: "scale(1)", // Keep the header scaling as you intended
      maxWidth: "100%", // Ensure it doesn’t go offscreen
      height: "69px",
      padding: "10px",
      backgroundColor: "rgba(32, 32, 37, 0)", // Your original `hsl(248, 13%, 82%, 0.25)` in RGBA
      backdropFilter: 'blur(1.5px)',
    }}
  > 

  {/* Music Player */}

  <div
      style =
      {{
        justifyContent: 'right', 
        alignItems: 'right',
        position: 'fixed',
        top: '100px', 
        right: '10px',
        transform: 'scale(1)', 
        width: '300px', 
        height: '170px',
        padding: '10px',
      
        backgroundColor: 'rgba(42, 42, 42, 0.4)',
        borderRadius: '14px', 
        opacity: 0.9
      }}
    >
      <h3
        
        style = 
        {{
          marginLeft: '13px',
          marginBottom: '30px',
          fontWeight: 'bold',
          fontSize: '18px',
        }}  
      >
        {musicTrackCalm[trackIndex].split('/').pop().replace('.mp3', '')}
      
      </h3>
      <audio
        ref = {audioRef}
        src = {musicTrackCalm[trackIndex]}
        onTimeUpdate = {handleTimeUpdate}
        onLoadedMetadata = {handleLoadedMetadata}
        onEnded = {() =>
        {
          setTrackIndex((prevIndex) => 
          {
            const nextIndex = (prevIndex + 1) % musicTrackCalm.length;
            return nextIndex;
          });
        }}
        autoPlay
      />

      {/*volume slider and volume text*/}
      <div
        style =
        {{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          marginTop: '30px',
          gap: '0px',
          position: 'absolute',
          top: '65px',
          left: '-25px'
        }}
      >
        <label htmlFor="volume-control"> </label>
        <input
          id="volume-control"
          type="range"
          min="0"
          max="100"
          step="1"
          value={volume * 100}
          onChange={handleVolumeChange}
          onMouseDown={() => setChangingVolume(true)} 
          onMouseUp={() => setChangingVolume(false)}
          style = 
          {{
            transform: 'rotate(-90deg)',
            marginBottom: '0px',
            width: '85px'
          }}
        />

        <i 
          className ="fas fa-volume-up"
          style = 
          {{
            position: 'absolute',
            fontSize: '14px',
            top: '54px',
            opacity: '0.8'
          }}
        >
        </i>

        {changingVolume && (
        <span
        style =
        {{
          position: 'absolute', 
          left: '8px',         
          top: '50px',         
          transform: 'translate(50px , 0)', 
          fontSize: '14px',   
          fontWeight: 'bold',
        }}
        >
      {Math.round(volume * 100)}
    </span>
  )}
      </div>

      {/* play/pause button*/}
      <div
        onClick = {togglePlay}
        style =
        {{
        position: 'absolute',
        top: '48px',    
        left: '138px',  
        width: '26px', 
        height: '28px', 
        cursor: 'pointer',
        backgroundColor: 'rgba(255, 0, 0, 0.2)',  
        //check hitbox of button
       }}
     >
       <i
        className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} fa-xl`}
        style =
        {{
          fontSize: '25px',
          position: 'relative', 
          top: '3px',        
          left: '4px'
        }}
       />
      </div>

      {/* previous song button */}
      <div
        onClick = {previousTrack}
        style = 
        {{
          position: 'absolute',
          cursor: 'pointer',
          top: '48px',
          left: '100px', 
          width: '26px', 
          height: '28px', 
          backgroundColor: 'rgba(255, 0, 0, 0.2)'
        }}
      >
        <i 
          className = "fa-solid fa-backward-step"
          style = 
          {{
            fontSize : '28px',
            position: 'relative',
            left: '4px',
            top: '0px',
          }}
        >
        </i>
      </div>

      {/* next song button */}
      <div
        onClick = {nextTrack}
        style = 
        {{
          position: 'absolute',
          cursor: 'pointer',
          top: '48px',
          left: '176px', 
          width: '26px', 
          height: '28px', 
          backgroundColor: 'rgba(255, 0, 0, 0.2)'
        }}
      >
        <i className="fa-solid fa-forward-step"
           style = 
           {{
             fontSize : '28px',
             position: 'relative',
             left: '4px',
             top: '0px',
           }}
        >
        </i>


      </div>

      {/* song progress bar */}
      <div>
        <input
          type = "range"
          min = "0"
          max = {duration || 0}
          value= {audioRef.current ? audioRef.current.currentTime : 0} 
          onChange = {(e) =>
          {
            if (audioRef.current) 
            {
              const newTime = Number(e.target.value);
              audioRef.current.currentTime = newTime;
              setCurrentTime(newTime);
            } 
          }}
          
          onMouseUp = {() => 
          {
            if (audioRef.current) 
            {
              if (audioRef.current.currentTime >= audioRef.current.duration - 0.9) 
              {
                nextTrack();
              }
            }
          }}

          style = 
          {{
            marginTop: '12px', marginLeft: '45px', width: '70%', background: 'transparent', borderRadius: '0px'
          }}
        />
        
        {/*song time text */}
        <div 
          style = 
          {{ 
            textAlign: 'center', marginTop: '-3px', borderRadius: '0', fontWeight: 'bold'
          }}
        >
        </div>
      </div>
    </div>
    </div>
      
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
      </div>
        <img src={"/pokebomb_logo.png"} 
        style =
        {{ 
          filter: 'saturate(60%)',
          position: 'absolute', 
          top: '15px', 
          left: '12px', 
          maxWidth: '165px',
          height: 'auto', 
        }} 
    />
    {pokemon && (
    <div
    style={{
      display: 'flex',
      flexDirection: 'column',  // Column to stack "Current Pokémon" text above sprite
      alignItems: 'center',     // Center horizontally
      justifyContent: 'center',
      height: '20px',
      marginTop: '-50px',
      
      position: 'relative',
      zIndex: 1
    }}
  >
    {/* "Current Pokémon" text image on top */}
    <img
      src="/current_pokemon.png"
      style={{ 
        width: '15vw', 
        marginBottom: '0px' ,
        filter: 'saturate(70%)',
      }}
      alt="Current Pokémon Title"
    />
  </div>
)}
  {pokemon && (
  <div
      style = 
      {{
        display: 'absolute',
        alignItems: 'center',   
        justifyContent: 'center',
        height: '200px',
        overflow: 'hidden',
        position: 'relative',
        zIndex: 2,
        pointerEvents: 'none',
      }}
    >
      {/* Actual Pokémon sprite below */}
      <img
        src={pokemon.sprite}
        alt={pokemon.name}
        style={{width: 'auto', height: 'auto'}}
      />
    </div>
  )}

  <div 
    id = "startButton" 
    style = 
    {{ 
      display: 'flex', 
      justifyContent: 'center',
      marginTop: '-40px', 
    }}>
    <button 
      onClick = {startGame}
      disabled = {gameActive}
      style = 
      {{ 
        padding: '6px 15px', 
        fontSize: '15px', 
        color: 'white',
        cursor: 'pointer', 
        borderRadius: '8px',      
        backgroundColor: 'rgb(255, 255, 255, 0.3)',
        marginTop: '20px',
        marginBottom: '20px',
        visibility: gameActive ? 'hidden' : 'visible', 
        }}>
        Start Game
    </button>
  </div>

    
    <div id = "timer" style={{display: 'flex', justifyContent: 'center', alignItems: 'center'}}>
      Waiting for game to start...
    </div>

      <div style={{ display: 'flex', justifyContent: 'center', marginTop: 10, marginBottom: 20 }}>
      {Array.from({ length: 9 }, (_, i) => i + 1).map((gen) => (
        <label key={gen} style={{ margin: '0 10px', textAlign: 'center' }}>
          <input
            type="checkbox"
            checked={selectedGenerations.includes(gen)}
            onChange={() => toggleGeneration(gen)}
            style={{ marginRight: 5 }}
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
    height: '200px',
    bottom: 20,  // Ensure it stays near the bottom
    width: '22%',  // Adjust to fit well on zoom
    minWidth: '300px', // Prevent it from getting too small
    maxWidth: '500px', // Prevent excessive growth
    
    borderRadius: '8px',
    display: 'flex',
    flexDirection: 'column',
    backgroundColor: 'rgba(42, 42, 42, 0.4)',
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
      borderTop: '1px solid #ccc',
      padding: '5px'
    }}
  >
    <input
      style = 
      {{ 
        flex: 1, 
        padding: '2px',
        marginLeft: '1px',
        marginRight: '5px',
        border: 'none',
        borderRadius: '5px',
        outline: 'none',
        color: '#2980b9',
        width: '100%',
        backgroundColor: 'rgba(42, 42, 42, 0.4)',
      }}
      value={chat}
      onChange={(p) => setChat(p.target.value)}
      placeholder=" Type your message "
    />
  </form>
</div>
      <hr/>
      
    { /*guessing box*/ }
    <form 
      onSubmit={sendMessage} 
      style = 
      {{ 
        height: '40px',
        borderTop: '1px solid #ccc',
        padding: '5px',
        display: 'flex',
        justifyContent: 'center', 
        alignContent: 'center',
        fontWeight: 'bold'
      }}
  >
      <input
      style = 
      {{ 
        flex: 1, 
        fontWeight: 'bold',
        padding: '8px',
        marginRight: '5px',
        justifyContent: 'center',
        alignContent: 'center',
        borderRadius: '5px',
        outline: 'none',
        color: '#000',
        width: '50%',
        maxWidth: '400px',
        textAlign: 'center',
        backgroundColor: 'rgba(255, 255, 255, 1)',
      }}
      value = {message}
      onChange={(e) => setMessage(e.target.value)}
      placeholder=" Guess the Pokémon "
    />
  </form>

  <div style = 
      {{
        display: 'flex', 
        justifyContent: 'center',
        alignContent: 'center',
        flexDirection: 'column',
        marginLeft: '375px',
        }}>
        
      <h2>Playing:</h2>
      {playerEntries.length === 0 && <p>It's quiet in here</p>}
      {playerEntries.map(([socketId, username], index) => (
        <div key={socketId} style={{ margin: '4px 0' }}>
          {username} {lives[socketId]}
          {index === currTurn && <strong style={{ color: '#f9e2c2', marginLeft: 8 }}>← Current turn</strong>}
        </div>
      ))}
      </div>
    </div>
    </div>
  );  
}
