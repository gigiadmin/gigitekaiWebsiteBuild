/**
 * Aria Command Center — GigitekAI Main Brain
 * Fortune 100 quality holographic interface
 * Real-time audio volume visualization on sphere
 * Fully responsive: mobile-first
 * 
 * NEW: Voice Activity Detection, Sensitivity Control, Wake Word Detection
 */
import { useState, useRef, useEffect, useCallback } from "react";
import {
  ProvisionClientModal,
  RunWorkflowModal,
  AgentStatusModal,
  SettingsModal,
} from "@/components/AriaQuickActionModals";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mic, MicOff, Send, Volume2, VolumeX, Download, Trash2,
  Brain, AlertTriangle, CheckCircle2, Clock, Zap, Terminal, Activity, X, Settings, Plus, Workflow
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "@/components/GigitekMarkdown";
import { WorkflowHistoryPanel } from "@/components/WorkflowHistoryPanel";

type Message = {
  id: string;
  role: "user" | "aria";
  content: string;
  timestamp: Date;
  isVoice?: boolean;
};

type Stage = "idle" | "listening" | "transcribing" | "thinking" | "searching" | "responding" | "waiting_for_wake_word";

// Import X icon for delete button (already imported above)

const STAGE_LABEL: Record<Stage, string> = {
  idle: "Ready",
  listening: "Listening...",
  transcribing: "Transcribing...",
  thinking: "Thinking...",
  searching: "Searching...",
  responding: "Responding...",
  waiting_for_wake_word: "Waiting for wake word...",
};

/* ─── Voice Activity Detection ─────────────────────────────────────────────── */
function detectVoiceActivity(frequencyData: Uint8Array, threshold: number = 0.3): boolean {
  let sum = 0;
  for (let i = 0; i < frequencyData.length; i++) sum += frequencyData[i];
  const average = sum / frequencyData.length;
  return average > (threshold * 255);
}

function detectWakeWord(transcript: string): boolean {
  const normalized = transcript.toLowerCase().trim();
  const wakeWords = ["hey aria", "aria", "hey aria listen", "aria listen"];
  return wakeWords.some(word => normalized.includes(word));
}

/* ─── Voice helpers — Azure AI Speech Service ──────────────────────────── */
// Server-side neural TTS via Azure AI Speech — voice NEVER changes, works on all browsers/devices
// Voice locked to: en-US-JennyNeural (Microsoft Neural TTS)
let currentAudio: HTMLAudioElement | null = null;

async function speakAsAria(text: string, speed: number = 0.95, onEnd?: () => void) {
  if (!text) return;
  // Stop any current playback
  stopSpeaking();
  try {
    // Map speed (0.5–2.0) to Azure prosody rate percentage
    const ratePercent = Math.round((speed - 1) * 100);
    const rateStr = ratePercent >= 0 ? `+${ratePercent}%` : `${ratePercent}%`;
    const response = await fetch("/api/aria/tts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ text, rate: rateStr }),
    });
    if (!response.ok) {
      console.error("[Aria TTS] Azure Speech failed:", response.status);
      return;
    }
    const audioBlob = await response.blob();
    const audioUrl = URL.createObjectURL(audioBlob);
    currentAudio = new Audio(audioUrl);
    currentAudio.onended = () => {
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
      if (onEnd) onEnd();
    };
    currentAudio.onerror = (e) => {
      console.error("[Aria TTS] Audio playback error:", e);
      URL.revokeObjectURL(audioUrl);
      currentAudio = null;
    };
    await currentAudio.play();
    console.log("[Aria TTS] Playing via Azure AI Speech (en-US-JennyNeural)");
  } catch (err) {
    console.error("[Aria TTS] Error:", err);
  }
}

function stopSpeaking() {
  if (currentAudio) {
    currentAudio.pause();
    currentAudio.src = "";
    currentAudio = null;
  }
}

/* ─── Holographic Sphere ─────────────────────────────────────────────────── */
// Stage-aware color palette
const STAGE_COLORS: Record<Stage, {
  ring: string; ringBorder: string; halo: string; core: string;
  coreShadow: string; dot: string; dotShadow: string; label: string; labelText: string;
}> = {
  idle: {
    ring: "rgba(34,211,238,0.2)", ringBorder: "border-cyan-400/20",
    halo: "radial-gradient(circle, rgba(34,211,238,0.35) 0%, rgba(6,182,212,0.15) 60%, transparent 100%)",
    core: "radial-gradient(circle at 35% 35%, #67e8f9, #0891b2 60%, #0e7490)",
    coreShadow: "rgba(34,211,238,", dot: "bg-cyan-200", dotShadow: "rgba(165,243,252,",
    label: "text-cyan-400/60", labelText: "○ STANDBY",
  },
  listening: {
    ring: "rgba(34,211,238,0.4)", ringBorder: "border-cyan-300/40",
    halo: "radial-gradient(circle, rgba(34,211,238,0.55) 0%, rgba(6,182,212,0.25) 60%, transparent 100%)",
    core: "radial-gradient(circle at 35% 35%, #a5f3fc, #0891b2 55%, #0e7490)",
    coreShadow: "rgba(34,211,238,", dot: "bg-white", dotShadow: "rgba(255,255,255,",
    label: "text-cyan-300/90", labelText: "◉ LISTENING",
  },
  waiting_for_wake_word: {
    ring: "rgba(168,85,247,0.35)", ringBorder: "border-purple-400/35",
    halo: "radial-gradient(circle, rgba(168,85,247,0.45) 0%, rgba(139,92,246,0.2) 60%, transparent 100%)",
    core: "radial-gradient(circle at 35% 35%, #e9d5ff, #7c3aed 55%, #5b21b6)",
    coreShadow: "rgba(168,85,247,", dot: "bg-purple-200", dotShadow: "rgba(233,213,255,",
    label: "text-purple-300/90", labelText: "◎ WAITING FOR WAKE WORD",
  },
  transcribing: {
    ring: "rgba(168,85,247,0.35)", ringBorder: "border-purple-400/35",
    halo: "radial-gradient(circle, rgba(168,85,247,0.45) 0%, rgba(139,92,246,0.2) 60%, transparent 100%)",
    core: "radial-gradient(circle at 35% 35%, #e9d5ff, #7c3aed 55%, #5b21b6)",
    coreShadow: "rgba(168,85,247,", dot: "bg-purple-200", dotShadow: "rgba(233,213,255,",
    label: "text-purple-300/90", labelText: "◎ TRANSCRIBING",
  },
  thinking: {
    ring: "rgba(251,191,36,0.4)", ringBorder: "border-amber-400/40",
    halo: "radial-gradient(circle, rgba(251,191,36,0.5) 0%, rgba(245,158,11,0.2) 60%, transparent 100%)",
    core: "radial-gradient(circle at 35% 35%, #fef3c7, #d97706 55%, #b45309)",
    coreShadow: "rgba(251,191,36,", dot: "bg-amber-200", dotShadow: "rgba(253,230,138,",
    label: "text-amber-300/90", labelText: "◈ THINKING",
  },
  searching: {
    ring: "rgba(52,211,153,0.4)", ringBorder: "border-emerald-400/40",
    halo: "radial-gradient(circle, rgba(52,211,153,0.5) 0%, rgba(16,185,129,0.2) 60%, transparent 100%)",
    core: "radial-gradient(circle at 35% 35%, #a7f3d0, #059669 55%, #047857)",
    coreShadow: "rgba(52,211,153,", dot: "bg-emerald-200", dotShadow: "rgba(167,243,208,",
    label: "text-emerald-300/90", labelText: "◉ SEARCHING",
  },
  responding: {
    ring: "rgba(99,102,241,0.4)", ringBorder: "border-indigo-400/40",
    halo: "radial-gradient(circle, rgba(99,102,241,0.5) 0%, rgba(79,70,229,0.2) 60%, transparent 100%)",
    core: "radial-gradient(circle at 35% 35%, #c7d2fe, #4f46e5 55%, #3730a3)",
    coreShadow: "rgba(99,102,241,", dot: "bg-indigo-200", dotShadow: "rgba(199,210,254,",
    label: "text-indigo-300/90", labelText: "◎ RESPONDING",
  },
};

