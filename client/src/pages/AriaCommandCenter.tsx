/**
 * Aria Command Center — GigitekAI Main Brain
 * Fortune 100 quality holographic interface
 * Real-time audio volume visualization on sphere
 * Fully responsive: mobile-first
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Mic, MicOff, Send, Volume2, VolumeX, Download, Trash2,
  Brain, AlertTriangle, CheckCircle2, Clock, Zap, Terminal, Activity
} from "lucide-react";
import { toast } from "sonner";
import { Streamdown } from "streamdown";

type Message = {
  id: string;
  role: "user" | "aria";
  content: string;
  timestamp: Date;
  isVoice?: boolean;
};

type Stage = "idle" | "listening" | "transcribing" | "thinking" | "searching" | "responding";

const STAGE_LABEL: Record<Stage, string> = {
  idle: "Ready",
  listening: "Listening...",
  transcribing: "Transcribing...",
  thinking: "Thinking...",
  searching: "Searching...",
  responding: "Responding...",
};

/* ─── Voice helpers ─────────────────────────────────────────────────────── */
// Cache voice to prevent switching mid-speech
let cachedVoice: SpeechSynthesisVoice | null = null;

function pickVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  if (cachedVoice) return cachedVoice;
  
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;
  
  // PRIORITY 1: GB/IE English FEMALE voices (explicit female match)
  const gbFemale = voices.find(v => 
    /en[-_](GB|IE)/i.test(v.lang) && 
    /female|woman|fiona|kate|serena|victoria|moira|tessa|google uk|neural2-a|standard-a/i.test(v.name) &&
    !/male|man|david|george|james|mark|paul|brian/i.test(v.name)
  );
  if (gbFemale) { cachedVoice = gbFemale; return gbFemale; }
  
  // PRIORITY 2: Any FEMALE voice (explicit female match, any language)
  const anyFemale = voices.find(v => 
    /female|woman|fiona|kate|serena|victoria|moira|tessa|zira|hazel|cortana|samantha/i.test(v.name) &&
    !/male|man|david|george|james|mark|paul|brian|cortana-male/i.test(v.name)
  );
  if (anyFemale) { cachedVoice = anyFemale; return anyFemale; }
  
  // PRIORITY 3: GB/IE English (any gender, but prefer female)
  const gbAny = voices.find(v => /en[-_](GB|IE)/i.test(v.lang));
  if (gbAny) { cachedVoice = gbAny; return gbAny; }
  
  // PRIORITY 4: Any English voice
  const anyEnglish = voices.find(v => /en/i.test(v.lang));
  if (anyEnglish) { cachedVoice = anyEnglish; return anyEnglish; }
  
  // Last resort
  cachedVoice = voices[0] ?? null;
  return cachedVoice;
}

