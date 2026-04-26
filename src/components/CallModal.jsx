import { motion, AnimatePresence } from "framer-motion";
import { Phone, PhoneOff, Video, VideoOff, Mic, MicOff, Settings } from "lucide-react";
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
      <div className="w-full max-w-lg flex flex-col items-center gap-6">
        {/* User Info */}
        <div className="text-center space-y-2">
          <div className="w-16 h-16 rounded-2xl bg-indigo-600 mx-auto flex items-center justify-center text-2xl font-bold text-white shadow-lg shadow-indigo-500/20">
            {remoteUser?.username.slice(0, 2).toUpperCase()}
          </div>
          <h2 className="text-xl font-bold text-white">{remoteUser?.username}</h2>
          <p className="text-indigo-400 animate-pulse text-sm font-medium">
            {status === "incoming" ? "Incoming Call..." : 
             status === "calling" ? "Calling..." : "On Call"}
          </p>
        </div>

        {/* Video Area */}
        <div className="relative w-full aspect-video bg-slate-900 rounded-2xl overflow-hidden border border-slate-800 shadow-2xl max-h-[40vh]">
          {/* Remote Video */}
          <video 
            ref={remoteVideoRef} 
            autoPlay 
            playsInline 
            className="w-full h-full object-cover"
          />
          
          {/* Local Video (Small Overlay) */}
          <div className="absolute top-3 right-3 w-1/4 aspect-video bg-slate-800 rounded-xl overflow-hidden border border-slate-700 shadow-xl">
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
              <Phone className="w-12 h-12 text-indigo-500/30" />
            </div>
          )}
        </div>

        {/* Controls Container */}
        <div className="w-full flex flex-col items-center gap-6">
          {/* Call Actions */}
          <div className="flex items-center gap-6">
            {status === "incoming" ? (
              <>
                <button 
                  onClick={onAnswer}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-14 h-14 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/20 group-hover:scale-110">
                    <Phone className="w-6 h-6" />
                  </div>
                  <span className="text-emerald-400 font-bold text-[10px] uppercase">Attend</span>
                </button>
                <button 
                  onClick={onReject}
                  className="flex flex-col items-center gap-2 group"
                >
                  <div className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-400 transition-all shadow-lg shadow-red-500/20 group-hover:scale-110">
                    <PhoneOff className="w-6 h-6" />
                  </div>
                  <span className="text-red-400 font-bold text-[10px] uppercase">Decline</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-4">
                <button className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 transition-all">
                  <Mic className="w-5 h-5" />
                </button>
                <button className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 transition-all">
                  <Video className="w-5 h-5" />
                </button>
                <button 
                  onClick={onEnd}
                  className="w-14 h-14 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-400 transition-all shadow-lg shadow-red-500/20 hover:scale-110"
                >
                  <PhoneOff className="w-6 h-6" />
                </button>
                <button className="w-12 h-12 rounded-full bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 transition-all">
                  <Settings className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
