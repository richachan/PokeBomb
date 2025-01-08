import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

const socket: Socket = io(); // Connects to the Socket.IO server (API route)

const Home = () => {
    const [messages, setMessages] = useState<string[]>([]);
    const [inputValue, setInputValue] = useState<string>("");

    useEffect(() => {
        // Listen for incoming messages
        socket.on("message", (text: string) => {
            setMessages((prev) => [...prev, text]); // Append the new message
        });

        return () => {
            socket.off("message"); // Cleanup the event listener on unmount
        };
    }, []);

    const sendMessage = () => {
        if (inputValue.trim()) {
            socket.emit("message", inputValue); // Emit the message to the server
            setInputValue(""); // Clear the input field
        }
    };

    return (
        <div
            style={{
                backgroundColor: "#f5f5f5",
                color: "#333",
                minHeight: "100vh",
                padding: "20px",
                fontFamily: "Arial, sans-serif",
            }}
        >
            <h1>Real-Time Chat</h1>
            <ul style={{ listStyleType: "none", padding: 0 }}>
                {messages.map((msg, index) => (
                    <li key={index} style={{ marginBottom: "10px" }}>
                        {msg}
                    </li>
                ))}
            </ul>
            <input
                type="text"
                placeholder="Type your message"
                value={inputValue}
                onChange={(e) => setInputValue(e.target.value)}
                style={{
                    padding: "10px",
                    fontSize: "16px",
                    marginRight: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                }}
            />
            <button
                onClick={sendMessage}
                style={{
                    padding: "10px 20px",
                    fontSize: "16px",
                    backgroundColor: "#007bff",
                    color: "#fff",
                    border: "none",
                    borderRadius: "4px",
                    cursor: "pointer",
                }}
            >
                Send
            </button>
        </div>
    );
};

export default Home;
