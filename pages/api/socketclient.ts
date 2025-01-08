import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('ws://localhost:8080');

const SocketClient = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        // Listen for incoming messages
        socket.on('message', (text: string) => {
            setMessages((prev) => [...prev, text]);
        });

        // Cleanup listener on component unmount
        return () => {
            socket.off('message');
        };
    }, []);

    const sendMessage = () => {
        if (inputValue.trim()) {
            socket.emit('message', inputValue);
            setInputValue(''); // Clear the input field
        }
    };
  }
export default SocketClient;
