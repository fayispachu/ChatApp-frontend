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
  isVideoCall,
  isMuted,
  isVideoOff,
  onToggleMute,
  onToggleVideo
}) {
  const localVideoRef = useRef();
  const remoteVideoRef = useRef();

  useEffect(() => {
    if (localVideoRef.current && localStream) {
      localVideoRef.current.srcObject = localStream;
    }
  }, [localStream, isVideoOff]);

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
      className="fixed inset-0 z-[100] flex items-center justify-center bg-slate-950/95 backdrop-blur-xl p-4 overflow-y-auto"
    >
      <div className="w-full max-w-lg flex flex-col items-center gap-4 sm:gap-8 my-auto">
        {/* User Info */}
        <div className="text-center space-y-2 sm:space-y-3">
          <motion.div 
            initial={{ scale: 0.9 }}
            animate={{ scale: 1 }}
            className="w-16 h-16 sm:w-20 sm:h-20 rounded-3xl bg-indigo-600 mx-auto flex items-center justify-center text-2xl sm:text-3xl font-bold text-white shadow-2xl shadow-indigo-500/20"
          >
            {remoteUser?.username.slice(0, 2).toUpperCase()}
          </motion.div>
          <div className="space-y-1">
            <h2 className="text-xl sm:text-2xl font-bold text-white">{remoteUser?.username}</h2>
            <p className="text-indigo-400 animate-pulse text-[10px] sm:text-sm font-medium tracking-wider uppercase">
              {status === "incoming" ? "Incoming Call" : 
               status === "calling" ? "Calling..." : "On Call"}
            </p>
          </div>
        </div>

        {/* Call Area */}
        <div className="relative w-full aspect-video bg-slate-900 rounded-3xl overflow-hidden border border-slate-800 shadow-2xl group max-h-[35vh] sm:max-h-none">
          {isVideoCall ? (
            <>
              {/* Remote Video (Big) */}
              <video 
                ref={remoteVideoRef} 
                autoPlay 
                playsInline 
                className="w-full h-full object-cover"
              />
              
              {/* Local Video (Small Overlay) */}
              <motion.div 
                drag
                dragConstraints={{ left: 0, right: 0, top: 0, bottom: 0 }}
                className="absolute top-2 right-2 sm:top-4 sm:right-4 w-1/4 sm:w-1/3 aspect-video bg-slate-800 rounded-xl sm:rounded-2xl overflow-hidden border border-slate-700 shadow-2xl cursor-move z-10"
              >
                {isVideoOff ? (
                  <div className="w-full h-full flex items-center justify-center bg-slate-800">
                    <VideoOff className="w-5 h-5 sm:w-6 sm:h-6 text-slate-600" />
                  </div>
                ) : (
                  <video 
                    ref={localVideoRef} 
                    autoPlay 
                    playsInline 
                    muted 
                    className="w-full h-full object-cover"
                  />
                )}
              </motion.div>
            </>
          ) : (
            /* Voice Call UI */
            <div className="absolute inset-0 flex flex-col items-center justify-center bg-slate-900/50 space-y-4 sm:space-y-6">
              <div className="relative">
                <div className="absolute inset-0 bg-indigo-500/20 rounded-full animate-ping" />
                <div className="w-24 h-24 sm:w-32 sm:h-32 rounded-full bg-slate-800 border-4 border-slate-700 flex items-center justify-center relative z-10">
                  <Phone className="w-8 h-8 sm:w-12 sm:h-12 text-indigo-500" />
                </div>
              </div>
              <p className="text-slate-400 text-sm sm:text-base font-medium">Voice call in progress</p>
            </div>
          )}
        </div>

        {/* Controls Container */}
        <div className="w-full flex flex-col items-center gap-6 sm:gap-8">
          <div className="flex items-center gap-4 sm:gap-6">
            {status === "incoming" ? (
              <>
                <button 
                  onClick={onAnswer}
                  className="flex flex-col items-center gap-2 sm:gap-3 group"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-emerald-500 text-white flex items-center justify-center hover:bg-emerald-400 transition-all shadow-lg shadow-emerald-500/30 group-hover:scale-110 active:scale-95">
                    <Phone className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <span className="text-emerald-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest">Attend</span>
                </button>
                <button 
                  onClick={onReject}
                  className="flex flex-col items-center gap-2 sm:gap-3 group"
                >
                  <div className="w-14 h-14 sm:w-16 sm:h-16 rounded-full bg-red-500 text-white flex items-center justify-center hover:bg-red-400 transition-all shadow-lg shadow-red-500/30 group-hover:scale-110 active:scale-95">
                    <PhoneOff className="w-6 h-6 sm:w-8 sm:h-8" />
                  </div>
                  <span className="text-red-400 font-bold text-[10px] sm:text-xs uppercase tracking-widest">Decline</span>
                </button>
              </>
            ) : (
              <div className="flex items-center gap-3 sm:gap-6 bg-slate-900/50 p-3 sm:p-4 rounded-2xl sm:rounded-3xl border border-slate-800">
                <button 
                  onClick={onToggleMute}
                  className={cn(
                    "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all",
                    isMuted ? "bg-red-500/20 text-red-500" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                  )}
                >
                  {isMuted ? <MicOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Mic className="w-4 h-4 sm:w-5 sm:h-5" />}
                </button>
                
                {isVideoCall && (
                  <button 
                    onClick={onToggleVideo}
                    className={cn(
                      "w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl flex items-center justify-center transition-all",
                      isVideoOff ? "bg-red-500/20 text-red-500" : "bg-slate-800 text-slate-300 hover:bg-slate-700"
                    )}
                  >
                    {isVideoOff ? <VideoOff className="w-4 h-4 sm:w-5 sm:h-5" /> : <Video className="w-4 h-4 sm:w-5 sm:h-5" />}
                  </button>
                )}

                <button 
                  onClick={onEnd}
                  className="w-12 h-12 sm:w-14 sm:h-14 rounded-xl sm:rounded-2xl bg-red-500 text-white flex items-center justify-center hover:bg-red-400 transition-all shadow-xl shadow-red-500/20 hover:scale-110 active:scale-95"
                >
                  <PhoneOff className="w-5 h-5 sm:w-6 sm:h-6" />
                </button>

                <button 
                  onClick={() => alert("Call Settings. Demonstration feature.")}
                  className="w-10 h-10 sm:w-12 sm:h-12 rounded-xl sm:rounded-2xl bg-slate-800 text-slate-300 flex items-center justify-center hover:bg-slate-700 transition-all"
                >
                  <Settings className="w-4 h-4 sm:w-5 sm:h-5" />
                </button>
              </div>
            )}
          </div>
        </div>
      </div>
    </motion.div>
  );
}
