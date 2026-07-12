import React, { useState, useEffect, useRef, useCallback } from "react";
import { STUDENTS_DATA, Student } from "./data/students";
import AlexaAvatar, { AlexaState } from "./components/AlexaAvatar";
import StatsCard from "./components/StatsCard";
import AttendanceTable from "./components/AttendanceTable";
import VoiceSettings from "./components/VoiceSettings";
import {
  Play,
  Pause,
  Square,
  Volume2,
  Mic,
  MicOff,
  AlertCircle,
  CheckCircle2,
  HelpCircle,
  RotateCcw,
  SkipForward,
  SkipBack,
  FileSpreadsheet,
  Plus,
  Compass,
  ArrowRight
} from "lucide-react";
import { motion, AnimatePresence } from "motion/react";

export default function App() {
  // --- Attendance State ---
  const [attendance, setAttendance] = useState<Record<number, "present" | "absent" | "pending">>(() => {
    try {
      const saved = localStorage.getItem("alexa_attendance_records");
      return saved ? JSON.parse(saved) : {};
    } catch {
      return {};
    }
  });

  // --- Alexa & Speech State ---
  const [currentRollIndex, setCurrentRollIndex] = useState<number | null>(null);
  const [isRunning, setIsRunning] = useState(false);
  const [alexaState, setAlexaState] = useState<AlexaState>("idle");
  const [alexaPrompt, setAlexaPrompt] = useState("Alexa is ready. Say 'Alexa, start taking attendance' or click Start!");
  const [transcript, setTranscript] = useState("");
  const [interimTranscript, setInterimTranscript] = useState("");
  const [currentAttempt, setCurrentAttempt] = useState<1 | 2>(1); // 1 = Roll No, 2 = Student Name double-check

  // --- Voice Settings State ---
  const [speechRate, setSpeechRate] = useState(1.0);
  const [speechPitch, setSpeechPitch] = useState(1.0);
  const [listeningTimeout, setListeningTimeout] = useState(4); // seconds
  const [selectedVoiceName, setSelectedVoiceName] = useState("");

  // --- Speech Recognition Support ---
  const [isMicAvailable, setIsMicAvailable] = useState<boolean | null>(null);
  const [permissionError, setPermissionError] = useState<string | null>(null);

  // --- Refs to avoid stale closures in event listeners ---
  const stateRef = useRef({
    isRunning,
    currentRollIndex,
    currentAttempt,
    attendance,
    listeningTimeout,
    speechRate,
    speechPitch,
    selectedVoiceName,
  });

  useEffect(() => {
    stateRef.current = {
      isRunning,
      currentRollIndex,
      currentAttempt,
      attendance,
      listeningTimeout,
      speechRate,
      speechPitch,
      selectedVoiceName,
    };
  }, [isRunning, currentRollIndex, currentAttempt, attendance, listeningTimeout, speechRate, speechPitch, selectedVoiceName]);

  const recognitionRef = useRef<any>(null);
  const timeoutIdRef = useRef<NodeJS.Timeout | null>(null);

  // --- Local Persistence ---
  useEffect(() => {
    localStorage.setItem("alexa_attendance_records", JSON.stringify(attendance));
  }, [attendance]);

  // --- Play Sound Effect Helper ---
  const playSound = (type: "success" | "warning" | "finished" | "click") => {
    try {
      if (typeof window === "undefined" || !window.AudioContext && !(window as any).webkitAudioContext) return;
      const AudioCtx = window.AudioContext || (window as any).webkitAudioContext;
      const ctx = new AudioCtx();
      
      const osc = ctx.createOscillator();
      const gain = ctx.createGain();
      osc.connect(gain);
      gain.connect(ctx.destination);

      if (type === "success") {
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.15);
        gain.gain.setValueAtTime(0.1, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.15);
        osc.start();
        osc.stop(ctx.currentTime + 0.15);
      } else if (type === "warning") {
        osc.type = "sawtooth";
        osc.frequency.setValueAtTime(300, ctx.currentTime);
        osc.frequency.setValueAtTime(150, ctx.currentTime + 0.1);
        gain.gain.setValueAtTime(0.08, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.25);
        osc.start();
        osc.stop(ctx.currentTime + 0.25);
      } else if (type === "finished") {
        // Arpeggio
        [440, 554, 659, 880].forEach((freq, idx) => {
          const oscNode = ctx.createOscillator();
          const gainNode = ctx.createGain();
          oscNode.connect(gainNode);
          gainNode.connect(ctx.destination);
          oscNode.frequency.setValueAtTime(freq, ctx.currentTime + idx * 0.1);
          gainNode.gain.setValueAtTime(0.08, ctx.currentTime + idx * 0.1);
          gainNode.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + idx * 0.1 + 0.3);
          oscNode.start(ctx.currentTime + idx * 0.1);
          oscNode.stop(ctx.currentTime + idx * 0.1 + 0.3);
        });
      } else if (type === "click") {
        osc.frequency.setValueAtTime(800, ctx.currentTime);
        gain.gain.setValueAtTime(0.05, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.01, ctx.currentTime + 0.05);
        osc.start();
        osc.stop(ctx.currentTime + 0.05);
      }
    } catch (e) {
      console.warn("Audio Context blocked or not supported yet", e);
    }
  };

  // --- Voice speaking function ---
  const speakText = (text: string, onEnd?: () => void) => {
    if (typeof window === "undefined" || !window.speechSynthesis) {
      setAlexaPrompt("Speech synthesis not supported in this browser.");
      onEnd?.();
      return;
    }

    // Cancel currently playing speech
    window.speechSynthesis.cancel();

    const utterance = new SpeechSynthesisUtterance(text);
    utterance.rate = stateRef.current.speechRate;
    utterance.pitch = stateRef.current.speechPitch;

    if (stateRef.current.selectedVoiceName) {
      const voices = window.speechSynthesis.getVoices();
      const voice = voices.find((v) => v.name === stateRef.current.selectedVoiceName);
      if (voice) utterance.voice = voice;
    }

    utterance.onend = () => {
      onEnd?.();
    };

    utterance.onerror = (e) => {
      console.error("SpeechSynthesis error:", e);
      // Fallback on end to continue flow even if synth fails
      onEnd?.();
    };

    setAlexaState("speaking");
    setAlexaPrompt(`Alexa: "${text}"`);
    window.speechSynthesis.speak(utterance);
  };

  // --- Complete Speech Recognition Flow State Transitions ---
  const markStudentStatus = useCallback((rollNo: number, status: "present" | "absent") => {
    setAttendance((prev) => ({ ...prev, [rollNo]: status }));
    if (status === "present") {
      playSound("success");
    } else {
      playSound("warning");
    }
  }, []);

  const moveToNextStudent = useCallback(() => {
    const { currentRollIndex: index } = stateRef.current;
    if (index === null) return;

    if (index + 1 >= STUDENTS_DATA.length) {
      // Finished all 91 students!
      setIsRunning(false);
      setAlexaState("finished");
      setAlexaPrompt("Alexa: 'Attendance completed for all 91 students!'");
      speakText("Attendance is complete. Thank you everyone.", () => {
        playSound("finished");
      });
      setCurrentRollIndex(null);
    } else {
      const nextIndex = index + 1;
      setCurrentRollIndex(nextIndex);
      setCurrentAttempt(1);
      // Wait a tiny moment and start next roll call
      setTimeout(() => {
        triggerRollCall(nextIndex, 1);
      }, 800);
    }
  }, [markStudentStatus]);

  // --- Central Flow Action: Call the Student ---
  const triggerRollCall = useCallback((index: number, attempt: 1 | 2) => {
    const student = STUDENTS_DATA[index];
    if (!student) return;

    if (attempt === 1) {
      setAlexaState("speaking");
      setCurrentAttempt(1);
      speakText(`Roll number ${student.rollNo}`, () => {
        // Transition to listening
        startListeningForAttendance();
      });
    } else {
      setAlexaState("doubleCheck");
      setCurrentAttempt(2);
      speakText(`${student.name}, are you present?`, () => {
        // Transition to listening (Attempt 2)
        startListeningForAttendance();
      });
    }
  }, [speakText]);

  // --- Voice Listening Manager ---
  const startListeningForAttendance = () => {
    // Stop any pending timers
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);

    setAlexaState(stateRef.current.currentAttempt === 1 ? "listening" : "doubleCheck");
    setTranscript("");
    setInterimTranscript("");

    // Start speech recognition if supported & available
    if (recognitionRef.current) {
      try {
        recognitionRef.current.start();
      } catch (e) {
        console.warn("Recognition already started or error:", e);
      }
    }

    // Set timeout to handle no response / silence
    const waitTime = stateRef.current.listeningTimeout * 1000;
    timeoutIdRef.current = setTimeout(() => {
      handleNoResponse();
    }, waitTime);
  };

  // --- Handle Silence or Timeout ---
  const handleNoResponse = () => {
    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }

    const { currentRollIndex: index, currentAttempt: attempt } = stateRef.current;
    if (index === null) return;

    const student = STUDENTS_DATA[index];

    if (attempt === 1) {
      // First attempt failed to hear "present". Ask again by Name!
      setAlexaPrompt(`Alexa: "No response heard for Roll No. ${student.rollNo}. Let's double check."`);
      setTimeout(() => {
        triggerRollCall(index, 2);
      }, 500);
    } else {
      // Second attempt also failed. Mark as ABSENT!
      setAlexaPrompt(`Alexa: "No response for ${student.name}. Marking as Absent."`);
      markStudentStatus(student.rollNo, "absent");
      setTimeout(() => {
        moveToNextStudent();
      }, 500);
    }
  };

  // --- Handle Recognized Voice Inputs ---
  const handleVoiceMatch = (text: string) => {
    // Clear the timeout!
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }

    if (recognitionRef.current) {
      try {
        recognitionRef.current.stop();
      } catch (e) {
        console.error(e);
      }
    }

    const cleanedText = text.toLowerCase().trim();
    const isPresentWord =
      cleanedText.includes("present") ||
      cleanedText.includes("yes") ||
      cleanedText.includes("here") ||
      cleanedText.includes("yeah") ||
      cleanedText.includes("yep") ||
      cleanedText.includes("p");

    const { currentRollIndex: index } = stateRef.current;
    if (index === null) return;
    const student = STUDENTS_DATA[index];

    if (isPresentWord) {
      setAlexaPrompt(`Alexa: "Heard 'Present'. Marking Roll No. ${student.rollNo} Present."`);
      markStudentStatus(student.rollNo, "present");
      setTimeout(() => {
        moveToNextStudent();
      }, 500);
    } else {
      // Heard something, but not clearly a present word. Double check or mark absent based on attempt
      const { currentAttempt: attempt } = stateRef.current;
      if (attempt === 1) {
        setAlexaPrompt(`Alexa: "Heard '${text}', but not clear. Let's double check."`);
        setTimeout(() => {
          triggerRollCall(index, 2);
        }, 500);
      } else {
        setAlexaPrompt(`Alexa: "Marking ${student.name} as Absent."`);
        markStudentStatus(student.rollNo, "absent");
        setTimeout(() => {
          moveToNextStudent();
        }, 500);
      }
    }
  };

  // --- Initialize Speech Recognition ---
  useEffect(() => {
    // @ts-ignore
    const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
    if (!SpeechRecognition) {
      setIsMicAvailable(false);
      setPermissionError("Web Speech Recognition API is not supported in this browser. Please use Chrome, Edge, or Safari.");
      return;
    }

    const rec = new SpeechRecognition();
    rec.continuous = false; // We want single-phrase bursts
    rec.interimResults = true;
    rec.lang = "en-US";

    rec.onstart = () => {
      setIsMicAvailable(true);
    };

    rec.onresult = (event: any) => {
      let interim = "";
      let final = "";

      for (let i = event.resultIndex; i < event.results.length; ++i) {
        if (event.results[i].isFinal) {
          final += event.results[i][0].transcript;
        } else {
          interim += event.results[i][0].transcript;
        }
      }

      setTranscript(final);
      setInterimTranscript(interim);

      if (final) {
        // Check for general Alexa wake commands if idle
        const cleanedFinal = final.toLowerCase().trim();
        if (!stateRef.current.isRunning && cleanedFinal.includes("start taking attendance")) {
          startAttendanceFlow();
        } else if (stateRef.current.isRunning) {
          // If running, we look for "present", "yes", etc.
          handleVoiceMatch(final);
        }
      }
    };

    rec.onerror = (event: any) => {
      console.warn("Speech recognition error", event.error);
      if (event.error === "not-allowed") {
        setPermissionError("Microphone permission denied. Using Simulation mode.");
        setIsMicAvailable(false);
      }
    };

    rec.onend = () => {
      // If we are still running and Alexa state is listening, restart it so we don't miss voice
      // but only if timeout hasn't fired yet. The timeout itself manages stopping.
    };

    recognitionRef.current = rec;

    // Test microphone access
    if (navigator.mediaDevices && navigator.mediaDevices.getUserMedia) {
      navigator.mediaDevices
        .getUserMedia({ audio: true })
        .then(() => {
          setIsMicAvailable(true);
        })
        .catch((err) => {
          console.warn("Microphone access declined or unavailable:", err);
          setIsMicAvailable(false);
          setPermissionError("Microphone access blocked. Simulators fully active!");
        });
    } else {
      setIsMicAvailable(false);
    }

    return () => {
      if (rec) rec.abort();
    };
  }, []);

  // --- Attendance Action Control Handlers ---
  const startAttendanceFlow = () => {
    playSound("click");
    // Find first pending student or default to 0
    let startIndex = 0;
    for (let i = 0; i < STUDENTS_DATA.length; i++) {
      if (!attendance[STUDENTS_DATA[i].rollNo] || attendance[STUDENTS_DATA[i].rollNo] === "pending") {
        startIndex = i;
        break;
      }
    }

    setIsRunning(true);
    setCurrentRollIndex(startIndex);
    setCurrentAttempt(1);
    
    // Alexa greets and starts
    speakText("Starting attendance now. Please listen carefully.", () => {
      triggerRollCall(startIndex, 1);
    });
  };

  const pauseAttendanceFlow = () => {
    playSound("click");
    setIsRunning(false);
    setAlexaState("paused");
    setAlexaPrompt("Attendance paused. Click Resume to continue.");
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    window.speechSynthesis.cancel();
  };

  const resumeAttendanceFlow = () => {
    playSound("click");
    setIsRunning(true);
    const index = currentRollIndex !== null ? currentRollIndex : 0;
    setCurrentRollIndex(index);
    speakText("Resuming attendance.", () => {
      triggerRollCall(index, currentAttempt);
    });
  };

  const stopAttendanceFlow = () => {
    playSound("click");
    setIsRunning(false);
    setAlexaState("idle");
    setAlexaPrompt("Attendance stopped.");
    setCurrentRollIndex(null);
    if (timeoutIdRef.current) {
      clearTimeout(timeoutIdRef.current);
      timeoutIdRef.current = null;
    }
    if (recognitionRef.current) {
      recognitionRef.current.stop();
    }
    window.speechSynthesis.cancel();
  };

  const handleSkipNext = () => {
    playSound("click");
    if (currentRollIndex === null) return;
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    
    if (currentRollIndex + 1 < STUDENTS_DATA.length) {
      const nextIndex = currentRollIndex + 1;
      setCurrentRollIndex(nextIndex);
      setCurrentAttempt(1);
      triggerRollCall(nextIndex, 1);
    } else {
      stopAttendanceFlow();
    }
  };

  const handleSkipPrev = () => {
    playSound("click");
    if (currentRollIndex === null || currentRollIndex === 0) return;
    if (timeoutIdRef.current) clearTimeout(timeoutIdRef.current);
    
    const prevIndex = currentRollIndex - 1;
    setCurrentRollIndex(prevIndex);
    setCurrentAttempt(1);
    triggerRollCall(prevIndex, 1);
  };

  // --- Manual Override Action ---
  const handleOverrideStatus = (rollNo: number, status: "present" | "absent" | "pending") => {
    playSound("click");
    setAttendance((prev) => ({ ...prev, [rollNo]: status }));
  };

  // --- Reset All Records ---
  const handleResetAttendance = () => {
    playSound("warning");
    if (window.confirm("Are you sure you want to clear all attendance records?")) {
      setAttendance({});
      stopAttendanceFlow();
    }
  };

  // --- Export/Download as CSV Sheet ---
  const handleExportCSV = () => {
    playSound("finished");
    const headers = ["Roll No", "Student Name", "Department", "Attendance Status"];
    const rows = STUDENTS_DATA.map((student) => {
      const status = attendance[student.rollNo] || "pending";
      const displayStatus = status === "present" ? "PRESENT" : status === "absent" ? "ABSENT" : "PENDING";
      return [
        student.rollNo,
        `"${student.name}"`,
        `"${student.department}"`,
        displayStatus,
      ];
    });

    const csvContent =
      "data:text/csv;charset=utf-8," +
      [headers.join(","), ...rows.map((e) => e.join(","))].join("\n");

    const encodedUri = encodeURI(csvContent);
    const link = document.createElement("a");
    link.setAttribute("href", encodedUri);
    link.setAttribute(
      "download",
      `Alexa_Attendance_Report_${new Date().toISOString().split("T")[0]}.csv`
    );
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // --- Simulation Actions (Ensures 100% Usability Everywhere) ---
  const simulateVoiceResponse = (word: "present" | "silence") => {
    playSound("click");
    if (word === "present") {
      setTranscript("Present");
      handleVoiceMatch("present");
    } else {
      setTranscript("(Silence)");
      handleNoResponse();
    }
  };

  // --- Computed Stats ---
  const totalStudents = STUDENTS_DATA.length;
  const presentCount = Object.values(attendance).filter((s) => s === "present").length;
  const absentCount = Object.values(attendance).filter((s) => s === "absent").length;

  const currentStudent = currentRollIndex !== null ? STUDENTS_DATA[currentRollIndex] : null;

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100 font-sans p-4 md:p-8 flex flex-col justify-between">
      {/* Container Wrapper */}
      <div className="max-w-7xl mx-auto w-full">
        {/* Header Branding */}
        <header id="app-header" className="flex flex-col md:flex-row md:items-center justify-between gap-4 border-b border-slate-800 pb-6 mb-8">
          <div className="flex items-center gap-3">
            <div className="p-2.5 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center text-cyan-400">
              <Compass className="w-8 h-8 animate-spin-slow" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-2xl font-extrabold tracking-tight bg-gradient-to-r from-cyan-400 to-indigo-400 bg-clip-text text-transparent">
                  Alexa Voice Attendance
                </h1>
                <span className="text-[10px] bg-indigo-500/10 text-indigo-400 font-mono font-bold px-2 py-0.5 rounded-full border border-indigo-500/20">
                  v1.2 Agentic
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Hands-free audio roll call agent styled like a modern smart speaker console
              </p>
            </div>
          </div>

          {/* Quick Stats Panel Header */}
          <div className="flex items-center gap-4 bg-slate-900/60 p-2.5 rounded-xl border border-slate-800 text-xs font-medium">
            <div className="flex items-center gap-1.5 text-emerald-400">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
              <span>Present: {presentCount}</span>
            </div>
            <div className="h-4 w-px bg-slate-800" />
            <div className="flex items-center gap-1.5 text-rose-400">
              <span className="w-2 h-2 rounded-full bg-rose-500 animate-pulse" />
              <span>Absent: {absentCount}</span>
            </div>
          </div>
        </header>

        {/* Top level Widgets */}
        <StatsCard total={totalStudents} present={presentCount} absent={absentCount} />

        {/* Dashboard Main Workspace Grid */}
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-start">
          {/* Left Column: Alexa Center HUD & Simulator Controls */}
          <div className="lg:col-span-5 flex flex-col gap-6">
            
            {/* Alexa Core Voice HUD */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-6 shadow-xl relative overflow-hidden">
              <AlexaAvatar
                state={alexaState}
                transcript={transcript}
                interimTranscript={interimTranscript}
                studentName={currentStudent?.name}
                rollNo={currentStudent?.rollNo}
              />

              {/* Attendance Flow Controls Bar */}
              <div className="flex items-center justify-center gap-2.5 mt-6 border-t border-slate-800/80 pt-5">
                {isRunning ? (
                  <>
                    <button
                      onClick={handleSkipPrev}
                      disabled={currentRollIndex === 0}
                      title="Previous Roll No"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <SkipBack className="w-4 h-4" />
                    </button>
                    <button
                      onClick={pauseAttendanceFlow}
                      className="flex items-center gap-2 px-5 py-2.5 bg-amber-600 hover:bg-amber-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-amber-500/20 transition-all cursor-pointer"
                    >
                      <Pause className="w-4 h-4" />
                      Pause
                    </button>
                    <button
                      onClick={handleSkipNext}
                      disabled={currentRollIndex === totalStudents - 1}
                      title="Skip / Next Roll No"
                      className="p-2.5 rounded-xl bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 transition-all disabled:opacity-40 disabled:cursor-not-allowed cursor-pointer"
                    >
                      <SkipForward className="w-4 h-4" />
                    </button>
                  </>
                ) : (
                  <>
                    {alexaState === "paused" ? (
                      <button
                        onClick={resumeAttendanceFlow}
                        className="flex items-center gap-2 px-6 py-2.5 bg-cyan-600 hover:bg-cyan-500 text-white rounded-xl text-sm font-bold shadow-lg shadow-cyan-500/20 transition-all cursor-pointer animate-pulse"
                      >
                        <Play className="w-4 h-4" />
                        Resume Call
                      </button>
                    ) : (
                      <button
                        onClick={startAttendanceFlow}
                        className="flex items-center gap-2 px-6 py-3 bg-gradient-to-r from-cyan-500 to-indigo-600 hover:from-cyan-400 hover:to-indigo-500 text-white rounded-xl text-sm font-bold shadow-xl shadow-cyan-500/10 hover:shadow-cyan-500/20 transition-all cursor-pointer"
                      >
                        <Play className="w-4 h-4" />
                        Start Attendance
                      </button>
                    )}
                  </>
                )}

                {(isRunning || alexaState === "paused") && (
                  <button
                    onClick={stopAttendanceFlow}
                    className="p-2.5 rounded-xl bg-rose-600/10 hover:bg-rose-600/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 transition-all cursor-pointer"
                    title="Stop Attendance"
                  >
                    <Square className="w-4 h-4 fill-current" />
                  </button>
                )}
              </div>

              {/* Status prompt */}
              <p className="text-xs text-center text-slate-400 font-medium font-sans mt-3 animate-pulse">
                {alexaPrompt}
              </p>
            </div>

            {/* Voice Input Simulators panel */}
            <div className="bg-slate-900 border border-slate-800 rounded-2xl p-5 shadow-xl">
              <div className="flex items-center gap-2 mb-3">
                <Volume2 className="w-4 h-4 text-cyan-400" />
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">Voice Input Simulator HUD</h4>
              </div>
              <p className="text-[11px] text-slate-400 mb-4 leading-normal">
                No mic or noisy room? Simulate student voice responses instantly to see how Alexa processes rolls!
              </p>

              {/* Action buttons */}
              <div className="grid grid-cols-2 gap-3">
                <button
                  onClick={() => simulateVoiceResponse("present")}
                  disabled={!isRunning || alexaState === "speaking"}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 hover:text-emerald-300 border border-emerald-500/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <CheckCircle2 className="w-4 h-4 shrink-0" />
                  <span>Simulate "Present"</span>
                </button>
                <button
                  onClick={() => simulateVoiceResponse("silence")}
                  disabled={!isRunning || alexaState === "speaking"}
                  className="flex items-center justify-center gap-2 py-2.5 px-3 bg-rose-500/10 hover:bg-rose-500/20 text-rose-400 hover:text-rose-300 border border-rose-500/20 disabled:opacity-40 disabled:cursor-not-allowed rounded-xl text-xs font-bold transition-all cursor-pointer"
                >
                  <AlertCircle className="w-4 h-4 shrink-0" />
                  <span>Simulate "Silence"</span>
                </button>
              </div>

              <div className="mt-4 flex flex-col gap-2">
                <div className="text-[10px] text-slate-500 uppercase font-mono tracking-wider">Quick Commands Simulator</div>
                <div className="flex flex-wrap gap-1.5">
                  <button
                    onClick={() => {
                      playSound("click");
                      setTranscript("Alexa start taking attendance");
                      startAttendanceFlow();
                    }}
                    disabled={isRunning}
                    className="text-[10px] bg-slate-950 border border-slate-800 hover:border-cyan-500 text-slate-300 hover:text-white px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    "Alexa, start taking attendance"
                  </button>
                  <button
                    onClick={() => {
                      playSound("click");
                      setTranscript("Alexa pause");
                      pauseAttendanceFlow();
                    }}
                    disabled={!isRunning}
                    className="text-[10px] bg-slate-950 border border-slate-800 hover:border-amber-500 text-slate-300 hover:text-white px-2.5 py-1 rounded-md transition-colors cursor-pointer"
                  >
                    "Alexa, pause"
                  </button>
                </div>
              </div>
            </div>

            {/* Micro Instruction Panel */}
            <div className="bg-slate-900/40 border border-slate-800/80 rounded-2xl p-4 text-xs text-slate-400 flex gap-3">
              <HelpCircle className="w-5 h-5 text-indigo-400 shrink-0 mt-0.5" />
              <div>
                <span className="font-semibold text-slate-200">How Alexa Attendance Works:</span>
                <ol className="list-decimal pl-4 mt-1 space-y-1 text-[11px] leading-relaxed text-slate-400">
                  <li>Click <strong>Start Attendance</strong> to begin. Alexa speaks "Roll number 1".</li>
                  <li>Alexa listens for <strong className="text-cyan-400">"Present"</strong> for {listeningTimeout} seconds.</li>
                  <li>If heard, she logs it and calls the next roll number.</li>
                  <li>If silent, Alexa asks: <strong className="text-amber-400">"Student Name, are you present?"</strong></li>
                  <li>If still silent, she registers them as <strong>Absent</strong> and notes down the record.</li>
                  <li>Download the completed sheet anytime using <strong>Export to Sheet</strong>.</li>
                </ol>
              </div>
            </div>

          </div>

          {/* Right Column: Students Attendance list & Settings */}
          <div className="lg:col-span-7 flex flex-col gap-6">
            
            {/* Voice and Speech Synthesis Settings widget */}
            <VoiceSettings
              rate={speechRate}
              setRate={setSpeechRate}
              pitch={speechPitch}
              setPitch={setSpeechPitch}
              listeningTimeout={listeningTimeout}
              setListeningTimeout={setListeningTimeout}
              selectedVoiceName={selectedVoiceName}
              setSelectedVoiceName={setSelectedVoiceName}
            />

            {/* Attendance Records grid list */}
            <AttendanceTable
              students={STUDENTS_DATA}
              attendance={attendance}
              currentRollNo={currentStudent?.rollNo ?? null}
              onOverrideStatus={handleOverrideStatus}
              onReset={handleResetAttendance}
              onExport={handleExportCSV}
            />

          </div>
        </div>
      </div>

      {/* Footer credits */}
      <footer className="mt-16 text-center text-[11px] text-slate-600 border-t border-slate-900 pt-6">
        <p>© 2026 Alexa Voice Attendance Agent • Designed for modern class automation with full local fallback protection.</p>
      </footer>
    </div>
  );
}
