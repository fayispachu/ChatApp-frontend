import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff } from "lucide-react";
import { useEffect, useRef } from "react";
import { cn } from "../utils";

export default function CallModal({ 
  status, 
  onAnswer, 
  onReject, 
  onEnd, 
  remoteUser, 
  localStream, 
  remoteStream,
  isVideoCall
}) {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream]);

  useEffect(() => {
    if (remoteVideoRef.current && remoteStream) {
      remoteVideoRef.current.srcObject = remoteStream;
    }
  }, [remoteStream]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/90 backdrop-blur-xl p-4"
    >
      <div className="w-full max-w-4xl flex flex-col items-center gap-8">
        {/* User Info */}
        <div className="text-center space-y-2">
          <div className="w-24 h-24 rounded-3xl bg-indigo-600 mx-auto flex items-center justify-center text-3xl font-bold text-white shadow-2xl shadow-indigo-500/20">
            {remoteUser?.username.slice(0, 2).toUpperCase()}
          </div>
          <h2 className="text-2xl font-bold text-white">{remoteUser?.username}</h2>
          <p className="text-indigo-400 animate-pulse font-medium">
            {status === "incoming" ? "Incoming Call..." : 
             status === "calling" ? "Calling..." : "On Call"}
          </p>
        </div>

        {/* Video Area */}
        <div className="relative w-full aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl">
          {/* Remote Video */}
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          
          {/* Local Video (Small Overlay) */}
          <div className="absolute top-4 right-4 w-1/4 aspect-video bg-slate-800 rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
            <video 
              ref={localVideoRef} 
              autoPlay 
              playsInline 
              muted 
              className="w-full h-full object-cover"
            />
          </div>

          {!isVideoCall && (
            <div className="absolute inset-0 flex items-center justify-center bg-slate-900/80">
              <Phone className="w-20 h-20 text-indigo-500/30" />
            </div>
          )}
        </div>

        {/* Controls */}
        <div className="flex items-center gap-6">
          {status === "incoming" ? (
            <>
              <button 
                onClick={onAnswer}
                className="w-16 h-16 rounded-2xl bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20"
              >
                <Phone className="w-8 h-8" />
              </button>
              <button 
                onClick={onReject}
                className="w-16 h-16 rounded-2xl bg-red-500 text-white flex items-center justify-center hover:bg-red-400 transition-all shadow-lg shadow-red-500/20"
              >
                <PhoneOff className="w-8 h-8" />
              </button>
            </>
          ) : (
            <button 
              onClick={onEnd}
              className="w-16 h-16 rounded-2xl bg-red-500 text-white flex items-center justify-center hover:bg-red-400 transition-all shadow-lg shadow-red-500/20"
            >
              <PhoneOff className="w-8 h-8" />
            </button>
          )}
        </div>
      </div>
    </motion.div>
  );
}
