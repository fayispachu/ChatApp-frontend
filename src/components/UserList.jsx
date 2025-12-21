import { useState } from "react";

export default function UserList({ users, selectUser, myUserId }) {
  const [activeId, setActiveId] = useState(null);

  const handleSelect = (user) => {
    setActiveId(user._id);
    selectUser(user);
  };

  return (
    <div className="w-64 sm:w-64 bg-black text-cyan-400 flex flex-col border-r border-cyan-700">
      <h2 className="text-xl font-bold p-4 border-b border-cyan-700">
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
              className={`p-3 cursor-pointer flex items-center justify-between rounded mb-1 transition-colors duration-200
                ${isActive ? "bg-cyan-700 text-black" : "hover:bg-cyan-800"}
                ${isMe ? "font-bold" : ""}`}
            >
              <span>
                {u.username} {isMe && "(You)"}
              </span>
            </div>
          );
        })}
      </div>
    </div>
  );
}
