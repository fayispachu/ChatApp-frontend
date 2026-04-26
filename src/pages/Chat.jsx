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
  const [selectedUser, setSelectedUser] = useState(null);
  const [messages, setMessages] = useState([]);
  const [text, setText] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [onlineUsers, setOnlineUsers] = useState([]);
  const [typingUsers, setTypingUsers] = useState([]);
  const [showEmoji, setShowEmoji] = useState(false);
  const [uploading, setUploading] = useState(false);

  // Call States
  const [callStatus, setCallStatus] = useState(null); // 'calling', 'incoming', 'active', null
  const [localStream, setLocalStream] = useState(null);
  const [remoteStream, setRemoteStream] = useState(null);
  const [caller, setCaller] = useState(null);
  const [incomingOffer, setIncomingOffer] = useState(null);

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
      const formatted = { ...msg, sender: String(msg.sender), receiver: String(msg.receiver) };
      if ((formatted.sender === String(userId) && formatted.receiver === String(selectedUser?._id)) || (formatted.sender === String(selectedUser?._id) && formatted.receiver === String(userId))) {
        setMessages((prev) => [...prev, formatted]);
      }
    });

    // --- Calling Listeners ---
    s.on("incoming_call", ({ sender, offer }) => {
      setCaller(users.find(u => String(u._id) === String(sender)));
      setIncomingOffer(offer);
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
      s.disconnect();
    };
  }, [userId, selectedUser, users]);

  // Load users
  useEffect(() => {
    API.get("/users").then((res) => setUsers(res.data)).catch(console.error);
  }, []);

  // Load messages
  useEffect(() => {
    if (!selectedUser) return;
    setMessages([]);
    API.get(`/messages/${selectedUser._id}`).then((res) => {
      setMessages(res.data.map((m) => ({ ...m, sender: String(m.sender), receiver: String(m.receiver) })));
    }).catch(console.error);
  }, [selectedUser]);

  useEffect(scrollToBottom, [messages]);

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
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video, audio: true });
      setLocalStream(stream);

      const pc = createPeer(selectedUser._id);
      stream.getTracks().forEach(track => pc.addTrack(track, stream));

      const offer = await pc.createOffer();
      await pc.setLocalDescription(offer);

      socket.emit("call_user", { receiver: selectedUser._id, offer });
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
      const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
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

  const endCallLocally = () => {
    if (localStream) {
      localStream.getTracks().forEach(track => track.stop());
      setLocalStream(null);
    }
    if (peerRef.current) {
      peerRef.current.close();
      peerRef.current = null;
    }
    setRemoteStream(null);
    setCallStatus(null);
    setIncomingOffer(null);
    setCaller(null);
  };

  // --- Message Logic ---
  const sendMessage = (fileData = null) => {
    if (!socket || !selectedUser) return;
    if (!text.trim() && !fileData) return;

    const msg = {
      sender: String(userId),
      receiver: String(selectedUser._id),
      text: text.trim(),
      fileUrl: fileData?.fileUrl,
      fileType: fileData?.fileType,
      time: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    socket.emit("send_message", msg);
    socket.emit("stop_typing", { receiver: selectedUser._id });
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

  return (
    <div className="flex h-screen bg-[#0f172a] text-slate-200 overflow-hidden font-sans">
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
            isVideoCall={true}
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
        <UserList users={users} selectUser={setSelectedUser} myUserId={userId} onlineUsers={onlineUsers} typingUsers={typingUsers} logout={logout} />
        <button onClick={() => setSidebarOpen(false)} className="md:hidden absolute top-6 right-[-50px] p-2 bg-slate-900 rounded-r-xl border border-l-0 border-slate-800 text-slate-400"><X className="w-6 h-6" /></button>
      </div>

      <div className="flex-1 flex flex-col min-w-0 relative">
        {selectedUser ? (
          <>
            <div className="h-20 flex items-center justify-between px-6 bg-slate-900/50 backdrop-blur-md border-b border-slate-800 shadow-sm relative z-30">
              <div className="flex items-center gap-4">
                <div className="relative">
                  <div className="w-12 h-12 rounded-2xl bg-slate-800 flex items-center justify-center font-bold text-indigo-400 shadow-inner">{selectedUser.username.slice(0, 2).toUpperCase()}</div>
                  {isSelectedUserOnline && <span className="absolute bottom-0 right-0 w-3 h-3 bg-emerald-500 border-2 border-slate-900 rounded-full" />}
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white leading-tight">{selectedUser.username}</h2>
                  <p className={cn("text-xs transition-colors", isSelectedUserTyping ? "text-emerald-400 animate-pulse font-medium" : "text-slate-500")}>
                    {isSelectedUserTyping ? "typing..." : (isSelectedUserOnline ? "Online now" : "Offline")}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-2 relative">
                <button onClick={() => startCall(false)} className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all" title="Audio Call"><Phone className="w-5 h-5" /></button>
                <button onClick={() => startCall(true)} className="p-2.5 rounded-xl text-slate-400 hover:text-white hover:bg-slate-800 transition-all" title="Video Call"><Video className="w-5 h-5" /></button>
                
                <div className="relative">
                  <button 
                    onClick={() => setMenuOpen(!menuOpen)}
                    className={cn("p-2.5 rounded-xl transition-all", menuOpen ? "text-white bg-slate-800" : "text-slate-400 hover:text-white hover:bg-slate-800")}
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
                        <button className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors flex items-center gap-3">
                          <User className="w-4 h-4" /> View Profile
                        </button>
                        <button className="w-full text-left px-4 py-2.5 text-sm text-slate-300 hover:bg-slate-800 hover:text-white rounded-xl transition-colors flex items-center gap-3">
                          <X className="w-4 h-4 text-red-500" /> Block User
                        </button>
                      </motion.div>
                    )}
                  </AnimatePresence>
                </div>
              </div>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-6 bg-transparent custom-scrollbar">
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

            <div className="p-6 pt-2 bg-transparent relative z-20">
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
                  <input className="flex-1 bg-transparent py-3 px-2 text-white placeholder-slate-500 outline-none text-sm" placeholder={`Message ${selectedUser.username}...`} value={text} onChange={handleInputChange} onKeyDown={(e) => e.key === "Enter" && sendMessage()} />
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
    </div>
  );
}

