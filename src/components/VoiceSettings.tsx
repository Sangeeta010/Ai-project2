import React, { useEffect, useState } from "react";
import { Settings, Volume2, Mic, Clock, ShieldAlert } from "lucide-react";

interface VoiceSettingsProps {
  rate: number;
  setRate: (rate: number) => void;
  pitch: number;
  setPitch: (pitch: number) => void;
  listeningTimeout: number;
  setListeningTimeout: (timeout: number) => void;
  selectedVoiceName: string;
  setSelectedVoiceName: (voiceName: string) => void;
}

export default function VoiceSettings({
  rate,
  setRate,
  pitch,
  setPitch,
  listeningTimeout,
  setListeningTimeout,
  selectedVoiceName,
  setSelectedVoiceName,
}: VoiceSettingsProps) {
  const [voices, setVoices] = useState<SpeechSynthesisVoice[]>([]);

  // Load browser speech synthesis voices
  useEffect(() => {
    const loadVoices = () => {
      if (typeof window !== "undefined" && window.speechSynthesis) {
        const availableVoices = window.speechSynthesis.getVoices();
        // Filter english voices or common voices
        setVoices(availableVoices);
      }
    };

    loadVoices();
    if (typeof window !== "undefined" && window.speechSynthesis) {
      window.speechSynthesis.onvoiceschanged = loadVoices;
    }
  }, []);

  return (
    <div id="voice-settings-panel" className="bg-slate-900 border border-slate-800 p-5 rounded-2xl shadow-xl flex flex-col gap-5">
      <div className="flex items-center gap-2 pb-3 border-b border-slate-800">
        <Settings className="w-5 h-5 text-indigo-400" />
        <h3 className="text-sm font-semibold text-slate-200">Alexa Speech & Listening Settings</h3>
      </div>

      {/* Voice Selection */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Volume2 className="w-3.5 h-3.5 text-indigo-400" />
          Choose Alexa Voice
        </label>
        <select
          value={selectedVoiceName}
          onChange={(e) => setSelectedVoiceName(e.target.value)}
          className="w-full bg-slate-950 border border-slate-800 rounded-lg p-2 text-sm text-slate-300 focus:outline-none focus:border-cyan-500 font-sans"
        >
          <option value="">Default System Voice (Female preferred)</option>
          {voices
            .filter((v) => v.lang.startsWith("en") || v.lang.startsWith("hi"))
            .map((voice) => (
              <option key={voice.name} value={voice.name}>
                {voice.name} ({voice.lang})
              </option>
            ))}
        </select>
        <p className="text-[10px] text-slate-500 leading-normal">
          Available English and Hindi voices are loaded dynamically from your system browser.
        </p>
      </div>

      {/* Rate and Pitch controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Speed / Rate control */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Speech Speed: {rate}x</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="2"
            step="0.1"
            value={rate}
            onChange={(e) => setRate(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>

        {/* Pitch Control */}
        <div className="flex flex-col gap-1.5">
          <div className="flex justify-between items-center text-xs font-semibold text-slate-400 uppercase tracking-wider">
            <span>Voice Pitch: {pitch}</span>
          </div>
          <input
            type="range"
            min="0.5"
            max="1.5"
            step="0.1"
            value={pitch}
            onChange={(e) => setPitch(parseFloat(e.target.value))}
            className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
          />
        </div>
      </div>

      {/* Listening Timeout config */}
      <div className="flex flex-col gap-1.5">
        <label className="text-xs font-semibold text-slate-400 uppercase tracking-wider flex items-center gap-1.5">
          <Clock className="w-3.5 h-3.5 text-cyan-400" />
          Listening Timeout: {listeningTimeout} seconds
        </label>
        <input
          type="range"
          min="2"
          max="8"
          step="1"
          value={listeningTimeout}
          onChange={(e) => setListeningTimeout(parseInt(e.target.value))}
          className="w-full h-1.5 bg-slate-950 rounded-lg appearance-none cursor-pointer accent-cyan-500"
        />
        <p className="text-[10px] text-slate-500 leading-normal">
          How many seconds Alexa will wait for a "Present" response before asking again by student's name.
        </p>
      </div>

      {/* Speech Support Warning banner */}
      <div className="flex gap-2.5 items-start bg-slate-950/60 p-3 rounded-xl border border-slate-800/80 text-slate-400 text-xs leading-normal">
        <ShieldAlert className="w-4 h-4 text-amber-500 shrink-0 mt-0.5" />
        <div className="flex-1">
          <span className="font-semibold text-slate-200">Microphone & Speech API Warning</span>
          <p className="mt-0.5 text-slate-400">
            For hands-free speech recognition to work correctly, grant microphone access. Ensure you are using Chrome, Edge, or Safari, and running this in a trusted origin or fully opened tab.
          </p>
        </div>
      </div>
    </div>
  );
}
