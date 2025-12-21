import { useState } from "react";

export default function UserList({ users, selectUser }) {
  const [activeId, setActiveId] = useState(null);

  const handleSelect = (user) => {
    setActiveId(user._id);
    selectUser(user);
  };

  return (
    <div className="w-64 bg-black text-white flex flex-col">
      <h2 className="text-xl font-semibold p-4 border-b border-gray-700">
        Users
      </h2>
      <div className="flex-1 overflow-y-auto">
        {users.map((u) => (
          <div
            key={u._id}
            onClick={() => handleSelect(u)}
            className={`p-3 cursor-pointer border-b border-gray-800 flex items-center justify-between ${
              activeId === u._id ? "bg-gray-800" : "hover:bg-gray-900"
            }`}
          >
            <span>{u.username}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
