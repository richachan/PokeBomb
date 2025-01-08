import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const socket: Socket = io(process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:3000/api/socket"); // Use the environment variable or localhost for local development

const Home = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState<string>("");

    useEffect(() => {
        console.log("Connecting to server...");
        socket.on("message", (text: string) => {
            setMessages((prev) => [...prev, text]);
        });

        return () => {
            socket.off("message");
        };
    }, []);

    const sendMessage = () => {
        if (inputValue.trim()) {
            socket.emit("message", inputValue);
            setInputValue("");
        }
    };

    return (
        <div>
            <h1>Real-Time Chat</h1>
            <ul>
                {messages.map((msg, index) => (
                    <li key={index}>{msg}</li>
                ))}
            </ul>
            <input
                type="text"
                placeholder="Type your message"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
            />
            <button onClick={sendMessage}>Send</button>
        </div>
    );
};

export default Home;
