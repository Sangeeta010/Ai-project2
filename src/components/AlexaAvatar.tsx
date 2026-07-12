import React from "react";
import { motion, AnimatePresence } from "motion/react";
import { Mic, MicOff, Volume2, Pause, VolumeX, Radio, Sparkles } from "lucide-react";

export type AlexaState = "idle" | "speaking" | "listening" | "doubleCheck" | "paused" | "finished";

interface AlexaAvatarProps {
  state: AlexaState;
  transcript: string;
  interimTranscript: string;
  studentName?: string;
  rollNo?: number;
}

export default function AlexaAvatar({
  state,
  transcript,
  interimTranscript,
  studentName,
  rollNo,
}: AlexaAvatarProps) {
  // Determine color theme based on state
  const getThemeClasses = () => {
    switch (state) {
      case "listening":
        return {
          glow: "bg-cyan-500/20 shadow-cyan-500/50",
          ring: "border-cyan-500",
          core: "bg-cyan-500",
          text: "text-cyan-400",
          title: "Listening...",
        };
      case "speaking":
        return {
          glow: "bg-indigo-500/20 shadow-indigo-500/50",
          ring: "border-indigo-500",
          core: "bg-indigo-600",
          text: "text-indigo-400",
          title: "Alexa is Speaking",
        };
      case "doubleCheck":
        return {
          glow: "bg-amber-500/20 shadow-amber-500/50",
          ring: "border-amber-500",
          core: "bg-amber-500",
          text: "text-amber-400",
          title: "Double Checking Name...",
        };
      case "paused":
        return {
          glow: "bg-slate-500/10 shadow-slate-500/30",
          ring: "border-slate-500",
          core: "bg-slate-600",
          text: "text-slate-400",
          title: "Attendance Paused",
        };
      case "finished":
        return {
          glow: "bg-emerald-500/20 shadow-emerald-500/50",
          ring: "border-emerald-500",
          core: "bg-emerald-500",
          text: "text-emerald-400",
          title: "Attendance Completed!",
        };
      case "idle":
      default:
        return {
          glow: "bg-teal-500/10 shadow-teal-500/30",
          ring: "border-teal-500",
          core: "bg-teal-500",
          text: "text-teal-400",
          title: "Alexa is Ready",
        };
    }
  };

  const theme = getThemeClasses();

  return (
    <div id="alexa-avatar-container" className="flex flex-col items-center justify-center p-6 bg-slate-900 border border-slate-800 rounded-2xl shadow-xl w-full max-w-md mx-auto text-center relative overflow-hidden">
      {/* Dynamic Background Aura */}
      <div className="absolute inset-0 bg-radial-gradient from-slate-900 via-slate-950 to-black -z-10" />
      
      {/* Decorative particles for Alexa visual feel */}
      <div className="absolute top-4 right-4 flex items-center gap-1 text-slate-500 text-xs">
        <Sparkles className="w-3.5 h-3.5 text-cyan-400 animate-pulse" />
        <span>Alexa Active</span>
      </div>

      {/* Main Avatar Circle */}
      <div className="relative w-48 h-48 flex items-center justify-center my-6">
        {/* Outer glowing pulsing circles */}
        <AnimatePresence mode="popLayout">
          {state === "listening" && (
            <>
              <motion.div
                key="listen-wave-1"
                initial={{ scale: 0.8, opacity: 0.5 }}
                animate={{ scale: 1.5, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2, ease: "easeOut" }}
                className="absolute inset-0 rounded-full border border-cyan-400"
              />
              <motion.div
                key="listen-wave-2"
                initial={{ scale: 0.8, opacity: 0.3 }}
                animate={{ scale: 1.8, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 2, delay: 0.6, ease: "easeOut" }}
                className="absolute inset-0 rounded-full border border-cyan-500"
              />
            </>
          )}

          {state === "speaking" && (
            <>
              <motion.div
                key="speak-wave-1"
                initial={{ scale: 0.9, opacity: 0.6 }}
                animate={{ scale: 1.3, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full border border-indigo-400"
              />
              <motion.div
                key="speak-wave-2"
                initial={{ scale: 0.9, opacity: 0.4 }}
                animate={{ scale: 1.6, opacity: 0 }}
                exit={{ opacity: 0 }}
                transition={{ repeat: Infinity, duration: 1.5, delay: 0.5, ease: "easeInOut" }}
                className="absolute inset-0 rounded-full border border-indigo-600/50"
              />
            </>
          )}

          {state === "doubleCheck" && (
            <motion.div
              key="double-check-wave"
              initial={{ scale: 0.9, opacity: 0.6 }}
              animate={{ scale: 1.4, opacity: 0 }}
              exit={{ opacity: 0 }}
              transition={{ repeat: Infinity, duration: 1.2, ease: "easeInOut" }}
              className="absolute inset-0 rounded-full border border-amber-400"
            />
          )}
        </AnimatePresence>

        {/* Ambient glow container */}
        <div className={`absolute inset-4 rounded-full transition-all duration-700 blur-xl ${theme.glow}`} />

        {/* Outer Solid Ring */}
        <div className={`absolute inset-2 rounded-full border-2 transition-colors duration-500 flex items-center justify-center ${theme.ring}`}>
          {/* Inner pulsating sphere */}
          <motion.div
            animate={
              state === "speaking"
                ? { scale: [1, 1.06, 0.97, 1.06, 1] }
                : state === "listening"
                ? { scale: [1, 1.1, 1] }
                : { scale: 1 }
            }
            transition={{
              repeat: Infinity,
              duration: state === "speaking" ? 1.5 : 2,
              ease: "easeInOut",
            }}
            className={`w-32 h-32 rounded-full flex flex-col items-center justify-center text-white transition-colors duration-500 shadow-lg ${theme.core}`}
          >
            {/* Center icon */}
            {state === "listening" && <Mic className="w-12 h-12 text-white animate-bounce" />}
            {state === "speaking" && <Volume2 className="w-12 h-12 text-white" />}
            {state === "doubleCheck" && <Radio className="w-12 h-12 text-white animate-pulse" />}
            {state === "paused" && <Pause className="w-12 h-12 text-slate-300" />}
            {state === "finished" && <Sparkles className="w-12 h-12 text-white animate-spin" />}
            {state === "idle" && <VolumeX className="w-12 h-12 text-teal-100" />}

            {/* Inner text state */}
            <span className="text-[10px] uppercase tracking-widest text-slate-200 mt-2 font-semibold">
              {state}
            </span>
          </motion.div>
        </div>
      </div>

      {/* Target roll no & Name Callout */}
      <div className="h-16 flex flex-col items-center justify-center mb-4 px-4 w-full">
        {rollNo && studentName ? (
          <motion.div
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            className="text-center"
          >
            <p className="text-xs text-slate-400 uppercase tracking-wider">Currently Calling</p>
            <p className="text-lg font-bold text-slate-100 font-sans truncate max-w-xs mt-0.5">
              Roll No. {rollNo}: <span className="text-cyan-400">{studentName}</span>
            </p>
          </motion.div>
        ) : (
          <p className="text-sm text-slate-400 italic">
            Say <span className="text-cyan-400 font-bold font-mono">"Alexa, start taking attendance"</span> to begin
          </p>
        )}
      </div>

      {/* Alexa Voice Title Status */}
      <h3 className={`text-base font-semibold transition-colors duration-500 mb-2 ${theme.text}`}>
        {theme.title}
      </h3>

      {/* Voice Transcript Output Box */}
      <div className="w-full bg-slate-950/60 border border-slate-800 rounded-xl p-3 min-h-12 flex flex-col items-center justify-center text-slate-300 text-sm">
        {interimTranscript || transcript ? (
          <div className="flex flex-col gap-1 w-full text-center">
            <span className="text-[10px] text-slate-500 uppercase font-mono">Heard Transcript</span>
            <p className="text-slate-200 font-medium">
              {transcript} <span className="text-cyan-400 italic">{interimTranscript}</span>
            </p>
          </div>
        ) : (
          <span className="text-xs text-slate-500 italic">Waiting for voice input...</span>
        )}
      </div>
    </div>
  );
}