function SpeakingWaveform() {
  const delays = ["0ms", "120ms", "240ms", "120ms", "0ms"];
  const heights = ["10px", "18px", "26px", "18px", "10px"];
  return (
    <div className="flex items-center gap-[3px]">
      {delays.map((delay, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-emerald-400"
          style={{
            height: heights[i],
            animation: `aria-wave-bar 0.7s ease-in-out infinite`,
            animationDelay: delay,
          }}
        />
      ))}
    </div>
  );
}

function HolographicSphere({ isActive, volume = 0, stage = "idle", isSpeaking = false }: { isActive: boolean; volume: number; stage: Stage; isSpeaking?: boolean }) {
  const scale = 1 + volume * 0.35;
  const glow = 20 + volume * 120;
  const coreGlow = 30 + volume * 150;
  const isProcessing = stage !== "idle";
  const c = STAGE_COLORS[stage];

  // Speed up rings during processing
  const outerSpeed = isProcessing ? "8s" : "20s";
  const innerSpeed = isProcessing ? "5s" : "12s";
  const orbit2Anim = isProcessing ? "aria-process-pulse 1.4s ease-in-out infinite" : "aria-spin-med 18s linear infinite";

  return (
    <div className="relative flex items-center justify-center" style={{ width: 'clamp(160px, 40vw, 240px)', height: 'clamp(160px, 40vw, 240px)' }}>
      {/* Outermost ring — slow rotate */}
      <div
        className="absolute inset-0 rounded-full border"
        style={{
          borderColor: c.ring,
          animation: `aria-spin-slow ${outerSpeed} linear infinite`,
          transform: `scale(${scale})`,
          transition: "transform 75ms ease-out, border-color 600ms ease",
          boxShadow: isProcessing ? `0 0 ${glow * 0.3}px ${c.ring}` : "none",
        }}
      />
      {/* Orbit ring 1 */}
      <div
        className="absolute rounded-full border"
        style={{
          inset: 20,
          borderColor: c.ring,
          animation: `aria-spin-med ${innerSpeed} linear infinite reverse`,
          transform: `scale(${scale})`,
          transition: "transform 75ms ease-out, border-color 600ms ease",
          boxShadow: isProcessing ? `0 0 ${glow * 0.4}px ${c.ring}` : "none",
        }}
      />
      {/* Orbit ring 2 — pulses during processing */}
      <div
        className="absolute rounded-full border-2"
        style={{
          inset: 44,
          borderColor: c.ring,
          animation: orbit2Anim,
          transform: `scale(${scale})`,
          transition: "transform 75ms ease-out, border-color 600ms ease",
          boxShadow: isActive ? `0 0 ${glow * 0.6}px ${c.ring}` : "none",
        }}
      />
      {/* Glow halo */}
      <div
        className="absolute rounded-full"
        style={{
          inset: 56,
          background: c.halo,
          filter: `blur(${8 + volume * 16}px)`,
          transform: `scale(${scale})`,
          transition: "all 75ms ease-out, background 600ms ease",
          opacity: isProcessing ? 0.7 + volume * 0.3 : 0.4 + volume * 0.6,
        }}
      />
      {/* Core sphere */}
      <div
        className="absolute rounded-full"
        style={{
          inset: 72,
          background: c.core,
          boxShadow: `0 0 ${coreGlow}px ${c.coreShadow}${0.5 + volume * 0.5}), inset 0 0 20px rgba(255,255,255,0.1)`,
          transform: `scale(${scale})`,
          transition: "all 75ms ease-out, background 600ms ease, box-shadow 600ms ease",
          animation: isProcessing ? "aria-core-breathe 1.8s ease-in-out infinite" : undefined,
        }}
      />
      {/* Specular highlight */}
      <div
        className="absolute rounded-full bg-white/30"
        style={{
          width: 24, height: 24,
          top: "calc(50% - 38px)", left: "calc(50% - 18px)",
          filter: "blur(4px)",
          opacity: 0.6 + volume * 0.4,
          transform: `scale(${0.8 + volume * 0.4})`,
          transition: "all 75ms ease-out",
        }}
      />
      {/* Center dot */}
      <div
        className={`absolute rounded-full ${c.dot}`}
        style={{
          width: 8, height: 8,
          top: "calc(50% - 4px)", left: "calc(50% - 4px)",
          boxShadow: `0 0 ${12 + volume * 20}px ${c.dotShadow}${0.8 + volume * 0.2})`,
          transform: `scale(${0.8 + volume * 0.5})`,
          transition: "all 75ms ease-out, background-color 600ms ease",
          animation: isProcessing ? "aria-dot-ping 1.2s ease-in-out infinite" : undefined,
        }}
      />
      {/* Status label */}
      <div className="absolute bottom-0 text-center flex flex-col items-center gap-1">
        {isSpeaking ? (
          <div className="flex flex-col items-center gap-1">
            <SpeakingWaveform />
            <p className="text-[10px] font-bold tracking-widest text-emerald-400/90">◎ SPEAKING</p>
          </div>
        ) : (
          <p className={`text-[10px] font-bold tracking-widest ${c.label}`}>{c.labelText}</p>
        )}
      </div>
    </div>
  );
}

function TypingDots() {
  return (
    <div className="flex gap-1">
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="w-1.5 h-1.5 bg-slate-400 rounded-full"
          style={{
            animation: `aria-bounce 1.4s infinite`,
            animationDelay: `${i * 0.2}s`,
          }}
        />
      ))}
    </div>
  );
}

function StatusBox({ icon: Icon, label, value, status, onClick }: {
  icon: React.ElementType;
  label: string;
  value: string;
  status: 'ok' | 'warn' | 'info';
  onClick: () => void;
}) {
  const colors = {
    ok: { bg: "bg-emerald-500/10", border: "border-emerald-500/30", icon: "text-emerald-400", val: "text-emerald-300" },
    warn: { bg: "bg-amber-500/10", border: "border-amber-500/30", icon: "text-amber-400", val: "text-amber-300" },
    info: { bg: "bg-cyan-500/10", border: "border-cyan-500/30", icon: "text-cyan-400", val: "text-cyan-300" },
  }[status];

  return (
    <button
      onClick={onClick}
      className={`${colors.bg} border ${colors.border} rounded-lg p-2 hover:scale-105 transition-transform cursor-pointer`}
    >
      <div className="flex items-center justify-between">
        <Icon size={15} className={colors.icon} />
        <span className={`text-[10px] font-bold tracking-wide ${colors.val}`}>{value}</span>
      </div>
      <span className="text-xs font-medium text-slate-300 leading-tight">{label}</span>
    </button>
  );
}

