import { useEffect, useState, useRef } from "react";
import API from "../api/api";
import { connectSocket } from "../socket/socket";
import UserList from "../components/UserList";

export default function Chat({ userId, logout }) {
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const messagesEndRef = useRef(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Connect socket
  useEffect(() => {
    if (!userId) return;
    const s = connectSocket();
    setSocket(s);

    s.on("receive_message", (msg) => {
      // Normalize IDs to strings
      const formatted = {
        ...msg,
        sender: String(msg.sender),
        receiver: String(msg.receiver),
      };

      // Only add if it's relevant to this chat
      if (
        (formatted.sender === String(userId) && formatted.receiver === String(selectedUser?._id)) ||
        (formatted.sender === String(selectedUser?._id) && formatted.receiver === String(userId))
      ) {
        setMessages((prev) => [...prev, formatted]);
      }
    });

    return () => {
      s.off("receive_message");
      s.disconnect();
    };
  }, [userId, selectedUser]);

  // Load users
useEffect(() => {
  API.get("/users")
    .then((res) => {
      setUsers(res.data);
    })
    .catch((err) => {
      console.error("Failed to fetch users:", err.response?.data || err.message);
    });
}, []);


  // Load past messages
  useEffect(() => {
    if (!selectedUser) return;
    setMessages([]);
    API.get(`/messages/${selectedUser._id}`)
      .then((res) => {
        const formatted = res.data.map((m) => ({
          ...m,
          sender: String(m.sender),
          receiver: String(m.receiver),
        }));
        setMessages(formatted);
      })
      .catch(console.error);
  }, [selectedUser]);

  useEffect(scrollToBottom, [messages]);

  // Send message
  const sendMessage = () => {
    if (!socket || !selectedUser || !text.trim()) return;

    const msg = {
      sender: String(userId),
      receiver: String(selectedUser._id),
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    socket.emit("send_message", msg);
    setText(""); // clear input, do NOT add to messages here
  };

  return (
    <div className="h-screen flex bg-black text-white">
      <UserList users={users} selectUser={setSelectedUser} />

      <div className="flex-1 flex flex-col">
        {/* Header */}
        <div className="flex justify-between items-center bg-gray-900 p-4 border-b border-gray-800">
          <span className="font-semibold text-cyan-400">
            {selectedUser ? selectedUser.username : "Select a user"}
          </span>
          <button
            onClick={logout}
            className="bg-red-600 text-white px-3 py-1 rounded hover:bg-red-700"
          >
            Logout
          </button>
        </div>

        {/* Messages */}
        <div className="flex-1 p-4 overflow-y-auto space-y-3">
          {messages.map((m, i) => {
            const isSender = String(m.sender) === String(userId);
            return (
              <div
                key={i}
                className={`max-w-xs px-3 py-2 rounded-lg break-words flex flex-col ${
                  isSender
                    ? "bg-cyan-500 text-black ml-auto items-end"
                    : "bg-gray-800 text-white mr-auto items-start"
                }`}
              >
                <span>{m.text}</span>
                <span className="text-xs text-gray-300 mt-1">{m.time}</span>
              </div>
            );
          })}
          <div ref={messagesEndRef} />
        </div>

        {/* Input */}
        {selectedUser && (
          <div className="flex p-4 bg-gray-900 gap-2 border-t border-gray-800">
            <input
              className="flex-1 p-2 rounded bg-gray-800 text-white outline-none"
              placeholder="Type a message..."
              value={text}
              onChange={(e) => setText(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && sendMessage()}
            />
            <button
              onClick={sendMessage}
              className="bg-cyan-500 text-black px-4 py-2 rounded hover:bg-cyan-400"
            >
              Send
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
