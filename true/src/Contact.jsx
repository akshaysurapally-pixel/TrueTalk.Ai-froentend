import { useEffect, useState } from "react";

const Contact = () => {
    const [messages, setMessages] = useState([]);
    const [ws, setWs] = useState(null);
    const [text, setText] = useState("");
    const [contact, setContact] = useState({ name: "", phone: "" });

    useEffect(() => {
        // Load saved contact from localStorage
        const savedContact = localStorage.getItem("contact");
        if (savedContact) {
            setContact(JSON.parse(savedContact));
        }

        // WebSocket Connection
        const socket = new WebSocket("ws://localhost:8000/ws/contact/");
        setWs(socket);

        socket.onopen = () => {
            console.log("WebSocket Connected");

            // Auto-send saved contact when websocket connects
            const saved = localStorage.getItem("contact");
            if (saved) {
                const c = JSON.parse(saved);
                socket.send(
                    JSON.stringify({
                        type: "contact",
                        sender: "akshay",
                        contact_name: c.name,
                        contact_phone: c.phone,
                    })
                );
            }
        };

        socket.onmessage = (event) => {
            const msg = JSON.parse(event.data);
            setMessages((prev) => [...prev, msg]);
        };

        socket.onclose = () => console.log("WebSocket Closed");

        return () => socket.close();
    }, []);

    // Send Text Message
    const sendTextMessage = () => {
        if (!text.trim() || !ws || ws.readyState !== 1) return;

        ws.send(
            JSON.stringify({
                type: "text",
                sender: "akshay",
                text,
            })
        );

        setText("");
    };

    // Send Contact + Save to localStorage + Save to Backend
    const sendContact = async () => {
        if (!contact.name.trim() || !contact.phone.trim() || !ws) return;

        // 1. Save in localStorage
        localStorage.setItem("contact", JSON.stringify(contact));

        // 2. Send through websocket
        ws.send(
            JSON.stringify({
                type: "contact",
                sender: "akshay",
                contact_name: contact.name,
                contact_phone: contact.phone,
            })
        );

        // 3. Save to backend (Django API)
        await fetch("http://localhost:8000/api/contact/save/", {
            method: "POST",
            headers: {
                "Content-Type": "application/json",
            },
            body: JSON.stringify({
                sender: "akshay",
                name: contact.name,
                phone: contact.phone,
            }),
        });

        setContact({ name: "", phone: "" });
    };

    return (
        <div className="w-full h-screen flex flex-col bg-gray-50">

            {/* Header */}
            <div className="bg-blue-600 text-white p-4 font-semibold text-lg shadow">
                Contact Chat Room
            </div>

            {/* Chat Messages */}
            <div className="flex-grow overflow-y-auto p-4 space-y-3">
                {messages.map((msg, index) => (
                    <div key={index} className="flex flex-col w-fit max-w-xs">
                        {msg.text ? (
                            <div className="bg-white px-4 py-2 rounded-xl shadow text-gray-800">
                                <span className="font-semibold">{msg.sender}: </span>
                                {msg.text}
                            </div>
                        ) : (
                            <div className="bg-green-100 px-4 py-3 rounded-xl shadow">
                                <p className="font-bold text-gray-700">{msg.sender} shared a contact:</p>
                                <p className="text-lg font-semibold">{msg.contact_name}</p>
                                <p className="text-gray-700">{msg.contact_phone}</p>
                            </div>
                        )}
                    </div>
                ))}
            </div>

            {/* Text Input */}
            <div className="bg-white p-4 flex gap-3 border-t shadow-md">
                <input
                    type="text"
                    placeholder="Type message..."
                    className="flex-1 border border-gray-300 rounded-lg px-3 py-2 focus:ring focus:ring-blue-300 outline-none"
                    value={text}
                    onChange={(e) => setText(e.target.value)}
                />

                <button
                    onClick={sendTextMessage}
                    className="bg-blue-600 text-white px-5 py-2 rounded-lg hover:bg-blue-700 transition"
                >
                    Send
                </button>
            </div>

            {/* Contact Sharing Input */}
            <div className="bg-gray-100 p-4 flex gap-3 border-t">

                <input
                    type="text"
                    placeholder="Contact Name"
                    className="border border-gray-300 px-3 py-2 rounded-lg w-40 focus:ring"
                    value={contact.name}
                    onChange={(e) => setContact({ ...contact, name: e.target.value })}
                />

                <input
                    type="text"
                    placeholder="Phone Number"
                    className="border border-gray-300 px-3 py-2 rounded-lg w-40 focus:ring"
                    value={contact.phone}
                    onChange={(e) => setContact({ ...contact, phone: e.target.value })}
                />

                <button
                    onClick={sendContact}
                    className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
                >
                    Share Contact
                </button>
            </div>
        </div>
    );
};

export default Contact;