/* ─── Main Component ─────────────────────────────────────────────────────── */
const ARIA_CHAT_STORAGE_KEY = "aria_chat_history";
const ARIA_PREFS_KEY = "aria_voice_prefs";

// Load/save voice preferences
function loadVoicePrefs() {
  if (typeof window === "undefined") return null;
  try {
    const stored = localStorage.getItem(ARIA_PREFS_KEY);
    return stored ? JSON.parse(stored) : null;
  } catch { return null; }
}
function saveVoicePrefs(prefs: { ttsSpeed: number; ttsMode: string; voiceEnabled: boolean; micSensitivity: number; requireWakeWord: boolean }) {
  if (typeof window === "undefined") return;
  try { localStorage.setItem(ARIA_PREFS_KEY, JSON.stringify(prefs)); } catch {}
}

// Load chat history from localStorage
function loadChatHistory(): Message[] {
  if (typeof window === "undefined") return [];
  try {
    const stored = localStorage.getItem(ARIA_CHAT_STORAGE_KEY);
    if (!stored) return [];
    const parsed = JSON.parse(stored);
    // Convert timestamp strings back to Date objects
    return Array.isArray(parsed) ? parsed.map((m: any): Message => ({
      id: m.id,
      role: m.role as "user" | "aria",
      content: m.content,
      timestamp: new Date(m.timestamp),
      isVoice: m.isVoice
    })) : [];
  } catch (e) {
    console.error("Failed to load chat history:", e);
    return [];
  }
}

// Save chat history to localStorage
function saveChatHistory(msgs: Message[]) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(ARIA_CHAT_STORAGE_KEY, JSON.stringify(msgs));
  } catch (e) {
    console.error("Failed to save chat history:", e);
  }
}

