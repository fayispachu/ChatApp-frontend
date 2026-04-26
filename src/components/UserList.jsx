import { useState } from "react";
import { Search, User, LogOut, Settings, X } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import { cn } from "../utils";

export default function UserList({ users, selectUser, myUserId, onlineUsers, typingUsers, logout }) {
  const [search, setSearch] = useState("");
  const [activeId, setActiveId] = useState(null);

  const filteredUsers = users.filter(u => 
    u.username.toLowerCase().includes(search.toLowerCase())
  );

  const handleSelect = (user) => {
    setActiveId(user._id);
    selectUser(user);
  };

  const getInitials = (name) => {
    return name.slice(0, 2).toUpperCase();
  };

  return (
    <div className="w-80 h-full flex flex-col bg-slate-900 border-r border-slate-800">
      {/* Sidebar Header */}
      <div className="p-6 space-y-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-indigo-600 flex items-center justify-center shadow-lg shadow-indigo-500/20">
              <User className="text-white w-6 h-6" />
            </div>
            <h2 className="text-xl font-bold text-white tracking-tight">Messages</h2>
          </div>
          <div className="flex items-center gap-1">
            <button 
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Settings"
            >
              <Settings className="w-5 h-5" />
            </button>
            <button 
              onClick={logout}
              className="p-2 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800 transition-colors"
              title="Logout"
            >
              <LogOut className="w-5 h-5" />
            </button>
          </div>
        </div>

        <div className="relative group">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-500 group-focus-within:text-indigo-500 transition-colors" />
          <input
            placeholder="Search conversations..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-slate-800/50 border border-slate-700 text-sm text-white placeholder-slate-500 outline-none focus:border-indigo-500 transition-all"
          />
        </div>
      </div>

      {/* User List */}
      <div className="flex-1 overflow-y-auto px-3 pb-4 space-y-1 custom-scrollbar">
        <AnimatePresence mode="popLayout">
          {filteredUsers.map((u) => {
            const isActive = activeId === u._id;
            const isMe = u._id === myUserId;
            const isOnline = onlineUsers.includes(String(u._id));
            const isTyping = typingUsers.includes(String(u._id));

            return (
              <motion.div
                layout
                initial={{ opacity: 0, x: -10 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, scale: 0.95 }}
                key={u._id}
                onClick={() => handleSelect(u)}
                className={cn(
                  "group relative p-3 flex items-center gap-4 cursor-pointer rounded-2xl transition-all duration-200",
                  isActive 
                    ? "bg-indigo-600 shadow-lg shadow-indigo-500/20" 
                    : "hover:bg-slate-800/80"
                )}
              >
                {/* Avatar */}
                <div className="relative flex-shrink-0">
                  <div className={cn(
                    "w-12 h-12 rounded-xl flex items-center justify-center text-sm font-bold shadow-inner transition-colors",
                    isActive ? "bg-indigo-500/50 text-white" : "bg-slate-800 text-slate-300 group-hover:bg-slate-700"
                  )}>
                    {getInitials(u.username)}
                  </div>
                  {isOnline && (
                    <span className="absolute -bottom-0.5 -right-0.5 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full shadow-sm" />
                  )}
                </div>

                {/* User Info */}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <h3 className={cn(
                      "text-sm font-semibold truncate",
                      isActive ? "text-white" : "text-slate-200"
                    )}>
                      {u.username} {isMe && "(You)"}
                    </h3>
                  </div>
                  <p className={cn(
                    "text-xs truncate transition-colors",
                    isActive ? "text-indigo-100" : (isTyping ? "text-emerald-400 font-medium animate-pulse" : "text-slate-500")
                  )}>
                    {isTyping ? "typing..." : (isOnline ? "Online" : "Offline")}
                  </p>
                </div>
                
                {isActive && (
                  <motion.div 
                    layoutId="active-indicator"
                    className="absolute left-0 w-1 h-6 bg-white rounded-r-full"
                  />
                )}
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>
    </div>
  );
}
