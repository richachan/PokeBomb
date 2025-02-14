import React, { useEffect, useRef, useState } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';

interface prop {
  gameActive: boolean;
}
const MusicPlayer = React.memo(({ gameActive }: prop) => 
{
    const [isPlaying, setIsPlaying] = useState(true);
    const [title, setTitle] = useState(false);
    const [game, setGame] = useState(false);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const [changingVolume, setChangingVolume] = useState(false);
    const [trackIndex, setTrackIndex] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);
    const [nextTrackTransition, setNextTrackTransition] = useState(false);
    const [movingUp, setMovingUp] = useState(false);
    const [autoPlay, setAutoPlay] = useState(true);
    const titleTimeoutRef = useRef(null);
    const debounceTimeoutRef = useRef(null);
    const [hasAnimated, setHasAnimated] = useState(false);

    useEffect(() => {
      if (title && !hasAnimated) {
        setHasAnimated(true);
      }
    }, [title, hasAnimated]);

    const musicTrackCalm = [
      { path: "/music/Snowpoint City.mp3", gameFrom: "Pokémon Diamond & Pearl" },
      { path: "/music/Lake.mp3", gameFrom: "Pokémon Diamond & Pearl" },
      { path: "/music/Littleroot Town.mp3", gameFrom: "Pokémon Ruby & Sapphire" },
      { path: "/music/National Park.mp3", gameFrom: "Pokémon Heart Gold & Soul Silver" },
      { path: "/music/Eterna Forest.mp3", gameFrom: "Pokémon Diamond & Pearl" },
      { path: "/music/Eterna City.mp3", gameFrom: "Pokémon Diamond & Pearl" },
    ];

    useEffect(() => {
      if(gameActive) {
        setAutoPlay(true);
      }
    });

    useEffect(() => {
      return () => {
        if (titleTimeoutRef.current) {
          clearTimeout(titleTimeoutRef.current);
        }
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
      };
    }, []);

    useEffect(() => {
      if (audioRef.current) {
        audioRef.current.load();
        audioRef.current.currentTime = 0;
        if (gameActive) {
          audioRef.current.play();
          if (autoPlay) {
            setTimeout(() => setTitle(true), 2500);
            setTimeout(() => setGame(true), 4000);
            setTimeout(() => setTitle(false), 8000);
            setTimeout(() => setGame(false), 8000);
            setHasAnimated(false);
          }
        } else {
          audioRef.current.pause();
          setIsPlaying(false);
          setTitle(false);
        }
      }
    }, [trackIndex, gameActive]);

    useEffect(() => 
    {
      if (audioRef.current) 
      {
       audioRef.current.volume = 0.4; // Ensure the volume starts at 40%
       setVolume(0.4); // Synchronize the state
      }
    }, []);
  
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
      if (audioRef.current) 
      {
        if (isPlaying) 
        {
          audioRef.current.pause();
        } 
        else 
        {
          if (gameActive) {
            setAutoPlay(true);
            audioRef.current.play();
          }
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
      
      setAutoPlay(false);
      if(trackIndex === 0)
      {
        setTrackIndex(musicTrackCalm.length - 1);
      }
      else
      {
        setTrackIndex((prevIndex) => (prevIndex - 1) % musicTrackCalm.length);
      }
      if (gameActive) {
        setTitle(true);
        setTimeout(() => setGame(false), 1000);
        if (titleTimeoutRef.current) {
          clearTimeout(titleTimeoutRef.current);
        }
   
        titleTimeoutRef.current = setTimeout(() => {
          setTitle(false);
          setGame(false);
          
        }, 2000);
    
        if (debounceTimeoutRef.current) {
          clearTimeout(debounceTimeoutRef.current);
        }
    
        debounceTimeoutRef.current = setTimeout(() => { }, 6500);
      }
    }
      
    const nextTrack = () =>
    {
      setNextTrackTransition(true);
      setIsPlaying(true);
      setTrackIndex((prevIndex) => (prevIndex + 1) % musicTrackCalm.length);

      setTimeout(() =>
      {
        setNextTrackTransition(false);
        setMovingUp(true);
      }, 300)

      setTimeout(() =>
      {
        setMovingUp(false);
      }, 600)
    }

    return (
    <div
        style =
        {{
          position: 'absolute',
          display: 'flex',
          width: '300px', 
          left: '50%',
          bottom: '6%',
          transform: 'translate(-50%, 0)',
          alignContent: 'center',
          justifyContent: 'center',
          alignItems: 'center',
          zIndex: 1000,
        }}
    >
      {/* Track Title */}
      <h3
            style = 
            {{
                position: 'relative',
                display: 'flex',
                fontWeight: 'bold',
                fontSize: '18px',
                transition: 'opacity 1s ease-in, opacity 2s ease-out, transform 1s ease-in, transform 2.3s ease-out',
                opacity: !title ? 0 : nextTrackTransition ? 0 : 1,
                transform:
                nextTrackTransition
                ? 'translateY(8px)'
                : !hasAnimated
                ? 'translateY(8px)'
                : 'translateY(0px)',
                }}  //track Title  
        >
            <i
              style =
              {{
                position: 'relative',
                fontSize: '20px',
                top: '13px',
                right: '15px',
                
              }}
              className = "fa-solid fa-music fa-sm">
            </i>

        {musicTrackCalm[trackIndex].path.split('/').pop().replace('.mp3', '')}
        </h3>
    
    {/* game from tag */}
  <div
  style={{
    position: 'absolute',
    bottom: '-100%',
    width: '500px',
    height: '30px',
    overflow: 'hidden',     // ensures the text is clipped when off the top
    textAlign: 'center',
  }}
>
  <h3
    style={{
      position: 'relative',
      fontWeight: 'bold',
      fontSize: '16px',
      whiteSpace: 'nowrap',
      transition: 'opacity 2s ease-in, opacity 2s ease-out',
      color: 'rgba(229, 226, 194)',
      opacity: !game ? 0 : nextTrackTransition ? 0 : 1,
    }}
    >
    {musicTrackCalm[trackIndex].gameFrom}
    </h3>
  </div>

        <audio
            ref = {audioRef}
            src = {musicTrackCalm[trackIndex].path}
            onTimeUpdate = {handleTimeUpdate}
            onLoadedMetadata = {handleLoadedMetadata}
            onEnded = {() =>
            {
              setNextTrackTransition(true);
              setAutoPlay(true);
              setTrackIndex((prevIndex) => 
                {
                  const nextIndex = (prevIndex + 1) % musicTrackCalm.length;
                  return nextIndex;
                });
              setTimeout(() =>
              {  
                setNextTrackTransition(false);
                setMovingUp(true);
              }, 300)
          
              setTimeout(() =>
              {
                setMovingUp(false);
              }, 600)
            }}
            autoPlay
        />
  
        {/*volume slider and volume text
        <div
            style =
            {{
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                marginTop: '30px',
                gap: '0px',
                position: 'absolute',
                top: '-2px',
                left: '-50px'
            }}
        >
          <label 
                htmlFor="volume-control"> 
          </label>
          
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
              width: '70px',
              height: '25px'
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
        */}

        {/* play/pause button
        <div
            onClick = {togglePlay}
            style =
            {{
            position: 'absolute',
            top: '7px',    
            left: '222px',  
            width: '26px', 
            height: '28px', 
            cursor: 'pointer',
            //backgroundColor: 'rgba(255, 0, 0, 0.2)',  
            //check hitbox of button
            }}
       >
            <i
            className={`fas ${isPlaying ? 'fa-pause' : 'fa-play'} fa-xl`}
            style =
            {{
               fontSize: '27px',
               position: 'relative', 
               top: '3px',        
               left: '4px'
            }}
            />
        </div>
        */}
        {/* previous song button*/}
        <div
            onClick = {() => 
            {
              previousTrack();
              new Audio("/sound-effects/Bruh.mp3").play();
            }}
            style = 
            {{
               position: 'absolute',
               cursor: 'pointer',
               top: '7px',
               left: '184px', 
               width: '26px', 
               height: '28px', 
               //backgroundColor: 'rgba(255, 0, 0, 0.2)'
          }}
        >
            <i id = 'previousTrackButton'
                className = "fa-solid fa-backward-step"
                style = 
                {{
                   fontSize : '28px',
                   position: 'relative',
                   left: '4px',
                   top: '0px',
                   opacity: '0'
                }}
            >
            </i>
        </div>
        {/* next song button 
        <div
          onClick = {nextTrack}
          style = 
          {{
            position: 'absolute',
            cursor: 'pointer',
            top: '7px',
            left: '260px', 
            width: '26px', 
            height: '28px', 
            //backgroundColor: 'rgba(255, 0, 0, 0.2)'
          }}
        >
          <i 
            className="fa-solid fa-forward-step"
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
  
        {/* song progress bar 
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
                    position: 'absolute',
                    top: '13px', 
                    marginLeft: '6px', 
                    width: '52%', 
                    background: 'transparent', 
                    borderRadius: '0px',
                }}
            />
          */}
          {/*song time text */}
            <div 
                style = 
                {{ 
                    textAlign: 'center', marginTop: '-3px', borderRadius: '0', fontWeight: 'bold'
                }}
            >
            </div>
        </div>

    );
  });
  
  export default MusicPlayer;