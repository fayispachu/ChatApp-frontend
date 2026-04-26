import { useEffect, useState, useRef } from "react";
import API from "../api/api";
import { connectSocket } from "../socket/socket";
import UserList from "../components/UserList";
import CallModal from "../components/CallModal";
import { motion, AnimatePresence } from "framer-motion";
import { Send, Menu, X, MoreVertical, Phone, Video, Smile, Paperclip, Loader2, Download, Image as ImageIcon, FileText, User } from "lucide-react";
import { cn } from "../utils";
import EmojiPicker from "emoji-picker-react";

export default function Chat({ userId, logout }) {
  const [socket, setSocket] = useState(null);
  const [users, setUsers] = useState([]);
  const [groups, setGroups] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [isCreatingGroup, setIsCreatingGroup] = useState(false);
  const [groupName, setGroupName] = useState("");
  const [groupMembers, setGroupMembers] = useState([]);

  const selectedUserRef = useRef(selectedUser);
  const selectedGroupRef = useRef(selectedGroup);
  const usersRef = useRef(users);

  useEffect(() => {
    selectedUserRef.current = selectedUser;
  }, [selectedUser]);

  useEffect(() => {
    selectedGroupRef.current = selectedGroup;
  }, [selectedGroup]);

  useEffect(() => {
    usersRef.current = users;
  }, [users]);

  // Call States
  const [callStatus, setCallStatus] = useState(null); // 'calling', 'incoming', 'active', null
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [caller, setCaller] = useState(null);
  const [incomingOffer, setIncomingOffer] = useState(null);
  const [isVideoCall, setIsVideoCall] = useState(true);
  const [isMuted, setIsMuted] = useState(false);
  const [isVideoOff, setIsVideoOff] = useState(false);

  const messagesEndRef = useRef(null);
  const typingTimeoutRef = useRef(null);
  const fileInputRef = useRef(null);
  const peerRef = useRef(null);

  const scrollToBottom = () =>
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });

  // Connect socket
  useEffect(() => {
    if (!userId) return;
    const s = connectSocket();
    setSocket(s);

    s.on("online_users", (users) => setOnlineUsers(users));
    s.on("user_status", ({ userId, status }) => {
      setOnlineUsers(prev => status === "online" ? [...new Set([...prev, String(userId)])] : prev.filter(id => id !== String(userId)));
    });
    s.on("display_typing", ({ sender }) => setTypingUsers(prev => [...new Set([...prev, String(sender)])]));
    s.on("hide_typing", ({ sender }) => setTypingUsers(prev => prev.filter(id => id !== String(sender))));
    
    s.on("receive_message", (msg) => {
      const currentGroup = selectedGroupRef.current;
      const currentUser = selectedUserRef.current;

      const isForCurrentGroup = currentGroup && msg.groupId && String(msg.groupId) === String(currentGroup._id);
      const isForCurrentUser = currentUser && (
        String(msg.sender) === String(currentUser._id) || 
        String(msg.receiver) === String(currentUser._id)
      );

      if (isForCurrentGroup || isForCurrentUser) {
        setMessages((prev) => [...prev, msg]);
      }
    });

    // --- Calling Listeners ---
    s.on("incoming_call", ({ sender, offer, isVideo }) => {
      const targetUser = usersRef.current.find(u => String(u._id) === String(sender));
      setCaller(targetUser);
      setIncomingOffer(offer);
      setIsVideoCall(isVideo);
      setCallStatus("incoming");
    });

    s.on("call_answered", async ({ answer }) => {
      if (peerRef.current) {
        await peerRef.current.setRemoteDescription(new RTCSessionDescription(answer));
        setCallStatus("active");
      }
    });

    s.on("ice_candidate", async ({ candidate }) => {
      if (peerRef.current && candidate) {
        try {
          await peerRef.current.addIceCandidate(new RTCIceCandidate(candidate));
        } catch (e) { console.error("Error adding ice candidate", e); }
      }
    });

    s.on("call_ended", () => endCallLocally());

    return () => {
      s.off("online_users");
      s.off("user_status");
      s.off("display_typing");
      s.off("hide_typing");
      s.off("receive_message");
      s.off("incoming_call");
      s.off("call_answered");
      s.off("ice_candidate");
      s.off("call_ended");
      
      // Cleanup streams on unmount
      endCallLocally();
      s.disconnect();
    };
  }, [userId, selectedUser, selectedGroup, users]);

  // Load data
  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const { data } = await API.get("/users");
        setUsers(data.filter((u) => u._id !== userId));
      } catch (err) { console.error(err); }
    };
    const fetchGroups = async () => {
      try {
        const { data } = await API.get(`/groups/user/${userId}`);
        setGroups(data);
        if (socket) socket.emit("join_groups", data.map(g => g._id));
      } catch (err) { console.error(err); }
    };
    fetchUsers();
    fetchGroups();
  }, [userId, socket]);

  // Load messages
  useEffect(() => {
    const fetchMessages = async () => {
      if (selectedUser) {
        try {
          const { data } = await API.get(`/messages/${userId}/${selectedUser._id}`);
          setMessages(data);
        } catch (err) { console.error(err); }
      } else if (selectedGroup) {
        try {
          const { data } = await API.get(`/groups/${selectedGroup._id}/messages`);
          setMessages(data);
        } catch (err) { console.error(err); }
      }
    };
    fetchMessages();
  }, [selectedUser, selectedGroup, userId]);

  useEffect(scrollToBottom, [messages]);

  const handleSelectUser = (user) => {
    setSelectedGroup(null);
    setSelectedUser(user);
  };

  const handleSelectGroup = (group) => {
    setSelectedUser(null);
    setSelectedGroup(group);
  };

  const handleCreateGroup = async () => {
    if (!groupName || groupMembers.length === 0) return;
    try {
      const { data } = await API.post("/groups", {
        name: groupName,
        members: [...groupMembers, userId],
        admin: userId
      });
      setGroups(prev => [...prev, data]);
      socket.emit("join_groups", [data._id]);
      setIsCreatingGroup(false);
      setGroupName("");
      setGroupMembers([]);
    } catch (err) { console.error(err); }
  };

  // --- WebRTC Logic ---
  const createPeer = (targetUserId) => {
    const pc = new RTCPeerConnection({
      iceServers: [{ urls: "stun:stun.l.google.com:19302" }]
    });

    pc.onicecandidate = (e) => {
      if (e.candidate) {
        socket.emit("ice_candidate", { receiver: targetUserId, candidate: e.candidate });
      }
    };

    pc.ontrack = (e) => {
      setRemoteStream(e.streams[0]);
    };

    peerRef.current = pc;
    return pc;
  };

  const startCall = async (video = true) => {
    if (!selectedUser) return;
    setCallStatus("calling"); // Set status immediately
    setIsVideoCall(video);
    setIsMuted(false);
    setIsVideoOff(false);
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
      setLocalStream(stream);

      const pc = createPeer(selectedUser._id);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call_user", { 
        receiver: String(selectedUser._id), 
        offer, 
        isVideo: video 
      });
    } catch (err) {
      console.error("Failed to start call", err);
      setCallStatus(null); // Reset on failure
      alert("Please allow camera/microphone access");
    }
  };

  const answerCall = async () => {
    if (!caller || !incomingOffer) return;
    setCallStatus("active"); // Set status immediately
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ 
        video: isVideoCall, 
        audio: true 
      });
      setLocalStream(stream);

      const pc = createPeer(caller._id);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      await pc.setRemoteDescription(new RTCSessionDescription(incomingOffer));
      const answer = await pc.createAnswer();
      await pc.setLocalDescription(answer);

      socket.emit("answer_call", { receiver: caller._id, answer });
    } catch (err) {
      console.error("Failed to answer call", err);
      endCallLocally();
    }
  };

  const endCall = () => {
    const targetId = callStatus === "incoming" ? caller?._id : selectedUser?._id;
    if (targetId) socket.emit("end_call", { receiver: targetId });
    endCallLocally();
  };

  const toggleMute = () => {
    if (localStream) {
      const audioTrack = localStream.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !audioTrack.enabled;
        setIsMuted(!audioTrack.enabled);
      }
    }
  };

  const toggleVideo = () => {
    if (localStream) {
      const videoTrack = localStream.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !videoTrack.enabled;
        setIsVideoOff(!videoTrack.enabled);
      }
    }
  };

  const endCallLocally = () => {
    // 🛑 STOP all tracks to release Camera/Mic
    if (localStream) {
      localStream.getTracks().forEach(track => {
        track.stop();
        track.enabled = false;
      });
      setLocalStream(null);
    }
    
    if (remoteStream) {
      remoteStream.getTracks().forEach(track => track.stop());
      setRemoteStream(null);
    }

    if (peerRef.current) {
      peerRef.current.getSenders().forEach(sender => {
        if (sender.track) sender.track.stop();
      });
      peerRef.current.close();
      peerRef.current = null;
    }

    setCallStatus(null);
    setIncomingOffer(null);
    setCaller(null);
    setIsMuted(false);
    setIsVideoOff(false);
  };

  // --- Message Logic ---
  const sendMessage = (fileData = null) => {
    if (!socket || (!selectedUser && !selectedGroup)) return;
    if (!text.trim() && !fileData) return;

    const msgData = {
      sender: userId,
      text: text.trim(),
      fileUrl: fileData?.fileUrl,
      fileType: fileData?.fileType,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    if (selectedGroup) {
      msgData.groupId = String(selectedGroup._id);
    } else {
      msgData.receiver = String(selectedUser._id);
    }

    socket.emit("send_message", msgData);
    if (selectedUser) socket.emit("stop_typing", { receiver: selectedUser._id });
    setText("");
    setShowEmoji(false);
  };

  const handleInputChange = (e) => {
    setText(e.target.value);
    if (!socket || !selectedUser) return;
    socket.emit("typing", { receiver: selectedUser._id });
    if (typingTimeoutRef.current) clearTimeout(typingTimeoutRef.current);
    typingTimeoutRef.current = setTimeout(() => socket.emit("stop_typing", { receiver: selectedUser._id }), 2000);
  };

  const handleFileUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setUploading(true);
    const formData = new FormData();
    formData.append("file", file);
    try {
      const res = await API.post("/upload", formData, { headers: { "Content-Type": "multipart/form-data" } });
      sendMessage(res.data);
    } catch (err) { alert("Upload failed"); } finally { setUploading(false); }
  };

  const [menuOpen, setMenuOpen] = useState(false);

  const isSelectedUserOnline = selectedUser && onlineUsers.includes(String(selectedUser._id));
  const isSelectedUserTyping = selectedUser && typingUsers.includes(String(selectedUser._id));

  const handleBlockUser = () => {
    alert(`You have blocked ${selectedUser?.username}. This is a demonstration feature.`);
    setMenuOpen(false);
  };

  const handleViewProfile = () => {
    alert(`Viewing ${selectedUser?.username}'s profile. This is a demonstration feature.`);
    setMenuOpen(false);
  };

  const handleOpenSettings = () => {
    alert("Opening Settings. This is a demonstration feature.");
  };

  return (
    <div className="fixed inset-0 flex h-[100dvh] bg-[#0f172a] text-slate-200 overflow-hidden font-sans">
      <AnimatePresence>
        {callStatus && (
          <CallModal 
            status={callStatus} 
            remoteUser={callStatus === "incoming" ? caller : selectedUser}
            localStream={localStream}
            remoteStream={remoteStream}
            onAnswer={answerCall}
            onReject={endCall}
            onEnd={endCall}
            isVideoCall={isVideoCall}
            isMuted={isMuted}
            isVideoOff={isVideoOff}
            onToggleMute={toggleMute}
            onToggleVideo={toggleVideo}
          />
        )}
      </AnimatePresence>

      {/* Sidebar Overlay for Mobile */}
      <AnimatePresence>
        {!sidebarOpen && (
          <motion.button
            initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            onClick={() => setSidebarOpen(true)}
            className="md:hidden absolute top-4 left-4 z-50 p-2 bg-slate-800 rounded-xl shadow-lg border border-slate-700"
          >
            <Menu className="w-6 h-6 text-indigo-400" />
          </motion.button>
        )}
      </AnimatePresence>

      <div className={cn("fixed inset-y-0 left-0 z-40 transform transition-transform duration-300 md:relative md:translate-x-0", sidebarOpen ? "translate-x-0" : "-translate-x-full")}>
        <UserList 
          users={users} 
          groups={groups}
          selectUser={handleSelectUser} 
          selectGroup={handleSelectGroup}
          myUserId={userId} 
          onlineUsers={onlineUsers} 
          typingUsers={typingUsers} 
          logout={logout}
          onSettings={handleOpenSettings}
          onCreateGroup={() => setIsCreatingGroup(true)}
        />
        <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute top-6 right-[-50px] p-2 bg-slate-900 rounded-r-xl border border-l-0 border-slate-800 text-slate-400"><X className="w-6 h-6" /></button>
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        {selectedUser || selectedGroup ? (
          <>
            {/* Header */}
            <div className="h-20 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 shadow-sm relative z-30">
              <div className="flex items-center gap-4">
                <button onClick={() => setSidebarOpen(true)} className="md:hidden p-2 text-slate-400 hover:text-white"><Menu className="w-6 h-6" /></button>
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-indigo-600 flex items-center justify-center text-white font-bold shadow-lg shadow-indigo-500/20">
                    {(selectedUser?.username || selectedGroup?.name).slice(0, 2).toUpperCase()}
                  </div>
                  {selectedUser && onlineUsers.includes(String(selectedUser._id)) && <span className="absolute bottom-0 right-0 w-3.5 h-3.5 bg-emerald-500 border-2 border-slate-900 rounded-full" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white tracking-tight leading-none mb-1">
                    {selectedUser?.username || selectedGroup?.name}
                  </h2>
                  <p className="text-xs text-slate-500 font-medium">
                    {selectedUser ? (onlineUsers.includes(String(selectedUser._id)) ? "Active Now" : "Offline") : `${selectedGroup?.members?.length} members`}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <button 
                  onClick={() => startCall(false)}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                  title="Audio Call"
                >
                  <Phone className="w-5 h-5" />
                </button>
                <button 
                  onClick={() => startCall(true)}
                  className="p-2.5 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-indigo-500/10 transition-all"
                  title="Video Call"
                >
                  <Video className="w-5 h-5" />
                </button>
                <div className="relative">
                  <button 
                    onClick={() => setMenuOpen(!menuOpen)}
                    className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all"
                  >
                    <MoreVertical className="w-5 h-5" />
                  </button>

                  <AnimatePresence>
                    {menuOpen && (
                      <motion.div 
                        initial={{ opacity: 0, scale: 0.95, y: 10 }}
                        animate={{ opacity: 1, scale: 1, y: 0 }}
                        exit={{ opacity: 0, scale: 0.95, y: 10 }}
                        className="absolute right-0 mt-2 w-48 bg-slate-900 border border-slate-800 rounded-2xl shadow-2xl overflow-hidden z-50 p-1"
                      >
                        <button 
                          onClick={handleViewProfile}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors flex items-center gap-3"
                        >
                          <User className="w-4 h-4" /> View Profile
                        </button>
                        <button 
                          onClick={handleBlockUser}
                          className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors flex items-center gap-3"
                        >
                          <X className="w-4 h-4 text-red-500" /> Block User
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-3 sm:p-6 space-y-4 sm:space-y-6 bg-transparent custom-scrollbar">
              <AnimatePresence initial={false}>
                {messages.map((m, i) => {
                  const isSender = String(m.sender) === String(userId);
                  return (
                    <motion.div key={m._id || i} initial={{ opacity: 0, y: 10, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} className={cn("flex w-full", isSender ? "justify-end" : "justify-start")}>
                      <div className={cn("max-w-[70%] space-y-1", isSender ? "items-end" : "items-start")}>
                        <div className={cn("px-5 py-3 rounded-3xl shadow-sm relative overflow-hidden", isSender ? "bg-indigo-600 text-white rounded-tr-none" : "bg-slate-800 text-slate-100 rounded-tl-none border border-slate-700")}>
                          {m.fileUrl && (
                            <div className="mb-2">
                              {m.fileType === "image" ? <img src={m.fileUrl} alt="shared" className="max-w-full rounded-xl shadow-md border border-white/10" /> : (
                                <div className="flex items-center gap-3 p-3 bg-slate-900/50 rounded-xl border border-white/5">
                                  <FileText className="w-6 h-6 text-indigo-400" />
                                  <div className="flex-1 min-w-0"><p className="text-xs truncate">File Attachment</p><a href={m.fileUrl} target="_blank" rel="noreferrer" className="text-[10px] text-indigo-300 hover:underline">Download</a></div>
                                </div>
                              )}
                            </div>
                          )}
                          {m.text && <p className="text-sm leading-relaxed whitespace-pre-wrap break-words">{m.text}</p>}
                        </div>
                        <p className={cn("text-[10px] text-slate-500 px-2", isSender ? "text-right" : "text-left")}>{m.time}</p>
                      </div>
                    </motion.div>
                  );
                })}
              </AnimatePresence>
              <div ref={messagesEndRef} />
            </div>

            <div className="p-3 sm:p-6 pt-1 sm:pt-2 bg-transparent relative z-20">
              <div className="relative">
                <AnimatePresence>
                  {showEmoji && (
                    <motion.div initial={{ opacity: 0, y: 20, scale: 0.95 }} animate={{ opacity: 1, y: 0, scale: 1 }} exit={{ opacity: 0, y: 20, scale: 0.95 }} className="absolute bottom-full right-0 mb-4 z-50">
                      <EmojiPicker onEmojiClick={(d) => setText(p => p + d.emoji)} theme="dark" width={300} height={400} />
                    </motion.div>
                  )}
                </AnimatePresence>
                <div className="glass p-2 rounded-2xl flex items-center gap-2 shadow-2xl relative z-10">
                  <input type="file" ref={fileInputRef} onChange={handleFileUpload} className="hidden" />
                  <button onClick={() => fileInputRef.current.click()} disabled={uploading} className="p-3 rounded-xl text-slate-400 hover:text-indigo-400 hover:bg-slate-800 transition-all disabled:opacity-50">
                    {uploading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Paperclip className="w-5 h-5" />}
                  </button>
                  <input 
                    className="flex-1 bg-transparent py-3 px-2 text-white placeholder-slate-500 outline-none text-sm" 
                    placeholder={`Message ${selectedUser?.username || selectedGroup?.name}...`} 
                    value={text} 
                    onChange={handleInputChange} 
                    onKeyDown={(e) => e.key === "Enter" && sendMessage()} 
                  />
                  <div className="flex items-center gap-1 pr-1">
                    <button onClick={() => setShowEmoji(!showEmoji)} className={cn("p-3 rounded-xl transition-all", showEmoji ? "text-indigo-400 bg-slate-800" : "text-slate-400 hover:text-indigo-400 hover:bg-slate-800")}><Smile className="w-5 h-5" /></button>
                    <button onClick={() => sendMessage()} disabled={(!text.trim() && !uploading)} className={cn("p-3 rounded-xl transition-all shadow-lg", (text.trim() || uploading) ? "bg-indigo-600 text-white shadow-indigo-500/20 hover:bg-indigo-500" : "bg-slate-800 text-slate-600 cursor-not-allowed")}>
                      <Send className="w-5 h-5" />
                    </button>
                  </div>
                </div>
              </div>
            </div>
          </>
        ) : (
          <div className="flex-1 flex flex-col items-center justify-center p-8 text-center space-y-6">
            <div className="w-24 h-24 rounded-3xl bg-slate-900/50 flex items-center justify-center border border-slate-800 shadow-xl"><Send className="w-10 h-10 text-indigo-500/50" /></div>
            <div className="space-y-2">
              <h2 className="text-2xl font-bold text-white">Your Messages</h2>
              <p className="text-slate-500 max-w-xs mx-auto">Select a friend from the sidebar to start a secure conversation</p>
            </div>
          </div>
        )}
      </div>
      {/* Create Group Modal */}
      <AnimatePresence>
        {isCreatingGroup && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }} className="fixed inset-0 z-[60] flex items-center justify-center bg-slate-950/80 backdrop-blur-sm p-4">
            <motion.div initial={{ scale: 0.95, y: 20 }} animate={{ scale: 1, y: 0 }} className="w-full max-w-md bg-slate-900 border border-slate-800 rounded-3xl shadow-2xl overflow-hidden p-6">
              <h3 className="text-xl font-bold text-white mb-6">Create New Group</h3>
              <div className="space-y-4">
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Group Name</label>
                  <input value={groupName} onChange={(e) => setGroupName(e.target.value)} placeholder="Enter group name..." className="w-full bg-slate-800 border border-slate-700 rounded-xl px-4 py-3 text-white focus:border-indigo-500 outline-none transition-all" />
                </div>
                <div>
                  <label className="text-xs font-bold text-slate-500 uppercase tracking-widest mb-2 block">Select Members</label>
                  <div className="max-h-48 overflow-y-auto space-y-1 p-1 bg-slate-800/50 rounded-xl border border-slate-700">
                    {users.map(u => (
                      <label key={u._id} className="flex items-center gap-3 p-2.5 hover:bg-slate-700/50 rounded-lg cursor-pointer transition-colors">
                        <input type="checkbox" checked={groupMembers.includes(u._id)} onChange={(e) => e.target.checked ? setGroupMembers([...groupMembers, u._id]) : setGroupMembers(groupMembers.filter(id => id !== u._id))} className="w-4 h-4 rounded border-slate-600 bg-slate-800 text-indigo-600 focus:ring-indigo-500" />
                        <span className="text-slate-200 text-sm font-medium">{u.username}</span>
                      </label>
                    ))}
                  </div>
                </div>
                <div className="flex gap-3 pt-4">
                  <button onClick={() => setIsCreatingGroup(false)} className="flex-1 px-4 py-3 rounded-xl bg-slate-800 text-slate-300 font-bold hover:bg-slate-700 transition-all">Cancel</button>
                  <button onClick={handleCreateGroup} disabled={!groupName || groupMembers.length === 0} className="flex-1 px-4 py-3 rounded-xl bg-indigo-600 text-white font-bold hover:bg-indigo-500 transition-all disabled:opacity-50 disabled:cursor-not-allowed">Create Group</button>
                </div>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

