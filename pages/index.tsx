import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

const socket: Socket = io('ws://localhost:8080'); // Replace with your server URL if different

const Home = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState<string>('');

    useEffect(() => {
        // Listen for messages from the server
        socket.on('message', (text: string) => {
            setMessages((prev) => [...prev, text]);
        });

        // Cleanup the socket connection
        return () => {
            socket.off('message');
        };
    }, []);

    const sendMessage = () => {
        if (inputValue.trim()) {
            socket.emit('message', inputValue); // Emit the input value to the server
            setInputValue(''); // Clear the input field after sending
        }
    };

    return (
        <>
            <head>
                <meta charSet="UTF-8" />
                <meta name="viewport" content="width=device-width, initial-scale=1.0" />
                <title>Document</title>
            </head>
            <body>
                <ul>
                    {messages.map((msg, index) => (
                        <li key={index}>{msg}</li>
                    ))}
                </ul>
                <input
                    placeholder="message"
                    value={inputValue}
                    onChange={(e) => setInputValue(e.target.value)}
                />
                <button onClick={sendMessage}>Send</button>
            </body>
        </>
    );
};

export default Home;
