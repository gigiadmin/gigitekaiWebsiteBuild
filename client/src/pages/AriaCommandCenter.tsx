/**
 * Aria Command Center — GigitekAI Main Brain
 * Live voice conversation with European woman's voice
 * Push-to-talk, animated waveform, typing indicator, Claude AI integration
 */
import { useState, useRef, useEffect, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mic, MicOff, Send, Volume2, VolumeX, Copy, Download, Trash2, Brain, Zap, Search, Activity } from "lucide-react";
import { toast } from "sonner";

// ─── Types ────────────────────────────────────────────────────────────────────

type Message = {
  id: string;
  role: "user" | "aria";
  content: string;
  sources?: string[];
  timestamp: Date;
  isVoice?: boolean;
};

type Stage = "idle" | "listening" | "transcribing" | "thinking" | "searching" | "responding";

const STAGE_LABEL: Record<Stage, string> = {
  idle: "Ready",
  listening: "Listening...",
  transcribing: "Transcribing...",
  thinking: "Thinking...",
  searching: "Searching KB...",
  responding: "Responding...",
};

// ─── European Female Voice Selector ──────────────────────────────────────────

function pickEuropeanFemaleVoice(): SpeechSynthesisVoice | null {
  if (typeof window === "undefined" || !("speechSynthesis" in window)) return null;
  const voices = window.speechSynthesis.getVoices();
  if (!voices.length) return null;

  // Priority: British English female → Irish → Australian → any female English → any English
  const priorities = [
    (v: SpeechSynthesisVoice) => /en[-_](GB|IE|AU)/i.test(v.lang) && /female|woman|fiona|kate|serena|victoria|moira|tessa/i.test(v.name),
    (v: SpeechSynthesisVoice) => /en[-_](GB|IE)/i.test(v.lang),
    (v: SpeechSynthesisVoice) => /female|woman|fiona|kate|serena|victoria|moira|tessa|zira|hazel/i.test(v.name),
    (v: SpeechSynthesisVoice) => /en/i.test(v.lang),
  ];

  for (const test of priorities) {
    const match = voices.find(test);
    if (match) return match;
  }
  return voices[0] ?? null;
}

