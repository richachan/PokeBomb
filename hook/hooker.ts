import { useRouter } from 'next/router';
import { useDeferredValue, useEffect, useRef, useState } from 'react';
import { io, Socket } from 'socket.io-client';

type DisplayMessage = { user: string; text: string };
type Pokemon = { name: string; sprite: string; guessed: boolean };

let socket: Socket | null = null;

export default function usePokemonGame() {
  const router = useRouter();

  //read username from query, or you can pass it in as a param
  const username = router.query.username as string || '';
  const roomID = router.query.roomID as string || '';

  const [message, setMessage] = useState('');
  const [chat, setChat] = useState('');
  const [messages, setMessages] = useState<string[]>([]);
  const [userMap, setUserMap] = useState<{ [socketId: string]: string }>({});
  const [currTurn, setCurrTurn] = useState<number>(0);
  const [lives, setLives] = useState<{ [socketId: string]: number }>({});
  const [gameActive, setGameActive] = useState(false);

  const [pokemon, setPokemon] = useState<Pokemon | null>(null);
  const [selectedGenerations, setSelectedGenerations] = useState<number[]>([]);
  const [countdown, setCountdown] = useState<number | null>(null);
  const [turnTimer, setTurnTimer] = useState<number | string | null>(null);
  const [fade, setFade] = useState<boolean>(false);
  const [blur, setBlur] = useState<boolean>(false);
  const [visible, setVisible] = useState<boolean>(false);
  const [newSprite, setNewSprite] = useState<boolean>(false);

  const messagesEndRef = useRef<HTMLDivElement>(null);
  const deferredMessage = useDeferredValue(message);

  useEffect(() => {
    if (!username || !roomID) return; //wait until username is known

    //Make sure server is ready
    fetch('/api/socket').catch((err) => console.error(err));

    if (!socket) {
      //connect
      socket = io({ path: '/api/socket_io' });

      socket.on('connect', () => {
        console.log('Connected:', socket?.id);
        //join room
        socket?.emit('join', { username, roomID });
        socket?.emit('message', { user: username, text: 'has connected' });
        socket?.emit('register', username);
      });

      socket.on('message', (msg: DisplayMessage) => {
        const strMsg = `${msg.user} ${msg.text}`;
        setMessages((prev) => [...prev, strMsg]);
      });

      socket.on('chat', (msg: DisplayMessage) => {
        const strMsg = `${msg.user}: ${msg.text}`;
        setMessages((prev) => [...prev, strMsg]);
      });

      socket.on('updateGlobalKey', (incoming: string) => {
        //only override my local message if I'm NOT the current turn
        if (socket && socket.id !== Object.keys(userMap)[currTurn]) {
          setMessage(incoming);
        }
      });

      socket.on('players', (data: { userMap: { [id: string]: string }; currTurn: number; lives: { [id: string]: number } }) => {
        setUserMap(data.userMap);
        setCurrTurn(data.currTurn);
        setLives(data.lives);
        setMessage('');
      });

      socket.on('setTimer', (data: number | string) => {
        console.log('setTimer event received:', data);
        setTurnTimer(data);
      });

      socket.on('pokemon', ({ name, sprite, guessed }: Pokemon) => {
        setPokemon({ name, sprite, guessed });
        if (guessed) socket?.emit('newTimer');
      });

      socket.on('gameStatus', ({ gameActive }) => {
        setGameActive(gameActive);
      });

      socket.on('updateGenerations', (gens: number[]) => {
        setSelectedGenerations(gens);
      });

      socket.on('countdownUpdate', (time: number) => {
        setCountdown(time);
        if (time !== 4) setVisible(true);
        else setVisible(false);


        setTimeout(() => setFade(true), 0);
        setTimeout(() => setFade(false), 500);
      });

      socket.on('countdownEnd', () => {
        setCountdown(null);
        setFade(false);
        socket?.emit('gameStarted');
        setMessage('');
      });
    }

    return () => {
      socket?.disconnect();
      socket = null;
    };
  }, [username]);

  /*If it's now my turn, clear the input*/
  useEffect(() => {
    if (socket?.id === Object.keys(userMap)[currTurn]) {
      setMessage('');
    }
  }, [currTurn, userMap]);

 
  useEffect(() => {
    if (messagesEndRef.current) {
      messagesEndRef.current.scrollTo({
        top: messagesEndRef.current.scrollHeight,
        behavior: 'smooth',
      });
    }
  }, [messages]);


  function sendMessage(e: React.FormEvent) {
    e.preventDefault();
    if (!socket || !message.trim() || !username.trim()) return;
    socket.emit('message', { user: username, text: message });
    setMessage('');
  }

  function sendChat(e: React.FormEvent) {
    e.preventDefault();
    if (!socket || !chat.trim() || !username.trim()) return;
    socket.emit('chat', { user: username, text: chat });
    setChat('');
  }

  function toggleGeneration(gen: number) {
    let updated: number[];
    if (selectedGenerations.includes(gen)) {
      updated = selectedGenerations.filter((g) => g !== gen);
    } else {
      updated = [...selectedGenerations, gen];
    }
    setSelectedGenerations(updated);
    socket?.emit('updateGenerations', updated);
  }

  function startGame() {
    setBlur(true);
    socket?.emit('countdown');
  }

  function handleInputChange(e: React.ChangeEvent<HTMLInputElement>) {
    //Only let me type if it's my turn
    if (!socket) return;
    if (socket.id === Object.keys(userMap)[currTurn]) {
      const newValue = e.target.value;
      setMessage(newValue);
      socket.emit('logKey', newValue);
    }
  }


  return {
    username,
    message,
    setMessage,
    deferredMessage,
    chat,
    setChat,
    userMap,
    currTurn,
    lives,
    countdown,
    fade,
    blur,
    visible,
    newSprite,
    pokemon,
    messages,
    selectedGenerations,
    gameActive,
    socket,
    turnTimer,

    playerEntries: Object.entries(userMap),

    messagesEndRef,

    sendMessage,
    sendChat,
    toggleGeneration,
    startGame,
    handleInputChange,
  };
}
