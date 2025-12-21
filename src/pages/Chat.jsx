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
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Connect socket
  useEffect(() => {
    if (!userId) return;
    const s = connectSocket();
    setSocket(s);

    s.on("receive_message", (msg) => {
      const formatted = {
        ...msg,
        sender: String(msg.sender),
        receiver: String(msg.receiver),
      };

      if (
        (formatted.sender === String(userId) &&
          formatted.receiver === String(selectedUser?._id)) ||
        (formatted.sender === String(selectedUser?._id) &&
          formatted.receiver === String(userId))
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
      .then((res) => setUsers(res.data))
      .catch((err) =>
        console.error("Failed to fetch users:", err.response?.data || err.message)
      );
  }, []);

  // Load messages
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

  const sendMessage = () => {
    if (!socket || !selectedUser || !text.trim()) return;

    const msg = {
      sender: String(userId),
      receiver: String(selectedUser._id),
      text,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    socket.emit("send_message", msg);
    setText("");
  };

  return (
   <div className="md:h-[100vh] h-[87vh]  flex bg-green-50 text-green-900 overflow-hidden">
  {/* Mobile menu button */}
  <button
    className="sm:hidden absolute top-4 left-4 z-50 bg-green-600/65 text-white px-3 py-2 rounded-lg shadow"
    onClick={() => setSidebarOpen(true)}
  >
    ☰
  </button>

  {/* Sidebar */}
  <div
    className={`fixed top-0 left-0 h-full z-40 transform bg-white transition-transform duration-300 sm:relative sm:translate-x-0 ${
      sidebarOpen ? "translate-x-0" : "-translate-x-full"
    }`}
  >
    <UserList
      users={users}
      selectUser={setSelectedUser}
      myUserId={userId}
      onClose={() => setSidebarOpen(false)}
    />
  </div>

  {/* Chat main area */}
  <div className="flex-1 flex flex-col ">
    {/* Header */}
    <div className="flex  justify-between items-center bg-white p-4 border-b border-green-200 shadow-sm">
      <span className="font-semibold text-green-700 text-lg text-center flex-1 truncate">
        {selectedUser ? selectedUser.username : "Select a user"}
      </span>
      <button
        onClick={logout}
        className="bg-green-600/40 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition"
      >
        Logout
      </button>
    </div>

    {/* Messages */}
    <div className="flex-1 p-4 overflow-y-auto space-y-3 bg-green-50">
      {messages.map((m, i) => {
        const isSender = String(m.sender) === String(userId);
        return (
          <div
            key={i}
            className={`w-full max-w-xs px-4 py-2  shadow-sm flex flex-col ${
              isSender
                ? "bg-green-600/65 text-white ml-auto items-end rounded-l-2xl rounded-tr-2xl border border-green-400"
                : "bg-white/65 text-green-900 mr-auto items-start rounded-r-2xl rounded-bl-2xl border border-green-200"
            }`}
          >
            <span>{m.text}</span>
            <span className="text-xs opacity-70 mt-1">{m.time}</span>
          </div>
        );
      })}
      <div ref={messagesEndRef} />
    </div>

    {/* Input */}
    {selectedUser && (
      <div className="flex p-4 gap-2 border-t border-green-200 bg-white">
        <input
          className="flex-1 p-3 rounded-xl bg-green-50 text-green-900 outline-none border border-green-300 focus:ring-2 focus:ring-green-400"
          placeholder="Type a message..."
          value={text}
          onChange={(e) => setText(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && sendMessage()}
        />
        <button
          onClick={sendMessage}
          className="bg-green-600/65 text-white px-5 py-2 rounded-xl hover:bg-green-700 transition"
        >
          Send
        </button>
      </div>
    )}
  </div>
</div>

  );
}