function speakAsAria(text: string, onEnd?: () => void) {
  if (!("speechSynthesis" in window)) return;
  window.speechSynthesis.cancel();

  // Strip markdown for cleaner speech
  const clean = text
    .replace(/\*\*(.+?)\*\*/g, "$1")
    .replace(/\*(.+?)\*/g, "$1")
    .replace(/`(.+?)`/g, "$1")
    .replace(/#{1,6}\s/g, "")
    .replace(/\n{2,}/g, ". ")
    .replace(/\n/g, " ")
    .trim();

  const utterance = new SpeechSynthesisUtterance(clean);
  utterance.rate = 0.95;
  utterance.pitch = 1.05;
  utterance.volume = 1;

  // Try to set voice — voices may not be loaded yet, retry once
  const setVoice = () => {
    const voice = pickEuropeanFemaleVoice();
    if (voice) utterance.voice = voice;
  };
  setVoice();
  if (!utterance.voice) {
    window.speechSynthesis.onvoiceschanged = () => { setVoice(); };
  }

  if (onEnd) utterance.onend = onEnd;
  window.speechSynthesis.speak(utterance);
}

// ─── Animated Components ─────────────────────────────────────────────────────

function TypingDots() {
  return (
    <span className="inline-flex items-end gap-[3px]">
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

function VoiceWaveform({ active, color = "cyan" }: { active: boolean; color?: string }) {
  const heights = [3, 6, 10, 14, 10, 6, 3];
  return (
    <span className="inline-flex items-center gap-[2px]">
      {heights.map((h, i) => (
        <span
          key={i}
          className={`w-[3px] rounded-full transition-all duration-150 ${active ? `bg-${color}-400` : "bg-slate-600"}`}
          style={{
            height: active ? undefined : `${h * 0.4}px`,
            animation: active ? `aria-wave 0.7s ease-in-out ${i * 0.08}s infinite alternate` : "none",
            minHeight: "3px",
          }}
        />
      ))}
    </span>
  );
}

function StageIndicator({ stage }: { stage: Stage }) {
  if (stage === "idle") return null;
  const colors: Record<Stage, string> = {
    idle: "cyan",
    listening: "red",
    transcribing: "yellow",
    thinking: "cyan",
    searching: "blue",
    responding: "green",
  };
  const color = colors[stage];
  return (
    <div className="flex justify-start animate-[aria-fadein_0.2s_ease-out]">
      <div className={`flex items-center gap-2 bg-slate-800/80 border border-${color}-500/20 px-4 py-2.5 rounded-2xl rounded-tl-sm`}>
        <span className={`w-2 h-2 rounded-full bg-${color}-400 animate-pulse`} />
        <span className="text-xs text-slate-300 font-medium">{STAGE_LABEL[stage]}</span>
        <TypingDots />
      </div>
    </div>
  );
}

// ─── Main Component ───────────────────────────────────────────────────────────

export default function AriaCommandCenter() {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState("");
  const [stage, setStage] = useState<Stage>("idle");
  const [isRecording, setIsRecording] = useState(false);
  const [isSpeaking, setIsSpeaking] = useState(false);
  const [voiceEnabled, setVoiceEnabled] = useState(true);
  const [recordingSeconds, setRecordingSeconds] = useState(0);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const audioChunksRef = useRef<Blob[]>([]);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const recordingTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const askMutation = trpc.aria.askQuestion.useMutation();

  // Inject CSS animations once
  useEffect(() => {
    const id = "aria-styles";
    if (document.getElementById(id)) return;
    const s = document.createElement("style");
    s.id = id;
    s.textContent = `
      @keyframes aria-bounce { 0%,100%{transform:translateY(0);opacity:.5} 50%{transform:translateY(-5px);opacity:1} }
      @keyframes aria-wave { from{height:3px} to{height:18px} }
      @keyframes aria-fadein { from{opacity:0;transform:translateY(6px)} to{opacity:1;transform:translateY(0)} }
      @keyframes aria-progress { 0%{transform:translateX(-100%)} 100%{transform:translateX(250%)} }
      @keyframes aria-pulse-ring { 0%,100%{box-shadow:0 0 0 0 rgba(239,68,68,0.4)} 50%{box-shadow:0 0 0 8px rgba(239,68,68,0)} }
    `;
    document.head.appendChild(s);
  }, []);

  // Auto-scroll
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, stage]);

  // Recording timer
  useEffect(() => {
    if (isRecording) {
      setRecordingSeconds(0);
      recordingTimerRef.current = setInterval(() => setRecordingSeconds((s) => s + 1), 1000);
    } else {
      if (recordingTimerRef.current) clearInterval(recordingTimerRef.current);
    }
    return () => { if (recordingTimerRef.current) clearInterval(recordingTimerRef.current); };
  }, [isRecording]);

  const addMessage = useCallback((msg: Omit<Message, "id">) => {
    setMessages((prev) => [...prev, { ...msg, id: `${Date.now()}-${Math.random()}` }]);
  }, []);

  // ── Voice Recording ──────────────────────────────────────────────────────

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      const recorder = new MediaRecorder(stream, { mimeType: "audio/webm" });
      mediaRecorderRef.current = recorder;
      audioChunksRef.current = [];

      recorder.ondataavailable = (e) => { if (e.data.size > 0) audioChunksRef.current.push(e.data); };

      recorder.onstop = async () => {
        stream.getTracks().forEach((t) => t.stop());
        const blob = new Blob(audioChunksRef.current, { type: "audio/webm" });

        // Convert to base64
        const reader = new FileReader();
        reader.onloadend = async () => {
          const base64 = (reader.result as string).split(",")[1];
          setStage("transcribing");

          try {
            // Add placeholder user message
            const placeholderId = `voice-${Date.now()}`;
            setMessages((prev) => [
              ...prev,
              { id: placeholderId, role: "user", content: "🎤 Voice message (transcribing...)", timestamp: new Date(), isVoice: true },
            ]);

            setStage("thinking");
            const result = await askMutation.mutateAsync({
              question: "voice",
              audioBase64: base64,
              context: { systemStatus: true },
            });

            // Replace placeholder with real transcription
            setMessages((prev) =>
              prev.map((m) =>
                m.id === placeholderId
                  ? { ...m, content: `🎤 ${result.transcribedQuestion || "Voice message"}` }
                  : m
              )
            );

            setStage("responding");
            await new Promise((r) => setTimeout(r, 300));

            addMessage({ role: "aria", content: result.response, sources: result.sources, timestamp: new Date() });

            if (voiceEnabled) {
              setIsSpeaking(true);
              speakAsAria(result.response, () => setIsSpeaking(false));
            }
          } catch {
            toast.error("Voice processing failed");
          } finally {
            setStage("idle");
          }
        };
        reader.readAsDataURL(blob);
      };

      recorder.start();
      setIsRecording(true);
      setStage("listening");
    } catch {
      toast.error("Microphone access denied. Please allow microphone access.");
    }
  };

  const stopRecording = () => {
    if (mediaRecorderRef.current && isRecording) {
      mediaRecorderRef.current.stop();
      setIsRecording(false);
    }
  };

  // ── Text Query ────────────────────────────────────────────────────────────

  const handleSend = async () => {
    const q = input.trim();
    if (!q || stage !== "idle") return;
    setInput("");
    addMessage({ role: "user", content: q, timestamp: new Date() });

    setStage("thinking");
    const stageTimer = setTimeout(() => setStage("searching"), 1000);

    try {
      const result = await askMutation.mutateAsync({ question: q, context: { systemStatus: true } });
      clearTimeout(stageTimer);
      setStage("responding");
      await new Promise((r) => setTimeout(r, 300));

      addMessage({ role: "aria", content: result.response, sources: result.sources, timestamp: new Date() });

      if (voiceEnabled) {
        setIsSpeaking(true);
        speakAsAria(result.response, () => setIsSpeaking(false));
      }
    } catch {
      clearTimeout(stageTimer);
      toast.error("Aria failed to respond. Please try again.");
    } finally {
      setStage("idle");
      setTimeout(() => inputRef.current?.focus(), 100);
    }
  };

  const stopSpeaking = () => {
    window.speechSynthesis?.cancel();
    setIsSpeaking(false);
  };

  const copyMessage = (text: string) => { navigator.clipboard.writeText(text); toast.success("Copied"); };

  const saveChat = () => {
    const txt = messages.map((m) => `[${m.timestamp.toLocaleTimeString()}] ${m.role.toUpperCase()}: ${m.content}`).join("\n\n");
    const a = document.createElement("a");
    a.href = `data:text/plain;charset=utf-8,${encodeURIComponent(txt)}`;
    a.download = `aria-chat-${Date.now()}.txt`;
    a.click();
    toast.success("Chat saved");
  };

  const clearChat = () => { if (confirm("Clear all messages?")) { setMessages([]); toast.success("Chat cleared"); } };

  const isProcessing = stage !== "idle";

  return (
    <div className="min-h-screen bg-slate-950 text-white flex flex-col">
      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div className="border-b border-cyan-500/20 bg-slate-900/60 backdrop-blur px-6 py-4 flex items-center justify-between flex-shrink-0">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
            <Brain className="w-5 h-5 text-cyan-400" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-white leading-tight">Aria Command Center</h1>
            <p className="text-xs text-slate-400">GigitekAI — AI Engineer · M365 · Azure · Exchange</p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* Voice on/off toggle */}
          <button
            onClick={() => { if (isSpeaking) stopSpeaking(); setVoiceEnabled((v) => !v); }}
            className={`flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full border transition-all ${
              voiceEnabled ? "border-cyan-500/40 text-cyan-400 bg-cyan-500/10" : "border-slate-600 text-slate-500"
            }`}
            title={voiceEnabled ? "Disable Aria voice" : "Enable Aria voice"}
          >
            {voiceEnabled ? <Volume2 size={13} /> : <VolumeX size={13} />}
            {voiceEnabled ? "Voice On" : "Voice Off"}
          </button>

          {/* Status pill */}
          <div className="flex items-center gap-2 bg-slate-800/60 border border-slate-700/50 px-3 py-1.5 rounded-full">
            <span className={`w-2 h-2 rounded-full ${isProcessing ? "bg-yellow-400 animate-pulse" : isSpeaking ? "bg-green-400 animate-pulse" : "bg-cyan-400"}`} />
            <span className="text-xs text-slate-300 font-medium">
              {isSpeaking ? "Speaking..." : STAGE_LABEL[stage]}
            </span>
            {isSpeaking && (
              <button onClick={stopSpeaking} className="text-slate-500 hover:text-red-400 ml-1">
                <VolumeX size={12} />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* ── Chat Area ──────────────────────────────────────────────────── */}
      <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4 scroll-smooth">
        {messages.length === 0 && (
          <div className="flex items-center justify-center h-full min-h-[300px]">
            <div className="text-center space-y-4 max-w-md">
              <div className="w-16 h-16 rounded-full bg-cyan-500/10 border border-cyan-500/20 flex items-center justify-center mx-auto">
                <Brain className="w-8 h-8 text-cyan-400/60" />
              </div>
              <div>
                <p className="text-lg font-semibold text-slate-300">Hi, I'm Aria</p>
                <p className="text-sm text-slate-500 mt-1">Your GigitekAI Command Center engineer. Ask me anything about your environment — M365, Azure, Exchange, Teams, or any IT issue. Use voice or text.</p>
              </div>
              <div className="flex flex-wrap gap-2 justify-center">
                {["How do I create a distribution group in PowerShell?", "What's our system uptime?", "Troubleshoot Teams call quality"].map((q) => (
                  <button
                    key={q}
                    onClick={() => setInput(q)}
                    className="text-xs bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/40 text-slate-300 px-3 py-1.5 rounded-full transition-all"
                  >
                    {q}
                  </button>
                ))}
              </div>
            </div>
          </div>
        )}

        {messages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
            style={{ animation: "aria-fadein 0.25s ease-out" }}
          >
            {msg.role === "aria" && (
              <div className="w-7 h-7 rounded-full bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center flex-shrink-0 mr-2 mt-1">
                <Brain size={13} className="text-cyan-400" />
              </div>
            )}
            <div
              className={`max-w-[72%] px-4 py-3 rounded-2xl text-sm leading-relaxed ${
                msg.role === "user"
                  ? "bg-cyan-700/80 text-white rounded-tr-sm"
                  : "bg-slate-800/90 text-slate-100 border border-cyan-500/10 rounded-tl-sm"
              }`}
            >
              <p className="whitespace-pre-wrap">{msg.content}</p>

              {msg.sources && msg.sources.length > 0 && (
                <div className="mt-2 pt-2 border-t border-slate-700/50 text-xs text-slate-400 space-y-0.5">
                  <p className="font-semibold text-slate-300">Sources:</p>
                  {msg.sources.slice(0, 3).map((s, i) => <p key={i} className="truncate">• {s}</p>)}
                </div>
              )}

              <div className="mt-2 flex items-center justify-between gap-2">
                <span className="text-[10px] text-slate-500">
                  {msg.timestamp.toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })}
                  {msg.isVoice && <span className="ml-1 text-cyan-500">🎤</span>}
                </span>
                {msg.role === "aria" && (
                  <div className="flex gap-2">
                    <button
                      onClick={() => { setIsSpeaking(true); speakAsAria(msg.content, () => setIsSpeaking(false)); }}
                      className="text-slate-500 hover:text-cyan-400 transition-colors"
                      title="Read aloud"
                    >
                      <Volume2 size={12} />
                    </button>
                    <button onClick={() => copyMessage(msg.content)} className="text-slate-500 hover:text-cyan-400 transition-colors" title="Copy">
                      <Copy size={12} />
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>
        ))}

        <StageIndicator stage={stage} />
        <div ref={messagesEndRef} />
      </div>

      {/* ── Input Bar ──────────────────────────────────────────────────── */}
      <div className="border-t border-cyan-500/20 bg-slate-900/80 backdrop-blur px-6 py-4 flex-shrink-0">
        <div className="flex items-center gap-3 mb-3">
          {/* Push-to-talk mic button */}
          <button
            onMouseDown={startRecording}
            onMouseUp={stopRecording}
            onTouchStart={startRecording}
            onTouchEnd={stopRecording}
            onClick={isRecording ? stopRecording : undefined}
            disabled={isProcessing && !isRecording}
            className={`relative w-12 h-12 rounded-full flex items-center justify-center flex-shrink-0 transition-all duration-200 ${
              isRecording
                ? "bg-red-600 shadow-lg"
                : "bg-slate-800 hover:bg-slate-700 border border-cyan-500/30 hover:border-cyan-500/60"
            }`}
            style={isRecording ? { animation: "aria-pulse-ring 1.5s ease-in-out infinite" } : {}}
            title={isRecording ? "Release to send" : "Hold to speak"}
          >
            {isRecording ? (
              <div className="flex flex-col items-center gap-0.5">
                <VoiceWaveform active={true} color="red" />
                <span className="text-[9px] text-red-200 font-mono">{recordingSeconds}s</span>
              </div>
            ) : (
              <Mic size={18} className={isProcessing ? "text-slate-600" : "text-cyan-400"} />
            )}
          </button>

          {/* Text input */}
          <div className="relative flex-1">
            <Input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && !e.shiftKey && handleSend()}
              placeholder={
                isRecording ? "Release mic to send voice..." :
                isProcessing ? STAGE_LABEL[stage] :
                "Ask Aria anything... (Enter to send)"
              }
              className="bg-slate-800 border-slate-700 focus:border-cyan-500/50 text-white placeholder-slate-500 pr-4 h-11"
              disabled={isProcessing || isRecording}
            />
            {isProcessing && (
              <div className="absolute bottom-0 left-0 right-0 h-[2px] rounded-b overflow-hidden">
                <div className="h-full bg-gradient-to-r from-cyan-500 via-blue-400 to-cyan-500 w-1/2" style={{ animation: "aria-progress 1.5s ease-in-out infinite" }} />
              </div>
            )}
          </div>

          {/* Send button */}
          <Button
            onClick={handleSend}
            disabled={isProcessing || !input.trim()}
            className="h-11 w-11 p-0 bg-cyan-600 hover:bg-cyan-700 flex-shrink-0"
          >
            {isProcessing ? <Activity size={16} className="animate-pulse" /> : <Send size={16} />}
          </Button>
        </div>

        {/* Utility row */}
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[11px] text-slate-500 mr-1">Hold mic or type:</span>
          {[
            { label: "Open Tickets", q: "Show me open tickets" },
            { label: "System Status", q: "What is our system uptime?" },
            { label: "PowerShell Help", q: "How do I create a distribution group in PowerShell for Exchange Online?" },
            { label: "Teams Issue", q: "Users can't join Teams meetings, what should I check?" },
          ].map(({ label, q }) => (
            <button
              key={label}
              onClick={() => { setInput(q); inputRef.current?.focus(); }}
              disabled={isProcessing}
              className="text-[11px] bg-slate-800 hover:bg-slate-700 border border-slate-700 hover:border-cyan-500/40 text-slate-400 hover:text-slate-200 px-2.5 py-1 rounded-full transition-all disabled:opacity-40"
            >
              {label}
            </button>
          ))}
          <div className="ml-auto flex gap-1.5">
            <button onClick={saveChat} className="text-[11px] text-slate-500 hover:text-slate-300 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 transition-all">
              <Download size={11} /> Save
            </button>
            <button onClick={clearChat} className="text-[11px] text-slate-500 hover:text-red-400 flex items-center gap-1 px-2 py-1 rounded hover:bg-slate-800 transition-all">
              <Trash2 size={11} /> Clear
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
