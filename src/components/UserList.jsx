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
  className="w-64 bg-white text-green-900 flex flex-col border-r border-green-200 h-[100vh] shadow-md"
>
  <h2 className="text-xl font-bold p-4 border-b border-green-200 text-center text-green-700">
    Users
  </h2>

  <div className="flex-1 overflow-y-auto p-2 space-y-1">
    {users.map((u) => {
      const isActive = activeId === u._id;
      const isMe = u._id === myUserId;

      return (
        <div
          key={u._id}
          onClick={() => handleSelect(u)}
          className={`p-3 cursor-pointer rounded-xl text-center transition-all
            ${
              isActive
                ? "bg-green-600/65 text-white shadow"
                : "hover:bg-green-100"
            }
            ${isMe ? "font-bold" : ""}`}
        >
          {u.username} {isMe && "(You)"}
        </div>
      );
    })}
  </div>
</div>

  );
}
