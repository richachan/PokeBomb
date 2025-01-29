import React, { useEffect, useRef, useState } from 'react';
import '@fortawesome/fontawesome-free/css/all.min.css';

const MusicPlayer = React.memo(() => 
{
    const [isPlaying, setIsPlaying] = useState(true);
    const [currentTime, setCurrentTime] = useState(0);
    const [duration, setDuration] = useState(0);
    const [volume, setVolume] = useState(0.5);
    const [changingVolume, setChangingVolume] = useState(false);
    const [trackIndex, setTrackIndex] = useState(0);
    const audioRef = useRef<HTMLAudioElement>(null);
  
    const musicTrackCalm = [
      "/music/Lake.mp3", 
      "/music/Littleroot Town.mp3", 
      "/music/National Park HGSS.mp3", 
      "/music/Eterna Forest.mp3", 
      "/music/Eterna City.mp3"
    ];

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

    return (
    <div
        style =
        {{
          position: 'absolute',
          right: '0px',
          top: '0px',
          width: '300px', 
          height: '100px',
          padding: '10px',
          backgroundColor: 'rgba(42, 42, 42, 0.4)',
          borderRadius: '0px', 
          opacity: 0.9
        }}
    >
        <h3
            style = 
            {{
                position: 'relative',
                marginLeft: '13px',
                top: '50px',
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
               top: '7px',
               left: '184px', 
               width: '26px', 
               height: '28px', 
               //backgroundColor: 'rgba(255, 0, 0, 0.2)'
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
                    position: 'absolute',
                    top: '13px', 
                    marginLeft: '6px', 
                    width: '52%', 
                    background: 'transparent', 
                    borderRadius: '0px',
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
    );
  });
  
  export default MusicPlayer;