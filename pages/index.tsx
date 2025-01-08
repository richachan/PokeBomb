import React, { JSX, useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

// Initialize the socket connection
const socket: Socket = io('ws://localhost:8080');

const Home: React.FC = (): JSX.Element => {
    const [messages, setMessages] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState('');

    useEffect(() => {
        // Listen for incoming messages
        socket.on('message', (text: string) => {
            setMessages((prev) => [...prev, text]);
        });

        // Cleanup the event listener on component unmount
        return () => {
            socket.off('message');
        };
    }, []);

    const sendMessage = () => {
        if (inputValue.trim()) {
            socket.emit('message', inputValue);
            setInputValue(''); // Clear the input field after sending
        }
    };

    return (
        <div style={{ padding: '20px', fontFamily: 'Arial, sans-serif' }}>
            <h1>Real-Time Chat</h1>
            <ul style={{ listStyleType: 'none', padding: 0 }}>
                {messages.map((msg, index) => (
                    <li key={index} style={{ marginBottom: '10px' }}>
                        {msg}
                    </li>
                ))}
            </ul>
            <input
                type="text"
                placeholder="Type a message"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{
                    padding: '10px',
                    fontSize: '16px',
                    marginRight: '10px',
                    border: '1px solid #ccc',
                    borderRadius: '4px',
                }}
            />
            <button
                onClick={sendMessage}
                style={{
                    padding: '10px 20px',
                    fontSize: '16px',
                    backgroundColor: '#007bff',
                    color: '#fff',
                    border: 'none',
                    borderRadius: '4px',
                    cursor: 'pointer',
                }}
            >
                Send
            </button>
        </div>
    );
};

export default Home;