export default function AriaCommandCenter() {
  const [messages, setMessages] = useState<Message[]>(() => loadChatHistory());
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const savedPrefs = loadVoicePrefs();
  const [voiceEnabled, setVoiceEnabled] = useState(savedPrefs?.voiceEnabled ?? true);
  const [audioVolume, setAudioVolume] = useState(0);
  const [ttsSpeed, setTtsSpeed] = useState(savedPrefs?.ttsSpeed ?? 0.95);
  const [ttsMode, setTtsMode] = useState<'voice' | 'text' | 'both'>(savedPrefs?.ttsMode ?? 'both');
  const [micSensitivity, setMicSensitivity] = useState(savedPrefs?.micSensitivity ?? 0.4);
  const [requireWakeWord, setRequireWakeWord] = useState(savedPrefs?.requireWakeWord ?? false);

  // Persist voice preferences on change
  useEffect(() => {
    saveVoicePrefs({ ttsSpeed, ttsMode, voiceEnabled, micSensitivity, requireWakeWord });
  }, [ttsSpeed, ttsMode, voiceEnabled, micSensitivity, requireWakeWord]);
  const [voiceActivityDetected, setVoiceActivityDetected] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  
  // Quick Action Modals state
  const [showProvisionModal, setShowProvisionModal] = useState(false);
  const [showWorkflowModal, setShowWorkflowModal] = useState(false);
  const [showAgentStatusModal, setShowAgentStatusModal] = useState(false);
  const [showSettingsModal, setShowSettingsModal] = useState(false);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);
  const silenceTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const voiceActivityTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const askMutation = trpc.aria.askQuestion.useMutation();
  const { data: agentMetrics, refetch: refetchAgents } = trpc.aria.getAgentMetrics.useQuery();
  const { data: briefingData } = trpc.aria.getProactiveBriefing.useQuery(undefined, { refetchOnWindowFocus: false, staleTime: 60_000 });

  // Poll agent metrics every 10 seconds
  useEffect(() => {
    const interval = setInterval(() => {
      refetchAgents();
    }, 10000);
    return () => clearInterval(interval);
  }, [refetchAgents]);

  /* Proactive briefing — announce system alerts on mount */
  const hasBriefedRef = useRef(false);
  useEffect(() => {
    if (hasBriefedRef.current) return;
    if (!briefingData || !briefingData.alerts || briefingData.alerts.length === 0) return;
    if (messages.length > 0) return; // Don't brief if returning to existing conversation
    hasBriefedRef.current = true;
    const briefingContent = `## \u26a1 Morning Briefing\n\n${briefingData.alerts.join('\n\n')}`;
    setTimeout(() => {
      addMessage({ role: "aria", content: briefingContent, timestamp: new Date() });
      if ((ttsMode === 'voice' || ttsMode === 'both') && voiceEnabled && briefingData.hasCritical) {
        setIsSpeaking(true);
        speakAsAria("Heads up. I've detected issues that need your attention. Check the briefing above.", ttsSpeed, () => setIsSpeaking(false));
      }
    }, 1200);
  }, [briefingData]); // eslint-disable-line react-hooks/exhaustive-deps

  /* Aria greeting on first load — only when no prior messages exist */
  const hasGreetedRef = useRef(false);
  useEffect(() => {
    if (hasGreetedRef.current) return;
    if (messages.length > 0) return; // Don't greet if chat history exists
    if (!voiceEnabled) return;
    hasGreetedRef.current = true;
    // Small delay to let the page render first
    const timer = setTimeout(() => {
      const greeting = "Aria online. How can I help you today?";
      setIsSpeaking(true);
      speakAsAria(greeting, ttsSpeed, () => setIsSpeaking(false));
    }, 800);
    return () => clearTimeout(timer);
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  /* inject keyframe CSS once */
  useEffect(() => {
    const id = "aria-keyframes";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @keyframes aria-bounce        { 0%,100%{transform:translateY(0);opacity:.5} 50%{transform:translateY(-5px);opacity:1} }
      @keyframes aria-pulse         { 0%,100%{transform:scale(1);opacity:0.7} 50%{transform:scale(1.08);opacity:1} }
      @keyframes aria-spin-slow     { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes aria-spin-med      { from{transform:rotate(0deg)} to{transform:rotate(360deg)} }
      @keyframes aria-process-pulse { 0%,100%{transform:scale(1);opacity:0.6;box-shadow:0 0 8px currentColor} 50%{transform:scale(1.12);opacity:1;box-shadow:0 0 28px currentColor} }
      @keyframes aria-core-breathe  { 0%,100%{filter:brightness(1) saturate(1)} 50%{filter:brightness(1.3) saturate(1.4)} }
      @keyframes aria-dot-ping      { 0%,100%{transform:scale(0.8);opacity:0.8} 50%{transform:scale(1.6);opacity:1} }
      @keyframes aria-wave-bar       { 0%,100%{transform:scaleY(0.3);opacity:0.5} 50%{transform:scaleY(1);opacity:1} }
    `;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stage]);

  const addMessage = useCallback((msg: Omit<Message, "id">) => {
    setMessages((prev) => {
      const newMessages = [...prev, { ...msg, id: `${Date.now()}-${Math.random()}` }];
      saveChatHistory(newMessages);
      return newMessages;
    });
  }, []);

  /* Audio volume analysis with voice activity detection */
  const analyzeVolume = useCallback(() => {
    if (!analyzerRef.current) return;
    const data = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    const volume = Math.min(Math.sqrt(sum / data.length) / 128, 1);
    setAudioVolume(volume);
    
    // Voice Activity Detection
    const hasVoiceActivity = detectVoiceActivity(data, micSensitivity);
    if (hasVoiceActivity) {
      setVoiceActivityDetected(true);
      if (voiceActivityTimeoutRef.current) clearTimeout(voiceActivityTimeoutRef.current);
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    } else if (voiceActivityDetected) {
      // Silence detected - start timeout to auto-stop recording
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      silenceTimeoutRef.current = setTimeout(() => {
        if (isRecording && voiceActivityDetected) {
          stopRecording();
        }
      }, 1500); // 1.5 seconds of silence
    }
    
    rafRef.current = requestAnimationFrame(analyzeVolume);
  }, [isRecording, voiceActivityDetected, micSensitivity]);

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      if (!audioCtxRef.current) {
        audioCtxRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
      }
      const src = audioCtxRef.current.createMediaStreamSource(stream);
      const analyzer = audioCtxRef.current.createAnalyser();
      analyzer.fftSize = 256;
      src.connect(analyzer);
      analyzerRef.current = analyzer;

      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };
      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
        if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
        if (voiceActivityTimeoutRef.current) clearTimeout(voiceActivityTimeoutRef.current);
        setAudioVolume(0);

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        if (blob.size < 1000) {
          toast.error("No audio detected. Please speak clearly.");
          setStage("idle");
          setVoiceActivityDetected(false);
          return;
        }
        
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];
          setStage("transcribing");
          const placeholderId = `voice-${Date.now()}`;
          setMessages((prev) => {
            const newMessages = [...prev, { id: placeholderId, role: "user" as const, content: "🎤 Voice message (transcribing...)", timestamp: new Date(), isVoice: true }];
            saveChatHistory(newMessages);
            return newMessages;
          });
          setStage("thinking");
          try {
            // Build conversation history for voice messages too
            const voiceHistory = messages.filter(m => m.role === 'user' || m.role === 'aria').slice(-5).map(m => ({
              role: m.role === 'aria' ? 'assistant' as const : 'user' as const,
              content: m.content,
            }));
            const result = await askMutation.mutateAsync({ question: "voice", audioBase64: base64, conversationHistory: voiceHistory, context: { systemStatus: true } });
            
            // Handle voice_error from backend (transcription failed)
            if (result.intent === 'voice_error') {
              setMessages((prev) => {
                const updated = prev.map((m) => m.id === placeholderId ? { ...m, content: `🎤 (voice not recognized)` } : m);
                saveChatHistory(updated);
                return updated;
              });
              addMessage({ role: "aria", content: result.response, timestamp: new Date() });
              if ((ttsMode === 'voice' || ttsMode === 'both') && voiceEnabled) { setIsSpeaking(true); speakAsAria(result.response, ttsSpeed, () => setIsSpeaking(false)); }
              setStage("idle");
              setVoiceActivityDetected(false);
              return;
            }

            // Wake word check: if required and not detected, still process but show subtle hint
            const wakeWordDetected = detectWakeWord(result.transcribedQuestion || "");
            if (requireWakeWord && !wakeWordDetected) {
              // Still show the transcription and response — don't block the user
              setMessages((prev) => {
                const updated = prev.map((m) => m.id === placeholderId ? { ...m, content: `🎤 ${result.transcribedQuestion || "Voice message"}` } : m);
                saveChatHistory(updated);
                return updated;
              });
              setStage("responding");
              await new Promise((r) => setTimeout(r, 200));
              addMessage({ role: "aria", content: result.response, timestamp: new Date() });
              if ((ttsMode === 'voice' || ttsMode === 'both') && voiceEnabled) { setIsSpeaking(true); speakAsAria(result.response, ttsSpeed, () => setIsSpeaking(false)); }
              setStage("idle");
              setVoiceActivityDetected(false);
              return;
            }
            
            setMessages((prev) => {
              const updated = prev.map((m) => m.id === placeholderId ? { ...m, content: `🎤 ${result.transcribedQuestion || "Voice message"}` } : m);
              saveChatHistory(updated);
              return updated;
            });
            setStage("responding");
            await new Promise((r) => setTimeout(r, 200));
            addMessage({ role: "aria", content: result.response, timestamp: new Date() });
            if ((ttsMode === 'voice' || ttsMode === 'both') && voiceEnabled) { setIsSpeaking(true); speakAsAria(result.response, ttsSpeed, () => setIsSpeaking(false)); }
          } catch { toast.error("Voice processing failed"); }
          finally { setStage("idle"); setVoiceActivityDetected(false); }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecording(true);
      setVoiceActivityDetected(false);
      setStage(requireWakeWord ? "waiting_for_wake_word" : "listening");
      rafRef.current = requestAnimationFrame(analyzeVolume);
    } catch { toast.error("Microphone access denied"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
      if (voiceActivityTimeoutRef.current) clearTimeout(voiceActivityTimeoutRef.current);
      setAudioVolume(0);
      setVoiceActivityDetected(false);
    }
  };

  // ============ Slash Command Definitions ============
  const SLASH_COMMANDS: Record<string, { description: string; transform: (args: string) => string }> = {
    '/tickets': { description: 'Show ticket summary', transform: (args) => args ? `Show me ${args} tickets` : 'Give me a full ticket status breakdown by priority and status' },
    '/status': { description: 'Full system dashboard', transform: () => 'Give me a complete system status report — tickets, SLA, uptime, agents, M365 health' },
    '/health': { description: 'M365 service health', transform: () => 'What is the current Microsoft 365 service health status?' },
    '/sla': { description: 'SLA breach report', transform: (args) => args ? `Show SLA status for ${args}` : 'Show all current SLA breaches and at-risk tickets' },
    '/kb': { description: 'Search knowledge base', transform: (args) => args ? `Search the knowledge base for: ${args}` : 'Show me the most recent KB articles' },
    '/ps': { description: 'PowerShell command', transform: (args) => args ? `Give me the PowerShell command for: ${args}` : 'What PowerShell commands do you recommend for my current situation?' },
    '/assign': { description: 'Assign a ticket', transform: (args) => `Assign ticket ${args}` },
    '/close': { description: 'Close a ticket', transform: (args) => `Close ticket ${args}` },
    '/escalate': { description: 'Escalate a ticket', transform: (args) => `Escalate ticket ${args} to critical priority` },
    '/triage': { description: 'AI triage a ticket', transform: (args) => args ? `Run full AI triage on ticket #${args} — classify priority, category, and suggest assignee` : 'Which tickets need triage?' },
    '/provision': { description: 'Provision a client', transform: (args) => args ? `Provision new client: ${args}` : 'Start client provisioning workflow' },
    '/help': { description: 'Show available commands', transform: () => 'SLASH_HELP' },
  };

  const handleSend = async () => {
    const q = input.trim();
    if (!q || stage !== "idle") return;
    setInput("");
    
    // Add user message and save
    setMessages((prev) => {
      const newMessages = [...prev, { id: `${Date.now()}-${Math.random()}`, role: "user" as const, content: q, timestamp: new Date() }];
      saveChatHistory(newMessages);
      return newMessages;
    });

    // ============ Slash Command Handling ============
    if (q.startsWith('/')) {
      const parts = q.split(' ');
      const cmd = parts[0].toLowerCase();
      const args = parts.slice(1).join(' ');
      const slashCmd = SLASH_COMMANDS[cmd];
      
      if (cmd === '/help' || (slashCmd && slashCmd.transform(args) === 'SLASH_HELP')) {
        const helpText = `## ⚡ Aria Slash Commands\n\n| Command | Description |\n|---------|-------------|\n${Object.entries(SLASH_COMMANDS).map(([k, v]) => `| \`${k}\` | ${v.description} |`).join('\n')}\n\n**Usage:** Type a command + optional arguments. Example: \`/tickets critical\` or \`/ps Get-Mailbox\``;
        addMessage({ role: "aria", content: helpText, timestamp: new Date() });
        if ((ttsMode === 'voice' || ttsMode === 'both') && voiceEnabled) { setIsSpeaking(true); speakAsAria("Here are my available slash commands. Type slash help anytime to see them again.", ttsSpeed, () => setIsSpeaking(false)); }
        return;
      }
      
      if (!slashCmd) {
        addMessage({ role: "aria", content: `Unknown command \`${cmd}\`. Type \`/help\` to see available commands.`, timestamp: new Date() });
        return;
      }
      
      // Transform slash command into natural language query and continue to normal flow
      const transformedQuery = slashCmd.transform(args);
      setStage("thinking");
      const timer = setTimeout(() => setStage("searching"), 1200);
      try {
        const recentHistory = messages.filter(m => m.role === 'user' || m.role === 'aria').slice(-5).map(m => ({
          role: m.role === 'aria' ? 'assistant' as const : 'user' as const,
          content: m.content,
        }));
        const result = await askMutation.mutateAsync({ question: transformedQuery, conversationHistory: recentHistory, context: { systemStatus: true } });
        clearTimeout(timer);
        setStage("responding");
        await new Promise((r) => setTimeout(r, 200));
        addMessage({ role: "aria", content: result.response, timestamp: new Date() });
        if ((ttsMode === 'voice' || ttsMode === 'both') && voiceEnabled) { setIsSpeaking(true); speakAsAria(result.response, ttsSpeed, () => setIsSpeaking(false)); }
      } catch {
        clearTimeout(timer);
        toast.error("Aria failed to respond. Please try again.");
      } finally {
        setStage("idle");
        setTimeout(() => inputRef.current?.focus(), 100);
      }
      return;
    }
    
    setStage("thinking");
    const timer = setTimeout(() => setStage("searching"), 1200);
    try {
      // Build conversation history from last 5 messages for multi-turn context
      const recentHistory = messages.filter(m => m.role === 'user' || m.role === 'aria').slice(-5).map(m => ({
        role: m.role === 'aria' ? 'assistant' as const : 'user' as const,
        content: m.content,
      }));
      const result = await askMutation.mutateAsync({ question: q, conversationHistory: recentHistory, context: { systemStatus: true } });
      clearTimeout(timer);
      setStage("responding");
      await new Promise((r) => setTimeout(r, 200));
      addMessage({ role: "aria", content: result.response, timestamp: new Date() });
      if ((ttsMode === 'voice' || ttsMode === 'both') && voiceEnabled) { setIsSpeaking(true); speakAsAria(result.response, ttsSpeed, () => setIsSpeaking(false)); }
    } catch {
      clearTimeout(timer);
      toast.error("Aria failed to respond. Please try again.");
    } finally {
      setStage("idle");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const stopSpeakingHandler = () => { stopSpeaking(); setIsSpeaking(false); };
  const saveChat = () => {
    const txt = messages.map((m) => `[${m.timestamp.toLocaleTimeString()}] ${m.role.toUpperCase()}:\n${m.content}`).join("\n\n---\n\n");
    const a = document.createElement("a");
    a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(txt)}`;
    a.download = `aria-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    toast.success("Chat saved");
  };
  const deleteMessage = useCallback((messageId: string) => {
    setMessages((prev) => {
      const updated = prev.filter((m) => m.id !== messageId);
      saveChatHistory(updated);
      return updated;
    });
    toast.success("Message deleted");
  }, []);

  const clearChat = useCallback(() => {
    if (typeof window === "undefined") return;
    if (confirm("Clear all messages?")) {
      setMessages([]);
      saveChatHistory([]);
      toast.success("Chat cleared");
    }
  }, []);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    if (silenceTimeoutRef.current) clearTimeout(silenceTimeoutRef.current);
    if (voiceActivityTimeoutRef.current) clearTimeout(voiceActivityTimeoutRef.current);
    audioCtxRef.current?.close().catch(() => {});
  }, []);

  const isProcessing = stage !== "idle";
  const isActive = isRecording || isSpeaking || isProcessing;

  const triggerQuery = (query: string) => {
    setInput(query);
    setTimeout(() => inputRef.current?.focus(), 50);
  };

  /* Fetch live system metrics */
  const { data: metrics } = trpc.helpdesk.getMetrics.useQuery(undefined, { refetchInterval: 30_000 });
  const { data: systemContext } = trpc.aria.getSystemContext.useQuery(undefined, { refetchInterval: 30_000 });
  const { data: ticketTrends } = trpc.helpdeskDashboardMetrics.getTicketTrends.useQuery({ days: 7 }, { refetchInterval: 60_000 });

  const openTicketCount = (metrics?.open ?? 0) + (metrics?.inProgress ?? 0);
  const criticalCount = metrics?.byPriority?.critical ?? 0;
  const avgResolutionTime = metrics?.avgResolutionHours ? `${(metrics.avgResolutionHours / 60).toFixed(1)}h` : "N/A";
  const kbArticleCount = systemContext?.kbArticleCount ?? 0;
  const uptime = systemContext?.uptime24h ?? "99.9%";

  const systemBoxes: Array<{ icon: React.ElementType; label: string; value: string; status: 'ok' | 'warn' | 'info'; query: string }> = [
    { icon: AlertTriangle, label: "Open Tickets",    value: openTicketCount.toString(), status: openTicketCount > 5 ? "warn" : "ok" as const, query: "Show me a summary of all currently open support tickets, their priority levels, and which ones need immediate attention." },
    { icon: CheckCircle2, label: "System Status",    value: uptime, status: "ok"   as const, query: "What is the current system status across all GigitekAI services? Are there any active incidents or scheduled maintenance?" },
    { icon: AlertTriangle,label: "Critical Issues",  value: criticalCount.toString(), status: criticalCount > 0 ? "warn" : "ok" as const, query: `What are the ${criticalCount} critical issue(s) currently open? Provide full details, impact assessment, and recommended resolution steps.` },
    { icon: Clock,        label: "Avg Resolution",   value: avgResolutionTime, status: "info" as const, query: `Analyze our current average ticket resolution time of ${avgResolutionTime}. What are the top bottlenecks and how can we improve?` },
    { icon: Zap,          label: "KB Articles",      value: kbArticleCount.toString(), status: "ok"   as const, query: "What are the most frequently accessed knowledge base articles this week? Show trending topics and gaps." },
    { icon: Terminal,     label: "PowerShell Help",  value: "Ready", status: "info" as const, query: "Give me the top 10 most useful PowerShell commands for Microsoft 365 administration, with examples." },
  ];

  return (
    <div className="flex flex-col bg-slate-950 text-white" style={{ height: "100%", minHeight: 0, overflow: "hidden" }}>

      {/* ── Top Bar — Compact on mobile, full on desktop ────────────────── */}
      <div className="flex-shrink-0 border-b border-white/5 bg-slate-900/80 backdrop-blur-md">
        {/* Primary row: Logo + Status + Settings toggle */}
        <div className="flex items-center justify-between px-3 sm:px-6 py-2 sm:py-3">
          <div className="flex items-center gap-2 sm:gap-3">
            <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
              <Brain className="w-4 h-4 sm:w-5 sm:h-5 text-cyan-400" />
            </div>
            <div>
              <h1 className="text-sm sm:text-base font-bold text-white leading-none">Aria</h1>
              <p className="text-[10px] text-slate-500 mt-0.5 hidden sm:block">M365 · Azure · Exchange · Admin Brain</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5 sm:gap-2">
            {/* Status indicator */}
            <div className={`flex items-center gap-1.5 px-2 sm:px-3 py-1 sm:py-1.5 rounded-full border text-[10px] sm:text-[11px] font-medium transition-all ${
              isProcessing ? "border-amber-500/40 bg-amber-500/10 text-amber-300" :
              isSpeaking   ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" :
                             "border-slate-700 bg-slate-800/50 text-slate-400"
            }`}>
              <span className={`w-1.5 h-1.5 rounded-full ${
                isProcessing ? "bg-amber-400 animate-pulse" :
                isSpeaking   ? "bg-emerald-400 animate-pulse" :
                               "bg-cyan-500"
              }`} />
              <span>{isSpeaking ? "Speaking" : STAGE_LABEL[stage]}</span>
              {isSpeaking && (
                <button onClick={stopSpeakingHandler} className="text-slate-500 hover:text-red-400 ml-0.5 transition-colors" title="Stop speaking">
                  <VolumeX size={10} />
                </button>
              )}
            </div>
            {/* Voice toggle */}
            <button
              onClick={() => { if (isSpeaking) stopSpeakingHandler(); setVoiceEnabled((v: boolean) => !v); }}
              className={`p-1.5 sm:p-2 rounded-full border transition-all ${
                voiceEnabled ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10" : "border-slate-700 text-slate-500 bg-slate-800/50"
              }`}
              title={voiceEnabled ? "Voice On" : "Voice Off"}
            >
              {voiceEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            </button>
            {/* Settings toggle */}
            <button
              onClick={() => setShowSettings(!showSettings)}
              className={`p-1.5 sm:p-2 rounded-full border transition-all ${
                showSettings ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10" : "border-slate-700 text-slate-500 bg-slate-800/50"
              }`}
              title="Voice & mic settings"
            >
              <Settings size={13} />
            </button>
          </div>
        </div>
        {/* Collapsible settings row */}
        {showSettings && (
          <div className="flex items-center gap-2 px-3 sm:px-6 py-2 border-t border-white/5 bg-slate-900/40 flex-wrap">
            <select value={ttsMode} onChange={(e) => setTtsMode(e.target.value as any)} className="text-[10px] sm:text-xs px-2 py-1 rounded-full border border-slate-700 bg-slate-800/50 text-slate-300">
              <option value="both">Voice + Text</option>
              <option value="voice">Voice Only</option>
              <option value="text">Text Only</option>
            </select>
            {(ttsMode === 'voice' || ttsMode === 'both') && (
              <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 bg-slate-800/50">
                <span className="text-[9px] sm:text-[10px] text-slate-500">Speed:</span>
                <input
                  type="range" min="0.5" max="2" step="0.25"
                  value={ttsSpeed}
                  onChange={(e) => {
                    const v = parseFloat(e.target.value);
                    setTtsSpeed(v);
                    // Stop any current speech so next response uses new speed
                    if (isSpeaking) { stopSpeaking(); setIsSpeaking(false); }
                  }}
                  className="w-10 sm:w-14 h-1 bg-slate-700 rounded cursor-pointer accent-cyan-400"
                />
                <span className="text-[9px] sm:text-[10px] text-cyan-400 font-mono">
                  {ttsSpeed.toFixed(2)}x
                </span>
                <span className="text-[9px] text-slate-600 hidden sm:inline">
                  ({ttsSpeed >= 1 ? '+' : ''}{Math.round((ttsSpeed - 1) * 100)}%)
                </span>
              </div>
            )}
            <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 bg-slate-800/50">
              <span className="text-[9px] sm:text-[10px] text-slate-500">Mic:</span>
              <input type="range" min="0.1" max="0.8" step="0.1" value={micSensitivity} onChange={(e) => setMicSensitivity(parseFloat(e.target.value))} className="w-10 sm:w-12 h-1 bg-slate-700 rounded cursor-pointer" />
              <span className="text-[9px] sm:text-[10px] text-slate-400">{(1 - micSensitivity).toFixed(1)}</span>
            </div>
            <button
              onClick={() => setRequireWakeWord(!requireWakeWord)}
              className={`text-[10px] sm:text-xs px-2 py-1 rounded-full border transition-all ${
                requireWakeWord ? "border-purple-500/40 text-purple-400 bg-purple-500/10" : "border-slate-700 text-slate-500 bg-slate-800/50"
              }`}
            >
              Wake: {requireWakeWord ? "ON" : "OFF"}
            </button>
          </div>
        )}
      </div>

      {/* ── Quick Action Chips — visible when no messages ─────────────────── */}
      {messages.length === 0 && (
        <div className="flex-shrink-0 px-3 sm:px-6 py-2 border-b border-white/5 bg-slate-900/40 overflow-x-auto">
          <div className="flex gap-1.5 sm:gap-2 min-w-max">
            {[
              { label: "System Status", query: "What is the current system status across all GigitekAI services?" },
              { label: "Open Tickets", query: "Show me all open tickets with priority levels" },
              { label: "M365 Health", query: "What is the current Microsoft 365 service health status?" },
              { label: "PowerShell", query: "Give me the top 10 PowerShell commands for M365 admin" },
              { label: "Uptime", query: "What is our current website and service uptime?" },
              { label: "All Pages", query: "Show me all admin portal pages and their functions" },
            ].map((chip) => (
              <button
                key={chip.label}
                onClick={() => { setInput(chip.query); setTimeout(() => inputRef.current?.focus(), 50); }}
                className="text-[10px] sm:text-xs px-2.5 sm:px-3 py-1 sm:py-1.5 rounded-full border border-cyan-500/20 bg-cyan-500/5 text-cyan-400 hover:bg-cyan-500/15 hover:border-cyan-500/40 transition-all whitespace-nowrap"
              >
                {chip.label}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* ── Main Layout ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden" style={{ minWidth: 0 }}>

        {/* ── Left Panel: Sphere + Status Grid — hidden on mobile, visible on lg ─────── */}
        <div className="hidden lg:flex flex-col items-center gap-4 px-4 sm:px-6 py-4 lg:py-6 lg:w-80 xl:w-96 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/5 overflow-y-auto lg:overflow-hidden">
          {/* Sphere */}
          <div className="flex-shrink-0">
            <HolographicSphere isActive={isActive} volume={audioVolume} stage={stage} isSpeaking={isSpeaking} />
          </div>

          {/* Status Grid */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-2 gap-2 w-full">
            {systemBoxes.map((box) => (
              <StatusBox
                key={box.label}
                icon={box.icon}
                label={box.label}
                value={box.value}
                status={box.status}
                onClick={() => triggerQuery(box.query)}
              />
            ))}
          </div>

          {/* Hint */}
          <p className="text-[10px] text-slate-600 text-center hidden lg:block">
            Click a box to query Aria · Voice or type below
          </p>
        </div>

        {/* ── Right Panel: Chat ─────────────────────────────────────────── */}
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden" style={{ minHeight: 0 }}>
          {/* Messages */}
          <div className="flex-1 overflow-y-auto px-3 sm:px-6 py-2 sm:py-4 space-y-2 sm:space-y-3" style={{ overscrollBehavior: 'contain' }}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
                <Activity className="w-8 h-8 text-cyan-500/40" />
                <p className="text-slate-500 text-sm">Ask Aria anything — tickets, M365, Azure, PowerShell...</p>
                <p className="text-slate-600 text-xs">Click a status box or type below to get started</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"} group`}>
                    {msg.role === "aria" && (
                      <div className="w-5 h-5 sm:w-6 sm:h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 mr-1.5 sm:mr-2 mt-0.5">
                        <Brain size={10} className="sm:w-3 sm:h-3 text-cyan-400" />
                      </div>
                    )}
                    <div className="relative">
                      <div className={`max-w-[92%] sm:max-w-[75%] rounded-2xl px-3 sm:px-4 py-2 sm:py-3 text-sm sm:text-sm ${
                        msg.role === "user"
                          ? "bg-cyan-600/20 border border-cyan-500/30 text-white rounded-tr-sm"
                          : "bg-slate-800/70 border border-white/5 text-slate-50 rounded-tl-sm"
                      }`}>
                        {msg.role === "aria" ? (
                          <div className="prose prose-sm prose-invert max-w-none
                            [&>p]:my-2 [&>p]:text-base sm:[&>p]:text-sm [&>p]:leading-relaxed
                            [&>ul]:my-2 [&>ol]:my-2 [&>li]:my-1 [&>li]:text-base sm:[&>li]:text-sm
                            [&>h1]:text-lg [&>h2]:text-base [&>h3]:text-base
                            [&>pre]:bg-slate-900 [&>pre]:rounded-lg [&>pre]:p-3 [&>pre]:my-2 [&>pre]:overflow-x-auto [&>pre]:text-xs
                            [&>code]:bg-slate-900 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-cyan-300 [&>code]:text-xs
                            [&>strong]:text-white [&>a]:text-cyan-400">
                            <Streamdown>{msg.content}</Streamdown>
                          </div>
                        ) : (
                          <p className="leading-relaxed text-base sm:text-sm">{msg.content}</p>
                        )}
                      <p className="text-[10px] sm:text-xs text-slate-400 mt-1 sm:mt-2 text-right">
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
                      </div>
                      {/* Delete button - appears on hover */}
                      <button
                        onClick={() => deleteMessage(msg.id)}
                        className="absolute -top-1.5 -right-1.5 sm:-top-2 sm:-right-2 opacity-0 group-hover:opacity-100 transition-opacity bg-red-600/80 hover:bg-red-700 rounded-full p-0.5 sm:p-1 shadow-lg"
                        title="Delete message"
                      >
                        <Trash2 size={12} className="sm:w-3.5 sm:h-3.5 text-white" />
                      </button>
                    </div>
                  </div>
                ))}

                {/* Typing indicator */}
                {isProcessing && (
                  <div className="flex justify-start">
                    <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                      <Brain size={12} className="text-cyan-400" />
                    </div>
                    <div className="bg-slate-800/70 border border-white/5 rounded-2xl rounded-tl-sm px-4 py-3">
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-slate-400">{STAGE_LABEL[stage]}</span>
                        <TypingDots />
                      </div>
                    </div>
                  </div>
                )}
                <div ref={messagesEndRef} />
              </>
            )}
          </div>

          {/* Mobile Compact Sphere — visible only on mobile/tablet (below lg) */}
          <div className="flex-shrink-0 lg:hidden flex items-center justify-center py-2 border-t border-white/5 bg-slate-900/40">
            <div className="relative flex items-center gap-3">
              {/* Mini sphere */}
              <div className="relative w-12 h-12">
                <div className={`absolute inset-0 rounded-full border transition-all ${
                  isSpeaking ? "border-emerald-400/40 shadow-[0_0_12px_rgba(52,211,153,0.3)]" :
                  isProcessing ? "border-amber-400/40 shadow-[0_0_12px_rgba(251,191,36,0.3)]" :
                  isRecording ? "border-cyan-300/40 shadow-[0_0_12px_rgba(34,211,238,0.3)]" :
                  "border-cyan-500/20"
                }`} />
                <div className={`absolute inset-2 rounded-full transition-all ${
                  isSpeaking ? "bg-gradient-to-br from-emerald-300 to-emerald-600" :
                  isProcessing ? "bg-gradient-to-br from-amber-200 to-amber-600" :
                  isRecording ? "bg-gradient-to-br from-cyan-200 to-cyan-600" :
                  "bg-gradient-to-br from-cyan-300 to-cyan-700"
                }`} style={{ animation: isProcessing || isSpeaking ? 'aria-core-breathe 1.8s ease-in-out infinite' : undefined }} />
              </div>
              {/* Status + waveform */}
              <div className="flex flex-col items-start">
                {isSpeaking ? (
                  <div className="flex items-center gap-2">
                    <SpeakingWaveform />
                    <span className="text-[10px] font-bold text-emerald-400">SPEAKING</span>
                    <button onClick={stopSpeakingHandler} className="text-slate-500 hover:text-red-400 transition-colors">
                      <VolumeX size={12} />
                    </button>
                  </div>
                ) : (
                  <span className={`text-[10px] font-bold tracking-wider ${
                    isProcessing ? "text-amber-400" :
                    isRecording ? "text-cyan-300" :
                    "text-slate-500"
                  }`}>{isRecording ? "LISTENING" : STAGE_LABEL[stage].toUpperCase()}</span>
                )}
                <span className="text-[9px] text-slate-600">Azure Neural · JennyNeural</span>
              </div>
            </div>
          </div>

          {/* Input Bar */}
          <div className="flex-shrink-0 border-t border-white/5 bg-slate-900/60 backdrop-blur px-4 sm:px-6 py-3 sm:py-4" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}>
            {/* Slash command autocomplete dropdown */}
            {input.startsWith('/') && input.length > 0 && (() => {
              const typed = input.toLowerCase();
              const matches = Object.entries(SLASH_COMMANDS).filter(([cmd]) => cmd.startsWith(typed) && cmd !== typed);
              if (matches.length === 0) return null;
              return (
                <div className="mb-2 bg-slate-800/95 border border-slate-700/60 rounded-xl overflow-hidden backdrop-blur-sm shadow-xl max-h-48 overflow-y-auto">
                  {matches.map(([cmd, info]) => (
                    <button
                      key={cmd}
                      onClick={() => { setInput(cmd + ' '); inputRef.current?.focus(); }}
                      className="w-full flex items-center gap-3 px-4 py-2.5 text-left hover:bg-cyan-500/10 transition-colors border-b border-slate-700/30 last:border-0"
                    >
                      <span className="text-cyan-400 font-mono text-sm font-semibold min-w-[90px]">{cmd}</span>
                      <span className="text-slate-400 text-xs">{info.description}</span>
                    </button>
                  ))}
                </div>
              );
            })()}
            <div className="flex items-center gap-2">
              <div className="flex items-center gap-1">
                <Button
                  onClick={isRecording ? stopRecording : startRecording}
                  variant="outline"
                  size="sm"
                  className={`flex-shrink-0 transition-all ${
                    isRecording
                      ? "bg-red-500/20 border-red-500/60 text-red-400 hover:bg-red-500/30"
                      : "border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/10"
                  }`}
                  title={isRecording ? "Stop recording" : "Start voice recording"}
                >
                  {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                  <span className="ml-1.5 text-xs hidden sm:inline">{isRecording ? "Stop" : "Voice"}</span>
                </Button>
                {isRecording && (
                  <div className="text-[10px] text-slate-400 px-2 py-1 rounded-full border border-slate-700 bg-slate-800/50">
                    {stage === "waiting_for_wake_word" ? "Say 'Hey Aria'" : voiceActivityDetected ? "Recording..." : "Waiting for voice..."}
                  </div>
                )}
              </div>

              <Input
                ref={inputRef}
                value={input}
                onChange={(e) => setInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
                placeholder="Ask Aria — tickets, M365, Azure, PowerShell..."
                className="flex-1 bg-slate-800/60 border-slate-700/50 focus:border-cyan-500/50 text-white placeholder-slate-500 text-sm rounded-xl"
                disabled={isProcessing}
              />

              <Button
                onClick={handleSend}
                disabled={isProcessing || !input.trim()}
                size="sm"
                className="flex-shrink-0 bg-cyan-600 hover:bg-cyan-500 text-white font-semibold rounded-xl px-3"
              >
                <Send size={14} />
              </Button>

              <Button onClick={clearChat} variant="outline" size="sm" className="flex-shrink-0 border-slate-700/50 text-slate-500 hover:text-slate-300 hover:border-slate-600">
                <Trash2 size={13} />
              </Button>
              <Button onClick={saveChat} variant="outline" size="sm" className="flex-shrink-0 border-slate-700/50 text-slate-500 hover:text-slate-300 hover:border-slate-600">
                <Download size={13} />
              </Button>
            </div>
          </div>
        </div>

        {/* ── Right Sidebar: Quick Actions + System Status ──────────────── */}
        <div className="hidden xl:flex flex-col w-64 flex-shrink-0 border-l border-white/5 bg-slate-900/30 overflow-y-auto p-4 gap-5">
          {/* Quick Launch Actions */}
          <div>
            <h3 className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <Zap size={12} className="text-cyan-400" />
              Quick Actions
            </h3>
            <div className="grid grid-cols-2 gap-2">
              {[
                { label: 'Provision Client', icon: Plus, color: 'cyan' },
                { label: 'Run Workflow', icon: Workflow, color: 'blue' },
                { label: 'Agent Status', icon: Activity, color: 'green' },
                { label: 'Settings', icon: Settings, color: 'purple' },
              ].map((action) => {
                const Icon = action.icon;
                const colorMap = {
                  cyan: 'bg-cyan-500/10 border-cyan-500/30 text-cyan-300 hover:bg-cyan-500/20',
                  blue: 'bg-blue-500/10 border-blue-500/30 text-blue-300 hover:bg-blue-500/20',
                  green: 'bg-green-500/10 border-green-500/30 text-green-300 hover:bg-green-500/20',
                  purple: 'bg-purple-500/10 border-purple-500/30 text-purple-300 hover:bg-purple-500/20',
                };
                return (
                  <button
                    key={action.label}
                    onClick={() => {
                      if (action.label === 'Provision Client') setShowProvisionModal(true);
                      else if (action.label === 'Run Workflow') setShowWorkflowModal(true);
                      else if (action.label === 'Agent Status') setShowAgentStatusModal(true);
                      else if (action.label === 'Settings') setShowSettingsModal(true);
                    }}
                    className={`p-2 rounded-lg border text-[10px] font-medium transition-all cursor-pointer hover:shadow-lg flex flex-col items-center gap-1 ${colorMap[action.color as keyof typeof colorMap]}`}
                  >
                    <Icon size={13} />
                    <div className="truncate text-center leading-tight">{action.label}</div>
                  </button>
                );
              })}
            </div>
          </div>

          {/* System Metrics */}
          <div>
            <h3 className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <Activity size={12} className="text-cyan-400" />
              System Status
            </h3>
            <div className="flex flex-col gap-2 text-[11px]">
              <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 flex justify-between items-center">
                <span className="text-slate-500">Uptime SLA</span>
                <span className="text-green-400 font-semibold">99.9%</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 flex justify-between items-center">
                <span className="text-slate-500">Response</span>
                <span className="text-cyan-400 font-semibold">340ms</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 flex justify-between items-center">
                <span className="text-slate-500">Workflows</span>
                <span className="text-blue-400 font-semibold">47</span>
              </div>
              <div className="p-2 rounded-lg bg-slate-800/50 border border-slate-700/50 flex justify-between items-center">
                <span className="text-slate-500">Systems</span>
                <span className="text-purple-400 font-semibold">280+</span>
              </div>
            </div>
          </div>

          {/* Inline Sparkline: Ticket Volume (7-day) */}
          {ticketTrends?.trends && ticketTrends.trends.length > 0 && (
            <div>
              <h3 className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
                <Activity size={12} className="text-cyan-400" />
                Ticket Volume (7d)
              </h3>
              <div className="p-3 rounded-lg bg-slate-800/50 border border-slate-700/50">
                <div className="flex items-end gap-1 h-10">
                  {ticketTrends.trends.map((day: { date: string; created: number; resolved: number }, i: number) => {
                    const maxVal = Math.max(...ticketTrends.trends.map((d: { created: number }) => d.created), 1);
                    const height = Math.max(4, (day.created / maxVal) * 100);
                    return (
                      <div key={i} className="flex-1 flex flex-col items-center gap-0.5" title={`${day.date}: ${day.created} created, ${day.resolved} resolved`}>
                        <div className="w-full rounded-sm bg-cyan-500/70" style={{ height: `${height}%` }} />
                      </div>
                    );
                  })}
                </div>
                <div className="flex justify-between mt-1.5 text-[9px] text-slate-500">
                  <span>{ticketTrends.trends[0]?.date?.slice(5)}</span>
                  <span>{ticketTrends.trends[ticketTrends.trends.length - 1]?.date?.slice(5)}</span>
                </div>
                <div className="flex justify-between mt-1 text-[10px]">
                  <span className="text-cyan-400">Created: {ticketTrends.trends.reduce((s: number, d: { created: number }) => s + d.created, 0)}</span>
                  <span className="text-green-400">Resolved: {ticketTrends.trends.reduce((s: number, d: { resolved: number }) => s + d.resolved, 0)}</span>
                </div>
              </div>
            </div>
          )}

          {/* Workflow History */}
          <div>
            <h3 className="text-[11px] font-semibold text-slate-400 mb-2 flex items-center gap-1.5 uppercase tracking-wider">
              <Activity size={12} className="text-cyan-400" />
              Recent Runs
            </h3>
            <WorkflowHistoryPanel compact />
          </div>
        </div>
      </div>
      {/* Quick Action Modals */}
      <ProvisionClientModal isOpen={showProvisionModal} onClose={() => setShowProvisionModal(false)} />
      <RunWorkflowModal isOpen={showWorkflowModal} onClose={() => setShowWorkflowModal(false)} />
      <AgentStatusModal isOpen={showAgentStatusModal} onClose={() => setShowAgentStatusModal(false)} />
      <SettingsModal isOpen={showSettingsModal} onClose={() => setShowSettingsModal(false)} />
    </div>
  );
}