function speakAsAria(text: string, speed: number = 0.95, onEnd?: () => void) {
  if (!text || !("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();
  const clean = text
    .replace(/\*\*(.+?)\*\*/g, "$1").replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1").replace(/#{1,6}\s/g, "")
    .replace(/\n{2,}/g, ". ").replace(/\n/g, " ").trim();
  const u = new SpeechSynthesisUtterance(clean);
  u.rate = Math.max(0.5, Math.min(2, speed));
  u.pitch = 1.05; u.volume = 1;
  const setVoice = () => { const v = pickVoice(); if (v) u.voice = v; };
  setVoice();
  if (!u.voice) window.speechSynthesis.onvoiceschanged = setVoice;
  if (onEnd) u.onend = onEnd;
  window.speechSynthesis.speak(u);
}

function stopSpeaking() {
  if ("speechSynthesis" in window) {
    window.speechSynthesis.pause();
    window.speechSynthesis.cancel();
    // Force a small delay to ensure cancel takes effect
    setTimeout(() => {
      if (window.speechSynthesis.speaking) {
        window.speechSynthesis.cancel();
      }
    }, 50);
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

function HolographicSphere({ isActive, volume = 0, stage = "idle" }: { isActive: boolean; volume: number; stage: Stage }) {
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
      <div
        className="absolute left-0 right-0 flex justify-center"
        style={{ bottom: 8 }}
      >
        <span className={`text-xs font-mono tracking-widest uppercase transition-colors duration-500 ${c.label}`}>
          {c.labelText}
        </span>
      </div>
    </div>
  );
}

/* ─── Typing indicator ───────────────────────────────────────────────────── */
function TypingDots() {
  return (
    <span className="inline-flex items-end gap-[3px] ml-1">
      {[0, 1, 2].map((i) => (
        <span
          key={i}
          className="w-[5px] h-[5px] rounded-full bg-cyan-400 inline-block"
          style={{ animation: `aria-bounce 1.2s ease-in-out ${i * 0.2}s infinite` }}
        />
      ))}
    </span>
  );
}

/* ─── System Status Box ──────────────────────────────────────────────────── */
function StatusBox({
  icon: Icon, label, value, status, onClick,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  status: "ok" | "warn" | "info";
  onClick: () => void;
}) {
  const colors = {
    ok:   { border: "border-emerald-500/40", bg: "bg-emerald-500/10 hover:bg-emerald-500/20", icon: "text-emerald-400", val: "text-emerald-300" },
    warn: { border: "border-amber-500/50",   bg: "bg-amber-500/10  hover:bg-amber-500/20",   icon: "text-amber-400",   val: "text-amber-300"   },
    info: { border: "border-cyan-500/40",    bg: "bg-cyan-500/10   hover:bg-cyan-500/20",    icon: "text-cyan-400",    val: "text-cyan-300"    },
  }[status];

  return (
    <button
      onClick={onClick}
      className={`group flex flex-col gap-1.5 p-3 rounded-xl border ${colors.border} ${colors.bg} transition-all duration-200 text-left w-full cursor-pointer`}
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

export default function AriaCommandCenter() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [audioVolume, setAudioVolume] = useState(0);
  const [ttsSpeed, setTtsSpeed] = useState(0.95);
  const [ttsMode, setTtsMode] = useState<'voice' | 'text' | 'both'>('both');

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const analyzerRef = useRef<AnalyserNode | null>(null);
  const rafRef = useRef<number | null>(null);

  const askMutation = trpc.aria.askQuestion.useMutation();

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
    `;
    document.head.appendChild(s);
  }, []);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stage]);

  const addMessage = useCallback((msg: Omit<Message, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: `${Date.now()}-${Math.random()}` }]);
  }, []);

  /* Audio volume analysis */
  const analyzeVolume = useCallback(() => {
    if (!analyzerRef.current) return;
    const data = new Uint8Array(analyzerRef.current.frequencyBinCount);
    analyzerRef.current.getByteFrequencyData(data);
    let sum = 0;
    for (let i = 0; i < data.length; i++) sum += data[i] * data[i];
    setAudioVolume(Math.min(Math.sqrt(sum / data.length) / 128, 1));
    rafRef.current = requestAnimationFrame(analyzeVolume);
  }, []);

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
        setAudioVolume(0);

        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];
          setStage("transcribing");
          const placeholderId = `voice-${Date.now()}`;
          setMessages((prev) => [...prev, { id: placeholderId, role: "user", content: "🎤 Voice message (transcribing...)", timestamp: new Date(), isVoice: true }]);
          setStage("thinking");
          try {
            const result = await askMutation.mutateAsync({ question: "voice", audioBase64: base64, context: { systemStatus: true } });
            setMessages((prev) => prev.map((m) => m.id === placeholderId ? { ...m, content: `🎤 ${result.transcribedQuestion || "Voice message"}` } : m));
            setStage("responding");
            await new Promise((r) => setTimeout(r, 200));
            addMessage({ role: "aria", content: result.response, timestamp: new Date() });
            if ((ttsMode === 'voice' || ttsMode === 'both') && voiceEnabled) { setIsSpeaking(true); speakAsAria(result.response, ttsSpeed, () => setIsSpeaking(false)); }
          } catch { toast.error("Voice processing failed"); }
          finally { setStage("idle"); }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecording(true);
      setStage("listening");
      rafRef.current = requestAnimationFrame(analyzeVolume);
    } catch { toast.error("Microphone access denied"); }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
      if (rafRef.current) { cancelAnimationFrame(rafRef.current); rafRef.current = null; }
      setAudioVolume(0);
    }
  };

  const handleSend = async () => {
    const q = input.trim();
    if (!q || stage !== "idle") return;
    setInput("");
    addMessage({ role: "user", content: q, timestamp: new Date() });
    setStage("thinking");
    const timer = setTimeout(() => setStage("searching"), 1200);
    try {
      const result = await askMutation.mutateAsync({ question: q, context: { systemStatus: true } });
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

  const stopSpeaking = () => { window.speechSynthesis?.cancel(); setIsSpeaking(false); };
  const saveChat = () => {
    const txt = messages.map((m) => `[${m.timestamp.toLocaleTimeString()}] ${m.role.toUpperCase()}:\n${m.content}`).join("\n\n---\n\n");
    const a = document.createElement("a");
    a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(txt)}`;
    a.download = `aria-${new Date().toISOString().slice(0, 10)}.txt`;
    a.click();
    toast.success("Chat saved");
  };
  const clearChat = useCallback(() => {
    if (typeof window === "undefined") return;
    if (confirm("Clear all messages?")) {
      setMessages([]);
      try {
        localStorage.removeItem(ARIA_CHAT_STORAGE_KEY);
      } catch (e) {
        console.error("Failed to clear chat history:", e);
      }
      toast.success("Chat cleared");
    }
  }, []);

  useEffect(() => () => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
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

      {/* ── Top Bar ──────────────────────────────────────────────────────── */}
      <div className="flex-shrink-0 flex items-center justify-between px-4 sm:px-6 py-3 border-b border-white/5 bg-slate-900/80 backdrop-blur-md">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-cyan-500/15 border border-cyan-500/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-base font-bold text-white leading-none">Aria Command Center</h1>
            <p className="text-[11px] text-slate-500 mt-0.5">GigitekAI · M365 · Azure · Exchange</p>
          </div>
        </div>
        <div className="flex items-center gap-2 flex-wrap">
          {/* TTS Mode Selector */}
          <select value={ttsMode} onChange={(e) => setTtsMode(e.target.value as any)} className="text-xs px-2 py-1 rounded-full border border-slate-700 bg-slate-800/50 text-slate-300 hover:border-cyan-500/40 transition-all" title="Choose how Aria responds">
            <option value="both">Voice + Text</option>
            <option value="voice">Voice Only</option>
            <option value="text">Text Only</option>
          </select>
          
          {/* TTS Speed Control */}
          {(ttsMode === 'voice' || ttsMode === 'both') && (
            <div className="flex items-center gap-1 px-2 py-1 rounded-full border border-slate-700 bg-slate-800/50">
              <span className="text-[10px] text-slate-500">Speed:</span>
              <input type="range" min="0.5" max="2" step="0.25" value={ttsSpeed} onChange={(e) => setTtsSpeed(parseFloat(e.target.value))} className="w-12 h-1 bg-slate-700 rounded cursor-pointer" title="Adjust speech speed" />
              <span className="text-[10px] text-slate-400 w-6 text-right">{ttsSpeed.toFixed(2)}x</span>
            </div>
          )}
          
          <button
            onClick={() => { if (isSpeaking) stopSpeaking(); setVoiceEnabled((v) => !v); }}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
              voiceEnabled ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10" : "border-slate-700 text-slate-500 bg-slate-800/50"
            }`}
          >
            {voiceEnabled ? <Volume2 size={12} /> : <VolumeX size={12} />}
            <span className="hidden sm:inline text-[11px] font-medium">{voiceEnabled ? "Voice On" : "Voice Off"}</span>
          </button>
          <div className={`flex items-center gap-2 px-3 py-1.5 rounded-full border text-[11px] font-medium transition-all ${
            isProcessing ? "border-amber-500/40 bg-amber-500/10 text-amber-300" :
            isSpeaking   ? "border-emerald-500/40 bg-emerald-500/10 text-emerald-300" :
                           "border-slate-700 bg-slate-800/50 text-slate-400"
          }`}>
            <span className={`w-1.5 h-1.5 rounded-full ${
              isProcessing ? "bg-amber-400 animate-pulse" :
              isSpeaking   ? "bg-emerald-400 animate-pulse" :
                             "bg-cyan-500"
            }`} />
            <span className="hidden sm:inline">{isSpeaking ? "Speaking..." : STAGE_LABEL[stage]}</span>
            {isSpeaking && (
              <button onClick={stopSpeaking} className="text-slate-500 hover:text-red-400 ml-0.5">
                <VolumeX size={11} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Main Layout ──────────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col lg:flex-row min-h-0 overflow-hidden">

        {/* ── Left Panel: Sphere + Status Grid — scrollable on mobile ─────── */}
        <div className="flex flex-col items-center gap-4 px-4 sm:px-6 py-4 lg:py-6 lg:w-80 xl:w-96 flex-shrink-0 border-b lg:border-b-0 lg:border-r border-white/5 overflow-y-auto lg:overflow-hidden">
          {/* Sphere */}
          <div className="flex-shrink-0">
            <HolographicSphere isActive={isActive} volume={audioVolume} stage={stage} />
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
          <div className="flex-1 overflow-y-auto px-4 sm:px-6 py-4 space-y-3" style={{ overscrollBehavior: 'contain' }}>
            {messages.length === 0 ? (
              <div className="flex flex-col items-center justify-center h-full gap-3 text-center py-12">
                <Activity className="w-8 h-8 text-cyan-500/40" />
                <p className="text-slate-500 text-sm">Ask Aria anything — tickets, M365, Azure, PowerShell...</p>
                <p className="text-slate-600 text-xs">Click a status box or type below to get started</p>
              </div>
            ) : (
              <>
                {messages.map((msg) => (
                  <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                    {msg.role === "aria" && (
                      <div className="w-6 h-6 rounded-full bg-cyan-500/20 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 mr-2 mt-0.5">
                        <Brain size={12} className="text-cyan-400" />
                      </div>
                    )}
                    <div className={`max-w-[85%] sm:max-w-[75%] rounded-2xl px-4 py-3 text-sm ${
                      msg.role === "user"
                        ? "bg-cyan-600/20 border border-cyan-500/30 text-white rounded-tr-sm"
                        : "bg-slate-800/70 border border-white/5 text-slate-100 rounded-tl-sm"
                    }`}>
                      {msg.role === "aria" ? (
                        <div className="prose prose-sm prose-invert max-w-none
                          [&>p]:my-1.5 [&>ul]:my-1.5 [&>ol]:my-1.5 [&>li]:my-0.5
                          [&>h1]:text-base [&>h2]:text-sm [&>h3]:text-sm
                          [&>pre]:bg-slate-900 [&>pre]:rounded-lg [&>pre]:p-3 [&>pre]:my-2 [&>pre]:overflow-x-auto
                          [&>code]:bg-slate-900 [&>code]:px-1.5 [&>code]:py-0.5 [&>code]:rounded [&>code]:text-cyan-300 [&>code]:text-xs
                          [&>strong]:text-white [&>a]:text-cyan-400">
                          <Streamdown>{msg.content}</Streamdown>
                        </div>
                      ) : (
                        <p className="leading-relaxed">{msg.content}</p>
                      )}
                      <p className="text-[10px] text-slate-500 mt-2 text-right">
                        {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                      </p>
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

          {/* Input Bar */}
          <div className="flex-shrink-0 border-t border-white/5 bg-slate-900/60 backdrop-blur px-4 sm:px-6 py-3 sm:py-4" style={{ paddingBottom: 'max(0.75rem, env(safe-area-inset-bottom, 0.75rem))' }}>
            <div className="flex items-center gap-2">
              <Button
                onClick={isRecording ? stopRecording : startRecording}
                variant="outline"
                size="sm"
                className={`flex-shrink-0 transition-all ${
                  isRecording
                    ? "bg-red-500/20 border-red-500/60 text-red-400 hover:bg-red-500/30"
                    : "border-cyan-500/30 text-cyan-400 hover:border-cyan-400 hover:bg-cyan-500/10"
                }`}
              >
                {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
                <span className="ml-1.5 text-xs hidden sm:inline">{isRecording ? "Stop" : "Voice"}</span>
              </Button>

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
      </div>
    </div>
  );
}
