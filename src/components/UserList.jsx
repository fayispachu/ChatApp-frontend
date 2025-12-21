import { useState, useEffect, useRef } from "react";

export default function UserList({ users, selectUser, myUserId, onClose }) {
  const [activeId, setActiveId] = useState(null);
  const listRef = useRef();

  const handleSelect = (user) => {
    setActiveId(user._id);
    selectUser(user);
    if (onClose) onClose(); // Close sidebar on mobile after selection
  };

  // Close sidebar if click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (listRef.current && !listRef.current.contains(event.target) && onClose) {
        onClose();
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [onClose]);

  return (
    <div
      ref={listRef}
      className="w-64 sm:w-64 bg-black text-cyan-400 flex flex-col border-r border-cyan-700 h-[100vh]"
    >
      <h2 className="text-xl font-bold p-4 border-b border-cyan-700 text-center">
        Users
      </h2>
      <div className="flex-1 overflow-y-auto">
        {users.map((u) => {
          const isActive = activeId === u._id;
          const isMe = u._id === myUserId;

          return (
            <div
              key={u._id}
              onClick={() => handleSelect(u)}
              className={`p-3 cursor-pointer flex items-center justify-center rounded mb-1 transition-colors duration-200
                ${isActive ? "bg-cyan-700 text-black" : "hover:bg-cyan-800"}
                ${isMe ? "font-bold text-cyan-400" : ""}`}
            >
              {u.username} {isMe && "(You)"}
            </div>
          );
        })}
      </div>
    </div>
  );
}
